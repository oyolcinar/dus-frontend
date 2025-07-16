import apiRequest from './apiClient';
import {
  Test,
  Question,
  TestResult,
  Answer,
  TestStatistics,
} from '../types/models';

// --- Define interfaces for the *actual data payloads* your backend sends ---
// --- These will be the TData in apiRequest<TData> ---

// For GET /tests
type AllTestsPayload = Test[];

// For GET /tests/course/:courseId
type TestsByCoursePayload = Test[];

// For GET /tests/course-type/:courseType
type TestsByCourseTypePayload = Test[];

// For GET /tests/:testId
// The payload is a single Test object.
// The Test model should include: test_id, title, description, difficulty_level, created_at, question_count, time_limit, course_id

// For GET /tests/:testId/with-questions
// Your existing TestWithQuestions interface is good for this payload
export interface TestWithQuestionsPayload extends Test {
  // Exporting if used elsewhere
  questions: Question[];
}

// For GET /tests/:testId/stats
type TestStatsPayload = TestStatistics;

// For GET /tests/:testId/user-history
interface TestUserHistoryPayload {
  user_id: number;
  test_id: number;
  has_taken: boolean;
  attempt_count: number;
  best_score: number;
  last_attempt: string;
  average_score: number;
}

// For GET /questions/test/:testId
type QuestionsByTestPayload = Question[];

// For POST /tests
interface CreateTestPayload {
  message: string;
  test: Test; // The created Test object
}

// For PUT /tests/:testId
interface UpdateTestPayload {
  message: string;
  test: Test; // The updated Test object
}

// For POST /results/submit
interface SubmitTestResultPayload {
  // Assuming this is the payload shape
  message: string;
  // Your original code had response.data.testResult, so backend might send { message: "...", testResult: ... }
  testResult: TestResult;
}

// For GET /results/user
type UserTestResultsPayload = TestResult[];

// For GET /results/:resultId
// Your existing ResultDetails interface is good for this payload
export interface ResultDetailsPayload {
  // Exporting if used elsewhere
  result: TestResult;
  answers: Array<
    Answer & {
      // Answer extended with question details for context
      question_text: string;
      options: Record<string, string>; // e.g., { "A": "Option A", "B": "Option B" }
      correct_answer: string; // e.g., "A" or the text of the correct option
    }
  >;
}

// For DELETE /tests/:testId
interface MessagePayload {
  // Reusable
  message: string;
}

// --- Service Input DTOs (updated with courseId) ---
export interface CreateTestRequest {
  title: string;
  description?: string;
  difficultyLevel: number; // Or string like 'easy', 'medium', 'hard'
  timeLimit?: number; // In seconds or minutes
  courseId: number; // NEW: Required course relationship
}

export interface UpdateTestRequest {
  title?: string;
  description?: string;
  difficultyLevel?: number;
  timeLimit?: number;
  courseId?: number; // NEW: Optional course relationship for updates
}

export interface SubmitTestRequest {
  // This is more of an input for the API, not a response type
  testId: number;
  score: number;
  timeTaken?: number; // In seconds or minutes
  answers: Answer[]; // Array of Answer objects { questionId, userAnswer, isCorrect }
}

// --- Service Functions ---

export const getAllTests = async (): Promise<AllTestsPayload> => {
  const response = await apiRequest<AllTestsPayload>('/tests');
  return response.data || [];
};

// NEW: Get tests by course
export const getTestsByCourse = async (
  courseId: number,
): Promise<TestsByCoursePayload> => {
  const response = await apiRequest<TestsByCoursePayload>(
    `/tests/course/${courseId}`,
  );
  return response.data || [];
};

// NEW: Get tests by course type
export const getTestsByCourseType = async (
  courseType: 'temel_dersler' | 'klinik_dersler',
): Promise<TestsByCourseTypePayload> => {
  const response = await apiRequest<TestsByCourseTypePayload>(
    `/tests/course-type/${courseType}`,
  );
  return response.data || [];
};

export const getTestById = async (testId: number): Promise<Test | null> => {
  try {
    const response = await apiRequest<Test>(`/tests/${testId}`);
    return response.data === undefined ? null : response.data;
  } catch (error: any) {
    if (error.status === 404) {
      console.warn(`Test with ID ${testId} not found (404).`);
      return null;
    }
    console.error(`Error fetching test ID ${testId}:`, error);
    throw error;
  }
};

// NEW: Get test statistics
export const getTestStats = async (
  testId: number,
): Promise<TestStatsPayload | null> => {
  try {
    const response = await apiRequest<TestStatsPayload>(
      `/tests/${testId}/stats`,
    );
    return response.data || null;
  } catch (error: any) {
    if (error.status === 404) {
      console.warn(`Test statistics for ID ${testId} not found (404).`);
      return null;
    }
    console.error(`Error fetching test statistics for ${testId}:`, error);
    throw error;
  }
};

// NEW: Check user test history
export const getUserTestHistory = async (
  testId: number,
): Promise<TestUserHistoryPayload | null> => {
  try {
    const response = await apiRequest<TestUserHistoryPayload>(
      `/tests/${testId}/user-history`,
    );
    return response.data || null;
  } catch (error: any) {
    if (error.status === 404) {
      console.warn(`User test history for ID ${testId} not found (404).`);
      return null;
    }
    console.error(`Error fetching user test history for ${testId}:`, error);
    throw error;
  }
};

export const getTestWithQuestions = async (
  testId: number,
): Promise<TestWithQuestionsPayload | null> => {
  try {
    // This endpoint likely returns a Test object with an embedded 'questions' array
    const response = await apiRequest<TestWithQuestionsPayload>(
      `/tests/${testId}/with-questions`,
    );
    if (!response.data || typeof response.data !== 'object') {
      console.warn(
        `Test with questions for ID ${testId} not found or data malformed.`,
      );
      return null;
    }
    return {
      ...response.data,
      questions: response.data.questions || [], // Ensure questions is an array
    };
  } catch (error: any) {
    if (error.status === 404) {
      console.warn(`Test with questions for ID ${testId} not found (404).`);
      return null;
    }
    console.error(
      `Error fetching test with questions for ID ${testId}:`,
      error,
    );
    throw error;
  }
};

export const getQuestionsByTest = async (
  testId: number,
): Promise<QuestionsByTestPayload> => {
  const response = await apiRequest<QuestionsByTestPayload>(
    `/questions/test/${testId}`,
  );
  return response.data || [];
};

// UPDATED: Create test with courseId
export const createTest = async (
  testData: CreateTestRequest,
): Promise<CreateTestPayload> => {
  const response = await apiRequest<CreateTestPayload>(
    '/tests',
    'POST',
    testData,
  );
  if (!response.data)
    throw new Error('Failed to create test: No data returned.');
  return response.data;
};

// UPDATED: Update test with courseId
export const updateTest = async (
  testId: number,
  testData: UpdateTestRequest,
): Promise<UpdateTestPayload> => {
  const response = await apiRequest<UpdateTestPayload>(
    `/tests/${testId}`,
    'PUT',
    testData,
  );
  if (!response.data)
    throw new Error(`Failed to update test ${testId}: No data returned.`);
  return response.data;
};

// Note: The input for submitTestResult uses SubmitTestRequest,
// but the return type from the backend is SubmitTestResultPayload.
export const submitTestResult = async (
  // Using SubmitTestRequest as the input structure for clarity
  data: SubmitTestRequest,
): Promise<SubmitTestResultPayload> => {
  const response = await apiRequest<SubmitTestResultPayload>(
    '/results/submit',
    'POST',
    data,
  );
  if (
    !response.data ||
    typeof response.data !== 'object' ||
    !response.data.testResult
  ) {
    throw new Error(
      'Failed to submit test results: Invalid data received from server.',
    );
  }
  // Ensure message is present, default if necessary
  return {
    message: response.data.message || 'Test results submitted successfully.',
    testResult: response.data.testResult,
  };
};

export const getUserResults = async (): Promise<UserTestResultsPayload> => {
  const response = await apiRequest<UserTestResultsPayload>('/results/user');
  return response.data || [];
};

export const getResultDetails = async (
  resultId: number,
): Promise<ResultDetailsPayload | null> => {
  try {
    const response = await apiRequest<ResultDetailsPayload>(
      `/results/${resultId}`,
    );
    if (!response.data || typeof response.data !== 'object') {
      console.warn(`No result details for ID ${resultId}, or data malformed.`);
      return null;
    }
    return {
      // Ensure answers is an array
      ...response.data,
      answers: response.data.answers || [],
    };
  } catch (error: any) {
    if (error.status === 404) {
      console.warn(`Result details for ID ${resultId} not found (404).`);
      return null;
    }
    console.error(`Error fetching result details for ID ${resultId}:`, error);
    throw error;
  }
};

export const deleteTest = async (testId: number): Promise<MessagePayload> => {
  const response = await apiRequest<MessagePayload>(
    `/tests/${testId}`,
    'DELETE',
  );
  if (!response.data || !response.data.message) {
    return { message: 'Test deleted successfully.' };
  }
  return response.data;
};
