/**
 * @file types.ts
 * @description Core TypeScript domain models, schema interfaces, and API contracts for STUDS.
 * @author STUDS Principal Engineering Team
 */

/** Persona variants for adaptive pedagogical explanation */
export type PersonaType = 'eli5' | 'professor' | 'cram' | 'tldr';

/** Quiz difficulty tiers */
export type DifficultyType = 'easy' | 'medium' | 'hard';

/** Section content complexity tags */
export type ComplexityType = 'easy' | 'medium' | 'hard';

/** Active primary view identifiers for structured sidebar navigation */
export type ActiveViewType =
  | 'dashboard'
  | 'notes'
  | 'flashcards'
  | 'quiz'
  | 'schedule'
  | 'mindmap'
  | 'glossary'
  | 'cloze'
  | 'ocr'
  | 'export';

/** Glossary vocabulary entry */
export interface GlossaryTerm {
  term: string;
  def: string;
}

/** Memory aid / mnemonic acronym entry */
export interface Mnemonic {
  word: string;
  meaning: string;
}

/** Daily study spaced repetition schedule item */
export interface ScheduleDay {
  day: string;
  task: string;
  done: boolean;
}

/** Hierarchical mind map concept node */
export interface MindMapNode {
  title: string;
  children?: MindMapNode[];
}

/** Structured lecture revision section with active recall syntax */
export interface RevisionSection {
  title: string;
  complexity: ComplexityType;
  bullets: string[];
}

/** Fill-in-the-blanks active recall drill */
export interface ClozeExercise {
  sentence: string;
  answers: string[];
}

/** Evaluative multiple choice assessment item */
export interface QuizQuestion {
  q: string;
  options: string[];
  correct: number;
  explanation: string;
}

/** 3D interactive flashcard representation */
export interface Flashcard {
  front: string;
  back: string;
}

/** Comprehensive normalized workspace state container */
export interface WorkspaceData {
  title: string;
  studyTimeStr?: string;
  takeaways: string[];
  glossary: GlossaryTerm[];
  mnemonics: Mnemonic[];
  schedule: ScheduleDay[];
  mindmap: MindMapNode;
  sections: RevisionSection[];
  cloze: ClozeExercise[];
  quiz: QuizQuestion[];
  flashcards: Flashcard[];
}

/** Diagnostic feedback for missed questions */
export interface MissedTopic {
  question: string;
  correctAnswer: string;
  tip: string;
}

/** API Request payload for /api/synthesize */
export interface SynthesizeRequestBody {
  lectureText: string;
  model?: string;
  apiKeys?: string[] | string;
}

/** API Response payload for /api/synthesize */
export interface SynthesizeResponseBody {
  success: boolean;
  data?: WorkspaceData;
  error?: string;
  meta?: {
    modelUsed: string;
    keyIndex: number;
    keyMasked: string;
    processingTimeMs: number;
  };
}

/** API Request payload for /api/ocr */
export interface OCRRequestBody {
  imageBase64: string;
  apiKey?: string;
  primaryModel?: string;
}

/** API Response payload for /api/ocr */
export interface OCRResponseBody {
  success: boolean;
  text?: string;
  modelUsed?: string;
  error?: string;
}

/** API Response payload for /api/health */
export interface HealthResponseBody {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
}
