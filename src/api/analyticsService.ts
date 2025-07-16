import apiRequest from './apiClient';
// ApiResponse is implicitly handled by apiRequest's return type

// --- Define interfaces for the *actual data payloads* your backend sends ---
// --- These will be the TData in apiRequest<TData> ---

// For GET /analytics/user-performance
export interface UserPerformanceAnalyticsPayload {
  // Exporting if used elsewhere, e.g. HomeScreen
  branchPerformance: {
    branchId: number;
    branchName: string;
    averageScore: number;
    totalQuestions: number;
    correctAnswers: number;
  }[];
  totalQuestionsAnswered: number;
  overallAccuracy: number;
  studyTime: number; // Assuming this is in a consistent unit, e.g., seconds or minutes
  studySessions: number;
  averageSessionDuration: number; // Assuming same unit as studyTime for consistency
  // Add duel stats here if this endpoint is supposed to return them
  // totalDuels?: number;
  // wins?: number;
  // losses?: number;
  // winRate?: number;
  // longestLosingStreak?: number;
  // currentLosingStreak?: number;
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

// NEW: For GET /analytics/answer-explanations
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
    answeredAt: string;
  }[];
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
      // Add defaults for duel stats if they were part of this payload
    };
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

// NEW: Get answer explanations for learning insights
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
