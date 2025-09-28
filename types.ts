export interface Chapter {
  title: string;
  content: string;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  coverImage: string; // URL
  genre: string;
  level: string; // e.g., 'Beginner', 'Intermediate'
  readingTime: string; // e.g., '5 hours'
  summary: string;
  chapters: Chapter[];
}

export interface Concept {
  name: string;
}

export interface Subject {
  name: string;
  concepts: Concept[];
}

export type OutputType = 'explanation' | 'presentation' | 'examples' | 'concept-map' | 'summary' | 'quiz';

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export interface GlossaryTerm {
    term: string;
    definition: string;
}

export interface GeneratedContent {
    text?: string;
    summary?: string;
    mermaidCode?: string;
    quiz?: QuizQuestion[];
    highlights?: {
        keyIdeas: string[];
        quotes: string[];
        passages: string[];
    };
    glossary?: GlossaryTerm[];
}

// Types for new AI Tools
export interface DebateArguments {
  pro: string[];
  con: string[];
}

export interface LearningPathModule {
  moduleTitle: string;
  description: string;
  keyTopics: string[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
