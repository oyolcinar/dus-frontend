import apiRequest from './apiClient';

export interface Achievement {
  achievement_id: number;
  name: string;
  description?: string;
  requirements: any;
  created_at: string;
}

export interface UserAchievement extends Achievement {
  date_earned: string;
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

export interface CreateAchievementInput {
  name: string;
  description?: string;
  requirements: any;
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
