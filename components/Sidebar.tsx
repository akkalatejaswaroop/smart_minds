import React, { useEffect } from 'react';
import type { Subject, Concept } from '../types';
import { XIcon, MicrophoneIcon } from './icons';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

interface SidebarProps {
  subjects: Subject[];
  isOpen: boolean;
  onClose: () => void;
  
  studyMode: 'academic' | 'competitive';
  onStudyModeChange: (mode: 'academic' | 'competitive') => void;

  selectedSubject: Subject | null;
  onSelectSubject: (subject: Subject) => void;

  selectedConcept: Concept | null;
  onSelectConcept: (concept: Concept) => void;

  competitiveExam: string;
  onCompetitiveExamChange: (exam: string) => void;

  customConcept: string;
  onCustomConceptChange: (value: string) => void;
}

const COMPETITIVE_EXAMS = ['GATE', 'UPSC', 'JEE', 'CAT', 'GRE'];

export const Sidebar: React.FC<SidebarProps> = React.memo(({
  subjects,
  isOpen,
  onClose,
  studyMode,
  onStudyModeChange,
  selectedSubject,
  onSelectSubject,
  selectedConcept,
  onSelectConcept,
  competitiveExam,
  onCompetitiveExamChange,
  customConcept,
  onCustomConceptChange,
}) => {
  const {
      transcript,
      isListening,
      startListening,
      stopListening,
      browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  useEffect(() => {
      if (transcript) {
          onCustomConceptChange(transcript);
      }
  }, [transcript, onCustomConceptChange]);

  const handleMicClick = () => {
      if (isListening) {
          stopListening();
      } else {
          onCustomConceptChange(''); // Clear input before listening
          startListening();
      }
  };

  const handleSubjectDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subject = subjects.find(s => s.name === e.target.value);
    if (subject) {
      onSelectSubject(subject);
    }
  };
  
  const handleConceptDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const concept = selectedSubject?.concepts.find(c => c.name === e.target.value);
    if (concept) {
      onSelectConcept(concept);
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

        <div className="p-4 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">Generate Your Own</h3>
          <div className="relative">
              <input
                  type="text"
                  placeholder={studyMode === 'competitive' ? `Enter topic for ${competitiveExam}...` : "Enter any concept..."}
                  value={customConcept}
                  onChange={(e) => onCustomConceptChange(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 pl-3 pr-10 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  aria-label="Enter a custom concept"
              />
              {browserSupportsSpeechRecognition && (
                  <button 
                      onClick={handleMicClick}
                      className={`absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white ${isListening ? 'text-blue-400 animate-pulse' : ''}`}
                      aria-label={isListening ? 'Stop listening' : 'Start voice input'}
                  >
                      <MicrophoneIcon />
                  </button>
              )}
          </div>
          {isListening && <p className="text-xs text-blue-400 mt-1">Listening...</p>}
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Curriculum Selector</h3>
            
            <div className="mb-4">
              <label htmlFor="study-mode" className="block text-xs font-medium text-gray-400 mb-1">Study Mode</label>
              <select 
                id="study-mode"
                value={studyMode}
                onChange={(e) => onStudyModeChange(e.target.value as 'academic' | 'competitive')}
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="academic">Academic</option>
                <option value="competitive">Competitive</option>
              </select>
            </div>

            {studyMode === 'academic' && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="subject" className="block text-xs font-medium text-gray-400 mb-1">Subject</label>
                  <select 
                    id="subject" 
                    value={selectedSubject?.name || ''}
                    onChange={handleSubjectDropdownChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="" disabled>Select a Subject</option>
                    {subjects.map(subject => (
                      <option key={subject.name} value={subject.name}>{subject.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="concept" className="block text-xs font-medium text-gray-400 mb-1">Concept</label>
                  <select 
                    id="concept"
                    value={selectedConcept?.name || ''}
                    onChange={handleConceptDropdownChange}
                    disabled={!selectedSubject}
                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-800/50 disabled:cursor-not-allowed"
                  >
                    <option value="" disabled>Select a Concept</option>
                    {selectedSubject?.concepts.map(concept => (
                      <option key={concept.name} value={concept.name}>{concept.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            
            {studyMode === 'competitive' && (
              <div>
                 <label htmlFor="exam" className="block text-xs font-medium text-gray-400 mb-1">Exam</label>
                 <select 
                  id="exam"
                  value={competitiveExam}
                  onChange={(e) => onCompetitiveExamChange(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-md px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {COMPETITIVE_EXAMS.map(exam => (
                    <option key={exam} value={exam}>{exam}</option>
                  ))}
                 </select>
              </div>
            )}
        </div>
      </div>
    </aside>
  );
});
