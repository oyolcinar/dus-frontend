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

interface ActivityTimelineEntryPayload {
  date: string;
  studyTime: number;
  questionsAnswered: number;
}
type ActivityTimelinePayload = ActivityTimelineEntryPayload[];

interface WeakestTopicPayload {
  topicId: number;
  topicName: string;
  branchId: number;
  branchName: string;
  averageScore: number;
  totalQuestions: number;
  correctAnswers: number;
}
type WeakestTopicsListPayload = WeakestTopicPayload[];

interface ImprovementMetricsPayload {
  previousAverage: number;
  currentAverage: number;
  percentageChange: number;
  topicImprovements: {
    topicId: number;
    topicName: string;
    previousAccuracy: number;
    currentAccuracy: number;
    percentageChange: number;
  }[];
}

interface StudyTimeDistributionPayload {
  morning: number;
  afternoon: number;
  evening: number;
  night: number;
  totalHours: number;
}

interface AnswerExplanationsPayload {
  incorrectAnswers: {
    answerId: number;
    questionText: string;
    userAnswer: string;
    correctAnswer: string;
    explanation: string;
    options: Record<string, any>;
    testTitle: string;
    courseTitle: string;
    topicId?: number;
    topicTitle?: string;
    topicDescription?: string;
    answeredAt: string;
  }[];
}

interface TopicAnalyticsPayload {
  topicAnalytics: {
    topicId: number;
    topicTitle: string;
    totalDuration: number;
    totalDurationHours: number;
    accuracyRate: string;
    correctAnswers: number;
    totalAttempts: number;
    testAccuracy?: string;
    testsTaken?: number;
    avgTestScore?: string;
  }[];
}

interface TestTopicAnalyticsPayload {
  testTopicAnalytics: {
    topic_id: number;
    topic_title: string;
    test_accuracy: number;
    tests_taken: number;
    avg_test_score: number;
  }[];
}

interface DashboardAnalyticsLegacyPayload {
  recentStudyTime: number;
  recentStudyTimeHours: number;
  dailyStudyTime: Array<{
    study_date: string;
    total_duration: number;
  }>;
  duelStats: {
    totalDuels: number;
    wins: number;
    losses: number;
    winRate: string;
  };
  problematicTopics: Array<{
    topicId: number;
    topicTitle: string;
    errorRate: string;
    totalErrors: number;
    totalAttempts: number;
  }>;
  topicAnalytics: Array<{
    topicId: number;
    topicTitle: string;
    totalDuration: number;
    totalDurationHours: number;
    accuracyRate: string;
    correctAnswers: number;
    totalAttempts: number;
    testAccuracy?: string;
    testsTaken?: number;
    avgTestScore?: string;
  }>;
}

interface WeeklyProgressLegacyPayload {
  dailyProgress: Array<{
    date: string;
    totalDuration: number;
    totalDurationHours: number;
  }>;
}

// ===============================
// NEW: ENHANCED ANALYTICS FUNCTIONS
// ===============================

/**
 * Get user's longest study streaks by topic and course
 */
export const getUserLongestStreaks = async (): Promise<LongestStreak[]> => {
  const response = await apiRequest<LongestStreaksResponse>(
    '/analytics/streaks/longest',
  );

  if (!response.data || !response.data.streaks) {
    console.warn('No longest streaks data received, returning empty array.');
    return [];
  }

  return response.data.streaks;
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

  try {
    const response = await apiRequest<StreaksSummary>(
      '/analytics/streaks/summary',
    );

    if (!response.data || typeof response.data !== 'object') {
      console.warn('No streaks summary data received, returning defaults.');
      return defaultSummary;
    }

    return { ...defaultSummary, ...response.data };
  } catch (error) {
    console.error('Error fetching streaks summary:', error);
    return defaultSummary;
  }
};

/**
 * Get detailed streaks analytics from view
 */
export const getLongestStreaksAnalytics = async (): Promise<
  StreaksAnalytics[]
> => {
  const response = await apiRequest<StreaksAnalyticsResponse>(
    '/analytics/streaks/analytics',
  );

  return response.data?.streaksAnalytics || [];
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

  if (!response.data || typeof response.data !== 'object') {
    const today = new Date().toISOString().split('T')[0];
    const startDay = new Date();
    startDay.setDate(startDay.getDate() - days);
    const defaultStart = startDay.toISOString().split('T')[0];

    return {
      dailyProgress: [],
      dateRange: { startDate: defaultStart, endDate: today },
    };
  }

  return response.data;
};

/**
 * Get user's weekly progress data for charts
 */
export const getUserWeeklyProgress = async (
  weeksBack: number = 12,
): Promise<WeeklyProgress[]> => {
  const response = await apiRequest<WeeklyProgressResponse>(
    `/analytics/progress/weekly?weeksBack=${weeksBack}`,
  );

  return response.data?.weeklyProgress || [];
};

/**
 * Get daily progress analytics from view
 */
export const getDailyProgressAnalytics = async (
  days: number = 30,
): Promise<DailyProgress[]> => {
  const response = await apiRequest<DailyProgressAnalyticsResponse>(
    `/analytics/progress/daily-analytics?days=${days}`,
  );

  return response.data?.dailyProgressAnalytics || [];
};

/**
 * Get weekly progress analytics from view
 */
export const getWeeklyProgressAnalytics = async (
  weeks: number = 12,
): Promise<WeeklyProgress[]> => {
  const response = await apiRequest<WeeklyProgressAnalyticsResponse>(
    `/analytics/progress/weekly-analytics?weeks=${weeks}`,
  );

  return response.data?.weeklyProgressAnalytics || [];
};

/**
 * Get user's top courses by time spent (study sessions + duels)
 */
export const getUserTopCourses = async (
  limit: number = 10,
): Promise<TopCourse[]> => {
  const response = await apiRequest<TopCoursesResponse>(
    `/analytics/courses/top?limit=${limit}`,
  );

  return response.data?.topCourses || [];
};

/**
 * Get most time spent course details
 */
export const getMostTimeSpentCourse =
  async (): Promise<MostStudiedCourse | null> => {
    const response = await apiRequest<MostStudiedCourseResponse>(
      '/analytics/courses/most-studied',
    );

    return response.data?.mostStudiedCourse || null;
  };

/**
 * Get most time spent course analytics from view
 */
export const getMostTimeSpentCourseAnalytics = async (): Promise<
  MostStudiedCourse[]
> => {
  const response = await apiRequest<CourseAnalyticsResponse>(
    '/analytics/courses/analytics',
  );

  return response.data?.courseAnalytics || [];
};

/**
 * Get user performance compared to platform average
 */
export const getUserComparativeAnalytics = async (): Promise<
  ComparativeMetric[]
> => {
  const response = await apiRequest<ComparativeAnalyticsResponse>(
    '/analytics/comparative',
  );

  return response.data?.comparison || [];
};

/**
 * Get user's recent activity summary
 */
export const getUserRecentActivity = async (
  daysBack: number = 7,
): Promise<RecentActivity[]> => {
  const response = await apiRequest<RecentActivity[]>(
    `/analytics/recent-activity?daysBack=${daysBack}`,
  );

  return response.data || [];
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

    try {
      const response = await apiRequest<DashboardAnalytics>(
        '/analytics/dashboard',
      );

      if (!response.data || typeof response.data !== 'object') {
        console.warn(
          'No dashboard analytics data received, returning defaults.',
        );
        return defaultDashboard;
      }

      return { ...defaultDashboard, ...response.data };
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
      return defaultDashboard;
    }
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

  try {
    const response = await apiRequest<AnalyticsSummary>('/analytics/summary');

    if (!response.data || typeof response.data !== 'object') {
      console.warn('No analytics summary data received, returning defaults.');
      return defaultSummary;
    }

    return { ...defaultSummary, ...response.data };
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    return defaultSummary;
  }
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

  try {
    const response = await apiRequest<ComprehensiveAnalytics>(
      `/analytics/all?daysBack=${daysBack}&weeksBack=${weeksBack}`,
    );

    if (!response.data || typeof response.data !== 'object') {
      console.warn(
        'No comprehensive analytics data received, returning defaults.',
      );
      return defaultAnalytics;
    }

    // Ensure all arrays are initialized
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
  } catch (error) {
    console.error('Error fetching comprehensive analytics:', error);
    return defaultAnalytics;
  }
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
  try {
    // Calculate days and weeks between dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
    const weeksDiff = Math.ceil(daysDiff / 7);

    const [dailyProgress, weeklyProgress, recentActivity] = await Promise.all([
      getUserDailyProgress(startDate, endDate),
      getUserWeeklyProgress(weeksDiff),
      getUserRecentActivity(daysDiff),
    ]);

    return {
      period: { startDate, endDate, days: daysDiff, weeks: weeksDiff },
      dailyProgress: dailyProgress.dailyProgress,
      weeklyProgress,
      recentActivity,
    };
  } catch (error) {
    console.error('Error fetching analytics for period:', error);
    return {
      period: { startDate, endDate, days: 0, weeks: 0 },
      dailyProgress: [],
      weeklyProgress: [],
      recentActivity: [],
    };
  }
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

  // Calculate consistency (days with study activity)
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
 * Get analytics insights based on user data
 */
export const getAnalyticsInsights = async (): Promise<{
  insights: string[];
  recommendations: string[];
  achievements: string[];
}> => {
  try {
    const [dashboard, dailyProgress, streaksSummary, topCourses] =
      await Promise.all([
        getUserDashboardAnalytics(),
        getUserDailyProgress(undefined, undefined, 30),
        getUserStreaksSummary(),
        getUserTopCourses(3),
      ]);

    const insights: string[] = [];
    const recommendations: string[] = [];
    const achievements: string[] = [];

    // Generate insights
    if (dashboard.current_streak_days > 7) {
      insights.push(
        `You're on a ${dashboard.current_streak_days}-day study streak! 🔥`,
      );
    }

    if (dashboard.total_study_hours > 100) {
      achievements.push(
        `Study Master: ${Math.round(
          dashboard.total_study_hours,
        )} hours of total study time!`,
      );
    }

    if (streaksSummary.longest_single_session_minutes > 120) {
      achievements.push(
        `Marathon Learner: ${Math.round(
          streaksSummary.longest_single_session_minutes,
        )} minute study session!`,
      );
    }

    // Generate recommendations
    if (dashboard.average_session_minutes < 15) {
      recommendations.push(
        'Try extending your study sessions to at least 25 minutes for better focus.',
      );
    }

    if (dashboard.current_streak_days === 0) {
      recommendations.push(
        'Start a new study streak today! Consistency is key to learning.',
      );
    }

    const improvements = calculateImprovementTrends(
      dailyProgress.dailyProgress,
    );
    if (improvements.consistencyImprovement < 0) {
      recommendations.push(
        'Focus on studying regularly. Even 15 minutes daily can make a big difference!',
      );
    }

    return { insights, recommendations, achievements };
  } catch (error) {
    console.error('Error generating analytics insights:', error);
    return { insights: [], recommendations: [], achievements: [] };
  }
};

// ===============================
// LEGACY ANALYTICS FUNCTIONS (for backward compatibility)
// ===============================

export const getUserPerformanceAnalytics =
  async (): Promise<UserPerformanceAnalyticsPayload> => {
    const response = await apiRequest<UserPerformanceAnalyticsPayload>(
      '/analytics/user-performance',
    );

    if (!response.data || typeof response.data !== 'object') {
      console.warn(
        'No user performance analytics data received, returning defaults.',
      );
      return {
        branchPerformance: [],
        totalQuestionsAnswered: 0,
        overallAccuracy: 0,
        studyTime: 0,
        studySessions: 0,
        averageSessionDuration: 0,
      };
    }

    return {
      branchPerformance: response.data.branchPerformance || [],
      totalQuestionsAnswered: response.data.totalQuestionsAnswered || 0,
      overallAccuracy: response.data.overallAccuracy || 0,
      studyTime: response.data.studyTime || 0,
      studySessions: response.data.studySessions || 0,
      averageSessionDuration: response.data.averageSessionDuration || 0,
    };
  };

export const getDashboardAnalyticsLegacy =
  async (): Promise<DashboardAnalyticsLegacyPayload> => {
    const response = await apiRequest<DashboardAnalyticsLegacyPayload>(
      '/analytics/dashboard-legacy',
    );

    if (!response.data || typeof response.data !== 'object') {
      console.warn('No dashboard analytics data received, returning defaults.');
      return {
        recentStudyTime: 0,
        recentStudyTimeHours: 0,
        dailyStudyTime: [],
        duelStats: {
          totalDuels: 0,
          wins: 0,
          losses: 0,
          winRate: '0.0',
        },
        problematicTopics: [],
        topicAnalytics: [],
      };
    }
    return response.data;
  };

export const getWeeklyProgressLegacy =
  async (): Promise<WeeklyProgressLegacyPayload> => {
    const response = await apiRequest<WeeklyProgressLegacyPayload>(
      '/analytics/weekly-progress',
    );

    if (!response.data || typeof response.data !== 'object') {
      console.warn('No weekly progress data received, returning defaults.');
      return {
        dailyProgress: [],
      };
    }
    return response.data;
  };

export const getTopicAnalytics = async (): Promise<TopicAnalyticsPayload> => {
  const response = await apiRequest<TopicAnalyticsPayload>('/analytics/topics');

  if (!response.data || typeof response.data !== 'object') {
    console.warn('No topic analytics data received, returning defaults.');
    return {
      topicAnalytics: [],
    };
  }
  return response.data;
};

export const getTestTopicAnalytics =
  async (): Promise<TestTopicAnalyticsPayload> => {
    const response = await apiRequest<TestTopicAnalyticsPayload>(
      '/analytics/test-topics',
    );

    if (!response.data || typeof response.data !== 'object') {
      console.warn(
        'No test topic analytics data received, returning defaults.',
      );
      return {
        testTopicAnalytics: [],
      };
    }
    return response.data;
  };

export const getActivityTimeline = async (
  days: number = 7,
): Promise<ActivityTimelinePayload> => {
  const response = await apiRequest<ActivityTimelinePayload>(
    `/analytics/activity?days=${days}`,
  );
  return response.data || [];
};

export const getWeakestTopics = async (
  limit: number = 5,
): Promise<WeakestTopicsListPayload> => {
  const response = await apiRequest<WeakestTopicsListPayload>(
    `/analytics/weakest-topics?limit=${limit}`,
  );
  return response.data || [];
};

export const getImprovementMetrics =
  async (): Promise<ImprovementMetricsPayload> => {
    const response = await apiRequest<ImprovementMetricsPayload>(
      '/analytics/improvement',
    );

    if (!response.data || typeof response.data !== 'object') {
      console.warn('No improvement metrics data received, returning defaults.');
      return {
        previousAverage: 0,
        currentAverage: 0,
        percentageChange: 0,
        topicImprovements: [],
      };
    }
    return response.data;
  };

export const getStudyTimeDistribution =
  async (): Promise<StudyTimeDistributionPayload> => {
    const response = await apiRequest<StudyTimeDistributionPayload>(
      '/analytics/study-time-distribution',
    );

    if (!response.data || typeof response.data !== 'object') {
      console.warn(
        'No study time distribution data received, returning defaults.',
      );
      return {
        morning: 0,
        afternoon: 0,
        evening: 0,
        night: 0,
        totalHours: 0,
      };
    }
    return response.data;
  };

export const getAnswerExplanations = async (
  limit: number = 10,
): Promise<AnswerExplanationsPayload> => {
  const response = await apiRequest<AnswerExplanationsPayload>(
    `/analytics/answer-explanations?limit=${limit}`,
  );

  if (!response.data || typeof response.data !== 'object') {
    console.warn('No answer explanations data received, returning defaults.');
    return {
      incorrectAnswers: [],
    };
  }
  return response.data;
};

// Utility functions for enhanced analytics (keeping existing ones)
export const getTopicComprehensiveAnalytics = async (topicId: number) => {
  try {
    const [topicAnalytics, testTopicAnalytics, weakestTopics] =
      await Promise.all([
        getTopicAnalytics(),
        getTestTopicAnalytics(),
        getWeakestTopics(10),
      ]);

    const specificTopicData = topicAnalytics.topicAnalytics.find(
      (topic) => topic.topicId === topicId,
    );

    const specificTestData = testTopicAnalytics.testTopicAnalytics.find(
      (topic) => topic.topic_id === topicId,
    );

    const isWeakestTopic = weakestTopics.some(
      (topic) => topic.topicId === topicId,
    );

    return {
      topicData: specificTopicData || null,
      testData: specificTestData || null,
      isProblematic: isWeakestTopic,
      hasData: !!(specificTopicData || specificTestData),
    };
  } catch (error) {
    console.error(
      `Error fetching comprehensive analytics for topic ${topicId}:`,
      error,
    );
    return {
      topicData: null,
      testData: null,
      isProblematic: false,
      hasData: false,
    };
  }
};

export const getMultipleTopicsAnalytics = async (topicIds: number[]) => {
  try {
    const [topicAnalytics, testTopicAnalytics] = await Promise.all([
      getTopicAnalytics(),
      getTestTopicAnalytics(),
    ]);

    const results = topicIds.map((topicId) => {
      const topicData = topicAnalytics.topicAnalytics.find(
        (topic) => topic.topicId === topicId,
      );

      const testData = testTopicAnalytics.testTopicAnalytics.find(
        (topic) => topic.topic_id === topicId,
      );

      return {
        topicId,
        topicData: topicData || null,
        testData: testData || null,
        hasData: !!(topicData || testData),
      };
    });

    return results;
  } catch (error) {
    console.error('Error fetching multiple topics analytics:', error);
    return topicIds.map((topicId) => ({
      topicId,
      topicData: null,
      testData: null,
      hasData: false,
    }));
  }
};

export const getAnswerExplanationsByTopic = async (
  topicId: number,
  limit: number = 10,
): Promise<AnswerExplanationsPayload> => {
  try {
    const allExplanations = await getAnswerExplanations(limit * 2);

    const filteredExplanations = allExplanations.incorrectAnswers
      .filter((answer) => answer.topicId === topicId)
      .slice(0, limit);

    return {
      incorrectAnswers: filteredExplanations,
    };
  } catch (error) {
    console.error(
      `Error fetching answer explanations for topic ${topicId}:`,
      error,
    );
    return {
      incorrectAnswers: [],
    };
  }
};
