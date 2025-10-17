import React from 'react';
import { XIcon, BookOpenIcon, BrainCircuitIcon, FileTextIcon, MessageSquareIcon, DownloadIcon } from './icons';
import type { AppView } from '../App';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: AppView;
  onSetView: (view: AppView) => void;
}

export const Sidebar: React.FC<SidebarProps> = React.memo(({
  isOpen,
  onClose,
  currentView,
  onSetView,
}) => {

  const handleSetView = (view: AppView) => {
    onSetView(view);
    // Close sidebar on mobile after selection
    if (window.innerWidth < 768) {
      onClose();
    }
  }

  return (
    <aside className={`
      bg-slate-900/90 backdrop-blur-sm flex flex-col flex-shrink-0 overflow-hidden 
      transition-all duration-300 ease-in-out 
      fixed md:relative inset-y-0 left-0 z-30 transform md:translate-x-0
      ${isOpen ? 'w-80 translate-x-0 border-r border-slate-700/50' : 'w-0 -translate-x-full md:w-0 border-transparent'}
    `}>
      <div className="w-80 h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50 flex-shrink-0">
          <h2 className="text-lg font-semibold text-white font-mono">SMART MINDS</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-slate-400 rounded-sm md:hidden hover:bg-slate-700/50" aria-label="Close menu">
              <XIcon />
          </button>
        </div>

        {/* Navigation */}
        <div className="p-4 border-b border-slate-700/50">
           <h3 className="text-sm font-semibold text-slate-400 mb-2 font-mono uppercase tracking-wider">Navigation</h3>
           <div className="space-y-2">
              <button onClick={() => handleSetView('generator')} className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-sm text-sm font-medium transition-colors ${currentView === 'generator' ? 'bg-cyan-600 text-white' : 'hover:bg-slate-700/50'}`}>
                  <BrainCircuitIcon />
                  <span>AI Content Generator</span>
              </button>
              <button onClick={() => handleSetView('library')} className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-sm text-sm font-medium transition-colors ${currentView === 'library' ? 'bg-cyan-600 text-white' : 'hover:bg-slate-700/50'}`}>
                  <BookOpenIcon />
                  <span>Digital Library</span>
              </button>
              <button onClick={() => handleSetView('book-summarizer')} className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-sm text-sm font-medium transition-colors ${currentView === 'book-summarizer' ? 'bg-cyan-600 text-white' : 'hover:bg-slate-700/50'}`}>
                  <FileTextIcon />
                  <span>Book & Doc Analyzer</span>
              </button>
           </div>
        </div>
        
        {/* New AI Tools Navigation */}
        <div className="p-4 border-b border-slate-700/50">
           <h3 className="text-sm font-semibold text-slate-400 mb-2 font-mono uppercase tracking-wider">AI Tools</h3>
           <div className="space-y-2">
              <button onClick={() => handleSetView('tutor-chat')} className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-sm text-sm font-medium transition-colors ${currentView === 'tutor-chat' ? 'bg-cyan-600 text-white' : 'hover:bg-slate-700/50'}`}>
                  <MessageSquareIcon />
                  <span>AI Tutor Chat</span>
              </button>
           </div>
        </div>
        
        {/* Download App Section */}
        <div className="p-4 border-b border-slate-700/50">
           <h3 className="text-sm font-semibold text-slate-400 mb-2 font-mono uppercase tracking-wider">Get The App</h3>
           <a 
              href="https://appsgeyser.io/19158917/Smart-Minds" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-3 px-3 py-2 rounded-sm text-sm font-medium transition-colors bg-cyan-600 text-white hover:bg-cyan-500"
              aria-label="Download for Android"
            >
              <DownloadIcon />
              <span>Download for Android</span>
           </a>
        </div>


        {/* Contextual Controls */}
        <div className="flex-1 p-4 overflow-y-auto">
          {currentView === 'generator' && (
              <p className="text-xs text-slate-500">Enter any concept to generate educational content like explanations, presentations, quizzes, and concept maps.</p>
          )}
          {currentView === 'library' && (
              <p className="text-xs text-slate-500">Explore the Digital Library, read books, and use the AI summarizer to understand key concepts quickly.</p>
          )}
          {currentView === 'book-summarizer' && (
              <p className="text-xs text-slate-500">Analyze any book by its title or upload a document (PDF, DOCX) to get summaries, concept maps, quizzes, and more.</p>
          )}
          {currentView === 'tutor-chat' && (
              <p className="text-xs text-slate-500">Have a real-time conversation with an AI tutor. Ask questions and get clear explanations on any academic subject.</p>
          )}
        </div>

      </div>
    </aside>
  );
});