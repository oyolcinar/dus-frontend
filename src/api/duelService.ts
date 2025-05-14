// src/api/duelService.ts
import apiRequest from './apiClient';
import { Duel, DuelResult } from '../types/models';
import { ApiResponse } from '../types/api';

type BranchType = 'mixed' | 'specific';
type SelectionType = 'random' | 'friend';

// Response interfaces for duel endpoints
interface ChallengeDuelResponse
  extends ApiResponse<{
    message: string;
    duel: Duel;
  }> {}

interface GetDuelsResponse extends ApiResponse<Duel[]> {}

interface GetCompletedDuelsResponse
  extends ApiResponse<(Duel & { is_winner?: boolean })[]> {}

interface GetDuelDetailsResponse
  extends ApiResponse<{
    duel: Duel;
    result?: DuelResult;
  }> {}

interface DuelActionResponse
  extends ApiResponse<{
    message: string;
    duel?: Duel;
  }> {}

interface SubmitDuelResultResponse
  extends ApiResponse<{
    message: string;
    result: DuelResult;
  }> {}

export interface DuelUserStats {
  userId: number;
  wins: number;
  losses: number;
  totalDuels: number;
  winRate: number;
  averageScore: number;
}

interface DuelUserStatsResponse extends ApiResponse<DuelUserStats> {}

interface DuelLeaderboardResponse
  extends ApiResponse<{
    leaderboard: Array<{
      userId: number;
      username: string;
      wins: number;
      losses: number;
      winRate: number;
      totalDuels: number;
    }>;
    total: number;
  }> {}

/**
 * Challenge another user to a duel
 * @param opponentId ID of the user to challenge
 * @param testId ID of the test to use for the duel
 * @param questionCount Number of questions in the duel (default: 3)
 * @param branchType Type of branches to include (default: 'mixed')
 * @param selectionType How opponents are selected (default: 'random')
 * @param branchId Optional specific branch ID (required if branchType is 'specific')
 * @returns Created duel with success message
 */
export const challengeUser = async (
  opponentId: number,
  testId: number,
  questionCount: number = 3,
  branchType: BranchType = 'mixed',
  selectionType: SelectionType = 'random',
  branchId?: number,
): Promise<{ message: string; duel: Duel }> => {
  const response = await apiRequest<ChallengeDuelResponse>(
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

  if (!response.data) {
    throw new Error('Failed to create duel challenge');
  }

  return response.data;
};

/**
 * Get all pending duel challenges for the current user
 * @returns Array of pending duels
 */
export const getPendingChallenges = async (): Promise<Duel[]> => {
  const response = await apiRequest<GetDuelsResponse>('/duels/pending');
  return response.data || [];
};

/**
 * Get all active duels for the current user
 * @returns Array of active duels
 */
export const getActiveDuels = async (): Promise<Duel[]> => {
  const response = await apiRequest<GetDuelsResponse>('/duels/active');
  return response.data || [];
};

/**
 * Get all completed duels for the current user
 * @returns Array of completed duels with winner flag
 */
export const getCompletedDuels = async (): Promise<
  (Duel & { is_winner?: boolean })[]
> => {
  const response = await apiRequest<GetCompletedDuelsResponse>(
    '/duels/completed',
  );
  return response.data || [];
};

/**
 * Get detailed information about a specific duel
 * @param duelId ID of the duel to retrieve
 * @returns Duel details with optional result
 */
export const getDuelDetails = async (
  duelId: number,
): Promise<{
  duel: Duel;
  result?: DuelResult;
}> => {
  const response = await apiRequest<GetDuelDetailsResponse>(`/duels/${duelId}`);

  if (!response.data) {
    throw new Error(`Duel with ID ${duelId} not found`);
  }

  return response.data;
};

/**
 * Accept a duel challenge
 * @param duelId ID of the duel to accept
 * @returns Updated duel with success message
 */
export const acceptChallenge = async (
  duelId: number,
): Promise<{
  message: string;
  duel: Duel;
}> => {
  const response = await apiRequest<ChallengeDuelResponse>(
    `/duels/${duelId}/accept`,
    'POST',
  );

  if (!response.data) {
    throw new Error(`Failed to accept duel with ID ${duelId}`);
  }

  return response.data;
};

/**
 * Decline a duel challenge
 * @param duelId ID of the duel to decline
 * @returns Success message
 */
export const declineChallenge = async (
  duelId: number,
): Promise<{ message: string }> => {
  const response = await apiRequest<DuelActionResponse>(
    `/duels/${duelId}/decline`,
    'POST',
  );

  if (!response.data) {
    return { message: 'Duel challenge declined successfully' };
  }

  return {
    message: response.data.message || 'Duel challenge declined successfully',
  };
};

/**
 * Submit the result for a completed duel
 * @param duelId ID of the duel
 * @param initiatorScore Score of the duel initiator
 * @param opponentScore Score of the opponent
 * @returns Duel result with success message
 */
export const submitDuelResult = async (
  duelId: number,
  initiatorScore: number,
  opponentScore: number,
): Promise<{
  message: string;
  result: DuelResult;
}> => {
  const response = await apiRequest<SubmitDuelResultResponse>(
    `/duels/${duelId}/result`,
    'POST',
    {
      initiatorScore,
      opponentScore,
    },
  );

  if (!response.data) {
    throw new Error(`Failed to submit result for duel with ID ${duelId}`);
  }

  return response.data;
};

/**
 * Get duel statistics for the current user
 * @returns User's duel statistics
 */
export const getDuelUserStats = async (): Promise<DuelUserStats> => {
  const response = await apiRequest<DuelUserStatsResponse>('/duels/stats/user');

  if (!response.data) {
    // Return default stats if no data is available
    return {
      userId: 0,
      wins: 0,
      losses: 0,
      totalDuels: 0,
      winRate: 0,
      averageScore: 0,
    };
  }

  return response.data;
};

/**
 * Get the duel leaderboard
 * @param limit Maximum number of entries to return (default: 10)
 * @param offset Number of entries to skip (default: 0)
 * @returns Leaderboard data with pagination information
 */
export const getDuelLeaderboard = async (
  limit: number = 10,
  offset: number = 0,
): Promise<{
  leaderboard: Array<{
    userId: number;
    username: string;
    wins: number;
    losses: number;
    winRate: number;
    totalDuels: number;
  }>;
  total: number;
}> => {
  const response = await apiRequest<DuelLeaderboardResponse>(
    `/duels/leaderboard?limit=${limit}&offset=${offset}`,
  );

  if (!response.data) {
    return { leaderboard: [], total: 0 };
  }

  return response.data;
};

/**
 * Cancel an existing duel
 * @param duelId ID of the duel to cancel
 * @returns Success message
 */
export const cancelDuel = async (
  duelId: number,
): Promise<{ message: string }> => {
  const response = await apiRequest<DuelActionResponse>(
    `/duels/${duelId}/cancel`,
    'POST',
  );

  if (!response.data) {
    return { message: 'Duel cancelled successfully' };
  }

  return { message: response.data.message || 'Duel cancelled successfully' };
};

/**
 * Get all duels for the current user (pending, active, and completed)
 * @returns Array of all duels
 */
export const getAllDuels = async (): Promise<Duel[]> => {
  const response = await apiRequest<GetDuelsResponse>('/duels');
  return response.data || [];
};

/**
 * Get recommended opponents for the current user
 * @param limit Maximum number of recommendations to return (default: 5)
 * @returns Array of recommended users
 */
export const getRecommendedOpponents = async (
  limit: number = 5,
): Promise<
  Array<{
    userId: number;
    username: string;
    skillLevel: number;
    winRate: number;
    totalDuels: number;
    compatibility: number;
  }>
> => {
  const response = await apiRequest<
    ApiResponse<
      Array<{
        userId: number;
        username: string;
        skillLevel: number;
        winRate: number;
        totalDuels: number;
        compatibility: number;
      }>
    >
  >(`/duels/recommended-opponents?limit=${limit}`);

  return response.data || [];
};
