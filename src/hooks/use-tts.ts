'use client';
import { useCallback } from 'react';

export const useTTS = () => {
  const speak = useCallback(async (text: string) => {
    // Stop any currently speaking utterance before starting a new one
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      
      return new Promise<void>((resolve, reject) => {
        utterance.onend = () => resolve();
        utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
            // Create a more informative error object
            reject(new Error(`Speech synthesis error: ${event.error}`));
        };
        window.speechSynthesis.speak(utterance);
      });
    } else {
      console.warn('Text-to-Speech is not supported in this browser.');
      return Promise.resolve();
    }
  }, []);

  return { speak };
};
