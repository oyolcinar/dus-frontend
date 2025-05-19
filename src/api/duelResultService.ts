import apiRequest from './apiClient';
import { DuelResult } from '../types/models';
// ApiResponse is implicitly handled by apiRequest

// --- Define interfaces for the *actual data payloads* your backend sends ---
// --- These will be the TData in apiRequest<TData> ---

// For POST /duel-results
interface CreateDuelResultPayload {
  message: string;
  result: DuelResult; // DuelResult should contain duel_id, winner_id, initiator_score, opponent_score, created_at
}

// For GET /duel-results/:duelId or GET /duel-results/id/:resultId
// The payload is a single DuelResult object
// type SingleDuelResultPayload = DuelResult; // Can use DuelResult directly

// For GET /duel-results/stats/user or /duel-results/stats/user/:userId
// This is the payload for user-specific duel stats.
// Note: This seems very similar to DuelUserStatsPayload in duelService.ts.
// Consider if these stats should be consolidated into one service/endpoint.
export interface UserDuelStatsPayload {
  // Exporting if used elsewhere
  userId: number;
  wins: number;
  losses: number;
  totalDuels: number;
  winRate: number;
  averageScore: number;
  // Add longestLosingStreak and currentLosingStreak if this endpoint also provides them
  // and if it's intended to be a comprehensive stat source for profiles.
  longestLosingStreak?: number;
  currentLosingStreak?: number;
}

// For GET /duel-results/user or /duel-results/user/:userId
type UserDuelResultsPayload = DuelResult[]; // Array of DuelResult objects

// For GET /duel-results/stats/system
interface DuelSystemStatsPayload {
  totalDuels: number;
  activeUsers: number;
  averageScore: number;
  averageDuration: number; // Assuming this is in a consistent unit (e.g., seconds)
}

// --- Service Input DTOs (already good) ---
export interface CreateDuelResultInput {
  duelId: number;
  winnerId?: number; // Optional as per your definition
  initiatorScore: number;
  opponentScore: number;
}

// --- Service Functions ---

export const createDuelResult = async (
  data: CreateDuelResultInput,
): Promise<CreateDuelResultPayload> => {
  const response = await apiRequest<CreateDuelResultPayload>(
    '/duel-results',
    'POST',
    data,
  );
  if (!response.data) {
    throw new Error(
      'Failed to create duel result: No data returned from server.',
    );
  }
  return response.data;
};

export const getDuelResultByDuelId = async (
  duelId: number,
): Promise<DuelResult | null> => {
  try {
    const response = await apiRequest<DuelResult>(`/duel-results/${duelId}`);
    return response.data === undefined ? null : response.data;
  } catch (error: any) {
    if (error.status === 404) {
      console.warn(`No result found for duel with ID ${duelId} (404).`);
      return null;
    }
    console.error(`Error fetching duel result for duel ID ${duelId}:`, error);
    throw error;
  }
};

export const getUserDuelStats = async (
  userId?: number,
): Promise<UserDuelStatsPayload> => {
  const endpoint = userId
    ? `/duel-results/stats/user/${userId}`
    : '/duel-results/stats/user';

  try {
    const response = await apiRequest<UserDuelStatsPayload>(endpoint);

    // Default structure to ensure all fields required by UserDuelStatsPayload exist
    const defaultStats: UserDuelStatsPayload = {
      userId: userId || 0, // Use function argument or 0 as initial default
      wins: 0,
      losses: 0,
      totalDuels: 0,
      winRate: 0,
      averageScore: 0,
      longestLosingStreak: 0,
      currentLosingStreak: 0,
    };

    if (!response.data || typeof response.data !== 'object') {
      console.warn(
        `No valid user duel stats data for endpoint ${endpoint}, returning defaults.`,
      );
      return defaultStats;
    }

    // Spread response.data first, then override with defaults or specific logic if needed
    // This ensures that if response.data.userId is undefined, our default 'userId || 0' is used.
    return {
      ...defaultStats, // Establish the full structure with defaults
      ...response.data, // Override defaults with actual data from backend
      // If you need to specifically ensure `userId` is the one passed or from token, you can re-assert it here AFTER the spread.
      // However, if response.data.userId is the authoritative one from backend, the above is fine.
      // If response.data might be missing userId but other stats are present:
      userId:
        response.data.userId !== undefined ? response.data.userId : userId || 0,
      // Ensure other numeric fields are numbers, falling back to 0 if they are missing or not numbers
      wins: typeof response.data.wins === 'number' ? response.data.wins : 0,
      losses:
        typeof response.data.losses === 'number' ? response.data.losses : 0,
      totalDuels:
        typeof response.data.totalDuels === 'number'
          ? response.data.totalDuels
          : 0,
      winRate:
        typeof response.data.winRate === 'number' ? response.data.winRate : 0,
      averageScore:
        typeof response.data.averageScore === 'number'
          ? response.data.averageScore
          : 0,
      longestLosingStreak:
        typeof response.data.longestLosingStreak === 'number'
          ? response.data.longestLosingStreak
          : 0,
      currentLosingStreak:
        typeof response.data.currentLosingStreak === 'number'
          ? response.data.currentLosingStreak
          : 0,
    };
  } catch (error: any) {
    const defaultStatsOnError: UserDuelStatsPayload = {
      // Define it here too for DRY
      userId: userId || 0,
      wins: 0,
      losses: 0,
      totalDuels: 0,
      winRate: 0,
      averageScore: 0,
      longestLosingStreak: 0,
      currentLosingStreak: 0,
    };
    if (error.status === 404) {
      console.warn(
        `User duel stats not found for endpoint ${endpoint} (404), returning defaults.`,
      );
    } else {
      console.error(`Error fetching user duel stats from ${endpoint}:`, error);
    }
    return defaultStatsOnError;
  }
};

export const getDuelResultById = async (
  resultId: number,
): Promise<DuelResult | null> => {
  try {
    // Assuming the backend route is something like /duel-results/id/:resultId
    // If it's just /duel-results/:id where id is the result_id, adjust the path
    const response = await apiRequest<DuelResult>(
      `/duel-results/id/${resultId}`,
    );
    return response.data === undefined ? null : response.data;
  } catch (error: any) {
    if (error.status === 404) {
      console.warn(`Duel result with ID ${resultId} not found (404).`);
      return null;
    }
    console.error(`Error fetching duel result ID ${resultId}:`, error);
    throw error;
  }
};

export const getUserDuelResults = async (
  userId?: number,
): Promise<UserDuelResultsPayload> => {
  const endpoint = userId
    ? `/duel-results/user/${userId}`
    : '/duel-results/user';
  const response = await apiRequest<UserDuelResultsPayload>(endpoint);
  return response.data || []; // Default to empty array
};

export const getDuelSystemStats = async (): Promise<DuelSystemStatsPayload> => {
  const response = await apiRequest<DuelSystemStatsPayload>(
    '/duel-results/stats/system',
  );
  if (!response.data || typeof response.data !== 'object') {
    console.warn('No duel system stats data received, returning defaults.');
    return {
      totalDuels: 0,
      activeUsers: 0,
      averageScore: 0,
      averageDuration: 0,
    };
  }
  return response.data;
};
