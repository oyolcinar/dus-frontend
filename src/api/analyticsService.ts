import apiRequest from './apiClient';
import {
  LongestStreak,
  StreaksSummary,
  StreaksAnalytics,
  DailyProgress,
  WeeklyProgress,
  TopCourse,
  MostStudiedCourse,
  ComparativeMetric,
  RecentActivity,
  DashboardAnalytics,
  AnalyticsSummary,
  ComprehensiveAnalytics,
} from '../types/models';

// ===============================
// PAYLOAD TYPES FOR API RESPONSES
// ===============================

// Streak Analytics Response Types
interface LongestStreaksResponse {
  streaks: LongestStreak[];
}

interface StreaksAnalyticsResponse {
  streaksAnalytics: StreaksAnalytics[];
}

// Progress Analytics Response Types
interface DailyProgressResponse {
  dailyProgress: DailyProgress[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

interface WeeklyProgressResponse {
  weeklyProgress: WeeklyProgress[];
}

interface DailyProgressAnalyticsResponse {
  dailyProgressAnalytics: DailyProgress[];
}

interface WeeklyProgressAnalyticsResponse {
  weeklyProgressAnalytics: WeeklyProgress[];
}

// Course Analytics Response Types
interface TopCoursesResponse {
  topCourses: TopCourse[];
}

interface MostStudiedCourseResponse {
  mostStudiedCourse: MostStudiedCourse | null;
}

interface CourseAnalyticsResponse {
  courseAnalytics: MostStudiedCourse[];
}

// Comparative Analytics Response Types
interface ComparativeAnalyticsResponse {
  comparison: ComparativeMetric[];
}

// Legacy Analytics Response Types (for backward compatibility)
interface UserPerformanceAnalyticsPayload {
  branchPerformance: {
    branchId: number;
    branchName: string;
    averageScore: number;
    totalQuestions: number;
    correctAnswers: number;
    testAccuracy?: number;
    testsTaken?: number;
    avgTestScore?: number;
  }[];
  totalQuestionsAnswered: number;
  overallAccuracy: number;
  studyTime: number;
  studySessions: number;
  averageSessionDuration: number;
}

// ===============================
// ENHANCED ERROR HANDLING UTILITIES
// ===============================

const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  fallbackValue: T,
  operationName: string,
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    console.error(`Error in ${operationName}:`, error);

    // Check if it's a network error
    if (error instanceof Error && error.message.includes('Network Error')) {
      console.warn(`Network error in ${operationName}, using fallback`);
    }

    // Check if it's a 500 error (backend issue)
    if (
      error &&
      typeof error === 'object' &&
      'status' in error &&
      error.status === 500
    ) {
      console.warn(`Server error in ${operationName}, using fallback`);
    }

    return fallbackValue;
  }
};

const isValidResponse = <T>(response: any): response is { data: T } => {
  return response && response.data !== undefined && response.data !== null;
};

// ===============================
// NEW: ENHANCED ANALYTICS FUNCTIONS
// ===============================

/**
 * Get user's longest study streaks by topic and course
 */
export const getUserLongestStreaks = async (): Promise<LongestStreak[]> => {
  return withErrorHandling(
    async () => {
      const response = await apiRequest<LongestStreaksResponse>(
        '/analytics/streaks/longest',
      );

      if (
        !isValidResponse<LongestStreaksResponse>(response) ||
        !response.data.streaks
      ) {
        console.warn('Invalid longest streaks response structure');
        return [];
      }

      return response.data.streaks;
    },
    [],
    'getUserLongestStreaks',
  );
};

/**
 * Get user's streaks summary with key metrics
 */
export const getUserStreaksSummary = async (): Promise<StreaksSummary> => {
  const defaultSummary: StreaksSummary = {
    longest_single_session_minutes: 0,
    longest_topic_streak_minutes: 0,
    longest_course_streak_minutes: 0,
  };

  return withErrorHandling(
    async () => {
      const response = await apiRequest<StreaksSummary>(
        '/analytics/streaks/summary',
      );

      if (!isValidResponse<StreaksSummary>(response)) {
        console.warn('Invalid streaks summary response structure');
        return defaultSummary;
      }

      return { ...defaultSummary, ...response.data };
    },
    defaultSummary,
    'getUserStreaksSummary',
  );
};

/**
 * Get detailed streaks analytics from view
 */
export const getLongestStreaksAnalytics = async (): Promise<
  StreaksAnalytics[]
> => {
  return withErrorHandling(
    async () => {
      const response = await apiRequest<StreaksAnalyticsResponse>(
        '/analytics/streaks/analytics',
      );

      if (!isValidResponse<StreaksAnalyticsResponse>(response)) {
        return [];
      }

      return response.data?.streaksAnalytics || [];
    },
    [],
    'getLongestStreaksAnalytics',
  );
};

/**
 * Get user's daily progress data for charts
 */
export const getUserDailyProgress = async (
  startDate?: string,
  endDate?: string,
  days: number = 30,
): Promise<{
  dailyProgress: DailyProgress[];
  dateRange: { startDate: string; endDate: string };
}> => {
  const defaultResponse = {
    dailyProgress: [],
    dateRange: {
      startDate:
        startDate ||
        new Date(Date.now() - days * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
      endDate: endDate || new Date().toISOString().split('T')[0],
    },
  };

  return withErrorHandling(
    async () => {
      const params = new URLSearchParams();

      if (startDate && endDate) {
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      } else {
        params.append('days', days.toString());
      }

      const response = await apiRequest<DailyProgressResponse>(
        `/analytics/progress/daily?${params.toString()}`,
      );

      if (!isValidResponse<DailyProgressResponse>(response)) {
        return defaultResponse;
      }

      return response.data;
    },
    defaultResponse,
    'getUserDailyProgress',
  );
};

/**
 * Get user's weekly progress data for charts
 */
export const getUserWeeklyProgress = async (
  weeksBack: number = 12,
): Promise<WeeklyProgress[]> => {
  return withErrorHandling(
    async () => {
      const response = await apiRequest<WeeklyProgressResponse>(
        `/analytics/progress/weekly?weeksBack=${weeksBack}`,
      );

      if (!isValidResponse<WeeklyProgressResponse>(response)) {
        return [];
      }

      return response.data?.weeklyProgress || [];
    },
    [],
    'getUserWeeklyProgress',
  );
};

/**
 * Get daily progress analytics from view
 */
export const getDailyProgressAnalytics = async (
  days: number = 30,
): Promise<DailyProgress[]> => {
  return withErrorHandling(
    async () => {
      const response = await apiRequest<DailyProgressAnalyticsResponse>(
        `/analytics/progress/daily-analytics?days=${days}`,
      );

      if (!isValidResponse<DailyProgressAnalyticsResponse>(response)) {
        return [];
      }

      return response.data?.dailyProgressAnalytics || [];
    },
    [],
    'getDailyProgressAnalytics',
  );
};

/**
 * Get weekly progress analytics from view
 */
export const getWeeklyProgressAnalytics = async (
  weeks: number = 12,
): Promise<WeeklyProgress[]> => {
  return withErrorHandling(
    async () => {
      const response = await apiRequest<WeeklyProgressAnalyticsResponse>(
        `/analytics/progress/weekly-analytics?weeks=${weeks}`,
      );

      if (!isValidResponse<WeeklyProgressAnalyticsResponse>(response)) {
        return [];
      }

      return response.data?.weeklyProgressAnalytics || [];
    },
    [],
    'getWeeklyProgressAnalytics',
  );
};

/**
 * Get user's top courses by time spent (study sessions + duels)
 */
export const getUserTopCourses = async (
  limit: number = 10,
): Promise<TopCourse[]> => {
  return withErrorHandling(
    async () => {
      const response = await apiRequest<TopCoursesResponse>(
        `/analytics/courses/top?limit=${limit}`,
      );

      if (!isValidResponse<TopCoursesResponse>(response)) {
        return [];
      }

      return response.data?.topCourses || [];
    },
    [],
    'getUserTopCourses',
  );
};

/**
 * Get most time spent course details
 */
export const getMostTimeSpentCourse =
  async (): Promise<MostStudiedCourse | null> => {
    return withErrorHandling(
      async () => {
        const response = await apiRequest<MostStudiedCourseResponse>(
          '/analytics/courses/most-studied',
        );

        if (!isValidResponse<MostStudiedCourseResponse>(response)) {
          return null;
        }

        return response.data?.mostStudiedCourse || null;
      },
      null,
      'getMostTimeSpentCourse',
    );
  };

/**
 * Get most time spent course analytics from view
 */
export const getMostTimeSpentCourseAnalytics = async (): Promise<
  MostStudiedCourse[]
> => {
  return withErrorHandling(
    async () => {
      const response = await apiRequest<CourseAnalyticsResponse>(
        '/analytics/courses/analytics',
      );

      if (!isValidResponse<CourseAnalyticsResponse>(response)) {
        return [];
      }

      return response.data?.courseAnalytics || [];
    },
    [],
    'getMostTimeSpentCourseAnalytics',
  );
};

/**
 * Get user performance compared to platform average
 */
export const getUserComparativeAnalytics = async (): Promise<
  ComparativeMetric[]
> => {
  return withErrorHandling(
    async () => {
      const response = await apiRequest<ComparativeAnalyticsResponse>(
        '/analytics/comparative',
      );

      if (!isValidResponse<ComparativeAnalyticsResponse>(response)) {
        return [];
      }

      return response.data?.comparison || [];
    },
    [],
    'getUserComparativeAnalytics',
  );
};

/**
 * Get user's recent activity summary
 */
export const getUserRecentActivity = async (
  daysBack: number = 7,
): Promise<RecentActivity[]> => {
  return withErrorHandling(
    async () => {
      const response = await apiRequest<RecentActivity[]>(
        `/analytics/recent-activity?daysBack=${daysBack}`,
      );

      if (!isValidResponse<RecentActivity[]>(response)) {
        return [];
      }

      return response.data || [];
    },
    [],
    'getUserRecentActivity',
  );
};

/**
 * Get comprehensive dashboard analytics
 */
export const getUserDashboardAnalytics =
  async (): Promise<DashboardAnalytics> => {
    const defaultDashboard: DashboardAnalytics = {
      total_study_hours: 0,
      total_sessions: 0,
      unique_topics_studied: 0,
      unique_courses_studied: 0,
      longest_session_minutes: 0,
      average_session_minutes: 0,
      current_streak_days: 0,
      longest_streak_days: 0,
      last_7_days_hours: 0,
      last_30_days_hours: 0,
    };

    return withErrorHandling(
      async () => {
        const response = await apiRequest<DashboardAnalytics>(
          '/analytics/dashboard',
        );

        if (!isValidResponse<DashboardAnalytics>(response)) {
          return defaultDashboard;
        }

        return { ...defaultDashboard, ...response.data };
      },
      defaultDashboard,
      'getUserDashboardAnalytics',
    );
  };

/**
 * Get analytics summary with key metrics
 */
export const getUserAnalyticsSummary = async (): Promise<AnalyticsSummary> => {
  const defaultSummary: AnalyticsSummary = {
    user_id: 0,
    total_study_time_hours: 0,
    total_sessions: 0,
    average_session_duration: 0,
    unique_topics_count: 0,
    unique_courses_count: 0,
    longest_streak_minutes: 0,
    current_streak_days: 0,
    total_questions_answered: 0,
    overall_accuracy: 0,
  };

  return withErrorHandling(
    async () => {
      const response = await apiRequest<AnalyticsSummary>('/analytics/summary');

      if (!isValidResponse<AnalyticsSummary>(response)) {
        return defaultSummary;
      }

      return { ...defaultSummary, ...response.data };
    },
    defaultSummary,
    'getUserAnalyticsSummary',
  );
};

/**
 * Get comprehensive analytics data in one call
 */
export const getAllUserAnalytics = async (
  daysBack: number = 30,
  weeksBack: number = 12,
): Promise<ComprehensiveAnalytics> => {
  const defaultAnalytics: ComprehensiveAnalytics = {
    dashboard: null,
    summary: null,
    longestStreaks: [],
    dailyProgress: [],
    weeklyProgress: [],
    topCourses: [],
    comparative: [],
    recentActivity: [],
  };

  return withErrorHandling(
    async () => {
      const response = await apiRequest<ComprehensiveAnalytics>(
        `/analytics/all?daysBack=${daysBack}&weeksBack=${weeksBack}`,
      );

      if (!isValidResponse<ComprehensiveAnalytics>(response)) {
        return defaultAnalytics;
      }

      return {
        ...defaultAnalytics,
        ...response.data,
        longestStreaks: response.data.longestStreaks || [],
        dailyProgress: response.data.dailyProgress || [],
        weeklyProgress: response.data.weeklyProgress || [],
        topCourses: response.data.topCourses || [],
        comparative: response.data.comparative || [],
        recentActivity: response.data.recentActivity || [],
      };
    },
    defaultAnalytics,
    'getAllUserAnalytics',
  );
};

// ===============================
// LEGACY ANALYTICS FUNCTIONS (Enhanced with error handling)
// ===============================

export const getUserPerformanceAnalytics =
  async (): Promise<UserPerformanceAnalyticsPayload> => {
    const defaultResponse: UserPerformanceAnalyticsPayload = {
      branchPerformance: [],
      totalQuestionsAnswered: 0,
      overallAccuracy: 0,
      studyTime: 0,
      studySessions: 0,
      averageSessionDuration: 0,
    };

    return withErrorHandling(
      async () => {
        const response = await apiRequest<UserPerformanceAnalyticsPayload>(
          '/analytics/user-performance',
        );

        if (!isValidResponse<UserPerformanceAnalyticsPayload>(response)) {
          return defaultResponse;
        }

        return {
          branchPerformance: response.data.branchPerformance || [],
          totalQuestionsAnswered: response.data.totalQuestionsAnswered || 0,
          overallAccuracy: response.data.overallAccuracy || 0,
          studyTime: response.data.studyTime || 0,
          studySessions: response.data.studySessions || 0,
          averageSessionDuration: response.data.averageSessionDuration || 0,
        };
      },
      defaultResponse,
      'getUserPerformanceAnalytics',
    );
  };

// ===============================
// UTILITY FUNCTIONS FOR ENHANCED ANALYTICS
// ===============================

/**
 * Get comprehensive analytics for a specific time period
 */
export const getAnalyticsForPeriod = async (
  startDate: string,
  endDate: string,
) => {
  return withErrorHandling(
    async () => {
      // Calculate days and weeks between dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      const daysDiff = Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
      );
      const weeksDiff = Math.ceil(daysDiff / 7);

      const [dailyProgress, weeklyProgress, recentActivity] =
        await Promise.allSettled([
          getUserDailyProgress(startDate, endDate),
          getUserWeeklyProgress(weeksDiff),
          getUserRecentActivity(daysDiff),
        ]);

      return {
        period: { startDate, endDate, days: daysDiff, weeks: weeksDiff },
        dailyProgress:
          dailyProgress.status === 'fulfilled'
            ? dailyProgress.value.dailyProgress
            : [],
        weeklyProgress:
          weeklyProgress.status === 'fulfilled' ? weeklyProgress.value : [],
        recentActivity:
          recentActivity.status === 'fulfilled' ? recentActivity.value : [],
      };
    },
    {
      period: { startDate, endDate, days: 0, weeks: 0 },
      dailyProgress: [],
      weeklyProgress: [],
      recentActivity: [],
    },
    'getAnalyticsForPeriod',
  );
};

/**
 * Calculate improvement trends from progress data
 */
export const calculateImprovementTrends = (
  dailyProgress: DailyProgress[],
): {
  studyTimeImprovement: number;
  sessionCountImprovement: number;
  accuracyImprovement: number;
  consistencyImprovement: number;
} => {
  if (dailyProgress.length < 2) {
    return {
      studyTimeImprovement: 0,
      sessionCountImprovement: 0,
      accuracyImprovement: 0,
      consistencyImprovement: 0,
    };
  }

  const sortedData = [...dailyProgress].sort(
    (a, b) =>
      new Date(a.study_date).getTime() - new Date(b.study_date).getTime(),
  );

  const midPoint = Math.floor(sortedData.length / 2);
  const firstHalf = sortedData.slice(0, midPoint);
  const secondHalf = sortedData.slice(midPoint);

  const avgFirst = {
    studyTime:
      firstHalf.reduce((sum, day) => sum + day.daily_study_minutes, 0) /
      firstHalf.length,
    sessions:
      firstHalf.reduce((sum, day) => sum + day.daily_sessions, 0) /
      firstHalf.length,
    accuracy:
      firstHalf.reduce((sum, day) => sum + day.daily_accuracy_percentage, 0) /
      firstHalf.length,
  };

  const avgSecond = {
    studyTime:
      secondHalf.reduce((sum, day) => sum + day.daily_study_minutes, 0) /
      secondHalf.length,
    sessions:
      secondHalf.reduce((sum, day) => sum + day.daily_sessions, 0) /
      secondHalf.length,
    accuracy:
      secondHalf.reduce((sum, day) => sum + day.daily_accuracy_percentage, 0) /
      secondHalf.length,
  };

  const calculateChange = (before: number, after: number): number => {
    if (before === 0) return after > 0 ? 100 : 0;
    return ((after - before) / before) * 100;
  };

  const firstHalfConsistency =
    firstHalf.filter((day) => day.daily_sessions > 0).length / firstHalf.length;
  const secondHalfConsistency =
    secondHalf.filter((day) => day.daily_sessions > 0).length /
    secondHalf.length;

  return {
    studyTimeImprovement: calculateChange(
      avgFirst.studyTime,
      avgSecond.studyTime,
    ),
    sessionCountImprovement: calculateChange(
      avgFirst.sessions,
      avgSecond.sessions,
    ),
    accuracyImprovement: calculateChange(avgFirst.accuracy, avgSecond.accuracy),
    consistencyImprovement: calculateChange(
      firstHalfConsistency,
      secondHalfConsistency,
    ),
  };
};

/**
 * Get analytics insights based on user data with enhanced error handling
 */
export const getAnalyticsInsights = async (): Promise<{
  insights: string[];
  recommendations: string[];
  achievements: string[];
}> => {
  return withErrorHandling(
    async () => {
      const [dashboard, dailyProgress, streaksSummary, topCourses] =
        await Promise.allSettled([
          getUserDashboardAnalytics(),
          getUserDailyProgress(undefined, undefined, 30),
          getUserStreaksSummary(),
          getUserTopCourses(3),
        ]);

      const insights: string[] = [];
      const recommendations: string[] = [];
      const achievements: string[] = [];

      // Safely extract data from settled promises
      const dashboardData =
        dashboard.status === 'fulfilled' ? dashboard.value : null;
      const dailyProgressData =
        dailyProgress.status === 'fulfilled'
          ? dailyProgress.value.dailyProgress
          : [];
      const streaksSummaryData =
        streaksSummary.status === 'fulfilled' ? streaksSummary.value : null;
      const topCoursesData =
        topCourses.status === 'fulfilled' ? topCourses.value : [];

      // Generate insights
      if (
        dashboardData?.current_streak_days &&
        dashboardData.current_streak_days > 7
      ) {
        insights.push(
          `You're on a ${dashboardData.current_streak_days}-day study streak! 🔥`,
        );
      }

      if (
        dashboardData?.total_study_hours &&
        dashboardData.total_study_hours > 100
      ) {
        achievements.push(
          `Study Master: ${Math.round(
            dashboardData.total_study_hours,
          )} hours of total study time!`,
        );
      }

      if (
        streaksSummaryData?.longest_single_session_minutes &&
        streaksSummaryData.longest_single_session_minutes > 120
      ) {
        achievements.push(
          `Marathon Learner: ${Math.round(
            streaksSummaryData.longest_single_session_minutes,
          )} minute study session!`,
        );
      }

      // Generate recommendations
      if (
        dashboardData?.average_session_minutes &&
        dashboardData.average_session_minutes < 15
      ) {
        recommendations.push(
          'Try extending your study sessions to at least 25 minutes for better focus.',
        );
      }

      if (
        !dashboardData?.current_streak_days ||
        dashboardData.current_streak_days === 0
      ) {
        recommendations.push(
          'Start a new study streak today! Consistency is key to learning.',
        );
      }

      const improvements = calculateImprovementTrends(dailyProgressData);
      if (improvements.consistencyImprovement < 0) {
        recommendations.push(
          'Focus on studying regularly. Even 15 minutes daily can make a big difference!',
        );
      }

      return { insights, recommendations, achievements };
    },
    { insights: [], recommendations: [], achievements: [] },
    'getAnalyticsInsights',
  );
};
