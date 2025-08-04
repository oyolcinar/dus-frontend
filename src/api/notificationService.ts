import { Platform, Alert } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiRequest from './apiClient';
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
 * Updated for Expo SDK 53+ with latest package versions
 * expo-notifications: ^0.31.4
 * expo-constants: ~17.1.6
 * expo-device: ^7.1.4
 */

// UPDATED: Proper detection for newer Expo versions
const isExpoGo = Constants.appOwnership === 'expo';
const isDevelopmentBuild = !isExpoGo;

console.log('🚀 Notification Environment (SDK 53+):', {
  isExpoGo,
  isDevelopmentBuild,
  isDevice: Device.isDevice,
  platform: Platform.OS,
  sdkVersion: Constants.expoConfig?.sdkVersion || 'unknown',
});

// UPDATED: Configure notification behavior for newer expo-notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// MAIN: Setup push notifications for SDK 53+
export async function setupPushNotifications(): Promise<{
  success: boolean;
  token?: string;
  isDevelopment?: boolean;
}> {
  try {
    // Skip in Expo Go completely
    if (isExpoGo) {
      console.log('🚀 Expo Go detected - push notifications not supported');
      Alert.alert(
        'Geliştirme Modu',
        'Expo Go kullanıyorsunuz. Push bildirimler çalışmayacak, ancak uygulama normal şekilde çalışacak.',
        [{ text: 'Tamam' }],
      );
      return { success: false, isDevelopment: true };
    }

    // Must be on physical device
    if (!Device.isDevice) {
      console.warn('📱 Push notifications only work on physical devices');
      Alert.alert(
        'Simülatör Tespit Edildi',
        'Push bildirimler sadece gerçek cihazlarda çalışır.',
        [{ text: 'Tamam' }],
      );
      return { success: false, isDevelopment: true };
    }

    console.log('🔔 Setting up push notifications on real device (SDK 53+)...');

    // Get existing permission status
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    console.log('📋 Current permission status:', existingStatus);

    // Request permissions if not granted
    if (existingStatus !== 'granted') {
      console.log('🔒 Requesting notification permissions...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('📋 New permission status:', finalStatus);
    }

    if (finalStatus !== 'granted') {
      console.warn('🔒 Push notification permission denied');
      Alert.alert(
        'İzin Gerekli',
        'Push bildirimler için izin vermeniz gerekiyor. Ayarlardan izinleri kontrol edin.',
        [{ text: 'Tamam' }],
      );
      return { success: false };
    }

    // UPDATED: Get project ID for SDK 53+ (updated Constants API)
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ||
      Constants.easConfig?.projectId ||
      process.env.EXPO_PUBLIC_EAS_PROJECT_ID;

    console.log('🆔 Project ID (SDK 53+):', projectId);

    if (!projectId) {
      console.error('❌ No project ID found for push tokens');
      Alert.alert(
        'Yapılandırma Hatası',
        "EAS proje ID'si bulunamadı. app.json dosyasını kontrol edin.",
        [{ text: 'Tamam' }],
      );
      return { success: false };
    }

    // Get push token with updated API
    console.log('🎫 Getting push token (SDK 53+)...');
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });

    const token = tokenData.data;
    console.log('✅ Push token obtained:', token.substring(0, 50) + '...');

    // Register token with backend
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    console.log('📝 Registering token with backend...');

    try {
      await registerDeviceToken(token, platform);
      console.log('✅ Token registered with backend successfully');
    } catch (backendError) {
      console.error('❌ Backend registration failed:', backendError);
      // Continue anyway - token is still valid for local testing
    }

    // Store locally for debugging
    await AsyncStorage.setItem('pushToken', token);
    await AsyncStorage.setItem('pushTokenDate', new Date().toISOString());

    console.log('🎉 Push notification setup completed successfully (SDK 53+)');

    return { success: true, token };
  } catch (error: any) {
    console.error('🔔 Push notification setup failed:', error);

    // More specific error handling
    if (
      error.message?.includes('project') ||
      error.message?.includes('projectId')
    ) {
      Alert.alert(
        'Yapılandırma Hatası',
        "EAS proje ID'si bulunamadı. app.json dosyasını kontrol edin.",
        [{ text: 'Tamam' }],
      );
    } else if (error.message?.includes('network')) {
      Alert.alert('Bağlantı Hatası', 'İnternet bağlantınızı kontrol edin.', [
        { text: 'Tamam' },
      ]);
    } else {
      Alert.alert('Push Bildirim Hatası', `Bir hata oluştu: ${error.message}`, [
        { text: 'Tamam' },
      ]);
    }

    return { success: false };
  }
}

// Setup notification listeners
export function setupNotificationListeners() {
  // Handle notification received while app is in foreground
  const foregroundSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('🔔 Notification received in foreground:', notification);
    },
  );

  // Handle notification tapped/clicked
  const responseSubscription =
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('👆 Notification tapped:', response);

      // Extract navigation data
      const data = response.notification.request.content.data;
      console.log('📱 Notification data:', data);
    });

  console.log('👂 Notification listeners set up (SDK 53+)');

  // Return cleanup function
  return () => {
    console.log('🧹 Cleaning up notification listeners');
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
}

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

// Register device token
export async function registerDeviceToken(
  deviceToken: string,
  platform: 'ios' | 'android' | 'web',
): Promise<{ message: string; token: DeviceToken }> {
  try {
    console.log('📝 Registering device token (SDK 53+):', {
      platform,
      token: deviceToken.substring(0, 20) + '...',
    });

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

    console.log('✅ Device token registered successfully with backend');
    return response.data;
  } catch (error) {
    console.error('❌ Error registering device token:', error);
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

// UPDATED: Test local notification for SDK 53+ (expo-notifications ^0.31.4)
export async function sendLocalTestNotification(): Promise<boolean> {
  try {
    console.log('🧪 Sending test notification (SDK 53+)...');

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🧪 Test Bildirimi',
        body: 'Bu bir test bildirimidir! Push bildirimler çalışıyor.',
        data: {
          test: true,
          notification_type: 'system_announcement',
          action_url: '/(tabs)/profile',
        },
      },
      trigger: null, // Immediate notification (works with 0.31.4)
    });

    console.log(
      '📱 Local test notification scheduled with ID:',
      notificationId,
    );
    return true;
  } catch (error) {
    console.error('❌ Error sending local test notification:', error);

    // Try alternative trigger format for SDK 53+
    try {
      console.log('🔄 Trying alternative trigger format...');
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧪 Test Bildirimi (Alt)',
          body: 'Bu alternatif format ile test bildirimidir!',
          data: { test: true },
        },
        trigger: {
          seconds: 1,
        } as any, // Type assertion for compatibility
      });

      console.log(
        '📱 Alternative test notification scheduled:',
        notificationId,
      );
      return true;
    } catch (altError) {
      console.error('❌ Alternative format also failed:', altError);
      return false;
    }
  }
}

// Get current push token from storage
export async function getCurrentPushToken(): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem('pushToken');
    const tokenDate = await AsyncStorage.getItem('pushTokenDate');

    if (token && tokenDate) {
      console.log('📱 Stored push token found:', {
        token: token.substring(0, 20) + '...',
        date: tokenDate,
      });
      return token;
    }

    return null;
  } catch (error) {
    console.error('❌ Error getting stored push token:', error);
    return null;
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
  if (!pref) return true;

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
    study_reminder: '#3B82F6',
    achievement_unlock: '#F59E0B',
    duel_invitation: '#8B5CF6',
    duel_result: '#10B981',
    friend_request: '#06B6D4',
    friend_activity: '#84CC16',
    content_update: '#6366F1',
    streak_reminder: '#EF4444',
    plan_reminder: '#F97316',
    coaching_note: '#14B8A6',
    motivational_message: '#EC4899',
    system_announcement: '#8B5CF6',
  };

  return colorMap[type] || '#6B7280';
}
