import React from 'react';
import { MenuIcon } from './icons';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = React.memo(({ onMenuClick }) => {
  return (
    <header className="sticky top-0 z-10 flex items-center p-4 border-b border-slate-700 bg-slate-900/80 backdrop-blur-sm">
      <button 
        onClick={onMenuClick} 
        className="p-2 -ml-2 text-slate-300 rounded-md hover:bg-slate-700 md:hidden"
        aria-label="Toggle menu"
      >
        <MenuIcon />
      </button>
      <div className="ml-4 md:ml-0">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-sky-500">
          SMART MINDS
        </h1>
        <p className="text-sm text-teal-400/80">Digital Pathways to Rural Literacy</p>
      </div>
    </header>
  );
});