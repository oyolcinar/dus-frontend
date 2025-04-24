import apiRequest from './apiClient';
import { DuelResult } from '../types/models';

export interface CreateDuelResultInput {
  duelId: number;
  winnerId?: number;
  initiatorScore: number;
  opponentScore: number;
}

export const createDuelResult = async (
  data: CreateDuelResultInput,
): Promise<{
  message: string;
  result: DuelResult;
}> => {
  return await apiRequest('/duel-results', 'POST', data);
};

export const getDuelResultByDuelId = async (
  duelId: number,
): Promise<DuelResult> => {
  return await apiRequest<DuelResult>(`/duel-results/${duelId}`);
};

export interface UserDuelStats {
  userId: number;
  wins: number;
  losses: number;
  totalDuels: number;
  winRate: number;
  averageScore: number;
}

export const getUserDuelStats = async (
  userId?: number,
): Promise<UserDuelStats> => {
  const endpoint = userId
    ? `/duel-results/stats/user/${userId}`
    : '/duel-results/stats/user';
  return await apiRequest<UserDuelStats>(endpoint);
};
