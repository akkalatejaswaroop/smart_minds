import React from 'react';
import { MenuIcon } from './icons';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = React.memo(({ onMenuClick }) => {
  return (
    <header className="sticky top-0 z-10 flex items-center p-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
      <button 
        onClick={onMenuClick} 
        className="p-2 -ml-2 text-gray-300 rounded-md hover:bg-gray-700"
        aria-label="Toggle menu"
      >
        <MenuIcon />
      </button>
      <div className="ml-4 md:ml-0">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-sky-400">
          SMART MINDS
        </h1>
        <p className="text-sm text-blue-400/80">Digital Pathways to Rural Literacy</p>
      </div>
    </header>
  );
});