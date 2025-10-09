// Add mermaid to the window object for TypeScript
declare global {
  interface Window {
    mermaid: any;
  }
}

import React, { useRef, useEffect, useState } from 'react';
import type { OutputType, GeneratedContent, QuizQuestion } from '../types';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { exportAsPdf, exportAsDocx } from '../utils/export';
import { CopyIcon, DownloadIcon, SquareIcon, Volume2Icon, ClipboardCodeIcon } from './icons';
import { renderSimpleMarkdown } from '../utils/markdown';

interface ContentDisplayProps {
  outputType: OutputType;
  generatedContent: GeneratedContent | null;
  isLoading: boolean;
  error: string | null;
  conceptName?: string;
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
                    <button 
                      onClick={handleSubmitQuiz} 
                      className="w-full bg-indigo-700 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-600 transition-colors"
                    >
                        Submit Quiz
                    </button>
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
                                <p className={`text-sm ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                    Your answer: {userAnswer || 'Not answered'} {isCorrect ? ' (Correct)' : ` (Incorrect)`}
                                </p>
                                 {!isCorrect && <p className="text-sm text-slate-300">Correct answer: {q.answer}</p>}
                                <div className="mt-3 pt-3 border-t border-slate-700">
                                    <p className="text-sm font-semibold text-indigo-400">Explanation:</p>
                                    <p className="text-sm text-slate-400">{q.explanation}</p>
                                </div>
                            </div>
                        );
                    })}
                    <button 
                      onClick={handleTryAgain} 
                      className="w-full bg-slate-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-slate-500 transition-colors"
                    >
                        Try Again
                    </button>
                </>
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
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [mermaidSvg, setMermaidSvg] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isCodeCopied, setIsCodeCopied] = useState(false);

  const textToCopy = outputType === 'concept-map'
    ? generatedContent?.summary || ''
    : generatedContent?.text || '';

  const { isSpeaking, isAvailable, speak, cancel } = useTextToSpeech(textToCopy, 'English'); // Language can be passed if needed

  useEffect(() => {
    const renderMermaid = async () => {
      if (outputType === 'concept-map' && generatedContent?.mermaidCode && mermaidRef.current) {
        try {
          mermaidRef.current.innerHTML = '';
          const { svg } = await window.mermaid.render('mermaid-graph', generatedContent.mermaidCode);
          setMermaidSvg(svg);
        } catch (e) {
          console.error('Mermaid rendering failed:', e);
          setMermaidSvg('<p class="text-red-400">Error rendering concept map.</p>');
        }
      }
    };
    renderMermaid();
  }, [outputType, generatedContent]);

  const handleCopy = () => {
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
    }
  };
  
  const handleCopyCode = () => {
    if (generatedContent?.mermaidCode) {
        navigator.clipboard.writeText(generatedContent.mermaidCode).then(() => {
            setIsCodeCopied(true);
            setTimeout(() => setIsCodeCopied(false), 2000);
        });
    }
  };

  const handlePdfExport = () => {
    if (contentRef.current) {
      exportAsPdf(contentRef.current, `${conceptName}_${outputType}`);
    }
  };

  const handleDocxExport = () => {
    if (contentRef.current) {
      exportAsDocx(contentRef.current, `${conceptName}_${outputType}`);
    }
  };

  const handleTtsToggle = () => {
    if (isSpeaking) {
      cancel();
    } else {
      speak();
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Output */}
      <div className="flex-1 bg-slate-800 rounded-lg p-6 overflow-y-auto relative border border-slate-700 min-h-[400px]">
        {isLoading && !generatedContent && <div className="text-center text-slate-400">Generating... Please wait.</div>}
        {error && <div className="text-red-400 whitespace-pre-wrap">{error}</div>}
        
        {!isLoading && !generatedContent && !error && (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <h3 className="text-lg font-semibold">Ready to learn?</h3>
                <p className="text-sm text-center">Enter a concept and choose your options above to get started.</p>
            </div>
        )}
        
        {generatedContent && !isLoading && (
          <>
            {outputType === 'quiz' && generatedContent.quiz ? (
              <QuizDisplay quizData={generatedContent.quiz} />
            ) : (
              <div 
                  ref={contentRef} 
                  className="prose prose-invert max-w-none 
                            prose-h1:text-pink-400 prose-h1:mb-4
                            prose-h2:text-purple-400 prose-h2:border-b prose-h2:border-slate-600 prose-h2:pb-2 prose-h2:mt-8
                            prose-h3:text-indigo-400
                            prose-strong:text-purple-300
                            prose-ul:list-disc prose-ul:pl-6
                            prose-ol:list-decimal prose-ol:pl-6
                            prose-li:my-1"
              >
                {outputType === 'concept-map' ? (
                  <>
                    <div dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(generatedContent.summary || '') }} />
                    <div ref={mermaidRef} className="mt-4" dangerouslySetInnerHTML={{ __html: mermaidSvg }} />
                  </>
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(generatedContent.text || '') }} />
                )}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Action Bar */}
      {generatedContent && !isLoading && !error && outputType !== 'quiz' && (
        <div className="flex items-center justify-end gap-2 mt-4">
          {outputType === 'concept-map' && (
             <button onClick={handleCopyCode} className="flex items-center gap-2 p-2 rounded-md bg-slate-700 hover:bg-slate-600 transition-colors text-slate-300" aria-label="Copy Mermaid Code">
                <span className="text-sm">{isCodeCopied ? 'Copied!' : 'Copy Code'}</span><ClipboardCodeIcon />
            </button>
          )}
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
            <button onClick={handleTtsToggle} className="p-2 rounded-md bg-slate-700 hover:bg-slate-600 transition-colors text-slate-300" aria-label={isSpeaking ? "Stop text-to-speech" : "Start text-to-speech"}>
              {isSpeaking ? <SquareIcon /> : <Volume2Icon />}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
