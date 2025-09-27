import React, { useEffect } from 'react';
import type { Subject, Concept } from '../types';
import { XIcon, MicrophoneIcon, BookOpenIcon, BrainCircuitIcon } from './icons';
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
      bg-gray-900 flex flex-col flex-shrink-0 overflow-hidden 
      transition-all duration-300 ease-in-out 
      fixed md:relative inset-y-0 left-0 z-30 transform md:translate-x-0
      ${isOpen ? 'w-80 translate-x-0 border-r border-gray-800' : 'w-0 -translate-x-full md:w-0 border-transparent'}
    `}>
      <div className="w-80 h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-800 flex-shrink-0">
          <h2 className="text-lg font-semibold text-white">SMART MINDS</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-gray-400 rounded-md hover:bg-gray-700" aria-label="Close menu">
              <XIcon />
          </button>
        </div>

        {/* Navigation */}
        <div className="p-4 border-b border-gray-800">
           <h3 className="text-sm font-semibold text-gray-400 mb-2">Navigation</h3>
           <div className="space-y-2">
              <button onClick={() => onSetView('generator')} className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md text-sm font-medium transition-colors ${currentView === 'generator' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800'}`}>
                  <BrainCircuitIcon />
                  <span>AI Generator</span>
              </button>
              <button onClick={() => onSetView('library')} className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md text-sm font-medium transition-colors ${currentView === 'library' ? 'bg-blue-600 text-white' : 'hover:bg-gray-800'}`}>
                  <BookOpenIcon />
                  <span>Digital Library</span>
              </button>
           </div>
        </div>

        {/* Contextual Controls */}
        <div className="flex-1 p-4 overflow-y-auto">
          {currentView === 'generator' ? (
            <>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Generator Controls</h3>
              <p className="text-xs text-gray-500">Generator controls are now managed within the Generator view. This panel would contain them in a fully-connected app.</p>
              {/* 
                The controls from the original sidebar would be rendered here,
                with their state and handlers passed down from GeneratorView,
                likely via context in a larger application.
              */}
            </>
          ) : (
            <>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Library Info</h3>
              <p className="text-xs text-gray-500">The Digital Library contains a collection of books and an AI-powered summarizer. Use the search bar in the main view to find books.</p>
            </>
          )}
        </div>

      </div>
    </aside>
  );
});
