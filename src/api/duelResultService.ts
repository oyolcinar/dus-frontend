// src/api/duelResultService.ts
import apiRequest from './apiClient';
import { DuelResult } from '../types/models';
import { ApiResponse } from '../types/api';

// Response interfaces for duel result endpoints
interface CreateDuelResultResponse
  extends ApiResponse<{
    message: string;
    result: DuelResult;
  }> {}

interface GetDuelResultResponse extends ApiResponse<DuelResult> {}

export interface UserDuelStats {
  userId: number;
  wins: number;
  losses: number;
  totalDuels: number;
  winRate: number;
  averageScore: number;
}

interface GetUserDuelStatsResponse extends ApiResponse<UserDuelStats> {}

export interface CreateDuelResultInput {
  duelId: number;
  winnerId?: number;
  initiatorScore: number;
  opponentScore: number;
}

/**
 * Create a new duel result
 * @param data Result data including scores and optional winner
 * @returns Created duel result with success message
 */
export const createDuelResult = async (
  data: CreateDuelResultInput,
): Promise<{
  message: string;
  result: DuelResult;
}> => {
  const response = await apiRequest<CreateDuelResultResponse>(
    '/duel-results',
    'POST',
    data,
  );

  if (!response.data) {
    throw new Error('Failed to create duel result');
  }

  return response.data;
};

/**
 * Get a duel result by its associated duel ID
 * @param duelId ID of the duel to get results for
 * @returns Duel result object
 */
export const getDuelResultByDuelId = async (
  duelId: number,
): Promise<DuelResult> => {
  const response = await apiRequest<GetDuelResultResponse>(
    `/duel-results/${duelId}`,
  );

  if (!response.data) {
    throw new Error(`No result found for duel with ID ${duelId}`);
  }

  return response.data;
};

/**
 * Get duel statistics for a user
 * @param userId Optional user ID (defaults to current user if not provided)
 * @returns User's duel statistics
 */
export const getUserDuelStats = async (
  userId?: number,
): Promise<UserDuelStats> => {
  const endpoint = userId
    ? `/duel-results/stats/user/${userId}`
    : '/duel-results/stats/user';

  const response = await apiRequest<GetUserDuelStatsResponse>(endpoint);

  if (!response.data) {
    // Return default stats if no data is available
    return {
      userId: userId || 0,
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
 * Get duel result by its ID
 * @param resultId ID of the duel result to retrieve
 * @returns Duel result object
 */
export const getDuelResultById = async (
  resultId: number,
): Promise<DuelResult> => {
  const response = await apiRequest<GetDuelResultResponse>(
    `/duel-results/id/${resultId}`,
  );

  if (!response.data) {
    throw new Error(`Duel result with ID ${resultId} not found`);
  }

  return response.data;
};

/**
 * Get all duel results for a specific user
 * @param userId Optional user ID (defaults to current user if not provided)
 * @returns Array of duel results
 */
export const getUserDuelResults = async (
  userId?: number,
): Promise<DuelResult[]> => {
  const endpoint = userId
    ? `/duel-results/user/${userId}`
    : '/duel-results/user';

  const response = await apiRequest<ApiResponse<DuelResult[]>>(endpoint);
  return response.data || [];
};

/**
 * Get aggregate stats about all duels
 * @returns Duel statistics object
 */
export const getDuelSystemStats = async (): Promise<{
  totalDuels: number;
  activeUsers: number;
  averageScore: number;
  averageDuration: number;
}> => {
  const response = await apiRequest<
    ApiResponse<{
      totalDuels: number;
      activeUsers: number;
      averageScore: number;
      averageDuration: number;
    }>
  >('/duel-results/stats/system');

  if (!response.data) {
    return {
      totalDuels: 0,
      activeUsers: 0,
      averageScore: 0,
      averageDuration: 0,
    };
  }

  return response.data;
};
