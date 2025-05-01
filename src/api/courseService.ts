import apiRequest from './apiClient';
import { Course, Topic, Subtopic } from '../types/models';

export const getAllCourses = async (): Promise<Course[]> => {
  return await apiRequest<Course[]>('/courses');
};

export const getCourseById = async (
  courseId: number,
): Promise<Course & { topics: Topic[] }> => {
  return await apiRequest<Course & { topics: Topic[] }>(`/courses/${courseId}`);
};

export const getTopicsByCourse = async (courseId: number): Promise<Topic[]> => {
  return await apiRequest<Topic[]>(`/topics/course/${courseId}`);
};

export const getTopicById = async (
  topicId: number,
): Promise<Topic & { subtopics: Subtopic[] }> => {
  return await apiRequest<Topic & { subtopics: Subtopic[] }>(
    `/topics/${topicId}`,
  );
};

export const getSubtopicsByTopic = async (
  topicId: number,
): Promise<Subtopic[]> => {
  return await apiRequest<Subtopic[]>(`/subtopics/topic/${topicId}`);
};

export const getSubtopicById = async (
  subtopicId: number,
): Promise<Subtopic> => {
  return await apiRequest<Subtopic>(`/subtopics/${subtopicId}`);
};

export const markSubtopicCompleted = async (
  subtopicId: number,
): Promise<{ message: string }> => {
  return await apiRequest('/courses/subtopic/complete', 'POST', { subtopicId });
};

export const getCourseProgress = async (
  courseId: number
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
  return await apiRequest(`/courses/${courseId}/progress`);
};
