import apiRequest from './apiClient';
import {
  UserQuestionHistory,
  UserCourseStats,
  UserTestHistory,
  UserPerformanceTrends,
  ReviewQuestion,
  UserPerformanceSummary,
} from '../types/models';

// --- Define interfaces for the *actual data payloads* your backend sends ---

// For GET /user-history/question/:questionId
interface QuestionAnsweredPayload {
  user_id: number;
  question_id: number;
  has_answered: boolean;
  answer_history: UserQuestionHistory[];
}

// For GET /user-history/test/:testId
type UserTestHistoryPayload = UserTestHistory[];

// For GET /user-history/course/:courseId
type UserCourseHistoryPayload = UserQuestionHistory[];

// For GET /user-history/questions
type CompleteQuestionHistoryPayload = UserQuestionHistory[];

// For GET /user-history/course-stats
type UserCourseStatsPayload = UserCourseStats[];

// For GET /user-history/incorrect-answers
type IncorrectAnswersPayload = ReviewQuestion[];

// For GET /user-history/trends
type PerformanceTrendsPayload = UserPerformanceTrends;

// For GET /user-history/review-questions
type ReviewQuestionsPayload = ReviewQuestion[];

// For GET /user-history/performance-summary
type PerformanceSummaryPayload = UserPerformanceSummary;

// --- Service Functions ---

// Check if user has answered a specific question
export const hasUserAnsweredQuestion = async (
  questionId: number,
): Promise<QuestionAnsweredPayload | null> => {
  try {
    const response = await apiRequest<QuestionAnsweredPayload>(
      `/user-history/question/${questionId}`,
    );
    return response.data || null;
  } catch (error: any) {
    if (error.status === 404) {
      console.warn(`Question history for ID ${questionId} not found (404).`);
      return null;
    }
    console.error(`Error fetching question history for ${questionId}:`, error);
    throw error;
  }
};

// Get user's history for a specific test
export const getUserTestHistory = async (
  testId: number,
): Promise<UserTestHistoryPayload> => {
  try {
    const response = await apiRequest<UserTestHistoryPayload>(
      `/user-history/test/${testId}`,
    );
    return response.data || [];
  } catch (error: any) {
    if (error.status === 404) {
      console.warn(`Test history for ID ${testId} not found (404).`);
      return [];
    }
    console.error(`Error fetching test history for ${testId}:`, error);
    throw error;
  }
};

// Get user's history for a specific course
export const getUserCourseHistory = async (
  courseId: number,
): Promise<UserCourseHistoryPayload> => {
  try {
    const response = await apiRequest<UserCourseHistoryPayload>(
      `/user-history/course/${courseId}`,
    );
    return response.data || [];
  } catch (error: any) {
    if (error.status === 404) {
      console.warn(`Course history for ID ${courseId} not found (404).`);
      return [];
    }
    console.error(`Error fetching course history for ${courseId}:`, error);
    throw error;
  }
};

// Get user's complete question history
export const getCompleteQuestionHistory = async (
  limit?: number,
  offset?: number,
): Promise<CompleteQuestionHistoryPayload> => {
  try {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('limit', limit.toString());
    if (offset) queryParams.append('offset', offset.toString());

    const url = `/user-history/questions${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;
    const response = await apiRequest<CompleteQuestionHistoryPayload>(url);
    return response.data || [];
  } catch (error: any) {
    console.error('Error fetching complete question history:', error);
    throw error;
  }
};

// Get user's course statistics
export const getUserCourseStats = async (): Promise<UserCourseStatsPayload> => {
  try {
    const response = await apiRequest<UserCourseStatsPayload>(
      '/user-history/course-stats',
    );
    return response.data || [];
  } catch (error: any) {
    console.error('Error fetching user course statistics:', error);
    throw error;
  }
};

// Get user's incorrect answers for review
export const getIncorrectAnswers = async (
  courseId?: number,
  courseType?: 'temel_dersler' | 'klinik_dersler',
  limit?: number,
): Promise<IncorrectAnswersPayload> => {
  try {
    const queryParams = new URLSearchParams();
    if (courseId) queryParams.append('courseId', courseId.toString());
    if (courseType) queryParams.append('courseType', courseType);
    if (limit) queryParams.append('limit', limit.toString());

    const url = `/user-history/incorrect-answers${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;
    const response = await apiRequest<IncorrectAnswersPayload>(url);
    return response.data || [];
  } catch (error: any) {
    console.error('Error fetching incorrect answers:', error);
    throw error;
  }
};

// Get user's performance trends
export const getPerformanceTrends = async (
  courseType?: 'temel_dersler' | 'klinik_dersler',
  period?: 'week' | 'month' | 'year',
): Promise<PerformanceTrendsPayload | null> => {
  try {
    const queryParams = new URLSearchParams();
    if (courseType) queryParams.append('courseType', courseType);
    if (period) queryParams.append('period', period);

    const url = `/user-history/trends${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;
    const response = await apiRequest<PerformanceTrendsPayload>(url);
    return response.data || null;
  } catch (error: any) {
    console.error('Error fetching performance trends:', error);
    throw error;
  }
};

// Get questions that need review (frequently missed)
export const getReviewQuestions = async (
  courseId?: number,
  courseType?: 'temel_dersler' | 'klinik_dersler',
  limit?: number,
): Promise<ReviewQuestionsPayload> => {
  try {
    const queryParams = new URLSearchParams();
    if (courseId) queryParams.append('courseId', courseId.toString());
    if (courseType) queryParams.append('courseType', courseType);
    if (limit) queryParams.append('limit', limit.toString());

    const url = `/user-history/review-questions${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;
    const response = await apiRequest<ReviewQuestionsPayload>(url);
    return response.data || [];
  } catch (error: any) {
    console.error('Error fetching review questions:', error);
    throw error;
  }
};

// Get comprehensive performance summary
export const getPerformanceSummary =
  async (): Promise<PerformanceSummaryPayload | null> => {
    try {
      const response = await apiRequest<PerformanceSummaryPayload>(
        '/user-history/performance-summary',
      );
      return response.data || null;
    } catch (error: any) {
      console.error('Error fetching performance summary:', error);
      throw error;
    }
  };
