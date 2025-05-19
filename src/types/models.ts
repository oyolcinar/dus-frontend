// User related interfaces
export interface User {
  id: number | string;
  userId: number;
  username: string;
  email: string;
  dateRegistered?: string;
  totalDuels?: number;
  duelsWon?: number;
  duelsLost?: number;
  longestLosingStreak?: number;
  currentLosingStreak?: number;
  totalStudyTime?: number;
  subscriptionType?: string;
  role?: string;
  permissions?: string[];
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string | null;
}

// Course related interfaces
export interface Course {
  course_id: number;
  title: string;
  description?: string;
  image_url?: string;
  created_at: string;
  topics?: Topic[];
}

export interface Topic {
  topic_id: number;
  course_id: number;
  title: string;
  description?: string;
  order_index: number;
  created_at: string;
  subtopics?: Subtopic[];
}

export interface Subtopic {
  subtopic_id: number;
  topic_id: number;
  title: string;
  description?: string;
  order_index: number;
  created_at: string;
}

// Test related interfaces
export interface Test {
  test_id: number;
  title: string;
  description?: string;
  difficulty_level: number;
  created_at: string;
  question_count: number; // Added field
  time_limit: number; // Added field
}

export interface Question {
  question_id: number;
  test_id: number;
  question_text: string;
  options: Record<string, string>;
  correct_answer: string;
  created_at: string;
}

export interface Answer {
  questionId: number;
  userAnswer: string;
  isCorrect: boolean;
}

export interface TestResult {
  result_id: number;
  user_id: number;
  test_id: number;
  score: number;
  date_taken: string;
  time_taken?: number;
  test_title?: string;
}

// Duel related interfaces
export interface Duel {
  duel_id: number;
  initiator_id: number;
  opponent_id: number;
  test_id: number;
  status: 'pending' | 'active' | 'completed';
  start_time?: string;
  end_time?: string;
  created_at: string;
  question_count: number;
  branch_type?: string;
  selection_type?: string;
  branch_id?: number;
  initiator_username?: string;
  opponent_username?: string;
  test_title?: string;
}

export interface DuelResult {
  duel_id: number;
  winner_id?: number;
  initiator_score: number;
  opponent_score: number;
  created_at: string;
  winner_username?: string;
}

// Study related interfaces
export interface StudyProgress {
  progress_id: number;
  user_id: number;
  subtopic_id: number;
  repetition_count: number;
  mastery_level: number;
  last_studied_at: string;
  created_at: string;
  subtopic_title?: string;
  topic_title?: string;
  course_title?: string;
}

export interface StudySession {
  session_id: number;
  user_id: number;
  start_time: string;
  end_time?: string;
  duration?: number;
  created_at: string;
}

export interface SessionDetail {
  detail_id: number;
  session_id: number;
  subtopic_id: number;
  duration: number;
  created_at: string;
  subtopic_title?: string;
  topic_title?: string;
}

export interface ErrorAnalytic {
  error_id: number;
  user_id: number;
  subtopic_id: number;
  error_count: number;
  total_attempts: number;
  last_updated_at: string;
  subtopic_title?: string;
  topic_title?: string;
  error_percentage: number;
}

// Analytics related interfaces
export interface DashboardData {
  recentStudyTime: number;
  recentStudyTimeHours: number;
  dailyStudyTime: Array<{
    study_date: string;
    total_duration: number;
  }>;
  duelStats: {
    totalDuels: number;
    wins: number;
    losses: number;
    winRate: number;
  };
  problematicTopics: Array<{
    topicId: number;
    topicTitle: string;
    errorRate: number;
    totalErrors: number;
    totalAttempts: number;
  }>;
  topicAnalytics: Array<{
    topicId: number;
    topicTitle: string;
    totalDuration: number;
    totalDurationHours: number;
    accuracyRate: number;
    correctAnswers: number;
    totalAttempts: number;
  }>;
}

// Coaching related interfaces
export interface CoachingNote {
  note_id: number;
  title: string;
  content: string;
  publish_date: string;
  week_number: number;
  year: number;
  created_at: string;
}

export interface MotivationalMessage {
  message_id: number;
  title: string;
  audio_url: string;
  description?: string;
  publish_date: string;
  created_at: string;
}

export interface StrategyVideo {
  video_id: number;
  title: string;
  external_url: string;
  description?: string;
  is_premium: boolean;
  created_at: string;
}

// Study plan related interfaces
export interface StudyPlan {
  plan_id: number;
  user_id: number;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  is_custom: boolean;
  created_at: string;
  activities?: PlanActivity[];
}

export interface PlanActivity {
  activity_id: number;
  plan_id: number;
  subtopic_id?: number;
  title: string;
  description?: string;
  duration?: number;
  scheduled_date: string;
  is_completed: boolean;
  created_at: string;
  subtopic_title?: string;
  topic_title?: string;
}

// Friend related interfaces
export interface Friend {
  friendship_id: number;
  user_id: number;
  friend_id: number;
  status: 'pending' | 'accepted' | 'rejected';
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
  requester_username?: string;
  requester_email?: string;
}

// Subscription related interfaces
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
