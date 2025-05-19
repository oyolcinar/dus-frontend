import apiRequest from './apiClient';
import { Duel, DuelResult, User } from '../types/models'; // Assuming User might be needed or for consistency
// ApiResponse is implicitly handled by apiRequest's return type, no need to import it here for defining service return types

// Define interfaces for the *actual data payloads* returned by backend endpoints
// These will be the TData in apiRequest<TData>

interface ChallengeDuelPayload {
  message: string;
  duel: Duel;
}

// For GET /duels/pending, /duels/active, /duels
type DuelsArrayPayload = Duel[]; // Simple type alias

// For GET /duels/completed
type CompletedDuelsPayload = (Duel & { is_winner?: boolean })[];

// For GET /duels/:duelId
interface DuelDetailsPayload {
  duel: Duel;
  result?: DuelResult;
}

// For POST /duels/:duelId/accept (similar to ChallengeDuelPayload)
// type AcceptChallengePayload = ChallengeDuelPayload; // Can reuse if structure is identical

// For POST /duels/:duelId/decline, /duels/:id/cancel
interface DuelActionPayload {
  message: string;
  duel?: Duel; // duel might be optional here
}

// For POST /duels/:duelId/result
interface SubmitDuelResultPayload {
  message: string;
  result: DuelResult;
}

// For GET /duels/stats/user
export interface DuelUserStatsPayload {
  // Renamed to avoid conflict with the export name
  userId: number;
  wins: number;
  losses: number;
  totalDuels: number;
  winRate: number;
  averageScore: number;
  // Add longestLosingStreak and currentLosingStreak if backend provides them here
  longestLosingStreak?: number; // Make optional if not always present
  currentLosingStreak?: number; // Make optional if not always present
}

// For GET /duels/leaderboard
interface DuelLeaderboardPayload {
  leaderboard: Array<{
    userId: number;
    username: string;
    wins: number;
    losses: number;
    winRate: number;
    totalDuels: number;
  }>;
  total: number;
}

interface RecommendedOpponentsPayload {
  userId: number;
  username: string;
  skillLevel: number;
  winRate: number;
  totalDuels: number;
  compatibility: number;
}

type BranchType = 'mixed' | 'specific';
type SelectionType = 'random' | 'friend';

export const challengeUser = async (
  opponentId: number,
  testId: number,
  questionCount: number = 3,
  branchType: BranchType = 'mixed',
  selectionType: SelectionType = 'random',
  branchId?: number,
): Promise<ChallengeDuelPayload> => {
  // Return the payload type
  const response = await apiRequest<ChallengeDuelPayload>( // Use payload type as generic
    '/duels/challenge',
    'POST',
    {
      opponentId,
      testId,
      questionCount,
      branchType,
      selectionType,
      branchId,
    },
  );
  // apiRequest throws on error or if response.data is not what's expected by TData structure
  // If apiRequest itself ensures response.data is TData, this check might be redundant
  // but it's a good safeguard if apiRequest's behavior for non-JSON or empty success is uncertain.
  if (!response.data) {
    // This check might need adjustment based on how apiRequest handles empty successful responses
    throw new Error('Failed to create duel challenge: No data received');
  }
  return response.data; // This is now correctly typed as ChallengeDuelPayload
};

export const getPendingChallenges = async (): Promise<DuelsArrayPayload> => {
  const response = await apiRequest<DuelsArrayPayload>('/duels/pending');
  return response.data || []; // response.data is DuelsArrayPayload or TData could be undefined if backend sends empty 200
};

export const getActiveDuels = async (): Promise<DuelsArrayPayload> => {
  const response = await apiRequest<DuelsArrayPayload>('/duels/active');
  return response.data || [];
};

export const getCompletedDuels = async (): Promise<CompletedDuelsPayload> => {
  const response = await apiRequest<CompletedDuelsPayload>('/duels/completed');
  return response.data || [];
};

export const getDuelDetails = async (
  duelId: number,
): Promise<DuelDetailsPayload> => {
  const response = await apiRequest<DuelDetailsPayload>(`/duels/${duelId}`);
  if (!response.data) {
    throw new Error(`Duel with ID ${duelId} not found: No data received`);
  }
  return response.data;
};

export const acceptChallenge = async (
  duelId: number,
): Promise<ChallengeDuelPayload> => {
  // Assuming same payload as challengeUser
  const response = await apiRequest<ChallengeDuelPayload>( // Use ChallengeDuelPayload
    `/duels/${duelId}/accept`,
    'POST',
  );
  if (!response.data) {
    throw new Error(
      `Failed to accept duel with ID ${duelId}: No data received`,
    );
  }
  return response.data;
};

export const declineChallenge = async (
  duelId: number,
): Promise<DuelActionPayload> => {
  // Return DuelActionPayload
  const response = await apiRequest<DuelActionPayload>( // Use DuelActionPayload
    `/duels/${duelId}/decline`,
    'POST',
  );
  // If response.data can be undefined for successful "no content" actions from backend
  if (!response.data) {
    // Consider if backend sends an empty body on success or a specific message payload
    return { message: 'Duel challenge declined successfully' }; // Provide a default if no data
  }
  return response.data; // This is DuelActionPayload
};

export const submitDuelResult = async (
  duelId: number,
  initiatorScore: number,
  opponentScore: number,
): Promise<SubmitDuelResultPayload> => {
  const response = await apiRequest<SubmitDuelResultPayload>(
    `/duels/${duelId}/result`,
    'POST',
    {
      initiatorScore,
      opponentScore,
    },
  );
  if (!response.data) {
    throw new Error(
      `Failed to submit result for duel with ID ${duelId}: No data received`,
    );
  }
  return response.data;
};

// This function is what ProfileScreen needs.
// The DuelUserStatsPayload should match the structure of the DuelStats interface in ProfileScreen.tsx
export const getDuelUserStats = async (): Promise<DuelUserStatsPayload> => {
  // Ensure the backend endpoint '/duels/stats/user' returns data matching DuelUserStatsPayload
  const response = await apiRequest<DuelUserStatsPayload>('/duels/stats/user');
  if (!response.data) {
    // Or if response.data is received but is an empty object or missing fields
    console.warn(
      'No duel user stats data received from /duels/stats/user, returning defaults.',
    );
    return {
      // Return default stats if no data is available or if data is incomplete
      userId: 0,
      wins: 0,
      losses: 0,
      totalDuels: 0,
      winRate: 0,
      averageScore: 0,
      longestLosingStreak: 0, // Add defaults for these too
      currentLosingStreak: 0,
    };
  }
  // Ensure all fields required by ProfileScreen.tsx's DuelStats are present
  // or provide defaults if they might be missing from the backend payload.
  return {
    ...{
      // Default structure to ensure all fields exist
      userId: 0,
      wins: 0,
      losses: 0,
      totalDuels: 0,
      winRate: 0,
      averageScore: 0,
      longestLosingStreak: 0,
      currentLosingStreak: 0,
    },
    ...response.data, // Spread the received data, overriding defaults
  };
};

export const getDuelLeaderboard = async (
  limit: number = 10,
  offset: number = 0,
): Promise<DuelLeaderboardPayload> => {
  const response = await apiRequest<DuelLeaderboardPayload>(
    `/duels/leaderboard?limit=${limit}&offset=${offset}`,
  );
  if (!response.data) {
    return { leaderboard: [], total: 0 };
  }
  return response.data;
};

export const cancelDuel = async (
  duelId: number,
): Promise<DuelActionPayload> => {
  const response = await apiRequest<DuelActionPayload>(
    `/duels/${duelId}/cancel`,
    'POST',
  );
  if (!response.data) {
    return { message: 'Duel cancelled successfully' };
  }
  return response.data;
};

export const getAllDuels = async (): Promise<DuelsArrayPayload> => {
  const response = await apiRequest<DuelsArrayPayload>('/duels');
  return response.data || [];
};

export const getRecommendedOpponents = async (
  limit: number = 5,
): Promise<RecommendedOpponentsPayload[]> => {
  // Return array of the payload
  const response = await apiRequest<RecommendedOpponentsPayload[]>( // Expect an array
    `/duels/recommended-opponents?limit=${limit}`,
  );
  return response.data || [];
};
