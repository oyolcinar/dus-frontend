import apiRequest from './apiClient';
import {
  StudySession,
  Question,
  StudyProgress,
  Topic,
  UserTopicDetails,
  KlinikCourse,
  CourseStudyOverview,
  AllCoursesStatistics,
  StudyStatistics,
  PreferredCourse,
} from '../types/models';

// ===============================
// PAYLOAD TYPES FOR API RESPONSES
// ===============================

// For chronometer functionality
interface StartStudySessionRequest {
  topicId: number;
  notes?: string;
}

interface StartStudySessionResponse {
  message: string;
  sessionId: number;
  topic: {
    topicId: number;
    title: string;
    course: string;
  };
}

interface EndStudySessionRequest {
  endNotes?: string;
}

interface EndStudySessionResponse {
  message: string;
  session: StudySession;
}

interface ActiveStudySessionResponse {
  session_id?: number;
  user_id?: number;
  topic_id?: number;
  start_time?: string;
  notes?: string;
  topic_title?: string;
  course_title?: string;
  duration_minutes?: number;
}

interface StudySessionsResponse {
  sessions: StudySession[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

// For topic details management
interface UpdateTopicDetailsRequest {
  topicId: number;
  tekrarSayisi?: number;
  konuKaynaklari?: string[];
  soruBankasiKaynaklari?: string[];
  difficultyRating?: number; // 1-5
  notes?: string;
  isCompleted?: boolean;
}

interface UpdateTopicDetailsResponse {
  message: string;
  data: any;
}

// For preferred course management
interface SetPreferredCourseRequest {
  courseId: number;
}

interface SetPreferredCourseResponse {
  message: string;
  course: {
    courseId: number;
    title: string;
  };
}

interface GetPreferredCourseResponse {
  preferredCourse: PreferredCourse | null;
}

// Legacy study types
type DifficultyLevel = 'easy' | 'medium' | 'hard';

interface SubmitAnswerPayload {
  isCorrect: boolean;
  explanation?: string;
  correctAnswerId?: number;
}

interface EndSessionPayload {
  sessionId: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  timeSpent: number;
  completedAt: string;
}

type RecentSessionsPayload = StudySession[];

interface SessionDetailsPayload {
  session: StudySession;
  questions: Array<{
    id: number;
    text: string;
    userAnswerId?: number;
    userAnswerText?: string;
    correctAnswerId?: number;
    correctAnswerText?: string;
    isCorrect: boolean;
    timeSpent?: number;
    explanation?: string;
    answers?: Array<{
      id: number;
      text: string;
    }>;
  }>;
}

interface RecommendedTopicPayload {
  topicId: number;
  topicName?: string;
  branchId?: number;
  branchName?: string;
  accuracy?: number | null;
  priority?: number;
  lastStudied?: string | null;
}
type RecommendedTopicsListPayload = RecommendedTopicPayload[];

interface MessagePayload {
  message: string;
}

interface BookmarkedQuestionsPayload {
  questions: Question[];
  total: number;
}

interface StudyStatsPayload {
  totalSessions: number;
  totalQuestions: number;
  totalCorrect: number;
  totalIncorrect: number;
  averageAccuracy: number;
  totalStudyTime: number;
  averageSessionDuration: number;
  mostStudiedTopics: Array<{
    topicId: number;
    topicName?: string;
    questionsAnswered: number;
    accuracy: number;
  }>;
  weakestTopics: Array<{
    topicId: number;
    topicName?: string;
    accuracy: number;
    questionsAnswered: number;
  }>;
  studyTrend: Array<{
    date: string;
    questionsAnswered: number;
    accuracy: number;
    timeSpent: number;
  }>;
}

// ===============================
// NEW: ENHANCED STUDY TRACKING FUNCTIONS
// ===============================

/**
 * Start a new study session with chronometer
 */
export const startStudySession = async (
  topicId: number,
  notes?: string,
): Promise<StartStudySessionResponse> => {
  const response = await apiRequest<StartStudySessionResponse>(
    '/study/sessions/start',
    'POST',
    { topicId, notes },
  );

  if (!response.data) {
    throw new Error('Failed to start study session: No data returned.');
  }

  return response.data;
};

/**
 * End a study session
 */
export const endStudySession = async (
  sessionId: number,
  endNotes?: string,
): Promise<EndStudySessionResponse> => {
  const response = await apiRequest<EndStudySessionResponse>(
    `/study/sessions/${sessionId}/end`,
    'POST',
    { endNotes },
  );

  if (!response.data) {
    throw new Error('Failed to end study session: No data returned.');
  }

  return response.data;
};

/**
 * Get active study session for a topic
 */
export const getActiveStudySession = async (
  topicId: number,
): Promise<ActiveStudySessionResponse | null> => {
  try {
    const response = await apiRequest<ActiveStudySessionResponse>(
      `/study/sessions/active/${topicId}`,
    );
    return response.data || null;
  } catch (error: any) {
    if (error.status === 404) {
      return null;
    }
    console.error(`Error fetching active session for topic ${topicId}:`, error);
    throw error;
  }
};

/**
 * Get user's study sessions with pagination and filtering
 */
export const getUserStudySessions = async (
  page: number = 1,
  limit: number = 20,
  topicId?: number,
  courseId?: number,
): Promise<StudySessionsResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (topicId) params.append('topicId', topicId.toString());
  if (courseId) params.append('courseId', courseId.toString());

  const response = await apiRequest<StudySessionsResponse>(
    `/study/sessions?${params.toString()}`,
  );

  if (!response.data) {
    return {
      sessions: [],
      pagination: { page, limit, total: 0 },
    };
  }

  return response.data;
};

/**
 * Update user-specific topic details
 */
export const updateUserTopicDetails = async (
  details: UpdateTopicDetailsRequest,
): Promise<UpdateTopicDetailsResponse> => {
  const response = await apiRequest<UpdateTopicDetailsResponse>(
    '/study/topic-details',
    'POST',
    details,
  );

  if (!response.data) {
    throw new Error('Failed to update topic details: No data returned.');
  }

  return response.data;
};

/**
 * Get user-specific topic details
 */
export const getUserTopicDetails = async (
  topicId: number,
): Promise<UserTopicDetails | null> => {
  try {
    const response = await apiRequest<UserTopicDetails>(
      `/study/topic-details/${topicId}`,
    );
    return response.data || null;
  } catch (error: any) {
    if (error.status === 404) {
      return null;
    }
    console.error(`Error fetching topic details for ${topicId}:`, error);
    throw error;
  }
};

/**
 * Get all available klinik_dersler courses
 */
export const getKlinikCourses = async (): Promise<KlinikCourse[]> => {
  const response = await apiRequest<KlinikCourse[]>('/study/courses/klinik');
  return response.data || [];
};

/**
 * Get user study overview for a specific course
 */
export const getUserCourseStudyOverview = async (
  courseId: number,
): Promise<CourseStudyOverview[]> => {
  const response = await apiRequest<CourseStudyOverview[]>(
    `/study/overview/course/${courseId}`,
  );
  return response.data || [];
};

/**
 * Get user statistics across all klinik_dersler courses
 */
export const getUserAllCoursesStatistics = async (): Promise<
  AllCoursesStatistics[]
> => {
  const response = await apiRequest<AllCoursesStatistics[]>(
    '/study/overview/all-courses',
  );
  return response.data || [];
};

/**
 * Get overall user study statistics
 */
export const getUserStudyStatistics =
  async (): Promise<StudyStatistics | null> => {
    try {
      const response = await apiRequest<StudyStatistics>('/study/statistics');
      return response.data || null;
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      console.error('Error fetching study statistics:', error);
      throw error;
    }
  };

/**
 * Set user's preferred course
 */
export const setUserPreferredCourse = async (
  courseId: number,
): Promise<SetPreferredCourseResponse> => {
  const response = await apiRequest<SetPreferredCourseResponse>(
    '/study/preferred-course',
    'POST',
    { courseId },
  );

  if (!response.data) {
    throw new Error('Failed to set preferred course: No data returned.');
  }

  return response.data;
};

/**
 * Get user's preferred course
 */
export const getUserPreferredCourse =
  async (): Promise<PreferredCourse | null> => {
    try {
      const response = await apiRequest<GetPreferredCourseResponse>(
        '/study/preferred-course',
      );
      return response.data?.preferredCourse || null;
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      console.error('Error fetching preferred course:', error);
      throw error;
    }
  };

// ===============================
// UTILITY FUNCTIONS FOR ENHANCED STUDY TRACKING
// ===============================

/**
 * Check if user has an active study session for any topic
 */
export const hasActiveStudySession = async (): Promise<boolean> => {
  try {
    const sessions = await getUserStudySessions(1, 10);
    return sessions.sessions.some((session) => session.status === 'active');
  } catch (error) {
    console.error('Error checking for active sessions:', error);
    return false;
  }
};

/**
 * Get study session duration in different formats
 */
export const formatSessionDuration = (
  durationSeconds?: number,
): {
  seconds: number;
  minutes: number;
  hours: number;
  formatted: string;
} => {
  if (!durationSeconds) {
    return { seconds: 0, minutes: 0, hours: 0, formatted: '0m' };
  }

  const seconds = durationSeconds;
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  let formatted = '';
  if (hours > 0) {
    formatted = `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    formatted = `${minutes}m`;
  } else {
    formatted = `${seconds}s`;
  }

  return { seconds, minutes, hours, formatted };
};

/**
 * Calculate completion percentage for a course
 */
export const calculateCourseCompletion = (
  studiedTopics: number,
  totalTopics: number,
): number => {
  if (totalTopics === 0) return 0;
  return Math.round((studiedTopics / totalTopics) * 100);
};

/**
 * Get comprehensive topic analytics
 */
export const getTopicComprehensiveData = async (topicId: number) => {
  try {
    const [topicDetails, activeSessions] = await Promise.all([
      getUserTopicDetails(topicId),
      getActiveStudySession(topicId),
    ]);

    return {
      details: topicDetails,
      hasActiveSession: !!activeSessions?.session_id,
      activeSession: activeSessions,
    };
  } catch (error) {
    console.error(
      `Error fetching comprehensive data for topic ${topicId}:`,
      error,
    );
    return {
      details: null,
      hasActiveSession: false,
      activeSession: null,
    };
  }
};

// ===============================
// LEGACY STUDY FUNCTIONS (for backward compatibility)
// ===============================

export const startStudySessionLegacy = async (
  topicId?: number,
  subtopicId?: number,
  questionCount: number = 10,
  difficulty?: DifficultyLevel,
  previouslyIncorrect: boolean = false,
): Promise<StudySession> => {
  const response = await apiRequest<StudySession>(
    '/study/start-session',
    'POST',
    { topicId, subtopicId, questionCount, difficulty, previouslyIncorrect },
  );
  if (!response.data)
    throw new Error('Failed to start study session: No data returned.');
  return response.data;
};

export const getNextQuestion = async (
  sessionId: string,
): Promise<Question | null> => {
  try {
    const response = await apiRequest<Question>(
      `/study/sessions/${sessionId}/next-question`,
    );
    return response.data === undefined ? null : response.data;
  } catch (error: any) {
    if (error.status === 404) {
      console.warn(
        `No more questions for session ${sessionId} or session not found.`,
      );
      return null;
    }
    console.error(
      `Error fetching next question for session ${sessionId}:`,
      error,
    );
    throw error;
  }
};

export const submitAnswer = async (
  sessionId: string,
  questionId: number,
  answerId: number,
  timeSpent: number,
): Promise<SubmitAnswerPayload> => {
  const response = await apiRequest<SubmitAnswerPayload>(
    `/study/sessions/${sessionId}/submit-answer`,
    'POST',
    { questionId, answerId, timeSpent },
  );
  if (!response.data)
    throw new Error('Failed to submit answer: No data returned.');
  return response.data;
};

export const endStudySessionLegacy = async (
  sessionId: string,
): Promise<EndSessionPayload> => {
  const response = await apiRequest<EndSessionPayload>(
    `/study/sessions/${sessionId}/end`,
    'POST',
  );
  if (!response.data)
    throw new Error(
      `Failed to end study session ${sessionId}: No data returned.`,
    );
  return response.data;
};

export const getStudyProgress = async (): Promise<StudyProgress | null> => {
  try {
    const response = await apiRequest<StudyProgress>('/study/progress');
    return response.data === undefined ? null : response.data;
  } catch (error: any) {
    if (error.status === 404) {
      console.warn('Study progress not found for user.');
      return null;
    }
    console.error('Error fetching study progress:', error);
    throw error;
  }
};

export const getRecentSessions = async (
  limit: number = 5,
): Promise<RecentSessionsPayload> => {
  const response = await apiRequest<RecentSessionsPayload>(
    `/study/recent-sessions?limit=${limit}`,
  );
  return response.data || [];
};

export const getSessionDetails = async (
  sessionId: string,
): Promise<SessionDetailsPayload | null> => {
  try {
    const response = await apiRequest<SessionDetailsPayload>(
      `/study/sessions/${sessionId}`,
    );
    if (!response.data || typeof response.data !== 'object') {
      console.warn(
        `No session details for session ${sessionId}, or data malformed.`,
      );
      return null;
    }
    return {
      ...response.data,
      questions: response.data.questions || [],
    };
  } catch (error: any) {
    if (error.status === 404) {
      console.warn(`Session details not found for session ${sessionId} (404).`);
      return null;
    }
    console.error(`Error fetching session details for ${sessionId}:`, error);
    throw error;
  }
};

export const getRecommendedTopics = async (
  limit: number = 3,
): Promise<RecommendedTopicsListPayload> => {
  const response = await apiRequest<RecommendedTopicsListPayload>(
    `/study/recommended-topics?limit=${limit}`,
  );
  return response.data || [];
};

export const flagQuestion = async (
  questionId: number,
  reason?: string,
): Promise<MessagePayload> => {
  const response = await apiRequest<MessagePayload>(
    '/study/flag-question',
    'POST',
    { questionId, reason },
  );
  if (!response.data || !response.data.message) {
    return { message: 'Question flagged successfully.' };
  }
  return response.data;
};

export const bookmarkQuestion = async (
  questionId: number,
): Promise<MessagePayload> => {
  const response = await apiRequest<MessagePayload>(
    '/study/bookmark-question',
    'POST',
    { questionId },
  );
  if (!response.data || !response.data.message) {
    return { message: 'Question bookmarked successfully.' };
  }
  return response.data;
};

export const getBookmarkedQuestions = async (
  page: number = 1,
  limit: number = 20,
): Promise<BookmarkedQuestionsPayload> => {
  const response = await apiRequest<BookmarkedQuestionsPayload>(
    `/study/bookmarked-questions?page=${page}&limit=${limit}`,
  );
  if (!response.data || typeof response.data !== 'object') {
    console.warn('No bookmarked questions data, returning defaults.');
    return { questions: [], total: 0 };
  }
  return {
    questions: response.data.questions || [],
    total: response.data.total || 0,
  };
};

export const getStudyStats = async (): Promise<StudyStatsPayload> => {
  const defaultStats: StudyStatsPayload = {
    totalSessions: 0,
    totalQuestions: 0,
    totalCorrect: 0,
    totalIncorrect: 0,
    averageAccuracy: 0,
    totalStudyTime: 0,
    averageSessionDuration: 0,
    mostStudiedTopics: [],
    weakestTopics: [],
    studyTrend: [],
  };
  try {
    const response = await apiRequest<StudyStatsPayload>('/study/stats');
    if (!response.data || typeof response.data !== 'object') {
      console.warn('No study stats data received, returning defaults.');
      return defaultStats;
    }
    return {
      ...defaultStats,
      ...response.data,
    };
  } catch (error: any) {
    console.error('Error fetching study stats:', error);
    return defaultStats;
  }
};
