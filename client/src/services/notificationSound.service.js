import { soundContent } from "./notification.service";

let configuration = null, context = null, state = "locked", activeSource = null, previewing = false;
let autoUnlockEnabled = false, unlockListenersAttached = false;
const buffers = new Map();
const debug = (message, details = {}) => { if (import.meta.env.DEV) console.debug("[AUDIO]", message, details); };
const audioError = (code, cause) => { const error = new Error(code, cause ? { cause } : undefined); error.code = code; return error; };

const getContext = () => {
  if (context) return context;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) throw audioError("AUDIO_UNSUPPORTED");
  context = new AudioContext();
  state = context.state === "running" ? "unlocked" : "locked";
  context.addEventListener?.("statechange", () => {
    state = context.state === "running" ? "unlocked" : "suspended";
    debug(`state=${context.state}`);
    if (state === "suspended" && autoUnlockEnabled) attachUnlockListeners();
  });
  debug("initialized");
  return context;
};

export const setSoundConfiguration = (value) => { configuration = value; };
export const unlockAudio = async () => {
  const ctx = getContext();
  if (ctx.state === "running") { state = "unlocked"; return true; }
  state = "unlocking";
  try {
    await ctx.resume();
    if (ctx.state !== "running") throw audioError("AUDIO_BLOCKED");
    const source = ctx.createBufferSource();
    source.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    source.connect(ctx.destination);
    source.start(0);
    state = "unlocked";
    debug("AudioContext resumed");
    return true;
  } catch (cause) {
    state = "locked";
    if (cause?.code === "AUDIO_BLOCKED") throw cause;
    throw audioError(cause?.name === "NotAllowedError" ? "AUDIO_BLOCKED" : "AUDIO_UNLOCK_FAILED", cause);
  }
};
export const isAudioUnlocked = () => Boolean(context && context.state === "running" && state === "unlocked");
export const getAudioState = () => state;

const unlockEvents = ["pointerdown", "click", "touchstart", "keydown"];
const detachUnlockListeners = () => {
  if (!unlockListenersAttached) return;
  unlockListenersAttached = false;
  unlockEvents.forEach((event) => window.removeEventListener(event, handleInteraction, true));
};
const handleInteraction = () => {
  debug("first interaction detected");
  unlockAudio().then(detachUnlockListeners).catch((error) => debug("unlock deferred", { error: error.code || error.name }));
};
function attachUnlockListeners() {
  if (typeof window === "undefined" || unlockListenersAttached || isAudioUnlocked()) return;
  unlockListenersAttached = true;
  unlockEvents.forEach((event) => window.addEventListener(event, handleInteraction, { capture: true, passive: true }));
}
export const installAudioUnlockListeners = () => {
  autoUnlockEnabled = true;
  attachUnlockListeners();
  return () => {
    autoUnlockEnabled = false;
    detachUnlockListeners();
  };
};

export const stopPreview = () => {
  try { activeSource?.stop(); } catch {}
  activeSource = null;
  previewing = false;
};

const builtin = (key, volume) => {
  const ctx = getContext();
  if (ctx.state !== "running") throw audioError("AUDIO_BLOCKED");
  const profiles = {
    STANDARD: [[660, .12], [880, .16]], STRONG: [[520, .1], [780, .12], [1040, .18]],
    SOFT: [[740, .16], [920, .24]], WARNING: [[440, .16], [440, .16], [620, .22]],
    CRITICAL: [[380, .12], [760, .14], [380, .12], [920, .22]],
  };
  let at = ctx.currentTime;
  for (const [frequency, duration] of profiles[key] || profiles.STANDARD) {
    const oscillator = ctx.createOscillator(), gain = ctx.createGain();
    oscillator.type = key === "SOFT" ? "sine" : "triangle";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(.0001, at);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0001, .28 * volume), at + .015);
    gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(at);
    oscillator.stop(at + duration + .01);
    at += duration * .82;
  }
};
const choose = (notification = {}, soundId) => {
  const sounds = configuration?.sounds || [], assignments = configuration?.assignments || [];
  const assigned = soundId || assignments.find((x) => x.scopeType === "EVENT" && x.scopeKey === notification.type)?.soundId || assignments.find((x) => x.scopeType === "CATEGORY" && x.scopeKey === (notification.category || "SYSTEM"))?.soundId || configuration?.settings?.defaultSoundId;
  return sounds.find((x) => Number(x.id) === Number(assigned)) || sounds.find((x) => x.builtinKey === "STANDARD");
};
const volumeFor = (notification, personal = 100) => {
  const settings = configuration?.settings || {}, priority = notification.priority || "NORMAL";
  const key = { NORMAL: "normalVolume", IMPORTANT: "importantVolume", WARNING: "warningVolume", CRITICAL: "criticalVolume" }[priority];
  const normal = Math.max(1, Number(settings.normalVolume ?? 70));
  return Math.min(1, Math.max(0, (Number(personal) / 100) * (Number(settings[key] ?? normal) / normal)));
};
const playUploaded = async (sound, level) => {
  const ctx = getContext();
  let buffer = buffers.get(sound.id);
  if (!buffer) {
    try {
      const blob = await soundContent(sound.id);
      buffer = await ctx.decodeAudioData(await blob.arrayBuffer());
      buffers.set(sound.id, buffer);
    } catch (cause) {
      const status = cause?.response?.status;
      debug("sound load failed", { status, soundId: sound.id });
      throw audioError(status ? `AUDIO_HTTP_${status}` : cause?.name === "EncodingError" ? "AUDIO_UNSUPPORTED_FORMAT" : "AUDIO_LOAD_FAILED", cause);
    }
  }
  const source = ctx.createBufferSource(), gain = ctx.createGain();
  source.buffer = buffer;
  gain.gain.value = level;
  source.connect(gain).connect(ctx.destination);
  activeSource = source;
  source.onended = () => { if (activeSource === source) activeSource = null; previewing = false; };
  source.start();
};

export async function playSound({ notification = {}, soundId = null, volume = 100, preview = false } = {}) {
  if (preview) stopPreview();
  if (!isAudioUnlocked()) throw audioError("AUDIO_BLOCKED");
  const sound = choose(notification, soundId), level = volumeFor(notification, volume);
  if (!sound || level <= 0) return;
  previewing = preview;
  try {
    if (sound.isBuiltin) builtin(sound.builtinKey, level);
    else await playUploaded(sound, level);
    debug("notification sound played", { event: notification.type || "PREVIEW" });
  } catch (error) {
    previewing = false;
    if (!sound.isBuiltin) {
      debug("custom sound failed; using Standard fallback", { error: error.code });
      builtin("STANDARD", level);
      return;
    }
    throw error;
  }
}
export const soundErrorMessage = (error) => {
  if (error?.code === "AUDIO_BLOCKED") return "Audio is waiting for your next browser interaction. Click anywhere, then test again.";
  if (error?.code === "AUDIO_UNSUPPORTED_FORMAT") return "This audio format is not supported by your browser.";
  if (error?.code?.startsWith("AUDIO_HTTP_")) return "The selected sound file is unavailable.";
  if (error?.code === "AUDIO_UNSUPPORTED") return "Notification audio is not supported by this browser.";
  return "Unable to play this sound. Please try another sound.";
};
export const previewSound = (soundId, volume = 100) => playSound({ soundId, volume, preview: true });
export const playNotificationSound = (notification, volume) => previewing ? Promise.resolve() : playSound({ notification, volume });
