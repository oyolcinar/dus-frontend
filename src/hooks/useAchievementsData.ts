// src/hooks/useAchievementsData.ts - FULLY COMPATIBLE WITH YOUR MODEL TYPES
import { useQuery, useQueries } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getAllAchievements,
  getAchievementById,
  getUserAchievements,
  getUserAchievementProgress,
  getAchievementsByCategory,
  checkUserAchievements,
  getUserStats,
  getCourseStudyMetrics,
  getAchievementLeaderboard,
  getCourseBasedAchievements,
  getStudyStreakAchievements,
  getDuelAchievements,
  getCourseAchievementProgress,
  calculateUserAchievementCompletion,
  getAchievementsByDifficulty,
  formatProgressPercentage,
  isAchievementCompleted,
  getNextMilestone,
  getTurkishRequirementName,
  getTurkishRequirementDetail,
  getTurkishCompletionStatus,
  getTurkishCategoryName,
  getTurkishRarityName,
  triggerAchievementCheck,
  handleCourseStudySessionCompleted,
  handleCourseCompleted,
  handleDuelCompleted,
} from '../api/achievementService';

// ✅ USING YOUR EXACT MODEL TYPES
import type {
  Achievement,
  UserAchievement,
  AchievementProgress,
  UserStatistics,
  CourseStudyMetrics,
  CheckAchievementsPayload,
  CourseStudySessionData,
  CourseCompletionData,
  AchievementActionType,
} from '../types/models';

// ✅ ENHANCED ACHIEVEMENT INTERFACE - EXTENDS YOUR BASE TYPES
export interface EnhancedAchievement extends Achievement {
  // From UserAchievement if unlocked
  date_earned?: string;
  progress?: number;

  // From AchievementProgress
  progress_data?: AchievementProgress;

  // Computed fields for UI
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  is_unlocked: boolean;
  overall_progress: number;
  next_milestone?: string | null;
  completion_status: string;
  turkish_category: string;
  turkish_rarity: string;
  difficulty_level: 'Kolay' | 'Orta' | 'Zor' | 'Çok Zor';
}

// ✅ FILTER OPTIONS INTERFACE
export interface AchievementFilters {
  category: string;
  status: 'all' | 'unlocked' | 'locked' | 'in_progress';
  rarity: 'all' | 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  difficulty: 'all' | 'easy' | 'medium' | 'hard';
}

// ✅ LEADERBOARD ENTRY - COMPATIBLE WITH AchievementLeaderboardPayload
export interface AchievementLeaderboardEntry {
  user_id: number;
  username: string;
  count: number; // This matches your model's structure
  totalAchievements?: number; // Computed field
  totalPoints?: number; // If available from API
  completionPercentage?: number; // If available from API
  rank: number; // Computed field
}

// ✅ COMPLETION STATS INTERFACE - CLIENT-SIDE COMPUTED
export interface AchievementCompletionStats {
  completed: number;
  total: number;
  percentage: number;
  byCategory: Record<
    string,
    { completed: number; total: number; percentage: number }
  >;
  byRarity: Record<
    string,
    { completed: number; total: number; percentage: number }
  >;
}

// 🚀 MAIN USER ACHIEVEMENTS HOOK
export function useUserAchievements() {
  return useQuery({
    queryKey: ['user-achievements'],
    queryFn: async (): Promise<UserAchievement[]> => {
      console.log('🏆 Fetching user achievements...');
      try {
        const userAchievements = await getUserAchievements();
        console.log(
          '✅ User achievements fetched:',
          userAchievements?.length || 0,
        );
        return userAchievements || [];
      } catch (error) {
        console.error('❌ Error fetching user achievements:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
}

// 🚀 ACHIEVEMENT PROGRESS HOOK
export function useAchievementProgress() {
  return useQuery({
    queryKey: ['achievement-progress'],
    queryFn: async (): Promise<AchievementProgress[]> => {
      console.log('📊 Fetching achievement progress...');
      try {
        const progressResponse = await getUserAchievementProgress();

        // ✅ HANDLE BOTH DIRECT ARRAY AND PAYLOAD STRUCTURE
        let progress: AchievementProgress[];
        if (Array.isArray(progressResponse)) {
          progress = progressResponse;
        } else if (
          progressResponse &&
          typeof progressResponse === 'object' &&
          'progress' in progressResponse
        ) {
          // Handle UserAchievementProgressPayload structure
          progress = (progressResponse as any).progress;
        } else {
          progress = [];
        }

        console.log('📈 Achievement progress fetched:', progress?.length || 0);
        return progress || [];
      } catch (error) {
        console.error('❌ Error fetching achievement progress:', error);
        return [];
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - progress changes more frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

// 🚀 ALL ACHIEVEMENTS HOOK
export function useAllAchievements() {
  return useQuery({
    queryKey: ['all-achievements'],
    queryFn: async (): Promise<Achievement[]> => {
      console.log('🎯 Fetching all achievements...');
      try {
        let allAchievements = await getAllAchievements();

        // Fallback: Get achievements from known categories if main call fails
        if (!allAchievements || allAchievements.length === 0) {
          console.log('📚 Fallback: Fetching achievements by categories...');
          const categories = [
            'general',
            'learning',
            'social',
            'progress',
            'special',
            'course',
            'duel',
            'streak',
          ];
          const categoryResults = await Promise.allSettled(
            categories.map((category) => getAchievementsByCategory(category)),
          );

          allAchievements = categoryResults
            .filter(
              (result): result is PromiseFulfilledResult<Achievement[]> =>
                result.status === 'fulfilled',
            )
            .flatMap((result) => result.value);
        }

        // Remove duplicates based on achievement_id
        const uniqueAchievements = allAchievements.filter(
          (achievement, index, self) =>
            index ===
            self.findIndex(
              (a) => a.achievement_id === achievement.achievement_id,
            ),
        );

        console.log('🎯 All achievements fetched:', uniqueAchievements.length);
        return uniqueAchievements;
      } catch (error) {
        console.error('❌ Error fetching all achievements:', error);
        return [];
      }
    },
    staleTime: 15 * 60 * 1000, // 15 minutes - achievements don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
  });
}

// 🚀 USER STATS HOOK - HANDLES PAYLOAD STRUCTURE
export function useUserStats() {
  return useQuery({
    queryKey: ['user-achievement-stats'],
    queryFn: async (): Promise<UserStatistics | null> => {
      console.log('📊 Fetching user statistics...');
      try {
        const statsResponse = await getUserStats();

        // ✅ HANDLE BOTH DIRECT OBJECT AND PAYLOAD STRUCTURE
        let stats: UserStatistics | null;
        if (statsResponse && typeof statsResponse === 'object') {
          // Check if it's a UserStatsPayload (has message and stats properties)
          if ('message' in statsResponse && 'stats' in statsResponse) {
            stats = (statsResponse as any).stats;
          } else if ('user_id' in statsResponse) {
            // Handle direct UserStatistics object
            stats = statsResponse as UserStatistics;
          } else {
            stats = null;
          }
        } else {
          stats = null;
        }

        console.log('📈 User stats fetched:', stats ? 'success' : 'no data');
        return stats;
      } catch (error) {
        console.error('❌ Error fetching user stats:', error);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}

// 🚀 COURSE STUDY METRICS HOOK - HANDLES PAYLOAD STRUCTURE
export function useCourseStudyMetrics() {
  return useQuery({
    queryKey: ['course-study-metrics'],
    queryFn: async (): Promise<CourseStudyMetrics | null> => {
      console.log('📚 Fetching course study metrics...');
      try {
        const metricsResponse = await getCourseStudyMetrics();

        // ✅ HANDLE BOTH DIRECT OBJECT AND PAYLOAD STRUCTURE
        let metrics: CourseStudyMetrics | null;
        if (metricsResponse && typeof metricsResponse === 'object') {
          // Check if it's a CourseStudyMetricsPayload (has message and metrics properties)
          if ('message' in metricsResponse && 'metrics' in metricsResponse) {
            metrics = (metricsResponse as any).metrics;
          } else if ('total_courses_studied' in metricsResponse) {
            // Handle direct CourseStudyMetrics object
            metrics = metricsResponse as CourseStudyMetrics;
          } else {
            metrics = null;
          }
        } else {
          metrics = null;
        }

        console.log(
          '📊 Course metrics fetched:',
          metrics ? 'success' : 'no data',
        );
        return metrics;
      } catch (error) {
        console.error('❌ Error fetching course study metrics:', error);
        return null;
      }
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}

// 🚀 ACHIEVEMENT LEADERBOARD HOOK - COMPATIBLE WITH YOUR MODEL
export function useAchievementLeaderboard(limit: number = 20) {
  return useQuery({
    queryKey: ['achievement-leaderboard', limit],
    queryFn: async (): Promise<AchievementLeaderboardEntry[]> => {
      console.log('🏆 Fetching achievement leaderboard...');
      try {
        const leaderboardResponse = await getAchievementLeaderboard(limit);

        // ✅ HANDLE AchievementLeaderboardPayload STRUCTURE
        let leaderboard: Array<{
          user_id: number;
          username: string;
          count: number;
        }> = [];

        if (leaderboardResponse && typeof leaderboardResponse === 'object') {
          // Check if it's AchievementLeaderboardPayload (has message and leaderboard properties)
          if (
            'message' in leaderboardResponse &&
            'leaderboard' in leaderboardResponse
          ) {
            leaderboard = (leaderboardResponse as any).leaderboard;
          } else if (Array.isArray(leaderboardResponse)) {
            leaderboard = leaderboardResponse;
          }
        }

        return leaderboard.map((entry, index) => ({
          user_id: entry.user_id,
          username: entry.username,
          count: entry.count,
          totalAchievements: entry.count, // Alias for UI compatibility
          totalPoints: 0, // Default if not provided
          completionPercentage: 0, // Default if not provided
          rank: index + 1,
        }));
      } catch (error) {
        console.error('❌ Error fetching achievement leaderboard:', error);
        return [];
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 1,
    enabled: limit > 0,
  });
}

// 🚀 SPECIFIC ACHIEVEMENT DETAILS HOOK
export function useAchievementDetails(achievementId: number) {
  return useQuery({
    queryKey: ['achievement-details', achievementId],
    queryFn: async (): Promise<EnhancedAchievement | null> => {
      console.log(`🔍 Fetching achievement details for ${achievementId}...`);
      try {
        // Get base achievement data
        const achievement = await getAchievementById(achievementId);
        if (!achievement) return null;

        // Get user achievement and progress data in parallel
        const [userAchievements, progressData] = await Promise.all([
          getUserAchievements(),
          getUserAchievementProgress(),
        ]);

        // Find user achievement
        const userAchievement = userAchievements.find(
          (ua) => ua.achievement_id === achievement.achievement_id,
        );

        // Find progress data - handle payload structure
        let progress: AchievementProgress[];
        if (Array.isArray(progressData)) {
          progress = progressData;
        } else if (
          progressData &&
          typeof progressData === 'object' &&
          'progress' in progressData
        ) {
          progress = (progressData as any).progress;
        } else {
          progress = [];
        }

        const achievementProgress = progress.find(
          (ap) => ap.achievement_id === achievement.achievement_id,
        );

        // Enhance achievement with computed data
        const enhanced = enhanceAchievement(
          achievement,
          userAchievement,
          achievementProgress,
        );

        console.log('🎯 Achievement details fetched:', enhanced.name);
        return enhanced;
      } catch (error) {
        console.error(`❌ Error fetching achievement ${achievementId}:`, error);
        throw error;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    enabled: !!achievementId && achievementId > 0,
  });
}

// 🚀 ENHANCED ACHIEVEMENTS HOOK (Combines all data)
export function useEnhancedAchievements() {
  const allAchievementsQuery = useAllAchievements();
  const userAchievementsQuery = useUserAchievements();
  const progressQuery = useAchievementProgress();

  return useQuery({
    queryKey: ['enhanced-achievements'],
    queryFn: async (): Promise<EnhancedAchievement[]> => {
      console.log('🚀 Creating enhanced achievements...');

      const allAchievements = allAchievementsQuery.data || [];
      const userAchievements = userAchievementsQuery.data || [];
      const progressData = progressQuery.data || [];

      if (allAchievements.length === 0) {
        return [];
      }

      const enhanced = allAchievements.map((achievement) => {
        const userAchievement = userAchievements.find(
          (ua) => ua.achievement_id === achievement.achievement_id,
        );
        const achievementProgress = progressData.find(
          (ap) => ap.achievement_id === achievement.achievement_id,
        );

        return enhanceAchievement(
          achievement,
          userAchievement,
          achievementProgress,
        );
      });

      console.log('✨ Enhanced achievements created:', enhanced.length);
      return enhanced;
    },
    enabled: !!(
      allAchievementsQuery.data &&
      userAchievementsQuery.data &&
      progressQuery.data
    ),
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// 🚀 CATEGORY-BASED ACHIEVEMENTS HOOKS
export function useCourseAchievements() {
  return useQuery({
    queryKey: ['course-achievements'],
    queryFn: async (): Promise<Achievement[]> => {
      console.log('📚 Fetching course-based achievements...');
      try {
        const courseAchievements = await getCourseBasedAchievements();
        console.log(
          '📖 Course achievements fetched:',
          courseAchievements.length,
        );
        return courseAchievements;
      } catch (error) {
        console.error('❌ Error fetching course achievements:', error);
        return [];
      }
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
  });
}

export function useStreakAchievements() {
  return useQuery({
    queryKey: ['streak-achievements'],
    queryFn: async (): Promise<Achievement[]> => {
      console.log('🔥 Fetching streak achievements...');
      try {
        const streakAchievements = await getStudyStreakAchievements();
        console.log(
          '📈 Streak achievements fetched:',
          streakAchievements.length,
        );
        return streakAchievements;
      } catch (error) {
        console.error('❌ Error fetching streak achievements:', error);
        return [];
      }
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
  });
}

export function useDuelAchievements() {
  return useQuery({
    queryKey: ['duel-achievements'],
    queryFn: async (): Promise<Achievement[]> => {
      console.log('⚔️ Fetching duel achievements...');
      try {
        const duelAchievements = await getDuelAchievements();
        console.log('🥊 Duel achievements fetched:', duelAchievements.length);
        return duelAchievements;
      } catch (error) {
        console.error('❌ Error fetching duel achievements:', error);
        return [];
      }
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
  });
}

// 🚀 COURSE-SPECIFIC ACHIEVEMENT PROGRESS
export function useCourseAchievementProgress(courseId: string | number) {
  return useQuery({
    queryKey: ['course-achievement-progress', courseId],
    queryFn: async (): Promise<AchievementProgress[]> => {
      console.log(`📚 Fetching course achievement progress for ${courseId}...`);
      try {
        const progress = await getCourseAchievementProgress(courseId);
        console.log('📊 Course achievement progress fetched:', progress.length);
        return progress;
      } catch (error) {
        console.error('❌ Error fetching course achievement progress:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    enabled: !!(
      courseId &&
      (typeof courseId === 'string' ? courseId.length > 0 : courseId > 0)
    ),
  });
}

// 🚀 ACHIEVEMENT COMPLETION STATISTICS
export function useAchievementCompletionStats() {
  const enhancedAchievementsQuery = useEnhancedAchievements();

  return useQuery({
    queryKey: ['achievement-completion-stats'],
    queryFn: async (): Promise<AchievementCompletionStats> => {
      console.log('📈 Calculating achievement completion stats...');

      const achievements = enhancedAchievementsQuery.data || [];

      if (achievements.length === 0) {
        return {
          completed: 0,
          total: 0,
          percentage: 0,
          byCategory: {},
          byRarity: {},
        };
      }

      const completed = achievements.filter((a) => a.is_unlocked).length;
      const total = achievements.length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      // By category
      const byCategory: Record<
        string,
        { completed: number; total: number; percentage: number }
      > = {};
      const categories = [
        ...new Set(achievements.map((a) => a.category).filter(Boolean)),
      ];

      categories.forEach((category) => {
        const categoryAchievements = achievements.filter(
          (a) => a.category === category,
        );
        const categoryCompleted = categoryAchievements.filter(
          (a) => a.is_unlocked,
        ).length;
        const categoryTotal = categoryAchievements.length;
        const categoryPercentage =
          categoryTotal > 0
            ? Math.round((categoryCompleted / categoryTotal) * 100)
            : 0;

        byCategory[category!] = {
          completed: categoryCompleted,
          total: categoryTotal,
          percentage: categoryPercentage,
        };
      });

      // By rarity
      const byRarity: Record<
        string,
        { completed: number; total: number; percentage: number }
      > = {};
      const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

      rarities.forEach((rarity) => {
        const rarityAchievements = achievements.filter(
          (a) => a.rarity === rarity,
        );
        const rarityCompleted = rarityAchievements.filter(
          (a) => a.is_unlocked,
        ).length;
        const rarityTotal = rarityAchievements.length;
        const rarityPercentage =
          rarityTotal > 0
            ? Math.round((rarityCompleted / rarityTotal) * 100)
            : 0;

        byRarity[rarity] = {
          completed: rarityCompleted,
          total: rarityTotal,
          percentage: rarityPercentage,
        };
      });

      console.log('📊 Completion stats calculated:', {
        completed,
        total,
        percentage,
      });
      return { completed, total, percentage, byCategory, byRarity };
    },
    enabled: !!enhancedAchievementsQuery.data,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// 🚀 MAIN ACHIEVEMENTS DATA HOOK (Primary hook for achievement screens)
export function useAchievementsData() {
  const enhancedAchievementsQuery = useEnhancedAchievements();
  const userStatsQuery = useUserStats();
  const courseMetricsQuery = useCourseStudyMetrics();
  const leaderboardQuery = useAchievementLeaderboard();
  const completionStatsQuery = useAchievementCompletionStats();

  return {
    // Enhanced achievements with all data combined
    achievements: enhancedAchievementsQuery.data || [],
    achievementsLoading: enhancedAchievementsQuery.isLoading,
    achievementsError: enhancedAchievementsQuery.error,
    refetchAchievements: enhancedAchievementsQuery.refetch,

    // User statistics
    userStats: userStatsQuery.data,
    userStatsLoading: userStatsQuery.isLoading,
    userStatsError: userStatsQuery.error,

    // Course metrics
    courseMetrics: courseMetricsQuery.data,
    courseMetricsLoading: courseMetricsQuery.isLoading,
    courseMetricsError: courseMetricsQuery.error,

    // Leaderboard
    leaderboard: leaderboardQuery.data || [],
    leaderboardLoading: leaderboardQuery.isLoading,
    leaderboardError: leaderboardQuery.error,

    // Completion statistics
    completionStats: completionStatsQuery.data,
    completionStatsLoading: completionStatsQuery.isLoading,
    completionStatsError: completionStatsQuery.error,

    // Overall state
    isLoading: enhancedAchievementsQuery.isLoading || userStatsQuery.isLoading,
    hasError: !!(enhancedAchievementsQuery.error || userStatsQuery.error),

    // Refetch all data
    refetchAll: async () => {
      await Promise.all([
        enhancedAchievementsQuery.refetch(),
        userStatsQuery.refetch(),
        courseMetricsQuery.refetch(),
        leaderboardQuery.refetch(),
        completionStatsQuery.refetch(),
      ]);
    },
  };
}

// 🚀 FILTERED ACHIEVEMENTS HOOK
export function useFilteredAchievements(filters: AchievementFilters) {
  const { achievements } = useAchievementsData();

  return useMemo(() => {
    let filtered = [...achievements];

    // Filter by category
    if (filters.category !== 'all') {
      filtered = filtered.filter(
        (achievement) => achievement.category === filters.category,
      );
    }

    // Filter by status
    if (filters.status === 'unlocked') {
      filtered = filtered.filter((achievement) => achievement.is_unlocked);
    } else if (filters.status === 'locked') {
      filtered = filtered.filter((achievement) => !achievement.is_unlocked);
    } else if (filters.status === 'in_progress') {
      filtered = filtered.filter(
        (achievement) =>
          !achievement.is_unlocked && achievement.overall_progress > 0,
      );
    }

    // Filter by rarity
    if (filters.rarity !== 'all') {
      filtered = filtered.filter(
        (achievement) => achievement.rarity === filters.rarity,
      );
    }

    // Filter by difficulty
    if (filters.difficulty !== 'all') {
      const difficultyMap = {
        easy: 'Kolay',
        medium: 'Orta',
        hard: 'Zor',
      };
      const targetDifficulty =
        difficultyMap[filters.difficulty as keyof typeof difficultyMap];
      if (targetDifficulty) {
        filtered = filtered.filter(
          (achievement) =>
            achievement.difficulty_level === targetDifficulty ||
            (achievement.difficulty_level === 'Çok Zor' &&
              filters.difficulty === 'hard'),
        );
      }
    }

    return filtered;
  }, [achievements, filters]);
}

// 🚀 ACHIEVEMENT ACTIONS HOOK - COMPATIBLE WITH YOUR TYPES
export function useAchievementActions() {
  return {
    // Check for new achievements
    checkAchievements: async (): Promise<CheckAchievementsPayload | null> => {
      try {
        console.log('🔍 Checking for new achievements...');
        const result = await checkUserAchievements();
        if (result.newAchievements > 0) {
          console.log(
            `🎉 ${result.newAchievements} new achievements unlocked!`,
          );
        }
        return result;
      } catch (error) {
        console.error('❌ Error checking achievements:', error);
        return null;
      }
    },

    // Trigger achievement check after specific action
    triggerCheck: async (
      actionType: AchievementActionType,
    ): Promise<CheckAchievementsPayload | null> => {
      try {
        console.log(`🎯 Triggering achievement check for: ${actionType}`);
        const result = await triggerAchievementCheck(actionType);
        if (result.newAchievements > 0) {
          console.log(
            `🎉 ${result.newAchievements} new achievements from ${actionType}!`,
          );
        }
        return result;
      } catch (error) {
        console.error(
          `❌ Error triggering achievement check for ${actionType}:`,
          error,
        );
        return null;
      }
    },

    // Handle course study session completion
    handleCourseSession: async (
      sessionData: CourseStudySessionData,
    ): Promise<CheckAchievementsPayload | null> => {
      return await handleCourseStudySessionCompleted(sessionData);
    },

    // Handle course completion
    handleCourseCompletion: async (
      courseData: CourseCompletionData,
    ): Promise<CheckAchievementsPayload | null> => {
      return await handleCourseCompleted(courseData);
    },

    // Handle duel completion
    handleDuelCompletion: async (
      duelData?: any,
    ): Promise<CheckAchievementsPayload | null> => {
      return await handleDuelCompleted(duelData);
    },
  };
}

// 🚀 ACHIEVEMENT CATEGORIES HOOK
export function useAchievementCategories() {
  const { achievements } = useAchievementsData();

  return useMemo(() => {
    const categories = achievements
      .map((achievement) => achievement.category)
      .filter((category): category is string => Boolean(category))
      .filter((category, index, self) => self.indexOf(category) === index)
      .sort();

    return ['all', ...categories];
  }, [achievements]);
}

// 🚀 HELPER FUNCTIONS WITH TYPE SAFETY

// Safe progress calculation with null checks
export const safeProgress = (value: number | undefined | null): number => {
  if (value === undefined || value === null || isNaN(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, value));
};

// Determine achievement rarity based on points
export const determineRarity = (
  points?: number,
): 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' => {
  if (!points) return 'common';
  if (points < 25) return 'common';
  if (points < 50) return 'uncommon';
  if (points < 100) return 'rare';
  if (points < 200) return 'epic';
  return 'legendary';
};

// Determine difficulty level with safe null checks
export const determineDifficultyLevel = (
  requirements: any,
): 'Kolay' | 'Orta' | 'Zor' | 'Çok Zor' => {
  if (!requirements || typeof requirements !== 'object') return 'Kolay';

  const requirementCount = Object.keys(requirements).length;
  const hasHighValues = Object.values(requirements).some(
    (req: any) =>
      req && typeof req === 'object' && req.minimum && req.minimum > 100,
  );
  const hasVeryHighValues = Object.values(requirements).some(
    (req: any) =>
      req && typeof req === 'object' && req.minimum && req.minimum > 500,
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

// ✅ ENHANCE ACHIEVEMENT WITH SAFE NULL HANDLING
export const enhanceAchievement = (
  baseAchievement: Achievement,
  userAchievement?: UserAchievement,
  progressData?: AchievementProgress,
): EnhancedAchievement => {
  const rawProgress =
    progressData?.overall_progress || (userAchievement ? 100 : 0);
  const overall_progress = safeProgress(rawProgress);
  const rarity = determineRarity(baseAchievement.points);

  return {
    ...baseAchievement,
    date_earned: userAchievement?.date_earned,
    progress: userAchievement?.progress,
    progress_data: progressData,
    rarity,
    is_unlocked: !!userAchievement,
    overall_progress,
    next_milestone: progressData ? getNextMilestone(progressData) : null,
    completion_status: getTurkishCompletionStatus(
      !!userAchievement,
      overall_progress,
    ),
    turkish_category: getTurkishCategoryName(
      baseAchievement.category || 'general',
    ),
    turkish_rarity: getTurkishRarityName(rarity),
    difficulty_level: determineDifficultyLevel(baseAchievement.requirements),
  };
};

// Get rarity color with fallback
export const getRarityColor = (
  rarity: string,
  fallbackColor: string = '#6b7280',
) => {
  const colors = {
    common: '#6b7280',
    uncommon: '#10b981',
    rare: '#3b82f6',
    epic: '#8b5cf6',
    legendary: '#f59e0b',
  };
  return colors[rarity as keyof typeof colors] || fallbackColor;
};

// Get rarity badge variant with type safety
export const getRarityBadgeVariant = (
  rarity: string,
): 'secondary' | 'success' | 'info' | 'warning' | 'error' => {
  const variants = {
    common: 'secondary' as const,
    uncommon: 'success' as const,
    rare: 'info' as const,
    epic: 'warning' as const,
    legendary: 'error' as const,
  };
  return variants[rarity as keyof typeof variants] || 'secondary';
};

// ✅ EXPORT UTILITY FUNCTIONS FOR EASY IMPORT
export const achievementHelpers = {
  safeProgress,
  determineRarity,
  determineDifficultyLevel,
  enhanceAchievement,
  getRarityColor,
  getRarityBadgeVariant,
  formatProgressPercentage,
  isAchievementCompleted,
  getNextMilestone,
  getTurkishRequirementName,
  getTurkishRequirementDetail,
  getTurkishCompletionStatus,
  getTurkishCategoryName,
  getTurkishRarityName,
};

// ✅ COMBINED EXPORT FOR COMPREHENSIVE ACHIEVEMENT MANAGEMENT
export const achievementDataHooks = {
  useUserAchievements,
  useAchievementProgress,
  useAllAchievements,
  useUserStats,
  useCourseStudyMetrics,
  useAchievementLeaderboard,
  useAchievementDetails,
  useEnhancedAchievements,
  useCourseAchievements,
  useStreakAchievements,
  useDuelAchievements,
  useCourseAchievementProgress,
  useAchievementCompletionStats,
  useAchievementsData,
  useFilteredAchievements,
  useAchievementActions,
  useAchievementCategories,
};
