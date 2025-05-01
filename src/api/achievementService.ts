import apiRequest from './apiClient';

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

export const getAllAchievements = async (): Promise<Achievement[]> => {
  return await apiRequest<Achievement[]>('/achievements');
};

export const getAchievementById = async (
  achievementId: number,
): Promise<Achievement> => {
  return await apiRequest<Achievement>(`/achievements/${achievementId}`);
};

export const getUserAchievements = async (): Promise<UserAchievement[]> => {
  return await apiRequest<UserAchievement[]>('/achievements/user');
};

export const getUserAchievementProgress = async (): Promise<{
  earnedAchievements: UserAchievement[];
  inProgressAchievements: (UserAchievement & { progress: number })[];
  totalPoints: number;
  rank?: string;
}> => {
  return await apiRequest('/achievements/user/progress');
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
  return await apiRequest('/achievements', 'POST', data);
};

export const updateAchievement = async (
  achievementId: number,
  data: Partial<CreateAchievementInput>,
): Promise<{
  message: string;
  achievement: Achievement;
}> => {
  return await apiRequest(`/achievements/${achievementId}`, 'PUT', data);
};

export const deleteAchievement = async (
  achievementId: number,
): Promise<{ message: string }> => {
  return await apiRequest<{ message: string }>(
    `/achievements/${achievementId}`,
    'DELETE',
  );
};

export const awardAchievement = async (
  userId: number,
  achievementId: number,
): Promise<{ message: string }> => {
  return await apiRequest<{ message: string }>('/achievements/award', 'POST', {
    userId,
    achievementId,
  });
};

export const checkAchievements = async (): Promise<{
  newAchievements: UserAchievement[];
  message: string;
}> => {
  return await apiRequest('/achievements/check', 'POST');
};

export const getAchievementLeaderboard = async (
  limit: number = 10,
  offset: number = 0
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
  return await apiRequest(`/achievements/leaderboard?limit=${limit}&offset=${offset}`);
};

export const getAchievementsByCategory = async (
  category: string
): Promise<Achievement[]> => {
  return await apiRequest(`/achievements/category/${category}`);
};
