import React, { useState, useCallback, useEffect } from 'react';
import { ContentDisplay } from './components/ContentDisplay';
import { SUBJECTS } from './constants/subjects';
import type { Subject, Concept, OutputType, GeneratedContent } from './types';
import { generateConceptMap, generateTextStream, generateQuiz } from './services/geminiService';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { MicrophoneIcon } from './components/icons';

const COMPETITIVE_EXAMS = ['GATE', 'UPSC', 'JEE', 'CAT', 'GRE'];

export const GeneratorView: React.FC = () => {
  const [studyMode, setStudyMode] = useState<'academic' | 'competitive'>('academic');
  const [competitiveExam, setCompetitiveExam] = useState<string>('GATE');
  
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(SUBJECTS[0]);
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(SUBJECTS[0].concepts[0]);
  const [outputType, setOutputType] = useState<OutputType>('explanation');
  
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [purpose, setPurpose] = useState<string>('preparing for a college exam');
  const [language, setLanguage] = useState<string>('English');
  
  const [customConcept, setCustomConcept] = useState('');
  const [generatedForConcept, setGeneratedForConcept] = useState<string | undefined>(undefined);

  const {
    transcript,
    isListening,
    startListening,
    stopListening,
  } = useSpeechRecognition();

  // Update custom concept from speech recognition
  useEffect(() => {
    if (transcript) {
      setCustomConcept(transcript);
    }
  }, [transcript]);

  // Reset selections when study mode or subject changes for better UX
  useEffect(() => {
    if (studyMode === 'academic') {
      if (selectedSubject) {
        setSelectedConcept(selectedSubject.concepts[0]);
      }
    } else {
      setSelectedConcept(null);
    }
    setCustomConcept(''); // Clear custom input on mode change
  }, [studyMode, selectedSubject]);


  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      setCustomConcept(''); // Clear input before listening
      startListening();
    }
  };


  const handleGenerateContent = useCallback(async () => {
    let subject: string;
    let concept: string | null = null;
    let effectivePurpose = purpose;

    // Determine subject and concept based on study mode and inputs
    if (studyMode === 'academic') {
        if (!selectedSubject) {
            setError('Please select an academic subject.');
            return;
        }
        subject = selectedSubject.name;
        
        // Prioritize custom concept input over the dropdown selection
        if (customConcept.trim()) {
            concept = customConcept.trim();
        } else if (selectedConcept) {
            concept = selectedConcept.name;
        } else {
            setError('Please select a concept from the list or enter a custom one.');
            return;
        }
    } else { // Competitive mode
        if (!customConcept.trim()) {
            setError('Please enter a concept for your competitive exam study.');
            return;
        }
        subject = `${competitiveExam} Exam Preparation`;
        concept = customConcept.trim();
        effectivePurpose = `preparing for the ${competitiveExam} exam`;
    }

    if (!concept) {
      setError('A concept is required to generate content.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedContent(null);
    setGeneratedForConcept(concept);

    const params = {
      outputType,
      subject,
      concept,
      purpose: effectivePurpose,
      language
    };

    try {
      if (outputType === 'concept-map') {
        const content = await generateConceptMap(params);
        setGeneratedContent(content);
      } else if (outputType === 'quiz') {
        const content = await generateQuiz(params);
        setGeneratedContent(content);
      } else {
        const stream = await generateTextStream(params);
        let accumulatedText = "";
        for await (const chunk of stream) {
          accumulatedText += chunk.text;
          setGeneratedContent({ text: accumulatedText });
        }
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate content. Please check your API key and try again. Details: ${errorMessage}`);
      setGeneratedContent(null);
    } finally {
      setIsLoading(false);
    }
  }, [studyMode, selectedSubject, selectedConcept, customConcept, competitiveExam, outputType, purpose, language]);
  
  return (
    <div className="flex flex-1 overflow-hidden">
        {/* Controls Panel */}
        <div className="w-80 flex-shrink-0 bg-gray-900/50 border-r border-gray-800 p-4 flex flex-col gap-6 overflow-y-auto">
            <h3 className="text-lg font-semibold text-white">Generator Controls</h3>
            
            <div>
                <label className="text-sm font-medium text-gray-400 block mb-2">Study Mode</label>
                <div className="flex bg-gray-800/50 rounded-lg p-1">
                    <button onClick={() => setStudyMode('academic')} className={`flex-1 px-3 py-1 text-sm font-medium rounded-md transition-colors ${studyMode === 'academic' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}>Academic</button>
                    <button onClick={() => setStudyMode('competitive')} className={`flex-1 px-3 py-1 text-sm font-medium rounded-md transition-colors ${studyMode === 'competitive' ? 'bg-blue-600 text-white' : 'hover:bg-gray-700'}`}>Competitive</button>
                </div>
            </div>

            {studyMode === 'academic' ? (
                <>
                    <div>
                        <label htmlFor="subject-select" className="text-sm font-medium text-gray-400 block mb-2">Subject</label>
                        <select id="subject-select" value={selectedSubject?.name || ''} onChange={e => setSelectedSubject(SUBJECTS.find(s => s.name === e.target.value) || null)} className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                            {SUBJECTS.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                        </select>
                    </div>
                    {selectedSubject && (
                        <div>
                            <label htmlFor="concept-select" className="text-sm font-medium text-gray-400 block mb-2">Concept</label>
                            <select id="concept-select" value={selectedConcept?.name || ''} onChange={e => setSelectedConcept(selectedSubject.concepts.find(c => c.name === e.target.value) || null)} className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                                {selectedSubject.concepts.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                    )}
                     <div>
                        <label htmlFor="custom-concept-input" className="text-sm font-medium text-gray-400 block mb-2">Or Enter Custom Concept</label>
                        <div className="relative">
                            <input id="custom-concept-input" type="text" value={customConcept} onChange={e => setCustomConcept(e.target.value)} placeholder="e.g., 'Quantum Entanglement'" className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 pl-3 pr-10 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
                            <button onClick={handleMicClick} className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white ${isListening ? 'text-blue-400 animate-pulse' : ''}`} aria-label="Use microphone to dictate concept">
                              <MicrophoneIcon />
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div>
                        <label htmlFor="exam-select" className="text-sm font-medium text-gray-400 block mb-2">Competitive Exam</label>
                        <select id="exam-select" value={competitiveExam} onChange={e => setCompetitiveExam(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                            {COMPETITIVE_EXAMS.map(exam => <option key={exam} value={exam}>{exam}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="custom-concept-input-comp" className="text-sm font-medium text-gray-400 block mb-2">Concept to Study</label>
                        <div className="relative">
                            <input id="custom-concept-input-comp" type="text" value={customConcept} onChange={e => setCustomConcept(e.target.value)} placeholder="e.g., 'ACID Properties in DBMS'" className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 pl-3 pr-10 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
                            <button onClick={handleMicClick} className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white ${isListening ? 'text-blue-400 animate-pulse' : ''}`} aria-label="Use microphone to dictate concept">
                              <MicrophoneIcon />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>

        {/* Content Display Area */}
        <ContentDisplay
            outputType={outputType}
            setOutputType={setOutputType}
            purpose={purpose}
            setPurpose={setPurpose}
            language={language}
            setLanguage={setLanguage}
            onGenerate={handleGenerateContent}
            generatedContent={generatedContent}
            isLoading={isLoading}
            error={error}
            conceptName={generatedForConcept}
        />
    </div>
  );
};