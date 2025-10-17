import React, { useState, Suspense, lazy, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoadingSpinner } from './components/SummarizerComponents';
import { FeatureShowcasePopup } from './components/FeatureShowcasePopup';

const GeneratorView = lazy(() => import('./GeneratorView'));
const LibraryView = lazy(() => import('./LibraryView'));
const BookSummarizerView = lazy(() => import('./BookSummarizerView'));
const TutorChatView = lazy(() => import('./TutorChatView'));
const DebateGeneratorView = lazy(() => import('./DebateGeneratorView'));
const LearningPathCreatorView = lazy(() => import('./LearningPathCreatorView'));
const CodeExplainerView = lazy(() => import('./CodeExplainerView'));


export type AppView = 'generator' | 'library' | 'book-summarizer' | 'tutor-chat' | 'debate-generator' | 'learning-path' | 'code-explainer';

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<AppView>('generator');
  const [isPopupOpen, setIsPopupOpen] = useState(true);

  const handleSetView = useCallback((view: AppView) => {
    setCurrentView(view);
  }, []);

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-300 font-sans flex blueprint-background">
      <FeatureShowcasePopup 
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        onSetView={handleSetView}
      />
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentView={currentView}
        onSetView={handleSetView}
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
          {currentView === 'tutor-chat' && <TutorChatView />}
          {/* These views are not currently in the navigation but are kept for potential future use */}
          {currentView === 'debate-generator' && <DebateGeneratorView />}
          {currentView === 'learning-path' && <LearningPathCreatorView />}
          {currentView === 'code-explainer' && <CodeExplainerView />}
        </Suspense>
      </main>
    </div>
  );
};

export default App;