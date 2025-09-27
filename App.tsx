import React, { useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ContentDisplay } from './components/ContentDisplay';
import { Header } from './components/Header';
import { SUBJECTS } from './constants/subjects';
import type { Subject, Concept, OutputType, GeneratedContent } from './types';
import { generateConceptMap, generateTextStream, generateQuiz } from './services/geminiService';

const App: React.FC = () => {
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
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(window.innerWidth >= 768);
  
  const [customConcept, setCustomConcept] = useState('');
  const [generatedForConcept, setGeneratedForConcept] = useState<string | undefined>(undefined);

  const handleGenerateContent = useCallback(async () => {
    let subject: string;
    let concept: string | null = null;
    let effectivePurpose = purpose;

    if (studyMode === 'academic') {
        if (!selectedSubject || !selectedConcept) {
            setError('Please select an academic subject and concept.');
            return;
        }
        subject = selectedSubject.name;
        concept = selectedConcept.name;
    } else { // Competitive mode
        if (!customConcept) {
            setError('Please enter a concept for your competitive exam study.');
            return;
        }
        subject = `${competitiveExam} Exam Preparation`;
        concept = customConcept;
        // Override purpose for more context
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
  }, [studyMode, selectedSubject, selectedConcept, competitiveExam, customConcept, outputType, purpose, language]);
  
  const handleStudyModeChange = (mode: 'academic' | 'competitive') => {
    setStudyMode(mode);
    // Reset selections when mode changes
    if (mode === 'academic') {
      setSelectedSubject(SUBJECTS[0]);
      setSelectedConcept(SUBJECTS[0].concepts[0]);
      setCustomConcept('');
    } else {
      setSelectedSubject(null);
      setSelectedConcept(null);
      // Keep customConcept as it's the main input for competitive mode
    }
  };

  const handleSelectSubject = useCallback((subject: Subject) => {
    setSelectedSubject(subject);
    setSelectedConcept(subject.concepts[0] || null);
    setCustomConcept('');
  }, []);

  const handleSelectConcept = useCallback((concept: Concept) => {
    setSelectedConcept(concept);
    setCustomConcept('');
    if (window.innerWidth < 768) { // md breakpoint
      setIsSidebarOpen(false);
    }
  }, []);

  const handleCompetitiveExamChange = (exam: string) => {
    setCompetitiveExam(exam);
  };
  
  const handleCustomConceptChange = (value: string) => {
    setCustomConcept(value);
    // If user starts typing a custom concept, ensure we are not in a curriculum-locked state
    if (value && studyMode === 'academic') {
      setSelectedSubject(null);
      setSelectedConcept(null);
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-900 text-gray-300 font-sans flex">
      <Sidebar
        subjects={SUBJECTS}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        
        studyMode={studyMode}
        onStudyModeChange={handleStudyModeChange}
        
        selectedSubject={selectedSubject}
        onSelectSubject={handleSelectSubject}
        
        selectedConcept={selectedConcept}
        onSelectConcept={handleSelectConcept}
        
        competitiveExam={competitiveExam}
        onCompetitiveExamChange={handleCompetitiveExamChange}

        customConcept={customConcept}
        onCustomConceptChange={handleCustomConceptChange}
      />
      {isSidebarOpen && (
          <div 
              onClick={() => setIsSidebarOpen(false)} 
              className="fixed inset-0 bg-black/60 z-20 md:hidden"
              aria-hidden="true"
          />
      )}
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setIsSidebarOpen(prev => !prev)} />
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
      </main>
    </div>
  );
};

export default App;
