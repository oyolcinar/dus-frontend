import apiRequest from './apiClient';
import { Duel, DuelResult } from '../types/models';

type BranchType = 'mixed' | 'specific';
type SelectionType = 'random' | 'friend';

export const challengeUser = async (
  opponentId: number,
  testId: number,
  questionCount: number = 3,
  branchType: BranchType = 'mixed',
  selectionType: SelectionType = 'random',
  branchId?: number,
): Promise<{ message: string; duel: Duel }> => {
  return await apiRequest('/duels/challenge', 'POST', {
    opponentId,
    testId,
    questionCount,
    branchType,
    selectionType,
    branchId,
  });
};

export const getPendingChallenges = async (): Promise<Duel[]> => {
  return await apiRequest<Duel[]>('/duels/pending');
};

export const getActiveDuels = async (): Promise<Duel[]> => {
  return await apiRequest<Duel[]>('/duels/active');
};

export const getCompletedDuels = async (): Promise<
  (Duel & { is_winner?: boolean })[]
> => {
  return await apiRequest<(Duel & { is_winner?: boolean })[]>(
    '/duels/completed',
  );
};

export const getDuelDetails = async (
  duelId: number,
): Promise<{
  duel: Duel;
  result?: DuelResult;
}> => {
  return await apiRequest<{ duel: Duel; result?: DuelResult }>(
    `/duels/${duelId}`,
  );
};

export const acceptChallenge = async (
  duelId: number,
): Promise<{
  message: string;
  duel: Duel;
}> => {
  return await apiRequest<{ message: string; duel: Duel }>(
    `/duels/${duelId}/accept`,
    'POST',
  );
};

export const declineChallenge = async (
  duelId: number,
): Promise<{ message: string }> => {
  return await apiRequest<{ message: string }>(
    `/duels/${duelId}/decline`,
    'POST',
  );
};

export const submitDuelResult = async (
  duelId: number,
  initiatorScore: number,
  opponentScore: number,
): Promise<{
  message: string;
  result: DuelResult;
}> => {
  return await apiRequest<{ message: string; result: DuelResult }>(
    `/duels/${duelId}/result`,
    'POST',
    {
      initiatorScore,
      opponentScore,
    },
  );
};

export interface DuelUserStats {
  userId: number;
  wins: number;
  losses: number;
  totalDuels: number;
  winRate: number;
  averageScore: number;
}

export const getDuelUserStats = async (): Promise<DuelUserStats> => {
  return await apiRequest<DuelUserStats>('/duels/stats/user');
};
