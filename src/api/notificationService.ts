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
  CourseTestNotificationRequest,
  DeviceToken,
  CourseNotificationData,
  CourseStudySessionData,
  CourseCompletionData,
} from '../types/models';

/**
 * Notification Service - UPDATED FOR COURSE-BASED SYSTEM
 * Updated for Expo SDK 53+ with enhanced token management, platform validation, and course support
 * expo-notifications: ^0.31.4
 * expo-constants: ~17.1.6
 * expo-device: ^7.1.4
 */

// UPDATED: Proper detection for newer Expo versions
const isExpoGo = Constants.appOwnership === 'expo';
const isDevelopmentBuild = !isExpoGo;

console.log('🚀 Notification Environment (SDK 53+ with Course Support):', {
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

// ✅ NEW: Course notification handling setup
export async function setupCourseNotificationHandling(): Promise<() => void> {
  try {
    console.log('📚 Setting up course notification handling...');

    // Setup regular notification listeners
    const cleanup = setupNotificationListeners();

    // Add course-specific handling
    const courseNotificationSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const courseData = extractCourseDataFromNotification(
          response.notification.request.content as any,
        );

        if (courseData) {
          console.log('📚 Course notification tapped:', courseData);

          // Handle course navigation
          if (courseData.course_id) {
            console.log(`Navigate to course: ${courseData.course_id}`);
            // Add your navigation logic here
            // Example: navigation.navigate('CourseDetail', { courseId: courseData.course_id });
          }
        }
      });

    // Return enhanced cleanup function
    return () => {
      cleanup();
      courseNotificationSubscription.remove();
      console.log('🧹 Course notification handling cleaned up');
    };
  } catch (error) {
    console.error('❌ Error setting up course notification handling:', error);
    return () => {}; // Return empty cleanup function on error
  }
}

// Setup notification listeners
export function setupNotificationListeners() {
  // Handle notification received while app is in foreground
  const foregroundSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('🔔 Notification received in foreground:', notification);

      // ✅ NEW: Log course data if present
      const courseData = extractCourseDataFromNotification(
        notification.request.content as any,
      );
      if (courseData) {
        console.log('📚 Course notification data:', courseData);
      }
    },
  );

  // Handle notification tapped/clicked
  const responseSubscription =
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('👆 Notification tapped:', response);

      // Extract navigation data
      const data = response.notification.request.content.data;
      console.log('📱 Notification data:', data);

      // ✅ NEW: Handle course-specific navigation
      const courseData = extractCourseDataFromNotification(
        response.notification.request.content as any,
      );
      if (courseData) {
        console.log(
          '📚 Course notification tapped - navigation data:',
          courseData,
        );
        // Add course-specific navigation logic here
      }
    });

  console.log('👂 Notification listeners set up (SDK 53+ with course support)');

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

// ✅ NEW: Send course-specific test notification
export async function sendCourseTestNotification(
  courseId: string | number,
  courseTitle: string,
  courseType?: 'temel_dersler' | 'klinik_dersler',
): Promise<{ message: string; notification: Notification }> {
  try {
    const response = await apiRequest<{
      message: string;
      notification: Notification;
    }>('/notifications/test/course', 'POST', {
      notification_type: 'course_reminder',
      template_name: 'course_study_reminder',
      variables: {
        course_id: courseId.toString(),
        course_title: courseTitle,
        course_type: courseType,
        message: `${courseTitle} dersi için çalışma zamanı!`,
      },
    });

    if (!response.data) {
      throw new Error('No data received from course test notification API');
    }

    return response.data;
  } catch (error) {
    console.error('Error sending course test notification:', error);
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

// ✅ UPDATED: Test local notification for SDK 53+ with course support
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

// ✅ NEW: Enhanced local test notification with course data
export async function sendCourseLocalTestNotification(
  courseTitle: string = 'Örnek Ders',
  courseId: string | number = 'test_course_123',
): Promise<boolean> {
  try {
    console.log('🧪 Sending course-based test notification (SDK 53+)...');

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📚 Ders Çalışma Hatırlatması',
        body: `${courseTitle} dersi için çalışma zamanı! Başarılarınızı artırmak için düzenli çalışmaya devam edin.`,
        data: {
          test: true,
          notification_type: 'course_reminder',
          template_name: 'course_study_reminder',
          course_id: courseId.toString(),
          course_title: courseTitle,
          action_url: '/(tabs)/courses',
        },
      },
      trigger: null, // Immediate notification
    });

    console.log(
      '📱 Course-based test notification scheduled with ID:',
      notificationId,
    );
    return true;
  } catch (error) {
    console.error('❌ Error sending course local test notification:', error);
    return false;
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

// ===============================
// ✅ NEW: COURSE-SPECIFIC NOTIFICATION FUNCTIONS
// ===============================

// ✅ NEW: Helper function to extract course data from notification
export function extractCourseDataFromNotification(
  notification: any,
): CourseNotificationData | null {
  try {
    const data = notification.variables || notification.data || {};

    if (data.course_id || data.course_title) {
      return {
        course_id: data.course_id,
        course_title: data.course_title,
        course_description: data.course_description,
        course_type: data.course_type,
        study_duration_minutes: data.study_duration_minutes,
        break_duration_minutes: data.break_duration_minutes,
        completion_percentage: data.completion_percentage,
        session_date: data.session_date,
        session_id: data.session_id,
        total_study_time_minutes: data.total_study_time_minutes,
        streak_days: data.streak_days,
      };
    }

    return null;
  } catch (error) {
    console.error('Error extracting course data from notification:', error);
    return null;
  }
}

// ✅ NEW: Check if notification is course-related
export function isCourseRelatedNotification(
  notification: Notification,
): boolean {
  const courseData = extractCourseDataFromNotification(notification);
  return courseData !== null;
}

// ✅ NEW: Format course-related notification body
export function formatCourseNotificationBody(
  notification: Notification,
  maxLength: number = 100,
): string {
  const courseData = extractCourseDataFromNotification(notification);

  if (!courseData || !courseData.course_title) {
    return notification.content?.substring(0, maxLength) || '';
  }

  const baseContent = notification.content || '';
  const courseName = courseData.course_title;

  // If the course name is already in the content, return as is
  if (baseContent.includes(courseName)) {
    return baseContent.substring(0, maxLength);
  }

  // Otherwise, prepend course name
  const enhancedContent = `📚 ${courseName}: ${baseContent}`;
  return enhancedContent.substring(0, maxLength);
}

// ✅ NEW: Debug course notification data
export async function debugCourseNotifications(): Promise<void> {
  try {
    console.log('🔍 === COURSE NOTIFICATION DEBUG ===');

    // Get recent notifications
    const notifications = await getNotifications(10, 0);

    // Filter course-related notifications
    const courseNotifications = notifications.notifications.filter(
      isCourseRelatedNotification,
    );

    console.log(
      `📚 Found ${courseNotifications.length} course-related notifications out of ${notifications.notifications.length} total`,
    );

    // Log course notification details
    courseNotifications.forEach((notification, index) => {
      const courseData = extractCourseDataFromNotification(notification);
      console.log(`Course Notification ${index + 1}:`, {
        id: notification.notification_id,
        type: notification.notification_type,
        courseData,
        created: notification.created_at,
      });
    });
  } catch (error) {
    console.error('❌ Debug course notifications failed:', error);
  }
}

// ✅ NEW: Send course study session completion notification
export async function sendCourseStudySessionNotification(
  sessionData: CourseStudySessionData,
): Promise<{ message: string; notification: Notification } | null> {
  try {
    console.log('📚 Sending course study session notification...', sessionData);

    const studyMinutes = Math.round(sessionData.studyDurationSeconds / 60);
    const breakMinutes = Math.round(
      (sessionData.breakDurationSeconds || 0) / 60,
    );

    const response = await apiRequest<{
      message: string;
      notification: Notification;
    }>('/notifications/course/session-completed', 'POST', {
      course_id: sessionData.courseId.toString(),
      course_title: sessionData.courseTitle || 'Ders',
      course_type: sessionData.courseType,
      study_duration_minutes: studyMinutes,
      break_duration_minutes: breakMinutes,
      session_date: sessionData.sessionDate,
      session_id: sessionData.sessionId,
    });

    if (!response.data) {
      throw new Error('No data received from course session notification API');
    }

    console.log('✅ Course study session notification sent successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Error sending course study session notification:', error);
    return null;
  }
}

// ✅ NEW: Send course completion notification
export async function sendCourseCompletionNotification(
  completionData: CourseCompletionData,
): Promise<{ message: string; notification: Notification } | null> {
  try {
    console.log('🎯 Sending course completion notification...', completionData);

    const response = await apiRequest<{
      message: string;
      notification: Notification;
    }>('/notifications/course/completed', 'POST', {
      course_id: completionData.courseId.toString(),
      course_title: completionData.courseTitle,
      course_type: completionData.courseType,
      completion_percentage: completionData.completionPercentage,
      completion_date:
        completionData.completionDate || new Date().toISOString(),
      total_study_time_seconds: completionData.totalStudyTimeSeconds,
      total_sessions: completionData.totalSessions,
    });

    if (!response.data) {
      throw new Error(
        'No data received from course completion notification API',
      );
    }

    console.log('✅ Course completion notification sent successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Error sending course completion notification:', error);
    return null;
  }
}

// ===============================
// UTILITY FUNCTIONS (Enhanced with course support)
// ===============================

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

// ✅ UPDATED: Get notification icon based on type with course support
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
    // ✅ NEW: Course-specific notification types
    course_reminder: 'book-open',
    course_completed: 'check-circle',
    course_progress: 'trending-up',
    course_milestone: 'flag',
    course_study_session: 'clock',
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
    'course_completed', // ✅ NEW: High priority for course completion
  ];

  const lowPriority: NotificationType[] = [
    'content_update',
    'motivational_message',
    'course_progress', // ✅ NEW: Low priority for progress updates
  ];

  if (highPriority.includes(type)) return 'high';
  if (lowPriority.includes(type)) return 'low';
  return 'normal';
}

// ✅ UPDATED: Get notification color based on type with course support
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
    // ✅ NEW: Course-specific colors
    course_reminder: '#2563EB',
    course_completed: '#059669',
    course_progress: '#7C3AED',
    course_milestone: '#DC2626',
    course_study_session: '#0891B2',
  };

  return colorMap[type] || '#6B7280';
}

// ✅ NEW: Get Turkish notification type name
export function getTurkishNotificationTypeName(type: NotificationType): string {
  const typeNames: Record<NotificationType, string> = {
    study_reminder: 'Çalışma Hatırlatması',
    achievement_unlock: 'Başarı Açıldı',
    duel_invitation: 'Düello Daveti',
    duel_result: 'Düello Sonucu',
    friend_request: 'Arkadaşlık İsteği',
    friend_activity: 'Arkadaş Etkinliği',
    content_update: 'İçerik Güncellemesi',
    streak_reminder: 'Seri Hatırlatması',
    plan_reminder: 'Plan Hatırlatması',
    coaching_note: 'Koçluk Notu',
    motivational_message: 'Motivasyon Mesajı',
    system_announcement: 'Sistem Duyurusu',
    // ✅ NEW: Course-specific Turkish names
    course_reminder: 'Ders Hatırlatması',
    course_completed: 'Ders Tamamlandı',
    course_progress: 'Ders İlerlemesi',
    course_milestone: 'Ders Kilometre Taşı',
    course_study_session: 'Ders Çalışma Seansı',
  };

  return typeNames[type] || type;
}

// ✅ NEW: Test all course notification functionality
export async function testCourseNotificationFlow(): Promise<void> {
  try {
    console.log('🧪 Testing complete course notification flow...');

    // Test course study session notification
    const sessionData: CourseStudySessionData = {
      courseId: 'test_course_123',
      courseTitle: 'Test Matematik',
      courseType: 'temel_dersler',
      studyDurationSeconds: 1800, // 30 minutes
      breakDurationSeconds: 300, // 5 minutes
      sessionDate: new Date().toISOString().split('T')[0],
      sessionId: 456,
    };

    console.log('📚 Testing session notification...');
    await sendCourseStudySessionNotification(sessionData);

    // Test course completion notification
    const completionData: CourseCompletionData = {
      courseId: 'test_course_123',
      courseTitle: 'Test Matematik',
      courseType: 'temel_dersler',
      completionPercentage: 100,
      totalStudyTimeSeconds: 7200, // 2 hours
      totalSessions: 10,
    };

    console.log('🎯 Testing completion notification...');
    await sendCourseCompletionNotification(completionData);

    // Test local notifications
    console.log('📱 Testing local notifications...');
    await sendCourseLocalTestNotification('Test Matematik', 'test_course_123');

    // Debug course notifications
    console.log('🔍 Testing debug functionality...');
    await debugCourseNotifications();

    console.log('✅ Course notification flow test completed');
  } catch (error) {
    console.error('❌ Course notification flow test failed:', error);
  }
}
