import React, { useState, useCallback, useEffect } from 'react';
import { ContentDisplay } from './components/ContentDisplay';
import type { OutputType, GeneratedContent } from './types';
import { generateConceptMap, generateTextStream, generateQuiz } from './services/geminiService';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { MicrophoneIcon } from './components/icons';

const GeneratorView: React.FC = () => {
  const [outputType, setOutputType] = useState<OutputType>('explanation');
  
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [purpose, setPurpose] = useState<string>('preparing for a college exam');
  const [language, setLanguage] = useState<string>('English');
  const [complexity, setComplexity] = useState<number>(2); // 1: Simple, 2: Intermediate, 3: Advanced, 4: Expert
  
  const [conceptInput, setConceptInput] = useState('');
  const [generatedForConcept, setGeneratedForConcept] = useState<string | undefined>(undefined);

  const {
    transcript,
    isListening,
    startListening,
    stopListening,
  } = useSpeechRecognition();

  const complexityMap: { [key: number]: string } = { 1: 'Simple', 2: 'Intermediate', 3: 'Advanced', 4: 'Expert' };

  // Update concept input from speech recognition
  useEffect(() => {
    if (transcript) {
      setConceptInput(transcript);
    }
  }, [transcript]);


  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      setConceptInput(''); // Clear input before listening
      startListening();
    }
  };


  const handleGenerateContent = useCallback(async () => {
    if (!conceptInput.trim()) {
      setError('Please enter a concept to generate content.');
      return;
    }

    const concept = conceptInput.trim();
    // Provide a generic subject, allowing the model to infer context.
    const subject = "a general academic context";

    setIsLoading(true);
    setError(null);
    setGeneratedContent(null);
    setGeneratedForConcept(concept);

    const complexityLevel = complexityMap[complexity];

    const params = {
      outputType,
      subject,
      concept,
      purpose,
      language,
      complexity: complexityLevel,
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
  }, [conceptInput, outputType, purpose, language, complexity]);
  
  const complexitySlider = (
     <div>
        <label htmlFor="complexity-slider" className="text-sm font-medium text-slate-400 block mb-2">
            Complexity Level: <span className="font-bold text-indigo-400">{complexityMap[complexity]}</span>
        </label>
        <input
            id="complexity-slider"
            type="range"
            min="1"
            max="4"
            step="1"
            value={complexity}
            onChange={e => setComplexity(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-1 px-1">
            <span>Simple</span>
            <span>Expert</span>
        </div>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Controls Panel */}
        <div className="w-full md:w-80 flex-shrink-0 bg-slate-800/50 border-r-0 md:border-r border-slate-700 p-6 flex flex-col gap-6 overflow-y-auto h-auto md:h-full max-h-[50vh] md:max-h-none">
            <h3 className="text-lg font-semibold text-white">Generator Controls</h3>
            
            <div>
                <label htmlFor="concept-input" className="text-sm font-medium text-slate-400 block mb-2">Enter Concept</label>
                <div className="relative">
                    <input 
                        id="concept-input" 
                        type="text" 
                        value={conceptInput} 
                        onChange={e => setConceptInput(e.target.value)} 
                        placeholder="e.g., 'Quantum Entanglement'" 
                        className="w-full bg-slate-800 border border-slate-700 rounded-md py-2 pl-3 pr-10 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <button onClick={handleMicClick} className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white ${isListening ? 'text-indigo-400 animate-pulse' : ''}`} aria-label="Use microphone to dictate concept">
                      <MicrophoneIcon />
                    </button>
                </div>
            </div>

            {complexitySlider}
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

export default GeneratorView;