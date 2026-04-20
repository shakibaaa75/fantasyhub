/**
 * Sound utility — Web Audio API based sound effects for VibeMatch.
 *
 * No external audio files needed. All sounds are synthesized at runtime
 * using oscillators and gain nodes. This keeps the bundle small and
 * eliminates network requests for audio assets.
 *
 * Usage:
 *   import { playSound } from "@/lib/sounds";
 *   playSound("matchFound");   // plays a pleasant chime
 *   playSound("message");      // plays a soft pop
 */

// ==================== AUDIO ENGINE ====================

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();
  }
  // Resume if suspended (browser autoplay policy)
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

// ==================== SOUND DEFINITIONS ====================

export type SoundName =
  | "matchFound"
  | "message"
  | "messageSent"
  | "typing"
  | "skip"
  | "disconnect"
  | "searching"
  | "error"
  | "notification";

interface SoundDefinition {
  /** Play this sound definition at the given volume (0–1) */
  play: (ctx: AudioContext, volume: number) => void;
}

// Each sound is a function that creates oscillator nodes on demand.
// They are ephemeral — created, played, and garbage collected.

const sounds: Record<SoundName, SoundDefinition> = {
  // ─── MATCH FOUND ─────────────────────────────────────
  // A pleasant two-tone chime (C5 → E5) that signals a successful match
  matchFound: {
    play(ctx, volume) {
      const now = ctx.currentTime;

      // First tone — C5 (523 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(volume * 0.4, now + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc1.connect(gain1).connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.4);

      // Second tone — E5 (659 Hz), slightly delayed
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(659.25, now + 0.12);
      gain2.gain.setValueAtTime(0, now + 0.12);
      gain2.gain.linearRampToValueAtTime(volume * 0.35, now + 0.17);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2).connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.55);

      // Shimmer overlay — high harmonic
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = "triangle";
      osc3.frequency.setValueAtTime(1046.5, now + 0.12);
      gain3.gain.setValueAtTime(0, now + 0.12);
      gain3.gain.linearRampToValueAtTime(volume * 0.12, now + 0.17);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc3.connect(gain3).connect(ctx.destination);
      osc3.start(now + 0.12);
      osc3.stop(now + 0.5);
    },
  },

  // ─── INCOMING MESSAGE ────────────────────────────────
  // A soft bubble pop sound
  message: {
    play(ctx, volume) {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.08);

      gain.gain.setValueAtTime(volume * 0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    },
  },

  // ─── MESSAGE SENT ────────────────────────────────────
  // A subtle click/confirm sound
  messageSent: {
    play(ctx, volume) {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.04);

      gain.gain.setValueAtTime(volume * 0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    },
  },

  // ─── TYPING INDICATOR ────────────────────────────────
  // Very subtle tick
  typing: {
    play(ctx, volume) {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, now);

      gain.gain.setValueAtTime(volume * 0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.03);
    },
  },

  // ─── SKIP / NEXT ─────────────────────────────────────
  // A short descending whoosh
  skip: {
    play(ctx, volume) {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.2);

      gain.gain.setValueAtTime(volume * 0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    },
  },

  // ─── DISCONNECT ──────────────────────────────────────
  // A low thud
  disconnect: {
    play(ctx, volume) {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);

      gain.gain.setValueAtTime(volume * 0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    },
  },

  // ─── SEARCHING ───────────────────────────────────────
  // A gentle pulsing tone
  searching: {
    play(ctx, volume) {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(494, now + 0.15);
      osc.frequency.setValueAtTime(440, now + 0.3);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume * 0.15, now + 0.05);
      gain.gain.setValueAtTime(volume * 0.15, now + 0.15);
      gain.gain.linearRampToValueAtTime(volume * 0.18, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    },
  },

  // ─── ERROR ───────────────────────────────────────────
  // A dissonant buzz
  error: {
    play(ctx, volume) {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "square";
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.setValueAtTime(150, now + 0.1);

      gain.gain.setValueAtTime(volume * 0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    },
  },

  // ─── NOTIFICATION ────────────────────────────────────
  // A gentle bell-like ping
  notification: {
    play(ctx, volume) {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(784, now); // G5

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(volume * 0.3, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    },
  },
};

// ==================== PUBLIC API ====================

/**
 * playSound — Play a named sound effect.
 *
 * @param name   Which sound to play (e.g. "matchFound", "message")
 * @param volume Override volume 0–1 (default: reads from settings)
 */
export function playSound(name: SoundName, volume?: number): void {
  try {
    const ctx = getAudioContext();
    const soundDef = sounds[name];
    if (!soundDef) {
      console.warn(`[Sounds] Unknown sound: "${name}"`);
      return;
    }

    // If no volume override, read from settings
    const vol = volume ?? getSettingsVolume();
    if (vol <= 0) return; // Muted

    soundDef.play(ctx, vol);
  } catch (err) {
    // Fail silently — sounds are non-critical
    console.warn("[Sounds] Playback failed:", err);
  }
}

/**
 * Get the current volume from settings (without importing React context).
 * Falls back to 0.5 if settings aren't available.
 */
function getSettingsVolume(): number {
  if (typeof window === "undefined") return 0.5;

  try {
    const stored = localStorage.getItem("vibematch_settings");
    if (!stored) return 0.5;
    const parsed = JSON.parse(stored);
    if (!parsed.soundEnabled) return 0;
    return parsed.soundVolume ?? 0.5;
  } catch {
    return 0.5;
  }
}

/**
 * preloadAudioContext — Call this on first user interaction (e.g. button click)
 * to unlock the AudioContext. Browsers require a user gesture before audio
 * can play. Calling this early prevents a delay on the first sound.
 */
export function preloadAudioContext(): void {
  try {
    getAudioContext();
  } catch {
    // Ignore
  }
}
