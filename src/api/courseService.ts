import apiRequest from './apiClient';
import { Course, Topic, Subtopic, CourseStatistics } from '../types/models';

// ===============================
// PAYLOAD TYPES FOR COURSE-BASED API RESPONSES
// ===============================

// For GET /courses
type CoursesPayload = Course[];

// For GET /courses/type/:courseType
type CoursesByTypePayload = Course[];

// For GET /courses/:courseId
// Backend returns a Course object with topics array embedded
interface CourseWithTopicsPayload extends Course {
  topics?: Topic[];
  userProgress?: CourseProgressData | null;
}

// For GET /courses/:courseId/stats
type CourseStatsPayload = CourseStatistics;

// For GET /topics/course/:courseId (still exists for content management)
interface TopicsResponse {
  course: {
    courseId: number;
    title: string;
    courseType: string;
  };
  topics: Topic[];
  totalTopics: number;
}

// For GET /topics/:topicId (still exists for content management)
interface TopicWithSubtopicsPayload extends Topic {
  subtopics?: Subtopic[];
  subtopicCount?: number;
}

// For GET /subtopics/topic/:topicId (still exists for content management)
type SubtopicsPayload = Subtopic[];

// For POST /courses (Create Course)
interface CreateCoursePayload {
  message: string;
  course: Course;
}

// For PUT /courses/:id (Update Course)
interface UpdateCoursePayload {
  message: string;
  course: Course;
}

// For course progress tracking (NEW COURSE-BASED SYSTEM)
export interface CourseProgressData {
  courseId: number;
  userId: number;
  studyTimeSeconds: number;
  breakTimeSeconds: number;
  sessionCount: number;
  completionPercentage: number;
  isCompleted: boolean;
  difficultyRating?: number | null;
  tekrarSayisi?: number;
  lastStudiedAt?: string | null;
  konuKaynaklari?: string[] | null;
  soruBankasiKaynaklari?: string[] | null;
  notes?: string | null;
  activeSessionId?: number | null;
}

// For course progress response
interface CourseProgressResponse {
  course: {
    courseId: number;
    title: string;
    description?: string;
    courseType: string;
  };
  progress: CourseProgressData | null;
}

// For course study sessions
export interface CourseStudySession {
  sessionId: number;
  startTime: string;
  endTime?: string | null;
  studyDurationSeconds?: number;
  breakDurationSeconds?: number;
  totalDurationSeconds?: number;
  studyDurationMinutes?: number;
  breakDurationMinutes?: number;
  sessionDate: string;
  sessionStatus: 'active' | 'completed' | 'paused';
  notes?: string | null;
}

// For course study sessions response
interface CourseStudySessionsResponse {
  course: {
    courseId: number;
    title: string;
    courseType: string;
  };
  sessions: CourseStudySession[];
  totalSessions: number;
}

// For starting study session
interface StartStudyingResponse {
  message: string;
  session: {
    sessionId: number;
    courseId: number;
    courseTitle: string;
    startTime: string;
    notes?: string;
  };
}

// For course completion
interface MarkCourseCompletedResponse {
  message: string;
  course: {
    courseId: number;
    title: string;
    completedAt: string;
    completionPercentage: number;
  };
}

// For user course overview
export interface UserCourseOverview {
  courseId: number;
  courseTitle: string;
  courseDescription?: string;
  courseType: string;
  studyTimeSeconds: number;
  breakTimeSeconds: number;
  sessionCount: number;
  completionPercentage: number;
  isCompleted: boolean;
  difficultyRating?: number | null;
  tekrarSayisi: number;
  lastStudiedAt?: string | null;
}

interface UserCourseOverviewResponse {
  overview: {
    totalCourses: number;
    studiedCourses: number;
    completedCourses: number;
    totalStudyTimeHours: number;
    totalSessions: number;
    averageCompletionPercentage: number;
  };
  courses: UserCourseOverview[];
}

// For preferred course
interface PreferredCourseResponse {
  preferredCourse: {
    courseId: number;
    title: string;
    description?: string;
    courseType: string;
    imageUrl?: string;
  } | null;
}

interface SetPreferredCourseResponse {
  message: string;
  preferredCourse: {
    courseId: number;
    title: string;
    courseType: string;
  };
}

// For trending courses
interface TrendingCoursesResponse {
  trendingCourses: Array<{
    courseId: number;
    title: string;
    description?: string;
    courseType: string;
    imageUrl?: string;
    sessionCount: number;
    trending: boolean;
  }>;
}

// Message payload for simple responses
interface MessagePayload {
  message: string;
}

// ===============================
// SERVICE INPUT DTOs
// ===============================

export interface CreateCourseRequest {
  title: string;
  description?: string;
  imageUrl?: string;
  courseType: 'temel_dersler' | 'klinik_dersler';
}

export interface UpdateCourseRequest {
  title?: string;
  description?: string;
  imageUrl?: string;
  courseType?: 'temel_dersler' | 'klinik_dersler';
}

export interface UpdateCourseProgressRequest {
  tekrarSayisi?: number;
  konuKaynaklari?: string[];
  soruBankasiKaynaklari?: string[];
  difficultyRating?: number; // 1-5
  completionPercentage?: number; // 0-100
  notes?: string;
  isCompleted?: boolean;
}

// ===============================
// COURSE CRUD FUNCTIONS
// ===============================

export const getAllCourses = async (
  subscriptionType?: 'free' | 'premium',
  courseType?: 'temel_dersler' | 'klinik_dersler',
  withProgress: boolean = false,
): Promise<CoursesPayload> => {
  const params = new URLSearchParams();
  if (subscriptionType) params.append('subscriptionType', subscriptionType);
  if (courseType) params.append('courseType', courseType);
  if (withProgress) params.append('withProgress', 'true');

  const queryString = params.toString();
  const url = queryString.length > 0 ? `/courses?${queryString}` : '/courses';

  const response = await apiRequest<CoursesPayload>(url);
  return response.data || [];
};

export const getCoursesByType = async (
  courseType: 'temel_dersler' | 'klinik_dersler',
): Promise<CoursesByTypePayload> => {
  const response = await apiRequest<CoursesByTypePayload>(
    `/courses/type/${courseType}`,
  );
  return response.data || [];
};

export const getCourseById = async (
  courseId: number,
): Promise<CourseWithTopicsPayload | null> => {
  try {
    const response = await apiRequest<CourseWithTopicsPayload>(
      `/courses/${courseId}`,
    );
    if (!response.data) {
      console.warn(`Course with ID ${courseId} not found or no data returned.`);
      return null;
    }
    // Ensure topics is at least an empty array if missing from backend response
    return {
      ...response.data,
      topics: response.data.topics || [],
    };
  } catch (error: any) {
    if (error.status === 404) {
      console.warn(`Course with ID ${courseId} not found (404).`);
      return null;
    }
    console.error(`Error fetching course ${courseId}:`, error);
    throw error;
  }
};

export const getCourseStats = async (
  courseId: number,
): Promise<CourseStatsPayload | null> => {
  try {
    const response = await apiRequest<CourseStatsPayload>(
      `/courses/${courseId}/stats`,
    );
    return response.data || null;
  } catch (error: any) {
    if (error.status === 404) {
      console.warn(`Course statistics for ID ${courseId} not found (404).`);
      return null;
    }
    console.error(`Error fetching course statistics for ${courseId}:`, error);
    throw error;
  }
};

export const createCourse = async (
  courseData: CreateCourseRequest,
): Promise<CreateCoursePayload> => {
  const response = await apiRequest<CreateCoursePayload>(
    '/courses',
    'POST',
    courseData,
  );
  if (!response.data) {
    throw new Error('Failed to create course: No data returned.');
  }
  return response.data;
};

export const updateCourse = async (
  courseId: number,
  courseData: UpdateCourseRequest,
): Promise<UpdateCoursePayload> => {
  const response = await apiRequest<UpdateCoursePayload>(
    `/courses/${courseId}`,
    'PUT',
    courseData,
  );
  if (!response.data) {
    throw new Error(`Failed to update course ${courseId}: No data returned.`);
  }
  return response.data;
};

export const deleteCourse = async (
  courseId: number,
): Promise<MessagePayload> => {
  const response = await apiRequest<MessagePayload>(
    `/courses/${courseId}`,
    'DELETE',
  );
  if (!response.data) {
    return { message: 'Course deleted successfully.' };
  }
  return response.data;
};

// ===============================
// COURSE STUDY SESSION FUNCTIONS
// ===============================

export const startStudyingCourse = async (
  courseId: number,
  notes?: string,
): Promise<StartStudyingResponse> => {
  const response = await apiRequest<StartStudyingResponse>(
    `/courses/${courseId}/start-studying`,
    'POST',
    { notes },
  );
  if (!response.data) {
    throw new Error('Failed to start studying course: No data returned.');
  }
  return response.data;
};

export const getCourseStudySessions = async (
  courseId: number,
  limit: number = 20,
): Promise<CourseStudySessionsResponse> => {
  const response = await apiRequest<CourseStudySessionsResponse>(
    `/courses/${courseId}/sessions?limit=${limit}`,
  );
  if (!response.data) {
    return {
      course: { courseId, title: 'Unknown', courseType: 'temel_dersler' },
      sessions: [],
      totalSessions: 0,
    };
  }
  return response.data;
};

// ===============================
// COURSE PROGRESS FUNCTIONS
// ===============================

export const getCourseProgress = async (
  courseId: number,
): Promise<CourseProgressData | null> => {
  try {
    const response = await apiRequest<CourseProgressResponse>(
      `/courses/${courseId}/progress`,
    );
    if (!response.data || !response.data.progress) {
      console.warn(`No progress data for course ${courseId}, returning null.`);
      return null;
    }
    return response.data.progress;
  } catch (error: any) {
    if (error.status === 404) {
      console.warn(
        `Progress data for course ${courseId} not found (404), returning null.`,
      );
      return null;
    } else {
      console.error(`Error fetching progress for course ${courseId}:`, error);
      throw error;
    }
  }
};

export const updateCourseProgress = async (
  courseId: number,
  progressData: UpdateCourseProgressRequest,
): Promise<CourseProgressResponse> => {
  const response = await apiRequest<CourseProgressResponse>(
    `/courses/${courseId}/progress`,
    'PUT',
    progressData,
  );
  if (!response.data) {
    throw new Error('Failed to update course progress: No data returned.');
  }
  return response.data;
};

export const markCourseCompleted = async (
  courseId: number,
): Promise<MarkCourseCompletedResponse> => {
  const response = await apiRequest<MarkCourseCompletedResponse>(
    `/courses/${courseId}/complete`,
    'POST',
  );
  if (!response.data) {
    throw new Error('Failed to mark course as completed: No data returned.');
  }
  return response.data;
};

// ===============================
// USER COURSE OVERVIEW FUNCTIONS
// ===============================

export const getUserCourseOverview = async (): Promise<{
  overview: {
    totalCourses: number;
    studiedCourses: number;
    completedCourses: number;
    totalStudyTimeHours: number;
    totalSessions: number;
    averageCompletionPercentage: number;
  };
  courses: UserCourseOverview[];
}> => {
  const response = await apiRequest<UserCourseOverviewResponse>(
    '/courses/user/overview',
  );
  if (!response.data) {
    return {
      overview: {
        totalCourses: 0,
        studiedCourses: 0,
        completedCourses: 0,
        totalStudyTimeHours: 0,
        totalSessions: 0,
        averageCompletionPercentage: 0,
      },
      courses: [],
    };
  }
  return response.data;
};

// ===============================
// PREFERRED COURSE FUNCTIONS
// ===============================

export const setPreferredCourse = async (
  courseId: number,
): Promise<SetPreferredCourseResponse> => {
  const response = await apiRequest<SetPreferredCourseResponse>(
    `/courses/${courseId}/set-preferred`,
    'POST',
  );
  if (!response.data) {
    throw new Error('Failed to set preferred course: No data returned.');
  }
  return response.data;
};

export const getPreferredCourse = async (): Promise<{
  courseId: number;
  title: string;
  description?: string;
  courseType: string;
  imageUrl?: string;
} | null> => {
  try {
    const response = await apiRequest<PreferredCourseResponse>(
      '/courses/user/preferred',
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
// COURSE ANALYTICS FUNCTIONS
// ===============================

export const getTrendingCourses = async (
  limit: number = 10,
): Promise<TrendingCoursesResponse['trendingCourses']> => {
  const response = await apiRequest<TrendingCoursesResponse>(
    `/courses/trending?limit=${limit}`,
  );
  return response.data?.trendingCourses || [];
};

// ===============================
// LEGACY TOPIC/SUBTOPIC FUNCTIONS (for content management)
// ===============================

export const getTopicsByCourse = async (
  courseId: number,
  withSubtopics: boolean = false,
  withCount: boolean = false,
): Promise<{
  course: { courseId: number; title: string; courseType: string };
  topics: Topic[];
  totalTopics: number;
}> => {
  const params = new URLSearchParams();
  if (withSubtopics) params.append('withSubtopics', 'true');
  if (withCount) params.append('withCount', 'true');

  const queryString = params.toString();
  const url =
    queryString.length > 0
      ? `/topics/course/${courseId}?${queryString}`
      : `/topics/course/${courseId}`;

  const response = await apiRequest<TopicsResponse>(url);
  if (!response.data) {
    return {
      course: { courseId, title: 'Unknown', courseType: 'temel_dersler' },
      topics: [],
      totalTopics: 0,
    };
  }
  return response.data;
};

export const getTopicById = async (
  topicId: number,
  withSubtopics: boolean = true,
  withCourse: boolean = false,
): Promise<TopicWithSubtopicsPayload | null> => {
  try {
    const params = new URLSearchParams();
    if (!withSubtopics) params.append('withSubtopics', 'false');
    if (withCourse) params.append('withCourse', 'true');

    const queryString = params.toString();
    const url =
      queryString.length > 0
        ? `/topics/${topicId}?${queryString}`
        : `/topics/${topicId}`;

    const response = await apiRequest<TopicWithSubtopicsPayload>(url);
    if (!response.data) {
      console.warn(`Topic with ID ${topicId} not found or no data returned.`);
      return null;
    }
    // Ensure subtopics is at least an empty array
    return {
      ...response.data,
      subtopics: response.data.subtopics || [],
    };
  } catch (error: any) {
    if (error.status === 404) {
      console.warn(`Topic with ID ${topicId} not found (404).`);
      return null;
    }
    console.error(`Error fetching topic ${topicId}:`, error);
    throw error;
  }
};

export const getSubtopicsByTopic = async (
  topicId: number,
): Promise<SubtopicsPayload> => {
  const response = await apiRequest<SubtopicsPayload>(
    `/subtopics/topic/${topicId}`,
  );
  return response.data || [];
};

export const getSubtopicById = async (
  subtopicId: number,
): Promise<Subtopic | null> => {
  try {
    const response = await apiRequest<Subtopic>(`/subtopics/${subtopicId}`);
    return response.data === undefined ? null : response.data;
  } catch (error: any) {
    if (error.status === 404) {
      console.warn(`Subtopic with ID ${subtopicId} not found (404).`);
      return null;
    }
    console.error(`Error fetching subtopic ${subtopicId}:`, error);
    throw error;
  }
};

// ===============================
// DEPRECATED FUNCTIONS (Topic-based progress tracking)
// ===============================

/**
 * @deprecated This function is deprecated. Use course-based progress tracking instead.
 */
export const markSubtopicCompleted = async (
  subtopicId: number,
): Promise<MessagePayload> => {
  console.warn(
    'markSubtopicCompleted is deprecated. Use course-based progress tracking instead.',
  );

  try {
    const response = await apiRequest<MessagePayload>(
      '/courses/subtopic/complete',
      'POST',
      { subtopicId },
    );
    if (!response.data || !response.data.message) {
      return {
        message:
          'This endpoint is deprecated. Use course-based progress tracking.',
      };
    }
    return response.data;
  } catch (error: any) {
    if (error.status === 410) {
      return {
        message:
          'This endpoint is deprecated. Use course-based progress tracking instead.',
      };
    }
    throw error;
  }
};

/**
 * @deprecated Use getCourseProgress instead
 */
export const getCourseProgressLegacy = async (
  courseId: number,
): Promise<{
  courseId: number;
  courseName?: string;
  completedTopics: number;
  totalTopics: number;
  completedSubtopics: number;
  totalSubtopics: number;
  progress: number;
  topicsProgress: Array<{
    topicId: number;
    topicName?: string;
    completedSubtopics: number;
    totalSubtopics: number;
    progress: number;
  }>;
}> => {
  console.warn(
    'getCourseProgressLegacy is deprecated. Use getCourseProgress for course-based progress tracking.',
  );

  // Return default legacy structure
  return {
    courseId,
    courseName: '',
    completedTopics: 0,
    totalTopics: 0,
    completedSubtopics: 0,
    totalSubtopics: 0,
    progress: 0,
    topicsProgress: [],
  };
};

// ===============================
// UTILITY FUNCTIONS
// ===============================

/**
 * Calculate course completion percentage based on progress data
 */
export const calculateCourseCompletion = (
  progressData: CourseProgressData | null,
): number => {
  if (!progressData) return 0;
  return progressData.completionPercentage || 0;
};

/**
 * Format study duration for display
 */
export const formatStudyDuration = (
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
 * Get comprehensive course data including progress and sessions
 */
export const getCourseComprehensiveData = async (courseId: number) => {
  try {
    const [courseDetails, courseProgress, studySessions] = await Promise.all([
      getCourseById(courseId),
      getCourseProgress(courseId),
      getCourseStudySessions(courseId, 10),
    ]);

    return {
      course: courseDetails,
      progress: courseProgress,
      recentSessions: studySessions.sessions,
      hasActiveSession: studySessions.sessions.some(
        (session) => session.sessionStatus === 'active',
      ),
    };
  } catch (error) {
    console.error(
      `Error fetching comprehensive data for course ${courseId}:`,
      error,
    );
    return {
      course: null,
      progress: null,
      recentSessions: [],
      hasActiveSession: false,
    };
  }
};
