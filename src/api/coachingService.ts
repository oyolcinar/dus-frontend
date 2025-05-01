import apiRequest from './apiClient';
import {
  CoachingNote,
  MotivationalMessage,
  StrategyVideo,
  CoachingSession,
} from '../types/models';

export const getCoachingNotes = async (): Promise<CoachingNote[]> => {
  return await apiRequest<CoachingNote[]>('/coaching/notes');
};

export const getLatestNote = async (): Promise<CoachingNote> => {
  return await apiRequest<CoachingNote>('/coaching/notes/latest');
};

export const createCoachingNote = async (
  content: string,
  topicId?: number
): Promise<CoachingNote> => {
  return await apiRequest<CoachingNote>('/coaching/notes', 'POST', {
    content,
    topicId
  });
};

export const updateCoachingNote = async (
  noteId: number,
  content: string
): Promise<CoachingNote> => {
  return await apiRequest<CoachingNote>(`/coaching/notes/${noteId}`, 'PUT', {
    content
  });
};

export const deleteCoachingNote = async (
  noteId: number
): Promise<{ message: string }> => {
  return await apiRequest<{ message: string }>(`/coaching/notes/${noteId}`, 'DELETE');
};

export const getMotivationalMessages = async (): Promise<
  MotivationalMessage[]
> => {
  return await apiRequest<MotivationalMessage[]>('/coaching/messages');
};

export const getStrategyVideos = async (
  isPremium: boolean = false,
): Promise<StrategyVideo[]> => {
  return await apiRequest<StrategyVideo[]>(
    `/coaching/videos?premium=${isPremium}`,
  );
};

export const requestCoachingSession = async (
  date: string,
  time: string,
  topicId: number,
  notes?: string
): Promise<CoachingSession> => {
  return await apiRequest<CoachingSession>('/coaching/sessions', 'POST', {
    date,
    time,
    topicId,
    notes
  });
};

export const getCoachingSessions = async (
  status?: 'pending' | 'approved' | 'completed' | 'cancelled'
): Promise<CoachingSession[]> => {
  const queryParams = status ? `?status=${status}` : '';
  return await apiRequest<CoachingSession[]>(`/coaching/sessions${queryParams}`);
};

export const cancelCoachingSession = async (
  sessionId: number
): Promise<{ message: string }> => {
  return await apiRequest<{ message: string }>(
    `/coaching/sessions/${sessionId}/cancel`,
    'POST'
  );
};

export const getCoachingFeedback = async (
  type: 'performance' | 'strategy' | 'general' = 'general'
): Promise<{
  feedback: string;
  createdAt: string;
  coachId: number;
  coachName: string;
}[]> => {
  return await apiRequest(`/coaching/feedback?type=${type}`);
};

export const provideSessionFeedback = async (
  sessionId: number,
  rating: number,
  feedback: string
): Promise<{ message: string }> => {
  return await apiRequest(`/coaching/sessions/${sessionId}/feedback`, 'POST', {
    rating,
    feedback
  });
};
