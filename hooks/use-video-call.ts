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

// ---------------------------------------------------------------------------
// TURN SERVER SETUP
// ---------------------------------------------------------------------------
// The old openrelay.metered.ca free TURN was unreliable for distant users.
//
// OPTION A (Recommended — Free, works globally):
//   Sign up at https://www.metered.ca/stun-turn  (free tier = 1 GB/mo relay)
//   Put your API key in .env:  NEXT_PUBLIC_METERED_API_KEY=xxxxxxxx
//   The fetchIceServers() function below will call their API and get
//   geo-distributed TURN servers automatically.
//
// OPTION B (Self-hosted, best performance):
//   Run coturn on any $5 VPS:
//     docker run -d --network=host coturn/coturn \
//       -n --log-file=stdout --min-port=49160 --max-port=49200 \
//       --lt-cred-mech --fingerprint \
//       --no-multicast-peers --no-cli \
//       --no-tlsv1 --no-tlsv1_1 \
//       --realm=yourdomain.com \
//       --user=myuser:mypassword \
//       --external-ip=$(curl -s ifconfig.me)
//   Then set env vars:
//     NEXT_PUBLIC_TURN_URL=turn:YOUR_SERVER_IP:3478
//     NEXT_PUBLIC_TURN_USER=myuser
//     NEXT_PUBLIC_TURN_PASS=mypassword
//
// OPTION C (Zero config fallback — less reliable but better than openrelay):
//   The FALLBACK_ICE_SERVERS below uses multiple public free STUN servers
//   plus Twilio's NTS demo TURN. Works for most cases but has no SLA.
// ---------------------------------------------------------------------------

const FALLBACK_ICE_SERVERS: RTCIceServer[] = [
  // Multiple STUN servers for redundancy
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
  // Metered.ca free TURN (more reliable than openrelay, still free)
  {
    urls: [
      'turn:a.relay.metered.ca:80',
      'turn:a.relay.metered.ca:80?transport=tcp',
      'turn:a.relay.metered.ca:443',
      'turn:a.relay.metered.ca:443?transport=tcp',
    ],
    username: 'e8dd65f4519f5d3a7b0cde09',
    credential: 'uMNAqBMNaJZRDsZK',
  },
];

// Fetch fresh geo-distributed TURN credentials from Metered.ca API
// Returns fallback servers if API key is missing or request fails
async function fetchIceServers(): Promise<RTCIceServer[]> {
  const apiKey = process.env.NEXT_PUBLIC_METERED_API_KEY;

  // Use self-hosted TURN if configured
  const selfHostedUrl = process.env.NEXT_PUBLIC_TURN_URL;
  if (selfHostedUrl) {
    return [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun.cloudflare.com:3478' },
      {
        urls: selfHostedUrl,
        username: process.env.NEXT_PUBLIC_TURN_USER ?? '',
        credential: process.env.NEXT_PUBLIC_TURN_PASS ?? '',
      },
      // TCP fallback on port 443 (punches through most corporate firewalls)
      {
        urls: selfHostedUrl.replace('3478', '443') + '?transport=tcp',
        username: process.env.NEXT_PUBLIC_TURN_USER ?? '',
        credential: process.env.NEXT_PUBLIC_TURN_PASS ?? '',
      },
    ];
  }

  if (!apiKey) {
    console.warn('[VideoCall] No METERED_API_KEY — using fallback TURN servers. Set NEXT_PUBLIC_METERED_API_KEY for best reliability.');
    return FALLBACK_ICE_SERVERS;
  }

  try {
    const res = await fetch(
      `https://liveapp.metered.live/api/v1/turn/credentials?apiKey=${apiKey}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const servers: RTCIceServer[] = await res.json();
    console.log(`[VideoCall] Fetched ${servers.length} ICE servers from Metered`);
    return servers;
  } catch (e) {
    console.warn('[VideoCall] Failed to fetch Metered TURN credentials, using fallback:', e);
    return FALLBACK_ICE_SERVERS;
  }
}

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
  const iceServersRef = useRef<RTCIceServer[]>(FALLBACK_ICE_SERVERS);
  const iceRetryRef = useRef(false); // tracks whether we already did relay-only retry

  const destroyedRef = useRef(false);
  const isStartingRef = useRef(false);
  const mountCountRef = useRef(0);

  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const remoteDescSetRef = useRef(false);

  const dbg = useCallback((msg: string) => {
    console.log(`[VideoCall] ${msg}`);
    setState(prev => ({ ...prev, debugStatus: msg }));
  }, []);

  const attachToEl = useCallback((el: HTMLVideoElement | null, stream: MediaStream | null) => {
    if (!el || !stream) return;
    console.log('[VideoCall] attaching stream, tracks:', stream.getTracks().map(t => `${t.kind}:${t.readyState}`).join(', '));
    if (el.srcObject !== stream) {
      el.srcObject = stream;
    }
    el.play().catch(e => console.warn('[VideoCall] play() blocked:', e.message));
  }, []);

  const teardown = useCallback(() => {
    console.log('[VideoCall] teardown()');

    cleanupRef.current?.();
    cleanupRef.current = null;

    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;

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
    iceRetryRef.current = false;
  }, []);

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

  // Prefetch ICE servers on mount so they're ready when call starts
  useEffect(() => {
    fetchIceServers().then(servers => {
      iceServersRef.current = servers;
      console.log('[VideoCall] ICE servers pre-fetched, relay count:',
        servers.filter(s => {
          const urls = Array.isArray(s.urls) ? s.urls : [s.urls];
          return urls.some(u => u.startsWith('turn:'));
        }).length
      );
    });
  }, []);

  useEffect(() => {
    mountCountRef.current += 1;
    const mountId = mountCountRef.current;
    destroyedRef.current = false;

    console.log(`[VideoCall] mount #${mountId}`);

    return () => {
      console.log(`[VideoCall] unmount #${mountId}`);
      destroyedRef.current = true;
      teardown();
      if (mountId === mountCountRef.current) {
        resetState();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (state.localStream) attachToEl(localVideoRef.current, state.localStream);
  }, [state.localStream, attachToEl]);

  useEffect(() => {
    if (state.remoteStream) attachToEl(remoteVideoRef.current, state.remoteStream);
  }, [state.remoteStream, attachToEl]);

  const startCall = useCallback(async (isInitiator: boolean) => {
    if (destroyedRef.current) {
      console.log('[VideoCall] startCall aborted — component destroyed');
      return;
    }

    if (isStartingRef.current) {
      console.log('[VideoCall] startCall already in progress, ignoring');
      return;
    }

    if (pcRef.current) {
      teardown();
      resetState();
      await new Promise(r => setTimeout(r, 100));
    }

    if (destroyedRef.current) return;

    isStartingRef.current = true;
    iceRetryRef.current = false;
    pendingIceCandidatesRef.current = [];
    remoteDescSetRef.current = false;

    dbg(`starting — ${isInitiator ? 'INITIATOR' : 'ANSWERER'}`);
    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    // Fetch fresh ICE servers (geo-distributed TURN endpoints)
    // Re-fetch here in case prefetch hasn't completed or credentials expired
    const iceServers = await fetchIceServers();
    iceServersRef.current = iceServers;

    if (destroyedRef.current) { isStartingRef.current = false; return; }

    // Log which relay types we have — helpful for debugging
    const relayUrls = iceServers.flatMap(s => Array.isArray(s.urls) ? s.urls : [s.urls]).filter(u => u.startsWith('turn:'));
    console.log(`[VideoCall] Using ${iceServers.length} ICE servers, ${relayUrls.length} TURN relay endpoints`);

    const localPc = new RTCPeerConnection({
      iceServers,
      // Trickle ICE — don't wait for all candidates before sending offer
      // This is the default but being explicit is good
      iceCandidatePoolSize: 10,
    });
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

    localPc.ontrack = (ev) => {
      console.log('[VideoCall] ontrack:', ev.track.kind, 'streams:', ev.streams.length);
      const [remoteStream] = ev.streams;
      if (!remoteStream) {
        console.warn('[VideoCall] ontrack but no streams');
        return;
      }
      setState(prev => ({ ...prev, remoteStream, isConnecting: false }));
      setTimeout(() => {
        attachToEl(remoteVideoRef.current, remoteStream);
      }, 0);
      dbg('remote track received ✓');
    };

    localPc.onicecandidate = (ev) => {
      if (ev.candidate) {
        // Log type so you can confirm relay candidates are being generated
        console.log('[VideoCall] local ICE:', ev.candidate.type, ev.candidate.protocol,
          ev.candidate.type === 'relay' ? '← TURN relay ✓' : '');
        wsService.sendIceCandidate(ev.candidate.toJSON());
      } else {
        console.log('[VideoCall] ICE gathering complete');
      }
    };

    localPc.onconnectionstatechange = () => {
      const s = localPc.connectionState;
      dbg(`conn: ${s}`);
      if (s === 'connected') {
        iceRetryRef.current = false;
        setState(prev => ({ ...prev, isConnected: true, isConnecting: false }));
      } else if (s === 'failed') {
        setState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
          error: 'Connection failed — check your network or try again.',
        }));
      } else if (s === 'disconnected' || s === 'closed') {
        setState(prev => ({ ...prev, isConnected: false, isConnecting: false }));
      }
    };

    localPc.oniceconnectionstatechange = () => {
      const s = localPc.iceConnectionState;
      console.log('[VideoCall] ICE conn:', s);

      if (s === 'failed' && isPCUsable(localPc)) {
        if (!iceRetryRef.current) {
          // First failure: restart ICE with relay-only policy
          // This forces all traffic through TURN, bypassing direct P2P
          // which fails for distant users behind strict NATs
          iceRetryRef.current = true;
          console.log('[VideoCall] ICE failed — retrying with relay-only (TURN forced)');
          dbg('ICE failed, retrying via TURN relay...');

          try {
            localPc.setConfiguration({
              iceServers: iceServersRef.current,
              iceTransportPolicy: 'relay', // Force TURN — skip direct P2P entirely
            });
          } catch (e) {
            console.warn('[VideoCall] setConfiguration failed:', e);
          }

          if (isInitiator) {
            localPc.createOffer({ iceRestart: true })
              .then(o => localPc.setLocalDescription(o))
              .then(() => {
                if (localPc.localDescription) wsService.sendOffer(localPc.localDescription);
              })
              .catch(e => console.error('[VideoCall] ICE restart err:', e));
          }
        } else {
          // Already retried with relay — still failing, TURN server is down
          console.error('[VideoCall] ICE failed even with relay-only. TURN server unreachable.');
          dbg('ICE failed — TURN unreachable, check server config');
          setState(prev => ({
            ...prev,
            isConnected: false,
            isConnecting: false,
            error: 'Cannot connect. TURN relay server may be down. Please try again later.',
          }));
        }
      }

      if (s === 'disconnected') {
        // Temporary disconnect — browser will auto-retry, just log it
        dbg('ICE disconnected — waiting for reconnect...');
      }
    };

    localPc.onsignalingstatechange = () => {
      console.log('[VideoCall] signaling:', localPc.signalingState);
    };

    // Gather ICE stats periodically so you can see relay vs direct in debug
    if (process.env.NODE_ENV === 'development') {
      const statsInterval = setInterval(async () => {
        if (!isPCUsable(localPc)) { clearInterval(statsInterval); return; }
        try {
          const stats = await localPc.getStats();
          stats.forEach(report => {
            if (report.type === 'candidate-pair' && report.state === 'succeeded') {
              console.log('[VideoCall] Active candidate pair type:',
                report.localCandidateId, '→ remote');
            }
          });
        } catch { clearInterval(statsInterval); }
      }, 5000);
    }

    // WS signaling handlers
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

      if (destroyedRef.current) {
        console.log('[VideoCall] destroyed during getUserMedia — stopping tracks');
        stream.getTracks().forEach(t => t.stop());
        isStartingRef.current = false;
        return;
      }

      if (!isPCUsable(localPc)) {
        console.error('[VideoCall] PC closed during getUserMedia');
        stream.getTracks().forEach(t => t.stop());
        setState(prev => ({
          ...prev,
          isConnecting: false,
          error: 'Setup failed, please try again.',
          debugStatus: 'PC closed during setup',
        }));
        isStartingRef.current = false;
        return;
      }

      localStreamRef.current = stream;
      setState(prev => ({ ...prev, localStream: stream }));

      attachToEl(localVideoRef.current, stream);
      setTimeout(() => attachToEl(localVideoRef.current, stream), 50);

      stream.getTracks().forEach(t => {
        localPc.addTrack(t, stream);
        console.log('[VideoCall] added track:', t.kind);
      });
      dbg('local stream ready');

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