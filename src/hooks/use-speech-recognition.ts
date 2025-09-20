'use client';
import { useState, useCallback, useEffect, useRef } from 'react';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const useSpeechRecognition = () => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const isStartingRef = useRef(false); // Track if we're in the process of starting

  useEffect(() => {
    if (recognitionRef.current) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech Recognition API is not supported in this browser.');
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
      
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPart + ' ';
        } else {
          interimTranscript += transcriptPart;
        }
      }
      
      setTranscript(finalTranscript || interimTranscript);
    };
      
    recognition.onerror = (event: any) => {
      // The "no-speech" error is common and not a critical failure.
      // We can ignore it to avoid cluttering the console.
      if (event.error === 'no-speech') {
        setIsListening(false);
        isStartingRef.current = false;
        return;
      }
      console.error('Speech recognition error', event.error);
      setIsListening(false);
      isStartingRef.current = false;
    };
      
    recognition.onend = () => {
      setIsListening(false);
      isStartingRef.current = false;
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening && !isStartingRef.current) {
      isStartingRef.current = true;
      setTranscript('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        isStartingRef.current = false;
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && (isListening || isStartingRef.current)) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
      setIsListening(false);
      isStartingRef.current = false;
    }
  }, [isListening]);

  return {
    transcript,
    isListening,
    startListening,
    stopListening
  };
};
