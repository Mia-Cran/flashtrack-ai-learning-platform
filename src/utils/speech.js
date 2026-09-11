export function canUseSpeech() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function stopSpeech() {
  if (canUseSpeech()) {
    window.speechSynthesis.cancel();
  }
}

const SKIP_VOICE = /compact|novelty|whisper|zarvox|trinoids|bells|boing|cellos|good news|bad news|pipe organ|fred|albert|junior|kathy|princess|ralph|bahh|bubbles|deranged|hysterical|superstar|wobble/i;

const ENGLISH_NAMES = [
  "Samantha",
  "Google US English",
  "Microsoft Aria",
  "Microsoft Jenny",
  "Nicky",
  "Karen",
  "Moira",
];

const SPANISH_NAMES = [
  "Paulina",
  "Google español de Estados Unidos",
  "Google español",
  "Microsoft Dalia",
  "Monica",
];

// The browser default is often a harsh "system" voice. Prefer a named
// natural voice in the learner's language when the device has one.
export function pickVoice(lang, voices = []) {
  const prefix = String(lang || "en-US")
    .toLowerCase()
    .slice(0, 2);
  const matching = voices.filter(
    (voice) =>
      voice?.lang &&
      voice.lang.toLowerCase().startsWith(prefix) &&
      !SKIP_VOICE.test(voice.name || ""),
  );

  const preferredNames = prefix === "es" ? SPANISH_NAMES : ENGLISH_NAMES;
  const preferred = matching.find((voice) =>
    preferredNames.some((name) => voice.name.includes(name)),
  );
  if (preferred) {
    return preferred;
  }

  return matching.find((voice) => voice.localService) || matching[0] || null;
}

export function speakText(text, { onStart, onEnd, lang } = {}) {
  if (!canUseSpeech() || !String(text || "").trim()) {
    return false;
  }

  stopSpeech();

  const utterance = new SpeechSynthesisUtterance(String(text).trim());
  utterance.rate = 0.88;
  utterance.pitch = 1;
  utterance.lang = lang || "en-US";
  const voices =
    typeof window.speechSynthesis.getVoices === "function"
      ? window.speechSynthesis.getVoices()
      : [];
  const voice = pickVoice(utterance.lang, voices);
  if (voice) {
    utterance.voice = voice;
  }
  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utterance);
  return true;
}

if (canUseSpeech() && typeof window.speechSynthesis.getVoices === "function") {
  window.speechSynthesis.getVoices();
}
