// src/api/coachingService.ts
import apiRequest from './apiClient';
import {
  CoachingNote,
  MotivationalMessage,
  StrategyVideo,
} from '../types/models';
import { ApiResponse } from '../types/api';

// Response interfaces for coaching endpoints
interface GetCoachingNotesResponse extends ApiResponse<CoachingNote[]> {}
interface GetCoachingNoteResponse extends ApiResponse<CoachingNote> {}
interface CoachingNoteActionResponse
  extends ApiResponse<{
    message: string;
    note?: CoachingNote;
  }> {}
interface GetMotivationalMessagesResponse
  extends ApiResponse<MotivationalMessage[]> {}
interface GetStrategyVideosResponse extends ApiResponse<StrategyVideo[]> {}

/**
 * Get all coaching notes
 * @returns Array of coaching notes
 */
export const getCoachingNotes = async (): Promise<CoachingNote[]> => {
  const response = await apiRequest<GetCoachingNotesResponse>(
    '/coaching/notes',
  );
  return response.data || [];
};

/**
 * Get the latest coaching note
 * @returns The most recent coaching note
 */
export const getLatestNote = async (): Promise<CoachingNote> => {
  const response = await apiRequest<GetCoachingNoteResponse>(
    '/coaching/notes/latest',
  );

  if (!response.data) {
    throw new Error('No coaching notes available');
  }

  return response.data;
};

/**
 * Create a new coaching note
 * @param title Note title
 * @param content Note content
 * @param publishDate Date to publish note
 * @param weekNumber Week number
 * @param year Year
 * @returns The created coaching note
 */
export const createCoachingNote = async (
  title: string,
  content: string,
  publishDate: string,
  weekNumber: number,
  year: number,
): Promise<CoachingNote> => {
  const response = await apiRequest<GetCoachingNoteResponse>(
    '/coaching/notes',
    'POST',
    {
      title,
      content,
      publishDate,
      weekNumber,
      year,
    },
  );

  if (!response.data) {
    throw new Error('Failed to create coaching note');
  }

  return response.data;
};

/**
 * Update an existing coaching note
 * @param noteId ID of the note to update
 * @param updates Partial note data to update
 * @returns The updated coaching note
 */
export const updateCoachingNote = async (
  noteId: number,
  updates: Partial<CoachingNote>,
): Promise<CoachingNote> => {
  const response = await apiRequest<GetCoachingNoteResponse>(
    `/coaching/notes/${noteId}`,
    'PUT',
    updates,
  );

  if (!response.data) {
    throw new Error('Failed to update coaching note');
  }

  return response.data;
};

/**
 * Delete a coaching note
 * @param noteId ID of the note to delete
 * @returns Success message
 */
export const deleteCoachingNote = async (
  noteId: number,
): Promise<{ message: string }> => {
  const response = await apiRequest<CoachingNoteActionResponse>(
    `/coaching/notes/${noteId}`,
    'DELETE',
  );

  if (!response.data) {
    return { message: 'Note deleted successfully' };
  }

  return { message: response.data.message || 'Note deleted successfully' };
};

/**
 * Get all motivational messages
 * @returns Array of motivational messages
 */
export const getMotivationalMessages = async (): Promise<
  MotivationalMessage[]
> => {
  const response = await apiRequest<GetMotivationalMessagesResponse>(
    '/coaching/messages',
  );
  return response.data || [];
};

/**
 * Get strategy videos, optionally filtered by premium status
 * @param isPremium Whether to return only premium videos
 * @returns Array of strategy videos
 */
export const getStrategyVideos = async (
  isPremium: boolean = false,
): Promise<StrategyVideo[]> => {
  const response = await apiRequest<GetStrategyVideosResponse>(
    `/coaching/videos?premium=${isPremium}`,
  );
  return response.data || [];
};
