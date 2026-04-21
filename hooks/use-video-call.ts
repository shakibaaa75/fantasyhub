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

// Type guard for usable peer connection
function isPCUsable(pc: RTCPeerConnection | null): pc is RTCPeerConnection {
  if (!pc) return false;
  return pc.connectionState !== 'closed' && 
         pc.connectionState !== 'failed' &&
         pc.signalingState !== 'closed';
}

// Get TURN server config
function getIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ];

  const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
  const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME;
  const turnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

  if (turnUrl && turnUsername && turnCredential) {
    servers.push({
      urls: turnUrl,
      username: turnUsername,
      credential: turnCredential,
    });
  } else {
    console.warn('[VideoCall] Using free TURN server - replace for production');
    servers.push({
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    });
    servers.push({
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    });
  }

  return servers;
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
  const iceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  
  // CRITICAL: Track if component is mounted - initialize to true
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Track call ID to handle Strict Mode double-mount
  const callIdRef = useRef(0);

  // Reset mounted flag on actual mount
  useEffect(() => {
    console.log('[VideoCall] Component mounted');
    isMountedRef.current = true;
    
    return () => {
      console.log('[VideoCall] Component unmounting (cleanup)');
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Comprehensive cleanup
  const cleanup = useCallback(() => {
    console.log('[VideoCall] Cleaning up resources...');
    
    // Abort any pending async operations
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Clear connection timeout
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }

    // Remove signaling listeners
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    // Stop all tracks
    if (state.localStream) {
      state.localStream.getTracks().forEach(track => {
        track.stop();
        console.log(`[VideoCall] Stopped local track: ${track.kind}`);
      });
    }

    // Close peer connection
    const pc = pcRef.current;
    if (pc) {
      pc.ontrack = null;
      pc.onicecandidate = null;
      pc.oniceconnectionstatechange = null;
      pc.onconnectionstatechange = null;
      pc.onsignalingstatechange = null;
      pc.onicegatheringstatechange = null;
      pc.onnegotiationneeded = null;
      
      try {
        pc.close();
        console.log('[VideoCall] PeerConnection closed');
      } catch (err) {
        console.error('[VideoCall] Error closing PC:', err);
      }
      pcRef.current = null;
    }

    // Clear ICE candidates queue
    iceCandidatesRef.current = [];

    // Reset state
    setState({
      isConnected: false,
      isConnecting: false,
      localStream: null,
      remoteStream: null,
      isVideoEnabled: true,
      isAudioEnabled: true,
      error: null,
    });

    reconnectAttemptsRef.current = 0;
  }, [state.localStream]);

  // Initialize WebRTC connection
  const startCall = useCallback(async (isInitiator: boolean) => {
    // Increment call ID to handle stale async operations
    const thisCallId = ++callIdRef.current;
    console.log(`[VideoCall] startCall #${thisCallId} as ${isInitiator ? 'initiator' : 'answerer'}`);
    
    // Prevent double-start
    if (isStartingRef.current) {
      console.log('[VideoCall] Already starting, ignoring duplicate call');
      return;
    }

    // Clean up any existing connection
    if (pcRef.current) {
      console.log('[VideoCall] Cleaning up existing connection before starting');
      cleanup();
    }

    // Create new abort controller for this call
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    isStartingRef.current = true;
    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    let pc: RTCPeerConnection | null = null;
    let stream: MediaStream | null = null;

    try {
      // Check if aborted before starting
      if (signal.aborted) {
        throw new Error('Call aborted before start');
      }

      // ========== STEP 1: Create PeerConnection ==========
      pc = new RTCPeerConnection({
        iceServers: getIceServers(),
        iceTransportPolicy: 'all',
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require',
      });

      pcRef.current = pc;
      console.log(`[VideoCall #${thisCallId}] PeerConnection created`);

      // ========== STEP 2: Set up event handlers ==========
      
      pc.ontrack = (event) => {
        if (callIdRef.current !== thisCallId) {
          console.log(`[VideoCall #${thisCallId}] Stale ontrack, ignoring`);
          return;
        }
        if (!isMountedRef.current) return;
        
        console.log(`[VideoCall #${thisCallId}] Received remote track:`, event.track.kind);
        const [remoteStream] = event.streams;
        if (remoteStream) {
          console.log(`[VideoCall #${thisCallId}] Setting remote stream`);
          setState(prev => ({ ...prev, remoteStream }));
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().catch(e => console.warn('[VideoCall] Remote play failed:', e));
          }
        }
      };

      pc.onicecandidate = (event) => {
        if (callIdRef.current !== thisCallId) return;
        if (!isMountedRef.current) return;
        
        if (event.candidate) {
          const candidate = event.candidate.toJSON();
          console.log(`[VideoCall #${thisCallId}] ICE candidate generated`);
          
          if (pc!.signalingState === 'stable' || pc!.signalingState === 'have-local-offer') {
            wsService.sendIceCandidate(candidate);
          } else {
            iceCandidatesRef.current.push(candidate);
          }
        } else {
          console.log(`[VideoCall #${thisCallId}] ICE gathering complete`);
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (callIdRef.current !== thisCallId) return;
        if (!isMountedRef.current) return;
        
        console.log(`[VideoCall #${thisCallId}] ICE connection state:`, pc!.iceConnectionState);
        
        if (pc!.iceConnectionState === 'connected' || pc!.iceConnectionState === 'completed') {
          setState(prev => ({ ...prev, isConnecting: false }));
        } else if (pc!.iceConnectionState === 'failed') {
          console.error(`[VideoCall #${thisCallId}] ICE connection failed`);
          if (isPCUsable(pc) && reconnectAttemptsRef.current < 3) {
            reconnectAttemptsRef.current++;
            pc!.restartIce();
          }
        }
      };

      pc.onconnectionstatechange = () => {
        if (callIdRef.current !== thisCallId) return;
        if (!isMountedRef.current) return;
        
        console.log(`[VideoCall #${thisCallId}] Connection state:`, pc!.connectionState);
        
        if (pc!.connectionState === 'connected') {
          setState(prev => ({ ...prev, isConnected: true, isConnecting: false, error: null }));
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
          }
        } else if (pc!.connectionState === 'failed') {
          setState(prev => ({ ...prev, isConnected: false, isConnecting: false, error: 'Connection failed' }));
        }
      };

      pc.onsignalingstatechange = () => {
        if (callIdRef.current !== thisCallId) return;
        console.log(`[VideoCall #${thisCallId}] Signaling state:`, pc!.signalingState);
      };

      // ========== STEP 3: Get local media ==========
      console.log(`[VideoCall #${thisCallId}] Requesting media devices...`);
      
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch (mediaErr) {
        console.error(`[VideoCall #${thisCallId}] Media access failed:`, mediaErr);
        throw new Error(`Camera/microphone access denied: ${(mediaErr as Error).message}`);
      }

      // CRITICAL: Check if this call is still the active one
      if (callIdRef.current !== thisCallId) {
        console.log(`[VideoCall #${thisCallId}] Stale call after media, cleaning up`);
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      // Check if aborted or unmounted while waiting for media
      if (signal.aborted || !isMountedRef.current) {
        console.log(`[VideoCall #${thisCallId}] Aborted/unmounted after getting media, cleaning up`);
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      // Check if PC is still alive
      if (!isPCUsable(pc)) {
        stream.getTracks().forEach(track => track.stop());
        throw new Error('PeerConnection closed while waiting for media');
      }

      console.log(`[VideoCall #${thisCallId}] Local media obtained:`, 
        stream.getVideoTracks().length, 'video,',
        stream.getAudioTracks().length, 'audio'
      );

      setState(prev => ({ ...prev, localStream: stream }));

      // Attach to local video element
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        await localVideoRef.current.play().catch(e => console.warn('[VideoCall] Local play failed:', e));
      }

      // Check again before adding tracks
      if (callIdRef.current !== thisCallId || signal.aborted || !isMountedRef.current || !isPCUsable(pc)) {
        console.log(`[VideoCall #${thisCallId}] Aborted before adding tracks`);
        return;
      }

      // Add tracks to peer connection
      stream.getTracks().forEach(track => {
        if (isPCUsable(pc)) {
          pc!.addTrack(track, stream!);
          console.log(`[VideoCall #${thisCallId}] Added local track: ${track.kind}`);
        }
      });

      // ========== STEP 4: Set up signaling handlers ==========
      const handleOffer = async (data: RTCSessionDescriptionInit) => {
        if (callIdRef.current !== thisCallId) return;
        if (!isMountedRef.current || !isPCUsable(pc)) return;
        
        console.log(`[VideoCall #${thisCallId}] Received offer`);
        try {
          await pc!.setRemoteDescription(new RTCSessionDescription(data));
          const answer = await pc!.createAnswer();
          await pc!.setLocalDescription(answer);
          wsService.sendAnswer(answer);
          
          iceCandidatesRef.current.forEach(c => wsService.sendIceCandidate(c));
          iceCandidatesRef.current = [];
        } catch (err) {
          console.error(`[VideoCall #${thisCallId}] Error handling offer:`, err);
        }
      };

      const handleAnswer = async (data: RTCSessionDescriptionInit) => {
        if (callIdRef.current !== thisCallId) return;
        if (!isMountedRef.current || !isPCUsable(pc)) return;
        
        console.log(`[VideoCall #${thisCallId}] Received answer`);
        try {
          await pc!.setRemoteDescription(new RTCSessionDescription(data));
          iceCandidatesRef.current.forEach(c => wsService.sendIceCandidate(c));
          iceCandidatesRef.current = [];
        } catch (err) {
          console.error(`[VideoCall #${thisCallId}] Error handling answer:`, err);
        }
      };

      const handleIceCandidate = async (data: RTCIceCandidateInit) => {
        if (callIdRef.current !== thisCallId) return;
        if (!isMountedRef.current || !isPCUsable(pc)) return;
        
        try {
          await pc!.addIceCandidate(new RTCIceCandidate(data));
        } catch (err) {
          console.error(`[VideoCall #${thisCallId}] Error adding remote ICE candidate:`, err);
        }
      };

      wsService.on('offer', handleOffer);
      wsService.on('answer', handleAnswer);
      wsService.on('ice_candidate', handleIceCandidate);

      cleanupRef.current = () => {
        wsService.off('offer', handleOffer);
        wsService.off('answer', handleAnswer);
        wsService.off('ice_candidate', handleIceCandidate);
      };

      // Check again before creating offer
      if (callIdRef.current !== thisCallId || signal.aborted || !isMountedRef.current || !isPCUsable(pc)) {
        console.log(`[VideoCall #${thisCallId}] Aborted before offer/ready`);
        return;
      }

      // ========== STEP 5: Create offer if initiator ==========
      if (isInitiator) {
        console.log(`[VideoCall #${thisCallId}] Creating offer...`);
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        
        await pc.setLocalDescription(offer);
        wsService.sendOffer(offer);
        
        iceCandidatesRef.current.forEach(c => wsService.sendIceCandidate(c));
        iceCandidatesRef.current = [];
      }

      // ========== STEP 6: Notify server ==========
      wsService.sendVideoReady();
      console.log(`[VideoCall #${thisCallId}] Video ready signal sent`);

      // Set connection timeout
      connectionTimeoutRef.current = setTimeout(() => {
        if (callIdRef.current === thisCallId && isMountedRef.current && !state.isConnected) {
          console.warn(`[VideoCall #${thisCallId}] Connection timeout`);
          setState(prev => ({ ...prev, error: 'Connection timeout. Please try again.' }));
        }
      }, 30000);

    } catch (err: any) {
      console.error(`[VideoCall #${thisCallId}] Start call error:`, err);
      
      // Only update state if this is still the active call
      if (callIdRef.current === thisCallId && isMountedRef.current) {
        setState(prev => ({
          ...prev,
          isConnecting: false,
          error: err.message || 'Failed to start video call',
        }));
      }
      
      // Clean up on error
      if (pc) {
        try { pc.close(); } catch {}
        pcRef.current = null;
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    } finally {
      if (callIdRef.current === thisCallId) {
        isStartingRef.current = false;
      }
    }
  }, [cleanup, state.isConnected]);

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
    console.log('[VideoCall] Ending call');
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