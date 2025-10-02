import React, { useEffect } from 'react';
import type { Subject, Concept } from '../types';
import { XIcon, MicrophoneIcon, BookOpenIcon, BrainCircuitIcon, FileTextIcon, ScaleIcon, MapIcon, MessageSquareIcon, CodeIcon, DownloadIcon } from './icons';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
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
      bg-slate-900 flex flex-col flex-shrink-0 overflow-hidden 
      transition-all duration-300 ease-in-out 
      fixed md:relative inset-y-0 left-0 z-30 transform md:translate-x-0
      ${isOpen ? 'w-80 translate-x-0 border-r border-slate-700' : 'w-0 -translate-x-full md:w-0 border-transparent'}
    `}>
      <div className="w-80 h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
          <h2 className="text-lg font-semibold text-white">SMART MINDS</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-slate-400 rounded-md md:hidden hover:bg-slate-700" aria-label="Close menu">
              <XIcon />
          </button>
        </div>

        {/* Navigation */}
        <div className="p-4 border-b border-slate-700">
           <h3 className="text-sm font-semibold text-slate-400 mb-2">Navigation</h3>
           <div className="space-y-2">
              <button onClick={() => handleSetView('generator')} className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md text-sm font-medium transition-colors ${currentView === 'generator' ? 'bg-indigo-700 text-white' : 'hover:bg-slate-800'}`}>
                  <BrainCircuitIcon />
                  <span>AI Content Generator</span>
              </button>
              <button onClick={() => handleSetView('library')} className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md text-sm font-medium transition-colors ${currentView === 'library' ? 'bg-indigo-700 text-white' : 'hover:bg-slate-800'}`}>
                  <BookOpenIcon />
                  <span>Digital Library</span>
              </button>
              <button onClick={() => handleSetView('book-summarizer')} className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md text-sm font-medium transition-colors ${currentView === 'book-summarizer' ? 'bg-indigo-700 text-white' : 'hover:bg-slate-800'}`}>
                  <FileTextIcon />
                  <span>Book & Doc Analyzer</span>
              </button>
           </div>
        </div>
        
        {/* New AI Tools Navigation */}
        <div className="p-4 border-b border-slate-700">
           <h3 className="text-sm font-semibold text-slate-400 mb-2">AI Tools</h3>
           <div className="space-y-2">
              <button onClick={() => handleSetView('debate-generator')} className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md text-sm font-medium transition-colors ${currentView === 'debate-generator' ? 'bg-indigo-700 text-white' : 'hover:bg-slate-800'}`}>
                  <ScaleIcon />
                  <span>Debate Generator</span>
              </button>
              <button onClick={() => handleSetView('learning-path')} className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md text-sm font-medium transition-colors ${currentView === 'learning-path' ? 'bg-indigo-700 text-white' : 'hover:bg-slate-800'}`}>
                  <MapIcon />
                  <span>Learning Path Creator</span>
              </button>
              <button onClick={() => handleSetView('tutor-chat')} className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md text-sm font-medium transition-colors ${currentView === 'tutor-chat' ? 'bg-indigo-700 text-white' : 'hover:bg-slate-800'}`}>
                  <MessageSquareIcon />
                  <span>AI Tutor Chat</span>
              </button>
              <button onClick={() => handleSetView('code-explainer')} className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md text-sm font-medium transition-colors ${currentView === 'code-explainer' ? 'bg-indigo-700 text-white' : 'hover:bg-slate-800'}`}>
                  <CodeIcon />
                  <span>Code Explainer</span>
              </button>
           </div>
        </div>
        
        {/* Download App Section */}
        <div className="p-4 border-b border-slate-700">
           <h3 className="text-sm font-semibold text-slate-400 mb-2">Get The App</h3>
           <a 
              href="https://appsgeyser.io/19158917/Smart-Minds" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-500"
              aria-label="Download for Android"
            >
              <DownloadIcon />
              <span>Download for Android</span>
           </a>
        </div>


        {/* Contextual Controls */}
        <div className="flex-1 p-4 overflow-y-auto">
          {currentView === 'generator' && (
              <p className="text-xs text-slate-500">Generate educational content like explanations, presentations, and quizzes for academic or competitive exam topics.</p>
          )}
          {currentView === 'library' && (
              <p className="text-xs text-slate-500">Explore the Digital Library, read books, and use the AI summarizer to understand key concepts quickly.</p>
          )}
          {currentView === 'book-summarizer' && (
              <p className="text-xs text-slate-500">Analyze any book by its title or upload a document (PDF, DOCX) to get summaries, concept maps, quizzes, and more.</p>
          )}
          {currentView === 'debate-generator' && (
              <p className="text-xs text-slate-500">Enter a topic to generate balanced arguments for both sides of a debate. A great tool for critical thinking.</p>
          )}
          {currentView === 'learning-path' && (
              <p className="text-xs text-slate-500">Define a learning goal, and the AI will create a customized, step-by-step learning path to guide your studies.</p>
          )}
          {currentView === 'tutor-chat' && (
              <p className="text-xs text-slate-500">Have a real-time conversation with an AI tutor. Ask questions and get clear explanations on any academic subject.</p>
          )}
          {currentView === 'code-explainer' && (
              <p className="text-xs text-slate-500">Paste a code snippet to get a detailed explanation of how it works or to find and fix potential bugs.</p>
          )}
        </div>

      </div>
    </aside>
  );
});