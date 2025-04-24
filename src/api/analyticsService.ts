import apiRequest from './apiClient';
import { DashboardData } from '../types/models';

export const getUserDashboard = async (): Promise<DashboardData> => {
  return await apiRequest<DashboardData>('/analytics/dashboard');
};

export interface WeeklyProgressData {
  dailyProgress: Array<{
    date: string;
    totalDuration: number;
    totalDurationHours: number;
  }>;
}

export const getWeeklyProgress = async (): Promise<WeeklyProgressData> => {
  return await apiRequest<WeeklyProgressData>('/analytics/weekly-progress');
};

export interface TopicAnalyticsData {
  topicAnalytics: Array<{
    topicId: number;
    topicTitle: string;
    totalDuration: number;
    totalDurationHours: number;
    accuracyRate: number;
    correctAnswers: number;
    totalAttempts: number;
  }>;
}

export const getTopicAnalytics = async (): Promise<TopicAnalyticsData> => {
  return await apiRequest<TopicAnalyticsData>('/analytics/topics');
};
