import { useState, useEffect, useCallback } from 'react';

// Define more specific types for Web Speech API events to avoid using `any`
interface SpeechRecognitionEvent {
    results: {
        [index: number]: {
            [index: number]: {
                transcript: string;
                confidence: number;
            };
        };
    };
}

interface SpeechRecognitionErrorEvent {
    error: string;
}

declare global {
    interface SpeechRecognition {
        continuous: boolean;
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        start(): void;
        stop(): void;
        abort(): void;
        onstart: (() => void) | null;
        onresult: ((event: SpeechRecognitionEvent) => void) | null;
        onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
        onend: (() => void) | null;
    }

    interface Window {
        SpeechRecognition: { new (): SpeechRecognition };
        webkitSpeechRecognition: { new (): SpeechRecognition };
    }
}

let recognition: SpeechRecognition | null = null;
if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
}

export const useSpeechRecognition = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);

    const startListening = useCallback(() => {
        if (!recognition) {
            setError("Speech recognition is not supported in this browser.");
            return;
        }
        if (isListening) return;
        
        recognition.start();

        recognition.onstart = () => {
            setIsListening(true);
            setTranscript('');
            setError(null);
        };

        recognition.onresult = (event) => {
            const currentTranscript = event.results[0][0].transcript;
            setTranscript(currentTranscript);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            setError(`Speech recognition error: ${event.error}`);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (!recognition || !isListening) return;
        recognition.stop();
        setIsListening(false);
    }, [isListening]);
    
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recognition) {
                recognition.abort();
            }
        };
    }, []);

    return {
        isListening,
        transcript,
        error,
        startListening,
        stopListening,
        browserSupportsSpeechRecognition: recognition !== null
    };
};