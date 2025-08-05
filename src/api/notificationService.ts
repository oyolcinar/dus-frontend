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
 * Updated for Expo SDK 53+ with enhanced token management and platform validation
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

// Storage keys for token management
const STORAGE_KEYS = {
  PUSH_TOKEN: 'pushToken',
  PUSH_TOKEN_DATE: 'pushTokenDate',
  LAST_PLATFORM: 'lastRegisteredPlatform',
  DEVICE_INFO: 'lastDeviceInfo',
  SDK_VERSION: 'pushTokenSDK',
} as const;

// ENHANCED: Clear old device tokens before registering new ones
export async function clearDeviceTokens(): Promise<void> {
  try {
    console.log('🧹 Clearing old device tokens...');

    // Clear from local storage
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.PUSH_TOKEN,
      STORAGE_KEYS.PUSH_TOKEN_DATE,
      STORAGE_KEYS.LAST_PLATFORM,
      STORAGE_KEYS.DEVICE_INFO,
      STORAGE_KEYS.SDK_VERSION,
    ]);

    // Call backend to deactivate old tokens for this user
    try {
      await apiRequest('/notifications/device-token/clear', 'POST');
      console.log('✅ Old tokens cleared from backend');
    } catch (backendError) {
      console.warn('⚠️ Could not clear backend tokens:', backendError);
    }
  } catch (error) {
    console.error('❌ Error clearing device tokens:', error);
  }
}

// ENHANCED: Get current device information
function getCurrentDeviceInfo() {
  return {
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
    model: Device.modelName || 'Unknown',
    osVersion: Device.osVersion || 'Unknown',
    appVersion: Constants.expoConfig?.version || 'unknown',
    deviceId: Device.deviceName || 'Unknown',
    isDevice: Device.isDevice,
  };
}

// ENHANCED: Check if device/platform changed since last registration
async function hasDeviceChanged(): Promise<boolean> {
  try {
    const currentDevice = getCurrentDeviceInfo();
    const lastPlatform = await AsyncStorage.getItem(STORAGE_KEYS.LAST_PLATFORM);
    const lastDeviceInfo = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_INFO);

    if (!lastPlatform || !lastDeviceInfo) {
      return true; // First time registration
    }

    const parsedLastDevice = JSON.parse(lastDeviceInfo);

    // Check if platform changed
    if (currentDevice.platform !== lastPlatform) {
      console.log(
        `🔄 Platform changed: ${lastPlatform} → ${currentDevice.platform}`,
      );
      return true;
    }

    // Check if device model changed (indicates different physical device)
    if (
      currentDevice.model !== parsedLastDevice.model ||
      currentDevice.deviceId !== parsedLastDevice.deviceId
    ) {
      console.log(
        `📱 Device changed: ${parsedLastDevice.model} → ${currentDevice.model}`,
      );
      return true;
    }

    return false;
  } catch (error) {
    console.error('❌ Error checking device changes:', error);
    return true; // Assume changed on error to force re-registration
  }
}

// ENHANCED: Register device token with validation and cleanup
export async function registerDeviceTokenWithValidation(
  deviceToken: string,
  forceUpdate: boolean = false,
): Promise<{ message: string; token: DeviceToken }> {
  try {
    const currentDevice = getCurrentDeviceInfo();

    console.log('📝 Registering device token with validation:', {
      platform: currentDevice.platform,
      model: currentDevice.model,
      token: deviceToken.substring(0, 20) + '...',
      forceUpdate,
    });

    // Check if we need to clear old tokens
    const deviceChanged = await hasDeviceChanged();
    if (deviceChanged || forceUpdate) {
      console.log(
        '🔄 Device/platform changed or forced update, clearing old tokens',
      );
      await clearDeviceTokens();
    }

    const response = await apiRequest<{ message: string; token: DeviceToken }>(
      '/notifications/device-token',
      'POST',
      {
        device_token: deviceToken,
        platform: currentDevice.platform,
        device_info: {
          model: currentDevice.model,
          os_version: currentDevice.osVersion,
          app_version: currentDevice.appVersion,
          device_id: currentDevice.deviceId,
          is_device: currentDevice.isDevice,
        },
      },
    );

    if (!response.data) {
      throw new Error('No data received from register device token API');
    }

    // Store the current device info for future comparisons
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.LAST_PLATFORM, currentDevice.platform],
      [STORAGE_KEYS.DEVICE_INFO, JSON.stringify(currentDevice)],
      [STORAGE_KEYS.SDK_VERSION, '53'],
    ]);

    console.log('✅ Device token registered successfully with backend');
    return response.data;
  } catch (error) {
    console.error('❌ Error registering device token:', error);
    throw error;
  }
}

// MAIN: Enhanced setup push notifications for SDK 53+
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

    const currentDevice = getCurrentDeviceInfo();
    console.log(
      `🔔 Setting up push notifications on ${currentDevice.platform} device (${currentDevice.model})...`,
    );

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

    // Get project ID for SDK 53+
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
    console.log('🎫 Getting push token...');
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });

    const token = tokenData.data;
    console.log('✅ Push token obtained:', token.substring(0, 50) + '...');

    // Register token with backend using enhanced validation
    console.log('📝 Registering token with backend...');
    try {
      await registerDeviceTokenWithValidation(token);
      console.log('✅ Token registered with backend successfully');
    } catch (backendError) {
      console.error('❌ Backend registration failed:', backendError);
      // Continue anyway - token is still valid for local testing
    }

    // Store locally for debugging
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.PUSH_TOKEN, token],
      [STORAGE_KEYS.PUSH_TOKEN_DATE, new Date().toISOString()],
    ]);

    console.log('🎉 Push notification setup completed successfully');

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

// LEGACY: Keep original function for backward compatibility but use enhanced version
export async function registerDeviceToken(
  deviceToken: string,
  platform: 'ios' | 'android' | 'web',
): Promise<{ message: string; token: DeviceToken }> {
  console.log(
    '⚠️ Using legacy registerDeviceToken - consider using registerDeviceTokenWithValidation',
  );
  return registerDeviceTokenWithValidation(deviceToken);
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
    const token = await AsyncStorage.getItem(STORAGE_KEYS.PUSH_TOKEN);
    const tokenDate = await AsyncStorage.getItem(STORAGE_KEYS.PUSH_TOKEN_DATE);

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

// ENHANCED: Debug function to check current registration status
export async function debugRegistrationStatus(): Promise<void> {
  try {
    console.log('🔍 === REGISTRATION STATUS DEBUG ===');

    const currentDevice = getCurrentDeviceInfo();
    const storedToken = await AsyncStorage.getItem(STORAGE_KEYS.PUSH_TOKEN);
    const lastPlatform = await AsyncStorage.getItem(STORAGE_KEYS.LAST_PLATFORM);
    const lastDeviceInfo = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_INFO);
    const sdkVersion = await AsyncStorage.getItem(STORAGE_KEYS.SDK_VERSION);

    console.log('Current Device:', currentDevice);
    console.log('Last Registered Platform:', lastPlatform);
    console.log(
      'Last Device Info:',
      lastDeviceInfo ? JSON.parse(lastDeviceInfo) : 'None',
    );
    console.log('SDK Version:', sdkVersion);
    console.log('Stored Token:', storedToken ? 'Present' : 'None');

    const deviceChanged = await hasDeviceChanged();
    console.log('Device Changed:', deviceChanged);

    if (deviceChanged) {
      console.log('⚠️ DEVICE/PLATFORM CHANGE DETECTED');
      console.log(
        '🔧 Solution: Token cleanup and re-registration will be triggered automatically',
      );
    } else {
      console.log('✅ Device/platform matches last registration');
    }
  } catch (error) {
    console.error('❌ Debug status failed:', error);
  }
}

// ENHANCED: Force token refresh and re-registration
export async function forceTokenRefresh(): Promise<{
  success: boolean;
  token?: string;
  message?: string;
}> {
  try {
    console.log('🔄 Force refreshing push token...');

    if (isExpoGo || !Device.isDevice) {
      return {
        success: false,
        message: 'Token refresh not supported in Expo Go or simulator',
      };
    }

    // Clear old tokens first
    await clearDeviceTokens();

    // Setup new token
    const result = await setupPushNotifications();

    if (result.success && result.token) {
      return {
        success: true,
        token: result.token,
        message: 'Token refreshed successfully',
      };
    }

    return {
      success: false,
      message: 'Token refresh failed',
    };
  } catch (error) {
    console.error('❌ Force token refresh failed:', error);
    return {
      success: false,
      message: `Token refresh failed: ${error}`,
    };
  }
}

// ENHANCED: Debug function to test registration
export async function debugTokenRegistration(): Promise<void> {
  try {
    console.log('🧪 === DEBUG TOKEN REGISTRATION ===');

    // Check environment
    console.log('📱 Environment:', {
      isExpoGo,
      isDevelopmentBuild,
      isDevice: Device.isDevice,
      platform: Platform.OS,
    });

    // Check device changes
    await debugRegistrationStatus();

    // Check stored token
    const storedToken = await getCurrentPushToken();
    console.log('💾 Stored token:', storedToken ? 'Found' : 'None');

    // Try to get fresh token
    if (!isExpoGo && Device.isDevice) {
      console.log('🎫 Attempting fresh token...');
      const result = await setupPushNotifications();
      console.log('🎫 Fresh token result:', result);
    }

    // Test API call directly if we have a token
    if (storedToken) {
      console.log('🌐 Testing API call with stored token...');
      await registerDeviceTokenWithValidation(storedToken);
      console.log('✅ API call successful');
    }
  } catch (error) {
    console.error('❌ Debug registration failed:', error);
  }
}

// Utility functions (keeping all existing ones)

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
