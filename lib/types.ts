export type TutorPhase = "INTRO" | "PLACEMENT" | "REPORT" | "PATH" | "LESSON";

export type ChatRole = "tutor" | "user";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  phase: TutorPhase;
  text: string;
  createdAt: string;
}

export interface PlacementAnswer {
  questionId: string;
  question: string;
  answer: string;
  score: number;
}

export interface PlacementQuestion {
  id: string;
  question: string;
}

export interface AssessmentReport {
  level: "Beginner" | "Intermediate" | "Advanced";
  summary: string;
  strengths: string[];
  focusAreas: string[];
}

export interface LearnerProfileSummary {
  conversationSummary: string;
  speakingStyle: string;
  strengths: string[];
  growthAreas: string[];
  lessonPriorities: string[];
}

export interface LearningPathTopic {
  id: string;
  title: string;
  reason: string;
  outcomes: string[];
}

export interface LessonCorrectionRound {
  id: string;
  title: string;
  incorrectSentence: string;
  hint: string;
}

export interface LessonMcq {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LessonQuizItem {
  id: string;
  prompt: string;
  target: string;
}

export type LessonQuestionType = "correction" | "mcq" | "quiz";

export interface LessonQuestion {
  id: string;
  type: LessonQuestionType;
  label: string;
  text: string;
}

export interface LessonBundle {
  topicId: string;
  topicTitle: string;
  coachGoal: string;
  overview: string;
  endGoal: string;
  outcomes: string[];
  lessonSteps: string[];
  practicePrompts: string[];
  correctionRounds: LessonCorrectionRound[];
  mcqs: LessonMcq[];
  finalQuiz: LessonQuizItem[];
}

export interface SessionProfile {
  name?: string;
  level?: AssessmentReport["level"];
  learnerProfile?: LearnerProfileSummary;
}

export interface SessionData {
  id: string;
  phase: TutorPhase;
  profile: SessionProfile;
  messages: ChatMessage[];
  introStep: "awaiting_name" | "awaiting_spelling" | "confirming_name" | "completed";
  introAttempts: number;
  pendingName?: string;
  placementQuestions: PlacementQuestion[];
  placementIndex: number;
  placementAnswers: PlacementAnswer[];
  report?: AssessmentReport;
  learningPath?: LearningPathTopic[];
  currentTopicId?: string;
  lessonBundle?: LessonBundle;
  currentLessonQuestion?: string;
  lessonQueue?: LessonQuestion[];
  currentQueueIndex?: number;
}

export interface SessionSnapshot {
  sessionId: string;
  phase: TutorPhase;
  profile: SessionProfile;
  messages: ChatMessage[];
  report?: AssessmentReport;
  learningPath?: LearningPathTopic[];
  currentTopicId?: string;
  lessonBundle?: LessonBundle;
  placementProgress: {
    current: number;
    total: number;
  };
  currentLessonQuestion?: string;
  lessonQueue?: LessonQuestion[];
  currentQueueIndex?: number;
}

export interface MessageRequest {
  sessionId: string;
  transcript?: string;
  action?: "continue" | "select-topic";
  topicId?: string;
}

export interface SessionResponse {
  session: SessionSnapshot;
}
