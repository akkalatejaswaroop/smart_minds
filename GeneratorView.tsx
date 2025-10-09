import React, { useState, useCallback, useEffect } from 'react';
import { ContentDisplay } from './components/ContentDisplay';
import type { OutputType, GeneratedContent } from './types';
import { generateConceptMap, generateTextStream, generateQuiz } from './services/geminiService';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { MicrophoneIcon, UploadCloudIcon, XIcon } from './components/icons';
import { extractTextFromFile } from './utils/fileReader';

const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Hindi', 'Mandarin', 'Telugu', 'Japanese', 'Korean', 'Russian'];
const PURPOSES = [
    'preparing for a college exam',
    'understanding a new topic',
    'reviewing for a quiz',
    'getting a quick summary',
    'teaching a class',
    'creating study notes'
];

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

  const [generationMode, setGenerationMode] = useState<'topic' | 'document'>('topic');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isFileReading, setIsFileReading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const {
    transcript,
    isListening,
    startListening,
    stopListening,
  } = useSpeechRecognition();

  const complexityMap: { [key: number]: string } = { 1: 'Simple', 2: 'Intermediate', 3: 'Advanced', 4: 'Expert' };

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
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setIsFileReading(true);
    setFileError(null);
    setFileContent(null);
    setError(null);

    try {
        const text = await extractTextFromFile(file);
        setFileContent(text);
    } catch (err) {
        setFileError(err instanceof Error ? err.message : 'Failed to read file.');
        setUploadedFile(null);
    } finally {
        setIsFileReading(false);
    }
  };

  const handleClearFile = () => {
    setUploadedFile(null);
    setFileContent(null);
    setFileError(null);
    const fileInput = document.getElementById('file-upload-generator') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleGenerateContent = useCallback(async () => {
    if (!conceptInput.trim()) {
      setError('Please enter a concept to generate content.');
      return;
    }
    if (generationMode === 'document' && !fileContent) {
      setError('Please upload and wait for a document to be processed before generating content.');
      return;
    }

    const concept = conceptInput.trim();
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
      context: generationMode === 'document' ? fileContent : undefined,
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
  }, [conceptInput, outputType, purpose, language, complexity, generationMode, fileContent]);
  
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !isLoading) {
      handleGenerateContent();
    }
  };
  
  const isGenerateDisabled = isLoading || !conceptInput.trim() || (generationMode === 'document' && (!fileContent || isFileReading));

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 bg-slate-900/50 overflow-y-auto">
        {/* Unified Controls Panel */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-6 space-y-4">
            <h3 className="text-lg font-semibold text-white">Generator Controls</h3>
            
            <div>
                 <label className="text-sm font-medium text-slate-400 block mb-2">Generation Mode</label>
                 <div className="flex items-center bg-slate-900 rounded-lg p-1 self-start">
                    <button onClick={() => setGenerationMode('topic')} className={`px-4 py-1 text-sm rounded-md ${generationMode === 'topic' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-700'}`}>From Topic</button>
                    <button onClick={() => setGenerationMode('document')} className={`px-4 py-1 text-sm rounded-md ${generationMode === 'document' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-700'}`}>From Document</button>
                </div>
            </div>

            {generationMode === 'document' && (
              <div>
                  <label className="text-sm font-medium text-slate-400 block mb-2">Reference Document</label>
                  {uploadedFile && !isFileReading ? (
                     <div className="flex items-center justify-between bg-slate-900 p-3 rounded-md">
                        <p className="text-sm text-slate-300 truncate">Ready: {uploadedFile.name}</p>
                        <button onClick={handleClearFile} className="p-1 text-slate-400 hover:text-white rounded-full"><XIcon className="w-4 h-4" /></button>
                     </div>
                  ) : (
                    <label htmlFor="file-upload-generator" className="relative block w-full border-2 border-dashed border-slate-600 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-500 transition-colors">
                        <UploadCloudIcon className="mx-auto h-8 w-8 text-slate-500"/>
                        <span className="mt-2 block text-sm font-semibold text-slate-300">
                            {isFileReading ? 'Reading file...' : 'Click to upload PDF or DOCX'}
                        </span>
                        <input id="file-upload-generator" name="file-upload-generator" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.docx" disabled={isFileReading}/>
                    </label>
                  )}
                  {fileError && <p className="text-red-400 text-sm mt-2">{fileError}</p>}
              </div>
            )}
            
            <div>
                <label htmlFor="concept-input" className="text-sm font-medium text-slate-400 block mb-2">
                    {generationMode === 'document' ? 'Concept to Analyze in Document' : 'Enter Concept'}
                </label>
                <div className="relative">
                    <input 
                        id="concept-input" 
                        type="text" 
                        value={conceptInput} 
                        onChange={e => setConceptInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={generationMode === 'document' ? "e.g., 'Supervised Learning'" : "e.g., 'Quantum Entanglement'"}
                        className="w-full bg-slate-800 border border-slate-700 rounded-md py-2 pl-3 pr-10 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-900 disabled:cursor-not-allowed"
                        disabled={isLoading}
                    />
                    <button onClick={handleMicClick} className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white disabled:opacity-50 ${isListening ? 'text-indigo-400 animate-pulse' : ''}`} aria-label="Use microphone to dictate concept" disabled={isLoading}>
                      <MicrophoneIcon />
                    </button>
                </div>
            </div>

            <div>
                 <label className="text-sm font-medium text-slate-400 block mb-2">Choose Output Type</label>
                 <div className="flex items-center bg-slate-800 rounded-lg p-1 flex-wrap">
                    {(['explanation', 'presentation', 'examples', 'summary', 'quiz', 'concept-map'] as const).map((type) => (
                        <button
                            key={type}
                            onClick={() => setOutputType(type)}
                            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                outputType === type ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'
                            }`}
                            aria-pressed={outputType === type}
                        >
                            {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label htmlFor="complexity-slider" className="text-sm font-medium text-slate-400 block mb-2">
                        Complexity: <span className="font-bold text-indigo-400">{complexityMap[complexity]}</span>
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
                </div>
                {outputType !== 'concept-map' && outputType !== 'quiz' && (
                  <div>
                      <label className="text-sm font-medium text-slate-400 block mb-2">Purpose</label>
                      <select
                          value={purpose}
                          onChange={(e) => setPurpose(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                          {PURPOSES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                      </select>
                  </div>
                )}
                <div>
                    <label className="text-sm font-medium text-slate-400 block mb-2">Language</label>
                    <select 
                        value={language} 
                        onChange={e => setLanguage(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                        {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                    </select>
                </div>
            </div>

            <div className="pt-2">
                <button
                    onClick={handleGenerateContent}
                    disabled={isGenerateDisabled}
                    className="w-full bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-md hover:bg-indigo-600 transition-colors disabled:bg-indigo-900/50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                    </>
                    ) : (
                    'Generate Content'
                    )}
                </button>
            </div>
        </div>

        {/* Content Display Area */}
        <ContentDisplay
            outputType={outputType}
            generatedContent={generatedContent}
            isLoading={isLoading}
            error={error}
            conceptName={generatedForConcept}
        />
    </div>
  );
};

export default GeneratorView;