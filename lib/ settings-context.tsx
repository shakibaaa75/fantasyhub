"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

export interface UserSettings {
  soundEnabled: boolean;
  soundVolume: number;
  notificationsEnabled: boolean;
  anonymousMode: boolean;
  darkMode: boolean;
  showTypingIndicator: boolean;
  autoRequeue: boolean;
  minSimilarity: number;
  defaultCallMode: "chat" | "video"; // NEW
}

// ==================== TYPES ====================

export interface UserSettings {
  /** Play sound effects for messages, matches, etc. */
  soundEnabled: boolean;
  /** Volume level 0–1 for sound effects */
  soundVolume: number;
  /** Show browser notifications when tab is not focused */
  notificationsEnabled: boolean;
  /** Anonymous mode — always true, display-only */
  anonymousMode: boolean;
  /** Dark mode — always true for this app, display-only */
  darkMode: boolean;
  /** Show typing indicators from matched partner */
  showTypingIndicator: boolean;
  /** Auto-requeue after partner disconnects */
  autoRequeue: boolean;
  /** Minimum similarity threshold (0–1) for matchmaking */
  minSimilarity: number;
}

export type SettingsKey = keyof UserSettings;

interface SettingsContextValue {
  settings: UserSettings;
  /** Update a single setting and persist to localStorage */
  updateSetting: <K extends SettingsKey>(
    key: K,
    value: UserSettings[K],
  ) => void;
  /** Update multiple settings at once */
  updateSettings: (partial: Partial<UserSettings>) => void;
  /** Reset all settings to defaults */
  resetSettings: () => void;
  /** Check if browser notifications are actually permitted */
  notificationPermission: NotificationPermission | "default";
  /** Request browser notification permission */
  requestNotificationPermission: () => Promise<NotificationPermission>;
}

// ==================== DEFAULTS ====================
export interface UserSettings {
  soundEnabled: boolean;
  soundVolume: number;
  notificationsEnabled: boolean;
  anonymousMode: boolean;
  darkMode: boolean;
  showTypingIndicator: boolean;
  autoRequeue: boolean;
  minSimilarity: number;
  defaultCallMode: "chat" | "video"; // NEW
}

const DEFAULT_SETTINGS: UserSettings = {
  soundEnabled: true,
  soundVolume: 0.5,
  notificationsEnabled: true,
  anonymousMode: true,
  darkMode: true,
  showTypingIndicator: true,
  autoRequeue: true,
  minSimilarity: 0.25,
  defaultCallMode: "chat", // NEW
};

const STORAGE_KEY = "vibematch_settings";

// ==================== PERSISTENCE ====================

function loadSettings(): UserSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_SETTINGS;

    const parsed = JSON.parse(stored);
    // Merge with defaults so new settings keys get default values
    // even if the stored object is from an older version
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: UserSettings): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn("[Settings] Failed to save to localStorage:", err);
  }
}

// ==================== CONTEXT ====================

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(loadSettings);
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "default"
  >("default");

  // Sync notification permission state on mount
  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Persist settings to localStorage whenever they change
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const updateSetting = useCallback(
    <K extends SettingsKey>(key: K, value: UserSettings[K]) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value };

        // Side effect: when notifications are enabled, request permission
        if (key === "notificationsEnabled" && value === true) {
          if (
            "Notification" in window &&
            Notification.permission === "default"
          ) {
            Notification.requestPermission().then((perm) => {
              setNotificationPermission(perm);
              if (perm !== "granted") {
                // User denied — revert the toggle
                setSettings((p) => ({ ...p, notificationsEnabled: false }));
              }
            });
          } else if (
            "Notification" in window &&
            Notification.permission === "denied"
          ) {
            // Already denied — can't enable, revert
            setSettings((p) => ({ ...p, notificationsEnabled: false }));
          }
        }

        return next;
      });
    },
    [],
  );

  const updateSettings = useCallback((partial: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const requestNotificationPermission =
    useCallback(async (): Promise<NotificationPermission> => {
      if (!("Notification" in window)) return "denied";

      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return permission;
    }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSetting,
        updateSettings,
        resetSettings,
        notificationPermission,
        requestNotificationPermission,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

// ==================== HOOK ====================

/**
 * useSettings — access the global settings context from any component.
 *
 * Usage:
 *   const { settings, updateSetting } = useSettings();
 *   updateSetting("soundEnabled", false);
 */
export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a <SettingsProvider>");
  }
  return context;
}
