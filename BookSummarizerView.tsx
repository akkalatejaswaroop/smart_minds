import React, { useState } from 'react';
import type { GeneratedContent } from './types';
import { generateContentInsights } from './services/geminiService';
import { LoadingSpinner, QuizDisplay, HighlightsDisplay, SummaryResults, GlossaryDisplay } from './components/SummarizerComponents';
import { extractTextFromFile } from './utils/fileReader';
import { UploadCloudIcon, XIcon } from './components/icons';

type InsightType = 'summary' | 'concepts' | 'characters' | 'highlights' | 'quiz' | 'concept-map' | 'tone-style' | 'glossary' | 'eli5' | 'discussion-questions';

const BookSummarizerView: React.FC = () => {
    const [analysisMode, setAnalysisMode] = useState<'title' | 'file'>('title');
    
    // Title Mode State
    const [bookInput, setBookInput] = useState('');
    
    // File Mode State
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [fileContent, setFileContent] = useState<string | null>(null);
    const [isFileReading, setIsFileReading] = useState(false);
    const [fileError, setFileError] = useState<string | null>(null);

    // General State
    const [submittedBook, setSubmittedBook] = useState('');
    const [insightType, setInsightType] = useState<InsightType>('summary');
    const [insightFormat, setInsightFormat] = useState<'paragraph' | 'bullets'>('paragraph');
    const [insightPurpose, setInsightPurpose] = useState('a quick overview');
    const [generatedInsight, setGeneratedInsight] = useState<GeneratedContent | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const insightOptions: { value: InsightType; label: string; disabled?: boolean; }[] = [
        { value: 'summary', label: 'Full Summary' },
        { value: 'concepts', label: 'Key Concepts' },
        { value: 'characters', label: 'Character List', disabled: analysisMode === 'file' },
        { value: 'highlights', label: 'Highlights (Quotes, etc.)' },
        { value: 'concept-map', label: 'Concept Map' },
        { value: 'quiz', label: 'Quiz Questions' },
        { value: 'tone-style', label: 'Tone & Style Analysis' },
        { value: 'glossary', label: 'Key Terminology Glossary' },
        { value: 'eli5', label: 'ELI5 Explanation' },
        { value: 'discussion-questions', label: 'Discussion Questions' },
    ];

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploadedFile(file);
        setIsFileReading(true);
        setFileError(null);
        setFileContent(null);
        setGeneratedInsight(null);
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
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };


    const handleAnalyze = async () => {
        setIsGenerating(true);
        setGeneratedInsight(null);
        setError(null);
        
        const params: Parameters<typeof generateContentInsights>[0] = {
            insightType: insightType,
            format: insightFormat,
            purpose: insightPurpose,
            language: 'English',
        };

        if (analysisMode === 'title') {
            if (!bookInput.trim()) return;
            setSubmittedBook(bookInput.trim());
            params.bookTitle = bookInput.trim();
        } else {
            if (!fileContent || !uploadedFile) return;
            setSubmittedBook(uploadedFile.name);
            params.textContent = fileContent;
        }

        try {
            const result = await generateContentInsights(params);
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
        handleClearFile();
    }
    
    const isAnalyzeDisabled = isGenerating || (analysisMode === 'title' ? !bookInput.trim() : !fileContent || isFileReading);

    return (
        <div className="flex-1 flex flex-col p-4 sm:p-6 bg-slate-900/50 overflow-y-auto">
            <h1 className="text-3xl font-bold text-white mb-2">Book & Document Analyzer</h1>
            <p className="text-slate-400 mb-6">Enter a book title or upload a document to get AI-generated summaries, key concepts, quizzes, and more.</p>

            {!submittedBook ? (
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 max-w-3xl mx-auto w-full">
                    <div className="flex border-b border-slate-700 mb-4">
                        <button onClick={() => setAnalysisMode('title')} className={`px-4 py-2 text-sm font-medium transition-colors ${analysisMode === 'title' ? 'border-b-2 border-indigo-500 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>Analyze by Title</button>
                        <button onClick={() => setAnalysisMode('file')} className={`px-4 py-2 text-sm font-medium transition-colors ${analysisMode === 'file' ? 'border-b-2 border-indigo-500 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>Analyze from File</button>
                    </div>

                    {analysisMode === 'title' ? (
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input type="text" value={bookInput} onChange={e => setBookInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAnalyze()} placeholder="e.g., 'The Great Gatsby' or 'Sapiens'" className="flex-grow bg-slate-800 border border-slate-600 rounded-md px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"/>
                            <button onClick={handleAnalyze} disabled={isAnalyzeDisabled} className="bg-indigo-700 text-white font-semibold px-5 py-2 rounded-md hover:bg-indigo-600 transition-colors disabled:bg-indigo-900/50 disabled:cursor-not-allowed flex items-center justify-center">Analyze</button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <label htmlFor="file-upload" className="relative block w-full border-2 border-dashed border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-500 transition-colors">
                                <UploadCloudIcon className="mx-auto h-12 w-12 text-slate-500"/>
                                <span className="mt-2 block text-sm font-semibold text-slate-300">
                                    {isFileReading ? 'Reading file...' : (uploadedFile ? `File: ${uploadedFile.name}` : 'Click to upload or drag and drop')}
                                </span>
                                <span className="mt-1 block text-xs text-slate-500">PDF or DOCX</span>
                                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.docx"/>
                            </label>
                            {fileError && <p className="text-red-400 text-sm text-center">{fileError}</p>}
                            {(uploadedFile || isFileReading) && (
                                <div className="flex items-center justify-center gap-4">
                                    <button onClick={handleAnalyze} disabled={isAnalyzeDisabled} className="bg-indigo-700 text-white font-semibold px-5 py-2 rounded-md hover:bg-indigo-600 transition-colors disabled:bg-indigo-900/50 disabled:cursor-not-allowed flex items-center justify-center">
                                        {isFileReading ? <LoadingSpinner/> : 'Analyze'}
                                    </button>
                                    <button onClick={handleClearFile} className="p-2 text-slate-400 hover:text-white"><XIcon className="w-5 h-5"/></button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <>
                    <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
                        <div>
                            <p className="text-slate-400">AI Insights for:</p>
                            <h2 className="text-2xl font-bold text-white italic break-all">"{submittedBook}"</h2>
                        </div>
                        <button onClick={handleReset} className="text-sm bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-md flex-shrink-0">
                            Analyze Another
                        </button>
                    </div>

                    <div className="space-y-4 bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                        <h3 className="text-xl font-semibold text-purple-400">Generator Controls</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs font-medium text-slate-400 block mb-1">Insight Type</label>
                                <select value={insightType} onChange={e => setInsightType(e.target.value as any)} className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                                    {insightOptions.map(opt => <option key={opt.value} value={opt.value} disabled={opt.disabled}>{opt.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-400 block mb-1">Format</label>
                                <select value={insightFormat} onChange={e => setInsightFormat(e.target.value as any)} className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" disabled={!['summary', 'concepts'].includes(insightType)}>
                                    <option value="paragraph">Paragraph</option>
                                    <option value="bullets">Bullet Points</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-400 block mb-1">Purpose / Context</label>
                                <input type="text" value={insightPurpose} onChange={e => setInsightPurpose(e.target.value)} placeholder="e.g., preparing for an exam" className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"/>
                            </div>
                        </div>
                        <button onClick={handleAnalyze} disabled={isGenerating} className="w-full bg-indigo-700 text-white font-semibold px-5 py-2 rounded-md hover:bg-indigo-600 transition-colors disabled:bg-indigo-900/50 flex items-center justify-center gap-2">
                            {isGenerating && <LoadingSpinner />}
                            {isGenerating ? 'Regenerating...' : 'Regenerate'}
                        </button>
                    </div>

                    {isGenerating && <div className="text-center text-slate-400 flex items-center justify-center gap-2 mt-4"><LoadingSpinner /> AI is analyzing... This may take a moment.</div>}
                    {error && <div className="text-red-400 whitespace-pre-wrap mt-4">{error}</div>}
                    
                    {generatedInsight && (
                    <div className="mt-4">
                        {generatedInsight.quiz && <QuizDisplay quizData={generatedInsight.quiz} onTryAgain={() => setGeneratedInsight(null)} />}
                        {generatedInsight.highlights && <HighlightsDisplay highlights={generatedInsight.highlights} title={submittedBook} />}
                        {generatedInsight.glossary && <GlossaryDisplay glossary={generatedInsight.glossary} title={submittedBook} />}
                        {(generatedInsight.text || generatedInsight.summary || generatedInsight.mermaidCode) && (
                            <SummaryResults 
                                summaryContent={generatedInsight}
                                summaryType={insightType === 'concept-map' ? 'concept-map' : insightFormat}
                                title={submittedBook}
                            />
                        )}
                    </div>
                    )}
                </>
            )}
        </div>
    );
};

export default BookSummarizerView;