import apiRequest from './apiClient';

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
  return await apiRequest('/analytics/performance');
};

export const getActivityTimeline = async (
  days: number = 7,
): Promise<{
  date: string;
  studyTime: number;
  questionsAnswered: number;
}[]> => {
  return await apiRequest(`/analytics/activity?days=${days}`);
};

export const getWeakestTopics = async (
  limit: number = 5,
): Promise<{
  topicId: number;
  topicName: string;
  branchId: number;
  branchName: string;
  averageScore: number;
  totalQuestions: number;
  correctAnswers: number;
}[]> => {
  return await apiRequest(`/analytics/weakest-topics?limit=${limit}`);
};

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
  return await apiRequest('/analytics/improvement');
};

export const getStudyTimeDistribution = async (): Promise<{
  morning: number;
  afternoon: number;
  evening: number;
  night: number;
  totalHours: number;
}> => {
  return await apiRequest('/analytics/study-time-distribution');
};
