export function canUseSpeech() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function stopSpeech() {
  if (canUseSpeech()) {
    window.speechSynthesis.cancel();
  }
}

export function speakText(text, { onStart, onEnd } = {}) {
  if (!canUseSpeech() || !String(text || "").trim()) {
    return false;
  }

  stopSpeech();

  const utterance = new SpeechSynthesisUtterance(String(text).trim());
  utterance.rate = 0.95;
  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utterance);
  return true;
}
