/**
 * StorySpark Type Definitions
 * Data structures for Lessons, Pedagogical Analysis, SM-2 Leitner Flashcards, and Settings
 */

export type AgeGroup = '3-5' | '6-8' | '9-12';
export type CEFRLevel = 'Pre-A1' | 'A1' | 'A2' | 'B1';
export type StoryStyle = 'playful' | 'adventure' | 'bedtime' | 'everyday';
export type StoryLength = 'short' | 'medium' | 'long';
export type EnglishAccent = 'en-US' | 'en-GB' | 'en-AU';

export interface DetectedItem {
  itemEn: string;
  itemFa: string;
  certainty: 'certain' | 'probable' | 'uncertain';
  count: number;
  countEstimated: boolean;
  color: string;
  locationFa: string;
}

export interface ObservableAction {
  actionEn: string;
  actionFa: string;
}

export interface BackgroundAndSetting {
  settingEn: string;
  settingFa: string;
  visualDetailsFa: string;
}

export interface PhonicsSound {
  letter: string;
  ipa: string;
  explanationFa: string;
  sampleWords: string[];
}

export interface VocabularyItem {
  id: string;
  lessonId: string;
  word: string;
  meaningFa: string;
  partOfSpeech: string;
  ipa: string;
  pronunciationGuideFa: string;
  exampleEn: string;
  exampleFa: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  inStory: boolean;
  
  // SuperMemo SM-2 Spaced Repetition Fields
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
  nextReviewDate: string; // ISO string
  masteryLevel: 'new' | 'learning' | 'review' | 'mastered';
  lastReviewed?: string; // ISO string
}

export type QuestionType = 'multiple_choice' | 'true_false' | 'fill_blank' | 'unscramble' | 'phonics_match';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  questionEn: string;
  questionFa: string;
  options?: string[]; // for multiple_choice & phonics_match
  correctAnswer: string;
  explanationFa: string;
  points: number;
}

export interface PedagogicalAudit {
  vocabCoverageScore: number; // 0-100
  questionValidityScore: number; // 0-100
  translationIntegrityScore: number; // 0-100
  totalScore: number;
  notesFa: string[];
}

export interface StoryParagraph {
  en: string;
  fa: string;
}

export interface Lesson {
  id: string;
  titleEn: string;
  titleFa: string;
  ageLevel: AgeGroup;
  cefrLevel: CEFRLevel;
  accent: EnglishAccent;
  style: StoryStyle;
  length: StoryLength;
  imageThumbnail: string; // compressed base64
  detectedItems: DetectedItem[];
  observableActions: ObservableAction[];
  backgroundAndSetting: BackgroundAndSetting;
  visibleTextOnPage: string;
  isLegible: boolean;
  storyEn: string;
  storyFa: string;
  storyParagraphs: StoryParagraph[];
  vocabulary: VocabularyItem[];
  phonicsSound: PhonicsSound;
  questions: QuizQuestion[];
  audit?: PedagogicalAudit;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export type AIProvider = 'gemini' | 'openai' | 'custom';

export interface AISettings {
  provider: AIProvider;
  model: string;
  customBaseUrl?: string;
  apiKey: string;
  directBrowserMode: boolean; // direct browser fetch vs server proxy
  preferredAccent: EnglishAccent;
  speechRate: number; // 0.75 or 1.0
  theme: 'light' | 'dark';
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  userEmail?: string;
  lastSyncAt?: string;
}
