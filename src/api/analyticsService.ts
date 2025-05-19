// src/api/analyticsService.ts
import apiRequest from './apiClient';
import { ApiResponse } from '../types/api';

// Response interface for user performance analytics
interface PerformanceAnalyticsResponse
  extends ApiResponse<{
    branchPerformance: {
      branchId: number;
      branchName: string;
      averageScore: number;
      totalQuestions: number;
      correctAnswers: number;
    }[];
    totalQuestionsAnswered: number;
    overallAccuracy: number;
    studyTime: number;
    studySessions: number;
    averageSessionDuration: number;
  }> {}

// Response interface for activity timeline
interface ActivityTimelineResponse
  extends ApiResponse<
    {
      date: string;
      studyTime: number;
      questionsAnswered: number;
    }[]
  > {}

// Response interface for weakest topics
interface WeakestTopicsResponse
  extends ApiResponse<
    {
      topicId: number;
      topicName: string;
      branchId: number;
      branchName: string;
      averageScore: number;
      totalQuestions: number;
      correctAnswers: number;
    }[]
  > {}

// Response interface for improvement metrics
interface ImprovementMetricsResponse
  extends ApiResponse<{
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
  }> {}

// Response interface for study time distribution
interface StudyTimeDistributionResponse
  extends ApiResponse<{
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
    totalHours: number;
  }> {}

/**
 * Get user performance analytics data
 * @returns Performance analytics data including branch performance and overall metrics
 */
export const getUserPerformanceAnalytics = async (): Promise<{
  branchPerformance: {
    branchId: number;
    branchName: string;
    averageScore: number;
    totalQuestions: number;
    correctAnswers: number;
  }[];
  totalQuestionsAnswered: number;
  overallAccuracy: number;
  studyTime: number;
  studySessions: number;
  averageSessionDuration: number;
}> => {
  const response = await apiRequest<PerformanceAnalyticsResponse>(
    '/analytics/user-performance',
  );

  // Provide default values if data is missing
  if (!response.data) {
    return {
      branchPerformance: [],
      totalQuestionsAnswered: 0,
      overallAccuracy: 0,
      studyTime: 0,
      studySessions: 0,
      averageSessionDuration: 0,
    };
  }

  return response.data;
};

/**
 * Get activity timeline data for a specified number of days
 * @param days Number of days to retrieve data for (default: 7)
 * @returns Array of daily activity data
 */
export const getActivityTimeline = async (
  days: number = 7,
): Promise<
  {
    date: string;
    studyTime: number;
    questionsAnswered: number;
  }[]
> => {
  const response = await apiRequest<ActivityTimelineResponse>(
    `/analytics/activity?days=${days}`,
  );
  return response.data || [];
};

/**
 * Get the user's weakest topics based on performance
 * @param limit Maximum number of topics to return (default: 5)
 * @returns Array of weakest topics with performance metrics
 */
export const getWeakestTopics = async (
  limit: number = 5,
): Promise<
  {
    topicId: number;
    topicName: string;
    branchId: number;
    branchName: string;
    averageScore: number;
    totalQuestions: number;
    correctAnswers: number;
  }[]
> => {
  const response = await apiRequest<WeakestTopicsResponse>(
    `/analytics/weakest-topics?limit=${limit}`,
  );
  return response.data || [];
};

/**
 * Get metrics showing improvement over time
 * @returns Improvement metrics including overall and topic-specific changes
 */
export const getImprovementMetrics = async (): Promise<{
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
}> => {
  const response = await apiRequest<ImprovementMetricsResponse>(
    '/analytics/improvement',
  );

  // Provide default values if data is missing
  if (!response.data) {
    return {
      previousAverage: 0,
      currentAverage: 0,
      percentageChange: 0,
      topicImprovements: [],
    };
  }

  return response.data;
};

/**
 * Get the distribution of study time across different parts of the day
 * @returns Study time distribution data
 */
export const getStudyTimeDistribution = async (): Promise<{
  morning: number;
  afternoon: number;
  evening: number;
  night: number;
  totalHours: number;
}> => {
  const response = await apiRequest<StudyTimeDistributionResponse>(
    '/analytics/study-time-distribution',
  );

  // Provide default values if data is missing
  if (!response.data) {
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
