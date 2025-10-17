
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BOOKS } from './constants/books';
import type { Book, GeneratedContent } from './types';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { generateBookSummary, generateQuizFromContent, generateRecommendations } from './services/geminiService';
import { MicrophoneIcon, SearchIcon, ArrowLeftIcon, DownloadIcon } from './components/icons';
import { renderSimpleMarkdown } from './utils/markdown';
import { exportAsPdf, exportAsDocx } from './utils/export';
import { LoadingSpinner, QuizDisplay, SummaryResults } from './components/SummarizerComponents';


const BookCard: React.FC<{ book: Book; onSelect: () => void }> = ({ book, onSelect }) => (
  <button onClick={onSelect} className="text-left group focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded-sm">
    <div className="relative">
      <img src={book.coverImage} alt={book.title} className="w-full h-auto object-cover rounded-sm shadow-lg aspect-[2/3] transition-transform duration-300 group-hover:scale-105" />
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-sm">
        <p className="text-white font-bold text-center p-2">View Details</p>
      </div>
    </div>
    <h3 className="mt-2 font-bold text-white truncate">{book.title}</h3>
    <p className="text-sm text-slate-400 truncate">{book.author}</p>
  </button>
);


// --- Main View ---

const LibraryView: React.FC = () => {
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Book Detail View State
  const [activeTab, setActiveTab] = useState<'read' | 'summarize' | 'details'>('read');
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [fontSize, setFontSize] = useState('text-base');
  const [theme, setTheme] = useState('dark');
  
  // Book Detail Summarizer State
  const [summaryChapter, setSummaryChapter] = useState<string>('full');
  const [summaryType, setSummaryType] = useState<'paragraph' | 'bullets' | 'concept-map'>('paragraph');
  const [summaryPurpose, setSummaryPurpose] = useState('a quick overview');
  const [summaryContent, setSummaryContent] = useState<GeneratedContent | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string|null>(null);
  
  // Book Detail Quiz State
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
  }, [selectedBook, activeTab]);

  useEffect(() => {
    setCurrentChapterIndex(0);
    setActiveTab('read');
    setChapterQuiz(null);
    setSummaryQuiz(null);
    setSummaryContent(null);
    setSummaryChapter('full');
    setRecommendations([]);
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
    document.body.appendChild(printableElement);
    if(format === 'pdf') exportAsPdf(printableElement, selectedBook.title);
    else exportAsDocx(printableElement, selectedBook.title);
    document.body.removeChild(printableElement);
  };

  if (selectedBook) {
    const currentChapter = selectedBook.chapters[currentChapterIndex];
    return (
        <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto">
            <button onClick={() => setSelectedBook(null)} className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 mb-4 self-start">
                <ArrowLeftIcon /> Back to Library
            </button>
            <div className="flex flex-col lg:flex-row gap-6 items-start">
                <div className="w-full lg:w-1/4 flex-shrink-0">
                    <img src={selectedBook.coverImage} alt={selectedBook.title} className="w-full h-auto object-cover rounded-sm shadow-lg aspect-[2/3]" />
                    <h2 className="mt-4 text-2xl font-bold text-white">{selectedBook.title}</h2>
                    <p className="text-lg text-slate-400">{selectedBook.author}</p>
                </div>
                <div className="flex-1 w-full">
                    <div className="flex border-b border-slate-700/50">
                        {(['read', 'summarize', 'details'] as const).map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium transition-colors capitalize ${activeTab === tab ? 'border-b-2 border-cyan-500 text-white' : 'text-slate-400 hover:bg-slate-800/50'}`}>{tab}</button>
                        ))}
                    </div>
                    <div className="py-6">
                        {activeTab === 'read' && (
                            <div className="space-y-4">
                               <div className="flex justify-between items-center flex-wrap gap-4">
                                    <select value={currentChapterIndex} onChange={e => { setCurrentChapterIndex(parseInt(e.target.value)); setChapterQuiz(null); }} className="bg-slate-800 text-lg font-semibold text-cyan-400 border border-slate-700/50 rounded-sm px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none">
                                      {selectedBook.chapters.map((chap, i) => <option key={i} value={i}>{chap.title}</option>)}
                                    </select>
                                    <div className="flex items-center gap-2">
                                        <select value={theme} onChange={e => setTheme(e.target.value)} className="bg-slate-800 text-xs border border-slate-700/50 rounded-sm px-2 py-1 focus:ring-2 focus:ring-cyan-500 focus:outline-none"><option value="dark">Dark</option><option value="light">Light</option></select>
                                        <div className="flex items-center bg-slate-800 rounded-sm border border-slate-700/50">
                                            <button onClick={() => setFontSize('text-sm')} className={`px-2 py-1 text-xs ${fontSize === 'text-sm' ? 'bg-cyan-600 text-white' : ''} rounded-l-sm`}>A</button>
                                            <button onClick={() => setFontSize('text-base')} className={`px-2 py-1 text-sm ${fontSize === 'text-base' ? 'bg-cyan-600 text-white' : ''}`}>A</button>
                                            <button onClick={() => setFontSize('text-lg')} className={`px-2 py-1 text-base ${fontSize === 'text-lg' ? 'bg-cyan-600 text-white' : ''} rounded-r-sm`}>A</button>
                                        </div>
                                    </div>
                               </div>
                                <div className={`p-6 rounded-sm ${theme === 'dark' ? 'bg-slate-900 text-slate-300' : 'bg-white text-gray-800'} transition-colors h-96 overflow-y-auto border border-slate-700/50`}><p className={`${fontSize} leading-relaxed whitespace-pre-line transition-all`}>{currentChapter.content}</p></div>
                                <div className="mt-4">
                                  {!chapterQuiz ? (
                                      <button onClick={() => handleGenerateQuiz('chapter')} disabled={isGeneratingChapterQuiz} className="w-full bg-cyan-600 text-white font-semibold px-5 py-2 rounded-sm hover:bg-cyan-500 transition-colors disabled:bg-cyan-900/50 disabled:text-slate-400 flex items-center justify-center gap-2">
                                          {isGeneratingChapterQuiz && <LoadingSpinner />}
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
                                <h3 className="text-xl font-semibold text-cyan-400">AI Book Summarizer</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-xs font-medium text-slate-400 block mb-1">Content</label>
                                        <select value={summaryChapter} onChange={e => setSummaryChapter(e.target.value)} className="w-full bg-slate-800 border border-slate-700/50 rounded-sm px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"><option value="full">Full Book</option>{selectedBook.chapters.map((chap, i) => <option key={i} value={i}>{chap.title}</option>)}</select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-400 block mb-1">Format</label>
                                        <select value={summaryType} onChange={e => setSummaryType(e.target.value as any)} className="w-full bg-slate-800 border border-slate-700/50 rounded-sm px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"><option value="paragraph">Paragraph</option><option value="bullets">Bullet Points</option><option value="concept-map">Concept Map</option></select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-400 block mb-1">Purpose</label>
                                        <input type="text" value={summaryPurpose} onChange={e => setSummaryPurpose(e.target.value)} className="w-full bg-slate-800 border border-slate-700/50 rounded-sm px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"/>
                                    </div>
                                </div>
                                <button onClick={handleGenerateSummary} disabled={isSummarizing} className="w-full bg-cyan-600 text-white font-semibold px-5 py-2 rounded-sm hover:bg-cyan-500 transition-colors disabled:bg-cyan-900/50 disabled:text-slate-400 flex items-center justify-center gap-2">
                                    {isSummarizing && <LoadingSpinner />}
                                    {isSummarizing ? 'Summarizing...' : 'Generate Summary'}
                                </button>
                                {isSummarizing && <div className="text-center text-slate-400 flex items-center justify-center gap-2 mt-2"><LoadingSpinner /> AI is reading and summarizing... Please wait.</div>}
                                {summaryError && <div className="text-red-400 whitespace-pre-wrap">{summaryError}</div>}
                                {summaryContent && <SummaryResults summaryContent={summaryContent} summaryType={summaryType} title={selectedBook.title} onGenerateQuiz={() => handleGenerateQuiz('summary')} isGeneratingQuiz={isGeneratingSummaryQuiz} />}
                                {summaryQuiz?.quiz && <QuizDisplay quizData={summaryQuiz.quiz} onTryAgain={() => setSummaryQuiz(null)} />}
                                {quizError && !summaryError && <div className="text-red-400 mt-2">{quizError}</div>}
                            </div>
                        )}
                        {activeTab === 'details' && (
                            <div className="space-y-6">
                                <div><h3 className="text-xl font-semibold text-cyan-400 mb-2">Details</h3><div className="text-sm space-y-2"><p><strong>Genre:</strong> {selectedBook.genre}</p><p><strong>Level:</strong> {selectedBook.level}</p><p><strong>Est. Reading Time:</strong> {selectedBook.readingTime}</p></div></div>
                                <div><h3 className="text-xl font-semibold text-cyan-400 mb-2">Summary</h3><p className="text-sm text-slate-400 leading-relaxed">{selectedBook.summary}</p></div>
                                <div><h3 className="text-xl font-semibold text-cyan-400 mb-2">Download Full Book</h3><div className="flex gap-4"><button onClick={() => handleDownloadFullBook('pdf')} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-sm"><DownloadIcon /> PDF</button><button onClick={() => handleDownloadFullBook('docx')} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-sm"><DownloadIcon /> DOCX</button></div></div>
                                <div><h3 className="text-xl font-semibold text-cyan-400 mb-2">Related Books (AI-Powered)</h3>{isLoadingRecs ? <p className="text-sm text-slate-400">Finding recommendations...</p> : (<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">{recommendations.length > 0 ? recommendations.map(book => (<BookCard key={book.id} book={book} onSelect={() => setSelectedBook(book)} />)) : <p className='text-sm text-slate-500 col-span-full'>No recommendations found.</p>}</div>)}</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Digital Library</h1>
      
      <div className="relative mb-6">
        <input 
          type="text" 
          placeholder="Search books by title, author, or genre..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700/50 rounded-sm py-2 pl-10 pr-12 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
        />
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <button onClick={isListening ? stopListening : startListening} className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full ${isListening ? 'bg-cyan-500/20 text-cyan-400 animate-pulse' : 'text-slate-400 hover:text-white'}`}>
            <MicrophoneIcon />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {filteredBooks.length > 0 ? (
          filteredBooks.map(book => (
            <BookCard key={book.id} book={book} onSelect={() => setSelectedBook(book)} />
          ))
        ) : (
          <p className="col-span-full text-center text-slate-400">No books found matching your search.</p>
        )}
      </div>
    </div>
  );
};

export default LibraryView;
