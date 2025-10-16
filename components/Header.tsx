import React from 'react';
import { MenuIcon, XIcon } from './icons';

interface HeaderProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
}

export const Header: React.FC<HeaderProps> = React.memo(({ onMenuClick, isSidebarOpen }) => {
  return (
    <header className="sticky top-0 z-10 flex items-center p-4 border-b border-slate-700/50 bg-slate-950/80 backdrop-blur-sm">
      <button 
        onClick={onMenuClick} 
        className="p-2 -ml-2 text-slate-300 rounded-sm hover:bg-slate-700/50"
        aria-label="Toggle menu"
      >
        {isSidebarOpen ? <XIcon /> : <MenuIcon />}
      </button>
      <div className="ml-4">
        <h1 className="text-3xl font-bold text-cyan-400 font-mono tracking-wider">
          SMART MINDS
        </h1>
        <p className="text-sm text-cyan-400/70 font-mono">Digital Pathways to Rural Literacy</p>
      </div>
    </header>
  );
});