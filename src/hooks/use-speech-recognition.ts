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
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const recognitionRef = useRef<any>(null);
  const isStartingRef = useRef(false);

  const browserSupportsSpeechRecognition = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    if (!browserSupportsSpeechRecognition) return;

    navigator.permissions.query({ name: 'microphone' as PermissionName }).then((permissionStatus) => {
      setMicPermission(permissionStatus.state);
      permissionStatus.onchange = () => {
        setMicPermission(permissionStatus.state);
      };
    });

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
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
      if (event.error === 'no-speech' || event.error === 'aborted') {
        // These are not critical errors, just the mic timing out or being stopped.
      } else if (event.error === 'not-allowed') {
        setMicPermission('denied');
        console.warn('Speech recognition permission denied.');
      } else {
        console.error('Speech recognition error', event.error);
      }
      isStartingRef.current = false;
      setIsListening(false);
    };

    recognition.onend = () => {
      isStartingRef.current = false;
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, [browserSupportsSpeechRecognition]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening && !isStartingRef.current && micPermission === 'granted') {
      isStartingRef.current = true;
      setTranscript('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        isStartingRef.current = false;
      }
    } else if (micPermission !== 'granted') {
      console.warn("Cannot start listening: Microphone permission not granted.");
    }
  }, [isListening, micPermission]);

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
    stopListening,
    micPermission,
    browserSupportsSpeechRecognition
  };
};
