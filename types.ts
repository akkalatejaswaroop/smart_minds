// fix: Replaced placeholder content with actual type definitions.
export type OutputType = 'explanation' | 'presentation' | 'examples' | 'summary' | 'concept-map' | 'quiz';

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

export interface Highlights {
    keyIdeas: string[];
    quotes: string[];
    passages: string[];
}

export interface GeneratedContent {
  text?: string;
  summary?: string;
  mermaidCode?: string;
  quiz?: QuizQuestion[];
  highlights?: Highlights;
  glossary?: GlossaryTerm[];
}

export interface BookChapter {
  title: string;
  content: string;
}

export interface Book {
  id: number;
  title: string;
  author: string;
  coverImage: string;
  genre: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  readingTime: string;
  summary: string;
  chapters: BookChapter[];
}

export interface DebateArguments {
    pro: string[];
    con: string[];
}

export interface LearningPathResource {
    title: string;
    url: string;
    type: string;
}

export interface LearningPathModule {
    moduleTitle: string;
    description: string;
    keyTopics: string[];
    resources?: LearningPathResource[];
}

export interface CodeExplanation {
    summary: string;
    lineByLineExplanation: {
        lines: string;
        explanation: string;
    }[];
    keyConcepts: string[];
}

export interface CodeDebugReport {
    analysisSummary: string;
    bugs: {
        line: string;
        issue: string;
        suggestion: string;
    }[];
    correctedCode: string;
}

export type CodeAnalysisResult = CodeExplanation | CodeDebugReport;

// fix: Added missing ChatMessage type for the TutorChatView.
export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
    isStreaming?: boolean;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  [key: string]: any; // Allow for other grounding types
}

export interface GroundingSource {
    uri: string;
    title: string;
}

export interface RelatedResources {
    markdownContent: string;
    sources: GroundingSource[];
}

export interface RelatedResourcesResult {
    markdownContent: string;
    sources: GroundingChunk[];
}
