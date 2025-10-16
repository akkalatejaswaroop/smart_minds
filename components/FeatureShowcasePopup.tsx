import React from 'react';
import { XIcon, BrainCircuitIcon, BookOpenIcon, FileTextIcon, MapIcon, MessageSquareIcon, CodeIcon } from './icons';
import type { AppView } from '../App';

interface FeatureShowcasePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSetView: (view: AppView) => void;
}

// FIX: Use React.ReactElement instead of JSX.Element to resolve "Cannot find namespace 'JSX'".
const features: { icon: React.ReactElement; title: string; description: string; view: AppView }[] = [
  {
    icon: <BrainCircuitIcon className="w-8 h-8 text-cyan-400" />,
    title: 'AI Content Generator',
    description: 'Instantly create explanations, presentations, quizzes, and concept maps on any topic.',
    view: 'generator'
  },
  {
    icon: <BookOpenIcon className="w-8 h-8 text-cyan-400" />,
    title: 'Digital Library',
    description: 'Explore a collection of books and use AI to summarize chapters or the entire text.',
    view: 'library'
  },
  {
    icon: <FileTextIcon className="w-8 h-8 text-cyan-400" />,
    title: 'Book & Doc Analyzer',
    description: 'Upload your own PDF/DOCX files or analyze books by title for deep insights.',
    view: 'book-summarizer'
  },
  {
    icon: <MapIcon className="w-8 h-8 text-cyan-400" />,
    title: 'Learning Path Creator',
    description: 'Get a personalized, step-by-step learning roadmap for any educational goal.',
    view: 'learning-path'
  },
  {
    icon: <MessageSquareIcon className="w-8 h-8 text-cyan-400" />,
    title: 'AI Tutor Chat',
    description: 'Have a real-time conversation with an AI tutor to get answers and guidance.',
    view: 'tutor-chat'
  },
  {
    icon: <CodeIcon className="w-8 h-8 text-cyan-400" />,
    title: 'Code Explainer & Debugger',
    description: 'Understand complex code snippets or get help finding and fixing bugs.',
    view: 'code-explainer'
  }
];

export const FeatureShowcasePopup: React.FC<FeatureShowcasePopupProps> = ({ isOpen, onClose, onSetView }) => {
  if (!isOpen) {
    return null;
  }
  
  const handleFeatureClick = (view: AppView) => {
    onSetView(view);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-slate-900 border border-slate-700/50 rounded-md shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transform animate-slide-up"
        onClick={e => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50 flex-shrink-0">
          <h2 className="text-xl font-bold text-cyan-400 font-mono">
            Welcome to SMART MINDS!
          </h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-slate-400 rounded-full hover:bg-slate-700/50 hover:text-white"
            aria-label="Close feature showcase"
          >
            <XIcon />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
            <p className="text-center text-slate-400 mb-6">Here's a quick look at the powerful AI tools at your fingertips. Click any tool to jump right in!</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                    <button
                      key={index}
                      onClick={() => handleFeatureClick(feature.view)}
                      className="flex items-start text-left gap-4 p-4 bg-slate-800/50 rounded-sm hover:bg-slate-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-transparent hover:border-slate-600"
                    >
                        <div className="flex-shrink-0 mt-1">{feature.icon}</div>
                        <div>
                            <h3 className="font-semibold text-white">{feature.title}</h3>
                            <p className="text-sm text-slate-400">{feature.description}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
        
        <div className="p-4 border-t border-slate-700/50 text-center flex-shrink-0">
            <button
              onClick={onClose}
              className="bg-cyan-600 text-white font-semibold px-6 py-2 rounded-sm hover:bg-cyan-500 transition-colors"
            >
                Get Started
            </button>
        </div>
      </div>
       <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translateY(20px) scale(0.98); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
};