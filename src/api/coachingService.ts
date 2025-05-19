import apiRequest from './apiClient';
import {
  CoachingNote,
  MotivationalMessage,
  StrategyVideo,
} from '../types/models';
// ApiResponse is implicitly handled by apiRequest

// --- Define interfaces for the *actual data payloads* your backend sends ---
// --- These will be the TData in apiRequest<TData> ---

// For GET /coaching/notes
type CoachingNotesPayload = CoachingNote[];

// For GET /coaching/notes/latest OR POST /coaching/notes OR PUT /coaching/notes/:id
// The payload is a single CoachingNote object
// type SingleCoachingNotePayload = CoachingNote; // Can use CoachingNote directly

// For DELETE /coaching/notes/:id
interface CoachingNoteActionPayload {
  message: string;
  note?: CoachingNote; // Note might be optional or not present on delete
}

// For GET /coaching/messages
type MotivationalMessagesPayload = MotivationalMessage[];

// For GET /coaching/videos
type StrategyVideosPayload = StrategyVideo[];

// --- Service Functions ---

export const getCoachingNotes = async (): Promise<CoachingNotesPayload> => {
  const response = await apiRequest<CoachingNotesPayload>('/coaching/notes');
  return response.data || []; // Default to empty array
};

export const getLatestNote = async (): Promise<CoachingNote | null> => {
  try {
    const response = await apiRequest<CoachingNote>('/coaching/notes/latest');
    // If apiRequest might return undefined data on success (e.g. 204 or empty JSON)
    return response.data === undefined ? null : response.data;
  } catch (error: any) {
    if (error.status === 404) {
      // If backend correctly returns 404 when no latest note
      console.warn('No latest coaching note found.');
      return null;
    }
    console.error('Error fetching latest coaching note:', error);
    // Depending on requirements, you might throw, or return null/default
    // For now, re-throwing other errors:
    throw error;
  }
};

export const createCoachingNote = async (
  title: string,
  content: string,
  publishDate: string,
  weekNumber: number,
  year: number,
): Promise<CoachingNote> => {
  // Assuming backend returns the created note
  const response = await apiRequest<CoachingNote>('/coaching/notes', 'POST', { // Expecting a CoachingNote object directly
    title,
    content,
    publishDate,
    weekNumber,
    year,
  });
  if (!response.data) {
    // Or if response.data is an empty object when a CoachingNote is expected
    throw new Error(
      'Failed to create coaching note: No data returned from server.',
    );
  }
  return response.data;
};

export const updateCoachingNote = async (
  noteId: number,
  updates: Partial<CoachingNote>,
): Promise<CoachingNote> => {
  // Assuming backend returns the updated note
  const response = await apiRequest<CoachingNote>( // Expecting a CoachingNote object
    `/coaching/notes/${noteId}`,
    'PUT',
    updates,
  );
  if (!response.data) {
    throw new Error(
      'Failed to update coaching note: No data returned from server.',
    );
  }
  return response.data;
};

export const deleteCoachingNote = async (
  noteId: number,
): Promise<{ message: string }> => {
  // Assuming backend returns a payload like { message: "..." }
  const response = await apiRequest<CoachingNoteActionPayload>(
    `/coaching/notes/${noteId}`,
    'DELETE',
  );
  if (!response.data || !response.data.message) {
    // If backend sends empty 200/204, or message is missing
    return { message: 'Coaching note deleted successfully.' };
  }
  return { message: response.data.message }; // Only return message as per original signature
};

export const getMotivationalMessages =
  async (): Promise<MotivationalMessagesPayload> => {
    const response = await apiRequest<MotivationalMessagesPayload>(
      '/coaching/messages',
    );
    return response.data || []; // Default to empty array
  };

export const getStrategyVideos = async (
  isPremium: boolean = false,
): Promise<StrategyVideosPayload> => {
  const response = await apiRequest<StrategyVideosPayload>(
    `/coaching/videos?premium=${isPremium}`,
  );
  return response.data || []; // Default to empty array
};
