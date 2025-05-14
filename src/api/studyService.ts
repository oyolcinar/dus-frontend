// src/api/studyService.ts
import apiRequest from './apiClient';
import { StudySession, Question, StudyProgress } from '../types/models';
import { ApiResponse } from '../types/api';

// Define difficulty levels as a type
type DifficultyLevel = 'easy' | 'medium' | 'hard';

// Response interfaces for study endpoints
interface StudySessionResponse extends ApiResponse<StudySession> {}

interface QuestionResponse extends ApiResponse<Question> {}

interface SubmitAnswerResponse
  extends ApiResponse<{
    isCorrect: boolean;
    explanation: string;
    correctAnswerId: number;
  }> {}

interface EndSessionResponse
  extends ApiResponse<{
    sessionId: string;
    totalQuestions: number;
    correctAnswers: number;
    score: number;
    timeSpent: number;
    completedAt: string;
  }> {}

interface StudyProgressResponse extends ApiResponse<StudyProgress> {}

interface StudySessionsResponse extends ApiResponse<StudySession[]> {}

interface SessionDetailsResponse
  extends ApiResponse<{
    session: StudySession;
    questions: Array<{
      id: number;
      text: string;
      userAnswerId: number;
      correctAnswerId: number;
      isCorrect: boolean;
      timeSpent: number;
      explanation: string;
      answers: Array<{
        id: number;
        text: string;
      }>;
    }>;
  }> {}

interface RecommendedTopicsResponse
  extends ApiResponse<
    Array<{
      topicId: number;
      topicName: string;
      branchId: number;
      branchName: string;
      accuracy: number;
      priority: number;
      lastStudied: string | null;
    }>
  > {}

interface MessageResponse extends ApiResponse<{ message: string }> {}

interface BookmarkedQuestionsResponse
  extends ApiResponse<{
    questions: Question[];
    total: number;
  }> {}

/**
 * Start a new study session
 * @param topicId Optional topic ID to focus on
 * @param subtopicId Optional subtopic ID to focus on
 * @param questionCount Number of questions to include (default: 10)
 * @param difficulty Optional difficulty level filter
 * @param previouslyIncorrect Whether to include only previously incorrect questions
 * @returns Created study session
 */
export const startStudySession = async (
  topicId?: number,
  subtopicId?: number,
  questionCount: number = 10,
  difficulty?: DifficultyLevel,
  previouslyIncorrect: boolean = false,
): Promise<StudySession> => {
  const response = await apiRequest<StudySessionResponse>(
    '/study/start-session',
    'POST',
    {
      topicId,
      subtopicId,
      questionCount,
      difficulty,
      previouslyIncorrect,
    },
  );

  if (!response.data) {
    throw new Error('Failed to start study session');
  }

  return response.data;
};

/**
 * Get the next question in a study session
 * @param sessionId ID of the current study session
 * @returns Next question object
 */
export const getNextQuestion = async (sessionId: string): Promise<Question> => {
  const response = await apiRequest<QuestionResponse>(
    `/study/sessions/${sessionId}/next-question`,
  );

  if (!response.data) {
    throw new Error(`No more questions available for session ${sessionId}`);
  }

  return response.data;
};

/**
 * Submit an answer for the current question
 * @param sessionId ID of the current study session
 * @param questionId ID of the question being answered
 * @param answerId ID of the selected answer
 * @param timeSpent Time spent on the question in seconds
 * @returns Answer result with correct answer and explanation
 */
export const submitAnswer = async (
  sessionId: string,
  questionId: number,
  answerId: number,
  timeSpent: number,
): Promise<{
  isCorrect: boolean;
  explanation: string;
  correctAnswerId: number;
}> => {
  const response = await apiRequest<SubmitAnswerResponse>(
    `/study/sessions/${sessionId}/submit-answer`,
    'POST',
    {
      questionId,
      answerId,
      timeSpent,
    },
  );

  if (!response.data) {
    throw new Error('Failed to submit answer');
  }

  return response.data;
};

/**
 * End the current study session
 * @param sessionId ID of the study session to end
 * @returns Session summary with score and stats
 */
export const endStudySession = async (
  sessionId: string,
): Promise<{
  sessionId: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  timeSpent: number;
  completedAt: string;
}> => {
  const response = await apiRequest<EndSessionResponse>(
    `/study/sessions/${sessionId}/end`,
    'POST',
  );

  if (!response.data) {
    throw new Error(`Failed to end study session ${sessionId}`);
  }

  return response.data;
};

/**
 * Get overall study progress for the current user
 * @returns Study progress object
 */
export const getStudyProgress = async (): Promise<StudyProgress> => {
  const response = await apiRequest<StudyProgressResponse>('/study/progress');

  if (!response.data) {
    throw new Error('Failed to retrieve study progress');
  }

  return response.data;
};

/**
 * Get recent study sessions
 * @param limit Maximum number of sessions to return (default: 5)
 * @returns Array of recent study sessions
 */
export const getRecentSessions = async (
  limit: number = 5,
): Promise<StudySession[]> => {
  const response = await apiRequest<StudySessionsResponse>(
    `/study/recent-sessions?limit=${limit}`,
  );
  return response.data || [];
};

/**
 * Get detailed information about a specific study session
 * @param sessionId ID of the session to retrieve
 * @returns Session details with questions and answers
 */
export const getSessionDetails = async (
  sessionId: string,
): Promise<{
  session: StudySession;
  questions: Array<{
    id: number;
    text: string;
    userAnswerId: number;
    correctAnswerId: number;
    isCorrect: boolean;
    timeSpent: number;
    explanation: string;
    answers: Array<{
      id: number;
      text: string;
    }>;
  }>;
}> => {
  const response = await apiRequest<SessionDetailsResponse>(
    `/study/sessions/${sessionId}`,
  );

  if (!response.data) {
    throw new Error(`Session details not found for session ${sessionId}`);
  }

  return response.data;
};

/**
 * Get recommended topics to study
 * @param limit Maximum number of topics to recommend (default: 3)
 * @returns Array of recommended topics with metadata
 */
export const getRecommendedTopics = async (
  limit: number = 3,
): Promise<
  Array<{
    topicId: number;
    topicName: string;
    branchId: number;
    branchName: string;
    accuracy: number;
    priority: number;
    lastStudied: string | null;
  }>
> => {
  const response = await apiRequest<RecommendedTopicsResponse>(
    `/study/recommended-topics?limit=${limit}`,
  );
  return response.data || [];
};

/**
 * Flag a question for review
 * @param questionId ID of the question to flag
 * @param reason Optional reason for flagging
 * @returns Success message
 */
export const flagQuestion = async (
  questionId: number,
  reason?: string,
): Promise<{ message: string }> => {
  const response = await apiRequest<MessageResponse>(
    '/study/flag-question',
    'POST',
    {
      questionId,
      reason,
    },
  );

  if (!response.data) {
    return { message: 'Question flagged successfully' };
  }

  return response.data;
};

/**
 * Bookmark a question for later review
 * @param questionId ID of the question to bookmark
 * @returns Success message
 */
export const bookmarkQuestion = async (
  questionId: number,
): Promise<{ message: string }> => {
  const response = await apiRequest<MessageResponse>(
    '/study/bookmark-question',
    'POST',
    { questionId },
  );

  if (!response.data) {
    return { message: 'Question bookmarked successfully' };
  }

  return response.data;
};

/**
 * Get bookmarked questions
 * @param page Page number for pagination (default: 1)
 * @param limit Number of items per page (default: 20)
 * @returns Paginated bookmarked questions with total count
 */
export const getBookmarkedQuestions = async (
  page: number = 1,
  limit: number = 20,
): Promise<{
  questions: Question[];
  total: number;
}> => {
  const response = await apiRequest<BookmarkedQuestionsResponse>(
    `/study/bookmarked-questions?page=${page}&limit=${limit}`,
  );

  if (!response.data) {
    return { questions: [], total: 0 };
  }

  return response.data;
};

/**
 * Get study statistics
 * @returns Detailed study statistics
 */
export const getStudyStats = async (): Promise<{
  totalSessions: number;
  totalQuestions: number;
  totalCorrect: number;
  totalIncorrect: number;
  averageAccuracy: number;
  totalStudyTime: number;
  averageSessionDuration: number;
  mostStudiedTopics: Array<{
    topicId: number;
    topicName: string;
    questionsAnswered: number;
    accuracy: number;
  }>;
  weakestTopics: Array<{
    topicId: number;
    topicName: string;
    accuracy: number;
    questionsAnswered: number;
  }>;
  studyTrend: Array<{
    date: string;
    questionsAnswered: number;
    accuracy: number;
    timeSpent: number;
  }>;
}> => {
  const response = await apiRequest<
    ApiResponse<{
      totalSessions: number;
      totalQuestions: number;
      totalCorrect: number;
      totalIncorrect: number;
      averageAccuracy: number;
      totalStudyTime: number;
      averageSessionDuration: number;
      mostStudiedTopics: Array<{
        topicId: number;
        topicName: string;
        questionsAnswered: number;
        accuracy: number;
      }>;
      weakestTopics: Array<{
        topicId: number;
        topicName: string;
        accuracy: number;
        questionsAnswered: number;
      }>;
      studyTrend: Array<{
        date: string;
        questionsAnswered: number;
        accuracy: number;
        timeSpent: number;
      }>;
    }>
  >('/study/stats');

  if (!response.data) {
    return {
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
  }

  return response.data;
};
