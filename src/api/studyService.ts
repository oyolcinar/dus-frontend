import apiRequest from './apiClient';
import { StudySession, Question, StudyProgress } from '../types/models';

export const startStudySession = async (
  topicId?: number,
  subtopicId?: number,
  questionCount: number = 10,
  difficulty?: 'easy' | 'medium' | 'hard',
  previouslyIncorrect: boolean = false,
): Promise<StudySession> => {
  return await apiRequest<StudySession>('/study/start-session', 'POST', {
    topicId,
    subtopicId,
    questionCount,
    difficulty,
    previouslyIncorrect,
  });
};

export const getNextQuestion = async (
  sessionId: string,
): Promise<Question> => {
  return await apiRequest<Question>(`/study/sessions/${sessionId}/next-question`);
};

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
  return await apiRequest(
    `/study/sessions/${sessionId}/submit-answer`,
    'POST',
    {
      questionId,
      answerId,
      timeSpent,
    },
  );
};

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
  return await apiRequest(`/study/sessions/${sessionId}/end`, 'POST');
};

export const getStudyProgress = async (): Promise<StudyProgress> => {
  return await apiRequest<StudyProgress>('/study/progress');
};

export const getRecentSessions = async (
  limit: number = 5,
): Promise<StudySession[]> => {
  return await apiRequest<StudySession[]>(`/study/recent-sessions?limit=${limit}`);
};

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
  return await apiRequest(`/study/sessions/${sessionId}`);
};

export const getRecommendedTopics = async (
  limit: number = 3,
): Promise<Array<{
  topicId: number;
  topicName: string;
  branchId: number;
  branchName: string;
  accuracy: number;
  priority: number;
  lastStudied: string | null;
}>> => {
  return await apiRequest(`/study/recommended-topics?limit=${limit}`);
};

// New method for flagging a question during study
export const flagQuestion = async (
  questionId: number,
  reason?: string
): Promise<{ message: string }> => {
  return await apiRequest('/study/flag-question', 'POST', {
    questionId,
    reason
  });
};

// New method for bookmarking a question for later review
export const bookmarkQuestion = async (
  questionId: number
): Promise<{ message: string }> => {
  return await apiRequest('/study/bookmark-question', 'POST', { questionId });
};

// Get bookmarked questions
export const getBookmarkedQuestions = async (
  page: number = 1,
  limit: number = 20
): Promise<{
  questions: Question[],
  total: number
}> => {
  return await apiRequest(`/study/bookmarked-questions?page=${page}&limit=${limit}`);
};
