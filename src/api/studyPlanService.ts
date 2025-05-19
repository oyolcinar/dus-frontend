import apiRequest from './apiClient';
import { StudyPlan, StudySession, Topic } from '../types/models'; // Make sure these models are well-defined
// ApiResponse is implicitly handled by apiRequest

// --- Define interfaces for the *actual data payloads* your backend sends ---
// --- These will be the TData in apiRequest<TData> ---

// For GET /studyPlans (array) or GET /studyPlans/:id (single)
// or POST /studyPlans, PUT /studyPlans/:id, POST /studyPlans/:id/activate, POST /studyPlans/from-template
// The payload is a StudyPlan object (or array of them).
// The StudyPlan model should include: plan_id, user_id, title, description, start_date, end_date, is_custom, created_at, activities.
// And potentially dailyGoalMinutes, dailyGoalQuestions, isActive if these are part of the main StudyPlan model from backend.

// For DELETE /studyPlans/:id or POST /studyPlans/:id/deactivate
interface MessagePayload {
  // Reusable
  message: string;
}

// For GET /studyPlans/:id/progress
export interface StudyPlanProgressPayload {
  // Exporting as it's a complex return type
  planId: number;
  planName?: string;
  startDate: string;
  endDate: string;
  daysTotal: number;
  daysElapsed: number;
  daysRemaining: number;
  completion: number; // Overall plan completion percentage
  topicsProgress: Array<{
    topicId: number;
    topicName?: string;
    priority?: number; // Optional if not always present
    totalQuestions: number;
    questionsAnswered: number;
    correctAnswers: number;
    accuracy: number;
    completion: number; // Topic completion percentage
  }>;
  sessionsCompleted: number;
  totalQuestions: number; // Overall questions in plan
  questionsAnswered: number; // Overall questions answered
  correctAnswers: number; // Overall correct answers
  overallAccuracy: number;
  goalCompletion?: number; // Percentage of daily/weekly goals met
  studyTimeTotal: number; // Total study time for the plan
  studyTimeWeek?: number; // Study time this week for the plan
}

// For GET /studyPlans/daily-recommendations
interface DailyRecommendationPayload {
  topicId: number;
  topicName?: string;
  branchId?: number;
  branchName?: string;
  recommendedQuestions: number;
  recommendedMinutes: number;
  priority?: number;
  lastStudied?: string | null;
  accuracy?: number; // Can be null or 0 if not studied yet
}
type DailyRecommendationsListPayload = DailyRecommendationPayload[];

// For GET /topics (used for plan creation)
type AvailableTopicsPayload = Topic[]; // Array of Topic objects

// For GET /studyPlans/:id/sessions
interface StudyPlanSessionsPayload {
  sessions: StudySession[]; // StudySession model should be defined
  total: number; // Total number of sessions for pagination
}

// For GET /studyPlans/templates
interface StudyPlanTemplatePayload {
  id: number; // Template ID
  name: string;
  description: string;
  durationDays: number;
  topics: Array<{
    topicId: number;
    topicName?: string; // Make optional if not always present
    priority?: number;
  }>;
  dailyGoalMinutes: number;
  dailyGoalQuestions: number;
}
type StudyPlanTemplatesListPayload = StudyPlanTemplatePayload[];

// For GET /studyPlans/:id/analytics
interface StudyPlanAnalyticsPayload {
  dailyStudyTime: Array<{ date: string; minutes: number }>;
  topicDistribution: Array<{
    topicId: number;
    topicName?: string;
    percentage: number;
  }>;
  accuracyTrend: Array<{ date: string; accuracy: number }>;
  weakestTopics: Array<{
    topicId: number;
    topicName?: string;
    accuracy: number;
  }>;
  strongestTopics: Array<{
    topicId: number;
    topicName?: string;
    accuracy: number;
  }>;
}

// --- Service Input DTOs ---
// (Input for createStudyPlan is defined inline, which is fine)
// (Input for updateStudyPlan is defined inline, which is fine)

// --- Service Functions ---

export const createStudyPlan = async (
  name: string,
  description: string,
  topics: Array<{ topicId: number; priority: number }>,
  startDate: string,
  endDate: string,
  dailyGoalMinutes: number,
  dailyGoalQuestions: number,
): Promise<StudyPlan> => {
  // Assuming backend returns the full StudyPlan object
  const response = await apiRequest<StudyPlan>('/studyPlans', 'POST', { // Expecting a StudyPlan object
    name,
    description,
    topics,
    startDate,
    endDate,
    dailyGoalMinutes,
    dailyGoalQuestions,
  });
  if (!response.data)
    throw new Error(
      'Failed to create study plan: No data returned from server.',
    );
  return response.data;
};

export const getStudyPlans = async (): Promise<StudyPlan[]> => {
  const response = await apiRequest<StudyPlan[]>('/studyPlans'); // Expecting an array of StudyPlan
  return response.data || [];
};

export const getStudyPlanById = async (
  planId: number,
): Promise<StudyPlan | null> => {
  try {
    const response = await apiRequest<StudyPlan>(`/studyPlans/${planId}`); // Expecting a StudyPlan object
    return response.data === undefined ? null : response.data;
  } catch (error: any) {
    if (error.status === 404) {
      console.warn(`Study plan with ID ${planId} not found (404).`);
      return null;
    }
    console.error(`Error fetching study plan ID ${planId}:`, error);
    throw error;
  }
};

export const updateStudyPlan = async (
  planId: number,
  updates: Partial<{
    /* inline definition is fine, but ensure it matches backend expectations */
    name: string;
    description: string;
    topics: Array<{ topicId: number; priority: number }>;
    startDate: string;
    endDate: string;
    dailyGoalMinutes: number;
    dailyGoalQuestions: number;
    isActive: boolean;
  }>,
): Promise<StudyPlan> => {
  // Assuming backend returns the updated StudyPlan
  const response = await apiRequest<StudyPlan>(
    `/studyPlans/${planId}`,
    'PUT',
    updates,
  );
  if (!response.data)
    throw new Error(
      `Failed to update study plan with ID ${planId}: No data returned.`,
    );
  return response.data;
};

export const deleteStudyPlan = async (
  planId: number,
): Promise<MessagePayload> => {
  const response = await apiRequest<MessagePayload>(
    `/studyPlans/${planId}`,
    'DELETE',
  );
  if (!response.data || !response.data.message) {
    return { message: 'Study plan deleted successfully.' };
  }
  return response.data;
};

export const getActiveStudyPlan = async (): Promise<StudyPlan | null> => {
  try {
    // Backend might return 200 with plan data, or 200/204 with no data if none active, or 404.
    const response = await apiRequest<StudyPlan | null>('/studyPlans/active'); // TData can be StudyPlan or null
    // If apiRequest returns { data: null } for an empty successful response
    if (response.data === undefined || response.data === null) {
      return null;
    }
    return response.data;
  } catch (error: any) {
    // If 404 means "no active plan", treat it as a valid scenario returning null
    if (error.status === 404) {
      console.info('No active study plan found.');
      return null;
    }
    console.error('Error fetching active study plan:', error);
    throw error; // Re-throw other unexpected errors
  }
};

export const activateStudyPlan = async (planId: number): Promise<StudyPlan> => {
  const response = await apiRequest<StudyPlan>(
    `/studyPlans/${planId}/activate`,
    'POST',
  );
  if (!response.data)
    throw new Error(
      `Failed to activate study plan with ID ${planId}: No data.`,
    );
  return response.data;
};

export const deactivateStudyPlan = async (
  planId: number,
): Promise<MessagePayload> => {
  const response = await apiRequest<MessagePayload>(
    `/studyPlans/${planId}/deactivate`,
    'POST',
  );
  if (!response.data || !response.data.message) {
    return { message: 'Study plan deactivated successfully.' };
  }
  return response.data;
};

export const getStudyPlanProgress = async (
  planId: number,
): Promise<StudyPlanProgressPayload> => {
  const defaultProgress: StudyPlanProgressPayload = {
    // Define default for DRY
    planId,
    planName: '',
    startDate: '',
    endDate: '',
    daysTotal: 0,
    daysElapsed: 0,
    daysRemaining: 0,
    completion: 0,
    topicsProgress: [],
    sessionsCompleted: 0,
    totalQuestions: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    overallAccuracy: 0,
    goalCompletion: 0,
    studyTimeTotal: 0,
    studyTimeWeek: 0,
  };
  try {
    const response = await apiRequest<StudyPlanProgressPayload>(
      `/studyPlans/${planId}/progress`,
    );
    if (!response.data || typeof response.data !== 'object') {
      console.warn(
        `No progress data for study plan ${planId}, returning defaults.`,
      );
      return defaultProgress;
    }
    return {
      // Merge with defaults to ensure all fields are present
      ...defaultProgress,
      ...response.data,
      topicsProgress: response.data.topicsProgress || [], // Ensure topicsProgress is an array
    };
  } catch (error: any) {
    if (error.status === 404) {
      console.warn(
        `Progress for study plan ${planId} not found (404), returning defaults.`,
      );
    } else {
      console.error(`Error fetching progress for study plan ${planId}:`, error);
    }
    return defaultProgress;
  }
};

export const getRecommendedDailyTopics =
  async (): Promise<DailyRecommendationsListPayload> => {
    const response = await apiRequest<DailyRecommendationsListPayload>(
      '/studyPlans/daily-recommendations',
    );
    return response.data || [];
  };

export const getAvailableTopics = async (): Promise<AvailableTopicsPayload> => {
  // Assuming this endpoint returns a list of all Topic models
  const response = await apiRequest<AvailableTopicsPayload>('/topics');
  return response.data || [];
};

export const getStudyPlanSessions = async (
  planId: number,
  page: number = 1,
  limit: number = 10,
): Promise<StudyPlanSessionsPayload> => {
  const response = await apiRequest<StudyPlanSessionsPayload>(
    `/studyPlans/${planId}/sessions?page=${page}&limit=${limit}`,
  );
  if (!response.data || typeof response.data !== 'object') {
    console.warn(
      `No session data for study plan ${planId}, returning defaults.`,
    );
    return { sessions: [], total: 0 };
  }
  return {
    // Ensure sessions is an array
    sessions: response.data.sessions || [],
    total: response.data.total || 0,
  };
};

export const getStudyPlanTemplates =
  async (): Promise<StudyPlanTemplatesListPayload> => {
    const response = await apiRequest<StudyPlanTemplatesListPayload>(
      '/studyPlans/templates',
    );
    return response.data || [];
  };

export const createPlanFromTemplate = async (
  templateId: number,
  startDate: string,
): Promise<StudyPlan> => {
  const response = await apiRequest<StudyPlan>(
    '/studyPlans/from-template',
    'POST',
    { templateId, startDate },
  );
  if (!response.data)
    throw new Error(
      `Failed to create plan from template ${templateId}: No data.`,
    );
  return response.data;
};

export const getStudyPlanAnalytics = async (
  planId: number,
): Promise<StudyPlanAnalyticsPayload> => {
  const defaultAnalytics: StudyPlanAnalyticsPayload = {
    // Define default for DRY
    dailyStudyTime: [],
    topicDistribution: [],
    accuracyTrend: [],
    weakestTopics: [],
    strongestTopics: [],
  };
  try {
    const response = await apiRequest<StudyPlanAnalyticsPayload>(
      `/studyPlans/${planId}/analytics`,
    );
    if (!response.data || typeof response.data !== 'object') {
      console.warn(
        `No analytics data for study plan ${planId}, returning defaults.`,
      );
      return defaultAnalytics;
    }
    return {
      // Merge with defaults to ensure all array fields are initialized
      ...defaultAnalytics,
      ...response.data,
    };
  } catch (error: any) {
    if (error.status === 404) {
      console.warn(
        `Analytics for study plan ${planId} not found (404), returning defaults.`,
      );
    } else {
      console.error(
        `Error fetching analytics for study plan ${planId}:`,
        error,
      );
    }
    return defaultAnalytics;
  }
};
