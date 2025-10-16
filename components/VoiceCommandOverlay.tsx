import React from 'react';
import { MicrophoneIcon, XIcon } from './icons';

interface VoiceCommandOverlayProps {
  isOpen: boolean;
  isListening: boolean;
  onClose: () => void;
}

export const VoiceCommandOverlay: React.FC<VoiceCommandOverlayProps> = ({ isOpen, isListening, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="relative w-full max-w-md text-center"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-8 -right-4 p-2 text-slate-400 rounded-full hover:bg-slate-700 hover:text-white"
          aria-label="Close voice command overlay"
        >
          <XIcon />
        </button>
        <div className={`relative w-32 h-32 mx-auto rounded-full flex items-center justify-center transition-colors duration-300 ${isListening ? 'bg-indigo-500/30' : 'bg-slate-700/50'}`}>
          <div className={`absolute w-full h-full rounded-full ${isListening ? 'animate-pulse bg-indigo-500/50' : ''}`}></div>
          <MicrophoneIcon />
        </div>
        <h2 className="mt-6 text-2xl font-bold text-white">
          {isListening ? "Listening..." : "Preparing..."}
        </h2>
        <p className="mt-2 text-slate-400">
          Try saying: "Open content generator", "Start a debate", or "Go to the digital library".
        </p>
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};
