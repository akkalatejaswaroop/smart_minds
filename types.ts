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

export interface GeneratedContent {
    text?: string;
    summary?: string;
    mermaidCode?: string;
    quiz?: QuizQuestion[];
}
