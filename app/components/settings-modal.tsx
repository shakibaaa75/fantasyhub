"use client";

import { useState } from "react";
import { X, Moon, Bell, Shield, Volume2, VolumeX } from "lucide-react";

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="bg-[#0e0a14] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-neutral-400" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-lavender" />
                ) : (
                  <VolumeX className="w-4 h-4 text-neutral-500" />
                )}
              </div>
              <div>
                <div className="text-sm font-medium text-white">
                  Sound Effects
                </div>
                <div className="text-xs text-neutral-500">
                  Message sounds and notifications
                </div>
              </div>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`w-10 h-5 rounded-full transition-colors ${
                soundEnabled ? "bg-lavender" : "bg-white/20"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  soundEnabled ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                <Bell className="w-4 h-4 text-lavender" />
              </div>
              <div>
                <div className="text-sm font-medium text-white">
                  Notifications
                </div>
                <div className="text-xs text-neutral-500">
                  Browser notifications
                </div>
              </div>
            </div>
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={`w-10 h-5 rounded-full transition-colors ${
                notificationsEnabled ? "bg-lavender" : "bg-white/20"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  notificationsEnabled ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                <Shield className="w-4 h-4 text-lavender" />
              </div>
              <div>
                <div className="text-sm font-medium text-white">
                  Anonymous Mode
                </div>
                <div className="text-xs text-neutral-500">
                  Always on for your privacy
                </div>
              </div>
            </div>
            <div className="text-xs text-green-500">Active</div>
          </div>
        </div>

        <div className="p-5 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full h-10 rounded-lg bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
