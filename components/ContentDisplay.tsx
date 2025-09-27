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
import { CopyIcon, DownloadIcon, SquareIcon, Volume2Icon } from './icons';
import { renderSimpleMarkdown } from '../utils/markdown';

interface ContentDisplayProps {
  outputType: OutputType;
  setOutputType: (type: OutputType) => void;
  purpose: string;
  setPurpose: (purpose: string) => void;
  language: string;
  setLanguage: (lang: string) => void;
  onGenerate: () => void;
  generatedContent: GeneratedContent | null;
  isLoading: boolean;
  error: string | null;
  conceptName?: string;
}

const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Hindi', 'Mandarin', 'Telugu'];
const PURPOSES = [
    'preparing for a college exam',
    'understanding a new topic',
    'reviewing for a quiz',
    'getting a quick summary'
];

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
        return <div className="text-center text-gray-400">Loading quiz...</div>;
    }

    return (
        <div className="space-y-8">
            {!isQuizSubmitted ? (
                <>
                    {quizData.map((q, qIndex) => (
                        <div key={qIndex} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                            <p className="font-semibold mb-3">{qIndex + 1}. {q.question}</p>
                            <div className="space-y-2">
                                {q.options.map((option, oIndex) => (
                                    <label key={oIndex} className="flex items-center p-2 rounded-md hover:bg-gray-700 cursor-pointer">
                                        <input
                                            type="radio"
                                            name={`question-${qIndex}`}
                                            value={option}
                                            onChange={() => handleAnswerChange(qIndex, option)}
                                            checked={userAnswers[qIndex] === option}
                                            className="mr-3 h-4 w-4 bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-600"
                                        />
                                        <span>{option}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                    <button 
                      onClick={handleSubmitQuiz} 
                      className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Submit Quiz
                    </button>
                </>
            ) : (
                <>
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-white">Quiz Results</h2>
                        <p className="text-lg text-blue-400">You scored {quizScore} out of {quizData.length}</p>
                    </div>
                    {quizData.map((q, qIndex) => {
                        const userAnswer = userAnswers[qIndex];
                        const isCorrect = userAnswer === q.answer;
                        return (
                            <div key={qIndex} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 mb-4">
                                <p className="font-semibold mb-2">{qIndex + 1}. {q.question}</p>
                                <p className={`text-sm ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                    Your answer: {userAnswer || 'Not answered'} {isCorrect ? ' (Correct)' : ` (Incorrect)`}
                                </p>
                                 {!isCorrect && <p className="text-sm text-gray-300">Correct answer: {q.answer}</p>}
                                <div className="mt-3 pt-3 border-t border-gray-700">
                                    <p className="text-sm font-semibold text-sky-400">Explanation:</p>
                                    <p className="text-sm text-gray-400">{q.explanation}</p>
                                </div>
                            </div>
                        );
                    })}
                    <button 
                      onClick={handleTryAgain} 
                      className="w-full bg-gray-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-gray-500 transition-colors"
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
  setOutputType,
  purpose,
  setPurpose,
  language,
  setLanguage,
  onGenerate,
  generatedContent,
  isLoading,
  error,
  conceptName,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [mermaidSvg, setMermaidSvg] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const plainTextContent = generatedContent?.text || '';
  const { isSpeaking, isAvailable, speak, cancel } = useTextToSpeech(plainTextContent, language);

  useEffect(() => {
    const renderMermaid = async () => {
      if (outputType === 'concept-map' && generatedContent?.mermaidCode && mermaidRef.current) {
        try {
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
    if (contentRef.current) {
      navigator.clipboard.writeText(contentRef.current.innerText).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
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
    <div className="flex-1 flex flex-col p-6 bg-black/20 overflow-y-auto">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center bg-gray-800/50 rounded-lg p-1">
          {(['explanation', 'presentation', 'examples', 'summary', 'quiz', 'concept-map'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setOutputType(type)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                outputType === type ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
              }`}
              aria-pressed={outputType === type}
            >
              {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {outputType !== 'concept-map' && outputType !== 'quiz' && (
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {PURPOSES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          )}
          <select 
            value={language} 
            onChange={e => setLanguage(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
          </select>

          <button
            onClick={onGenerate}
            disabled={isLoading}
            className="bg-blue-600 text-white font-semibold px-5 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-800/50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              'Generate'
            )}
          </button>
        </div>
      </div>

      {/* Output */}
      <div className="flex-1 bg-gray-900/70 rounded-lg p-6 overflow-y-auto relative border border-gray-800">
        {isLoading && !generatedContent && <div className="text-center text-gray-400">Generating... Please wait.</div>}
        {error && <div className="text-red-400 whitespace-pre-wrap">{error}</div>}
        
        {generatedContent && !isLoading && (
          <>
            {outputType === 'quiz' && generatedContent.quiz ? (
              <QuizDisplay quizData={generatedContent.quiz} />
            ) : (
              <div 
                  ref={contentRef} 
                  className="prose prose-invert max-w-none 
                            prose-h1:text-blue-400 prose-h1:mb-4
                            prose-h2:text-sky-400 prose-h2:border-b prose-h2:border-gray-700 prose-h2:pb-2 prose-h2:mt-8
                            prose-h3:text-sky-500
                            prose-strong:text-blue-300
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
          <button onClick={handleCopy} className="p-2 rounded-md bg-gray-800 hover:bg-gray-700 transition-colors text-gray-300" aria-label="Copy to clipboard">
            <span className="text-sm mr-2">{isCopied ? 'Copied!' : ''}</span><CopyIcon />
          </button>
          <button onClick={handlePdfExport} className="p-2 rounded-md bg-gray-800 hover:bg-gray-700 transition-colors text-gray-300" aria-label="Download as PDF">
            <DownloadIcon /><span className="ml-1 text-xs">PDF</span>
          </button>
           <button onClick={handleDocxExport} className="p-2 rounded-md bg-gray-800 hover:bg-gray-700 transition-colors text-gray-300" aria-label="Download as DOCX">
            <DownloadIcon /><span className="ml-1 text-xs">DOCX</span>
          </button>
          {isAvailable && (
            <button onClick={handleTtsToggle} className="p-2 rounded-md bg-gray-800 hover:bg-gray-700 transition-colors text-gray-300" aria-label={isSpeaking ? "Stop text-to-speech" : "Start text-to-speech"}>
              {isSpeaking ? <SquareIcon /> : <Volume2Icon />}
            </button>
          )}
        </div>
      )}
    </div>
  );
};