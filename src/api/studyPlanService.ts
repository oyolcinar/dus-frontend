import apiRequest from './apiClient';
import { StudyPlan, PlanActivity } from '../types/models';

export const createStudyPlan = async (
  title: string,
  description: string | null,
  startDate: string,
  endDate: string,
  isCustom: boolean = false,
): Promise<{
  message: string;
  plan: StudyPlan;
}> => {
  return await apiRequest('/study-plans', 'POST', {
    title,
    description,
    startDate,
    endDate,
    isCustom,
  });
};

export const getUserPlans = async (): Promise<StudyPlan[]> => {
  return await apiRequest<StudyPlan[]>('/study-plans');
};

export const getPlanById = async (
  planId: number,
): Promise<StudyPlan & { activities: PlanActivity[] }> => {
  return await apiRequest<StudyPlan & { activities: PlanActivity[] }>(
    `/study-plans/${planId}`,
  );
};

export const updatePlan = async (
  planId: number,
  title?: string,
  description?: string,
  startDate?: string,
  endDate?: string,
): Promise<{
  message: string;
  plan: StudyPlan;
}> => {
  return await apiRequest(`/study-plans/${planId}`, 'PUT', {
    title,
    description,
    startDate,
    endDate,
  });
};

export const deletePlan = async (
  planId: number,
): Promise<{ message: string }> => {
  return await apiRequest<{ message: string }>(
    `/study-plans/${planId}`,
    'DELETE',
  );
};

export interface ActivityData {
  subtopicId?: number;
  title: string;
  description?: string;
  duration?: number;
  scheduledDate: string;
}

export const addActivity = async (
  planId: number,
  data: ActivityData,
): Promise<{
  message: string;
  activity: PlanActivity;
}> => {
  return await apiRequest(`/study-plans/${planId}/activities`, 'POST', data);
};

export const updateActivityStatus = async (
  activityId: number,
  isCompleted: boolean,
): Promise<{
  message: string;
  activity: PlanActivity;
}> => {
  return await apiRequest(`/study-plans/activities/${activityId}`, 'PUT', {
    isCompleted,
  });
};

export const deleteActivity = async (
  activityId: number,
): Promise<{ message: string }> => {
  return await apiRequest<{ message: string }>(
    `/study-plans/activities/${activityId}`,
    'DELETE',
  );
};
