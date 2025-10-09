import React, { useState, Suspense, lazy } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoadingSpinner } from './components/SummarizerComponents';
import { FeatureShowcasePopup } from './components/FeatureShowcasePopup';

const GeneratorView = lazy(() => import('./GeneratorView'));
const LibraryView = lazy(() => import('./LibraryView'));
const BookSummarizerView = lazy(() => import('./BookSummarizerView'));
const LearningPathCreatorView = lazy(() => import('./LearningPathCreatorView'));
const TutorChatView = lazy(() => import('./TutorChatView'));
const CodeExplainerView = lazy(() => import('./CodeExplainerView'));


export type AppView = 'generator' | 'library' | 'book-summarizer' | 'learning-path' | 'tutor-chat' | 'code-explainer';

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<AppView>('generator');
  const [isPopupOpen, setIsPopupOpen] = useState(true);

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-300 font-sans flex">
      <FeatureShowcasePopup 
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        onSetView={setCurrentView}
      />
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentView={currentView}
        onSetView={setCurrentView}
      />
      {isSidebarOpen && (
          <div 
              onClick={() => setIsSidebarOpen(false)} 
              className="fixed inset-0 bg-black/60 z-20 md:hidden"
              aria-hidden="true"
          />
      )}
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setIsSidebarOpen(prev => !prev)} isSidebarOpen={isSidebarOpen} />
        <Suspense fallback={
          <div className="flex-1 flex flex-col items-center justify-center">
            <LoadingSpinner className="h-8 w-8" />
            <p className="mt-4 text-slate-400">Loading View...</p>
          </div>
        }>
          {currentView === 'generator' && <GeneratorView />}
          {currentView === 'library' && <LibraryView />}
          {currentView === 'book-summarizer' && <BookSummarizerView />}
          {currentView === 'learning-path' && <LearningPathCreatorView />}
          {currentView === 'tutor-chat' && <TutorChatView />}
          {currentView === 'code-explainer' && <CodeExplainerView />}
        </Suspense>
      </main>
    </div>
  );
};

export default App;