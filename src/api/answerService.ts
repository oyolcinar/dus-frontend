import apiRequest from './apiClient';
import { Answer } from '../types/models';

export interface CreateAnswerInput {
  resultId: number;
  questionId: number;
  userAnswer: string;
  isCorrect: boolean;
  timeSpent?: number;
}

export const createAnswer = async (
  data: CreateAnswerInput,
): Promise<{
  message: string;
  answer: Answer & { answer_id: number; created_at: string };
}> => {
  return await apiRequest('/answers', 'POST', data);
};

export const createBatchAnswers = async (
  answers: CreateAnswerInput[],
): Promise<{
  message: string;
  answers: Array<Answer & { answer_id: number; created_at: string }>;
}> => {
  return await apiRequest('/answers/batch', 'POST', { answers });
};

export const getAnswersByResultId = async (
  resultId: number,
): Promise<
  Array<
    Answer & {
      answer_id: number;
      question_text: string;
      options: Record<string, string>;
      correct_answer: string;
      created_at: string;
    }
  >
> => {
  return await apiRequest(`/answers/result/${resultId}`);
};

export const getAnswerStats = async (
  userId?: number,
  topicId?: number,
  subtopicId?: number,
  startDate?: string,
  endDate?: string
): Promise<{
  totalAnswers: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
  averageTimePerQuestion: number;
  byDifficulty: {
    easy: { total: number; correct: number; accuracy: number };
    medium: { total: number; correct: number; accuracy: number };
    hard: { total: number; correct: number; accuracy: number };
  };
  topics?: {
    topicId: number;
    topicName: string;
    totalAnswers: number;
    correctAnswers: number;
    accuracy: number;
  }[];
}> => {
  let url = '/answers/stats';
  
  const params = new URLSearchParams();
  if (userId) params.append('userId', userId.toString());
  if (topicId) params.append('topicId', topicId.toString());
  if (subtopicId) params.append('subtopicId', subtopicId.toString());
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const queryString = params.toString();
  if (queryString) url += `?${queryString}`;
  
  return await apiRequest(url);
};

export const flagAnswer = async (
  answerId: number,
  reason: string
): Promise<{ message: string }> => {
  return await apiRequest(`/answers/${answerId}/flag`, 'POST', { reason });
};
