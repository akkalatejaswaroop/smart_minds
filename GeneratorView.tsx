import React, { useState, useCallback, useEffect } from 'react';
import { generateTextStream, generateConceptMap, generateQuiz, fetchRelatedResources } from './services/geminiService';
import ContentDisplay from './components/ContentDisplay';
import { OutputType, GeneratedContent, RelatedResources, GroundingSource, GroundingChunk } from './types';
import { extractTextFromFile } from './utils/fileReader';
import { UploadCloudIcon, XIcon, FileTextIcon, BrainCircuitIcon, MicrophoneIcon, ExternalLinkIcon } from './components/icons';
import { LoadingSpinner } from './components/SummarizerComponents';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { renderSimpleMarkdown } from './utils/markdown';

const RelatedResourcesDisplay: React.FC<{
    isLoading: boolean;
    resources: RelatedResources | null;
}> = ({ isLoading, resources }) => {
    if (isLoading) {
        return (
            <div className="mt-6 bg-slate-800/50 border border-slate-700/50 rounded-sm p-6">
                <div className="flex items-center gap-2 text-slate-400">
                    <LoadingSpinner />
                    <span>Fetching related resources...</span>
                </div>
            </div>
        );
    }

    if (!resources || (!resources.markdownContent && resources.sources.length === 0)) {
        return null;
    }
    
    const style = `
        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
    `;

    return (
        <div className="mt-6 bg-slate-800/50 border border-slate-700/50 rounded-sm p-6 animate-fade-in">
            <style>{style}</style>
            <h3 className="text-xl font-bold text-cyan-400 mb-4">Explore Further</h3>
            <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(resources.markdownContent) }} />
            
            {resources.sources.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-700/50">
                    <h4 className="font-semibold text-slate-300 mb-2">Sources:</h4>
                    <ul className="text-sm space-y-2">
                        {resources.sources.map((source, index) => (
                            <li key={index}>
                                <a href={source.uri} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 hover:underline">
                                    <span>{source.title || source.uri}</span>
                                    <ExternalLinkIcon className="w-4 h-4 flex-shrink-0" />
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};


const COMPLEXITY_LEVELS = ['Simple', 'Intermediate', 'Difficult', 'Expert'];
const TONE_OPTIONS = ['Friendly', 'Formal (Faculty)', 'Analogy-based', 'Simple (ELI5)'];
const PURPOSE_OPTIONS = ['Preparation for Exam', 'Quick Revision', 'Understand a New Topic', 'Teach a Class', 'In-depth Knowledge', 'Create Study Notes'];

const GeneratorView: React.FC = () => {
    const [generationMode, setGenerationMode] = useState<'concept' | 'document'>('concept');
    const [concept, setConcept] = useState<string>('');
    const [outputType, setOutputType] = useState<OutputType>('explanation');
    const [purpose, setPurpose] = useState('Preparation for Exam');
    const [language, setLanguage] = useState('English');
    const [complexity, setComplexity] = useState('Intermediate');
    const [tone, setTone] = useState('Friendly');
    
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [fileContent, setFileContent] = useState<string | null>(null);
    const [isFileReading, setIsFileReading] = useState(false);
    const [fileError, setFileError] = useState<string | null>(null);
    
    const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [relatedResources, setRelatedResources] = useState<RelatedResources | null>(null);
    const [isFetchingResources, setIsFetchingResources] = useState(false);

    const {
        transcript,
        isListening,
        startListening,
        stopListening,
    } = useSpeechRecognition();

    useEffect(() => {
        if (transcript) {
            setConcept(transcript);
        }
    }, [transcript]);

    useEffect(() => {
        if (generatedContent && !isLoading && concept && (outputType !== 'quiz' && outputType !== 'concept-map')) {
            const getResources = async () => {
                setIsFetchingResources(true);
                setRelatedResources(null);
                try {
                    const result = await fetchRelatedResources(concept);
                    const sources: GroundingSource[] = result.sources
                        .map(chunk => chunk.web)
                        .filter((source): source is { uri: string; title: string } => !!source);

                    setRelatedResources({ markdownContent: result.markdownContent, sources });
                } catch (e) {
                    console.error("Failed to fetch related resources:", e);
                } finally {
                    setIsFetchingResources(false);
                }
            };
            getResources();
        }
    }, [generatedContent, isLoading, concept, outputType]);

    const handleMicClick = () => {
        if (isListening) {
            stopListening();
        } else {
            setConcept(''); // Clear input before listening
            startListening();
        }
    };

    const handleClearFile = () => {
        setUploadedFile(null);
        setFileContent(null);
        setFileError(null);
        const fileInput = document.getElementById('file-upload-generator') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    const handleModeChange = (mode: 'concept' | 'document') => {
        setGenerationMode(mode);
        // Reset state for a clean switch
        setConcept('');
        setGeneratedContent(null);
        setError(null);
        setRelatedResources(null);
        if (mode === 'concept') {
            handleClearFile();
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploadedFile(file);
        setIsFileReading(true);
        setFileError(null);
        setFileContent(null);
        setGeneratedContent(null);
        setRelatedResources(null);
        setError(null);
        setConcept(''); // Clear concept when new file is uploaded

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

    const handleGenerate = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setGeneratedContent(null);
        setRelatedResources(null);
        
        try {
            const contextForGeneration = generationMode === 'document' ? fileContent : null;
            const params = { concept, outputType, purpose, language, complexity, tone, context: contextForGeneration };
            
            if (outputType === 'concept-map') {
                const result = await generateConceptMap(params);
                setGeneratedContent(result);
            } else if (outputType === 'quiz') {
                const result = await generateQuiz(params);
                setGeneratedContent(result);
            } else {
                const stream = await generateTextStream(params);
                let text = '';
                setGeneratedContent({ text: '' }); // Initial empty state
                for await (const chunk of stream) {
                    text += chunk.text;
                    setGeneratedContent({ text });
                }
            }
        } catch (e: any) {
            setError(`An error occurred: ${e.message}`);
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [concept, outputType, purpose, language, complexity, tone, fileContent, generationMode]);
    
    const complexityIndex = COMPLEXITY_LEVELS.indexOf(complexity);
    const handleComplexityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setComplexity(COMPLEXITY_LEVELS[parseInt(e.target.value, 10)]);
    };

    const isGenerateDisabled = isLoading || isFileReading || !concept.trim() || (generationMode === 'document' && !fileContent);

    return (
        <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
                {/* Controls Column */}
                <div className="lg:col-span-1 bg-slate-800/50 border border-slate-700/50 shadow-lg rounded-sm p-6 flex flex-col space-y-4">
                    <h2 className="text-xl font-bold text-cyan-400 border-b border-slate-700/50 pb-2">Generation Options</h2>
                    
                    {/* Mode Switcher */}
                    <div className="flex bg-slate-700/50 rounded-sm p-1">
                        <button onClick={() => handleModeChange('concept')} className={`flex-1 px-3 py-2 text-sm font-medium rounded-sm transition-colors flex items-center justify-center gap-2 ${generationMode === 'concept' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>
                            From Concept
                        </button>
                        <button onClick={() => handleModeChange('document')} className={`flex-1 px-3 py-2 text-sm font-medium rounded-sm transition-colors flex items-center justify-center gap-2 ${generationMode === 'document' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>
                            From Document
                        </button>
                    </div>

                    {/* Conditional Inputs */}
                    {generationMode === 'concept' && (
                        <div>
                            <label htmlFor="concept" className="block text-sm font-medium text-slate-300">Concept / Question</label>
                            <div className="relative mt-1">
                                <input 
                                    id="concept" 
                                    type="text" 
                                    value={concept} 
                                    onChange={(e) => setConcept(e.target.value)}
                                    placeholder="e.g., 'Quantum Entanglement'"
                                    className="block w-full bg-slate-700 border-slate-600 rounded-sm shadow-sm py-2 px-3 pr-10 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                                />
                                <button
                                    onClick={handleMicClick}
                                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-white ${isListening ? 'text-cyan-400 animate-pulse' : ''}`}
                                    aria-label="Use microphone for concept"
                                >
                                    <MicrophoneIcon />
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {generationMode === 'document' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Source Document</label>
                                {!uploadedFile && !isFileReading ? (
                                    <label htmlFor="file-upload-generator" className="relative block w-full border-2 border-dashed border-slate-600 rounded-sm p-6 text-center cursor-pointer hover:border-cyan-500 transition-colors">
                                        <UploadCloudIcon className="mx-auto h-10 w-10 text-slate-500"/>
                                        <span className="mt-2 block text-sm font-semibold text-slate-300">Upload a document</span>
                                        <span className="mt-1 block text-xs text-slate-500">PDF or DOCX for context</span>
                                        <input id="file-upload-generator" name="file-upload-generator" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.docx"/>
                                    </label>
                                ) : (
                                    <div className="flex items-center justify-between bg-slate-700 px-3 py-2 rounded-sm text-sm">
                                        <div className="flex items-center gap-2 text-slate-300 truncate">
                                            {isFileReading ? <LoadingSpinner/> : <FileTextIcon className="w-4 h-4" />}
                                            <span className="font-medium truncate">{isFileReading ? 'Reading file...' : uploadedFile?.name}</span>
                                        </div>
                                    {!isFileReading && <button onClick={handleClearFile} className="p-1 hover:bg-slate-600 rounded-full"><XIcon className="w-4 h-4" /></button>}
                                    </div>
                                )}
                                {fileError && <p className="text-red-400 text-xs mt-1">{fileError}</p>}
                            </div>
                            <div>
                                <label htmlFor="concept-doc" className="block text-sm font-medium text-slate-300">Question about Document</label>
                                <div className="relative mt-1">
                                    <input 
                                        id="concept-doc" 
                                        type="text" 
                                        value={concept} 
                                        onChange={(e) => setConcept(e.target.value)}
                                        placeholder="Ask a question about the document..."
                                        disabled={!fileContent || isFileReading}
                                        className="block w-full bg-slate-700 border-slate-600 rounded-sm shadow-sm py-2 px-3 pr-10 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 text-sm disabled:bg-slate-800 disabled:cursor-not-allowed"
                                    />
                                    <button
                                        onClick={handleMicClick}
                                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-white ${isListening ? 'text-cyan-400 animate-pulse' : ''}`}
                                        aria-label="Use microphone for question"
                                        disabled={!fileContent || isFileReading}
                                    >
                                        <MicrophoneIcon />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div>
                        <label htmlFor="outputType" className="block text-sm font-medium text-slate-300">Output Type</label>
                        <select id="outputType" value={outputType} onChange={(e) => setOutputType(e.target.value as OutputType)} className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-sm shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 text-sm">
                            <option value="explanation">Explanation</option>
                            <option value="presentation">Presentation Script</option>
                            <option value="examples">Examples</option>
                            <option value="summary">Summary</option>
                            <option value="concept-map">Concept Map</option>
                            <option value="quiz">Quiz</option>
                        </select>
                    </div>

                    <div>
                      <label htmlFor="purpose" className="block text-sm font-medium text-slate-300">Purpose</label>
                      <select id="purpose" value={purpose} onChange={(e) => setPurpose(e.target.value)} className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-sm shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 text-sm">
                        {PURPOSE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>

                    {outputType === 'explanation' && (
                      <div>
                        <label htmlFor="tone" className="block text-sm font-medium text-slate-300">Explanation Tone</label>
                        <select id="tone" value={tone} onChange={(e) => setTone(e.target.value)} className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-sm shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 text-sm">
                          {TONE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                    )}
                    
                    <div>
                      <label htmlFor="language" className="block text-sm font-medium text-slate-300">Language</label>
                      <select id="language" value={language} onChange={(e) => setLanguage(e.target.value)} className="mt-1 block w-full bg-slate-700 border-slate-600 rounded-sm shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 text-sm">
                        <option>English</option>
                        <option>Tenglish</option>
                        <option>Spanish</option>
                        <option>French</option>
                        <option>German</option>
                        <option>Hindi</option>
                        <option>Mandarin</option>
                        <option>Telugu</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="complexity" className="block text-sm font-medium text-slate-300">Complexity Level: <span className="font-bold text-cyan-400">{complexity}</span></label>
                      <input id="complexity" type="range" min="0" max="3" value={complexityIndex} onChange={handleComplexityChange} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 mt-2" />
                    </div>

                    <div className="flex-grow"></div>
                    
                    <button onClick={handleGenerate} disabled={isGenerateDisabled} className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-sm transition-colors duration-200 flex items-center justify-center gap-2">
                         {isLoading ? <LoadingSpinner /> : <BrainCircuitIcon />}
                        {isLoading ? 'Generating...' : 'Generate Content'}
                    </button>
                </div>
                
                <div className="lg:col-span-2 flex flex-col">
                    <ContentDisplay 
                        outputType={outputType}
                        generatedContent={generatedContent}
                        isLoading={isLoading && !generatedContent}
                        error={error}
                        conceptName={concept || (uploadedFile ? uploadedFile.name : '')}
                        language={language}
                    />
                    <RelatedResourcesDisplay
                        isLoading={isFetchingResources}
                        resources={relatedResources}
                    />
                </div>
            </div>
        </div>
    );
};

export default GeneratorView;