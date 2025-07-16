import apiRequest from './apiClient';
import { Course, Topic, Subtopic, CourseStatistics } from '../types/models';

// --- Define interfaces for the *actual data payloads* your backend sends ---
// --- These will be the TData in apiRequest<TData> ---

// For GET /courses
type CoursesPayload = Course[];

// For GET /courses/type/:courseType
type CoursesByTypePayload = Course[];

// For GET /courses/:courseId
// Backend is expected to return a Course object, potentially with a 'topics' array embedded
interface CourseWithTopicsPayload extends Course {
  topics?: Topic[]; // topics array might be optional or always present
}

// For GET /courses/:courseId/stats
type CourseStatsPayload = CourseStatistics;

// For GET /topics/course/:courseId
type TopicsPayload = Topic[];

// For GET /topics/:topicId
// Backend is expected to return a Topic object, potentially with a 'subtopics' array embedded
interface TopicWithSubtopicsPayload extends Topic {
  subtopics?: Subtopic[]; // subtopics array might be optional or always present
}

// For GET /subtopics/topic/:topicId
type SubtopicsPayload = Subtopic[];

// For POST /courses/subtopic/complete
interface MessagePayload {
  // Reusable for simple message responses
  message: string;
}

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

// For GET /courses/:courseId/progress
// This is the payload for course progress
export interface CourseProgressPayload {
  // Exporting as it's used in HomeScreen.tsx's types
  courseId: number;
  courseName?: string; // Make optional if backend might not send it
  completedTopics: number;
  totalTopics: number;
  completedSubtopics: number;
  totalSubtopics: number;
  progress: number; // Overall course progress percentage
  topicsProgress: Array<{
    topicId: number;
    topicName?: string; // Make optional
    completedSubtopics: number;
    totalSubtopics: number;
    progress: number; // Progress for this specific topic
  }>;
}

// --- Service Input DTOs ---
export interface CreateCourseRequest {
  title: string;
  description?: string;
  image_url?: string;
  courseType: 'temel_dersler' | 'klinik_dersler'; // NEW: Required course type
}

export interface UpdateCourseRequest {
  title?: string;
  description?: string;
  image_url?: string;
  courseType?: 'temel_dersler' | 'klinik_dersler'; // NEW: Optional course type for updates
}

// --- Service Functions ---

export const getAllCourses = async (): Promise<CoursesPayload> => {
  const response = await apiRequest<CoursesPayload>('/courses');
  return response.data || [];
};

// NEW: Get courses by type
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
      // If apiRequest returns undefined data on success (e.g. 204 or empty object)
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

// NEW: Get course statistics
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

// NEW: Create course with courseType
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

// NEW: Update course with courseType
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

export const getTopicsByCourse = async (
  courseId: number,
): Promise<TopicsPayload> => {
  const response = await apiRequest<TopicsPayload>(
    `/topics/course/${courseId}`,
  );
  return response.data || [];
};

export const getTopicById = async (
  topicId: number,
): Promise<TopicWithSubtopicsPayload | null> => {
  try {
    const response = await apiRequest<TopicWithSubtopicsPayload>(
      `/topics/${topicId}`,
    );
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

export const markSubtopicCompleted = async (
  subtopicId: number,
): Promise<MessagePayload> => {
  const response = await apiRequest<MessagePayload>(
    '/courses/subtopic/complete', // Your original path. Confirm if this should be /subtopics/:id/complete or similar
    'POST',
    { subtopicId },
  );
  if (!response.data || !response.data.message) {
    return { message: 'Subtopic marked as completed successfully.' };
  }
  return response.data;
};

export const getCourseProgress = async (
  courseId: number,
): Promise<CourseProgressPayload> => {
  try {
    const response = await apiRequest<CourseProgressPayload>(
      `/courses/${courseId}/progress`,
    );
    if (!response.data || typeof response.data !== 'object') {
      console.warn(
        `No progress data for course ${courseId}, returning defaults.`,
      );
      // Return default progress object with zero values
      return {
        courseId,
        courseName: '', // Default if not provided
        completedTopics: 0,
        totalTopics: 0,
        completedSubtopics: 0,
        totalSubtopics: 0,
        progress: 0,
        topicsProgress: [],
      };
    }
    // Ensure topicsProgress is an array
    return {
      ...response.data,
      topicsProgress: response.data.topicsProgress || [],
    };
  } catch (error: any) {
    if (error.status === 404) {
      console.warn(
        `Progress data for course ${courseId} not found (404), returning defaults.`,
      );
    } else {
      console.error(`Error fetching progress for course ${courseId}:`, error);
    }
    // Return default structure on any error for this specific function, or re-throw
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
  }
};
