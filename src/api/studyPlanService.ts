import apiRequest from './apiClient';
import { StudyPlan, StudySession, Topic } from '../types/models';

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
  return await apiRequest<StudyPlan>('/studyPlans', 'POST', {
    name,
    description,
    topics,
    startDate,
    endDate,
    dailyGoalMinutes,
    dailyGoalQuestions,
  });
};

export const getStudyPlans = async (): Promise<StudyPlan[]> => {
  return await apiRequest<StudyPlan[]>('/studyPlans');
};

export const getStudyPlanById = async (planId: number): Promise<StudyPlan> => {
  return await apiRequest<StudyPlan>(`/studyPlans/${planId}`);
};

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
  return await apiRequest<StudyPlan>(`/studyPlans/${planId}`, 'PUT', updates);
};

export const deleteStudyPlan = async (
  planId: number,
): Promise<{ message: string }> => {
  return await apiRequest<{ message: string }>(
    `/studyPlans/${planId}`,
    'DELETE',
  );
};

export const getActiveStudyPlan = async (): Promise<StudyPlan | null> => {
  return await apiRequest<StudyPlan | null>('/studyPlans/active');
};

export const activateStudyPlan = async (
  planId: number,
): Promise<StudyPlan> => {
  return await apiRequest<StudyPlan>(`/studyPlans/${planId}/activate`, 'POST');
};

export const deactivateStudyPlan = async (
  planId: number,
): Promise<{ message: string }> => {
  return await apiRequest<{ message: string }>(
    `/studyPlans/${planId}/deactivate`,
    'POST',
  );
};

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
  return await apiRequest(`/studyPlans/${planId}/progress`);
};

export const getRecommendedDailyTopics = async (): Promise<Array<{
  topicId: number;
  topicName: string;
  branchId: number;
  branchName: string;
  recommendedQuestions: number;
  recommendedMinutes: number;
  priority: number;
  lastStudied: string | null;
  accuracy: number;
}>> => {
  return await apiRequest('/studyPlans/daily-recommendations');
};

export const getAvailableTopics = async (): Promise<Topic[]> => {
  return await apiRequest<Topic[]>('/topics');
};

export const getStudyPlanSessions = async (
  planId: number,
  page: number = 1,
  limit: number = 10
): Promise<{
  sessions: StudySession[];
  total: number;
}> => {
  return await apiRequest(
    `/studyPlans/${planId}/sessions?page=${page}&limit=${limit}`
  );
};

// New endpoint for study plan templates
export const getStudyPlanTemplates = async (): Promise<Array<{
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
}>> => {
  return await apiRequest('/studyPlans/templates');
};

// New endpoint for creating plan from template
export const createPlanFromTemplate = async (
  templateId: number,
  startDate: string
): Promise<StudyPlan> => {
  return await apiRequest('/studyPlans/from-template', 'POST', {
    templateId,
    startDate
  });
};
