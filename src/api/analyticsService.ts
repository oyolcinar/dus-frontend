import apiRequest from './apiClient';
// ApiResponse is implicitly handled by apiRequest's return type

// --- Define interfaces for the *actual data payloads* your backend sends ---
// --- These will be the TData in apiRequest<TData> ---

// ENHANCED: For GET /analytics/user-performance with test topic data
export interface UserPerformanceAnalyticsPayload {
  // Exporting if used elsewhere, e.g. HomeScreen
  branchPerformance: {
    branchId: number;
    branchName: string;
    averageScore: number;
    totalQuestions: number;
    correctAnswers: number;
    testAccuracy?: number; // NEW: Test-specific accuracy
    testsTaken?: number; // NEW: Number of tests taken
    avgTestScore?: number; // NEW: Average test score
  }[];
  totalQuestionsAnswered: number;
  overallAccuracy: number;
  studyTime: number; // Assuming this is in a consistent unit, e.g., seconds or minutes
  studySessions: number;
  averageSessionDuration: number; // Assuming same unit as studyTime for consistency
}

// For GET /analytics/activity
export interface ActivityTimelineEntryPayload {
  // Renamed for clarity, represents one entry
  date: string;
  studyTime: number;
  questionsAnswered: number;
}
type ActivityTimelinePayload = ActivityTimelineEntryPayload[]; // The endpoint returns an array

// For GET /analytics/weakest-topics
export interface WeakestTopicPayload {
  // Renamed for clarity
  topicId: number;
  topicName: string;
  branchId: number;
  branchName: string;
  averageScore: number;
  totalQuestions: number;
  correctAnswers: number;
}
type WeakestTopicsListPayload = WeakestTopicPayload[]; // The endpoint returns an array

// For GET /analytics/improvement
export interface ImprovementMetricsPayload {
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

// For GET /analytics/study-time-distribution
export interface StudyTimeDistributionPayload {
  morning: number; // Assuming these are counts or durations
  afternoon: number;
  evening: number;
  night: number;
  totalHours: number; // Or totalDuration in consistent unit
}

// ENHANCED: For GET /analytics/answer-explanations with topic information
export interface AnswerExplanationsPayload {
  incorrectAnswers: {
    answerId: number;
    questionText: string;
    userAnswer: string;
    correctAnswer: string;
    explanation: string;
    options: Record<string, any>;
    testTitle: string;
    courseTitle: string;
    topicId?: number; // NEW: Topic ID
    topicTitle?: string; // NEW: Topic title
    topicDescription?: string; // NEW: Topic description
    answeredAt: string;
  }[];
}

// ENHANCED: For GET /analytics/topics with test data
export interface TopicAnalyticsPayload {
  topicAnalytics: {
    topicId: number;
    topicTitle: string;
    totalDuration: number;
    totalDurationHours: number;
    accuracyRate: string;
    correctAnswers: number;
    totalAttempts: number;
    testAccuracy?: string; // NEW: Test-specific accuracy
    testsTaken?: number; // NEW: Number of tests taken
    avgTestScore?: string; // NEW: Average test score
  }[];
}

// NEW: For GET /analytics/test-topics
export interface TestTopicAnalyticsPayload {
  testTopicAnalytics: {
    topic_id: number;
    topic_title: string;
    test_accuracy: number;
    tests_taken: number;
    avg_test_score: number;
  }[];
}

// ENHANCED: For GET /analytics/dashboard with test topic data
export interface DashboardAnalyticsPayload {
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
    testAccuracy?: string; // NEW: Test-specific accuracy
    testsTaken?: number; // NEW: Number of tests taken
    avgTestScore?: string; // NEW: Average test score
  }>;
}

// For GET /analytics/weekly-progress
export interface WeeklyProgressPayload {
  dailyProgress: Array<{
    date: string;
    totalDuration: number;
    totalDurationHours: number;
  }>;
}

// --- Service Functions ---

export const getUserPerformanceAnalytics =
  async (): Promise<UserPerformanceAnalyticsPayload> => {
    const response = await apiRequest<UserPerformanceAnalyticsPayload>(
      '/analytics/user-performance',
    );

    // Provide default values if data (or parts of it) might be missing from backend
    // or if apiRequest.data could be undefined on a successful (e.g. 204) response
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

    // You could also add more granular defaults here if some fields within response.data are optional
    return {
      branchPerformance: response.data.branchPerformance || [],
      totalQuestionsAnswered: response.data.totalQuestionsAnswered || 0,
      overallAccuracy: response.data.overallAccuracy || 0,
      studyTime: response.data.studyTime || 0,
      studySessions: response.data.studySessions || 0,
      averageSessionDuration: response.data.averageSessionDuration || 0,
    };
  };

// NEW: Get dashboard analytics with enhanced topic data
export const getDashboardAnalytics =
  async (): Promise<DashboardAnalyticsPayload> => {
    const response = await apiRequest<DashboardAnalyticsPayload>(
      '/analytics/dashboard',
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

// NEW: Get weekly progress
export const getWeeklyProgress = async (): Promise<WeeklyProgressPayload> => {
  const response = await apiRequest<WeeklyProgressPayload>(
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

// ENHANCED: Get topic analytics with test data
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

// NEW: Get test topic analytics
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
  return response.data || []; // Default to empty array if no data
};

export const getWeakestTopics = async (
  limit: number = 5,
): Promise<WeakestTopicsListPayload> => {
  const response = await apiRequest<WeakestTopicsListPayload>(
    `/analytics/weakest-topics?limit=${limit}`,
  );
  return response.data || []; // Default to empty array
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

// ENHANCED: Get answer explanations with topic information for learning insights
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

// NEW: Utility functions for enhanced analytics

// Get comprehensive analytics for a topic
export const getTopicComprehensiveAnalytics = async (topicId: number) => {
  try {
    const [topicAnalytics, testTopicAnalytics, weakestTopics] =
      await Promise.all([
        getTopicAnalytics(),
        getTestTopicAnalytics(),
        getWeakestTopics(10), // Get more to find this specific topic
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

// Get analytics for multiple topics at once
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

// Get filtered answer explanations by topic
export const getAnswerExplanationsByTopic = async (
  topicId: number,
  limit: number = 10,
): Promise<AnswerExplanationsPayload> => {
  try {
    // Get all explanations and filter by topic
    const allExplanations = await getAnswerExplanations(limit * 2); // Get more to ensure we have enough after filtering

    const filteredExplanations = allExplanations.incorrectAnswers
      .filter((answer) => answer.topicId === topicId)
      .slice(0, limit); // Take only the requested number

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
