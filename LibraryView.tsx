import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BOOKS } from './constants/books';
import type { Book, GeneratedContent, QuizQuestion } from './types';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useTextToSpeech } from './hooks/useTextToSpeech';
import { generateBookSummary, generateQuizFromContent, generateRecommendations } from './services/geminiService';
import { MicrophoneIcon, SearchIcon, ArrowLeftIcon, CopyIcon, DownloadIcon, Volume2Icon, SquareIcon } from './components/icons';
import { renderSimpleMarkdown } from './utils/markdown';
import { exportAsPdf, exportAsDocx } from './utils/export';

// --- Reusable Quiz Component ---
const QuizDisplay: React.FC<{ quizData: QuizQuestion[], onTryAgain: () => void }> = ({ quizData, onTryAgain }) => {
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
                        <div key={qIndex} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                            <p className="font-semibold mb-3">{qIndex + 1}. {q.question}</p>
                            <div className="space-y-2">
                                {q.options.map((option, oIndex) => (
                                    <label key={oIndex} className="flex items-center p-2 rounded-md hover:bg-gray-700 cursor-pointer">
                                        <input type="radio" name={`question-${qIndex}`} value={option} onChange={() => handleAnswerChange(qIndex, option)} checked={userAnswers[qIndex] === option} className="mr-3 h-4 w-4 bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-600" />
                                        <span>{option}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                    <button onClick={handleSubmitQuiz} className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">Submit Quiz</button>
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
                                <p className={`text-sm ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>Your answer: {userAnswer || 'Not answered'} {isCorrect ? ' (Correct)' : ` (Incorrect)`}</p>
                                {!isCorrect && <p className="text-sm text-gray-300">Correct answer: {q.answer}</p>}
                                <div className="mt-3 pt-3 border-t border-gray-700">
                                    <p className="text-sm font-semibold text-sky-400">Explanation:</p>
                                    <p className="text-sm text-gray-400">{q.explanation}</p>
                                </div>
                            </div>
                        );
                    })}
                    <button onClick={handleTryAgain} className="w-full bg-gray-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-gray-500 transition-colors">Try Again</button>
                </>
            )}
        </div>
    );
};


// --- Helper Components ---

const BookCard: React.FC<{ book: Book; onSelect: () => void }> = ({ book, onSelect }) => (
  <button onClick={onSelect} className="text-left group focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg">
    <div className="relative">
      <img src={book.coverImage} alt={book.title} className="w-full h-auto object-cover rounded-lg shadow-lg aspect-[2/3] transition-transform duration-300 group-hover:scale-105" />
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-lg">
        <p className="text-white font-bold text-center p-2">View Details</p>
      </div>
    </div>
    <h3 className="mt-2 font-bold text-white truncate">{book.title}</h3>
    <p className="text-sm text-gray-400 truncate">{book.author}</p>
  </button>
);

const SummaryResults: React.FC<{
  summaryContent: GeneratedContent;
  summaryType: 'paragraph' | 'bullets' | 'concept-map';
  title: string;
  onGenerateQuiz: () => void;
  isGeneratingQuiz: boolean;
}> = ({ summaryContent, summaryType, title, onGenerateQuiz, isGeneratingQuiz }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [mermaidSvg, setMermaidSvg] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  
  const plainTextContent = summaryType === 'concept-map' ? summaryContent?.summary : summaryContent?.text;
  const { isSpeaking, isAvailable, speak, cancel } = useTextToSpeech(plainTextContent || '', 'English');

  useEffect(() => {
    const renderMermaid = async () => {
      if (summaryType === 'concept-map' && summaryContent?.mermaidCode && mermaidRef.current && window.mermaid) {
        try {
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

  const handleCopy = () => {
    if (contentRef.current) {
      navigator.clipboard.writeText(contentRef.current.innerText).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
    }
  };

  const handlePdfExport = () => exportAsPdf(contentRef.current!, `${title}_summary`);
  const handleDocxExport = () => exportAsDocx(contentRef.current!, `${title}_summary`);
  const handleTtsToggle = () => isSpeaking ? cancel() : speak();

  return (
    <div className="mt-4 bg-gray-900/70 rounded-lg p-6 border border-gray-800">
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
      <div className="flex items-center justify-between gap-2 mt-4">
        <button onClick={onGenerateQuiz} disabled={isGeneratingQuiz} className="bg-sky-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-sky-700 transition-colors disabled:bg-sky-800/50">
            {isGeneratingQuiz ? 'Generating Quiz...' : 'Quiz Yourself on This Summary'}
        </button>
        <div className="flex items-center gap-2">
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
                <button onClick={handleTtsToggle} className="p-2 rounded-md bg-gray-800 hover:bg-gray-700 transition-colors text-gray-300" aria-label={isSpeaking ? "Stop speech" : "Read aloud"}>
                  {isSpeaking ? <SquareIcon /> : <Volume2Icon />}
                </button>
            )}
        </div>
      </div>
    </div>
  );
};


// --- Main View ---

export const LibraryView: React.FC = () => {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Book View State
  const [activeTab, setActiveTab] = useState<'read' | 'summarize' | 'details'>('read');
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [fontSize, setFontSize] = useState('text-base');
  const [theme, setTheme] = useState('dark');
  
  // Summarizer State
  const [summaryChapter, setSummaryChapter] = useState<string>('full');
  const [summaryType, setSummaryType] = useState<'paragraph' | 'bullets' | 'concept-map'>('paragraph');
  const [summaryPurpose, setSummaryPurpose] = useState('a quick overview');
  const [summaryContent, setSummaryContent] = useState<GeneratedContent | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string|null>(null);
  
  // Quiz State
  const [chapterQuiz, setChapterQuiz] = useState<GeneratedContent | null>(null);
  const [isGeneratingChapterQuiz, setIsGeneratingChapterQuiz] = useState(false);
  const [summaryQuiz, setSummaryQuiz] = useState<GeneratedContent | null>(null);
  const [isGeneratingSummaryQuiz, setIsGeneratingSummaryQuiz] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);

  // Recommendations State
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);

  const { transcript, isListening, startListening, stopListening } = useSpeechRecognition();

  useEffect(() => { if (transcript) setSearchTerm(transcript); }, [transcript]);

  const filteredBooks = useMemo(() =>
    BOOKS.filter(book =>
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.genre.toLowerCase().includes(searchTerm.toLowerCase())
    ), [searchTerm]
  );
  
  useEffect(() => {
    if (selectedBook && activeTab === 'details' && recommendations.length === 0) {
      const fetchRecommendations = async () => {
        setIsLoadingRecs(true);
        try {
          const recs = await generateRecommendations(selectedBook, BOOKS);
          setRecommendations(recs);
        } catch(e) { console.error("Failed to get recommendations", e); } 
        finally { setIsLoadingRecs(false); }
      };
      fetchRecommendations();
    }
  }, [selectedBook, activeTab, recommendations]);

  // Reset states when a new book is selected
  useEffect(() => {
    setCurrentChapterIndex(0);
    setChapterQuiz(null);
    setSummaryQuiz(null);
    setSummaryContent(null);
    setSummaryChapter('full');
  }, [selectedBook]);

  const handleGenerateSummary = async () => {
    if (!selectedBook) return;
    setIsSummarizing(true); setSummaryContent(null); setSummaryError(null); setSummaryQuiz(null);
    const contentToSummarize = summaryChapter === 'full' 
        ? selectedBook.chapters.map(c => `Chapter: ${c.title}\n${c.content}`).join('\n\n')
        : selectedBook.chapters[parseInt(summaryChapter, 10)].content;
    const scope = summaryChapter === 'full' ? 'the entire book' : `the chapter "${selectedBook.chapters[parseInt(summaryChapter, 10)].title}"`;
    try {
        const result = await generateBookSummary({ bookTitle: selectedBook.title, content: contentToSummarize, scope, format: summaryType, purpose: summaryPurpose, language: 'English' });
        setSummaryContent(result);
    } catch (err) { setSummaryError(`Failed to generate summary. Details: ${err instanceof Error ? err.message : "An unknown error occurred."}`); } 
    finally { setIsSummarizing(false); }
  };

  const handleGenerateQuiz = async (source: 'chapter' | 'summary') => {
      if (!selectedBook) return;
      let content = '';
      if (source === 'chapter') {
          setIsGeneratingChapterQuiz(true);
          content = selectedBook.chapters[currentChapterIndex].content;
      } else {
          if (!summaryContent) return;
          setIsGeneratingSummaryQuiz(true);
          content = summaryContent.text || summaryContent.summary || '';
      }
      setQuizError(null);
      try {
          const result = await generateQuizFromContent(content);
          if (source === 'chapter') setChapterQuiz(result);
          else setSummaryQuiz(result);
      } catch (err) { setQuizError(`Failed to generate quiz. Details: ${err instanceof Error ? err.message : "An unknown error occurred."}`); } 
      finally {
          if (source === 'chapter') setIsGeneratingChapterQuiz(false);
          else setIsGeneratingSummaryQuiz(false);
      }
  };

  const handleDownloadFullBook = (format: 'pdf' | 'docx') => {
    if (!selectedBook) return;
    const printableElement = document.createElement('div');
    let contentHtml = `<h1>${selectedBook.title}</h1><h2>by ${selectedBook.author}</h2><p>${selectedBook.summary}</p>`;
    selectedBook.chapters.forEach(chapter => {
      contentHtml += `<h3>${chapter.title}</h3><div>${renderSimpleMarkdown(chapter.content)}</div>`;
    });
    printableElement.innerHTML = contentHtml;
    // jsPDF needs element to be in DOM
    document.body.appendChild(printableElement);
    if(format === 'pdf') exportAsPdf(printableElement, selectedBook.title);
    else exportAsDocx(printableElement, selectedBook.title);
    document.body.removeChild(printableElement);
  };

  if (selectedBook) {
    const currentChapter = selectedBook.chapters[currentChapterIndex];
    return (
        <div className="flex-1 flex flex-col p-6 bg-black/20 overflow-y-auto">
            <button onClick={() => { setSelectedBook(null); setRecommendations([]); }} className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 mb-4 self-start">
                <ArrowLeftIcon /> Back to Library
            </button>
            <div className="flex flex-col lg:flex-row gap-6 items-start">
                <div className="w-full lg:w-1/4 flex-shrink-0">
                    <img src={selectedBook.coverImage} alt={selectedBook.title} className="w-full h-auto object-cover rounded-lg shadow-lg aspect-[2/3]" />
                    <h2 className="mt-4 text-2xl font-bold text-white">{selectedBook.title}</h2>
                    <p className="text-lg text-gray-400">{selectedBook.author}</p>
                </div>
                <div className="flex-1 w-full">
                    <div className="flex border-b border-gray-700">
                        {(['read', 'summarize', 'details'] as const).map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium transition-colors capitalize ${activeTab === tab ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>{tab}</button>
                        ))}
                    </div>
                    <div className="py-6">
                        {activeTab === 'read' && (
                            <div className="space-y-4">
                               <div className="flex justify-between items-center flex-wrap gap-4">
                                    <select value={currentChapterIndex} onChange={e => { setCurrentChapterIndex(parseInt(e.target.value)); setChapterQuiz(null); }} className="bg-gray-800 text-lg font-semibold text-sky-400 border border-gray-700 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                                      {selectedBook.chapters.map((chap, i) => <option key={i} value={i}>{chap.title}</option>)}
                                    </select>
                                    <div className="flex items-center gap-2">
                                        <select value={theme} onChange={e => setTheme(e.target.value)} className="bg-gray-800 text-xs border border-gray-700 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"><option value="dark">Dark</option><option value="light">Light</option></select>
                                        <div className="flex items-center bg-gray-800 rounded-md border border-gray-700">
                                            <button onClick={() => setFontSize('text-sm')} className={`px-2 py-1 text-xs ${fontSize === 'text-sm' ? 'bg-blue-600' : ''} rounded-l-md`}>A</button>
                                            <button onClick={() => setFontSize('text-base')} className={`px-2 py-1 text-sm ${fontSize === 'text-base' ? 'bg-blue-600' : ''}`}>A</button>
                                            <button onClick={() => setFontSize('text-lg')} className={`px-2 py-1 text-base ${fontSize === 'text-lg' ? 'bg-blue-600' : ''} rounded-r-md`}>A</button>
                                        </div>
                                    </div>
                               </div>
                                <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-900 text-gray-300' : 'bg-white text-gray-800'} transition-colors h-96 overflow-y-auto`}><p className={`${fontSize} leading-relaxed whitespace-pre-line transition-all`}>{currentChapter.content}</p></div>
                                <div className="mt-4">
                                  {!chapterQuiz ? (
                                      <button onClick={() => handleGenerateQuiz('chapter')} disabled={isGeneratingChapterQuiz} className="w-full bg-blue-600 text-white font-semibold px-5 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-800/50 flex items-center justify-center">
                                          {isGeneratingChapterQuiz ? 'Generating Quiz...' : 'Quiz Yourself on This Chapter'}
                                      </button>
                                  ) : chapterQuiz.quiz && (
                                      <QuizDisplay quizData={chapterQuiz.quiz} onTryAgain={() => setChapterQuiz(null)} />
                                  )}
                                  {quizError && <div className="text-red-400 mt-2">{quizError}</div>}
                                </div>
                            </div>
                        )}
                        {activeTab === 'summarize' && (
                            <div className="space-y-4">
                                <h3 className="text-xl font-semibold text-sky-400">AI Book Summarizer</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-xs font-medium text-gray-400 block mb-1">Content</label>
                                        <select value={summaryChapter} onChange={e => setSummaryChapter(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"><option value="full">Full Book</option>{selectedBook.chapters.map((chap, i) => <option key={i} value={i}>{chap.title}</option>)}</select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-400 block mb-1">Format</label>
                                        <select value={summaryType} onChange={e => setSummaryType(e.target.value as any)} className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"><option value="paragraph">Paragraph</option><option value="bullets">Bullet Points</option><option value="concept-map">Concept Map</option></select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-400 block mb-1">Purpose</label>
                                        <input type="text" value={summaryPurpose} onChange={e => setSummaryPurpose(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
                                    </div>
                                </div>
                                <button onClick={handleGenerateSummary} disabled={isSummarizing} className="w-full bg-blue-600 text-white font-semibold px-5 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-800/50 flex items-center justify-center">{isSummarizing ? 'Summarizing...' : 'Generate Summary'}</button>
                                {isSummarizing && <div className="text-center text-gray-400">AI is reading and summarizing... Please wait.</div>}
                                {summaryError && <div className="text-red-400 whitespace-pre-wrap">{summaryError}</div>}
                                {summaryContent && <SummaryResults summaryContent={summaryContent} summaryType={summaryType} title={selectedBook.title} onGenerateQuiz={() => handleGenerateQuiz('summary')} isGeneratingQuiz={isGeneratingSummaryQuiz} />}
                                {summaryQuiz?.quiz && <QuizDisplay quizData={summaryQuiz.quiz} onTryAgain={() => setSummaryQuiz(null)} />}
                                {quizError && !summaryError && <div className="text-red-400 mt-2">{quizError}</div>}
                            </div>
                        )}
                        {activeTab === 'details' && (
                            <div className="space-y-6">
                                <div><h3 className="text-xl font-semibold text-sky-400 mb-2">Details</h3><div className="text-sm space-y-2"><p><strong>Genre:</strong> {selectedBook.genre}</p><p><strong>Level:</strong> {selectedBook.level}</p><p><strong>Est. Reading Time:</strong> {selectedBook.readingTime}</p></div></div>
                                <div><h3 className="text-xl font-semibold text-sky-400 mb-2">Summary</h3><p className="text-sm text-gray-400 leading-relaxed">{selectedBook.summary}</p></div>
                                <div><h3 className="text-xl font-semibold text-sky-400 mb-2">Download Full Book</h3><div className="flex gap-4"><button onClick={() => handleDownloadFullBook('pdf')} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-md"><DownloadIcon /> PDF</button><button onClick={() => handleDownloadFullBook('docx')} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-md"><DownloadIcon /> DOCX</button></div></div>
                                <div><h3 className="text-xl font-semibold text-sky-400 mb-2">Related Books (AI-Powered)</h3>{isLoadingRecs ? <p className="text-sm text-gray-400">Finding recommendations...</p> : (<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">{recommendations.map(book => (<BookCard key={book.id} book={book} onSelect={() => setSelectedBook(book)} />))}</div>)}</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-6 bg-black/20 overflow-y-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Digital Library</h1>
      <div className="relative mb-6">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search for books by title, author, or genre..." className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 pl-10 pr-10 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
        <button onClick={isListening ? stopListening : startListening} className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white ${isListening ? 'text-blue-400 animate-pulse' : ''}`}><MicrophoneIcon /></button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {filteredBooks.map(book => (<BookCard key={book.id} book={book} onSelect={() => setSelectedBook(book)} />))}
      </div>
    </div>
  );
};