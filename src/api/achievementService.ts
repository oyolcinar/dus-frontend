import apiRequest from './apiClient';
import {
  Achievement,
  UserAchievement,
  AchievementProgress,
  UserAchievementProgressPayload,
  CheckAchievementsPayload,
  UserStatistics,
  UserStatsPayload,
  BulkCheckResult,
  BulkCheckPayload,
  AchievementStatsPayload,
  AchievementLeaderboardPayload,
  CreateAchievementInput,
  AchievementMutationPayload,
  MessagePayload,
  CourseStudyMetrics,
  CourseStudyMetricsPayload,
  CourseStudySessionData,
  CourseCompletionData,
  AchievementActionType,
} from '../types/models';

// --- TURKISH TRANSLATION FUNCTIONS ---

// UPDATED: Turkish requirement name translations with course-based terms
const getTurkishRequirementName = (key: string): string => {
  const translations: Record<string, string> = {
    // Existing translations
    total_duels: 'Toplam Düello',
    duels_won: 'Kazanılan Düello',
    duels_lost: 'Kaybedilen Düello',
    distinct_study_days: 'Farklı Çalışma Günü',
    total_study_time_minutes: 'Toplam Çalışma Süresi',
    current_study_streak: 'Mevcut Çalışma Serisi',
    longest_study_streak: 'En Uzun Çalışma Serisi',
    weekly_champion_count: 'Haftalık Şampiyonluk',
    user_registration: 'Kullanıcı Kaydı',

    // ✅ NEW: Course-based translations
    courses_studied: 'Çalışılan Ders',
    courses_completed: 'Tamamlanan Ders',
    total_course_study_time_seconds: 'Toplam Ders Çalışma Süresi',
    total_course_study_time_minutes: 'Toplam Ders Çalışma Dakikası',
    total_course_sessions: 'Toplam Ders Seansı',

    // Legacy compatibility
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

// UPDATED: Turkish unit translations with course-based units
const getTurkishUnit = (key: string, count: number): string => {
  const units: Record<string, { singular: string; plural: string }> = {
    // Existing units
    total_duels: { singular: 'düello', plural: 'düello' },
    duels_won: { singular: 'galibiyet', plural: 'galibiyet' },
    duels_lost: { singular: 'mağlubiyet', plural: 'mağlubiyet' },
    distinct_study_days: { singular: 'gün', plural: 'gün' },
    total_study_time_minutes: { singular: 'dakika', plural: 'dakika' },
    current_study_streak: { singular: 'gün', plural: 'gün' },
    longest_study_streak: { singular: 'gün', plural: 'gün' },
    weekly_champion_count: { singular: 'kez', plural: 'kez' },

    // ✅ NEW: Course-based units
    courses_studied: { singular: 'ders', plural: 'ders' },
    courses_completed: { singular: 'ders', plural: 'ders' },
    total_course_study_time_seconds: { singular: 'saniye', plural: 'saniye' },
    total_course_study_time_minutes: { singular: 'dakika', plural: 'dakika' },
    total_course_sessions: { singular: 'seans', plural: 'seans' },

    // Legacy units
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

  return unit.singular; // Turkish doesn't have plural forms like English
};

// --- CORE SERVICE FUNCTIONS ---

export const getAllAchievements = async (): Promise<Achievement[]> => {
  const response = await apiRequest<Achievement[]>('/achievements');
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

export const getUserAchievements = async (): Promise<UserAchievement[]> => {
  const response = await apiRequest<UserAchievement[]>('/achievements/user');
  return response.data || [];
};

// ✅ NEW: Get user's achievement progress
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

// ✅ NEW: Check user's achievements manually
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

// ✅ NEW: Get user statistics
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

// ✅ UPDATED: Trigger achievement check after specific action with course support
export const triggerAchievementCheck = async (
  actionType: AchievementActionType,
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

// ✅ NEW: Course study session completion handler
export const handleCourseStudySessionCompleted = async (
  sessionData: CourseStudySessionData,
): Promise<CheckAchievementsPayload | null> => {
  try {
    console.log(
      'Ders çalışma seansı tamamlandıktan sonra başarı kontrolü yapılıyor',
      sessionData,
    );

    const result = await triggerAchievementCheck(
      'course_study_session_completed',
    );

    if (result.newAchievements > 0) {
      console.log(
        `🎉 Ders seansından ${result.newAchievements} yeni başarı kazanıldı!`,
        result.achievements,
      );
    }

    return result;
  } catch (error) {
    console.error('Ders seansı başarı kontrolünde hata:', error);
    return null;
  }
};

// ✅ NEW: Course completion handler
export const handleCourseCompleted = async (
  courseData: CourseCompletionData,
): Promise<CheckAchievementsPayload | null> => {
  try {
    console.log(
      'Ders tamamlandıktan sonra başarı kontrolü yapılıyor',
      courseData,
    );

    const result = await triggerAchievementCheck('course_completed');

    if (result.newAchievements > 0) {
      console.log(
        `🎉 Ders tamamlamadan ${result.newAchievements} yeni başarı kazanıldı!`,
        result.achievements,
      );
    }

    return result;
  } catch (error) {
    console.error('Ders tamamlama başarı kontrolünde hata:', error);
    return null;
  }
};

// ✅ UPDATED: Legacy study session handler - now redirects to course-based
export const handleStudySessionCompleted = async (
  sessionData?: any,
): Promise<CheckAchievementsPayload | null> => {
  try {
    console.log(
      '⚠️ Legacy handleStudySessionCompleted kullanılıyor - ders bazlı sisteme yönlendiriliyor',
    );

    // If we have course data, use the new course-based handler
    if (sessionData?.courseId || sessionData?.course_id) {
      const courseSessionData: CourseStudySessionData = {
        courseId: sessionData.courseId || sessionData.course_id,
        courseTitle: sessionData.courseTitle || sessionData.course_title,
        studyDurationSeconds:
          sessionData.studyDurationSeconds || sessionData.duration_seconds || 0,
        breakDurationSeconds: sessionData.breakDurationSeconds || 0,
        sessionDate:
          sessionData.sessionDate ||
          sessionData.session_date ||
          new Date().toISOString().split('T')[0],
        courseType: sessionData.courseType || sessionData.course_type,
        sessionId: sessionData.sessionId || sessionData.session_id,
        totalDurationSeconds:
          sessionData.totalDurationSeconds ||
          sessionData.total_duration_seconds,
        notes: sessionData.notes,
      };

      return await handleCourseStudySessionCompleted(courseSessionData);
    }

    // Fallback to legacy trigger for backward compatibility
    console.log('📚 Fallback: Legacy study session achievement check');
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

// ✅ UPDATED: Auto-trigger achievement check after duel completion with Turkish messages
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

// ✅ NEW: Course-specific achievement progress
export const getCourseAchievementProgress = async (
  courseId: string | number,
): Promise<AchievementProgress[]> => {
  try {
    const response = await apiRequest<UserAchievementProgressPayload>(
      `/achievements/course/${courseId}/progress`,
    );
    return response.data?.progress || [];
  } catch (error: any) {
    if (error.status === 404) {
      console.warn(
        `Course achievement progress not found for course ${courseId}.`,
      );
      return [];
    }
    console.error('Error fetching course achievement progress:', error);
    throw error;
  }
};

// ✅ NEW: Get course study metrics for achievements
export const getCourseStudyMetrics =
  async (): Promise<CourseStudyMetrics | null> => {
    try {
      const response = await apiRequest<CourseStudyMetricsPayload>(
        '/achievements/user/course-metrics',
      );

      if (!response.data?.metrics) return null;

      return response.data.metrics;
    } catch (error: any) {
      if (error.status === 404) {
        console.warn('Course study metrics not found.');
        return null;
      }
      console.error('Error fetching course study metrics:', error);
      throw error;
    }
  };

// ✅ NEW: Get achievement leaderboard
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

// ✅ NEW: Bulk check achievements (admin only)
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

// ✅ NEW: Check all users achievements (admin only)
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

// ✅ NEW: Get achievement statistics (admin only)
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

// ✅ NEW: Get user statistics by ID (admin only)
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

// ✅ UPDATED: Format achievement progress percentage with Turkish
export const formatProgressPercentage = (progress: number): string => {
  return `%${Math.round(progress)}`;
};

// ✅ NEW: Check if achievement is completed
export const isAchievementCompleted = (
  progress: AchievementProgress,
): boolean => {
  return progress.overall_progress >= 100;
};

// ✅ UPDATED: Get next milestone for achievement with Turkish descriptions
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

// ✅ NEW: Get Turkish requirement detail
export const getTurkishRequirementDetail = (key: string, req: any): string => {
  if (typeof req.required === 'boolean') {
    return req.current ? 'Tamamlandı' : 'Henüz tamamlanmadı';
  }

  const unit = getTurkishUnit(key, req.required);
  return `${req.current} / ${req.required} ${unit}`.trim();
};

// Export the Turkish requirement name function for use in components
export { getTurkishRequirementName };

// ✅ NEW: Get Turkish completion status
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

// ✅ NEW: Get Turkish difficulty level
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

// ✅ NEW: Get Turkish category names
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
    course: 'Ders', // ✅ NEW: Course category
  };

  return categoryTranslations[category] || category;
};

// ✅ NEW: Get Turkish rarity names
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

// ✅ NEW: Calculate overall user achievement completion
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

// ✅ NEW: Get achievements by difficulty (based on requirements complexity)
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

// --- LEGACY FUNCTIONS (for backward compatibility) ---

// Keep the old checkAchievements function name for compatibility
export const checkAchievements =
  async (): Promise<CheckAchievementsPayload> => {
    return await checkUserAchievements();
  };

// Keep the old function signature for category-based achievements
export const getAchievementsByCategory = async (
  category: string,
): Promise<Achievement[]> => {
  // Filter achievements by category from all achievements
  const allAchievements = await getAllAchievements();
  return allAchievements.filter(
    (achievement) => achievement.category === category,
  );
};

// ✅ NEW: Course-specific utility functions
export const getCourseBasedAchievements = async (): Promise<Achievement[]> => {
  const allAchievements = await getAllAchievements();
  return allAchievements.filter(
    (achievement) =>
      achievement.category === 'course' ||
      achievement.category === 'learning' ||
      (achievement.requirements &&
        (achievement.requirements.courses_studied ||
          achievement.requirements.courses_completed ||
          achievement.requirements.total_course_study_time_minutes)),
  );
};

export const getStudyStreakAchievements = async (): Promise<Achievement[]> => {
  const allAchievements = await getAllAchievements();
  return allAchievements.filter(
    (achievement) =>
      achievement.category === 'streak' ||
      (achievement.requirements &&
        (achievement.requirements.current_study_streak ||
          achievement.requirements.longest_study_streak)),
  );
};

export const getDuelAchievements = async (): Promise<Achievement[]> => {
  const allAchievements = await getAllAchievements();
  return allAchievements.filter(
    (achievement) =>
      achievement.category === 'duel' ||
      (achievement.requirements &&
        (achievement.requirements.total_duels ||
          achievement.requirements.duels_won ||
          achievement.requirements.duels_lost)),
  );
};

// ✅ NEW: Debug and testing functions
export const debugAchievementSystem = async (): Promise<void> => {
  try {
    console.log('🔍 === ACHIEVEMENT SYSTEM DEBUG ===');

    // Get user stats
    const stats = await getUserStats();
    console.log('📊 User Statistics:', stats);

    // Get user progress
    const progress = await getUserAchievementProgress();
    console.log(
      `📈 Achievement Progress: ${progress.length} achievements tracked`,
    );

    // Get course metrics
    const courseMetrics = await getCourseStudyMetrics();
    console.log('📚 Course Metrics:', courseMetrics);

    // Check for new achievements
    const achievementCheck = await checkUserAchievements();
    console.log('🏆 Achievement Check Result:', achievementCheck);
  } catch (error) {
    console.error('❌ Achievement system debug failed:', error);
  }
};

export const testCourseAchievementFlow = async (
  testCourseData: CourseStudySessionData,
): Promise<void> => {
  try {
    console.log('🧪 Testing course achievement flow...');

    // Test course session completion
    const sessionResult =
      await handleCourseStudySessionCompleted(testCourseData);
    console.log('📚 Session completion result:', sessionResult);

    // Test course completion (if applicable)
    if (testCourseData.courseTitle) {
      const completionResult = await handleCourseCompleted({
        courseId: testCourseData.courseId,
        courseTitle: testCourseData.courseTitle,
        completionPercentage: 100,
        courseType: testCourseData.courseType,
      });
      console.log('🎯 Course completion result:', completionResult);
    }
  } catch (error) {
    console.error('❌ Course achievement flow test failed:', error);
  }
};
