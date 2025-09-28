import React, { useState } from 'react';
import type { GeneratedContent } from './types';
import { generateBookInsights } from './services/geminiService';
import { LoadingSpinner, QuizDisplay, HighlightsDisplay, SummaryResults } from './components/SummarizerComponents';

export const BookSummarizerView: React.FC = () => {
    const [bookInput, setBookInput] = useState('');
    const [submittedBook, setSubmittedBook] = useState('');

    const [insightType, setInsightType] = useState<'summary' | 'concepts' | 'characters' | 'highlights' | 'quiz' | 'concept-map'>('summary');
    const [insightFormat, setInsightFormat] = useState<'paragraph' | 'bullets'>('paragraph');
    const [insightPurpose, setInsightPurpose] = useState('a quick overview');

    const [generatedInsight, setGeneratedInsight] = useState<GeneratedContent | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyzeBook = async () => {
        if (!bookInput.trim()) return;
        
        setSubmittedBook(bookInput.trim());
        setIsGenerating(true);
        setGeneratedInsight(null);
        setError(null);
        
        try {
            const result = await generateBookInsights({
                bookTitle: bookInput.trim(),
                insightType: insightType,
                format: insightFormat,
                purpose: insightPurpose,
                language: 'English',
            });
            setGeneratedInsight(result);
        } catch(err) {
            setError(`Failed to generate insights. Details: ${err instanceof Error ? err.message : "An unknown error occurred."}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleReset = () => {
        setBookInput('');
        setSubmittedBook('');
        setGeneratedInsight(null);
        setError(null);
        setIsGenerating(false);
    }
    
    return (
        <div className="flex-1 flex flex-col p-4 sm:p-6 bg-slate-900/50 overflow-y-auto">
            <h1 className="text-3xl font-bold text-white mb-2">Book Summarizer</h1>
            <p className="text-slate-400 mb-6">Enter any book title to get AI-generated summaries, key concepts, character lists, quizzes, and more.</p>

            {!submittedBook ? (
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input 
                            type="text" 
                            value={bookInput} 
                            onChange={e => setBookInput(e.target.value)} 
                            onKeyDown={e => e.key === 'Enter' && handleAnalyzeBook()}
                            placeholder="e.g., 'The Great Gatsby' or 'Sapiens: A Brief History of Humankind'" 
                            className="flex-grow bg-slate-800 border border-slate-600 rounded-md px-4 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        />
                        <button 
                            onClick={handleAnalyzeBook} 
                            disabled={isGenerating || !bookInput.trim()}
                            className="bg-teal-600 text-white font-semibold px-5 py-2 rounded-md hover:bg-teal-700 transition-colors disabled:bg-teal-800/50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            Analyze Book
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                        <div>
                            <p className="text-slate-400">AI Insights for:</p>
                            <h2 className="text-2xl font-bold text-white italic">"{submittedBook}"</h2>
                        </div>
                        <button onClick={handleReset} className="text-sm bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-md">
                            Analyze Another Book
                        </button>
                    </div>

                    <div className="space-y-4 bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                        <h3 className="text-xl font-semibold text-sky-400">Generator Controls</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs font-medium text-slate-400 block mb-1">Insight Type</label>
                                <select value={insightType} onChange={e => setInsightType(e.target.value as any)} className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none">
                                    <option value="summary">Full Summary</option>
                                    <option value="concepts">Key Concepts</option>
                                    <option value="characters">Character List</option>
                                    <option value="highlights">Highlights</option>
                                    <option value="quiz">Quiz Questions</option>
                                    <option value="concept-map">Concept Map</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-400 block mb-1">Format</label>
                                <select value={insightFormat} onChange={e => setInsightFormat(e.target.value as any)} className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none" disabled={!['summary', 'concepts'].includes(insightType)}>
                                    <option value="paragraph">Paragraph</option>
                                    <option value="bullets">Bullet Points</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-400 block mb-1">Purpose / Context</label>
                                <input type="text" value={insightPurpose} onChange={e => setInsightPurpose(e.target.value)} placeholder="e.g., preparing for an exam" className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"/>
                            </div>
                        </div>
                        <button onClick={handleAnalyzeBook} disabled={isGenerating} className="w-full bg-teal-600 text-white font-semibold px-5 py-2 rounded-md hover:bg-teal-700 transition-colors disabled:bg-teal-800/50 flex items-center justify-center gap-2">
                            {isGenerating && <LoadingSpinner />}
                            {isGenerating ? 'Regenerating...' : 'Regenerate'}
                        </button>
                    </div>

                    {isGenerating && <div className="text-center text-slate-400 flex items-center justify-center gap-2 mt-4"><LoadingSpinner /> AI is analyzing... This may take a moment.</div>}
                    {error && <div className="text-red-400 whitespace-pre-wrap mt-4">{error}</div>}
                    
                    {generatedInsight && (
                    <>
                        {generatedInsight.quiz && <QuizDisplay quizData={generatedInsight.quiz} onTryAgain={() => setGeneratedInsight(null)} />}
                        {generatedInsight.highlights && <HighlightsDisplay highlights={generatedInsight.highlights} title={submittedBook} />}
                        {(generatedInsight.text || generatedInsight.mermaidCode) && (
                            <SummaryResults 
                                summaryContent={generatedInsight}
                                summaryType={insightType === 'concept-map' ? 'concept-map' : insightFormat}
                                title={submittedBook}
                            />
                        )}
                    </>
                    )}
                </>
            )}
        </div>
    );
};
