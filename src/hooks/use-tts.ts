'use client';
import { useCallback, useState, useRef } from 'react';

export const useTTS = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback(async (text: string) => {
    // Stop any currently speaking utterance before starting a new one
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utteranceRef.current = utterance;
      
      return new Promise<void>((resolve, reject) => {
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
          setIsSpeaking(false);
          utteranceRef.current = null;
          resolve();
        };
        utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
            setIsSpeaking(false);
            utteranceRef.current = null;
            if (event.error === 'interrupted' || event.error === 'canceled') {
              resolve(); // Resolve promise if speech is intentionally stopped
              return;
            }
            reject(new Error(`Speech synthesis error: ${event.error}`));
        };
        window.speechSynthesis.speak(utterance);
      });
    } else {
      console.warn('Text-to-Speech is not supported in this browser.');
      return Promise.resolve();
    }
  }, []);

  return { speak, isSpeaking };
};
