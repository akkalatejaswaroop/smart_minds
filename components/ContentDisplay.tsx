// Add mermaid to the window object for TypeScript
declare global {
  interface Window {
    mermaid: any;
  }
}

import React, { useRef, useEffect, useState, useMemo } from 'react';
import type { OutputType, GeneratedContent, QuizQuestion } from '../types';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { exportAsPdf, exportAsDocx } from '../utils/export';
import { CopyIcon, DownloadIcon, SquareIcon, Volume2Icon, BrainCircuitIcon } from './icons';
import { renderSimpleMarkdown } from '../utils/markdown';

interface ContentDisplayProps {
  outputType: OutputType;
  generatedContent: GeneratedContent | null;
  isLoading: boolean;
  error: string | null;
  conceptName?: string;
  language?: string;
}

// --- Reusable Quiz Component ---
const QuizDisplay: React.FC<{ quizData: QuizQuestion[] }> = ({ quizData }) => {
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [isQuizSubmitted, setIsQuizSubmitted] = useState<boolean>(false);
    const [quizScore, setQuizScore] = useState<number>(0);
    
    // Reset state when quiz data changes
    useEffect(() => {
        setUserAnswers({});
        setIsQuizSubmitted(false);
        setQuizScore(0);
    }, [quizData]);

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
    };

    if (!quizData) {
        return <div className="text-center text-slate-400">Loading quiz...</div>;
    }

    return (
        <div className="space-y-8">
            {!isQuizSubmitted ? (
                <>
                    {quizData.map((q, qIndex) => (
                        <div key={qIndex} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                            <p className="font-semibold mb-3">{qIndex + 1}. {q.question}</p>
                            <div className="space-y-2">
                                {q.options.map((option, oIndex) => (
                                    <label key={oIndex} className="flex items-center p-2 rounded-md hover:bg-slate-700 cursor-pointer">
                                        <input
                                            type="radio"
                                            name={`question-${qIndex}`}
                                            value={option}
                                            onChange={() => handleAnswerChange(qIndex, option)}
                                            checked={userAnswers[qIndex] === option}
                                            className="mr-3 h-4 w-4 bg-slate-700 border-slate-600 text-indigo-500 focus:ring-indigo-600"
                                        />
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

const OutputActions: React.FC<{
  contentRef: React.RefObject<HTMLDivElement>;
  rawText: string;
  fileName: string;
  language: string;
}> = ({ contentRef, rawText, fileName, language }) => {
    const [isCopied, setIsCopied] = useState(false);
    const { isSpeaking, isAvailable, speak, cancel } = useTextToSpeech(rawText, language);

    const handleCopy = () => {
        if (rawText) {
            navigator.clipboard.writeText(rawText).then(() => {
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
        <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-slate-700">
             <button onClick={handleCopy} className="p-2 rounded-md bg-slate-700 hover:bg-slate-600 transition-colors text-slate-300 flex items-center gap-2" aria-label="Copy to clipboard">
                <span className="text-sm">{isCopied ? 'Copied!' : 'Copy'}</span><CopyIcon />
            </button>
             <button onClick={handleDocxExport} className="p-2 rounded-md bg-slate-700 hover:bg-slate-600 transition-colors text-slate-300 flex items-center gap-2" aria-label="Download as DOCX">
                <span>DOCX</span><DownloadIcon />
            </button>
             <button onClick={handlePdfExport} className="p-2 rounded-md bg-slate-700 hover:bg-slate-600 transition-colors text-slate-300 flex items-center gap-2" aria-label="Download as PDF">
                <span>PDF</span><DownloadIcon />
            </button>
            {isAvailable && (
                <button onClick={handleTtsToggle} className="p-2 rounded-md bg-slate-700 hover:bg-slate-600 transition-colors text-slate-300" aria-label={isSpeaking ? "Stop speech" : "Read aloud"}>
                    {isSpeaking ? <SquareIcon /> : <Volume2Icon />}
                </button>
            )}
        </div>
    );
};

export const ContentDisplay: React.FC<ContentDisplayProps> = ({
  outputType,
  generatedContent,
  isLoading,
  error,
  conceptName,
  language = 'English',
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const mermaidRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderMermaid = async () => {
      if (outputType === 'concept-map' && generatedContent?.mermaidCode && mermaidRef.current && window.mermaid) {
        try {
            mermaidRef.current.innerHTML = ''; // Clear previous
            await window.mermaid.initialize({ startOnLoad: false });
            const { svg } = await window.mermaid.render('mermaid-graph-display', generatedContent.mermaidCode);
            mermaidRef.current.innerHTML = svg;
        } catch (e) {
          console.error('Mermaid rendering failed:', e);
          if (mermaidRef.current) {
              mermaidRef.current.innerHTML = `<p class="text-red-400">Error rendering concept map. Mermaid syntax might be invalid.</p><pre class="text-xs text-slate-400 p-2 bg-slate-900 rounded-md">${generatedContent.mermaidCode}</pre>`;
          }
        }
      }
    };
    renderMermaid();
  }, [outputType, generatedContent]);
  
  const rawTextForTts = useMemo(() => {
    if (!generatedContent) return '';
    if (outputType === 'concept-map') return generatedContent.summary || '';
    if (outputType === 'quiz' && generatedContent.quiz) {
      return generatedContent.quiz.map(q => `Question: ${q.question} Options: ${q.options.join(', ')}`).join('. ');
    }
    return generatedContent.text || '';
  }, [generatedContent, outputType]);


  const renderContent = () => {
    if (isLoading && !generatedContent) {
        return (
            <div className="text-center text-slate-400">
                <p>Generating content... Please wait.</p>
            </div>
        );
    }

    if (error) {
        return <div className="text-red-400 whitespace-pre-wrap">{error}</div>;
    }

    if (!generatedContent) {
        return (
            <div className="text-center text-slate-500">
                <BrainCircuitIcon className="mx-auto w-12 h-12 mb-4" />
                <h3 className="text-lg font-semibold">Your AI-generated content will appear here.</h3>
                <p className="text-sm">Configure the options above and click "Generate Content" to begin.</p>
            </div>
        );
    }
    
    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div ref={contentRef} className="prose prose-invert max-w-none">
                {outputType === 'concept-map' && (
                    <>
                        <div dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(generatedContent.summary || '') }} />
                        <div ref={mermaidRef} className="mt-4 flex justify-center" />
                    </>
                )}
                {outputType === 'quiz' && generatedContent.quiz && (
                    <QuizDisplay quizData={generatedContent.quiz} />
                )}
                {outputType !== 'concept-map' && outputType !== 'quiz' && (
                    <div dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(generatedContent.text || '') }} />
                )}
            </div>
             {outputType !== 'quiz' && (
                 <OutputActions
                    contentRef={contentRef}
                    rawText={rawTextForTts}
                    fileName={`${conceptName || 'generated'}_${outputType}`}
                    language={language}
                />
             )}
        </div>
    );
  };
  
  return renderContent();
};

export default ContentDisplay;
