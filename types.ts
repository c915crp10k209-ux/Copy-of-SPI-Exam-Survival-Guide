
import { NumerologyData } from "./services/numerology";

export enum AppView {
  CALIBRATION = 'CALIBRATION',
  BRIDGE = 'BRIDGE',
  BLUEPRINT = 'BLUEPRINT',
  PROTOCOL = 'PROTOCOL',
  EVOLUTION = 'EVOLUTION',
  ADMIN = 'ADMIN',
  HOME = 'HOME',
  QUIZ = 'QUIZ',
  TOPIC = 'TOPIC',
  CURRICULUM = 'CURRICULUM',
  PROFILE = 'PROFILE',
  MISSIONS = 'MISSIONS',
  INTEL = 'INTEL',
  VAULT = 'VAULT'
}

export enum Topic {
  MODULE_1 = 'Fundamentals',
  MODULE_2 = 'Transducers',
  MODULE_3 = 'Pulsed Wave',
  MODULE_4 = 'Doppler',
  MODULE_5 = 'Artifacts',
  MODULE_6 = 'Bioeffects',
  MODULE_7 = 'Hemodynamics',
  MODULE_8 = 'QA',
  MODULE_9 = 'Resolution',
  MODULE_10 = 'Harmonics',
  MODULE_11 = 'Instrumentation',
  MODULE_12 = 'Advanced Tech',
  FULL_MOCK = 'FULL_MOCK'
}

export enum SPIDomain {
  SAFETY = 'Clinical Safety',
  PHYSICS = 'Physical Principles',
  TRANSDUCERS = 'Transducers',
  INSTRUMENTATION = 'Instrumentation',
  DOPPLER = 'Doppler & Hemodynamics'
}

export enum ClearanceTier {
  ASSET = 'ASSET',
  EXECUTIVE = 'EXECUTIVE',
  DIRECTOR = 'DIRECTOR'
}

export type LearningStyle = 'Visual' | 'Auditory' | 'Reading' | 'Kinesthetic';

export interface StyleScores {
  Visual: number;
  Auditory: number;
  Reading: number;
  Kinesthetic: number;
}

export interface LogEntry {
  id: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
  timestamp: number;
}

// Added Achievement type
export interface Achievement {
  id: string;
  title: string;
  icon: string;
  isGeneric?: boolean;
}

// Added GlossaryTerm type
export interface GlossaryTerm {
  term: string;
  category: string;
  definition: string;
  clinicalSignificance: string;
  visualId: string;
}

export interface TacticalBounty {
  id: string;
  title: string;
  description: string;
  goal: number;
  current: number;
  rewardXp: number;
  type: 'QUIZ' | 'LESSON' | 'STREAK' | 'PERFECT_SCORE';
  isClaimed: boolean;
}

export interface FleetMember {
  name: string;
  xp: number;
  rank: string;
  isUser?: boolean;
}

export interface IntelArchive {
  id: string;
  title: string;
  summary: string;
  content: string;
  sector: string;
  visualId: string;
  unlockXp: number;
}

export interface FieldMission {
  id: string;
  title: string;
  description: string;
  difficulty: 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | string;
  visualId: string;
  objective: string;
  solution: string;
  hint: string;
  topic: Topic;
  targetState?: Partial<LabState>;
}

export interface FormulaNode {
  id: string;
  title: string;
  equation: string;
  description: string;
  variables: Record<string, string>;
  category: 'ACOUSTICS' | 'DOPPLER' | 'RESOLUTION' | 'INSTRUMENTATION';
}

export interface IntelNote {
  id: string;
  title: string;
  content: string;
  date: string;
  topic: Topic;
}

export interface TacticalScript {
  id: string;
  title: string;
  content: string;
  date: string;
  topic: Topic | string;
  type: 'NARRATION' | 'INTRO' | 'INSIGHT';
}

export interface StoryNode {
  id: string;
  chapterTitle: string;
  narrative: string;
  voice: 'Charon' | 'Puck' | 'Zephyr' | 'Kore' | 'Fenrir';
  visualId: string;
  type: 'ROADMAP' | 'NEGATION' | 'MNEMONIC' | 'ANALOGY' | 'PRACTICAL' | 'PSYCHOLOGY' | 'ASSESSMENT';
}

export interface Lecture {
  title: string;
  nodes: StoryNode[];
}

export interface SubTopic {
  id: string;
  title: string;
  description: string;
  visualId: string;
  keywords?: string[];
  lecture?: Lecture;
  content: {
    hook: string;
    promise: string;
    roadmap: string[];
    negation: string;
    mnemonic: string;
    analogy: string;
    practical: string;
    mindset: string;
    assessment: string[];
    formulas?: { label: string; equation: string; variables: Record<string, string> }[];
    technicalSpecs?: Record<string, string>;
  };
}

export interface TopicMetadata {
  id: Topic;
  icon: string;
  color: string;
  description: string;
  subTopics: SubTopic[];
}

export interface IdentityProfile {
  name: string;
  fullName: string;
  dob: string;
  birthTime: string;
  vibrationalSignature: string;
  numerology: NumerologyData;
  type: string;
  strategy: string;
  authority: string;
  tier: ClearanceTier;
  signature?: string;
  assets?: string[];
  vulnerability?: string;
  learningStyle: LearningStyle;
  styleScores: StyleScores;
  progress: UserProgress;
  results: ExamResult[];
}

// Added QuizQuestion type
export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  domain: string;
}

// Added ActiveQuiz type
export interface ActiveQuiz {
  topic: Topic;
  questions: QuizQuestion[];
  userAnswers: number[];
  flaggedQuestions: boolean[];
  currentIndex: number;
  startTime: number;
  isFullMock: boolean;
  timeLeft: number;
}

// Added Flashcard type
export interface Flashcard {
  id: string;
  topic: Topic;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  question: string;
  answer: string;
}

export interface UserProgress {
  lastView: AppView;
  calibrationComplete: boolean;
  onboardingSeen: boolean;
  topicProgress: Record<string, string>;
  achievements: Achievement[];
  moduleIntrosSeen: string[];
  notes: IntelNote[];
  vaultedScripts: TacticalScript[];
  syncStreak: number;
  lastSyncDate?: string;
  bounties: TacticalBounty[];
  activeTopic?: Topic | null;
  logs: LogEntry[];
  completedMissions: string[];
  // Added missing properties
  dailyInsight?: string;
  dailyInsightTimestamp?: number;
  lastWeaknessReport?: string;
}

export interface RAV_Session {
  profile: IdentityProfile | null;
  progress: UserProgress;
}

export interface LabState {
  frequency: number;
  amplitude: number;
  targetDepth: number;
  velocity: number;
  mismatch: number;
  dopplerAngle: number;
  damping: 'High' | 'Low';
  // Added missing properties
  flowType?: 'Laminar' | 'Turbulent';
  incidenceType?: 'Normal' | 'Oblique';
  axialSpacing?: number;
  medium?: string;
  speed1?: number;
  speed2?: number;
}

export interface ExamResult {
  id: string;
  date: string;
  topic: Topic;
  score: number;
  totalQuestions: number;
  domainScores?: Record<string, { correct: number, total: number }>;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
