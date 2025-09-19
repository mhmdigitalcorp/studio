'use client';
import { useState, useEffect, useRef } from 'react';

interface SpeechRecognitionHook {
  listening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
}

// Add a global type for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function useSpeechRecognition(): SpeechRecognitionHook {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech Recognition API is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onend = () => {
      // It might stop due to silence, restart it if we want continuous listening.
      if (recognitionRef.current && !recognitionRef.current.manualStop) {
        try {
          recognition.start();
        } catch (error) {
          // It might fail if it's already starting
        }
      } else {
        setListening(false);
      }
    };

    recognition.onresult = (event: any) => {
      const lastResult = event.results[event.results.length - 1];
      if (lastResult.isFinal) {
        const command = lastResult[0].transcript.trim().toLowerCase();
        setTranscript(command);

        // Reset transcript after a short delay to allow command processing
        setTimeout(() => setTranscript(''), 100);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
       if (event.error === 'no-speech' || event.error === 'network') {
         // Automatically restart on some common, non-critical errors.
        if (recognitionRef.current && !recognitionRef.current.manualStop) {
          setTimeout(() => {
             try {
              recognition.start();
            } catch(e) {}
          }, 100);
        }
      } else {
         setListening(false);
      }
    };
    
    recognitionRef.current = recognition;
    recognitionRef.current.manualStop = false;

    return () => {
      recognitionRef.current.manualStop = true;
      recognition.stop();
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !listening) {
      try {
        recognitionRef.current.manualStop = false;
        recognitionRef.current.start();
      } catch (error) {
         console.error("Could not start recognition:", error);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && listening) {
      recognitionRef.current.manualStop = true;
      recognitionRef.current.stop();
    }
  };

  return { listening, transcript, startListening, stopListening };
}
