// src/api/achievementService.ts
import apiRequest from './apiClient';
import { ApiResponse } from '../types/api';

export interface Achievement {
  achievement_id: number;
  name: string;
  description?: string;
  requirements: any;
  category?: string;
  icon?: string;
  points?: number;
  created_at: string;
}

export interface UserAchievement extends Achievement {
  date_earned: string;
  progress?: number;
}

// Response type for getting all achievements
interface GetAllAchievementsResponse extends ApiResponse<Achievement[]> {}

// Response type for getting a single achievement
interface GetAchievementResponse extends ApiResponse<Achievement> {}

// Response type for getting user achievements
interface GetUserAchievementsResponse extends ApiResponse<UserAchievement[]> {}

// Response type for getting user achievement progress
interface GetUserAchievementProgressResponse
  extends ApiResponse<{
    earnedAchievements: UserAchievement[];
    inProgressAchievements: (UserAchievement & { progress: number })[];
    totalPoints: number;
    rank?: string;
  }> {}

// Response type for creating or updating an achievement
interface AchievementMutationResponse
  extends ApiResponse<{
    message: string;
    achievement: Achievement;
  }> {}

// Response type for simple message responses
interface MessageResponse extends ApiResponse<{ message: string }> {}

// Response type for checking achievements
interface CheckAchievementsResponse
  extends ApiResponse<{
    newAchievements: UserAchievement[];
    message: string;
  }> {}

// Response type for achievement leaderboard
interface LeaderboardResponse
  extends ApiResponse<{
    leaderboard: Array<{
      userId: number;
      username: string;
      totalAchievements: number;
      totalPoints: number;
      rank?: string;
    }>;
    total: number;
  }> {}

export const getAllAchievements = async (): Promise<Achievement[]> => {
  const response = await apiRequest<GetAllAchievementsResponse>(
    '/achievements',
  );
  return response.data || [];
};

export const getAchievementById = async (
  achievementId: number,
): Promise<Achievement> => {
  const response = await apiRequest<GetAchievementResponse>(
    `/achievements/${achievementId}`,
  );
  return response.data as Achievement;
};

export const getUserAchievements = async (): Promise<UserAchievement[]> => {
  const response = await apiRequest<GetUserAchievementsResponse>(
    '/achievements/user',
  );
  return response.data || [];
};

export const getUserAchievementProgress = async (): Promise<{
  earnedAchievements: UserAchievement[];
  inProgressAchievements: (UserAchievement & { progress: number })[];
  totalPoints: number;
  rank?: string;
}> => {
  const response = await apiRequest<GetUserAchievementProgressResponse>(
    '/achievements/user/progress',
  );
  return response.data as {
    earnedAchievements: UserAchievement[];
    inProgressAchievements: (UserAchievement & { progress: number })[];
    totalPoints: number;
    rank?: string;
  };
};

export interface CreateAchievementInput {
  name: string;
  description?: string;
  requirements: any;
  category?: string;
  icon?: string;
  points?: number;
}

export const createAchievement = async (
  data: CreateAchievementInput,
): Promise<{
  message: string;
  achievement: Achievement;
}> => {
  const response = await apiRequest<AchievementMutationResponse>(
    '/achievements',
    'POST',
    data,
  );
  return response.data as {
    message: string;
    achievement: Achievement;
  };
};

export const updateAchievement = async (
  achievementId: number,
  data: Partial<CreateAchievementInput>,
): Promise<{
  message: string;
  achievement: Achievement;
}> => {
  const response = await apiRequest<AchievementMutationResponse>(
    `/achievements/${achievementId}`,
    'PUT',
    data,
  );
  return response.data as {
    message: string;
    achievement: Achievement;
  };
};

export const deleteAchievement = async (
  achievementId: number,
): Promise<{ message: string }> => {
  const response = await apiRequest<MessageResponse>(
    `/achievements/${achievementId}`,
    'DELETE',
  );
  return response.data as { message: string };
};

export const awardAchievement = async (
  userId: number,
  achievementId: number,
): Promise<{ message: string }> => {
  const response = await apiRequest<MessageResponse>(
    '/achievements/award',
    'POST',
    {
      userId,
      achievementId,
    },
  );
  return response.data as { message: string };
};

export const checkAchievements = async (): Promise<{
  newAchievements: UserAchievement[];
  message: string;
}> => {
  const response = await apiRequest<CheckAchievementsResponse>(
    '/achievements/check',
    'POST',
  );
  return response.data as {
    newAchievements: UserAchievement[];
    message: string;
  };
};

export const getAchievementLeaderboard = async (
  limit: number = 10,
  offset: number = 0,
): Promise<{
  leaderboard: Array<{
    userId: number;
    username: string;
    totalAchievements: number;
    totalPoints: number;
    rank?: string;
  }>;
  total: number;
}> => {
  const response = await apiRequest<LeaderboardResponse>(
    `/achievements/leaderboard?limit=${limit}&offset=${offset}`,
  );
  return response.data as {
    leaderboard: Array<{
      userId: number;
      username: string;
      totalAchievements: number;
      totalPoints: number;
      rank?: string;
    }>;
    total: number;
  };
};

export const getAchievementsByCategory = async (
  category: string,
): Promise<Achievement[]> => {
  const response = await apiRequest<GetAllAchievementsResponse>(
    `/achievements/category/${category}`,
  );
  return response.data || [];
};
