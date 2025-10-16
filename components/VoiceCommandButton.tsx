import React from 'react';
import { MicrophoneIcon } from './icons';

interface VoiceCommandButtonProps {
  onClick: () => void;
}

export const VoiceCommandButton: React.FC<VoiceCommandButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 w-16 h-16 bg-indigo-600 rounded-full text-white flex items-center justify-center shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 transform transition-transform duration-200 hover:scale-110"
      aria-label="Start voice command"
    >
      <MicrophoneIcon />
      <span className="absolute w-full h-full bg-indigo-600 rounded-full animate-ping opacity-75"></span>
    </button>
  );
};
