import React, { useEffect } from 'react';
import type { Subject, Concept } from '../types';
import { XIcon, MicrophoneIcon, BookOpenIcon, BrainCircuitIcon, FileTextIcon } from './icons';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import type { AppView } from '../App';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: AppView;
  onSetView: (view: AppView) => void;
  
  // The following props are now managed by GeneratorView.
  // In a larger app, this would be handled via context.
  // For now, we render the generator controls statically.
  // studyMode: 'academic' | 'competitive';
  // onStudyModeChange: (mode: 'academic' | 'competitive') => void;
  // selectedSubject: Subject | null;
  // onSelectSubject: (subject: Subject) => void;
  // selectedConcept: Concept | null;
  // onSelectConcept: (concept: Concept) => void;
  // competitiveExam: string;
  // onCompetitiveExamChange: (exam: string) => void;
  // customConcept: string;
  // onCustomConceptChange: (value: string) => void;
}

const COMPETITIVE_EXAMS = ['GATE', 'UPSC', 'JEE', 'CAT', 'GRE'];

export const Sidebar: React.FC<SidebarProps> = React.memo(({
  isOpen,
  onClose,
  currentView,
  onSetView,
}) => {
  const {
      transcript,
      isListening,
      startListening,
      stopListening,
      browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  // This effect is for the custom concept input which is part of the generator.
  // It's left here to show how it would work, but the state `onCustomConceptChange`
  // needs to be connected to GeneratorView.
  // useEffect(() => {
  //     if (transcript) {
  //         onCustomConceptChange(transcript);
  //     }
  // }, [transcript, onCustomConceptChange]);

  const handleMicClick = () => {
      if (isListening) {
          stopListening();
      } else {
          // onCustomConceptChange(''); // Clear input before listening
          startListening();
      }
  };


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
              <button onClick={() => onSetView('generator')} className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md text-sm font-medium transition-colors ${currentView === 'generator' ? 'bg-teal-600 text-white' : 'hover:bg-slate-800'}`}>
                  <BrainCircuitIcon />
                  <span>AI Generator</span>
              </button>
              <button onClick={() => onSetView('library')} className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md text-sm font-medium transition-colors ${currentView === 'library' ? 'bg-teal-600 text-white' : 'hover:bg-slate-800'}`}>
                  <BookOpenIcon />
                  <span>Digital Library</span>
              </button>
              <button onClick={() => onSetView('book-summarizer')} className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md text-sm font-medium transition-colors ${currentView === 'book-summarizer' ? 'bg-teal-600 text-white' : 'hover:bg-slate-800'}`}>
                  <FileTextIcon />
                  <span>Book Summarizer</span>
              </button>
           </div>
        </div>

        {/* Contextual Controls */}
        <div className="flex-1 p-4 overflow-y-auto">
          {currentView === 'generator' ? (
            <>
              <h3 className="text-sm font-semibold text-slate-400 mb-2">Generator Info</h3>
              <p className="text-xs text-slate-500">Use the controls in the main view to select a topic and generate educational content like explanations, presentations, and quizzes.</p>
            </>
          ) : null}
          {currentView === 'library' ? (
            <>
              <h3 className="text-sm font-semibold text-slate-400 mb-2">Library Info</h3>
              <p className="text-xs text-slate-500">The Digital Library contains a collection of books and an AI-powered summarizer. Use the search bar in the main view to find books.</p>
            </>
          ) : null}
          {currentView === 'book-summarizer' ? (
            <>
              <h3 className="text-sm font-semibold text-slate-400 mb-2">Book Summarizer Info</h3>
              <p className="text-xs text-slate-500">Enter any book title to get AI-generated summaries, key concepts, character lists, quizzes, and more. This tool uses the model's broad knowledge to analyze books that are not in our digital library.</p>
            </>
          ) : null}
        </div>

      </div>
    </aside>
  );
});