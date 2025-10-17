
import React, { useState, useRef } from 'react';
import { generateLearningPath } from './services/geminiService';
import type { LearningPathModule } from './types';
import { LoadingSpinner } from './components/SummarizerComponents';
import { MapIcon, PlayCircleIcon, FileTextIcon, BookOpenIcon, CodeIcon, ScaleIcon, ExternalLinkIcon, DownloadIcon } from './components/icons';
import { exportAsPdf } from './utils/export';

const getResourceIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('video')) {
        return <PlayCircleIcon className="w-5 h-5" />;
    }
    if (lowerType.includes('article') || lowerType.includes('blog')) {
        return <FileTextIcon className="w-5 h-5" />;
    }
    if (lowerType.includes('documentation') || lowerType.includes('docs')) {
        return <BookOpenIcon className="w-5 h-5" />;
    }
    if (lowerType.includes('tutorial')) {
        return <CodeIcon className="w-5 h-5" />;
    }
    if (lowerType.includes('course')) {
        return <ScaleIcon className="w-5 h-5" />;
    }
    return <ExternalLinkIcon className="w-5 h-5" />;
};


const LearningPathCreatorView: React.FC = () => {
    const [goal, setGoal] = useState('');
    const [currentGoal, setCurrentGoal] = useState('');
    const [learningPath, setLearningPath] = useState<LearningPathModule[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const pathRef = useRef<HTMLDivElement>(null);

    const handleGenerate = async () => {
        if (!goal.trim()) {
            setError('Please enter a learning goal.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setLearningPath(null);
        setCurrentGoal(goal);

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

    const handleDownloadPdf = () => {
        if (pathRef.current) {
            exportAsPdf(pathRef.current, `Learning_Path_for_${currentGoal.replace(/\s/g, '_')}`);
        }
    };

    return (
        <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto">
            <h1 className="text-3xl font-bold text-white mb-2">Personalized Learning Path Creator</h1>
            <p className="text-slate-400 mb-6">Enter your learning goal, and the AI will generate a customized, step-by-step path for you.</p>
            
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-sm p-6 max-w-4xl mx-auto w-full">
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="text"
                        value={goal}
                        onChange={e => setGoal(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="e.g., 'Learn Python for data science' or 'Understand quantum mechanics'"
                        className="flex-grow bg-slate-800 border border-slate-600 rounded-sm px-4 py-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !goal.trim()}
                        className="bg-cyan-600 text-white font-semibold px-5 py-2 rounded-sm hover:bg-cyan-500 transition-colors disabled:bg-cyan-900/50 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                        <div className="flex justify-end mb-4">
                            <button
                                onClick={handleDownloadPdf}
                                className="flex items-center gap-2 bg-slate-700 text-white font-semibold px-4 py-2 rounded-sm hover:bg-slate-600 transition-colors"
                                aria-label="Download learning path as PDF"
                            >
                                <DownloadIcon />
                                <span>Download PDF</span>
                            </button>
                        </div>
                        <div ref={pathRef} className="bg-slate-800/50 border border-slate-700/50 rounded-sm p-6">
                            <h2 className="text-2xl font-bold text-center text-white mb-6">Your Learning Path for: <span className="text-cyan-400">{currentGoal}</span></h2>
                            <div className="space-y-6">
                                {learningPath.map((module, index) => (
                                    <div key={index} className="bg-slate-800/50 rounded-sm p-6 border border-slate-700/50">
                                        <h3 className="text-xl font-semibold text-cyan-400 mb-2">Module {index + 1}: {module.moduleTitle}</h3>
                                        <p className="text-slate-400 mb-4 text-sm">{module.description}</p>
                                        <h4 className="font-semibold text-cyan-300 mb-2">Key Topics to Cover:</h4>
                                        <ul className="space-y-2 list-disc list-inside text-slate-300 text-sm">
                                            {module.keyTopics.map((topic, topicIndex) => (
                                                <li key={topicIndex}>{topic}</li>
                                            ))}
                                        </ul>

                                        {module.resources && module.resources.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-slate-700/50">
                                                <h4 className="font-semibold text-cyan-300 mb-3">Recommended Resources:</h4>
                                                <div className="space-y-3">
                                                    {module.resources.map((resource, resourceIndex) => (
                                                        <a 
                                                            key={resourceIndex}
                                                            href={resource.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-start gap-3 p-3 bg-slate-900/70 rounded-sm hover:bg-slate-700/70 border border-slate-700/50 transition-colors group"
                                                        >
                                                            <div className="flex-shrink-0 mt-1 text-cyan-400">
                                                                {getResourceIcon(resource.type)}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-slate-200 group-hover:text-white">{resource.title}</p>
                                                                <p className="text-xs text-slate-400 flex items-center gap-1">
                                                                    {resource.type}
                                                                    <ExternalLinkIcon className="opacity-70 group-hover:opacity-100" />
                                                                </p>
                                                            </div>
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LearningPathCreatorView;
