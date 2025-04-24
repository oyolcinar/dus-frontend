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
