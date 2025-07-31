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

// --- TURKISH TRANSLATION FUNCTIONS ---

// Turkish requirement name translations
const getTurkishRequirementName = (key: string): string => {
  const translations: Record<string, string> = {
    total_duels: 'Toplam Düello',
    duels_won: 'Kazanılan Düello',
    duels_lost: 'Kaybedilen Düello',
    distinct_study_days: 'Farklı Çalışma Günü',
    total_study_time_minutes: 'Toplam Çalışma Süresi',
    current_study_streak: 'Mevcut Çalışma Serisi',
    longest_study_streak: 'En Uzun Çalışma Serisi',
    weekly_champion_count: 'Haftalık Şampiyonluk',
    user_registration: 'Kullanıcı Kaydı',
    study_sessions_completed: 'Tamamlanan Çalışma Seansı',
    total_points_earned: 'Kazanılan Toplam Puan',
    consecutive_daily_logins: 'Ardışık Günlük Giriş',
    subjects_mastered: 'Uzmanlaşılan Konu',
    questions_answered: 'Cevaplanan Soru',
    perfect_scores: 'Mükemmel Skor',
    help_requests_sent: 'Gönderilen Yardım İsteği',
    help_provided: 'Sağlanan Yardım',
    forum_posts: 'Forum Gönderisi',
    comments_made: 'Yapılan Yorum',
    likes_received: 'Alınan Beğeni',
  };

  return (
    translations[key] ||
    key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  );
};

// Turkish unit translations
const getTurkishUnit = (key: string, count: number): string => {
  const units: Record<string, { singular: string; plural: string }> = {
    total_duels: { singular: 'düello', plural: 'düello' },
    duels_won: { singular: 'galibiyet', plural: 'galibiyet' },
    duels_lost: { singular: 'mağlubiyet', plural: 'mağlubiyet' },
    distinct_study_days: { singular: 'gün', plural: 'gün' },
    total_study_time_minutes: { singular: 'dakika', plural: 'dakika' },
    current_study_streak: { singular: 'gün', plural: 'gün' },
    longest_study_streak: { singular: 'gün', plural: 'gün' },
    weekly_champion_count: { singular: 'kez', plural: 'kez' },
    study_sessions_completed: { singular: 'seans', plural: 'seans' },
    total_points_earned: { singular: 'puan', plural: 'puan' },
    consecutive_daily_logins: { singular: 'gün', plural: 'gün' },
    subjects_mastered: { singular: 'konu', plural: 'konu' },
    questions_answered: { singular: 'soru', plural: 'soru' },
    perfect_scores: { singular: 'mükemmel skor', plural: 'mükemmel skor' },
    help_requests_sent: { singular: 'yardım isteği', plural: 'yardım isteği' },
    help_provided: { singular: 'yardım', plural: 'yardım' },
    forum_posts: { singular: 'gönderi', plural: 'gönderi' },
    comments_made: { singular: 'yorum', plural: 'yorum' },
    likes_received: { singular: 'beğeni', plural: 'beğeni' },
  };

  const unit = units[key];
  if (!unit) return '';

  // Turkish doesn't have plural forms like English, so we use the same form
  return unit.singular;
};

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

// --- UTILITY FUNCTIONS WITH TURKISH SUPPORT ---

// UPDATED: Format achievement progress percentage with Turkish
export const formatProgressPercentage = (progress: number): string => {
  return `%${Math.round(progress)}`;
};

// NEW: Check if achievement is completed
export const isAchievementCompleted = (
  progress: AchievementProgress,
): boolean => {
  return progress.overall_progress >= 100;
};

// UPDATED: Get next milestone for achievement with Turkish descriptions
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

  if (typeof closestRequirement.required === 'boolean') {
    return `${getTurkishRequirementName(
      closestRequirement.key,
    )} tamamlanması gerekiyor`;
  }

  const remaining = closestRequirement.required - closestRequirement.current;
  const requirementName = getTurkishRequirementName(closestRequirement.key);
  const unit = getTurkishUnit(closestRequirement.key, remaining);

  if (remaining === 1) {
    return `${requirementName} için ${remaining} ${unit} daha gerekli`;
  } else {
    return `${requirementName} için ${remaining} ${unit} daha gerekli`;
  }
};

// NEW: Get Turkish requirement detail
export const getTurkishRequirementDetail = (key: string, req: any): string => {
  if (typeof req.required === 'boolean') {
    return req.current ? 'Tamamlandı' : 'Henüz tamamlanmadı';
  }

  const unit = getTurkishUnit(key, req.required);
  return `${req.current} / ${req.required} ${unit}`.trim();
};

// Export the Turkish requirement name function for use in components
export { getTurkishRequirementName };

// NEW: Get Turkish completion status
export const getTurkishCompletionStatus = (
  isCompleted: boolean,
  progress: number,
): string => {
  if (isCompleted) {
    return 'Tamamlandı';
  }

  if (progress === 0) {
    return 'Başlanmadı';
  }

  if (progress < 25) {
    return 'Yeni Başlandı';
  }

  if (progress < 50) {
    return 'Devam Ediyor';
  }

  if (progress < 75) {
    return 'Yarıdan Fazla';
  }

  if (progress < 100) {
    return 'Neredeyse Bitti';
  }

  return 'Tamamlandı';
};

// NEW: Get Turkish difficulty level
export const getTurkishDifficultyLevel = (
  requirements: any,
): 'Kolay' | 'Orta' | 'Zor' | 'Çok Zor' => {
  if (!requirements) {
    return 'Kolay';
  }

  const requirementCount = Object.keys(requirements).length;
  const hasHighValues = Object.values(requirements).some(
    (req: any) => req.minimum && req.minimum > 100,
  );
  const hasVeryHighValues = Object.values(requirements).some(
    (req: any) => req.minimum && req.minimum > 500,
  );

  if (hasVeryHighValues || requirementCount > 4) {
    return 'Çok Zor';
  } else if (hasHighValues || requirementCount > 2) {
    return 'Zor';
  } else if (requirementCount > 1) {
    return 'Orta';
  } else {
    return 'Kolay';
  }
};

// NEW: Get Turkish category names
export const getTurkishCategoryName = (category: string): string => {
  const categoryTranslations: Record<string, string> = {
    general: 'Genel',
    learning: 'Öğrenme',
    social: 'Sosyal',
    progress: 'İlerleme',
    special: 'Özel',
    achievement: 'Başarı',
    study: 'Çalışma',
    duel: 'Düello',
    streak: 'Seri',
    time: 'Zaman',
    mastery: 'Uzmanlaşma',
    community: 'Topluluk',
    milestone: 'Kilometre Taşı',
  };

  return categoryTranslations[category] || category;
};

// NEW: Get Turkish rarity names
export const getTurkishRarityName = (rarity: string): string => {
  const rarityTranslations: Record<string, string> = {
    common: 'Yaygın',
    uncommon: 'Nadir',
    rare: 'Ender',
    epic: 'Efsanevi',
    legendary: 'Efsane',
  };

  return rarityTranslations[rarity] || rarity;
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

// UPDATED: Auto-trigger achievement check after study session with Turkish messages
export const handleStudySessionCompleted = async (
  sessionData?: any,
): Promise<CheckAchievementsPayload | null> => {
  try {
    console.log(
      'Çalışma seansı tamamlandıktan sonra başarı kontrolü yapılıyor',
    );
    const result = await triggerAchievementCheck('study_session_completed');

    if (result.newAchievements > 0) {
      console.log(
        `🎉 ${result.newAchievements} yeni başarı kazanıldı!`,
        result.achievements,
      );
    }

    return result;
  } catch (error) {
    console.error('Çalışma seansı başarı kontrolünde hata:', error);
    return null;
  }
};

// UPDATED: Auto-trigger achievement check after duel completion with Turkish messages
export const handleDuelCompleted = async (
  duelData?: any,
): Promise<CheckAchievementsPayload | null> => {
  try {
    console.log('Düello tamamlandıktan sonra başarı kontrolü yapılıyor');
    const result = await triggerAchievementCheck('duel_completed');

    if (result.newAchievements > 0) {
      console.log(
        `🎉 Düellodan ${result.newAchievements} yeni başarı kazanıldı!`,
        result.achievements,
      );
    }

    return result;
  } catch (error) {
    console.error('Düello başarı kontrolünde hata:', error);
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
