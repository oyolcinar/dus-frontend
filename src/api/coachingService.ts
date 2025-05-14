// Option 1: Remove the functions from coachingService.ts that don't exist in backend

import apiRequest from './apiClient';
import {
  CoachingNote,
  MotivationalMessage,
  StrategyVideo,
} from '../types/models';

export const getCoachingNotes = async (): Promise<CoachingNote[]> => {
  return await apiRequest<CoachingNote[]>('/coaching/notes');
};

export const getLatestNote = async (): Promise<CoachingNote> => {
  return await apiRequest<CoachingNote>('/coaching/notes/latest');
};

export const createCoachingNote = async (
  title: string,
  content: string,
  publishDate: string,
  weekNumber: number,
  year: number,
): Promise<CoachingNote> => {
  return await apiRequest<CoachingNote>('/coaching/notes', 'POST', {
    title,
    content,
    publishDate,
    weekNumber,
    year,
  });
};

export const updateCoachingNote = async (
  noteId: number,
  updates: Partial<CoachingNote>,
): Promise<CoachingNote> => {
  return await apiRequest<CoachingNote>(
    `/coaching/notes/${noteId}`,
    'PUT',
    updates,
  );
};

export const deleteCoachingNote = async (
  noteId: number,
): Promise<{ message: string }> => {
  return await apiRequest<{ message: string }>(
    `/coaching/notes/${noteId}`,
    'DELETE',
  );
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
