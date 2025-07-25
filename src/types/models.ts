export interface User {
  id: number;
  userId: number;
  username: string;
  email: string;
  dateRegistered: string;
  role: string;
  subscriptionType: string;
  totalDuels: number;
  duelsWon: number;
  duelsLost: number;
  longestLosingStreak: number;
  currentLosingStreak: number;
  totalStudyTime: number;
  permissions?: string[];
  // OAuth fields
  oauthProvider?: string | null;
  isOAuthUser?: boolean;
  // NEW: Preferred course field
  preferred_course_id?: number | null;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string | null;
}

// Course related types - UPDATED WITH COURSE_TYPE
export interface Course {
  course_id: number;
  title: string;
  description?: string;
  image_url?: string;
  course_type: 'temel_dersler' | 'klinik_dersler'; // Course type field
  created_at: string;
}

// NEW: Klinik Course interface for study tracking
export interface KlinikCourse {
  course_id: number;
  title: string;
  description?: string;
  topic_count: number;
}

export interface Topic {
  topic_id: number;
  course_id: number;
  title: string;
  description?: string;
  order_index: number;
  created_at: string;
}

export interface Subtopic {
  subtopic_id: number;
  topic_id: number;
  title: string;
  description?: string;
  order_index: number;
  created_at: string;
}

// Test related types - UPDATED WITH COURSE_ID AND TOPIC_ID
export interface Test {
  test_id: number;
  title: string;
  description?: string;
  difficulty_level?: number;
  question_count: number;
  time_limit: number;
  course_id: number; // Course relationship field
  topic_id?: number; // Optional topic relationship field
  created_at: string;
  // Populated via joins in API responses
  courses?: {
    course_id: number;
    title: string;
    course_type: 'temel_dersler' | 'klinik_dersler';
  };
  topics?: {
    topic_id: number;
    title: string;
    description?: string;
  };
}

export interface Question {
  question_id: number;
  test_id: number;
  question_text: string;
  options?: Record<string, any>;
  correct_answer: string;
  created_at: string;
  explanation?: string;
}

// UPDATED: Answer interface with answer_definition field
export interface Answer {
  answer_id: number;
  result_id: number;
  question_id: number;
  user_answer: string;
  is_correct: boolean;
  answer_definition?: string; // Optional explanation field
  created_at: string;
}

export interface TestResult {
  result_id: number;
  user_id: number;
  test_id: number;
  score: number;
  date_taken: string;
  time_taken?: number;
}

// ===============================
// NEW: ENHANCED STUDY TRACKING TYPES
// ===============================

// Enhanced StudySession interface for chronometer functionality
export interface StudySession {
  session_id: number;
  user_id: number;
  topic_id: number;
  start_time: string;
  end_time?: string | null;
  duration_seconds?: number | null;
  session_date: string;
  notes?: string | null;
  end_notes?: string | null;
  status: 'active' | 'completed';
  created_at: string;
  updated_at: string;
  // Populated via joins
  topics?: {
    topic_id: number;
    title: string;
    courses: {
      course_id: number;
      title: string;
    };
  };
}

// User topic details interface
export interface UserTopicDetails {
  user_id: number;
  topic_id: number;
  tekrar_sayisi?: number | null;
  konu_kaynaklari?: string[] | null;
  soru_bankasi_kaynaklari?: string[] | null;
  difficulty_rating?: number | null; // 1-5 scale
  notes?: string | null;
  is_completed?: boolean;
  created_at: string;
  updated_at: string;
  // Populated via joins
  topics?: {
    topic_id: number;
    title: string;
    description?: string;
    courses: {
      course_id: number;
      title: string;
    };
  };
}

// Course study overview interface
export interface CourseStudyOverview {
  user_id: number;
  course_id: number;
  course_title: string;
  topic_id: number;
  topic_title: string;
  total_study_hours: number;
  total_sessions: number;
  average_session_duration: number;
  last_studied_at?: string | null;
  completion_percentage: number;
  notes_count: number;
}

// All courses statistics interface
export interface AllCoursesStatistics {
  course_id: number;
  course_title: string;
  total_topics: number;
  studied_topics: number;
  completion_percentage: number;
  total_study_hours: number;
  is_preferred: boolean;
}

// Overall study statistics interface
export interface StudyStatistics {
  user_id: number;
  total_study_hours: number;
  total_sessions: number;
  unique_topics_studied: number;
  unique_courses_studied: number;
  average_session_duration: number;
  longest_session_minutes: number;
  total_notes: number;
  current_streak_days: number;
  longest_streak_days: number;
  last_study_date?: string | null;
  this_week_hours: number;
  this_month_hours: number;
}

// Preferred course interface
export interface PreferredCourse {
  course_id: number;
  title: string;
  description?: string;
}

// ===============================
// NEW: ANALYTICS TYPES
// ===============================

// Streak Analytics Types
export interface LongestStreak {
  streak_type: 'topic' | 'course' | 'daily_study';
  topic_title?: string;
  course_title?: string;
  longest_streak_seconds: number;
  longest_streak_minutes: number;
  longest_streak_hours: number;
  longest_streak_date: string;
}

export interface StreaksSummary {
  longest_single_session_minutes: number;
  longest_single_session_topic?: string;
  longest_single_session_course?: string;
  longest_topic_streak_minutes: number;
  longest_course_streak_minutes: number;
}

export interface StreaksAnalytics {
  user_id: number;
  streak_type: string;
  topic_id?: number;
  topic_title?: string;
  course_id?: number;
  course_title?: string;
  longest_streak_seconds: number;
  longest_streak_minutes: number;
  longest_streak_hours: number;
  longest_streak_date: string;
  created_at: string;
}

// Progress Analytics Types
export interface DailyProgress {
  study_date: string;
  daily_study_minutes: number;
  daily_sessions: number;
  daily_topics_studied: number;
  daily_questions_answered: number;
  daily_accuracy_percentage: number;
}

export interface WeeklyProgress {
  week_start: string;
  week_end: string;
  weekly_study_hours: number;
  weekly_sessions: number;
  weekly_topics_studied: number;
  weekly_consistency_percentage: number;
  weekly_accuracy_percentage: number;
}

// Course Analytics Types
export interface TopCourse {
  course_id: number;
  course_title: string;
  total_time_hours: number;
  study_session_hours: number;
  duel_hours: number;
  topics_studied: number;
  accuracy_percentage: number;
  rank: number;
}

export interface MostStudiedCourse {
  user_id: number;
  course_id: number;
  course_title: string;
  total_time_hours: number;
  study_session_hours: number;
  duel_hours: number;
  topics_studied: number;
  sessions_count: number;
  time_rank: number;
  percentage_of_total: number;
}

// Comparative Analytics Types
export interface ComparativeMetric {
  metric_name: string;
  user_value: number;
  platform_average: number;
  user_rank: number;
  total_users: number;
  percentile: number;
}

// Recent Activity Types
export interface RecentActivity {
  period_name: string;
  total_study_minutes: number;
  total_sessions: number;
  unique_topics: number;
  unique_courses: number;
  total_questions: number;
  accuracy_percentage: number;
  consistency_days: number;
  best_day?: string;
  best_day_minutes?: number;
}

// Dashboard Analytics Types
export interface DashboardAnalytics {
  total_study_hours: number;
  total_sessions: number;
  unique_topics_studied: number;
  unique_courses_studied: number;
  longest_session_minutes: number;
  average_session_minutes: number;
  current_streak_days: number;
  longest_streak_days: number;
  most_studied_course?: string;
  most_studied_topic?: string;
  last_study_date?: string;
  last_7_days_hours: number;
  last_30_days_hours: number;
}

// Analytics Summary Types
export interface AnalyticsSummary {
  user_id: number;
  total_study_time_hours: number;
  total_sessions: number;
  average_session_duration: number;
  unique_topics_count: number;
  unique_courses_count: number;
  longest_streak_minutes: number;
  current_streak_days: number;
  total_questions_answered: number;
  overall_accuracy: number;
  most_active_time_period?: string;
  most_studied_course?: string;
  improvement_rate?: number;
  consistency_score?: number;
  last_activity_date?: string;
}

// Comprehensive Analytics Type
export interface ComprehensiveAnalytics {
  dashboard: DashboardAnalytics | null;
  summary: AnalyticsSummary | null;
  longestStreaks: LongestStreak[];
  dailyProgress: DailyProgress[];
  weeklyProgress: WeeklyProgress[];
  topCourses: TopCourse[];
  comparative: ComparativeMetric[];
  recentActivity: RecentActivity[];
}

// ===============================
// EXISTING TYPES (Updated where needed)
// ===============================

// Course Statistics Types
export interface CourseStatistics {
  course_id: number;
  title: string;
  course_type: 'temel_dersler' | 'klinik_dersler';
  total_tests: number;
  total_questions: number;
  total_attempts: number;
  average_score: number;
  completion_rate: number;
  created_at: string;
}

// UPDATED: Test Statistics Types with topic support
export interface TestStatistics {
  test_id: number;
  title: string;
  course_id: number;
  topic_id?: number; // Optional topic reference
  total_questions: number;
  total_attempts: number;
  average_score: number;
  completion_rate: number;
  average_time_taken: number;
  created_at: string;
  // Populated via joins
  course?: {
    course_id: number;
    title: string;
    course_type: 'temel_dersler' | 'klinik_dersler';
  };
  topic?: {
    topic_id: number;
    title: string;
    description?: string;
  };
}

// Topic Statistics Types
export interface TopicStatistics {
  topic_id: number;
  title: string;
  course_id: number;
  total_tests: number;
  total_questions: number;
  total_attempts: number;
  average_score: number;
  completion_rate: number;
  created_at: string;
}

// UPDATED: User Question History Types with topic support
export interface UserQuestionHistory {
  user_id: number;
  question_id: number;
  test_id: number;
  course_id: number;
  topic_id?: number; // Optional topic reference
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
  answered_at: string;
  time_taken?: number;
  answer_definition?: string; // Optional explanation field
}

export interface UserCourseStats {
  user_id: number;
  course_id: number;
  course_title: string;
  course_type: 'temel_dersler' | 'klinik_dersler';
  total_questions_answered: number;
  correct_answers: number;
  incorrect_answers: number;
  accuracy_percentage: number;
  total_time_spent: number;
  last_activity: string;
  tests_taken: number;
  avg_score: number;
}

// User Topic Stats Types
export interface UserTopicStats {
  user_id: number;
  topic_id: number;
  topic_title: string;
  course_id: number;
  course_title: string;
  total_questions_answered: number;
  correct_answers: number;
  incorrect_answers: number;
  accuracy_percentage: number;
  total_time_spent: number;
  last_activity: string;
  tests_taken: number;
  avg_test_score: number;
  test_accuracy: number;
}

export interface UserTestHistory {
  user_id: number;
  test_id: number;
  test_title: string;
  course_id: number;
  topic_id?: number; // Optional topic reference
  score: number;
  total_questions: number;
  correct_answers: number;
  time_taken: number;
  completed_at: string;
  attempt_number: number;
}

export interface UserPerformanceTrends {
  user_id: number;
  course_type: 'temel_dersler' | 'klinik_dersler';
  weekly_stats: Array<{
    week: string;
    questions_answered: number;
    accuracy_percentage: number;
    avg_score: number;
    time_spent: number;
  }>;
  monthly_stats: Array<{
    month: string;
    questions_answered: number;
    accuracy_percentage: number;
    avg_score: number;
    time_spent: number;
  }>;
}

export interface ReviewQuestion {
  question_id: number;
  question_text: string;
  options: Record<string, any>;
  correct_answer: string;
  test_id: number;
  test_title: string;
  course_id: number;
  course_title: string;
  topic_id?: number; // Optional topic reference
  topic_title?: string; // Optional topic title
  user_answer: string;
  is_correct: boolean;
  answered_at: string;
  mistake_count: number;
  last_mistake: string;
  answer_explanation?: string; // Optional explanation for the correct answer
}

export interface UserPerformanceSummary {
  user_id: number;
  total_questions_answered: number;
  total_correct_answers: number;
  overall_accuracy: number;
  total_tests_taken: number;
  avg_test_score: number;
  total_study_time: number;
  streak_days: number;
  courses_progress: Array<{
    course_id: number;
    course_title: string;
    course_type: 'temel_dersler' | 'klinik_dersler';
    progress_percentage: number;
    questions_answered: number;
    accuracy: number;
  }>;
  // Topic progress breakdown
  topics_progress: Array<{
    topic_id: number;
    topic_title: string;
    course_id: number;
    progress_percentage: number;
    questions_answered: number;
    accuracy: number;
    tests_taken: number;
    avg_test_score: number;
  }>;
  recent_activity: Array<{
    activity_type: 'test_completed' | 'question_answered' | 'study_session';
    description: string;
    timestamp: string;
    score?: number;
    topic_id?: number; // Optional topic reference
    topic_title?: string; // Optional topic title
  }>;
}

// UPDATED: Answer Explanation Types with enhanced topic support
export interface AnswerExplanation {
  answer_id: number;
  question_text: string;
  user_answer: string;
  correct_answer: string;
  explanation: string;
  question_options: Record<string, any>;
  test_title: string;
  course_title: string;
  topic_id?: number; // Optional topic reference
  topic_title?: string; // Optional topic title
  topic_description?: string; // Optional topic description
  answered_at: string;
}

export interface AnswerExplanationStats {
  totalAnswers: number;
  totalWithExplanations: number;
  correctAnswersWithExplanations: number;
  incorrectAnswersWithExplanations: number;
  explanationCoveragePercentage: number;
  // Topic breakdown
  topicBreakdown: Array<{
    topic_id: number;
    topic_title: string;
    total_explanations: number;
    explanation_coverage: number;
  }>;
}

// ===============================
// EXISTING TYPES (Unchanged)
// ===============================

// Duel related types
export interface Duel {
  duel_id: number;
  initiator_id: number;
  opponent_id: number;
  test_id?: number;
  status: 'pending' | 'active' | 'completed';
  start_time?: string;
  end_time?: string;
  question_count: number;
  branch_type?: string;
  selection_type?: string;
  branch_id?: number;
  created_at: string;

  // Extended properties populated via joins in API responses
  course_name?: string;
  course_title?: string;
  test_name?: string;
  test_title?: string;
  opponent_username?: string;
  initiator_username?: string;

  // Populated via joins with related tables
  test?: {
    test_id: number;
    title: string;
    course_id: number;
    topic_id?: number;
  };
  course?: {
    course_id: number;
    title: string;
    course_type: 'temel_dersler' | 'klinik_dersler';
  };
  topic?: {
    topic_id: number;
    title: string;
    description?: string;
  };
  initiator?: {
    user_id: number;
    username: string;
  };
  opponent?: {
    user_id: number;
    username: string;
  };
}

export interface DuelResult {
  duel_id: number;
  winner_id?: number;
  initiator_score: number;
  opponent_score: number;
  created_at: string;
}

// Study related types (Legacy - keeping for backward compatibility)
export interface StudyProgress {
  progress_id: number;
  user_id: number;
  subtopic_id: number;
  repetition_count: number;
  mastery_level: number;
  last_studied_at?: string;
  created_at: string;
}

export interface SessionDetail {
  detail_id: number;
  session_id: number;
  subtopic_id: number;
  duration?: number;
  created_at: string;
}

// Analytics types (Legacy)
export interface ErrorAnalytic {
  error_id: number;
  user_id: number;
  subtopic_id: number;
  error_count: number;
  total_attempts: number;
  last_updated_at: string;
}

// Social types
export interface Friend {
  friendship_id: number;
  user_id: number;
  friend_id: number;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  friend_username?: string;
  friend_email?: string;
}

export interface FriendRequest {
  friendship_id: number;
  user_id: number;
  friend_id: number;
  status: 'pending';
  created_at: string;
}

// Subscription types
export interface Subscription {
  subscription_id: number;
  user_id: number;
  subscription_type: string;
  start_date: string;
  end_date: string;
  payment_reference?: string;
  amount?: number;
  is_active: boolean;
  created_at: string;
}

// OAuth specific types
export interface OAuthProvider {
  name: 'google' | 'apple' | 'facebook';
  displayName: string;
  color: string;
  textColor?: string;
}

export interface OAuthSession {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  expires_in?: number;
  token_type?: string;
}

export interface OAuthCallbackData {
  user: User;
  session: OAuthSession;
  provider: string;
}

// API Error types
export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

export interface Notification {
  notification_id: number;
  user_id: number;
  notification_type: NotificationType;
  title: string;
  body: string;
  action_url?: string | null;
  icon_name?: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  is_read: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  sent_at?: string;
  read_at?: string | null;
}

export type NotificationType =
  | 'study_reminder'
  | 'achievement_unlock'
  | 'duel_invitation'
  | 'duel_result'
  | 'friend_request'
  | 'friend_activity'
  | 'content_update'
  | 'streak_reminder'
  | 'plan_reminder'
  | 'coaching_note'
  | 'motivational_message'
  | 'system_announcement';

export interface NotificationPreferences {
  notification_type: NotificationType;
  in_app_enabled: boolean;
  push_enabled: boolean;
  email_enabled: boolean;
  frequency_hours: number;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  created_at: string;
  updated_at: string;
}

export interface DeviceToken {
  user_id: number;
  device_token: string;
  platform: 'ios' | 'android' | 'web';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationStats {
  total_notifications: number;
  read_count: number;
  unread_count: number;
  type_counts: Record<NotificationType, number>;
}

export interface NotificationResponse {
  notifications: Notification[];
  unread_count: number;
  total_count: number;
}

export interface NotificationTemplate {
  template_name: string;
  notification_type: NotificationType;
  title_template: string;
  body_template: string;
  action_url_template?: string;
  icon_name?: string;
  is_active: boolean;
}

export interface BulkNotificationRequest {
  userId: number;
  notificationType: NotificationType;
  templateName: string;
  variables?: Record<string, any>;
}

export interface TestNotificationRequest {
  template_name: string;
  notification_type: NotificationType;
  variables?: Record<string, any>;
}
