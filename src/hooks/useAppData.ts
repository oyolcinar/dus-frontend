// src/hooks/useAppData.ts - FIXED VERSION WITH AUTH GUARDS
import { useQuery, useQueries } from '@tanstack/react-query';
import {
  getAllCourses,
  getUserStudySessions,
  getUserStudyStatistics,
  getUserCourseProgress,
  getCourseComprehensiveStudyData,
  type CourseProgress,
  type CourseStudySession,
} from '../api/studyService';

import {
  getUserDashboardAnalytics,
  getUserAnalyticsSummary,
  getAllUserAnalytics,
  getUserPerformanceAnalytics,
} from '../api/analyticsService';
import {
  useUtilityFunctions,
  useDataMapping,
  useCourseProcessing,
} from './useOptimizedDataProcessing';
import type { Course, CourseWithProgress, User } from '../types/models';

// 🚀 UPDATED: Import auth hook
import { useAuth } from '../../stores/appStore';

// Get course category for dental specialties
function getCourseCategory(title: string): string {
  const titleLower = title.toLowerCase();

  // Dental specialty categories
  if (titleLower.includes('anatomi')) return 'anatomi';
  if (titleLower.includes('patoloji')) return 'patoloji';
  if (titleLower.includes('cerrahi')) return 'cerrahi';
  if (titleLower.includes('protez') || titleLower.includes('protetik'))
    return 'protetik';
  if (titleLower.includes('periodon')) return 'periodontoloji';
  if (titleLower.includes('pedodonti')) return 'pedodonti';
  if (titleLower.includes('endodonti')) return 'endodonti';
  if (titleLower.includes('ortodonti')) return 'ortodonti';
  if (titleLower.includes('radyoloji')) return 'radyoloji';
  if (titleLower.includes('restoratif')) return 'restoratif';

  return 'dental';
}

// 🚀 UPDATED: User data hook with auth guard
export function useUserData() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: ['user-profile'],
    queryFn: async (): Promise<User | null> => {
      try {
        // Import userService dynamically to avoid circular dependencies
        const { getUserProfile } = await import('../api/userService');
        const userProfile = await getUserProfile();
        return userProfile;
      } catch (error) {
        console.warn('Failed to load user profile:', error);
        return null;
      }
    },
    // 🚀 NEW: Only run if authenticated
    enabled: isAuthenticated && !authLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes - user profile can change
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
}

// 🚀 UPDATED: Course data hook with auth guard
export function useCourseData() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { processCourseData } = useCourseProcessing();

  return useQuery({
    queryKey: ['courses-with-data'],
    queryFn: async (): Promise<CourseWithProgress[]> => {
      console.log('🔄 Starting optimized course fetch...');

      try {
        // Get all courses first
        const allCourses = await getAllCourses('klinik_dersler');
        console.log('📚 Fetched courses:', allCourses?.length || 0);

        if (!allCourses?.length) {
          return [];
        }

        console.log('🏥 Processing klinik courses:', allCourses.length);

        // Use the optimized course processing
        const coursesWithData = await processCourseData(
          allCourses,
          getCourseCategory,
          { getCourseProgress: getUserCourseProgress }, // courseService mock
          { getUserStudySessions }, // studyService
        );

        console.log('✅ Final processed courses:', coursesWithData.length);
        return coursesWithData;
      } catch (error) {
        console.error('❌ Error in course data fetch:', error);
        throw error;
      }
    },
    // 🚀 NEW: Only run if authenticated
    enabled: isAuthenticated && !authLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}

// 🚀 UPDATED: Analytics data hook with auth guard
export function useAnalyticsData() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: ['analytics-data'],
    queryFn: async () => {
      console.log('📊 Fetching analytics data...');

      const [dashboardResult, summaryResult, studyStatsResult] =
        await Promise.allSettled([
          getUserDashboardAnalytics(),
          getUserAnalyticsSummary(),
          getUserStudyStatistics(),
        ]);

      return {
        dashboardAnalytics:
          dashboardResult.status === 'fulfilled' ? dashboardResult.value : null,
        analyticsSummary:
          summaryResult.status === 'fulfilled' ? summaryResult.value : null,
        studyStatistics:
          studyStatsResult.status === 'fulfilled'
            ? studyStatsResult.value
            : null,
      };
    },
    // 🚀 NEW: Only run if authenticated
    enabled: isAuthenticated && !authLoading,
    staleTime: 10 * 60 * 1000, // 10 minutes - analytics don't change often
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 1, // Analytics is not critical, don't retry much
  });
}

// 🚀 UPDATED: Performance data hook with auth guard
export function usePerformanceData() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: ['performance-data'],
    queryFn: async () => {
      console.log('🏃 Fetching performance data...');

      const [performanceResult, comprehensiveResult] = await Promise.allSettled(
        [
          getUserPerformanceAnalytics(),
          getAllUserAnalytics(30, 12), // 30 days, 12 weeks
        ],
      );

      return {
        performanceAnalytics:
          performanceResult.status === 'fulfilled'
            ? performanceResult.value
            : null,
        comprehensiveAnalytics:
          comprehensiveResult.status === 'fulfilled'
            ? comprehensiveResult.value
            : null,
      };
    },
    // 🚀 NEW: Only run if authenticated
    enabled: isAuthenticated && !authLoading,
    staleTime: 2 * 60 * 1000, // 2 minutes - performance data changes more frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: true,
  });
}

// 🚀 UPDATED: Recent sessions hook with auth guard
export function useRecentSessions() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: ['recent-sessions'],
    queryFn: async () => {
      console.log('📝 Fetching recent study sessions...');

      try {
        const sessionsResponse = await getUserStudySessions(1, 10);
        return sessionsResponse.sessions || [];
      } catch (error) {
        console.warn('Failed to fetch recent sessions:', error);
        return [];
      }
    },
    // 🚀 NEW: Only run if authenticated
    enabled: isAuthenticated && !authLoading,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

// 🚀 UPDATED: Combined app data hook with auth guards
export function useAppData() {
  const { isAuthenticated } = useAuth();

  // 🚀 NEW: Use conditional queries
  const courseQuery = useCourseData();
  const analyticsQuery = useAnalyticsData();
  const performanceQuery = usePerformanceData();
  const recentSessionsQuery = useRecentSessions();
  const userDataQuery = useUserData();

  return {
    // Course data
    courses: courseQuery.data || [],
    coursesLoading: courseQuery.isLoading,
    coursesError: courseQuery.error,
    refetchCourses: courseQuery.refetch,

    // Analytics data
    dashboardAnalytics: analyticsQuery.data?.dashboardAnalytics,
    analyticsSummary: analyticsQuery.data?.analyticsSummary,
    studyStatistics: analyticsQuery.data?.studyStatistics,
    analyticsLoading: analyticsQuery.isLoading,
    analyticsError: analyticsQuery.error,

    // Performance data
    performanceAnalytics: performanceQuery.data?.performanceAnalytics,
    comprehensiveAnalytics: performanceQuery.data?.comprehensiveAnalytics,
    performanceLoading: performanceQuery.isLoading,
    performanceError: performanceQuery.error,

    // Recent sessions
    recentSessions: recentSessionsQuery.data || [],
    recentSessionsLoading: recentSessionsQuery.isLoading,
    recentSessionsError: recentSessionsQuery.error,

    // User data from API
    userData: userDataQuery.data,
    userDataLoading: userDataQuery.isLoading,
    userDataError: userDataQuery.error,

    // Overall state
    isLoading: isAuthenticated
      ? courseQuery.isLoading || analyticsQuery.isLoading
      : false,
    hasError: !!(
      courseQuery.error ||
      analyticsQuery.error ||
      performanceQuery.error
    ),

    // 🚀 NEW: Authentication status
    isAuthenticated,
    canFetchData: isAuthenticated,

    // Refetch all data
    refetchAll: async () => {
      if (!isAuthenticated) {
        console.warn('Cannot refetch data - user not authenticated');
        return;
      }

      await Promise.all([
        courseQuery.refetch(),
        analyticsQuery.refetch(),
        performanceQuery.refetch(),
        recentSessionsQuery.refetch(),
        userDataQuery.refetch(),
      ]);
    },
  };
}

// 🚀 UPDATED: Individual course data hook with auth guard
export function useCourseDetails(courseId: number) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: ['course-details', courseId],
    queryFn: async () => {
      console.log(`🔍 Fetching detailed data for course ${courseId}...`);

      try {
        const comprehensiveData =
          await getCourseComprehensiveStudyData(courseId);
        return comprehensiveData;
      } catch (error) {
        console.warn(`Failed to fetch course ${courseId} details:`, error);
        throw error;
      }
    },
    // 🚀 NEW: Only run if authenticated and courseId exists
    enabled: isAuthenticated && !authLoading && !!courseId,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
}

// 🚀 UPDATED: Course sessions hook with auth guard
export function useCourseSessionsData(courseId: number, limit: number = 20) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: ['course-sessions', courseId, limit],
    queryFn: async () => {
      console.log(`📚 Fetching sessions for course ${courseId}...`);

      try {
        const sessionsResponse = await getUserStudySessions(1, limit, courseId);
        return sessionsResponse;
      } catch (error) {
        console.warn(`Failed to fetch sessions for course ${courseId}:`, error);
        return {
          sessions: [],
          pagination: { page: 1, limit, total: 0 },
        };
      }
    },
    // 🚀 NEW: Only run if authenticated and courseId exists
    enabled: isAuthenticated && !authLoading && !!courseId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

// 🚀 UPDATED: Comprehensive analytics hook with auth guard
export function useComprehensiveAnalytics(
  daysBack: number = 30,
  weeksBack: number = 12,
) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: ['comprehensive-analytics', daysBack, weeksBack],
    queryFn: async () => {
      console.log(
        `📈 Fetching comprehensive analytics (${daysBack} days, ${weeksBack} weeks)...`,
      );

      try {
        const analyticsData = await getAllUserAnalytics(daysBack, weeksBack);
        return analyticsData;
      } catch (error) {
        console.warn('Failed to fetch comprehensive analytics:', error);
        throw error;
      }
    },
    // 🚀 NEW: Only run if authenticated
    enabled: isAuthenticated && !authLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
}

// 🚀 UPDATED: User achievements hook with auth guard
export function useUserAchievements() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: ['user-achievements'],
    queryFn: async () => {
      try {
        const achievementService = await import('../api/achievementService');
        const [userAchievements, achievementProgress] =
          await Promise.allSettled([
            achievementService.getUserAchievements(),
            achievementService.getUserAchievementProgress(),
          ]);

        return {
          achievements:
            userAchievements.status === 'fulfilled'
              ? userAchievements.value
              : [],
          progress:
            achievementProgress.status === 'fulfilled'
              ? achievementProgress.value
              : [],
        };
      } catch (error) {
        console.warn('Failed to fetch user achievements:', error);
        return {
          achievements: [],
          progress: [],
        };
      }
    },
    // 🚀 NEW: Only run if authenticated
    enabled: isAuthenticated && !authLoading,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 1,
  });
}

// 🚀 UPDATED: User notifications hook with auth guard
export function useUserNotifications(limit: number = 10) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: ['user-notifications', limit],
    queryFn: async () => {
      try {
        const notificationService = await import('../api/notificationService');
        const notificationsResponse =
          await notificationService.getNotifications(1, limit);
        return notificationsResponse;
      } catch (error) {
        console.warn('Failed to fetch user notifications:', error);
        return {
          notifications: [],
          unread_count: 0,
          total_count: 0,
        };
      }
    },
    // 🚀 NEW: Only run if authenticated
    enabled: isAuthenticated && !authLoading,
    staleTime: 1 * 60 * 1000, // 1 minute - notifications should be fresh
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: true, // Refetch when app comes to foreground
  });
}

// 🚀 UPDATED: Combined user data hook with auth guard
export function useCompleteUserData() {
  const { isAuthenticated } = useAuth();

  const profileQuery = useUserData();
  const achievementsQuery = useUserAchievements();
  const notificationsQuery = useUserNotifications();

  return {
    // User profile
    userData: profileQuery.data,
    userDataLoading: profileQuery.isLoading,
    userDataError: profileQuery.error,

    // Achievements
    achievements: achievementsQuery.data?.achievements || [],
    achievementProgress: achievementsQuery.data?.progress || [],
    achievementsLoading: achievementsQuery.isLoading,

    // Notifications
    notifications: notificationsQuery.data?.notifications || [],
    unreadCount: notificationsQuery.data?.unread_count || 0,
    notificationsLoading: notificationsQuery.isLoading,

    // Overall loading state
    isLoadingUserData: isAuthenticated
      ? profileQuery.isLoading || achievementsQuery.isLoading
      : false,

    // Authentication status
    isAuthenticated,

    // Refetch all user data
    refetchUserData: async () => {
      if (!isAuthenticated) {
        console.warn('Cannot refetch user data - user not authenticated');
        return;
      }

      await Promise.all([
        profileQuery.refetch(),
        achievementsQuery.refetch(),
        notificationsQuery.refetch(),
      ]);
    },
  };
}
