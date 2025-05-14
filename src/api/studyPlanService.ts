// src/api/studyPlanService.ts
import apiRequest from './apiClient';
import { StudyPlan, StudySession, Topic } from '../types/models';
import { ApiResponse } from '../types/api';

// Response interfaces for study plan endpoints
interface StudyPlanResponse extends ApiResponse<StudyPlan> {}
interface StudyPlansResponse extends ApiResponse<StudyPlan[]> {}
interface MessageResponse extends ApiResponse<{ message: string }> {}

interface StudyPlanProgressResponse
  extends ApiResponse<{
    planId: number;
    planName: string;
    startDate: string;
    endDate: string;
    daysTotal: number;
    daysElapsed: number;
    daysRemaining: number;
    completion: number;
    topicsProgress: Array<{
      topicId: number;
      topicName: string;
      priority: number;
      totalQuestions: number;
      questionsAnswered: number;
      correctAnswers: number;
      accuracy: number;
      completion: number;
    }>;
    sessionsCompleted: number;
    totalQuestions: number;
    questionsAnswered: number;
    correctAnswers: number;
    overallAccuracy: number;
    goalCompletion: number;
    studyTimeTotal: number;
    studyTimeWeek: number;
  }> {}

interface DailyRecommendationsResponse
  extends ApiResponse<
    Array<{
      topicId: number;
      topicName: string;
      branchId: number;
      branchName: string;
      recommendedQuestions: number;
      recommendedMinutes: number;
      priority: number;
      lastStudied: string | null;
      accuracy: number;
    }>
  > {}

interface TopicsResponse extends ApiResponse<Topic[]> {}

interface StudySessionsResponse
  extends ApiResponse<{
    sessions: StudySession[];
    total: number;
  }> {}

interface StudyPlanTemplatesResponse
  extends ApiResponse<
    Array<{
      id: number;
      name: string;
      description: string;
      durationDays: number;
      topics: Array<{
        topicId: number;
        topicName: string;
        priority: number;
      }>;
      dailyGoalMinutes: number;
      dailyGoalQuestions: number;
    }>
  > {}

/**
 * Create a new study plan
 * @param name Name of the study plan
 * @param description Description of the study plan
 * @param topics Array of topics with priorities
 * @param startDate Start date of the plan (ISO string)
 * @param endDate End date of the plan (ISO string)
 * @param dailyGoalMinutes Daily study time goal in minutes
 * @param dailyGoalQuestions Daily questions goal
 * @returns Created study plan
 */
export const createStudyPlan = async (
  name: string,
  description: string,
  topics: Array<{
    topicId: number;
    priority: number;
  }>,
  startDate: string,
  endDate: string,
  dailyGoalMinutes: number,
  dailyGoalQuestions: number,
): Promise<StudyPlan> => {
  const response = await apiRequest<StudyPlanResponse>('/studyPlans', 'POST', {
    name,
    description,
    topics,
    startDate,
    endDate,
    dailyGoalMinutes,
    dailyGoalQuestions,
  });

  if (!response.data) {
    throw new Error('Failed to create study plan');
  }

  return response.data;
};

/**
 * Get all study plans for the current user
 * @returns Array of study plans
 */
export const getStudyPlans = async (): Promise<StudyPlan[]> => {
  const response = await apiRequest<StudyPlansResponse>('/studyPlans');
  return response.data || [];
};

/**
 * Get a specific study plan by ID
 * @param planId ID of the study plan to retrieve
 * @returns Study plan object
 */
export const getStudyPlanById = async (planId: number): Promise<StudyPlan> => {
  const response = await apiRequest<StudyPlanResponse>(`/studyPlans/${planId}`);

  if (!response.data) {
    throw new Error(`Study plan with ID ${planId} not found`);
  }

  return response.data;
};

/**
 * Update an existing study plan
 * @param planId ID of the study plan to update
 * @param updates Partial study plan data to update
 * @returns Updated study plan
 */
export const updateStudyPlan = async (
  planId: number,
  updates: Partial<{
    name: string;
    description: string;
    topics: Array<{
      topicId: number;
      priority: number;
    }>;
    startDate: string;
    endDate: string;
    dailyGoalMinutes: number;
    dailyGoalQuestions: number;
    isActive: boolean;
  }>,
): Promise<StudyPlan> => {
  const response = await apiRequest<StudyPlanResponse>(
    `/studyPlans/${planId}`,
    'PUT',
    updates,
  );

  if (!response.data) {
    throw new Error(`Failed to update study plan with ID ${planId}`);
  }

  return response.data;
};

/**
 * Delete a study plan
 * @param planId ID of the study plan to delete
 * @returns Success message
 */
export const deleteStudyPlan = async (
  planId: number,
): Promise<{ message: string }> => {
  const response = await apiRequest<MessageResponse>(
    `/studyPlans/${planId}`,
    'DELETE',
  );

  if (!response.data) {
    return { message: 'Study plan deleted successfully' };
  }

  return response.data;
};

/**
 * Get the currently active study plan
 * @returns Active study plan or null if none is active
 */
export const getActiveStudyPlan = async (): Promise<StudyPlan | null> => {
  const response = await apiRequest<StudyPlanResponse>('/studyPlans/active');
  return response.data || null;
};

/**
 * Activate a study plan
 * @param planId ID of the study plan to activate
 * @returns The activated study plan
 */
export const activateStudyPlan = async (planId: number): Promise<StudyPlan> => {
  const response = await apiRequest<StudyPlanResponse>(
    `/studyPlans/${planId}/activate`,
    'POST',
  );

  if (!response.data) {
    throw new Error(`Failed to activate study plan with ID ${planId}`);
  }

  return response.data;
};

/**
 * Deactivate a study plan
 * @param planId ID of the study plan to deactivate
 * @returns Success message
 */
export const deactivateStudyPlan = async (
  planId: number,
): Promise<{ message: string }> => {
  const response = await apiRequest<MessageResponse>(
    `/studyPlans/${planId}/deactivate`,
    'POST',
  );

  if (!response.data) {
    return { message: 'Study plan deactivated successfully' };
  }

  return response.data;
};

/**
 * Get progress information for a study plan
 * @param planId ID of the study plan
 * @returns Detailed progress information
 */
export const getStudyPlanProgress = async (
  planId: number,
): Promise<{
  planId: number;
  planName: string;
  startDate: string;
  endDate: string;
  daysTotal: number;
  daysElapsed: number;
  daysRemaining: number;
  completion: number;
  topicsProgress: Array<{
    topicId: number;
    topicName: string;
    priority: number;
    totalQuestions: number;
    questionsAnswered: number;
    correctAnswers: number;
    accuracy: number;
    completion: number;
  }>;
  sessionsCompleted: number;
  totalQuestions: number;
  questionsAnswered: number;
  correctAnswers: number;
  overallAccuracy: number;
  goalCompletion: number;
  studyTimeTotal: number;
  studyTimeWeek: number;
}> => {
  const response = await apiRequest<StudyPlanProgressResponse>(
    `/studyPlans/${planId}/progress`,
  );

  if (!response.data) {
    throw new Error(`Failed to get progress for study plan with ID ${planId}`);
  }

  return response.data;
};

/**
 * Get recommended topics to study today
 * @returns Array of recommended topics with study details
 */
export const getRecommendedDailyTopics = async (): Promise<
  Array<{
    topicId: number;
    topicName: string;
    branchId: number;
    branchName: string;
    recommendedQuestions: number;
    recommendedMinutes: number;
    priority: number;
    lastStudied: string | null;
    accuracy: number;
  }>
> => {
  const response = await apiRequest<DailyRecommendationsResponse>(
    '/studyPlans/daily-recommendations',
  );
  return response.data || [];
};

/**
 * Get all available topics for creating study plans
 * @returns Array of topics
 */
export const getAvailableTopics = async (): Promise<Topic[]> => {
  const response = await apiRequest<TopicsResponse>('/topics');
  return response.data || [];
};

/**
 * Get study sessions for a specific plan
 * @param planId ID of the study plan
 * @param page Page number for pagination (default: 1)
 * @param limit Number of items per page (default: 10)
 * @returns Paginated study sessions with total count
 */
export const getStudyPlanSessions = async (
  planId: number,
  page: number = 1,
  limit: number = 10,
): Promise<{
  sessions: StudySession[];
  total: number;
}> => {
  const response = await apiRequest<StudySessionsResponse>(
    `/studyPlans/${planId}/sessions?page=${page}&limit=${limit}`,
  );

  if (!response.data) {
    return { sessions: [], total: 0 };
  }

  return response.data;
};

/**
 * Get available study plan templates
 * @returns Array of study plan templates
 */
export const getStudyPlanTemplates = async (): Promise<
  Array<{
    id: number;
    name: string;
    description: string;
    durationDays: number;
    topics: Array<{
      topicId: number;
      topicName: string;
      priority: number;
    }>;
    dailyGoalMinutes: number;
    dailyGoalQuestions: number;
  }>
> => {
  const response = await apiRequest<StudyPlanTemplatesResponse>(
    '/studyPlans/templates',
  );
  return response.data || [];
};

/**
 * Create a study plan from a template
 * @param templateId ID of the template to use
 * @param startDate Start date for the new plan
 * @returns Created study plan
 */
export const createPlanFromTemplate = async (
  templateId: number,
  startDate: string,
): Promise<StudyPlan> => {
  const response = await apiRequest<StudyPlanResponse>(
    '/studyPlans/from-template',
    'POST',
    {
      templateId,
      startDate,
    },
  );

  if (!response.data) {
    throw new Error(
      `Failed to create study plan from template with ID ${templateId}`,
    );
  }

  return response.data;
};

/**
 * Get study plan analytics
 * @param planId ID of the study plan
 * @returns Analytics data for the study plan
 */
export const getStudyPlanAnalytics = async (
  planId: number,
): Promise<{
  dailyStudyTime: Array<{ date: string; minutes: number }>;
  topicDistribution: Array<{
    topicId: number;
    topicName: string;
    percentage: number;
  }>;
  accuracyTrend: Array<{ date: string; accuracy: number }>;
  weakestTopics: Array<{
    topicId: number;
    topicName: string;
    accuracy: number;
  }>;
  strongestTopics: Array<{
    topicId: number;
    topicName: string;
    accuracy: number;
  }>;
}> => {
  const response = await apiRequest<
    ApiResponse<{
      dailyStudyTime: Array<{ date: string; minutes: number }>;
      topicDistribution: Array<{
        topicId: number;
        topicName: string;
        percentage: number;
      }>;
      accuracyTrend: Array<{ date: string; accuracy: number }>;
      weakestTopics: Array<{
        topicId: number;
        topicName: string;
        accuracy: number;
      }>;
      strongestTopics: Array<{
        topicId: number;
        topicName: string;
        accuracy: number;
      }>;
    }>
  >(`/studyPlans/${planId}/analytics`);

  if (!response.data) {
    return {
      dailyStudyTime: [],
      topicDistribution: [],
      accuracyTrend: [],
      weakestTopics: [],
      strongestTopics: [],
    };
  }

  return response.data;
};
