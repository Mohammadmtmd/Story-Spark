/**
 * Web Speech API Text-to-Speech (TTS) Service
 * Provides English pronunciation with accent selection (US/UK/AU) and speed control.
 */

import type { EnglishAccent } from '../types';

let voices: SpeechSynthesisVoice[] = [];

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve([]);
      return;
    }
    const current = window.speechSynthesis.getVoices();
    if (current.length > 0) {
      voices = current;
      resolve(current);
      return;
    }
    window.speechSynthesis.onvoiceschanged = () => {
      voices = window.speechSynthesis.getVoices();
      resolve(voices);
    };
  });
}

// Initial load
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
}

export async function speakEnglish(
  text: string,
  accent: EnglishAccent = 'en-US',
  rate: number = 0.9,
  onEnd?: () => void
): Promise<void> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this browser.');
    if (onEnd) onEnd();
    return;
  }

  // Cancel any currently playing utterance
  window.speechSynthesis.cancel();

  if (voices.length === 0) {
    await loadVoices();
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = accent;
  utterance.rate = Math.max(0.5, Math.min(1.5, rate));
  utterance.pitch = 1.05; // Slightly cheerful pitch for children

  // Find preferred voice matching accent
  const matchedVoice = voices.find(
    (v) => v.lang.toLowerCase() === accent.toLowerCase() || v.lang.startsWith(accent)
  ) || voices.find((v) => v.lang.startsWith('en'));

  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  if (onEnd) {
    utterance.onend = () => onEnd();
    utterance.onerror = () => onEnd();
  }

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
