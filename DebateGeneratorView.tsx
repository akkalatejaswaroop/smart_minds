import React, { useState } from 'react';
import { generateDebateArguments } from './services/geminiService';
import type { DebateArguments } from './types';
import { LoadingSpinner } from './components/SummarizerComponents';
import { ScaleIcon } from './components/icons';

const DebateGeneratorView: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [debateArgs, setDebateArgs] = useState<DebateArguments | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!topic.trim()) {
            setError('Please enter a topic.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setDebateArgs(null);

        try {
            const result = await generateDebateArguments(topic);
            setDebateArgs(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate debate. Please try again. Details: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            handleGenerate();
        }
    };

    return (
        <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto">
            <h1 className="text-3xl font-bold text-white mb-2">AI Debate Generator</h1>
            <p className="text-slate-400 mb-6">Enter a topic to generate compelling arguments for both sides of the debate.</p>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-sm p-6 max-w-4xl mx-auto w-full">
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        value={topic}
                        onChange={e => setTopic(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="e.g., 'Should artificial intelligence be regulated?'"
                        className="flex-grow bg-slate-800 border border-slate-600 rounded-sm px-4 py-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !topic.trim()}
                        className="bg-cyan-600 text-white font-semibold px-5 py-2 rounded-sm hover:bg-cyan-500 transition-colors disabled:bg-cyan-900/50 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? <LoadingSpinner /> : <ScaleIcon className="w-5 h-5" />}
                        {isLoading ? 'Generating...' : 'Generate Debate'}
                    </button>
                </div>
            </div>

            <div className="mt-6 max-w-4xl mx-auto w-full">
                {isLoading && (
                    <div className="text-center text-slate-400 flex items-center justify-center gap-2 mt-4">
                        <LoadingSpinner /> Generating arguments...
                    </div>
                )}
                {error && <div className="text-red-400 whitespace-pre-wrap mt-4 text-center">{error}</div>}
                
                {debateArgs && (
                    <div className="mt-6 animate-fade-in">
                        <h2 className="text-2xl font-bold text-center text-white mb-6">Debate Topic: <span className="text-cyan-400">{topic}</span></h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Arguments For */}
                            <div className="bg-slate-800/50 border border-cyan-500/30 rounded-sm p-6">
                                <h3 className="text-xl font-semibold text-cyan-400 mb-4">Arguments For (Pro)</h3>
                                <ul className="space-y-4 list-disc list-inside text-slate-300">
                                    {debateArgs.pro.map((arg, index) => <li key={`pro-${index}`}>{arg}</li>)}
                                </ul>
                            </div>
                            {/* Arguments Against */}
                            <div className="bg-slate-800/50 border border-orange-500/30 rounded-sm p-6">
                                <h3 className="text-xl font-semibold text-orange-400 mb-4">Arguments Against (Con)</h3>
                                <ul className="space-y-4 list-disc list-inside text-slate-300">
                                    {debateArgs.con.map((arg, index) => <li key={`con-${index}`}>{arg}</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DebateGeneratorView;