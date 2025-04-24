import apiRequest from './apiClient';
import { Answer } from '../types/models';

export interface CreateAnswerInput {
  resultId: number;
  questionId: number;
  userAnswer: string;
  isCorrect: boolean;
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
