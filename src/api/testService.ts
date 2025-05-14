import apiRequest from './apiClient';
import { Test, Question, TestResult, Answer } from '../types/models';

export const getAllTests = async (): Promise<Test[]> => {
  return await apiRequest<Test[]>('/tests');
};

export const getTestById = async (testId: number): Promise<Test> => {
  return await apiRequest<Test>(`/tests/${testId}`);
};

// New function to get a test with all its questions
export interface TestWithQuestions extends Test {
  questions: Question[];
}

export const getTestWithQuestions = async (
  testId: number,
): Promise<TestWithQuestions> => {
  return await apiRequest<TestWithQuestions>(`/tests/${testId}/with-questions`);
};

export const getQuestionsByTest = async (
  testId: number,
): Promise<Question[]> => {
  return await apiRequest<Question[]>(`/questions/test/${testId}`);
};

export interface CreateTestRequest {
  title: string;
  description?: string;
  difficultyLevel: number;
  timeLimit?: number;
}

export interface CreateTestResponse {
  message: string;
  test: Test;
}

export const createTest = async (
  testData: CreateTestRequest,
): Promise<CreateTestResponse> => {
  return await apiRequest<CreateTestResponse>('/tests', 'POST', testData);
};

export interface UpdateTestRequest {
  title?: string;
  description?: string;
  difficultyLevel?: number;
  timeLimit?: number;
}

export interface UpdateTestResponse {
  message: string;
  test: Test;
}

export const updateTest = async (
  testId: number,
  testData: UpdateTestRequest,
): Promise<UpdateTestResponse> => {
  return await apiRequest<UpdateTestResponse>(
    `/tests/${testId}`,
    'PUT',
    testData,
  );
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

export const deleteTest = async (
  testId: number,
): Promise<{ message: string }> => {
  return await apiRequest<{ message: string }>(`/tests/${testId}`, 'DELETE');
};
