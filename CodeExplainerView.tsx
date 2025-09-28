import React, { useState } from 'react';
import { analyzeCode } from './services/geminiService';
import { LoadingSpinner } from './components/SummarizerComponents';
import { renderSimpleMarkdown } from './utils/markdown';
import { BugIcon, CodeIcon, HighlighterIcon } from './components/icons';

const CodeExplainerView: React.FC = () => {
    const [code, setCode] = useState('');
    const [action, setAction] = useState<'explain' | 'debug'>('explain');
    const [result, setResult] = useState<string | null>(null);
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

                    <textarea
                        value={code}
                        onChange={e => setCode(e.target.value)}
                        placeholder={`// Paste your code here...\n\nfunction example(arr) {\n  return arr.sort();\n}`}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-md p-4 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                        style={{ minHeight: '300px' }}
                        disabled={isLoading}
                        aria-label="Code input"
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
                            <div
                                className="prose prose-invert max-w-none prose-pre:bg-slate-900 prose-pre:p-4 prose-pre:rounded-md prose-code:text-pink-400"
                                dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(result) }}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CodeExplainerView;