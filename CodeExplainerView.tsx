import React, { useState, useRef } from 'react';
import { analyzeCode } from './services/geminiService';
import { LoadingSpinner } from './components/SummarizerComponents';
import { renderSimpleMarkdown } from './utils/markdown';
import { BugIcon, CodeIcon, HighlighterIcon } from './components/icons';
import type { CodeAnalysisResult, CodeExplanation, CodeDebugReport } from './types';

const ExplanationDisplay: React.FC<{ data: CodeExplanation }> = ({ data }) => (
    <div className="prose prose-invert max-w-none space-y-6">
        <div>
            <h3 className="text-purple-400 border-b border-slate-700 pb-2">Summary</h3>
            <p className="mt-2 text-slate-300">{data.summary}</p>
        </div>
        <div>
            <h3 className="text-purple-400 border-b border-slate-700 pb-2">Line-by-Line Explanation</h3>
            <dl className="mt-4 space-y-4">
                {data.lineByLineExplanation.map((item, index) => (
                    <div key={index} className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                        <dt className="font-mono text-indigo-400 flex-shrink-0 sm:w-24 sm:text-right">{item.lines}</dt>
                        <dd className="text-slate-400 border-l-2 border-slate-700 pl-4 sm:border-l-0 sm:pl-0">{item.explanation}</dd>
                    </div>
                ))}
            </dl>
        </div>
        <div>
            <h3 className="text-purple-400 border-b border-slate-700 pb-2">Key Concepts</h3>
            <ul className="mt-2 list-disc list-inside text-slate-300">
                {data.keyConcepts.map((concept, index) => (
                    <li key={index}>{concept}</li>
                ))}
            </ul>
        </div>
    </div>
);

const DebugDisplay: React.FC<{ data: CodeDebugReport }> = ({ data }) => (
    <div className="prose prose-invert max-w-none space-y-6">
        <div>
            <h3 className="text-purple-400 border-b border-slate-700 pb-2">Analysis Summary</h3>
            <p className="mt-2 text-slate-300">{data.analysisSummary}</p>
        </div>
        
        {data.bugs.length > 0 && (
            <div>
                <h3 className="text-purple-400 border-b border-slate-700 pb-2">Identified Issues</h3>
                <div className="mt-4 space-y-4">
                    {data.bugs.map((bug, index) => (
                        <div key={index} className="bg-slate-900/50 p-4 rounded-md border border-slate-600">
                            <p className="font-semibold text-red-400">Issue on {bug.line}: <span className="text-slate-300 font-normal">{bug.issue}</span></p>
                            <p className="font-semibold text-green-400 mt-2">Suggestion: <span className="text-slate-300 font-normal">{bug.suggestion}</span></p>
                        </div>
                    ))}
                </div>
            </div>
        )}

        <div>
            <h3 className="text-purple-400 border-b border-slate-700 pb-2">Corrected Code</h3>
            <div 
                className="prose prose-invert max-w-none prose-pre:bg-slate-900 prose-pre:p-4 prose-pre:rounded-md prose-code:text-pink-400"
                dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(`\`\`\`\n${data.correctedCode}\n\`\`\``) }} 
            />
        </div>
    </div>
);

const CodeInputWithLineNumbers: React.FC<{
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder: string;
    disabled: boolean;
}> = ({ value, onChange, placeholder, disabled }) => {
    const lineNumbersRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Calculate line numbers based on newlines
    const lineCount = value.split('\n').length;
    
    // Synchronize scrolling of the line numbers with the textarea
    const handleScroll = () => {
        if (lineNumbersRef.current && textareaRef.current) {
            lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };

    return (
        <div 
            className="flex-1 flex bg-slate-900 border border-slate-700 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500"
            style={{ minHeight: '300px' }}
        >
            <div
                ref={lineNumbersRef}
                className="py-4 pl-4 pr-3 text-right text-slate-500 bg-slate-900 select-none overflow-y-hidden font-mono text-sm leading-5"
                aria-hidden="true"
            >
                {Array.from({ length: lineCount }, (_, i) => (
                    <div key={i}>{i + 1}</div>
                ))}
            </div>
            <textarea
                ref={textareaRef}
                value={value}
                onChange={onChange}
                onScroll={handleScroll}
                placeholder={placeholder}
                className="flex-1 bg-transparent py-4 pl-2 pr-4 text-slate-300 focus:outline-none resize-none w-full font-mono text-sm leading-5 whitespace-pre overflow-x-auto"
                disabled={disabled}
                aria-label="Code input"
                spellCheck="false"
            />
        </div>
    );
};


const CodeExplainerView: React.FC = () => {
    const [code, setCode] = useState('');
    const [action, setAction] = useState<'explain' | 'debug'>('explain');
    const [result, setResult] = useState<CodeAnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        if (!code.trim()) {
            setError('Please paste some code to analyze.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const analysisResult = await analyzeCode(code, action);
            setResult(analysisResult);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to analyze code. Please try again. Details: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col p-4 sm:p-6 bg-slate-900/50 overflow-y-auto">
            <h1 className="text-3xl font-bold text-white mb-2">Code Explainer & Debugger</h1>
            <p className="text-slate-400 mb-6">Paste a code snippet to get a detailed explanation or have the AI find and fix bugs.</p>

            <div className="flex-1 flex flex-col lg:flex-row gap-6">
                {/* Input Panel */}
                <div className="w-full lg:w-1/2 flex flex-col gap-4">
                    <div className="flex items-center bg-slate-800 rounded-lg p-1">
                        <button
                            onClick={() => setAction('explain')}
                            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${action === 'explain' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                            aria-pressed={action === 'explain'}
                        >
                            <HighlighterIcon /> Explain Code
                        </button>
                        <button
                            onClick={() => setAction('debug')}
                            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${action === 'debug' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                            aria-pressed={action === 'debug'}
                        >
                            <BugIcon/> Debug Code
                        </button>
                    </div>

                    <CodeInputWithLineNumbers
                        value={code}
                        onChange={e => setCode(e.target.value)}
                        placeholder={`// Paste your code here...\n\nfunction example(arr) {\n  return arr.sort();\n}`}
                        disabled={isLoading}
                    />
                    
                    <button
                        onClick={handleAnalyze}
                        disabled={isLoading || !code.trim()}
                        className="w-full bg-indigo-700 text-white font-semibold px-5 py-3 rounded-md hover:bg-indigo-600 transition-colors disabled:bg-indigo-900/50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? <LoadingSpinner /> : <CodeIcon />}
                        {isLoading ? 'Analyzing...' : `Analyze Code`}
                    </button>
                </div>

                {/* Output Panel */}
                <div className="w-full lg:w-1/2 flex flex-col">
                    <div className="flex-1 bg-slate-800 rounded-lg p-6 overflow-y-auto border border-slate-700 min-h-[400px]">
                        {isLoading && (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <LoadingSpinner className="h-8 w-8" />
                                <p className="mt-4">AI is analyzing your code...</p>
                            </div>
                        )}
                        {error && <div className="text-red-400 whitespace-pre-wrap">{error}</div>}
                        {!isLoading && !error && !result && (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                <CodeIcon className="w-12 h-12 mb-4" />
                                <h3 className="text-lg font-semibold">Waiting for code</h3>
                                <p className="text-sm text-center">Paste your code on the left and click "Analyze Code" to see the results here.</p>
                            </div>
                        )}
                        {result && (
                            <>
                                {action === 'explain' && 'summary' in result && <ExplanationDisplay data={result as CodeExplanation} />}
                                {action === 'debug' && 'analysisSummary' in result && <DebugDisplay data={result as CodeDebugReport} />}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CodeExplainerView;