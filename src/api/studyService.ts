import apiRequest from './apiClient';
import {
  StudyProgress,
  StudySession,
  SessionDetail,
  ErrorAnalytic,
} from '../types/models';

export const updateProgress = async (
  subtopicId: number,
  repetitionCount: number,
  masteryLevel: number,
): Promise<{
  message: string;
  progress: StudyProgress;
}> => {
  return await apiRequest('/study/progress', 'POST', {
    subtopicId,
    repetitionCount,
    masteryLevel,
  });
};

export const getUserProgress = async (): Promise<StudyProgress[]> => {
  return await apiRequest<StudyProgress[]>('/study/progress');
};

export const startSession = async (): Promise<{
  message: string;
  session: StudySession;
}> => {
  return await apiRequest('/study/sessions/start', 'POST');
};

export const endSession = async (
  sessionId: number,
): Promise<{
  message: string;
  session: StudySession;
}> => {
  return await apiRequest(`/study/sessions/${sessionId}/end`, 'POST');
};

export const addSessionDetail = async (
  sessionId: number,
  subtopicId: number,
  duration: number,
): Promise<{
  message: string;
  detail: SessionDetail;
}> => {
  return await apiRequest(`/study/sessions/${sessionId}/details`, 'POST', {
    subtopicId,
    duration,
  });
};

export const getUserSessions = async (): Promise<StudySession[]> => {
  return await apiRequest<StudySession[]>('/study/sessions');
};

export const getSessionDetails = async (
  sessionId: number,
): Promise<SessionDetail[]> => {
  return await apiRequest<SessionDetail[]>(`/study/sessions/${sessionId}`);
};

export interface StudyStats {
  total_sessions: number;
  total_duration: number;
  longest_session: number;
  average_session: number;
}

export const getStudyStats = async (): Promise<StudyStats> => {
  return await apiRequest<StudyStats>('/study/stats');
};

export const updateErrorAnalytics = async (
  subtopicId: number,
  isError: boolean,
): Promise<{
  message: string;
  analytics: ErrorAnalytic;
}> => {
  return await apiRequest('/study/analytics/errors', 'POST', {
    subtopicId,
    isError,
  });
};

export const getUserErrorAnalytics = async (): Promise<ErrorAnalytic[]> => {
  return await apiRequest<ErrorAnalytic[]>('/study/analytics/errors');
};
