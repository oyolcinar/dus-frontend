import apiRequest from './apiClient';
import { handleStudySessionCompleted } from './achievementService'; // Achievement integration
import {
  Question,
  Course,
  PreferredCourse,
  StudyStatistics,
} from '../types/models';

// ===============================
// COURSE-BASED STUDY TRACKING TYPES
// ===============================

// For chronometer functionality (course-based)
interface StartStudySessionRequest {
  courseId: number;
  notes?: string;
}

interface StartStudySessionResponse {
  message: string;
  session: {
    sessionId: number;
    courseId: number;
    courseTitle: string;
    startTime: string;
    notes?: string;
  };
}

interface EndStudySessionResponse {
  message: string;
  session: {
    sessionId: number;
    courseId: number;
    startTime: string;
    endTime: string;
    studyDurationSeconds: number;
    breakDurationSeconds: number;
    totalDurationSeconds: number;
    studyDurationMinutes: number;
    breakDurationMinutes: number;
  };
}

interface ActiveStudySessionResponse {
  activeSession: {
    sessionId: number;
    courseId: number;
    courseTitle: string;
    courseDescription?: string;
    startTime: string;
    currentDurationSeconds: number;
    currentStudyDurationSeconds: number;
    breakDurationSeconds: number;
    currentDurationMinutes: number;
    currentStudyDurationMinutes: number;
    breakDurationMinutes: number;
    notes?: string;
  } | null;
}

interface AddBreakTimeResponse {
  message: string;
  breakDurationSeconds: number;
  breakDurationMinutes: number;
  totalBreakSeconds: number;
  totalBreakMinutes: number;
}

// Course study session interface
export interface CourseStudySession {
  sessionId: number;
  courseId: number;
  courseTitle?: string;
  courseDescription?: string;
  startTime: string;
  endTime?: string | null;
  studyDurationSeconds?: number;
  breakDurationSeconds?: number;
  totalDurationSeconds?: number;
  studyDurationMinutes?: number;
  breakDurationMinutes?: number;
  sessionDate: string;
  sessionStatus: 'active' | 'completed' | 'paused';
  notes?: string;
}

interface StudySessionsResponse {
  sessions: CourseStudySession[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

// For course progress management
interface UpdateCourseProgressRequest {
  courseId: number;
  tekrarSayisi?: number;
  konuKaynaklari?: string[];
  soruBankasiKaynaklari?: string[];
  difficultyRating?: number; // 1-5
  completionPercentage?: number;
  notes?: string;
  isCompleted?: boolean;
}

interface UpdateCourseProgressResponse {
  message: string;
  progress: {
    courseId: number;
    userId: number;
    tekrarSayisi: number;
    difficultyRating?: number;
    completionPercentage: number;
    isCompleted: boolean;
    lastStudiedAt: string;
  };
}

// Course progress data
export interface CourseProgress {
  courseId: number;
  userId: number;
  tekrarSayisi: number;
  konuKaynaklari?: string[] | null;
  soruBankasiKaynaklari?: string[] | null;
  totalStudyTimeSeconds: number;
  totalBreakTimeSeconds: number;
  totalSessionCount: number;
  totalStudyTimeMinutes: number;
  totalStudyTimeHours: number;
  lastStudiedAt?: string | null;
  difficultyRating?: number | null;
  completionPercentage: number;
  isCompleted: boolean;
  notes?: string | null;
}

interface CourseProgressResponse {
  progress: CourseProgress | null;
}

// Course completion response
interface MarkCourseCompletedResponse {
  message: string;
  course: {
    courseId: number;
    courseTitle: string;
    userId: number;
    completedAt: string;
    completionPercentage: number;
  };
}

// User study overview for all courses
export interface UserCourseOverview {
  courseId: number;
  courseTitle: string;
  courseDescription?: string;
  courseType: string;
  tekrarSayisi: number;
  konuKaynaklari?: string[] | null;
  soruBankasiKaynaklari?: string[] | null;
  totalStudyTimeSeconds: number;
  totalBreakTimeSeconds: number;
  totalSessionCount: number;
  totalStudyTimeMinutes: number;
  totalStudyTimeHours: number;
  lastStudiedAt?: string | null;
  difficultyRating?: number | null;
  completionPercentage: number;
  isCompleted: boolean;
  activeSessionId?: number | null;
  notes?: string | null;
}

interface UserCoursesOverviewResponse {
  coursesOverview: UserCourseOverview[];
  totalCourses: number;
  completedCourses: number;
  coursesInProgress: number;
}

// Overall study statistics
// export interface StudyStatistics {
//   totalSessions: number;
//   totalStudyTimeSeconds: number;
//   totalBreakTimeSeconds: number;
//   totalStudyTimeHours: number;
//   totalBreakTimeHours: number;
//   longestSessionSeconds: number;
//   longestSessionMinutes: number;
//   averageSessionSeconds: number;
//   averageSessionMinutes: number;
//   recentStudyTimeSeconds: number;
//   recentStudyTimeHours: number;
//   dailyStudyTime: Array<{
//     study_date: string;
//     total_duration: number;
//   }>;
//   studyTimeByCourse: Array<{
//     course_id: number;
//     course_title: string;
//     total_duration: number;
//   }>;
// }

// Preferred course management
interface SetPreferredCourseRequest {
  courseId: number;
}

interface SetPreferredCourseResponse {
  message: string;
  course: {
    courseId: number;
    title: string;
    courseType: string;
  };
}

interface GetPreferredCourseResponse {
  preferredCourse: PreferredCourse | null;
}

// Generic message response
interface MessagePayload {
  message: string;
}

// Legacy study types (for backward compatibility)
type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface LegacyStudySession {
  session_id: string;
  user_id: number;
  topic_id?: number;
  subtopic_id?: number;
  start_time: string;
  end_time?: string | null;
  status: 'active' | 'completed';
  question_count: number;
  correct_answers: number;
  score: number;
  created_at: string;
}

interface EndSessionPayload {
  sessionId: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  timeSpent: number;
  completedAt: string;
}

interface SubmitAnswerPayload {
  isCorrect: boolean;
  explanation?: string;
  correctAnswerId?: number;
}

// ===============================
// NEW: COURSE-BASED STUDY TRACKING FUNCTIONS WITH ACHIEVEMENT INTEGRATION
// ===============================

/**
 * Start a new course study session with chronometer
 */
export const startStudySession = async (
  courseId: number,
  notes?: string,
): Promise<StartStudySessionResponse> => {
  const response = await apiRequest<StartStudySessionResponse>(
    '/study/sessions/start',
    'POST',
    { courseId, notes },
  );

  if (!response.data) {
    throw new Error('Failed to start study session: No data returned.');
  }

  return response.data;
};

/**
 * End a study session - ENHANCED with achievement checking
 */
export const endStudySession = async (
  sessionId: number,
  notes?: string,
): Promise<EndStudySessionResponse & { achievementCheck?: any }> => {
  const response = await apiRequest<EndStudySessionResponse>(
    `/study/sessions/${sessionId}/end`,
    'POST',
    { notes },
  );

  if (!response.data) {
    throw new Error('Failed to end study session: No data returned.');
  }

  // Trigger achievement check after successful study session completion
  let achievementCheck = null;
  try {
    achievementCheck = await handleStudySessionCompleted(response.data.session);
  } catch (error) {
    console.error('Achievement check failed after study session:', error);
    // Don't throw - achievement check failure shouldn't break study session
  }

  return {
    ...response.data,
    achievementCheck,
  };
};

/**
 * Add break time to active study session (mola)
 */
export const addBreakTime = async (
  sessionId: number,
  breakDurationSeconds: number,
): Promise<AddBreakTimeResponse> => {
  const response = await apiRequest<AddBreakTimeResponse>(
    `/study/sessions/${sessionId}/break`,
    'POST',
    { breakDurationSeconds },
  );

  if (!response.data) {
    throw new Error('Failed to add break time: No data returned.');
  }

  return response.data;
};

/**
 * Get active study session for current user
 */
export const getActiveStudySession = async (): Promise<{
  sessionId: number;
  courseId: number;
  courseTitle: string;
  courseDescription?: string;
  startTime: string;
  currentDurationSeconds: number;
  currentStudyDurationSeconds: number;
  breakDurationSeconds: number;
  currentDurationMinutes: number;
  currentStudyDurationMinutes: number;
  breakDurationMinutes: number;
  notes?: string;
} | null> => {
  try {
    const response = await apiRequest<ActiveStudySessionResponse>(
      '/study/sessions/active',
    );
    return response.data?.activeSession || null;
  } catch (error: any) {
    if (error.status === 404) {
      return null;
    }
    console.error('Error fetching active study session:', error);
    throw error;
  }
};

/**
 * Get user's study sessions with pagination and filtering
 */
export const getUserStudySessions = async (
  page: number = 1,
  limit: number = 20,
  courseId?: number,
): Promise<StudySessionsResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

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

// ===============================
// COURSE PROGRESS MANAGEMENT
// ===============================

/**
 * Update user course progress - ENHANCED with achievement checking
 */
export const updateUserCourseProgress = async (
  details: UpdateCourseProgressRequest,
): Promise<UpdateCourseProgressResponse & { achievementCheck?: any }> => {
  const response = await apiRequest<UpdateCourseProgressResponse>(
    '/study/progress',
    'POST',
    details,
  );

  if (!response.data) {
    throw new Error('Failed to update course progress: No data returned.');
  }

  // If course is marked as completed, trigger achievement check
  let achievementCheck = null;
  if (details.isCompleted) {
    try {
      achievementCheck = await handleStudySessionCompleted({
        course_id: details.courseId,
        completed: true,
      });
    } catch (error) {
      console.error('Achievement check failed after course completion:', error);
    }
  }

  return {
    ...response.data,
    achievementCheck,
  };
};

/**
 * Get user course progress
 */
export const getUserCourseProgress = async (
  courseId: number,
): Promise<CourseProgress | null> => {
  try {
    const response = await apiRequest<CourseProgressResponse>(
      `/study/progress/${courseId}`,
    );
    return response.data?.progress || null;
  } catch (error: any) {
    if (error.status === 404) {
      return null;
    }
    console.error(`Error fetching course progress for ${courseId}:`, error);
    throw error;
  }
};

/**
 * Mark course as completed
 */
export const markCourseCompleted = async (
  courseId: number,
): Promise<MarkCourseCompletedResponse> => {
  const response = await apiRequest<MarkCourseCompletedResponse>(
    `/study/courses/${courseId}/complete`,
    'POST',
  );

  if (!response.data) {
    throw new Error('Failed to mark course as completed: No data returned.');
  }

  return response.data;
};

// ===============================
// COURSE & USER OVERVIEW
// ===============================

/**
 * Get all available courses
 */
export const getAllCourses = async (
  courseType?: 'temel_dersler' | 'klinik_dersler',
): Promise<Course[]> => {
  const params = courseType ? `?courseType=${courseType}` : '';
  const response = await apiRequest<Course[]>(`/study/courses${params}`);
  return response.data || [];
};

/**
 * Get user study overview for all courses
 */
export const getUserAllCoursesOverview = async (): Promise<{
  coursesOverview: UserCourseOverview[];
  totalCourses: number;
  completedCourses: number;
  coursesInProgress: number;
}> => {
  const response =
    await apiRequest<UserCoursesOverviewResponse>('/study/overview');

  if (!response.data) {
    return {
      coursesOverview: [],
      totalCourses: 0,
      completedCourses: 0,
      coursesInProgress: 0,
    };
  }

  return response.data;
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

// ===============================
// PREFERRED COURSE MANAGEMENT
// ===============================

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
// ACHIEVEMENT-AWARE UTILITY FUNCTIONS
// ===============================

/**
 * Check if user has an active study session for any course
 */
export const hasActiveStudySession = async (): Promise<boolean> => {
  try {
    const activeSession = await getActiveStudySession();
    return !!activeSession;
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
  studiedSessions: number,
  totalExpectedSessions: number,
): number => {
  if (totalExpectedSessions === 0) return 0;
  return Math.round((studiedSessions / totalExpectedSessions) * 100);
};

/**
 * Get comprehensive course study data
 */
export const getCourseComprehensiveStudyData = async (courseId: number) => {
  try {
    const [courseProgress, studySessions, activeSession] = await Promise.all([
      getUserCourseProgress(courseId),
      getUserStudySessions(1, 10, courseId),
      getActiveStudySession(),
    ]);

    return {
      progress: courseProgress,
      recentSessions: studySessions.sessions,
      hasActiveSession: activeSession?.courseId === courseId,
      activeSession:
        activeSession?.courseId === courseId ? activeSession : null,
    };
  } catch (error) {
    console.error(
      `Error fetching comprehensive study data for course ${courseId}:`,
      error,
    );
    return {
      progress: null,
      recentSessions: [],
      hasActiveSession: false,
      activeSession: null,
    };
  }
};

// Complete study session with comprehensive feedback
export const completeStudySessionWithFeedback = async (
  sessionId: number,
  endNotes?: string,
): Promise<{
  session: EndStudySessionResponse['session'];
  achievements?: any;
  studyStats?: StudyStatistics;
  message: string;
}> => {
  try {
    // End the study session with achievement checking
    const sessionResult = await endStudySession(sessionId, endNotes);

    // Get updated study statistics
    const studyStatsResult = await getUserStudyStatistics();

    // Prepare feedback message
    let message = 'Study session completed successfully!';
    if (sessionResult.achievementCheck?.newAchievements > 0) {
      message += ` 🎉 You earned ${
        sessionResult.achievementCheck.newAchievements
      } new achievement${
        sessionResult.achievementCheck.newAchievements > 1 ? 's' : ''
      }!`;
    }

    return {
      session: sessionResult.session,
      achievements: sessionResult.achievementCheck,
      studyStats: studyStatsResult || undefined,
      message,
    };
  } catch (error) {
    console.error('Error completing study session with feedback:', error);
    throw error;
  }
};

// Get study session summary with achievements
export const getStudySessionSummary = async (
  sessionId: number,
): Promise<{
  session: CourseStudySession | null;
  duration: string;
  achievements: any;
  nextMilestone?: string;
}> => {
  try {
    const sessions = await getUserStudySessions(1, 50);
    const session = sessions.sessions.find((s) => s.sessionId === sessionId);

    if (!session) {
      return {
        session: null,
        duration: '0m',
        achievements: null,
      };
    }

    const duration = formatSessionDuration(session.studyDurationSeconds || 0);

    // Check for any achievements that might have been earned
    const achievementService = await import('./achievementService');
    const userProgress = await achievementService.getUserAchievementProgress();

    // Find the closest achievement to completion
    const nextMilestone = userProgress
      .filter((progress) => progress.overall_progress < 100)
      .sort((a, b) => b.overall_progress - a.overall_progress)[0];

    return {
      session,
      duration: duration.formatted,
      achievements: null, // Would be populated if achievements were earned during this session
      nextMilestone: nextMilestone
        ? `${nextMilestone.overall_progress}% complete for "${nextMilestone.name}"`
        : undefined,
    };
  } catch (error) {
    console.error('Error getting study session summary:', error);
    throw error;
  }
};

// ===============================
// LEGACY STUDY FUNCTIONS (for backward compatibility) - ENHANCED
// ===============================

export const startStudySessionLegacy = async (
  topicId?: number,
  subtopicId?: number,
  questionCount: number = 10,
  difficulty?: DifficultyLevel,
  previouslyIncorrect: boolean = false,
): Promise<LegacyStudySession> => {
  console.warn(
    'startStudySessionLegacy is deprecated. Use course-based study sessions instead.',
  );

  const response = await apiRequest<LegacyStudySession>(
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
  console.warn(
    'getNextQuestion is deprecated. Course-based study sessions do not use questions in the same way.',
  );

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
  console.warn(
    'submitAnswer is deprecated. Course-based study sessions do not use questions in the same way.',
  );

  const response = await apiRequest<SubmitAnswerPayload>(
    `/study/sessions/${sessionId}/submit-answer`,
    'POST',
    { questionId, answerId, timeSpent },
  );
  if (!response.data)
    throw new Error('Failed to submit answer: No data returned.');
  return response.data;
};

// ENHANCED: Legacy end session with achievement checking
export const endStudySessionLegacy = async (
  sessionId: string,
): Promise<EndSessionPayload & { achievementCheck?: any }> => {
  console.warn(
    'endStudySessionLegacy is deprecated. Use course-based study sessions instead.',
  );

  const response = await apiRequest<EndSessionPayload>(
    `/study/sessions/${sessionId}/end`,
    'POST',
  );

  if (!response.data)
    throw new Error(
      `Failed to end study session ${sessionId}: No data returned.`,
    );

  // Trigger achievement check for legacy sessions too
  let achievementCheck = null;
  try {
    achievementCheck = await handleStudySessionCompleted({
      sessionId,
      score: response.data.score,
      timeSpent: response.data.timeSpent,
    });
  } catch (error) {
    console.error(
      'Achievement check failed after legacy study session:',
      error,
    );
  }

  return {
    ...response.data,
    achievementCheck,
  };
};

// ===============================
// DEPRECATED TOPIC-BASED FUNCTIONS
// ===============================

/**
 * @deprecated Topic-based study sessions are deprecated. Use course-based sessions instead.
 */
export const startTopicStudySession = async (
  topicId: number,
  notes?: string,
): Promise<MessagePayload> => {
  console.warn(
    'startTopicStudySession is deprecated. Use course-based study sessions instead.',
  );

  return {
    message:
      'Topic-based study sessions have been deprecated. Use course-based study sessions instead: startStudySession(courseId, notes)',
  };
};

/**
 * @deprecated Topic-based progress tracking is deprecated. Use course-based progress instead.
 */
export const updateUserTopicDetails = async (
  topicId: number,
  details: any,
): Promise<MessagePayload> => {
  console.warn(
    'updateUserTopicDetails is deprecated. Use course-based progress tracking instead.',
  );

  return {
    message:
      'Topic-based progress tracking has been deprecated. Use course-based progress tracking instead: updateUserCourseProgress()',
  };
};

/**
 * @deprecated Topic-based details retrieval is deprecated. Use course-based progress instead.
 */
export const getUserTopicDetails = async (topicId: number): Promise<null> => {
  console.warn(
    'getUserTopicDetails is deprecated. Use course-based progress tracking instead.',
  );

  return null;
};

// Other legacy functions would follow the same pattern...
export const getRecentSessions = async (limit: number = 5): Promise<any[]> => {
  console.warn(
    'getRecentSessions is deprecated. Use getUserStudySessions instead.',
  );
  return [];
};

export const getSessionDetails = async (sessionId: string): Promise<any> => {
  console.warn('getSessionDetails is deprecated for course-based sessions.');
  return null;
};

export const getRecommendedTopics = async (
  limit: number = 3,
): Promise<any[]> => {
  console.warn(
    'getRecommendedTopics is deprecated. Course-based system recommends courses instead.',
  );
  return [];
};

export const flagQuestion = async (
  questionId: number,
  reason?: string,
): Promise<MessagePayload> => {
  console.warn('flagQuestion is deprecated in course-based study system.');
  return {
    message: 'Question flagging is not available in course-based study system.',
  };
};

export const bookmarkQuestion = async (
  questionId: number,
): Promise<MessagePayload> => {
  console.warn('bookmarkQuestion is deprecated in course-based study system.');
  return {
    message:
      'Question bookmarking is not available in course-based study system.',
  };
};

export const getBookmarkedQuestions = async (
  page: number = 1,
  limit: number = 20,
): Promise<{ questions: any[]; total: number }> => {
  console.warn(
    'getBookmarkedQuestions is deprecated in course-based study system.',
  );
  return { questions: [], total: 0 };
};

export const getStudyStats = async (): Promise<any> => {
  console.warn(
    'getStudyStats is deprecated. Use getUserStudyStatistics instead.',
  );
  return {
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
};

export const getStudyProgress = async (): Promise<any> => {
  console.warn(
    'getStudyProgress is deprecated. Use getUserCourseProgress instead.',
  );
  return null;
};
