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

// NEW: Achievement progress interfaces
export interface AchievementProgress {
  achievement_id: number;
  name: string;
  description: string;
  overall_progress: number;
  requirements: Record<
    string,
    {
      current: number;
      required: number | boolean;
      progress: number;
    }
  >;
}

export interface UserAchievementProgressPayload {
  message: string;
  progress: AchievementProgress[];
}

// NEW: Achievement checking interfaces
export interface CheckAchievementsPayload {
  message: string;
  newAchievements: number;
  achievements: Array<{
    id: number;
    name: string;
    description: string;
  }>;
}

// NEW: User statistics interfaces
export interface UserStatistics {
  user_id: number;
  date_registered: string;
  total_duels: number;
  duels_won: number;
  duels_lost: number;
  distinct_study_days: number;
  total_study_time_minutes: number;
  current_study_streak: number;
  longest_study_streak: number;
  weekly_champion_count: number;
  user_registration: boolean;
}

export interface UserStatsPayload {
  message: string;
  stats: UserStatistics;
}

// NEW: Bulk check interfaces
export interface BulkCheckResult {
  userId: number;
  success: boolean;
  newAchievements: number;
  achievements?: Array<{
    id: number;
    name: string;
  }>;
  error?: string;
}

export interface BulkCheckPayload {
  message: string;
  summary: {
    totalUsers: number;
    successfulChecks: number;
    failedChecks: number;
    totalNewAchievements: number;
  };
  results: BulkCheckResult[];
}

// NEW: Achievement statistics interfaces
export interface AchievementStatsPayload {
  message: string;
  stats: {
    totalAchievements: number;
    totalUserAchievements: number;
    recentAchievements: number;
    averageAchievementsPerUser: number;
    distribution: Array<{
      achievement_id: number;
      name: string;
      count: number;
    }>;
  };
}

// Updated leaderboard interface
export interface AchievementLeaderboardPayload {
  message: string;
  leaderboard: Array<{
    user_id: number;
    username: string;
    count: number;
  }>;
}

// Existing interfaces
type AllAchievementsPayload = Achievement[];
type UserAchievementsPayload = UserAchievement[];

interface AchievementMutationPayload {
  message: string;
  achievement: Achievement;
}

interface MessagePayload {
  message: string;
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
    return response.data === undefined ? null : response.data;
  } catch (error: any) {
    if (error.status === 404) {
      console.warn(`Achievement with ID ${achievementId} not found.`);
      return null;
    }
    console.error(`Error fetching achievement ${achievementId}:`, error);
    throw error;
  }
};

export const getUserAchievements =
  async (): Promise<UserAchievementsPayload> => {
    const response = await apiRequest<UserAchievementsPayload>(
      '/achievements/user',
    );
    return response.data || [];
  };

// NEW: Get user's achievement progress
export const getUserAchievementProgress = async (): Promise<
  AchievementProgress[]
> => {
  try {
    const response = await apiRequest<UserAchievementProgressPayload>(
      '/achievements/user/progress',
    );
    return response.data?.progress || [];
  } catch (error: any) {
    if (error.status === 404) {
      console.warn('User achievement progress not found.');
      return [];
    }
    console.error('Error fetching user achievement progress:', error);
    throw error;
  }
};

// NEW: Check user's achievements manually
export const checkUserAchievements =
  async (): Promise<CheckAchievementsPayload> => {
    try {
      const response = await apiRequest<CheckAchievementsPayload>(
        '/achievements/user/check',
        'POST',
      );
      if (!response.data) {
        throw new Error(
          'Failed to check achievements: No data received from server.',
        );
      }
      return response.data;
    } catch (error) {
      console.error('Error checking user achievements:', error);
      throw error;
    }
  };

// NEW: Get user statistics
export const getUserStats = async (): Promise<UserStatistics | null> => {
  try {
    const response = await apiRequest<UserStatsPayload>(
      '/achievements/user/stats',
    );
    return response.data?.stats || null;
  } catch (error: any) {
    if (error.status === 404) {
      console.warn('User statistics not found.');
      return null;
    }
    console.error('Error fetching user statistics:', error);
    throw error;
  }
};

// NEW: Trigger achievement check after specific action
export const triggerAchievementCheck = async (
  actionType: 'study_session_completed' | 'duel_completed' | 'user_registered',
): Promise<CheckAchievementsPayload> => {
  try {
    const response = await apiRequest<CheckAchievementsPayload>(
      '/achievements/trigger',
      'POST',
      { actionType },
    );
    if (!response.data) {
      throw new Error(
        'Failed to trigger achievement check: No data received from server.',
      );
    }
    return response.data;
  } catch (error) {
    console.error('Error triggering achievement check:', error);
    throw error;
  }
};

// Updated leaderboard function
export const getAchievementLeaderboard = async (
  limit: number = 10,
): Promise<AchievementLeaderboardPayload> => {
  const response = await apiRequest<AchievementLeaderboardPayload>(
    `/achievements/leaderboard?limit=${limit}`,
  );
  if (!response.data) {
    return { message: 'No leaderboard data found', leaderboard: [] };
  }
  return response.data;
};

// --- ADMIN FUNCTIONS ---

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

// NEW: Bulk check achievements (admin only)
export const bulkCheckAchievements = async (
  userIds: number[],
): Promise<BulkCheckPayload> => {
  const response = await apiRequest<BulkCheckPayload>(
    '/achievements/bulk-check',
    'POST',
    { userIds },
  );
  if (!response.data) {
    throw new Error(
      'Failed to bulk check achievements: No data received from server.',
    );
  }
  return response.data;
};

// NEW: Check all users achievements (admin only)
export const checkAllUsersAchievements = async (
  limit: number = 100,
): Promise<BulkCheckPayload> => {
  const response = await apiRequest<BulkCheckPayload>(
    `/achievements/check-all?limit=${limit}`,
    'POST',
  );
  if (!response.data) {
    throw new Error(
      'Failed to check all users achievements: No data received from server.',
    );
  }
  return response.data;
};

// NEW: Get achievement statistics (admin only)
export const getAchievementStats =
  async (): Promise<AchievementStatsPayload> => {
    const response = await apiRequest<AchievementStatsPayload>(
      '/achievements/stats',
    );
    if (!response.data) {
      throw new Error(
        'Failed to get achievement statistics: No data received from server.',
      );
    }
    return response.data;
  };

// NEW: Get user statistics by ID (admin only)
export const getUserStatsByUserId = async (
  userId: number,
): Promise<UserStatistics | null> => {
  try {
    const response = await apiRequest<UserStatsPayload>(
      `/achievements/${userId}/stats`,
    );
    return response.data?.stats || null;
  } catch (error: any) {
    if (error.status === 404) {
      console.warn(`User statistics not found for user ${userId}.`);
      return null;
    }
    console.error(`Error fetching statistics for user ${userId}:`, error);
    throw error;
  }
};

// --- UTILITY FUNCTIONS ---

// NEW: Format achievement progress percentage
export const formatProgressPercentage = (progress: number): string => {
  return `${Math.round(progress)}%`;
};

// NEW: Check if achievement is completed
export const isAchievementCompleted = (
  progress: AchievementProgress,
): boolean => {
  return progress.overall_progress >= 100;
};

// NEW: Get next milestone for achievement
export const getNextMilestone = (
  progress: AchievementProgress,
): string | null => {
  if (progress.overall_progress >= 100) {
    return null; // Already completed
  }

  // Find the requirement that's closest to completion but not yet met
  let closestRequirement = null;
  let highestProgress = 0;

  for (const [key, req] of Object.entries(progress.requirements)) {
    if (req.progress < 100 && req.progress > highestProgress) {
      highestProgress = req.progress;
      closestRequirement = {
        key,
        current: req.current,
        required: req.required,
        progress: req.progress,
      };
    }
  }

  if (!closestRequirement) {
    return null;
  }

  const remaining =
    typeof closestRequirement.required === 'number'
      ? closestRequirement.required - closestRequirement.current
      : 'Complete this requirement';

  return `${remaining} more needed for ${closestRequirement.key.replace(
    '_',
    ' ',
  )}`;
};

// NEW: Calculate overall user achievement completion
export const calculateUserAchievementCompletion = async (): Promise<{
  completed: number;
  total: number;
  percentage: number;
}> => {
  try {
    const [allAchievements, userAchievements] = await Promise.all([
      getAllAchievements(),
      getUserAchievements(),
    ]);

    const completed = userAchievements.length;
    const total = allAchievements.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  } catch (error) {
    console.error('Error calculating user achievement completion:', error);
    return { completed: 0, total: 0, percentage: 0 };
  }
};

// NEW: Get achievements by difficulty (based on requirements complexity)
export const getAchievementsByDifficulty = (
  achievements: Achievement[],
): {
  easy: Achievement[];
  medium: Achievement[];
  hard: Achievement[];
} => {
  const easy: Achievement[] = [];
  const medium: Achievement[] = [];
  const hard: Achievement[] = [];

  achievements.forEach((achievement) => {
    if (!achievement.requirements) {
      easy.push(achievement);
      return;
    }

    const requirementCount = Object.keys(achievement.requirements).length;
    const hasHighValues = Object.values(achievement.requirements).some(
      (req: any) => req.minimum && req.minimum > 50,
    );

    if (requirementCount === 1 && !hasHighValues) {
      easy.push(achievement);
    } else if (requirementCount <= 2 && !hasHighValues) {
      medium.push(achievement);
    } else {
      hard.push(achievement);
    }
  });

  return { easy, medium, hard };
};

// NEW: Auto-trigger achievement check after study session
export const handleStudySessionCompleted = async (
  sessionData?: any,
): Promise<CheckAchievementsPayload | null> => {
  try {
    console.log('Triggering achievement check after study session completion');
    const result = await triggerAchievementCheck('study_session_completed');

    if (result.newAchievements > 0) {
      console.log(
        `🎉 Earned ${result.newAchievements} new achievements!`,
        result.achievements,
      );
    }

    return result;
  } catch (error) {
    console.error('Error handling study session achievement check:', error);
    return null;
  }
};

// NEW: Auto-trigger achievement check after duel completion
export const handleDuelCompleted = async (
  duelData?: any,
): Promise<CheckAchievementsPayload | null> => {
  try {
    console.log('Triggering achievement check after duel completion');
    const result = await triggerAchievementCheck('duel_completed');

    if (result.newAchievements > 0) {
      console.log(
        `🎉 Earned ${result.newAchievements} new achievements from duel!`,
        result.achievements,
      );
    }

    return result;
  } catch (error) {
    console.error('Error handling duel achievement check:', error);
    return null;
  }
};

// --- LEGACY FUNCTIONS (for backward compatibility) ---

// Keep the old checkAchievements function name for compatibility
export const checkAchievements =
  async (): Promise<CheckAchievementsPayload> => {
    return await checkUserAchievements();
  };

// Keep the old function signature for category-based achievements
export const getAchievementsByCategory = async (
  category: string,
): Promise<AllAchievementsPayload> => {
  // Filter achievements by category from all achievements
  const allAchievements = await getAllAchievements();
  return allAchievements.filter(
    (achievement) => achievement.category === category,
  );
};
