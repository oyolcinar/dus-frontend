// src/api/answerService.ts
import apiRequest from './apiClient';
import { Answer } from '../types/models';
import { ApiResponse } from '../types/api';

// Response interface for creating a single answer
interface CreateAnswerResponse
  extends ApiResponse<{
    message: string;
    answer: Answer & { answer_id: number; created_at: string };
  }> {}

// Response interface for creating a batch of answers
interface CreateBatchAnswersResponse
  extends ApiResponse<{
    message: string;
    answers: Array<Answer & { answer_id: number; created_at: string }>;
  }> {}

// Response interface for getting answers by result ID
interface GetAnswersByResultResponse
  extends ApiResponse<
    Array<
      Answer & {
        answer_id: number;
        question_text: string;
        options: Record<string, string>;
        correct_answer: string;
        created_at: string;
      }
    >
  > {}

// Response interface for answer statistics
interface AnswerStatsResponse
  extends ApiResponse<{
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
  }> {}

// Response interface for flagging an answer
interface FlagAnswerResponse extends ApiResponse<{ message: string }> {}

export interface CreateAnswerInput {
  resultId: number;
  questionId: number;
  userAnswer: string;
  isCorrect: boolean;
  timeSpent?: number;
}

/**
 * Create a single answer
 * @param data Answer data to create
 * @returns Created answer with ID and timestamp
 */
export const createAnswer = async (
  data: CreateAnswerInput,
): Promise<{
  message: string;
  answer: Answer & { answer_id: number; created_at: string };
}> => {
  const response = await apiRequest<CreateAnswerResponse>(
    '/answers',
    'POST',
    data,
  );

  // Provide default in case the data is missing
  if (!response.data) {
    throw new Error('Failed to create answer: No data returned from server');
  }

  return response.data;
};

/**
 * Create multiple answers in a single request
 * @param answers Array of answer data to create
 * @returns Created answers with IDs and timestamps
 */
export const createBatchAnswers = async (
  answers: CreateAnswerInput[],
): Promise<{
  message: string;
  answers: Array<Answer & { answer_id: number; created_at: string }>;
}> => {
  const response = await apiRequest<CreateBatchAnswersResponse>(
    '/answers/batch',
    'POST',
    { answers },
  );

  // Provide default in case the data is missing
  if (!response.data) {
    throw new Error(
      'Failed to create batch answers: No data returned from server',
    );
  }

  return response.data;
};

/**
 * Get all answers for a specific test result
 * @param resultId ID of the test result
 * @returns Array of answers with question data
 */
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
  const response = await apiRequest<GetAnswersByResultResponse>(
    `/answers/result/${resultId}`,
  );
  return response.data || [];
};

/**
 * Get statistics about answers
 * @param userId Optional user ID to filter stats
 * @param topicId Optional topic ID to filter stats
 * @param subtopicId Optional subtopic ID to filter stats
 * @param startDate Optional start date for date range
 * @param endDate Optional end date for date range
 * @returns Answer statistics
 */
export const getAnswerStats = async (
  userId?: number,
  topicId?: number,
  subtopicId?: number,
  startDate?: string,
  endDate?: string,
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

  const response = await apiRequest<AnswerStatsResponse>(url);

  // Provide default values if data is missing
  if (!response.data) {
    return {
      totalAnswers: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      accuracy: 0,
      averageTimePerQuestion: 0,
      byDifficulty: {
        easy: { total: 0, correct: 0, accuracy: 0 },
        medium: { total: 0, correct: 0, accuracy: 0 },
        hard: { total: 0, correct: 0, accuracy: 0 },
      },
      topics: [],
    };
  }

  return response.data;
};

/**
 * Flag an answer for review
 * @param answerId ID of the answer to flag
 * @param reason Reason for flagging the answer
 * @returns Success message
 */
export const flagAnswer = async (
  answerId: number,
  reason: string,
): Promise<{ message: string }> => {
  const response = await apiRequest<FlagAnswerResponse>(
    `/answers/${answerId}/flag`,
    'POST',
    { reason },
  );

  // Provide default value if data is missing
  if (!response.data) {
    return { message: 'Answer was flagged' };
  }

  return response.data;
};
