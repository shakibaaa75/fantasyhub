"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MonitorUp,
  MessageSquare,
  User,
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
  matchId,
  isInitiator,
  onReport,
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

  // Start the call and timer on mount
  useEffect(() => {
    start();
    startCall(isInitiator).catch((err) => {
      console.error("Failed to start call:", err);
    });

    // Listen for partner's video toggle
    const handleVideoToggle = (data: { enabled: boolean }) => {
      setPartnerVideoEnabled(data.enabled);
    };

    wsService.on("video_toggle", handleVideoToggle);

    return () => {
      stop();
      wsService.off("video_toggle", handleVideoToggle);
    };
  }, [isInitiator, startCall, start, stop]);

  // Hide controls after inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const show = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };

    window.addEventListener("mousemove", show);
    window.addEventListener("touchstart", show);
    show();

    return () => {
      window.removeEventListener("mousemove", show);
      window.removeEventListener("touchstart", show);
      clearTimeout(timeout);
    };
  }, []);

  const handleEndCall = () => {
    endCall();
    onSkip();
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Video Grid */}
      <div className="flex-1 relative">
        {/* Remote Video (Full Screen) */}
        <div className="absolute inset-0">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover ${!partnerVideoEnabled ? "hidden" : ""}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#0a0a1a]">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <User className="w-10 h-10 text-neutral-500" />
                </div>
                <p className="text-neutral-400 text-sm">
                  {isConnecting ? "Connecting..." : "Waiting for partner"}
                </p>
              </div>
            </div>
          )}

          {/* Partner video off overlay */}
          {!partnerVideoEnabled && remoteStream && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a1a]">
              <div className="text-center">
                <VideoOff className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                <p className="text-neutral-400 text-sm">Camera off</p>
              </div>
            </div>
          )}
        </div>

        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute top-4 right-4 w-32 h-44 sm:w-40 sm:h-52 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl bg-black">
          {localStream ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${!isVideoEnabled ? "hidden" : ""}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#1a1a2e]">
              <User className="w-8 h-8 text-neutral-600" />
            </div>
          )}

          {/* Local video off overlay */}
          {!isVideoEnabled && localStream && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a2e]">
              <VideoOff className="w-8 h-8 text-neutral-500" />
            </div>
          )}

          {/* Timer badge */}
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm">
            <span className="text-[10px] text-white font-mono">{timer}</span>
          </div>
        </div>

        {/* Connection status */}
        <AnimatePresence>
          {isConnecting && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                <span className="text-xs text-white">Connecting...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Match info */}
        <div className="absolute top-4 left-4 right-40">
          <div className="px-3 py-2 rounded-xl bg-black/40 backdrop-blur-sm inline-block">
            <p className="text-sm text-white font-medium">{strangerName}</p>
            <div className="flex items-center gap-1 mt-0.5">
              {sharedTags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] text-lavender bg-lavender/10 px-1.5 py-0.5 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-0 right-0 p-6 pb-8"
          >
            {/* Gradient overlay for controls visibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

            <div className="relative z-10 flex items-center justify-center gap-4">
              {/* Audio toggle */}
              <button
                onClick={toggleAudio}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  isAudioEnabled
                    ? "bg-white/10 text-white hover:bg-white/20"
                    : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                }`}
              >
                {isAudioEnabled ? (
                  <Mic className="w-6 h-6" />
                ) : (
                  <MicOff className="w-6 h-6" />
                )}
              </button>

              {/* Video toggle */}
              <button
                onClick={toggleVideo}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                  isVideoEnabled
                    ? "bg-white/10 text-white hover:bg-white/20"
                    : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                }`}
              >
                {isVideoEnabled ? (
                  <Video className="w-6 h-6" />
                ) : (
                  <VideoOff className="w-6 h-6" />
                )}
              </button>

              {/* Switch to chat */}
              <button
                onClick={onSwitchToChat}
                className="w-14 h-14 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <MessageSquare className="w-6 h-6" />
              </button>

              {/* End call */}
              <button
                onClick={handleEndCall}
                className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-all shadow-lg shadow-red-500/30"
              >
                <PhoneOff className="w-7 h-7" />
              </button>

              {/* Skip */}
              <button
                onClick={onSkip}
                className="w-14 h-14 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <MonitorUp className="w-6 h-6" />
              </button>
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
            className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50"
          >
            <div className="text-center px-6">
              <p className="text-red-400 text-lg mb-2">Connection Error</p>
              <p className="text-neutral-400 text-sm mb-6">{error}</p>
              <button
                onClick={onBack}
                className="px-6 py-2 rounded-lg bg-white text-black font-medium text-sm"
              >
                Go Back
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
