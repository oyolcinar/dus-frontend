import apiRequest from './apiClient';
import { Answer } from '../types/models'; // Assuming Answer type is { questionId: number; userAnswer: string; isCorrect: boolean; }
// ApiResponse is implicitly handled by apiRequest

// --- Define interfaces for the *actual data payloads* your backend sends ---
// --- These will be the TData in apiRequest<TData> ---

// For POST /answers
export interface CreatedAnswerPayload {
  // Renamed for clarity
  message: string;
  answer: Answer & {
    answer_id: number;
    created_at: string;
    resultId?: number;
    timeSpent?: number;
  }; // Added optional fields if backend might send them
}

// For POST /answers/batch
export interface CreatedBatchAnswersPayload {
  // Renamed
  message: string;
  answers: Array<
    Answer & {
      answer_id: number;
      created_at: string;
      resultId?: number;
      timeSpent?: number;
    }
  >;
}

// For GET /answers/result/:resultId
export interface AnswerWithDetails extends Answer {
  // More descriptive name
  answer_id: number;
  question_text: string;
  options: Record<string, string>;
  correct_answer: string;
  created_at: string;
  resultId?: number; // From CreateAnswerInput
  timeSpent?: number; // From CreateAnswerInput
}
type AnswersByResultPayload = AnswerWithDetails[];

// For GET /answers/stats
export interface AnswerStatsPayload {
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
    // topics is optional as per your original return type
    topicId: number;
    topicName: string;
    totalAnswers: number;
    correctAnswers: number;
    accuracy: number;
  }[];
}

// For POST /answers/:answerId/flag
interface FlagAnswerPayload {
  // Renamed
  message: string;
}

// NEW: For GET /answers/incorrect-with-explanations
export interface IncorrectAnswersWithExplanationsPayload {
  incorrectAnswers: {
    answer_id: number;
    user_answer: string;
    correct_answer: string;
    explanation: string;
    question_text: string;
    question_options: Record<string, any>;
    test_title: string;
    course_title: string;
    answered_at: string;
  }[];
  count: number;
}

// NEW: For PUT /answers/:answerId/definition
export interface UpdateAnswerDefinitionPayload {
  message: string;
  answer: Answer & {
    answer_id: number;
    created_at: string;
  };
}

// NEW: For GET /answers/explanation-stats
export interface AnswerExplanationStatsPayload {
  totalAnswers: number;
  totalWithExplanations: number;
  correctAnswersWithExplanations: number;
  incorrectAnswersWithExplanations: number;
  explanationCoveragePercentage: number;
}

// --- Service Input DTOs (updated with answerDefinition) ---
export interface CreateAnswerInput {
  resultId: number; // This should be part of the data sent to the backend
  questionId: number;
  userAnswer: string;
  isCorrect: boolean;
  timeSpent?: number;
  answerDefinition?: string; // NEW: Optional explanation field
}

// --- Service Functions ---

export const createAnswer = async (
  data: CreateAnswerInput,
): Promise<CreatedAnswerPayload> => {
  const response = await apiRequest<CreatedAnswerPayload>(
    '/answers',
    'POST',
    data,
  );
  if (!response.data) {
    throw new Error('Failed to create answer: No data returned from server');
  }
  return response.data;
};

export const createBatchAnswers = async (
  answers: CreateAnswerInput[],
): Promise<CreatedBatchAnswersPayload> => {
  // Backend expects an object { answers: [...] } based on your original code
  const response = await apiRequest<CreatedBatchAnswersPayload>(
    '/answers/batch',
    'POST',
    { answers },
  );
  if (!response.data) {
    throw new Error(
      'Failed to create batch answers: No data returned from server',
    );
  }
  return response.data;
};

export const getAnswersByResultId = async (
  resultId: number,
): Promise<AnswersByResultPayload> => {
  const response = await apiRequest<AnswersByResultPayload>(
    `/answers/result/${resultId}`,
  );
  return response.data || []; // Default to empty array
};

export const getAnswerStats = async (
  userId?: number,
  topicId?: number,
  subtopicId?: number,
  startDate?: string,
  endDate?: string,
): Promise<AnswerStatsPayload> => {
  let url = '/answers/stats';
  const params = new URLSearchParams();
  if (userId) params.append('userId', userId.toString());
  if (topicId) params.append('topicId', topicId.toString());
  if (subtopicId) params.append('subtopicId', subtopicId.toString());
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const queryString = params.toString();
  if (queryString) url += `?${queryString}`;

  const response = await apiRequest<AnswerStatsPayload>(url);

  if (!response.data || typeof response.data !== 'object') {
    console.warn('No answer stats data received, returning defaults.');
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
      topics: [], // Ensure topics defaults to an empty array
    };
  }
  // Ensure topics is an array even if backend omits it when empty
  return {
    ...response.data,
    topics: response.data.topics || [],
  };
};

export const flagAnswer = async (
  answerId: number,
  reason: string,
): Promise<FlagAnswerPayload> => {
  const response = await apiRequest<FlagAnswerPayload>(
    `/answers/${answerId}/flag`,
    'POST',
    { reason },
  );
  if (!response.data || !response.data.message) {
    // If backend sends empty 200/204, or message is missing
    return { message: 'Answer was successfully flagged.' };
  }
  return response.data;
};

// NEW: Get user's incorrect answers with explanations
export const getIncorrectAnswersWithExplanations = async (
  limit: number = 10,
): Promise<IncorrectAnswersWithExplanationsPayload> => {
  const response = await apiRequest<IncorrectAnswersWithExplanationsPayload>(
    `/answers/incorrect-with-explanations?limit=${limit}`,
  );

  if (!response.data || typeof response.data !== 'object') {
    console.warn(
      'No incorrect answers with explanations data received, returning defaults.',
    );
    return {
      incorrectAnswers: [],
      count: 0,
    };
  }
  return response.data;
};

// NEW: Update answer definition (admin/instructor only)
export const updateAnswerDefinition = async (
  answerId: number,
  answerDefinition: string,
): Promise<UpdateAnswerDefinitionPayload> => {
  const response = await apiRequest<UpdateAnswerDefinitionPayload>(
    `/answers/${answerId}/definition`,
    'PUT',
    { answerDefinition },
  );
  if (!response.data) {
    throw new Error(
      'Failed to update answer definition: No data returned from server',
    );
  }
  return response.data;
};

// NEW: Get answer explanation statistics
export const getAnswerExplanationStats =
  async (): Promise<AnswerExplanationStatsPayload> => {
    const response = await apiRequest<AnswerExplanationStatsPayload>(
      '/answers/explanation-stats',
    );

    if (!response.data || typeof response.data !== 'object') {
      console.warn(
        'No answer explanation stats data received, returning defaults.',
      );
      return {
        totalAnswers: 0,
        totalWithExplanations: 0,
        correctAnswersWithExplanations: 0,
        incorrectAnswersWithExplanations: 0,
        explanationCoveragePercentage: 0,
      };
    }
    return response.data;
  };
