// src/api/courseService.ts
import apiRequest from './apiClient';
import { Course, Topic, Subtopic } from '../types/models';
import { ApiResponse } from '../types/api';

// Response interfaces for course endpoints
interface GetCoursesResponse extends ApiResponse<Course[]> {}
interface GetCourseResponse extends ApiResponse<Course & { topics: Topic[] }> {}
interface GetTopicsResponse extends ApiResponse<Topic[]> {}
interface GetTopicResponse
  extends ApiResponse<Topic & { subtopics: Subtopic[] }> {}
interface GetSubtopicsResponse extends ApiResponse<Subtopic[]> {}
interface GetSubtopicResponse extends ApiResponse<Subtopic> {}
interface MessageResponse extends ApiResponse<{ message: string }> {}

// Progress interface
interface CourseProgressResponse
  extends ApiResponse<{
    courseId: number;
    courseName: string;
    completedTopics: number;
    totalTopics: number;
    completedSubtopics: number;
    totalSubtopics: number;
    progress: number;
    topicsProgress: Array<{
      topicId: number;
      topicName: string;
      completedSubtopics: number;
      totalSubtopics: number;
      progress: number;
    }>;
  }> {}

/**
 * Get all available courses
 * @returns Array of courses
 */
export const getAllCourses = async (): Promise<Course[]> => {
  const response = await apiRequest<GetCoursesResponse>('/courses');
  return response.data || [];
};

/**
 * Get a course by its ID, including topics
 * @param courseId ID of the course to retrieve
 * @returns Course with topics array
 */
export const getCourseById = async (
  courseId: number,
): Promise<Course & { topics: Topic[] }> => {
  const response = await apiRequest<GetCourseResponse>(`/courses/${courseId}`);

  if (!response.data) {
    throw new Error(`Course with ID ${courseId} not found`);
  }

  // Ensure topics is at least an empty array if missing
  return {
    ...response.data,
    topics: response.data.topics || [],
  };
};

/**
 * Get all topics for a specific course
 * @param courseId Course ID to get topics for
 * @returns Array of topics
 */
export const getTopicsByCourse = async (courseId: number): Promise<Topic[]> => {
  const response = await apiRequest<GetTopicsResponse>(
    `/topics/course/${courseId}`,
  );
  return response.data || [];
};

/**
 * Get a topic by its ID, including subtopics
 * @param topicId ID of the topic to retrieve
 * @returns Topic with subtopics array
 */
export const getTopicById = async (
  topicId: number,
): Promise<Topic & { subtopics: Subtopic[] }> => {
  const response = await apiRequest<GetTopicResponse>(`/topics/${topicId}`);

  if (!response.data) {
    throw new Error(`Topic with ID ${topicId} not found`);
  }

  // Ensure subtopics is at least an empty array if missing
  return {
    ...response.data,
    subtopics: response.data.subtopics || [],
  };
};

/**
 * Get all subtopics for a specific topic
 * @param topicId Topic ID to get subtopics for
 * @returns Array of subtopics
 */
export const getSubtopicsByTopic = async (
  topicId: number,
): Promise<Subtopic[]> => {
  const response = await apiRequest<GetSubtopicsResponse>(
    `/subtopics/topic/${topicId}`,
  );
  return response.data || [];
};

/**
 * Get a subtopic by its ID
 * @param subtopicId ID of the subtopic to retrieve
 * @returns Subtopic object
 */
export const getSubtopicById = async (
  subtopicId: number,
): Promise<Subtopic> => {
  const response = await apiRequest<GetSubtopicResponse>(
    `/subtopics/${subtopicId}`,
  );

  if (!response.data) {
    throw new Error(`Subtopic with ID ${subtopicId} not found`);
  }

  return response.data;
};

/**
 * Mark a subtopic as completed
 * @param subtopicId ID of the subtopic to mark as completed
 * @returns Success message
 */
export const markSubtopicCompleted = async (
  subtopicId: number,
): Promise<{ message: string }> => {
  const response = await apiRequest<MessageResponse>(
    '/courses/subtopic/complete',
    'POST',
    { subtopicId },
  );

  if (!response.data) {
    return { message: 'Subtopic marked as completed' };
  }

  return { message: response.data.message || 'Subtopic marked as completed' };
};

/**
 * Get progress information for a course
 * @param courseId ID of the course to get progress for
 * @returns Course progress details including topic progress
 */
export const getCourseProgress = async (
  courseId: number,
): Promise<{
  courseId: number;
  courseName: string;
  completedTopics: number;
  totalTopics: number;
  completedSubtopics: number;
  totalSubtopics: number;
  progress: number;
  topicsProgress: Array<{
    topicId: number;
    topicName: string;
    completedSubtopics: number;
    totalSubtopics: number;
    progress: number;
  }>;
}> => {
  const response = await apiRequest<CourseProgressResponse>(
    `/courses/${courseId}/progress`,
  );

  if (!response.data) {
    // Return default progress object with zero values
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

  return response.data;
};
