/**
 * Notifications utility — Browser Notification API wrapper for VibeMatch.
 *
 * Provides typed helpers for showing notifications when the app tab is not
 * focused, so users never miss a match or message even when VibeMatch is
 * in the background.
 *
 * Usage:
 *   import { showNotification, requestPermission } from "@/lib/notifications";
 *   await requestPermission();
 *   showNotification("Match found!", { body: "You and @stranger share 5 tags" });
 */

// ==================== PERMISSION ====================

/**
 * Check if the browser supports notifications.
 */
export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/**
 * Get the current notification permission status.
 * Returns "default" if the API is not available.
 */
export function getNotificationPermission(): NotificationPermission | "default" {
  if (!isNotificationSupported()) return "default";
  return Notification.permission;
}

/**
 * Request notification permission from the user.
 * Returns the permission result.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return "denied";

  // Use the newer Promise-based API if available
  const result = await Notification.requestPermission();
  return result;
}

/**
 * Check if notifications are currently allowed (permission granted).
 */
export function isNotificationGranted(): boolean {
  return getNotificationPermission() === "granted";
}

// ==================== SHOW NOTIFICATIONS ====================

interface VibeMatchNotificationOptions {
  /** Body text shown below the title */
  body?: string;
  /** Icon URL (defaults to VibeMatch logo) */
  icon?: string;
  /** Badge URL for Android status bar */
  badge?: string;
  /** Tag — notifications with the same tag replace each other */
  tag?: string;
  /** Whether the notification should require interaction (stay until clicked) */
  requireInteraction?: boolean;
  /** Whether to play the default system notification sound */
  silent?: boolean;
  /** Custom data to attach (available in notificationclick event) */
  data?: Record<string, unknown>;
}

/**
 * Show a browser notification, but ONLY if:
 * 1. The browser supports notifications
 * 2. Permission has been granted
 * 3. The app tab is NOT currently focused (no point notifying an active user)
 * 4. Notifications are enabled in app settings
 *
 * Returns the Notification object, or null if the notification was not shown.
 */
export function showNotification(
  title: string,
  options: VibeMatchNotificationOptions = {},
): Notification | null {
  // Check browser support
  if (!isNotificationSupported()) return null;

  // Check permission
  if (Notification.permission !== "granted") return null;

  // Check if tab is focused — don't spam if user is already looking
  if (document.visibilityState === "visible" && document.hasFocus()) return null;

  // Check app settings
  if (!areNotificationsEnabledInSettings()) return null;

  try {
    const notification = new Notification(title, {
      body: options.body,
      icon: options.icon || "/favicon.ico",
      badge: options.badge,
      tag: options.tag,
      requireInteraction: options.requireInteraction ?? false,
      silent: options.silent ?? false,
      data: options.data,
    });

    // Auto-close after 6 seconds unless requireInteraction is set
    if (!options.requireInteraction) {
      setTimeout(() => notification.close(), 6000);
    }

    // Handle click — focus the window
    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  } catch (err) {
    console.warn("[Notifications] Failed to show notification:", err);
    return null;
  }
}

// ==================== CONVENIENCE METHODS ====================

/** Show a notification for a new match */
export function notifyMatchFound(sharedTags: string[], similarity: number): Notification | null {
  return showNotification("Match Found!", {
    body: `You share ${sharedTags.length} tag${sharedTags.length !== 1 ? "s" : ""} (${Math.round(similarity * 100)}% similarity)`,
    tag: "vibematch-match",
    requireInteraction: true,
    data: { type: "match_found", sharedTags, similarity },
  });
}

/** Show a notification for a new chat message */
export function notifyNewMessage(messagePreview: string): Notification | null {
  return showNotification("New Message", {
    body: messagePreview.length > 80 ? messagePreview.slice(0, 80) + "..." : messagePreview,
    tag: "vibematch-message",
    data: { type: "chat_message" },
  });
}

/** Show a notification when partner disconnects */
export function notifyPartnerDisconnected(): Notification | null {
  return showNotification("Stranger Disconnected", {
    body: "Your chat partner has left. Tap to find a new match.",
    tag: "vibematch-disconnect",
    data: { type: "disconnected" },
  });
}

/** Show a notification when partner is typing */
export function notifyPartnerTyping(): Notification | null {
  // Typing notifications are too frequent for browser notifications
  // — skip them. Included for completeness.
  return null;
}

// ==================== SETTINGS CHECK ====================

/**
 * Read the notifications setting from localStorage without React context.
 * This allows non-React code (like WebSocket handlers) to check the setting.
 */
function areNotificationsEnabledInSettings(): boolean {
  if (typeof window === "undefined") return true;

  try {
    const stored = localStorage.getItem("vibematch_settings");
    if (!stored) return true; // Default is enabled
    const parsed = JSON.parse(stored);
    return parsed.notificationsEnabled ?? true;
  } catch {
    return true;
  }
}
