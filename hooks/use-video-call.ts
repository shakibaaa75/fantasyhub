'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { wsService } from '@/lib/websocket-service';

export interface VideoCallState {
  isConnected: boolean;
  isConnecting: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  error: string | null;
  debugStatus: string;
}

export interface UseVideoCallReturn extends VideoCallState {
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
  startCall: (isInitiator: boolean) => Promise<void>;
  toggleVideo: () => void;
  toggleAudio: () => void;
  endCall: () => void;
}

function isPCUsable(pc: RTCPeerConnection | null): pc is RTCPeerConnection {
  return pc !== null && pc.connectionState !== 'closed';
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
];

export function useVideoCall(): UseVideoCallReturn {
  const [state, setState] = useState<VideoCallState>({
    isConnected: false,
    isConnecting: false,
    localStream: null,
    remoteStream: null,
    isVideoEnabled: true,
    isAudioEnabled: true,
    error: null,
    debugStatus: 'idle',
  });

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // This flag is set to true when the component unmounts.
  // startCall checks it after every await to abort cleanly.
  const destroyedRef = useRef(false);

  // Whether a startCall is actively running (prevents double-start)
  const isStartingRef = useRef(false);

  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const remoteDescSetRef = useRef(false);

  const dbg = useCallback((msg: string) => {
    console.log(`[VideoCall] ${msg}`);
    setState(prev => ({ ...prev, debugStatus: msg }));
  }, []);

  const attachToEl = useCallback((el: HTMLVideoElement | null, stream: MediaStream | null) => {
    if (!el || !stream) return;
    console.log('[VideoCall] attaching stream, tracks:', stream.getTracks().map(t => `${t.kind}:${t.readyState}`).join(', '));
    el.srcObject = stream;
    el.play().catch(e => console.warn('[VideoCall] play() blocked:', e.message));
  }, []);

  // Full teardown — stops tracks, closes PC, removes WS listeners
  const teardown = useCallback(() => {
    console.log('[VideoCall] teardown()');

    cleanupRef.current?.();
    cleanupRef.current = null;

    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    const pc = pcRef.current;
    if (pc) {
      pc.ontrack = null;
      pc.onicecandidate = null;
      pc.onconnectionstatechange = null;
      pc.oniceconnectionstatechange = null;
      pc.onsignalingstatechange = null;
      try { pc.close(); } catch { /* ignore */ }
      pcRef.current = null;
    }

    pendingIceCandidatesRef.current = [];
    remoteDescSetRef.current = false;
    isStartingRef.current = false;
  }, []);

  // Reset visible state (separate from teardown so we can call them independently)
  const resetState = useCallback(() => {
    setState({
      isConnected: false,
      isConnecting: false,
      localStream: null,
      remoteStream: null,
      isVideoEnabled: true,
      isAudioEnabled: true,
      error: null,
      debugStatus: 'idle',
    });
  }, []);

  // Re-attach streams when video elements mount after stream is already available
  useEffect(() => {
    if (state.localStream) attachToEl(localVideoRef.current, state.localStream);
  }, [state.localStream, attachToEl]);

  useEffect(() => {
    if (state.remoteStream) attachToEl(remoteVideoRef.current, state.remoteStream);
  }, [state.remoteStream, attachToEl]);

  const startCall = useCallback(async (isInitiator: boolean) => {
    // Guard: don't start if component already unmounted
    if (destroyedRef.current) {
      console.log('[VideoCall] startCall aborted — component destroyed');
      return;
    }

    if (isStartingRef.current) {
      console.log('[VideoCall] startCall already in progress, ignoring');
      return;
    }

    // Clean up any previous call
    if (pcRef.current) {
      teardown();
      resetState();
      await new Promise(r => setTimeout(r, 100));
    }

    // Check again after await
    if (destroyedRef.current) return;

    isStartingRef.current = true;
    pendingIceCandidatesRef.current = [];
    remoteDescSetRef.current = false;

    dbg(`starting — ${isInitiator ? 'INITIATOR' : 'ANSWERER'}`);
    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    let pc: RTCPeerConnection | null = null;
    // localPc is a closure-local reference so async handlers always have it
    // even after pcRef might change
    const localPc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pc = localPc;
    pcRef.current = localPc;

    console.log('[VideoCall] PC created');

    const flushQueued = async () => {
      const q = pendingIceCandidatesRef.current.splice(0);
      if (q.length) console.log(`[VideoCall] flushing ${q.length} queued ICE candidates`);
      for (const c of q) {
        try { await localPc.addIceCandidate(new RTCIceCandidate(c)); }
        catch (e) { console.warn('[VideoCall] queued ICE err:', e); }
      }
    };

    // Wire handlers
    localPc.ontrack = (ev) => {
      console.log('[VideoCall] ontrack:', ev.track.kind);
      const [remoteStream] = ev.streams;
      setState(prev => ({ ...prev, remoteStream, isConnecting: false }));
      attachToEl(remoteVideoRef.current, remoteStream);
      dbg('remote track received ✓');
    };

    localPc.onicecandidate = (ev) => {
      if (ev.candidate) {
        console.log('[VideoCall] local ICE:', ev.candidate.type, ev.candidate.protocol);
        wsService.sendIceCandidate(ev.candidate.toJSON());
      } else {
        console.log('[VideoCall] ICE gathering complete');
      }
    };

    localPc.onconnectionstatechange = () => {
      const s = localPc.connectionState;
      dbg(`conn: ${s}`);
      if (s === 'connected') {
        setState(prev => ({ ...prev, isConnected: true, isConnecting: false }));
      } else if (s === 'failed') {
        setState(prev => ({ ...prev, isConnected: false, isConnecting: false, error: 'Connection failed. Try again or check TURN config.' }));
      } else if (s === 'disconnected' || s === 'closed') {
        setState(prev => ({ ...prev, isConnected: false, isConnecting: false }));
      }
    };

    localPc.oniceconnectionstatechange = () => {
      const s = localPc.iceConnectionState;
      console.log('[VideoCall] ICE conn:', s);
      if (s === 'failed' && isInitiator && isPCUsable(localPc)) {
        console.log('[VideoCall] ICE failed — restarting');
        localPc.createOffer({ iceRestart: true })
          .then(o => localPc.setLocalDescription(o))
          .then(() => wsService.sendOffer(localPc.localDescription!))
          .catch(e => console.error('[VideoCall] ICE restart err:', e));
      }
    };

    localPc.onsignalingstatechange = () => {
      console.log('[VideoCall] signaling:', localPc.signalingState);
    };

    // WS signaling handlers — use localPc (closure), not pcRef
    const onOffer = async (data: RTCSessionDescriptionInit) => {
      if (!isPCUsable(localPc)) { console.log('[VideoCall] offer ignored — PC unusable'); return; }
      console.log('[VideoCall] got offer, signaling:', localPc.signalingState);
      dbg('got offer');
      try {
        await localPc.setRemoteDescription(new RTCSessionDescription(data));
        remoteDescSetRef.current = true;
        await flushQueued();
        const answer = await localPc.createAnswer();
        await localPc.setLocalDescription(answer);
        wsService.sendAnswer(answer);
        dbg('answer sent ✓');
      } catch (e) {
        console.error('[VideoCall] offer handler err:', e);
        dbg('offer handling failed');
      }
    };

    const onAnswer = async (data: RTCSessionDescriptionInit) => {
      if (!isPCUsable(localPc)) { console.log('[VideoCall] answer ignored — PC unusable'); return; }
      console.log('[VideoCall] got answer, signaling:', localPc.signalingState);
      dbg('got answer');
      try {
        await localPc.setRemoteDescription(new RTCSessionDescription(data));
        remoteDescSetRef.current = true;
        await flushQueued();
        dbg('answer applied ✓');
      } catch (e) {
        console.error('[VideoCall] answer handler err:', e);
        dbg('answer handling failed');
      }
    };

    const onIce = async (data: RTCIceCandidateInit) => {
      if (!isPCUsable(localPc)) return;
      if (!remoteDescSetRef.current) {
        console.log('[VideoCall] queuing ICE (no remote desc yet)');
        pendingIceCandidatesRef.current.push(data);
        return;
      }
      try { await localPc.addIceCandidate(new RTCIceCandidate(data)); }
      catch (e) { console.warn('[VideoCall] addIceCandidate err:', e); }
    };

    wsService.on('offer', onOffer);
    wsService.on('answer', onAnswer);
    wsService.on('ice_candidate', onIce);

    cleanupRef.current = () => {
      console.log('[VideoCall] removing WS signaling listeners');
      wsService.off('offer', onOffer);
      wsService.off('answer', onAnswer);
      wsService.off('ice_candidate', onIce);
    };

    try {
      // Get media AFTER wiring up all handlers
      dbg('requesting camera/mic');
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
      } catch (e: any) {
        console.warn('[VideoCall] getUserMedia err:', e.name, '— trying audio only');
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setState(prev => ({ ...prev, isVideoEnabled: false }));
      }

      // After every await: bail if component was destroyed or PC was closed
      if (destroyedRef.current) {
        console.log('[VideoCall] destroyed during getUserMedia — stopping tracks');
        stream.getTracks().forEach(t => t.stop());
        isStartingRef.current = false;
        return;
      }

      if (!isPCUsable(localPc)) {
        console.error('[VideoCall] PC closed during getUserMedia');
        stream.getTracks().forEach(t => t.stop());
        setState(prev => ({ ...prev, isConnecting: false, error: 'Setup failed, please try again.', debugStatus: 'PC closed during setup' }));
        isStartingRef.current = false;
        return;
      }

      localStreamRef.current = stream;
      setState(prev => ({ ...prev, localStream: stream }));
      attachToEl(localVideoRef.current, stream);

      stream.getTracks().forEach(t => {
        localPc.addTrack(t, stream);
        console.log('[VideoCall] added track:', t.kind);
      });
      dbg('local stream ready');

      // Check again before offer creation
      if (destroyedRef.current) { isStartingRef.current = false; return; }

      if (isInitiator) {
        dbg('creating offer');
        const offer = await localPc.createOffer();
        await localPc.setLocalDescription(offer);
        wsService.sendOffer(offer);
        dbg('offer sent — waiting for answer');
      } else {
        dbg('answerer ready — waiting for offer');
      }

      wsService.sendVideoReady();

    } catch (err: any) {
      if (destroyedRef.current) { isStartingRef.current = false; return; }
      console.error('[VideoCall] startCall error:', err);
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: err.message || 'Failed to start video call',
        debugStatus: `ERROR: ${err.message}`,
      }));
      teardown();
    } finally {
      isStartingRef.current = false;
    }
  }, [teardown, resetState, dbg, attachToEl]);

  const toggleVideo = useCallback(() => {
    const v = !state.isVideoEnabled;
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = v; });
    setState(prev => ({ ...prev, isVideoEnabled: v }));
    wsService.sendVideoToggle(v);
  }, [state.isVideoEnabled]);

  const toggleAudio = useCallback(() => {
    const v = !state.isAudioEnabled;
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = v; });
    setState(prev => ({ ...prev, isAudioEnabled: v }));
    wsService.sendAudioToggle(v);
  }, [state.isAudioEnabled]);

  const endCall = useCallback(() => {
    wsService.sendEndCall();
    teardown();
    resetState();
  }, [teardown, resetState]);

  // On unmount: mark destroyed FIRST, then teardown
  // This prevents startCall from continuing after unmount
  useEffect(() => {
    destroyedRef.current = false; // reset on mount
    return () => {
      destroyedRef.current = true;
      teardown();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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