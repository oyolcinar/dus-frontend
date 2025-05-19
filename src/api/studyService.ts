import apiRequest from './apiClient';
import { StudySession, Question, StudyProgress, Topic } from '../types/models'; // Assuming Topic might be needed for consistency
// ApiResponse is implicitly handled by apiRequest

// --- Define types and interfaces for *actual data payloads* ---

type DifficultyLevel = 'easy' | 'medium' | 'hard';

// For POST /study/start-session
// The payload is a StudySession object.
// Ensure your StudySession model from '../types/models' matches what the backend returns here.
// (e.g., session_id, user_id, start_time, topic_id, subtopic_id, status, etc.)

// For GET /study/sessions/:sessionId/next-question
// The payload is a Question object.
// Ensure your Question model from '../types/models' matches.
// (e.g., question_id, test_id (or null for study), question_text, options, correct_answer, etc.)

// For POST /study/sessions/:sessionId/submit-answer
interface SubmitAnswerPayload {
  isCorrect: boolean;
  explanation?: string; // Explanation might be optional
  correctAnswerId?: number; // Or correct_answer (string/object), ensure consistency with Question model
}

// For POST /study/sessions/:sessionId/end
interface EndSessionPayload {
  sessionId: string; // Or number if your session_id is numeric
  totalQuestions: number;
  correctAnswers: number;
  score: number; // Percentage or raw score
  timeSpent: number; // In seconds or minutes
  completedAt: string; // ISO date string
}

// For GET /study/progress
// The payload is a StudyProgress object.
// Ensure your StudyProgress model from '../types/models' matches.
// (e.g., progress_id, user_id, subtopic_id, repetition_count, mastery_level, last_studied_at, etc.)

// For GET /study/recent-sessions
type RecentSessionsPayload = StudySession[]; // Array of StudySession objects

// For GET /study/sessions/:sessionId
interface SessionDetailsPayload {
  session: StudySession;
  questions: Array<{
    id: number; // Question ID
    text: string;
    userAnswerId?: number; // ID of the answer option selected by user
    userAnswerText?: string; // Text of the user's answer (if free-form or to store option text)
    correctAnswerId?: number; // ID of the correct answer option
    correctAnswerText?: string; // Text of the correct answer
    isCorrect: boolean;
    timeSpent?: number; // Time spent on this specific question
    explanation?: string;
    answers?: Array<{
      // Possible answer options shown to the user for this question
      id: number; // Option ID
      text: string;
    }>;
  }>;
}

// For GET /study/recommended-topics
interface RecommendedTopicPayload {
  topicId: number;
  topicName?: string;
  branchId?: number;
  branchName?: string;
  accuracy?: number | null; // Can be null if not studied
  priority?: number;
  lastStudied?: string | null;
}
type RecommendedTopicsListPayload = RecommendedTopicPayload[];

// For POST /study/flag-question or POST /study/bookmark-question
interface MessagePayload {
  // Reusable
  message: string;
}

// For GET /study/bookmarked-questions
interface BookmarkedQuestionsPayload {
  questions: Question[]; // Array of Question objects
  total: number; // Total count for pagination
}

// For GET /study/stats
interface StudyStatsPayload {
  totalSessions: number;
  totalQuestions: number;
  totalCorrect: number;
  totalIncorrect: number;
  averageAccuracy: number;
  totalStudyTime: number; // In seconds or minutes
  averageSessionDuration: number; // In seconds or minutes
  mostStudiedTopics: Array<{
    topicId: number;
    topicName?: string;
    questionsAnswered: number;
    accuracy: number;
  }>;
  weakestTopics: Array<{
    topicId: number;
    topicName?: string;
    accuracy: number;
    questionsAnswered: number;
  }>;
  studyTrend: Array<{
    date: string; // ISO date string (e.g., 'YYYY-MM-DD')
    questionsAnswered: number;
    accuracy: number;
    timeSpent: number; // In seconds or minutes
  }>;
}

// --- Service Functions ---

export const startStudySession = async (
  topicId?: number,
  subtopicId?: number,
  questionCount: number = 10,
  difficulty?: DifficultyLevel,
  previouslyIncorrect: boolean = false,
): Promise<StudySession> => {
  // Assuming backend returns the created StudySession
  const response = await apiRequest<StudySession>(
    '/study/start-session',
    'POST',
    { topicId, subtopicId, questionCount, difficulty, previouslyIncorrect },
  );
  if (!response.data)
    throw new Error('Failed to start study session: No data returned.');
  return response.data;
};

export const getNextQuestion = async (
  sessionId: string,
): Promise<Question | null> => {
  try {
    const response = await apiRequest<Question>(
      `/study/sessions/${sessionId}/next-question`,
    );
    // Backend might return 200 OK with no question if session ends or no more available
    return response.data === undefined ? null : response.data;
  } catch (error: any) {
    if (error.status === 404) {
      // Or if backend sends 404 when no more questions
      console.warn(
        `No more questions for session ${sessionId} or session not found.`,
      );
      return null;
    }
    console.error(
      `Error fetching next question for session ${sessionId}:`,
      error,
    );
    throw error;
  }
};

export const submitAnswer = async (
  sessionId: string,
  questionId: number,
  answerId: number, // Assuming this is the ID of the chosen option
  timeSpent: number,
): Promise<SubmitAnswerPayload> => {
  const response = await apiRequest<SubmitAnswerPayload>(
    `/study/sessions/${sessionId}/submit-answer`,
    'POST',
    { questionId, answerId, timeSpent },
  );
  if (!response.data)
    throw new Error('Failed to submit answer: No data returned.');
  return response.data;
};

export const endStudySession = async (
  sessionId: string,
): Promise<EndSessionPayload> => {
  const response = await apiRequest<EndSessionPayload>(
    `/study/sessions/${sessionId}/end`,
    'POST',
  );
  if (!response.data)
    throw new Error(
      `Failed to end study session ${sessionId}: No data returned.`,
    );
  return response.data;
};

export const getStudyProgress = async (): Promise<StudyProgress | null> => {
  try {
    const response = await apiRequest<StudyProgress>('/study/progress');
    return response.data === undefined ? null : response.data;
  } catch (error: any) {
    if (error.status === 404) {
      console.warn('Study progress not found for user.');
      return null;
    }
    console.error('Error fetching study progress:', error);
    throw error;
  }
};

export const getRecentSessions = async (
  limit: number = 5,
): Promise<RecentSessionsPayload> => {
  const response = await apiRequest<RecentSessionsPayload>(
    `/study/recent-sessions?limit=${limit}`,
  );
  return response.data || [];
};

export const getSessionDetails = async (
  sessionId: string,
): Promise<SessionDetailsPayload | null> => {
  try {
    const response = await apiRequest<SessionDetailsPayload>(
      `/study/sessions/${sessionId}`,
    );
    if (!response.data || typeof response.data !== 'object') {
      console.warn(
        `No session details for session ${sessionId}, or data malformed.`,
      );
      return null;
    }
    // Ensure nested questions array is present
    return {
      ...response.data,
      questions: response.data.questions || [],
    };
  } catch (error: any) {
    if (error.status === 404) {
      console.warn(`Session details not found for session ${sessionId} (404).`);
      return null;
    }
    console.error(`Error fetching session details for ${sessionId}:`, error);
    throw error;
  }
};

export const getRecommendedTopics = async (
  limit: number = 3,
): Promise<RecommendedTopicsListPayload> => {
  const response = await apiRequest<RecommendedTopicsListPayload>(
    `/study/recommended-topics?limit=${limit}`,
  );
  return response.data || [];
};

export const flagQuestion = async (
  questionId: number,
  reason?: string,
): Promise<MessagePayload> => {
  const response = await apiRequest<MessagePayload>(
    '/study/flag-question',
    'POST',
    { questionId, reason },
  );
  if (!response.data || !response.data.message) {
    return { message: 'Question flagged successfully.' };
  }
  return response.data;
};

export const bookmarkQuestion = async (
  questionId: number,
): Promise<MessagePayload> => {
  const response = await apiRequest<MessagePayload>(
    '/study/bookmark-question',
    'POST',
    { questionId },
  );
  if (!response.data || !response.data.message) {
    return { message: 'Question bookmarked successfully.' };
  }
  return response.data;
};

export const getBookmarkedQuestions = async (
  page: number = 1,
  limit: number = 20,
): Promise<BookmarkedQuestionsPayload> => {
  const response = await apiRequest<BookmarkedQuestionsPayload>(
    `/study/bookmarked-questions?page=${page}&limit=${limit}`,
  );
  if (!response.data || typeof response.data !== 'object') {
    console.warn('No bookmarked questions data, returning defaults.');
    return { questions: [], total: 0 };
  }
  return {
    // Ensure questions is an array
    questions: response.data.questions || [],
    total: response.data.total || 0,
  };
};

export const getStudyStats = async (): Promise<StudyStatsPayload> => {
  const defaultStats: StudyStatsPayload = {
    // For DRY
    totalSessions: 0,
    totalQuestions: 0,
    totalCorrect: 0,
    totalIncorrect: 0,
    averageAccuracy: 0,
    totalStudyTime: 0,
    averageSessionDuration: 0,
    mostStudiedTopics: [],
    weakestTopics: [],
    studyTrend: [],
  };
  try {
    const response = await apiRequest<StudyStatsPayload>('/study/stats');
    if (!response.data || typeof response.data !== 'object') {
      console.warn('No study stats data received, returning defaults.');
      return defaultStats;
    }
    // Merge with defaults to ensure all array fields are initialized
    return {
      ...defaultStats,
      ...response.data,
    };
  } catch (error: any) {
    console.error('Error fetching study stats:', error);
    // Depending on needs, could re-throw or return defaults
    return defaultStats;
  }
};
