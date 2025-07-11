// src/types/models.ts

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
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string | null;
}

// Course related types
export interface Course {
  course_id: number;
  title: string;
  description?: string;
  image_url?: string;
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

// Test related types
export interface Test {
  test_id: number;
  title: string;
  description?: string;
  difficulty_level?: number;
  question_count: number;
  time_limit: number;
  created_at: string;
}

export interface Question {
  question_id: number;
  test_id: number;
  question_text: string;
  options?: Record<string, any>;
  correct_answer: string;
  created_at: string;
}

export interface Answer {
  answer_id: number;
  result_id: number;
  question_id: number;
  user_answer: string;
  is_correct: boolean;
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
}

export interface DuelResult {
  duel_id: number;
  winner_id?: number;
  initiator_score: number;
  opponent_score: number;
  created_at: string;
}

// Study related types
export interface StudyProgress {
  progress_id: number;
  user_id: number;
  subtopic_id: number;
  repetition_count: number;
  mastery_level: number;
  last_studied_at?: string;
  created_at: string;
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
  duration?: number;
  created_at: string;
}

// Analytics types
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
  action_url?: string;
  icon_name?: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  is_read: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  sent_at?: string;
  read_at?: string;
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
