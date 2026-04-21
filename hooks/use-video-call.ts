'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { wsService } from '@/lib/websocket-service';

export interface VideoCallState {
  isConnected: boolean;
  isConnecting: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  error: string | null;
}

// Guard: check if peer connection is usable (not closed)
function isPCUsable(pc: RTCPeerConnection | null): pc is RTCPeerConnection {
  return pc !== null && pc.connectionState !== 'closed' && pc.signalingState !== 'closed';
}

export function useVideoCall() {
  const [state, setState] = useState<VideoCallState>({
    isConnected: false,
    isConnecting: false,
    localStream: null,
    remoteStream: null,
    isVideoEnabled: true,
    isAudioEnabled: true,
    error: null,
  });

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const isStartingRef = useRef(false);

  // Cleanup function
  const cleanup = useCallback(() => {
    // Remove signaling listeners first
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    // Stop all tracks
    if (state.localStream) {
      state.localStream.getTracks().forEach(track => track.stop());
    }

    // Close peer connection
    const pc = pcRef.current;
    if (pc) {
      pc.ontrack = null;
      pc.onicecandidate = null;
      pc.onconnectionstatechange = null;
      pc.oniceconnectionstatechange = null;
      try {
        pc.close();
      } catch {
        // Ignore close errors
      }
      pcRef.current = null;
    }

    setState({
      isConnected: false,
      isConnecting: false,
      localStream: null,
      remoteStream: null,
      isVideoEnabled: true,
      isAudioEnabled: true,
      error: null,
    });
  }, [state.localStream]);

  // Initialize WebRTC connection
  const startCall = useCallback(async (isInitiator: boolean) => {
    // Prevent double-start
    if (isStartingRef.current) {
      console.log('[VideoCall] Already starting, ignoring duplicate call');
      return;
    }
    if (pcRef.current) {
      console.log('[VideoCall] Already have peer connection, cleaning up first');
      cleanup();
    }

    isStartingRef.current = true;
    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    let pc: RTCPeerConnection | null = null;
    let stream: MediaStream | null = null;

    try {
      // Create peer connection FIRST before getting media
      pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });

      pcRef.current = pc;

      // Set up remote stream handler BEFORE adding tracks
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        setState(prev => ({ ...prev, remoteStream }));
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      };

      // Set up ICE candidate handler
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          wsService.sendIceCandidate(event.candidate.toJSON());
        }
      };

      // Connection state changes
      pc.onconnectionstatechange = () => {
        console.log('[VideoCall] Connection state:', pc!.connectionState);
        if (pc!.connectionState === 'connected') {
          setState(prev => ({ ...prev, isConnected: true, isConnecting: false }));
        } else if (pc!.connectionState === 'failed' || pc!.connectionState === 'disconnected' || pc!.connectionState === 'closed') {
          setState(prev => ({ ...prev, isConnected: false, isConnecting: false }));
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log('[VideoCall] ICE state:', pc!.iceConnectionState);
      };

      // NOW get local media — after PC is fully set up
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      });

      // Check PC is still alive using the guard function
      if (!isPCUsable(pc)) {
        throw new Error('PeerConnection was closed before tracks could be added');
      }

      setState(prev => ({ ...prev, localStream: stream }));

      // Attach to local video element
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Add tracks to peer connection
      stream.getTracks().forEach(track => {
        if (isPCUsable(pc)) {
          pc.addTrack(track, stream!);
        }
      });

      // Set up signaling message handlers
      const handleOffer = async (data: RTCSessionDescriptionInit) => {
        if (!isPCUsable(pc)) return;
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          wsService.sendAnswer(answer);
        } catch (err) {
          console.error('[VideoCall] Error handling offer:', err);
        }
      };

      const handleAnswer = async (data: RTCSessionDescriptionInit) => {
        if (!isPCUsable(pc)) return;
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data));
        } catch (err) {
          console.error('[VideoCall] Error handling answer:', err);
        }
      };

      const handleIceCandidate = async (data: RTCIceCandidateInit) => {
        if (!isPCUsable(pc)) return;
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data));
        } catch (err) {
          console.error('[VideoCall] Error adding ICE candidate:', err);
        }
      };

      wsService.on('offer', handleOffer);
      wsService.on('answer', handleAnswer);
      wsService.on('ice_candidate', handleIceCandidate);

      // Store cleanup function
      cleanupRef.current = () => {
        wsService.off('offer', handleOffer);
        wsService.off('answer', handleAnswer);
        wsService.off('ice_candidate', handleIceCandidate);
      };

      // If initiator, create and send offer
      if (isInitiator) {
        if (!isPCUsable(pc)) {
          throw new Error('PeerConnection closed before offer creation');
        }
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        wsService.sendOffer(offer);
      }

      // Notify server we're ready
      wsService.sendVideoReady();

    } catch (err: any) {
      console.error('[VideoCall] Start call error:', err);
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: err.message || 'Failed to start video call',
      }));
      // Clean up on error
      cleanup();
    } finally {
      isStartingRef.current = false;
    }
  }, [cleanup]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    const newEnabled = !state.isVideoEnabled;
    state.localStream?.getVideoTracks().forEach(track => {
      track.enabled = newEnabled;
    });
    setState(prev => ({ ...prev, isVideoEnabled: newEnabled }));
    wsService.sendVideoToggle(newEnabled);
  }, [state.isVideoEnabled, state.localStream]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    const newEnabled = !state.isAudioEnabled;
    state.localStream?.getAudioTracks().forEach(track => {
      track.enabled = newEnabled;
    });
    setState(prev => ({ ...prev, isAudioEnabled: newEnabled }));
    wsService.sendAudioToggle(newEnabled);
  }, [state.isAudioEnabled, state.localStream]);

  // End call
  const endCall = useCallback(() => {
    wsService.sendEndCall();
    cleanup();
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    ...state,
    localVideoRef,
    remoteVideoRef,
    startCall,
    toggleVideo,
    toggleAudio,
    endCall,
  };
}