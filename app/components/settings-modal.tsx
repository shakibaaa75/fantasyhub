"use client";

import { useState } from "react";
import { Video, Camera } from "lucide-react";

import {
  X,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
  Shield,
  RefreshCw,
  RotateCcw,
  MessageSquare,
  Sliders,
} from "lucide-react";
import { useSettings } from "@/lib/ settings-context";
import { playSound, preloadAudioContext } from "@/lib/sounds";

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const {
    settings,
    updateSetting,
    resetSettings,
    notificationPermission,
    requestNotificationPermission,
  } = useSettings();

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // ==================== HANDLERS ====================

  const handleSoundToggle = () => {
    const newValue = !settings.soundEnabled;

    // Preload AudioContext on first interaction
    if (newValue) preloadAudioContext();

    updateSetting("soundEnabled", newValue);

    // Play a test sound when enabling
    if (newValue) {
      setTimeout(() => playSound("notification"), 100);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    updateSetting("soundVolume", vol);

    // Play a preview sound while dragging
    playSound("message", vol);
  };

  const handleNotificationToggle = async () => {
    if (!settings.notificationsEnabled) {
      // Turning ON — need browser permission
      if (notificationPermission === "denied") {
        // Already denied — can't re-enable, tell user to change in browser settings
        alert(
          "Browser notifications are blocked. To enable them, go to your browser's site settings and allow notifications for this site.",
        );
        return;
      }

      if (notificationPermission === "default") {
        const perm = await requestNotificationPermission();
        if (perm === "granted") {
          updateSetting("notificationsEnabled", true);
        }
        // If denied or dismissed, the context handles reverting
        return;
      }

      // Already granted
      updateSetting("notificationsEnabled", true);
    } else {
      // Turning OFF
      updateSetting("notificationsEnabled", false);
    }
  };

  const handleTypingToggle = () => {
    updateSetting("showTypingIndicator", !settings.showTypingIndicator);
  };

  const handleAutoRequeueToggle = () => {
    updateSetting("autoRequeue", !settings.autoRequeue);
  };

  const handleSimilarityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSetting("minSimilarity", parseFloat(e.target.value));
  };

  const handleReset = () => {
    if (showResetConfirm) {
      resetSettings();
      setShowResetConfirm(false);
      playSound("skip");
    } else {
      setShowResetConfirm(true);
      // Auto-dismiss confirmation after 3 seconds
      setTimeout(() => setShowResetConfirm(false), 3000);
    }
  };

  const handleTestSound = (soundName: "matchFound" | "message" | "skip") => {
    playSound(soundName, settings.soundVolume);
  };

  // ==================== RENDER ====================

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="bg-[#0e0a14] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl shadow-purple-900/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-4 h-4 text-lavender" />
            <h2 className="text-lg font-semibold text-white">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-neutral-400" />
          </button>
        </div>

        {/* ─── Body ─── */}
        <div className="p-5 space-y-1 max-h-[70vh] overflow-y-auto">
          {/* Section: Audio */}
          <div className="text-[10px] text-neutral-600 font-display tracking-[0.2em] uppercase px-1 pt-2 pb-1">
            Audio
          </div>

          {/* Sound Effects */}
          <SettingsRow
            icon={
              settings.soundEnabled ? (
                <Volume2 className="w-4 h-4 text-lavender" />
              ) : (
                <VolumeX className="w-4 h-4 text-neutral-500" />
              )
            }
            title="Sound Effects"
            subtitle="Match chimes, message sounds"
          >
            <ToggleSwitch
              enabled={settings.soundEnabled}
              onToggle={handleSoundToggle}
            />
          </SettingsRow>

          {/* Volume Slider */}
          {settings.soundEnabled && (
            <div className="flex items-center justify-between py-2 pl-11">
              <span className="text-xs text-neutral-500">Volume</span>
              <div className="flex items-center gap-3">
                <VolumeX className="w-3 h-3 text-neutral-600" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.soundVolume}
                  onChange={handleVolumeChange}
                  className="w-24 h-1 appearance-none bg-white/10 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-lavender [&::-webkit-slider-thumb]:cursor-pointer"
                />
                <Volume2 className="w-3 h-3 text-neutral-600" />
                <span className="text-[10px] text-neutral-500 w-8 text-right tabular-nums">
                  {Math.round(settings.soundVolume * 100)}%
                </span>
              </div>
            </div>
          )}

          {/* Test Sounds */}
          {settings.soundEnabled && (
            <div className="flex items-center gap-2 py-1 pl-11">
              <span className="text-[10px] text-neutral-600 mr-1">Test:</span>
              <button
                onClick={() => handleTestSound("matchFound")}
                className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] text-[10px] text-neutral-400 hover:bg-white/[0.08] hover:text-white transition-colors"
              >
                Match
              </button>
              <button
                onClick={() => handleTestSound("message")}
                className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] text-[10px] text-neutral-400 hover:bg-white/[0.08] hover:text-white transition-colors"
              >
                Message
              </button>
              <button
                onClick={() => handleTestSound("skip")}
                className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] text-[10px] text-neutral-400 hover:bg-white/[0.08] hover:text-white transition-colors"
              >
                Skip
              </button>
            </div>
          )}

          {/* Section: Notifications */}
          <div className="text-[10px] text-neutral-600 font-display tracking-[0.2em] uppercase px-1 pt-4 pb-1">
            Notifications
          </div>

          {/* Browser Notifications */}
          <SettingsRow
            icon={
              settings.notificationsEnabled ? (
                <Bell className="w-4 h-4 text-lavender" />
              ) : (
                <BellOff className="w-4 h-4 text-neutral-500" />
              )
            }
            title="Browser Notifications"
            subtitle={
              notificationPermission === "denied"
                ? "Blocked — change in browser settings"
                : notificationPermission === "default"
                  ? "Permission not yet requested"
                  : "When the app is in the background"
            }
          >
            <ToggleSwitch
              enabled={settings.notificationsEnabled}
              onToggle={handleNotificationToggle}
              disabled={notificationPermission === "denied"}
            />
          </SettingsRow>

          {/* Section: Chat */}
          <div className="text-[10px] text-neutral-600 font-display tracking-[0.2em] uppercase px-1 pt-4 pb-1">
            Chat
          </div>

          {/* Typing Indicator */}
          <SettingsRow
            icon={<MessageSquare className="w-4 h-4 text-lavender" />}
            title="Typing Indicator"
            subtitle="Show when your partner is typing"
          >
            <ToggleSwitch
              enabled={settings.showTypingIndicator}
              onToggle={handleTypingToggle}
            />
          </SettingsRow>

          {/* Auto-Requeue */}
          <SettingsRow
            icon={<RefreshCw className="w-4 h-4 text-lavender" />}
            title="Auto Re-queue"
            subtitle="Find a new match when partner leaves"
          >
            <ToggleSwitch
              enabled={settings.autoRequeue}
              onToggle={handleAutoRequeueToggle}
            />
          </SettingsRow>

          {/* Section: Privacy */}
          <div className="text-[10px] text-neutral-600 font-display tracking-[0.2em] uppercase px-1 pt-4 pb-1">
            Privacy
          </div>

          {/* Anonymous Mode */}
          <SettingsRow
            icon={<Shield className="w-4 h-4 text-green-500" />}
            title="Anonymous Mode"
            subtitle="Always on for your privacy"
          >
            <span className="text-[10px] font-semibold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
              ACTIVE
            </span>
          </SettingsRow>

          {/* Section: Matching */}
          <div className="text-[10px] text-neutral-600 font-display tracking-[0.2em] uppercase px-1 pt-4 pb-1">
            Matching
          </div>

          {/* Similarity Threshold */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                <Sliders className="w-4 h-4 text-lavender" />
              </div>
              <div>
                <div className="text-sm font-medium text-white">
                  Similarity Threshold
                </div>
                <div className="text-xs text-neutral-500">
                  Minimum tag overlap for a match
                </div>
              </div>
            </div>
            <span className="text-sm font-bold text-lavender tabular-nums">
              {Math.round(settings.minSimilarity * 100)}%
            </span>
          </div>
          <div className="flex items-center gap-3 pl-11 pb-1">
            <span className="text-[10px] text-neutral-600">Lenient</span>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={settings.minSimilarity}
              onChange={handleSimilarityChange}
              className="flex-1 h-1 appearance-none bg-white/10 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-lavender [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <span className="text-[10px] text-neutral-600">Strict</span>
          </div>
        </div>

        {/* ─── Footer ─── */}
        <div className="p-5 border-t border-white/10 space-y-3">
          {/* Reset button */}
          <button
            onClick={handleReset}
            className={`w-full h-10 rounded-lg border text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
              showResetConfirm
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-white/[0.03] border-white/[0.08] text-neutral-400 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {showResetConfirm ? "Confirm Reset?" : "Reset to Defaults"}
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-full h-10 rounded-lg bg-gradient-to-r from-plum to-blush text-white text-sm font-semibold hover:shadow-[0_0_20px_rgba(94,61,140,0.35)] transition-shadow duration-300"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== SUB-COMPONENTS ====================

function SettingsRow({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-white">{title}</div>
          <div className="text-xs text-neutral-500 truncate">{subtitle}</div>
        </div>
      </div>
      <div className="shrink-0 ml-3">{children}</div>
    </div>
  );
}

function ToggleSwitch({
  enabled,
  onToggle,
  disabled = false,
}: {
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`w-10 h-5 rounded-full transition-colors ${
        enabled
          ? "bg-lavender"
          : disabled
            ? "bg-white/10 cursor-not-allowed"
            : "bg-white/20"
      }`}
    >
      <div
        className={`w-4 h-4 rounded-full transition-transform ${
          enabled ? "translate-x-5" : "translate-x-0.5"
        } ${disabled && !enabled ? "bg-white/30" : "bg-white"}`}
      />
    </button>
  );
}
