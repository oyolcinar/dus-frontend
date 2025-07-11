import apiRequest from './apiClient';
import { ApiResponse } from '../types/api';
import {
  Notification,
  NotificationResponse,
  NotificationPreferences,
  NotificationStats,
  NotificationType,
  TestNotificationRequest,
  DeviceToken,
} from '../types/models';

/**
 * Notification Service
 * Handles all notification-related API calls
 */

// Get notifications for authenticated user
export async function getNotifications(
  limit: number = 20,
  offset: number = 0,
  unreadOnly: boolean = false,
): Promise<NotificationResponse> {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      unread_only: unreadOnly.toString(),
    });

    const response = await apiRequest<NotificationResponse>(
      `/notifications?${params}`,
      'GET',
    );

    if (!response.data) {
      throw new Error('No data received from notifications API');
    }

    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
}

// Get unread notification count
export async function getUnreadCount(): Promise<{ unread_count: number }> {
  try {
    const response = await apiRequest<{ unread_count: number }>(
      '/notifications/unread-count',
      'GET',
    );

    if (!response.data) {
      throw new Error('No data received from unread count API');
    }

    return response.data;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    throw error;
  }
}

// Mark a notification as read
export async function markAsRead(
  notificationId: number,
): Promise<Notification> {
  try {
    const response = await apiRequest<Notification>(
      `/notifications/${notificationId}/read`,
      'POST',
    );

    if (!response.data) {
      throw new Error('No data received from mark as read API');
    }

    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

// Mark all notifications as read
export async function markAllAsRead(): Promise<{
  message: string;
  marked_count: number;
}> {
  try {
    const response = await apiRequest<{
      message: string;
      marked_count: number;
    }>('/notifications/mark-all-read', 'POST');

    if (!response.data) {
      throw new Error('No data received from mark all as read API');
    }

    return response.data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

// Delete a notification
export async function deleteNotification(
  notificationId: number,
): Promise<{ message: string }> {
  try {
    const response = await apiRequest<{ message: string }>(
      `/notifications/${notificationId}`,
      'DELETE',
    );

    if (!response.data) {
      throw new Error('No data received from delete notification API');
    }

    return response.data;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
}

// Get user notification preferences
export async function getPreferences(): Promise<NotificationPreferences[]> {
  try {
    const response = await apiRequest<NotificationPreferences[]>(
      '/notifications/preferences',
      'GET',
    );

    if (!response.data) {
      throw new Error('No data received from preferences API');
    }

    return response.data;
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    throw error;
  }
}

// Update user notification preferences
export async function updatePreferences(
  notificationType: NotificationType,
  preferences: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> {
  try {
    const response = await apiRequest<NotificationPreferences>(
      '/notifications/preferences',
      'PUT',
      {
        notification_type: notificationType,
        ...preferences,
      },
    );

    if (!response.data) {
      throw new Error('No data received from update preferences API');
    }

    return response.data;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    throw error;
  }
}

// Register device token for push notifications
export async function registerDeviceToken(
  deviceToken: string,
  platform: 'ios' | 'android' | 'web',
): Promise<{ message: string; token: DeviceToken }> {
  try {
    const response = await apiRequest<{ message: string; token: DeviceToken }>(
      '/notifications/device-token',
      'POST',
      {
        device_token: deviceToken,
        platform,
      },
    );

    if (!response.data) {
      throw new Error('No data received from register device token API');
    }

    return response.data;
  } catch (error) {
    console.error('Error registering device token:', error);
    throw error;
  }
}

// Send test notification
export async function sendTestNotification(
  request: TestNotificationRequest,
): Promise<{ message: string; notification: Notification }> {
  try {
    const response = await apiRequest<{
      message: string;
      notification: Notification;
    }>('/notifications/test', 'POST', request);

    if (!response.data) {
      throw new Error('No data received from test notification API');
    }

    return response.data;
  } catch (error) {
    console.error('Error sending test notification:', error);
    throw error;
  }
}

// Get notification statistics
export async function getStats(days: number = 30): Promise<NotificationStats> {
  try {
    const response = await apiRequest<NotificationStats>(
      `/notifications/stats?days=${days}`,
      'GET',
    );

    if (!response.data) {
      throw new Error('No data received from stats API');
    }

    return response.data;
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    throw error;
  }
}

// Utility functions

// Check if notification type is enabled for user
export function isNotificationTypeEnabled(
  preferences: NotificationPreferences[],
  type: NotificationType,
  channel: 'in_app' | 'push' | 'email' = 'in_app',
): boolean {
  const pref = preferences.find((p) => p.notification_type === type);
  if (!pref) return true; // Default to enabled if no preference found

  switch (channel) {
    case 'in_app':
      return pref.in_app_enabled;
    case 'push':
      return pref.push_enabled;
    case 'email':
      return pref.email_enabled;
    default:
      return pref.in_app_enabled;
  }
}

// Get notification icon based on type
export function getNotificationIcon(type: NotificationType): string {
  const iconMap: Record<NotificationType, string> = {
    study_reminder: 'book',
    achievement_unlock: 'trophy',
    duel_invitation: 'users',
    duel_result: 'target',
    friend_request: 'user-plus',
    friend_activity: 'user',
    content_update: 'refresh-cw',
    streak_reminder: 'fire',
    plan_reminder: 'calendar',
    coaching_note: 'message-circle',
    motivational_message: 'heart',
    system_announcement: 'megaphone',
  };

  return iconMap[type] || 'bell';
}

// Format notification time
export function formatNotificationTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60),
  );

  if (diffInMinutes < 1) return 'Az önce';
  if (diffInMinutes < 60) return `${diffInMinutes} dakika önce`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} saat önce`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} gün önce`;

  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

// Get notification priority based on type
export function getNotificationPriority(
  type: NotificationType,
): 'high' | 'normal' | 'low' {
  const highPriority: NotificationType[] = [
    'duel_invitation',
    'friend_request',
    'system_announcement',
  ];

  const lowPriority: NotificationType[] = [
    'content_update',
    'motivational_message',
  ];

  if (highPriority.includes(type)) return 'high';
  if (lowPriority.includes(type)) return 'low';
  return 'normal';
}

// Get notification color based on type
export function getNotificationColor(type: NotificationType): string {
  const colorMap: Record<NotificationType, string> = {
    study_reminder: '#3B82F6', // blue
    achievement_unlock: '#F59E0B', // amber
    duel_invitation: '#8B5CF6', // purple
    duel_result: '#10B981', // emerald
    friend_request: '#06B6D4', // cyan
    friend_activity: '#84CC16', // lime
    content_update: '#6366F1', // indigo
    streak_reminder: '#EF4444', // red
    plan_reminder: '#F97316', // orange
    coaching_note: '#14B8A6', // teal
    motivational_message: '#EC4899', // pink
    system_announcement: '#8B5CF6', // purple
  };

  return colorMap[type] || '#6B7280'; // gray as default
}
