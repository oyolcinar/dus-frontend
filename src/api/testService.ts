import apiRequest from './apiClient';
import { Test, Question, TestResult, Answer } from '../types/models';

export const getAllTests = async (): Promise<Test[]> => {
  return await apiRequest<Test[]>('/tests');
};

export const getTestById = async (testId: number): Promise<Test> => {
  return await apiRequest<Test>(`/tests/${testId}`);
};

export const getQuestionsByTest = async (
  testId: number,
): Promise<Question[]> => {
  return await apiRequest<Question[]>(`/questions/test/${testId}`);
};

export interface SubmitTestRequest {
  testId: number;
  score: number;
  timeTaken?: number;
  answers: Answer[];
}

export interface SubmitTestResponse {
  message: string;
  result: TestResult;
}

export const submitTestResult = async (
  testId: number,
  score: number,
  timeTaken?: number,
  answers: Answer[] = [],
): Promise<SubmitTestResponse> => {
  return await apiRequest<SubmitTestResponse>('/results/submit', 'POST', {
    testId,
    score,
    timeTaken,
    answers,
  });
};

export const getUserResults = async (): Promise<TestResult[]> => {
  return await apiRequest<TestResult[]>('/results/user');
};

export interface ResultDetails {
  result: TestResult;
  answers: Array<
    Answer & {
      question_text: string;
      options: Record<string, string>;
      correct_answer: string;
    }
  >;
}

export const getResultDetails = async (
  resultId: number,
): Promise<ResultDetails> => {
  return await apiRequest<ResultDetails>(`/results/${resultId}`);
};

export interface TestStats {
  testId: number;
  testTitle: string;
  averageScore: number;
  attemptCount: number;
}

export const getTestStats = async (testId: number): Promise<TestStats> => {
  return await apiRequest<TestStats>(`/results/stats/${testId}`);
};
