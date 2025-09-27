import { useState, useEffect, useCallback } from 'react';

const LANG_CODE_MAP: { [key: string]: string } = {
  'English': 'en-US',
  'Spanish': 'es-ES',
  'French': 'fr-FR',
  'German': 'de-DE',
  'Hindi': 'hi-IN',
  'Mandarin': 'zh-CN',
  'Telugu': 'te-IN'
};

export const useTextToSpeech = (text: string, language: string) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const checkSupport = typeof window !== 'undefined' && 'speechSynthesis' in window;
    setIsAvailable(checkSupport);
    
    if (checkSupport) {
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        if (availableVoices.length > 0) {
          setVoices(availableVoices);
        }
      };
      
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;

      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);
  
  const speak = useCallback(() => {
    if (!isAvailable || !text) return;
    
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const langCode = LANG_CODE_MAP[language] || 'en-US';
    
    utterance.lang = langCode;
    const selectedVoice = voices.find(voice => voice.lang === langCode) || voices.find(voice => voice.lang.startsWith(langCode.split('-')[0]));
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
      console.error("Speech synthesis error:", e.error);
      setIsSpeaking(false);
    };
    
    window.speechSynthesis.speak(utterance);
  }, [text, isAvailable, language, voices]);

  const cancel = useCallback(() => {
    if (!isAvailable) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isAvailable]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (isAvailable) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isAvailable]);

  return { isSpeaking, isAvailable, speak, cancel };
};