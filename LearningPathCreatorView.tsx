import React, { useState } from 'react';
import { generateLearningPath } from './services/geminiService';
import type { LearningPathModule } from './types';
import { LoadingSpinner } from './components/SummarizerComponents';
import { MapIcon } from './components/icons';

const LearningPathCreatorView: React.FC = () => {
    const [goal, setGoal] = useState('');
    const [learningPath, setLearningPath] = useState<LearningPathModule[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!goal.trim()) {
            setError('Please enter a learning goal.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setLearningPath(null);

        try {
            const result = await generateLearningPath(goal);
            setLearningPath(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to generate learning path. Please try again. Details: ${errorMessage}`);
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
        <div className="flex-1 flex flex-col p-4 sm:p-6 bg-slate-900/50 overflow-y-auto">
            <h1 className="text-3xl font-bold text-white mb-2">Personalized Learning Path Creator</h1>
            <p className="text-slate-400 mb-6">Enter your learning goal, and the AI will generate a customized, step-by-step path for you.</p>
            
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 max-w-4xl mx-auto w-full">
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        value={goal}
                        onChange={e => setGoal(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="e.g., 'Learn Python for data science' or 'Understand quantum mechanics'"
                        className="flex-grow bg-slate-800 border border-slate-600 rounded-md px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !goal.trim()}
                        className="bg-indigo-700 text-white font-semibold px-5 py-2 rounded-md hover:bg-indigo-600 transition-colors disabled:bg-indigo-900/50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? <LoadingSpinner /> : <MapIcon className="w-5 h-5" />}
                        {isLoading ? 'Creating...' : 'Create Path'}
                    </button>
                </div>
            </div>

            <div className="mt-6 max-w-4xl mx-auto w-full">
                {isLoading && (
                    <div className="text-center text-slate-400 flex items-center justify-center gap-2 mt-4">
                        <LoadingSpinner /> Generating your personalized learning path...
                    </div>
                )}
                {error && <div className="text-red-400 whitespace-pre-wrap mt-4 text-center">{error}</div>}
                
                {learningPath && (
                    <div className="mt-6 animate-fade-in">
                        <h2 className="text-2xl font-bold text-center text-white mb-6">Your Learning Path for: <span className="text-purple-400">{goal}</span></h2>
                        <div className="space-y-6">
                            {learningPath.map((module, index) => (
                                <div key={index} className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 transition-shadow hover:shadow-lg hover:shadow-indigo-500/10">
                                    <h3 className="text-xl font-semibold text-indigo-400 mb-2">Module {index + 1}: {module.moduleTitle}</h3>
                                    <p className="text-slate-400 mb-4 text-sm">{module.description}</p>
                                    <h4 className="font-semibold text-purple-300 mb-2">Key Topics to Cover:</h4>
                                    <ul className="space-y-2 list-disc list-inside text-slate-300 text-sm">
                                        {module.keyTopics.map((topic, topicIndex) => (
                                            <li key={topicIndex}>{topic}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LearningPathCreatorView;
