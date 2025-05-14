// src/api/testService.ts
import apiRequest from './apiClient';
import { Test, Question, TestResult, Answer } from '../types/models';
import {
  ApiResponse,
  GetTestsResponse,
  GetTestResponse,
  SubmitTestResponse,
  GetTestResultsResponse,
} from '../types/api';

// Response interfaces for test-related endpoints that aren't in api.ts
interface GetQuestionsResponse extends ApiResponse<Question[]> {}
interface CreateTestResponse
  extends ApiResponse<{
    message: string;
    test: Test;
  }> {}
interface UpdateTestResponse
  extends ApiResponse<{
    message: string;
    test: Test;
  }> {}
interface TestStatsResponse extends ApiResponse<TestStats> {}
interface ResultDetailsResponse extends ApiResponse<ResultDetails> {}
interface DeleteTestResponse extends ApiResponse<{ message: string }> {}

/**
 * Get all available tests
 * @returns Array of tests
 */
export const getAllTests = async (): Promise<Test[]> => {
  const response = await apiRequest<GetTestsResponse>('/tests');
  return response.data || [];
};

/**
 * Get a test by ID without questions
 * @param testId ID of the test to retrieve
 * @returns Test object
 */
export const getTestById = async (testId: number): Promise<Test> => {
  const response = await apiRequest<GetTestResponse>(`/tests/${testId}`);

  if (!response.data) {
    throw new Error(`Test with ID ${testId} not found`);
  }

  return response.data;
};

// Interface for a test with its questions included
export interface TestWithQuestions extends Test {
  questions: Question[];
}

/**
 * Get a test with all its questions
 * @param testId ID of the test to retrieve with questions
 * @returns Test with questions array
 */
export const getTestWithQuestions = async (
  testId: number,
): Promise<TestWithQuestions> => {
  const response = await apiRequest<GetTestResponse>(
    `/tests/${testId}/with-questions`,
  );

  if (!response.data) {
    throw new Error(`Test with ID ${testId} not found`);
  }

  return {
    ...response.data,
    questions: response.data.questions || [],
  };
};

/**
 * Get all questions for a specific test
 * @param testId ID of the test to get questions for
 * @returns Array of questions
 */
export const getQuestionsByTest = async (
  testId: number,
): Promise<Question[]> => {
  const response = await apiRequest<GetQuestionsResponse>(
    `/questions/test/${testId}`,
  );
  return response.data || [];
};

export interface CreateTestRequest {
  title: string;
  description?: string;
  difficultyLevel: number;
  timeLimit?: number;
}

/**
 * Create a new test
 * @param testData Test data for creation
 * @returns Created test with success message
 */
export const createTest = async (
  testData: CreateTestRequest,
): Promise<{ message: string; test: Test }> => {
  const response = await apiRequest<CreateTestResponse>(
    '/tests',
    'POST',
    testData,
  );

  if (!response.data) {
    throw new Error('Failed to create test');
  }

  return response.data;
};

export interface UpdateTestRequest {
  title?: string;
  description?: string;
  difficultyLevel?: number;
  timeLimit?: number;
}

/**
 * Update an existing test
 * @param testId ID of the test to update
 * @param testData Partial test data for updating
 * @returns Updated test with success message
 */
export const updateTest = async (
  testId: number,
  testData: UpdateTestRequest,
): Promise<{ message: string; test: Test }> => {
  const response = await apiRequest<UpdateTestResponse>(
    `/tests/${testId}`,
    'PUT',
    testData,
  );

  if (!response.data) {
    throw new Error(`Failed to update test with ID ${testId}`);
  }

  return response.data;
};

export interface SubmitTestRequest {
  testId: number;
  score: number;
  timeTaken?: number;
  answers: Answer[];
}

/**
 * Submit a completed test result
 * @param testId ID of the completed test
 * @param score Score achieved
 * @param timeTaken Time taken to complete the test (in seconds)
 * @param answers Array of answers submitted
 * @returns Test result with success message
 */
export const submitTestResult = async (
  testId: number,
  score: number,
  timeTaken?: number,
  answers: Answer[] = [],
): Promise<{ message: string; result: TestResult }> => {
  const response = await apiRequest<SubmitTestResponse>(
    '/results/submit',
    'POST',
    {
      testId,
      score,
      timeTaken,
      answers,
    },
  );

  if (!response.data) {
    throw new Error('Failed to submit test results');
  }

  return {
    message: response.message || 'Test results submitted successfully',
    result: response.data.testResult,
  };
};

/**
 * Get all test results for the current user
 * @returns Array of test results
 */
export const getUserResults = async (): Promise<TestResult[]> => {
  const response = await apiRequest<GetTestResultsResponse>('/results/user');
  return response.data || [];
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

/**
 * Get detailed information about a test result
 * @param resultId ID of the result to retrieve details for
 * @returns Result details with answers
 */
export const getResultDetails = async (
  resultId: number,
): Promise<ResultDetails> => {
  const response = await apiRequest<ResultDetailsResponse>(
    `/results/${resultId}`,
  );

  if (!response.data) {
    throw new Error(`Result with ID ${resultId} not found`);
  }

  return response.data;
};

export interface TestStats {
  testId: number;
  testTitle: string;
  averageScore: number;
  attemptCount: number;
}

/**
 * Get statistics for a specific test
 * @param testId ID of the test to get statistics for
 * @returns Test statistics
 */
export const getTestStats = async (testId: number): Promise<TestStats> => {
  const response = await apiRequest<TestStatsResponse>(
    `/results/stats/${testId}`,
  );

  if (!response.data) {
    throw new Error(`Failed to get stats for test ID ${testId}`);
  }

  return response.data;
};

/**
 * Delete a test
 * @param testId ID of the test to delete
 * @returns Success message
 */
export const deleteTest = async (
  testId: number,
): Promise<{ message: string }> => {
  const response = await apiRequest<DeleteTestResponse>(
    `/tests/${testId}`,
    'DELETE',
  );

  if (!response.data) {
    return { message: 'Test deleted successfully' };
  }

  return { message: response.data.message || 'Test deleted successfully' };
};
