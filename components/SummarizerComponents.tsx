import React, { useState, useEffect, useRef } from 'react';
import type { GeneratedContent, QuizQuestion, GlossaryTerm } from '../types';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { exportAsPdf, exportAsDocx } from '../utils/export';
import { CopyIcon, DownloadIcon, SquareIcon, Volume2Icon } from './icons';
import { renderSimpleMarkdown } from '../utils/markdown';

// Add mermaid to the window object for TypeScript
declare global {
  interface Window {
    mermaid: any;
  }
}

export const LoadingSpinner: React.FC<{className?: string}> = ({ className="" }) => (
    <svg className={`animate-spin h-5 w-5 text-white ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export const QuizDisplay: React.FC<{ quizData: QuizQuestion[], onTryAgain: () => void }> = ({ quizData, onTryAgain }) => {
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [isQuizSubmitted, setIsQuizSubmitted] = useState<boolean>(false);
    const [quizScore, setQuizScore] = useState<number>(0);

    const handleAnswerChange = (questionIndex: number, answer: string) => {
        setUserAnswers(prev => ({ ...prev, [questionIndex]: answer }));
    };
  
    const handleSubmitQuiz = () => {
        let score = 0;
        quizData.forEach((q, index) => {
            if (userAnswers[index] === q.answer) {
                score++;
            }
        });
        setQuizScore(score);
        setIsQuizSubmitted(true);
    };
  
    const handleTryAgain = () => {
        setUserAnswers({});
        setIsQuizSubmitted(false);
        setQuizScore(0);
        onTryAgain();
    };

    return (
        <div className="space-y-8 mt-6">
            {!isQuizSubmitted ? (
                <>
                    {quizData.map((q, qIndex) => (
                        <div key={qIndex} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                            <p className="font-semibold mb-3">{qIndex + 1}. {q.question}</p>
                            <div className="space-y-2">
                                {q.options.map((option, oIndex) => (
                                    <label key={oIndex} className="flex items-center p-2 rounded-md hover:bg-slate-700 cursor-pointer">
                                        <input type="radio" name={`question-${qIndex}`} value={option} onChange={() => handleAnswerChange(qIndex, option)} checked={userAnswers[qIndex] === option} className="mr-3 h-4 w-4 bg-slate-700 border-slate-600 text-indigo-500 focus:ring-indigo-600" />
                                        <span>{option}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                    <button onClick={handleSubmitQuiz} className="w-full bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-600 transition-colors">Submit Quiz</button>
                </>
            ) : (
                <>
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-white">Quiz Results</h2>
                        <p className="text-lg text-purple-400">You scored {quizScore} out of {quizData.length}</p>
                    </div>
                    {quizData.map((q, qIndex) => {
                        const userAnswer = userAnswers[qIndex];
                        const isCorrect = userAnswer === q.answer;
                        return (
                            <div key={qIndex} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 mb-4">
                                <p className="font-semibold mb-2">{qIndex + 1}. {q.question}</p>
                                <p className={`text-sm ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>Your answer: {userAnswer || 'Not answered'} {isCorrect ? ' (Correct)' : ` (Incorrect)`}</p>
                                {!isCorrect && <p className="text-sm text-slate-300">Correct answer: {q.answer}</p>}
                                <div className="mt-3 pt-3 border-t border-slate-700">
                                    <p className="text-sm font-semibold text-indigo-400">Explanation:</p>
                                    <p className="text-sm text-slate-400">{q.explanation}</p>
                                </div>
                            </div>
                        );
                    })}
                    <button onClick={handleTryAgain} className="w-full bg-slate-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-slate-500 transition-colors">Try Again</button>
                </>
            )}
        </div>
    );
};

export const ResultsActionBar: React.FC<{
    contentRef: React.RefObject<HTMLDivElement>;
    plainTextContent: string;
    fileName: string;
}> = ({ contentRef, plainTextContent, fileName }) => {
    const [isCopied, setIsCopied] = useState(false);
    const { isSpeaking, isAvailable, speak, cancel } = useTextToSpeech(plainTextContent, 'English');

    const handleCopy = () => {
        if (plainTextContent) {
            navigator.clipboard.writeText(plainTextContent).then(() => {
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            });
        }
    };
    const handlePdfExport = () => {
        if (contentRef.current) {
            exportAsPdf(contentRef.current, fileName);
        }
    };
    const handleDocxExport = () => {
        if (contentRef.current) {
            exportAsDocx(contentRef.current, fileName);
        }
    };
    const handleTtsToggle = () => isSpeaking ? cancel() : speak();
    
    return (
        <div className="flex items-center gap-2">
            <button onClick={handleCopy} className="p-2 rounded-md bg-slate-700 hover:bg-slate-600 transition-colors text-slate-300" aria-label="Copy to clipboard">
                <span className="text-sm mr-2">{isCopied ? 'Copied!' : ''}</span><CopyIcon />
            </button>
            <button onClick={handlePdfExport} className="p-2 rounded-md bg-slate-700 hover:bg-slate-600 transition-colors text-slate-300" aria-label="Download as PDF">
                <DownloadIcon /><span className="ml-1 text-xs">PDF</span>
            </button>
            <button onClick={handleDocxExport} className="p-2 rounded-md bg-slate-700 hover:bg-slate-600 transition-colors text-slate-300" aria-label="Download as DOCX">
                <DownloadIcon /><span className="ml-1 text-xs">DOCX</span>
            </button>
            {isAvailable && (
                <button onClick={handleTtsToggle} className="p-2 rounded-md bg-slate-700 hover:bg-slate-600 transition-colors text-slate-300" aria-label={isSpeaking ? "Stop speech" : "Read aloud"}>
                    {isSpeaking ? <SquareIcon /> : <Volume2Icon />}
                </button>
            )}
        </div>
    );
};

export const HighlightsDisplay: React.FC<{ highlights: NonNullable<GeneratedContent['highlights']>; title: string; }> = ({ highlights, title }) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const plainTextContent = `Key Ideas: ${highlights.keyIdeas.join('. ')}. Quotes: ${highlights.quotes.join('. ')}. Passages: ${highlights.passages.join('. ')}`;

    return (
        <div className="mt-4 bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div ref={contentRef} className="prose prose-invert max-w-none space-y-6">
                <div>
                    <h3 className="text-purple-400 border-b border-slate-700 pb-2">Key Ideas</h3>
                    <ul className="list-disc pl-5 space-y-2 mt-2">
                        {highlights.keyIdeas.map((idea, i) => <li key={i}>{idea}</li>)}
                    </ul>
                </div>
                 <div>
                    <h3 className="text-purple-400 border-b border-slate-700 pb-2">Notable Quotes</h3>
                    <div className="space-y-4 mt-2">
                        {highlights.quotes.map((quote, i) => <blockquote key={i} className="border-l-4 border-indigo-500 pl-4 italic text-slate-400">{quote}</blockquote>)}
                    </div>
                </div>
                 <div>
                    <h3 className="text-purple-400 border-b border-slate-700 pb-2">Significant Passages</h3>
                    <div className="space-y-4 mt-2 text-slate-400">
                        {highlights.passages.map((passage, i) => <p key={i}>{passage}</p>)}
                    </div>
                </div>
            </div>
             <div className="flex items-center justify-end gap-4 mt-6 pt-4 border-t border-slate-700">
                <ResultsActionBar contentRef={contentRef} plainTextContent={plainTextContent} fileName={`${title}_highlights`} />
            </div>
        </div>
    );
};

export const GlossaryDisplay: React.FC<{ glossary: GlossaryTerm[]; title: string; }> = ({ glossary, title }) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const plainTextContent = glossary.map(item => `${item.term}: ${item.definition}`).join('\n');

    return (
        <div className="mt-4 bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div ref={contentRef} className="prose prose-invert max-w-none">
                <h3 className="text-purple-400 border-b border-slate-700 pb-2">Key Terminology</h3>
                <dl className="mt-4 space-y-4">
                    {glossary.map((item, i) => (
                        <div key={i}>
                            <dt className="font-bold text-indigo-400">{item.term}</dt>
                            <dd className="text-slate-400 pl-4">{item.definition}</dd>
                        </div>
                    ))}
                </dl>
            </div>
            <div className="flex items-center justify-end gap-4 mt-6 pt-4 border-t border-slate-700">
                <ResultsActionBar contentRef={contentRef} plainTextContent={plainTextContent} fileName={`${title}_glossary`} />
            </div>
        </div>
    );
};

export const SummaryResults: React.FC<{
  summaryContent: GeneratedContent;
  summaryType: string;
  title: string;
  onGenerateQuiz?: () => void;
  isGeneratingQuiz?: boolean;
}> = ({ summaryContent, summaryType, title, onGenerateQuiz, isGeneratingQuiz }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [mermaidSvg, setMermaidSvg] = useState('');
  
  const plainTextContent = summaryType === 'concept-map' ? summaryContent?.summary : summaryContent?.text;

  useEffect(() => {
    const renderMermaid = async () => {
      if (summaryType === 'concept-map' && summaryContent?.mermaidCode && mermaidRef.current && window.mermaid) {
        try {
          mermaidRef.current.innerHTML = '';
          const { svg } = await window.mermaid.render('mermaid-graph-summary', summaryContent.mermaidCode);
          setMermaidSvg(svg);
        } catch (e) {
          console.error('Mermaid rendering failed:', e);
          setMermaidSvg('<p class="text-red-400">Error rendering concept map.</p>');
        }
      }
    };
    renderMermaid();
  }, [summaryType, summaryContent]);

  return (
    <div className="mt-4 bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div ref={contentRef} className="prose prose-invert max-w-none">
        {summaryType === 'concept-map' ? (
          <>
            <div dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(summaryContent.summary || '') }} />
            <div ref={mermaidRef} className="mt-4" dangerouslySetInnerHTML={{ __html: mermaidSvg }} />
          </>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(summaryContent.text || '') }} />
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-slate-700">
        {onGenerateQuiz ? (
             <button onClick={onGenerateQuiz} disabled={isGeneratingQuiz} className="bg-purple-700 text-white font-semibold px-4 py-2 rounded-md hover:bg-purple-600 transition-colors disabled:bg-purple-800/50 flex items-center justify-center gap-2">
                {isGeneratingQuiz && <LoadingSpinner />}
                {isGeneratingQuiz ? 'Generating Quiz...' : 'Quiz Yourself on This'}
            </button>
        ) : <div />}
        <ResultsActionBar contentRef={contentRef} plainTextContent={plainTextContent || ''} fileName={`${title}_summary`} />
      </div>
    </div>
  );
};