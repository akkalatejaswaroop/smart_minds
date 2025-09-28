import React, { useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { GeneratorView } from './GeneratorView';
import { LibraryView } from './LibraryView';
import { BookSummarizerView } from './BookSummarizerView';

export type AppView = 'generator' | 'library' | 'book-summarizer';

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(window.innerWidth >= 768);
  const [currentView, setCurrentView] = useState<AppView>('generator');

  return (
    <div className="relative min-h-screen bg-slate-900 text-slate-300 font-sans flex">
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
        <Header onMenuClick={() => setIsSidebarOpen(prev => !prev)} />
        {currentView === 'generator' && <GeneratorView />}
        {currentView === 'library' && <LibraryView />}
        {currentView === 'book-summarizer' && <BookSummarizerView />}
      </main>
    </div>
  );
};

export default App;