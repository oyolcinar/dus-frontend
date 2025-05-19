import apiRequest from './apiClient';

// --- Define interfaces for the *actual data payloads* your backend sends ---
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

type AllAchievementsPayload = Achievement[];
type UserAchievementsPayload = UserAchievement[];

interface UserAchievementProgressPayload {
  earnedAchievements: UserAchievement[];
  inProgressAchievements: (UserAchievement & { progress: number })[];
  totalPoints: number;
  rank?: string;
}

interface AchievementMutationPayload {
  message: string;
  achievement: Achievement;
}

interface MessagePayload {
  message: string;
}

interface CheckAchievementsPayload {
  newAchievements: UserAchievement[];
  message: string;
}

interface AchievementLeaderboardPayload {
  leaderboard: Array<{
    userId: number;
    username: string;
    totalAchievements: number;
    totalPoints: number;
    rank?: string;
  }>;
  total: number;
}

// --- Service Functions ---

export const getAllAchievements = async (): Promise<AllAchievementsPayload> => {
  const response = await apiRequest<AllAchievementsPayload>('/achievements');
  return response.data || [];
};

export const getAchievementById = async (
  achievementId: number,
): Promise<Achievement | null> => {
  try {
    const response = await apiRequest<Achievement>(
      `/achievements/${achievementId}`,
    );
    // If response.data could be undefined from apiRequest on success, convert to null.
    // If apiRequest guarantees TData or throws, then response.data is Achievement.
    return response.data === undefined ? null : response.data;
  } catch (error: any) {
    if (error.status === 404) {
      console.warn(`Achievement with ID ${achievementId} not found.`);
      return null;
    }
    console.error(`Error fetching achievement ${achievementId}:`, error);
    throw error; // Re-throw other errors
  }
};

export const getUserAchievements =
  async (): Promise<UserAchievementsPayload> => {
    const response = await apiRequest<UserAchievementsPayload>(
      '/achievements/user',
    );
    return response.data || [];
  };

export const getUserAchievementProgress =
  async (): Promise<UserAchievementProgressPayload | null> => {
    try {
      const response = await apiRequest<UserAchievementProgressPayload>(
        '/achievements/user/progress',
      );
      // If response.data could be undefined from apiRequest on success, convert to null.
      return response.data === undefined ? null : response.data;
    } catch (error: any) {
      if (error.status === 404) {
        console.warn(`User achievement progress not found.`);
        return null;
      }
      // For other errors, you might want to return a default empty structure or re-throw
      // Example of returning a default structure:
      // console.error('Error fetching user achievement progress:', error);
      // return { earnedAchievements: [], inProgressAchievements: [], totalPoints: 0, rank: undefined };
      console.error('Error fetching user achievement progress:', error);
      throw error; // Re-throw other errors
    }
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
): Promise<AchievementMutationPayload> => {
  const response = await apiRequest<AchievementMutationPayload>(
    '/achievements',
    'POST',
    data,
  );
  if (!response.data)
    throw new Error(
      'Failed to create achievement: No data received from server.',
    );
  return response.data;
};

export const updateAchievement = async (
  achievementId: number,
  data: Partial<CreateAchievementInput>,
): Promise<AchievementMutationPayload> => {
  const response = await apiRequest<AchievementMutationPayload>(
    `/achievements/${achievementId}`,
    'PUT',
    data,
  );
  if (!response.data)
    throw new Error(
      'Failed to update achievement: No data received from server.',
    );
  return response.data;
};

export const deleteAchievement = async (
  achievementId: number,
): Promise<MessagePayload> => {
  const response = await apiRequest<MessagePayload>(
    `/achievements/${achievementId}`,
    'DELETE',
  );
  // If backend sends an empty 200/204, response.data might be undefined.
  // In such cases, a default message is appropriate.
  if (!response.data || !response.data.message) {
    return { message: 'Achievement deleted successfully.' };
  }
  return response.data;
};

export const awardAchievement = async (
  userId: number,
  achievementId: number,
): Promise<MessagePayload> => {
  const response = await apiRequest<MessagePayload>(
    '/achievements/award',
    'POST',
    { userId, achievementId },
  );
  if (!response.data)
    throw new Error(
      'Failed to award achievement: No data received from server.',
    );
  return response.data;
};

export const checkAchievements =
  async (): Promise<CheckAchievementsPayload> => {
    const response = await apiRequest<CheckAchievementsPayload>(
      '/achievements/check',
      'POST',
    );
    if (!response.data)
      throw new Error(
        'Failed to check achievements: No data received from server.',
      );
    return response.data;
  };

export const getAchievementLeaderboard = async (
  limit: number = 10,
  offset: number = 0,
): Promise<AchievementLeaderboardPayload> => {
  const response = await apiRequest<AchievementLeaderboardPayload>(
    `/achievements/leaderboard?limit=${limit}&offset=${offset}`,
  );
  if (!response.data) return { leaderboard: [], total: 0 }; // Default for array-based responses
  return response.data;
};

export const getAchievementsByCategory = async (
  category: string,
): Promise<AllAchievementsPayload> => {
  const response = await apiRequest<AllAchievementsPayload>(
    `/achievements/category/${category}`,
  );
  return response.data || []; // Default for array-based responses
};
