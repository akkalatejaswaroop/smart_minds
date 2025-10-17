import { useState, useEffect, useCallback, useRef } from 'react';

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

const browserSupportsSpeechRecognition = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

export const useSpeechRecognition = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    // This effect runs only once on mount to create the instance and handle cleanup
    useEffect(() => {
        if (!browserSupportsSpeechRecognition) {
            setError("Speech recognition is not supported in this browser.");
            return;
        }

        const SpeechRecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognitionApi();
        const recognition = recognitionRef.current;
        
        // Assign handlers here. They will be stable because the setters from useState are stable.
        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event) => setTranscript(event.results[0][0].transcript);
        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            setError(`Speech recognition error: ${event.error}`);
            setIsListening(false);
        };
        recognition.onend = () => setIsListening(false);

        return () => {
            recognition.abort();
        };
    }, []); // Empty deps - runs once.

    const startListening = useCallback(() => {
        const recognition = recognitionRef.current;
        if (recognition && !isListening) {
            setTranscript(''); // Reset transcript on start
            setError(null);
            recognition.continuous = false;
            recognition.lang = 'en-US';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;
            recognition.start();
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        const recognition = recognitionRef.current;
        if (recognition && isListening) {
            recognition.stop();
        }
    }, [isListening]);

    return {
        isListening,
        transcript,
        error,
        startListening,
        stopListening,
        browserSupportsSpeechRecognition,
    };
};
