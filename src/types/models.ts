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

// Course related types - UPDATED WITH COURSE_TYPE AND NICKNAMES
export interface Course {
  course_id: number;
  title: string;
  description?: string;
  image_url?: string;
  course_type: 'temel_dersler' | 'klinik_dersler'; // Course type field
  nicknames?: string | null; // ✅ NEW: Nicknames field
  created_at: string;
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
// ACHIEVEMENT SYSTEM TYPES - UPDATED FOR COURSE-BASED SYSTEM
// ===============================

export interface Achievement {
  achievement_id: number;
  name: string;
  description?: string;
  requirements: any;
  category?: string;
  icon?: string;
  points?: number;
  created_at: string;
}

export interface UserAchievement extends Achievement {
  date_earned: string;
  progress?: number;
}

// Achievement progress interfaces
export interface AchievementProgress {
  achievement_id: number;
  name: string;
  description: string;
  overall_progress: number;
  requirements: Record<
    string,
    {
      current: number;
      required: number | boolean;
      progress: number;
    }
  >;
}

export interface UserAchievementProgressPayload {
  message: string;
  progress: AchievementProgress[];
}

// Achievement checking interfaces
export interface CheckAchievementsPayload {
  message: string;
  newAchievements: number;
  achievements: Array<{
    id: number;
    name: string;
    description: string;
  }>;
}

// UPDATED: User statistics interfaces with course-based metrics
export interface UserStatistics {
  user_id: number;
  date_registered: string;
  total_duels: number;
  duels_won: number;
  duels_lost: number;
  distinct_study_days: number;
  total_study_time_minutes: number;
  current_study_streak: number;
  longest_study_streak: number;
  weekly_champion_count: number;
  user_registration: boolean;

  // ✅ NEW: Course-based metrics
  courses_studied: number;
  courses_completed: number;
  total_course_study_time_seconds: number;
  total_course_study_time_minutes: number;
  total_course_sessions: number;
}

export interface UserStatsPayload {
  message: string;
  stats: UserStatistics;
}

// Bulk check interfaces
export interface BulkCheckResult {
  userId: number;
  success: boolean;
  newAchievements: number;
  achievements?: Array<{
    id: number;
    name: string;
  }>;
  error?: string;
}

export interface BulkCheckPayload {
  message: string;
  summary: {
    totalUsers: number;
    successfulChecks: number;
    failedChecks: number;
    totalNewAchievements: number;
  };
  results: BulkCheckResult[];
}

// Achievement statistics interfaces
export interface AchievementStatsPayload {
  message: string;
  stats: {
    totalAchievements: number;
    totalUserAchievements: number;
    recentAchievements: number;
    averageAchievementsPerUser: number;
    distribution: Array<{
      achievement_id: number;
      name: string;
      count: number;
    }>;
  };
}

// Achievement leaderboard interface
export interface AchievementLeaderboardPayload {
  message: string;
  leaderboard: Array<{
    user_id: number;
    username: string;
    count: number;
  }>;
}

// ✅ NEW: Course study metrics interface
export interface CourseStudyMetrics {
  total_courses_studied: number;
  total_courses_completed: number;
  total_study_time_all_courses: number;
  course_types_studied: number;
  average_completion_percentage: number;
}

export interface CourseStudyMetricsPayload {
  message: string;
  metrics: CourseStudyMetrics;
}

// Achievement creation interfaces
export interface CreateAchievementInput {
  name: string;
  description?: string;
  requirements: any;
  category?: string;
  icon?: string;
  points?: number;
}

export interface AchievementMutationPayload {
  message: string;
  achievement: Achievement;
}

// ===============================
// NOTIFICATION SYSTEM TYPES - UPDATED FOR COURSE-BASED SYSTEM
// ===============================

// UPDATED: Notification types with course-specific types
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
  | 'system_announcement'
  // ✅ NEW: Course-specific notification types
  | 'course_reminder' // For course-specific study reminders
  | 'course_completed' // For course completion notifications
  | 'course_progress' // For course progress updates
  | 'course_milestone' // For course milestone achievements
  | 'course_study_session'; // For course study session notifications

// ✅ NEW: Course notification data interface
export interface CourseNotificationData {
  course_id?: string;
  course_title?: string;
  course_description?: string;
  course_type?: 'temel_dersler' | 'klinik_dersler';
  study_duration_minutes?: number;
  break_duration_minutes?: number;
  completion_percentage?: number;
  session_date?: string;
  session_id?: number;
  total_study_time_minutes?: number;
  streak_days?: number;
}

// UPDATED: Enhanced notification interface with course data
export interface Notification {
  notification_id: number;
  user_id: number;
  notification_type: NotificationType;
  template_name: string;
  title: string;
  content: string;
  body?: string; // Alternative field name for backward compatibility
  variables?: Record<string, any>;
  data?: Record<string, any>;
  metadata?: Record<string, any>;
  action_url?: string | null;
  icon_name?: string;
  is_read: boolean;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  priority: 'high' | 'normal' | 'low';
  created_at: string;
  updated_at: string;
  sent_at?: string;
  read_at?: string | null;
  expires_at?: string;

  // ✅ NEW: Optional course data for course-related notifications
  course_data?: CourseNotificationData;
}

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
  device_info?: {
    model?: string;
    os_version?: string;
    app_version?: string;
    device_id?: string;
    is_device?: boolean;
  };
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

// ✅ NEW: Course-specific test notification request
export interface CourseTestNotificationRequest extends TestNotificationRequest {
  course_id?: string;
  course_title?: string;
  course_type?: 'temel_dersler' | 'klinik_dersler';
}

// ===============================
// COURSE-BASED STUDY TRACKING TYPES (Enhanced)
// ===============================

// Enhanced StudySession interface for course-based chronometer functionality
export interface StudySession {
  session_id: number;
  user_id: number;
  course_id: number; // CHANGED: Now course-based instead of topic-based
  start_time: string;
  end_time?: string | null;
  study_duration_seconds?: number | null; // Pure study time (excluding breaks)
  break_duration_seconds?: number | null; // Total break time ("mola")
  total_duration_seconds?: number | null; // Total session time (study + breaks)
  session_date: string;
  notes?: string | null;
  session_status: 'active' | 'completed' | 'paused';
  created_at: string;
  updated_at: string;
  // Populated via joins
  courses?: {
    course_id: number;
    title: string;
    description?: string;
    course_type: 'temel_dersler' | 'klinik_dersler';
  };
}

// ✅ NEW: Course study session data for achievements/notifications
export interface CourseStudySessionData {
  courseId: string | number;
  courseTitle?: string;
  courseType?: 'temel_dersler' | 'klinik_dersler';
  studyDurationSeconds: number;
  breakDurationSeconds?: number;
  sessionDate: string;
  sessionId?: number;
  totalDurationSeconds?: number;
  notes?: string;
}

// ✅ NEW: Course completion data for achievements/notifications
export interface CourseCompletionData {
  courseId: string | number;
  courseTitle: string;
  courseType?: 'temel_dersler' | 'klinik_dersler';
  completionPercentage: number;
  completionDate?: string;
  totalStudyTimeSeconds?: number;
  totalSessions?: number;
}

// User course details interface (replaces UserTopicDetails)
export interface UserCourseDetails {
  user_id: number;
  course_id: number; // CHANGED: Now course-based
  tekrar_sayisi?: number | null;
  konu_kaynaklari?: string[] | null;
  soru_bankasi_kaynaklari?: string[] | null;
  total_study_time_seconds?: number;
  total_break_time_seconds?: number; // NEW: Break time tracking
  total_session_count?: number;
  last_studied_at?: string | null;
  notes?: string | null;
  is_completed?: boolean;
  difficulty_rating?: number | null; // 1-5 scale
  completion_percentage?: number;
  created_at: string;
  updated_at: string;
  // Populated via joins
  courses?: {
    course_id: number;
    title: string;
    description?: string;
    course_type: 'temel_dersler' | 'klinik_dersler';
  };
}

// Course study overview interface (replaces CourseStudyOverview)
export interface CourseStudyOverview {
  user_id: number;
  course_id: number;
  course_title: string;
  course_description?: string;
  course_type: 'temel_dersler' | 'klinik_dersler';
  tekrar_sayisi?: number;
  konu_kaynaklari?: string[] | null;
  soru_bankasi_kaynaklari?: string[] | null;
  total_study_time_seconds: number;
  total_break_time_seconds: number; // NEW: Break time tracking
  total_session_count: number;
  total_study_time_minutes: number;
  total_study_time_hours: number;
  last_studied_at?: string | null;
  notes?: string | null;
  is_completed: boolean;
  difficulty_rating?: number | null;
  completion_percentage: number;
  completed_sessions: number;
  active_session_id?: number | null;
  details_created_at?: string;
  details_updated_at?: string;
}

// All courses statistics interface (updated for course-based)
export interface AllCoursesStatistics {
  course_id: number;
  course_title: string;
  course_description?: string;
  course_type: 'temel_dersler' | 'klinik_dersler';
  total_study_seconds_in_course: number;
  total_study_hours_in_course: number;
  completion_percentage: number;
  last_studied_in_course?: string | null;
  is_preferred_course: boolean;
  total_sessions_in_course: number;
  total_break_seconds_in_course: number; // NEW: Break time tracking
}

// Overall study statistics interface (updated for course-based)
export interface StudyStatistics {
  user_id: number;
  username: string;
  preferred_course_id?: number | null;
  preferred_course_title?: string | null;
  courses_studied: number; // Number of courses with study time > 0
  courses_completed: number; // Number of completed courses
  total_study_seconds: number;
  total_study_hours: number;
  total_sessions: number;
  avg_session_duration_seconds: number;
  last_study_date?: string | null;
  total_break_seconds: number; // NEW: Break time tracking
  courses_studied_this_week: number;
}

// Preferred course interface
export interface PreferredCourse {
  course_id: number;
  title: string;
  description?: string;
  course_type: 'temel_dersler' | 'klinik_dersler';
  image_url?: string;
}

// ===============================
// COURSE-BASED ANALYTICS TYPES (Enhanced)
// ===============================

// Streak Analytics Types (updated for course-based)
export interface LongestStreak {
  streak_type: 'course';
  course_title?: string;
  longest_streak_seconds: number;
  longest_streak_minutes: number;
  longest_streak_hours: number;
  longest_streak_date: string;
  total_sessions: number;
  total_study_seconds: number;
  average_session_seconds: number;
}

export interface StreaksSummary {
  longest_single_session_minutes: number;
  longest_single_session_course?: string | null;
  current_streak_days: number;
  longest_streak_days: number;
}

export interface StreaksAnalytics {
  user_id: number;
  streak_type: string;
  course_id?: number;
  course_title?: string;
  longest_streak_seconds: number;
  longest_streak_minutes: number;
  longest_streak_hours: number;
  longest_streak_date: string;
  created_at: string;
}

// Progress Analytics Types (updated for course-based)
export interface DailyProgress {
  study_date: string;
  daily_study_minutes: number;
  daily_break_minutes: number; // NEW: Break time tracking
  daily_sessions: number;
  daily_courses_studied: number; // CHANGED: From topics to courses
}

export interface WeeklyProgress {
  week_start: string;
  week_end: string;
  weekly_study_hours: number;
  weekly_break_hours: number; // NEW: Break time tracking
  weekly_sessions: number;
  weekly_courses_studied: number; // CHANGED: From topics to courses
  weekly_study_days: number;
  weekly_consistency_percentage: number;
}

// Course Analytics Types (updated)
export interface TopCourse {
  rank: number;
  course_id: number;
  course_title: string;
  course_type: 'temel_dersler' | 'klinik_dersler';
  total_time_hours: number;
  study_session_hours: number;
  break_hours: number; // NEW: Break time tracking
  total_sessions: number;
  completion_percentage: number;
  is_completed: boolean;
  last_studied_at?: string | null;
  difficulty_rating?: number | null;
  tekrar_sayisi: number;
}

export interface MostStudiedCourse {
  user_id: number;
  course_id: number;
  course_title: string;
  course_type: 'temel_dersler' | 'klinik_dersler';
  total_time_hours: number;
  study_session_hours: number;
  break_hours: number; // NEW: Break time tracking
  total_sessions: number;
  completion_percentage: number;
  is_completed: boolean;
  time_rank: number;
  last_studied_at?: string | null;
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

// Recent Activity Types (updated for course-based)
export interface RecentActivity {
  period_name: string;
  total_study_minutes: number;
  total_break_minutes: number; // NEW: Break time tracking
  total_sessions: number;
  unique_courses: number; // CHANGED: From topics to courses
  consistency_days: number;
  best_day?: string | null;
  best_day_minutes?: number;
}

// Dashboard Analytics Types (updated for course-based)
export interface DashboardAnalytics {
  total_study_hours: number;
  total_sessions: number;
  unique_topics_studied: number; // DEPRECATED: Will be removed
  unique_courses_studied: number; // NEW: Course-based metric
  courses_completed: number; // NEW: Course completion metric
  longest_session_minutes: number;
  average_session_minutes: number;
  current_streak_days: number;
  longest_streak_days?: number;
  most_studied_course?: string | null; // CHANGED: From topic to course
  most_studied_topic?: string | null; // DEPRECATED: Will be removed
  last_study_date?: string | null;
  last_7_days_hours: number;
  last_30_days_hours: number;
  courses_studied_this_week: number; // NEW: Course-based metric
}

// Analytics Summary Types (updated for course-based)
export interface AnalyticsSummary {
  user_id: number;
  total_study_time_hours: number;
  total_sessions: number;
  average_session_duration: number;
  unique_topics_count: number; // DEPRECATED: Will be removed
  unique_courses_count: number; // NEW: Course-based metric
  courses_completed_count: number; // NEW: Course completion metric
  longest_streak_minutes: number;
  current_streak_days: number;
  total_questions_answered: number;
  overall_accuracy: number;
  total_break_time_hours?: number; // NEW: Break time tracking
  most_active_time_period?: string;
  most_studied_course?: string;
  improvement_rate?: number;
  consistency_score?: number;
  last_activity_date?: string;
}

// Comprehensive Analytics Type (updated for course-based)
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
// REMAINING TYPES (Updated where needed)
// ===============================

// Course Statistics Types
export interface CourseStatistics {
  course_id: number;
  title: string;
  course_type: 'temel_dersler' | 'klinik_dersler';
  total_users: number; // NEW: User engagement metrics
  total_completed_users: number; // NEW: Completion metrics
  total_study_time_seconds: number; // NEW: Study time metrics
  total_sessions: number; // NEW: Session metrics
  total_tests: number;
  total_questions: number;
  total_attempts: number;
  average_score: number;
  average_study_time_per_user: number; // NEW: Average study time
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

// User Topic Stats Types (still exists for content management)
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
  // Topic progress breakdown (still exists for content management)
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
// DEPRECATED TYPES (Topic-based study tracking)
// ===============================

/**
 * @deprecated Use UserCourseDetails instead
 */
export interface UserTopicDetails {
  user_id: number;
  topic_id: number;
  tekrar_sayisi?: number | null;
  konu_kaynaklari?: string[] | null;
  soru_bankasi_kaynaklari?: string[] | null;
  difficulty_rating?: number | null;
  notes?: string | null;
  is_completed?: boolean;
  created_at: string;
  updated_at: string;
  total_study_time_seconds?: number;
  last_studied_at?: string;
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

/**
 * @deprecated Course-based system no longer uses this structure
 */
export interface KlinikCourse {
  course_id: number;
  title: string;
  description?: string;
  topic_count: number;
}

// ===============================
// SOCIAL & OTHER TYPES (Unchanged)
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

// ===============================
// UTILITY TYPES
// ===============================

export interface MessagePayload {
  message: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  status?: number;
  error?: string;
}

// ===============================
// ACTION TYPES FOR ACHIEVEMENTS/NOTIFICATIONS
// ===============================

export type AchievementActionType =
  | 'study_session_completed' // Legacy support
  | 'course_study_session_completed' // ✅ NEW: Course-based study session
  | 'course_completed' // ✅ NEW: Course completion
  | 'duel_completed' // Duel completion
  | 'user_registered'; // User registration

export type StudySessionCompletionData = CourseStudySessionData; // Alias for backward compatibility

export interface AnalyticsData {
  coursePerformance?: Array<{
    courseId: number;
    courseName: string;
    averageScore: number;
    totalQuestions: number;
    correctAnswers: number;
  }>;
  totalQuestionsAnswered?: number;
  overallAccuracy?: number;
  studyTime?: number;
  studySessions?: number;
  averageSessionDuration?: number;
}

// Course category type (you may need to import this from PreferredCourseContext)
export type CourseCategory =
  | 'cerrahi'
  | 'protetik'
  | 'pedodonti'
  | 'endodonti'
  | 'ortodonti'
  | 'radyoloji'
  | 'restoratif'
  | 'peridontoloji';

// Extended course interface with progress and UI state
export interface CourseWithProgress extends Course {
  progress: UserCourseDetails | null;
  iconName: string;
  studySessions: StudySession[];
  isSessionsExpanded: boolean;
  category?: CourseCategory;
}

// Course editing details interface
export interface EditingCourseDetails {
  courseId?: number;
  tekrarSayisi?: number;
  konuKaynaklari?: string[];
  soruBankasiKaynaklari?: string[];
  difficulty_rating?: number;
  notes?: string;
  is_completed?: boolean;
  completionPercentage?: number;
}

// Performance data aggregation interface
export interface PerformanceData {
  longestStreaks: LongestStreak[];
  streaksSummary: StreaksSummary | null;
  dailyProgress: DailyProgress[];
  weeklyProgress: WeeklyProgress[];
  topCourses: TopCourse[];
}
