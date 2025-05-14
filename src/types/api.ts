// src/types/api.ts

// This file extends your models.ts with additional type definitions for API responses

import {
  User,
  Course,
  Topic,
  Subtopic,
  Test,
  Question,
  Answer,
  TestResult,
  Duel,
  DuelResult,
  StudyProgress,
  StudySession,
  SessionDetail,
  ErrorAnalytic,
  Friend,
  FriendRequest,
  Subscription,
} from './models';

// Generic API Response types
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Auth API Responses
export interface LoginResponse
  extends ApiResponse<{
    user: User;
    token: string;
  }> {}

export interface RegisterResponse
  extends ApiResponse<{
    user: User;
    token: string;
  }> {}

export interface RefreshTokenResponse
  extends ApiResponse<{
    token: string;
    refreshToken: string;
  }> {}

// Course API Responses
export interface GetCoursesResponse extends ApiResponse<Course[]> {}

export interface GetCourseResponse extends ApiResponse<Course> {}

export interface CourseProgressResponse
  extends ApiResponse<{
    course_id: number;
    progress: number;
    last_studied_at: string;
  }> {}

// Topics & Subtopics
export interface GetTopicsResponse extends ApiResponse<Topic[]> {}

export interface GetTopicResponse extends ApiResponse<Topic> {}

export interface GetSubtopicsResponse extends ApiResponse<Subtopic[]> {}

export interface GetSubtopicResponse extends ApiResponse<Subtopic> {}

// Tests API Responses
export interface GetTestsResponse extends ApiResponse<Test[]> {}

export interface GetTestResponse
  extends ApiResponse<
    Test & {
      questions: Question[];
    }
  > {}

export interface SubmitTestResponse
  extends ApiResponse<{
    testResult: TestResult;
    correctAnswers: number;
    totalQuestions: number;
  }> {}

export interface GetTestResultsResponse extends ApiResponse<TestResult[]> {}

// Duel API Responses
export interface GetDuelsResponse extends ApiResponse<Duel[]> {}

export interface GetDuelResponse
  extends ApiResponse<
    Duel & {
      questions?: Question[];
      result?: DuelResult;
    }
  > {}

export interface CreateDuelResponse extends ApiResponse<Duel> {}

export interface SubmitDuelResponse
  extends ApiResponse<{
    duelResult: DuelResult;
  }> {}

// Study API Responses
export interface GetStudyProgressResponse
  extends ApiResponse<StudyProgress[]> {}

export interface UpdateStudyProgressResponse
  extends ApiResponse<StudyProgress> {}

export interface GetStudySessionsResponse extends ApiResponse<StudySession[]> {}

export interface CreateStudySessionResponse extends ApiResponse<StudySession> {}

export interface EndStudySessionResponse
  extends ApiResponse<
    StudySession & {
      duration: number;
    }
  > {}

// Analytics API Responses
export interface GetErrorAnalyticsResponse
  extends ApiResponse<ErrorAnalytic[]> {}

export interface GetUserStatsResponse
  extends ApiResponse<{
    totalStudyTime: number;
    totalSessions: number;
    averageSessionDuration: number;
    totalTests: number;
    totalTestsCompleted: number;
    averageTestScore: number;
    totalDuels: number;
    duelsWon: number;
    duelsLost: number;
    duelWinRate: number;
  }> {}

// Friend API Responses
export interface GetFriendsResponse extends ApiResponse<Friend[]> {}

export interface GetFriendRequestsResponse
  extends ApiResponse<FriendRequest[]> {}

export interface SendFriendRequestResponse extends ApiResponse<FriendRequest> {}

export interface AcceptFriendRequestResponse extends ApiResponse<Friend> {}

// Subscription API Responses
export interface GetSubscriptionResponse extends ApiResponse<Subscription> {}

export interface CreateSubscriptionResponse
  extends ApiResponse<
    Subscription & {
      paymentUrl?: string;
    }
  > {}

// File Upload Response
export interface FileUploadResponse
  extends ApiResponse<{
    fileUrl: string;
    fileId: string;
  }> {}

// Error Response
export interface ErrorResponse {
  status: 'error';
  error: string;
  message: string;
  statusCode?: number;
}
