"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  SkipForward,
  MessageSquare,
  User,
  WifiOff,
} from "lucide-react";
import { useVideoCall } from "@/hooks/use-video-call";
import { wsService } from "@/lib/websocket-service";
import { useChatTimer } from "@/hooks/use-chat-timer";

interface VideoRoomProps {
  strangerName: string;
  sharedTags: string[];
  matchId: string;
  isInitiator: boolean;
  onReport: () => void;
  onSkip: () => void;
  onSwitchToChat: () => void;
  onBack?: () => void;
}

export default function VideoRoom({
  strangerName,
  sharedTags,
  isInitiator,
  onSkip,
  onSwitchToChat,
  onBack,
}: VideoRoomProps) {
  const {
    isConnected,
    isConnecting,
    localStream,
    remoteStream,
    isVideoEnabled,
    isAudioEnabled,
    error,
    debugStatus,
    localVideoRef,
    remoteVideoRef,
    startCall,
    toggleVideo,
    toggleAudio,
    endCall,
  } = useVideoCall();

  const [showControls, setShowControls] = useState(true);
  const [partnerVideoEnabled, setPartnerVideoEnabled] = useState(true);
  const { formatted: timer, start, stop } = useChatTimer();

  // FIX: Remove calledRef — let the hook handle it via mount counting
  const startedRef = useRef(false);

  // Start call exactly once per actual mount
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    start();
    startCall(isInitiator);

    const onVideoToggle = (d: { enabled: boolean }) =>
      setPartnerVideoEnabled(d.enabled);
    wsService.on("video_toggle", onVideoToggle);

    return () => {
      stop();
      wsService.off("video_toggle", onVideoToggle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-hide controls
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const show = () => {
      setShowControls(true);
      clearTimeout(t);
      t = setTimeout(() => setShowControls(false), 3500);
    };
    window.addEventListener("mousemove", show);
    window.addEventListener("touchstart", show);
    show();
    return () => {
      window.removeEventListener("mousemove", show);
      window.removeEventListener("touchstart", show);
      clearTimeout(t);
    };
  }, []);

  const handleEnd = () => {
    endCall();
    onSkip();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 select-none">
      {/* Remote video — full screen */}
      <div className="absolute inset-0 bg-[#080810]">
        <video
          ref={remoteVideoRef} // FIX: Direct ref from hook, no callback wrapper
          autoPlay
          playsInline
          className={`w-full h-full object-cover transition-opacity duration-300 ${remoteStream && partnerVideoEnabled ? "opacity-100" : "opacity-0"}`}
        />
        {(!remoteStream || !partnerVideoEnabled) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
                {!remoteStream ? (
                  <User className="w-10 h-10 text-neutral-700" />
                ) : (
                  <VideoOff className="w-10 h-10 text-neutral-700" />
                )}
              </div>
              <p className="text-neutral-400 text-sm">
                {!remoteStream ? "Waiting for partner…" : "Camera off"}
              </p>
              {(isConnecting || (!isConnected && !error)) && (
                <div className="flex gap-1.5 justify-center mt-3">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Local PiP */}
      <div className="absolute top-4 right-4 w-28 h-40 sm:w-36 sm:h-48 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#1a1a2e] z-10">
        <video
          ref={localVideoRef} // FIX: Direct ref from hook
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${localStream && isVideoEnabled ? "opacity-100" : "opacity-0"}`}
        />
        {(!localStream || !isVideoEnabled) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <VideoOff className="w-7 h-7 text-neutral-600" />
          </div>
        )}
        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60">
          <span className="text-[10px] text-white font-mono">{timer}</span>
        </div>
      </div>

      {/* Match info */}
      <div className="absolute top-4 left-4 right-40 z-10">
        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-black/50 backdrop-blur-md border border-white/10">
          <div
            className={`w-2 h-2 rounded-full shrink-0 ${isConnected ? "bg-green-400" : isConnecting ? "bg-yellow-400 animate-pulse" : "bg-neutral-600"}`}
          />
          <div>
            <p className="text-xs text-white font-semibold">{strangerName}</p>
            <div className="flex gap-1 mt-0.5">
              {sharedTags.slice(0, 2).map((t) => (
                <span
                  key={t}
                  className="text-[9px] text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Debug badge */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-black/70 border border-white/10 max-w-xs text-center">
        <span className="text-[10px] font-mono text-yellow-300 break-all">
          {debugStatus}
        </span>
      </div>

      {/* Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-0 right-0 pb-10 pt-16 z-20"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />
            <div className="relative z-10 flex items-center justify-center gap-3 sm:gap-4">
              <Btn
                onClick={toggleAudio}
                active={isAudioEnabled}
                icon={
                  isAudioEnabled ? (
                    <Mic className="w-5 h-5" />
                  ) : (
                    <MicOff className="w-5 h-5" />
                  )
                }
              />
              <Btn
                onClick={toggleVideo}
                active={isVideoEnabled}
                icon={
                  isVideoEnabled ? (
                    <Video className="w-5 h-5" />
                  ) : (
                    <VideoOff className="w-5 h-5" />
                  )
                }
              />
              <Btn
                onClick={onSwitchToChat}
                active
                icon={<MessageSquare className="w-5 h-5" />}
              />
              <button
                onClick={handleEnd}
                className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 active:scale-95 transition-all shadow-lg shadow-red-500/40"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
              <Btn
                onClick={onSkip}
                active
                icon={<SkipForward className="w-5 h-5" />}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error overlay */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/85 backdrop-blur-sm z-50"
          >
            <div className="text-center px-8 max-w-xs">
              <WifiOff className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-white font-semibold mb-2">Connection Error</p>
              <p className="text-neutral-400 text-sm mb-6">{error}</p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    startedRef.current = false;
                    startCall(isInitiator);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 text-white font-medium text-sm hover:bg-purple-700"
                >
                  Try Again
                </button>
                <button
                  onClick={onBack}
                  className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-neutral-300 text-sm hover:bg-white/10"
                >
                  Go Back
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Btn({
  onClick,
  active,
  icon,
}: {
  onClick: () => void;
  active: boolean;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all active:scale-95 ${
        active
          ? "bg-white/10 text-white hover:bg-white/20"
          : "bg-red-500/15 text-red-400 hover:bg-red-500/25"
      }`}
    >
      {icon}
    </button>
  );
}
