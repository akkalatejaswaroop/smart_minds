import React, { useState, Suspense, lazy, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoadingSpinner } from './components/SummarizerComponents';
import { FeatureShowcasePopup } from './components/FeatureShowcasePopup';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { VoiceCommandButton } from './components/VoiceCommandButton';
import { VoiceCommandOverlay } from './components/VoiceCommandOverlay';


const GeneratorView = lazy(() => import('./GeneratorView'));
const LibraryView = lazy(() => import('./LibraryView'));
const BookSummarizerView = lazy(() => import('./BookSummarizerView'));
const LearningPathCreatorView = lazy(() => import('./LearningPathCreatorView'));
const TutorChatView = lazy(() => import('./TutorChatView'));
const CodeExplainerView = lazy(() => import('./CodeExplainerView'));
const DebateGeneratorView = lazy(() => import('./DebateGeneratorView'));


export type AppView = 'generator' | 'library' | 'book-summarizer' | 'learning-path' | 'tutor-chat' | 'code-explainer' | 'debate-generator';

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<AppView>('generator');
  const [isPopupOpen, setIsPopupOpen] = useState(true);
  const [showVoiceOverlay, setShowVoiceOverlay] = useState(false);

  const {
      transcript,
      isListening,
      startListening,
      stopListening,
      browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  const handleSetView = useCallback((view: AppView) => {
    setCurrentView(view);
  }, []);

  const stopListeningAndCloseOverlay = useCallback(() => {
    stopListening();
    setShowVoiceOverlay(false);
  }, [stopListening]);

  // Effect to process the final voice command transcript
  useEffect(() => {
    if (transcript) {
        const command = transcript.toLowerCase().trim().replace(/\.$/, '');

        const commands: Record<string, AppView> = {
            'open content generator': 'generator',
            'go to generator': 'generator',
            'open library': 'library',
            'open digital library': 'library',
            'open book analyzer': 'book-summarizer',
            'go to book summarizer': 'book-summarizer',
            'create learning path': 'learning-path',
            'make a learning path': 'learning-path',
            'open tutor chat': 'tutor-chat',
            'chat with tutor': 'tutor-chat',
            'open code explainer': 'code-explainer',
            'explain code': 'code-explainer',
            'debug code': 'code-explainer',
            'open debate generator': 'debate-generator',
            'start a debate': 'debate-generator',
        };

        for (const [key, view] of Object.entries(commands)) {
            if (command.includes(key)) {
                handleSetView(view);
                stopListeningAndCloseOverlay();
                return;
            }
        }
        // If no command matched, just close the overlay
        stopListeningAndCloseOverlay();
    }
  }, [transcript, handleSetView, stopListeningAndCloseOverlay]);

  // Effect to close the overlay if listening stops for any reason (e.g., timeout)
  useEffect(() => {
      if (!isListening && showVoiceOverlay) {
          setShowVoiceOverlay(false);
      }
  }, [isListening, showVoiceOverlay]);

  const handleStartVoiceCommand = () => {
      setShowVoiceOverlay(true);
      // Brief delay to allow the modal to appear before listening starts.
      setTimeout(() => startListening(), 100);
  };


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
          {currentView === 'learning-path' && <LearningPathCreatorView />}
          {currentView === 'tutor-chat' && <TutorChatView />}
          {currentView === 'code-explainer' && <CodeExplainerView />}
          {currentView === 'debate-generator' && <DebateGeneratorView />}
        </Suspense>
      </main>
      {browserSupportsSpeechRecognition && (
          <>
            <VoiceCommandButton onClick={handleStartVoiceCommand} />
            <VoiceCommandOverlay 
                isOpen={showVoiceOverlay} 
                isListening={isListening} 
                onClose={stopListeningAndCloseOverlay} 
            />
          </>
      )}
    </div>
  );
};

export default App;