// Guide Step 10: the mouth. Short French replies through the browser's
// speech synthesis (works in Brave, Chrome, Edge, Safari — each OS picks
// its own French voice). If no French voice exists, replies stay text-only.

let voice: SpeechSynthesisVoice | null = null;

function findFrenchVoice(): SpeechSynthesisVoice | null {
  const synth = window.speechSynthesis;
  if (!synth) return null;
  const voices = synth.getVoices();
  if (voices.length === 0) return null;
  const fr = voices.filter((v) => v.lang.toLowerCase().startsWith('fr'));
  if (fr.length === 0) return null;
  // Prefer a France voice, then any local French voice.
  return (
    fr.find((v) => v.lang.toLowerCase() === 'fr-fr' && v.localService) ||
    fr.find((v) => v.lang.toLowerCase() === 'fr-fr') ||
    fr.find((v) => v.localService) ||
    fr[0]
  );
}

export function initCardinalVoice(): void {
  if (!('speechSynthesis' in window)) return;
  voice = findFrenchVoice();
  // Chrome loads voices asynchronously — retry when they arrive.
  window.speechSynthesis.onvoiceschanged = () => {
    if (!voice) voice = findFrenchVoice();
  };
}

export function hasFrenchVoice(): boolean {
  return voice !== null || findFrenchVoice() !== null;
}

export function stopSpeaking(): void {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

export function isSpeaking(): boolean {
  return 'speechSynthesis' in window && window.speechSynthesis.speaking;
}

// Speak one short sentence, then call back. Never queues: a new reply
// always replaces the current one.
export function speak(text: string, onDone?: () => void): void {
  if (!('speechSynthesis' in window)) {
    onDone?.();
    return;
  }
  if (!voice) voice = findFrenchVoice();
  window.speechSynthesis.cancel();
  if (!text.trim() || !voice) {
    onDone?.();
    return;
  }
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = 1.02;
  u.onend = () => onDone?.();
  u.onerror = () => onDone?.();
  window.speechSynthesis.speak(u);
}
