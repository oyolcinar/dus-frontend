// context/NotificationContext.tsx - UPDATED for Course-Based System with Expo SDK 53
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Notification,
  NotificationPreferences,
  NotificationStats,
  NotificationType,
  CourseNotificationData,
  CourseStudySessionData,
  CourseCompletionData,
} from '../src/types/models';
import * as notificationService from '../src/api/notificationService';
import * as achievementService from '../src/api/achievementService';

// UPDATED: Proper detection for Expo SDK 53
const isExpoGo = Constants.appOwnership === 'expo';
const isDevelopmentBuild = !isExpoGo;

console.log('🚀 NotificationContext (SDK 53) with Course Support:', {
  isExpoGo,
  isDevelopmentBuild,
  isDevice: Device.isDevice,
  sdkVersion: Constants.expoConfig?.sdkVersion || 'unknown',
});

interface NotificationContextType {
  // State - Matching your exact model types
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences[];
  stats: NotificationStats | null;
  isLoading: boolean;
  error: string | null;
  notificationsSupported: boolean;
  isDevelopmentMode: boolean;
  pushToken: string | null;

  // Core Actions
  loadNotifications: (refresh?: boolean) => Promise<void>;
  loadMoreNotifications: () => Promise<void>;
  refreshNotifications: () => Promise<void>; // ✅ NEW: Independent refresh function
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: number) => Promise<void>;
  loadPreferences: () => Promise<void>;
  updatePreferences: (
    type: NotificationType,
    prefs: Partial<NotificationPreferences>,
  ) => Promise<void>;
  loadStats: () => Promise<void>;
  registerForPushNotifications: () => Promise<void>;
  sendLocalTestNotification: () => Promise<void>;

  // Enhanced token management
  refreshPushToken: () => Promise<void>;
  clearTokensAndReset: () => Promise<void>;
  debugTokenStatus: () => Promise<void>;

  // ✅ NEW: Course-based notification actions
  sendCourseStudySessionNotification: (
    sessionData: CourseStudySessionData,
  ) => Promise<void>;
  sendCourseCompletionNotification: (
    completionData: CourseCompletionData,
  ) => Promise<void>;
  sendCourseTestNotification: (
    courseId: string | number,
    courseTitle: string,
    courseType?: 'temel_dersler' | 'klinik_dersler',
  ) => Promise<void>;
  sendCourseLocalTestNotification: (
    courseTitle?: string,
    courseId?: string | number,
  ) => Promise<void>;

  // ✅ NEW: Course notification utilities
  extractCourseDataFromNotification: (
    notification: Notification,
  ) => CourseNotificationData | null;
  isCourseRelatedNotification: (notification: Notification) => boolean;
  formatCourseNotificationBody: (
    notification: Notification,
    maxLength?: number,
  ) => string;
  getCourseNotifications: () => Notification[];
  debugCourseNotifications: () => Promise<void>;

  // ✅ NEW: Integrated achievement handling
  handleCourseStudySessionCompleted: (
    sessionData: CourseStudySessionData,
  ) => Promise<void>;
  handleCourseCompleted: (
    completionData: CourseCompletionData,
  ) => Promise<void>;

  // ✅ NEW: Testing and debugging
  testCourseNotificationFlow: () => Promise<void>;
  testFullCourseFlow: (
    sessionData: CourseStudySessionData,
    completionData?: CourseCompletionData,
  ) => Promise<void>;

  // Existing utilities
  refreshUnreadCount: () => Promise<void>;
  clearError: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotifications must be used within a NotificationProvider',
    );
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  // State - Using your exact model types
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState<NotificationPreferences[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const NOTIFICATIONS_PER_PAGE = 20;
  const notificationsSupported = !isExpoGo && Device.isDevice;
  const isDevelopmentMode = isExpoGo;

  // Error handling - Enhanced for SDK 53 with course support
  const handleError = useCallback((err: any, action: string) => {
    console.error(`Notification ${action} error (SDK 53 + Course):`, err);

    // Only skip errors in actual Expo Go, not development builds
    if (isExpoGo) {
      console.warn(`🚀 Expo Go: ${action} failed (expected in Expo Go)`);
      return;
    }

    setError(err?.message || `${action} başarısız oldu`);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ENHANCED: Push notification registration with token cleanup
  const registerForPushNotifications = useCallback(async () => {
    try {
      if (isExpoGo) {
        console.log(
          '🚀 Expo Go detected - skipping push notification registration',
        );
        return;
      }

      if (!Device.isDevice) {
        console.warn('📱 Push notifications require a physical device');
        return;
      }

      console.log(
        '🔔 Setting up push notifications with enhanced validation and course support...',
      );

      // Check if device changed and debug current status
      await notificationService.debugRegistrationStatus();

      const result = await notificationService.setupPushNotifications();

      if (result.success && result.token) {
        setPushToken(result.token);
        console.log(
          '✅ Push notifications registered successfully with token cleanup and course support',
        );

        // Store token locally for debugging
        await AsyncStorage.setItem('pushToken', result.token);
        await AsyncStorage.setItem('pushTokenSDK', '53');
        await AsyncStorage.setItem('courseSupport', 'true');
      } else {
        console.warn('⚠️ Push notification setup failed:', result);
      }
    } catch (err) {
      handleError(err, 'push bildirim kayıt');
    }
  }, [handleError]);

  // ENHANCED: Force refresh push token
  const refreshPushToken = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Force refreshing push token with course support...');

      const result = await notificationService.forceTokenRefresh();

      if (result.success && result.token) {
        setPushToken(result.token);
        console.log('✅ Push token refreshed successfully with course support');
      } else {
        console.warn('⚠️ Push token refresh failed:', result.message);
        setError(result.message || 'Token refresh failed');
      }
    } catch (err) {
      handleError(err, 'token yenileme');
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  // ENHANCED: Clear all tokens and reset state
  const clearTokensAndReset = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log(
        '🧹 Clearing all tokens and resetting with course support...',
      );

      // Clear tokens from service
      await notificationService.clearDeviceTokens();

      // Reset local state
      setPushToken(null);
      setNotifications([]);
      setUnreadCount(0);
      setPage(0);
      setHasMore(true);

      console.log('✅ Tokens cleared and state reset with course support');

      // Re-register if supported
      if (notificationsSupported) {
        await registerForPushNotifications();
      }
    } catch (err) {
      handleError(err, 'token temizleme');
    } finally {
      setIsLoading(false);
    }
  }, [notificationsSupported, registerForPushNotifications, handleError]);

  // ENHANCED: Debug token status with course support
  const debugTokenStatus = useCallback(async () => {
    try {
      console.log('🔍 === NOTIFICATION CONTEXT DEBUG (Course Support) ===');

      // Service-level debug
      await notificationService.debugRegistrationStatus();

      // Context-level debug
      console.log('Context State:', {
        pushToken: pushToken ? 'Present' : 'None',
        notificationsSupported,
        isDevelopmentMode,
        isInitialized,
        notificationCount: notifications.length,
        unreadCount,
        courseNotificationCount: notifications.filter((n) =>
          notificationService.isCourseRelatedNotification(n),
        ).length,
      });

      // Full token registration debug
      await notificationService.debugTokenRegistration();

      // Course notification debug
      await notificationService.debugCourseNotifications();
    } catch (err) {
      console.error('❌ Debug token status failed:', err);
    }
  }, [
    pushToken,
    notificationsSupported,
    isDevelopmentMode,
    isInitialized,
    notifications,
    unreadCount,
  ]);

  // UPDATED: Send local test notification for SDK 53
  const sendLocalTestNotification = useCallback(async () => {
    try {
      console.log('🧪 Sending test notification (SDK 53)...');
      const success = await notificationService.sendLocalTestNotification();
      if (success) {
        console.log('📱 Local test notification sent successfully (SDK 53)');
      }
    } catch (err) {
      handleError(err, 'test bildirimi gönderme');
    }
  }, [handleError]);

  // ===============================
  // ✅ NEW: COURSE-BASED NOTIFICATION FUNCTIONS
  // ===============================

  // ✅ NEW: Send course study session notification
  const sendCourseStudySessionNotification = useCallback(
    async (sessionData: CourseStudySessionData) => {
      try {
        setIsLoading(true);
        console.log(
          '📚 Sending course study session notification...',
          sessionData,
        );

        if (isExpoGo) {
          // Add mock course notification for Expo Go
          const mockNotification: Notification = {
            notification_id: Date.now(),
            user_id: 1,
            notification_type: 'course_study_session',
            template_name: 'course_study_session_completed',
            title: `🎯 ${sessionData.courseTitle || 'Ders'} Seansı Tamamlandı!`,
            content: `${Math.round(sessionData.studyDurationSeconds / 60)} dakika çalışma tamamlandı. Harika ilerleme!`,
            variables: {
              course_id: sessionData.courseId.toString(),
              course_title: sessionData.courseTitle,
              study_duration_minutes: Math.round(
                sessionData.studyDurationSeconds / 60,
              ),
              break_duration_minutes: Math.round(
                (sessionData.breakDurationSeconds || 0) / 60,
              ),
            },
            is_read: false,
            status: 'sent',
            priority: 'normal',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            sent_at: new Date().toISOString(),
            read_at: null,
            course_data: {
              course_id: sessionData.courseId.toString(),
              course_title: sessionData.courseTitle,
              course_type: sessionData.courseType,
              study_duration_minutes: Math.round(
                sessionData.studyDurationSeconds / 60,
              ),
              break_duration_minutes: Math.round(
                (sessionData.breakDurationSeconds || 0) / 60,
              ),
              session_date: sessionData.sessionDate,
              session_id: sessionData.sessionId,
            },
          };

          setNotifications((prev) => [mockNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);
          console.log('✅ Mock course study session notification added');
          return;
        }

        const result =
          await notificationService.sendCourseStudySessionNotification(
            sessionData,
          );
        if (result) {
          console.log('✅ Course study session notification sent successfully');
          // Note: UI components should refresh notifications when needed
        }
      } catch (err) {
        handleError(err, 'ders seansı bildirimi gönderme');
      } finally {
        setIsLoading(false);
      }
    },
    [handleError],
  );

  // ✅ NEW: Send course completion notification
  const sendCourseCompletionNotification = useCallback(
    async (completionData: CourseCompletionData) => {
      try {
        setIsLoading(true);
        console.log(
          '🎯 Sending course completion notification...',
          completionData,
        );

        if (isExpoGo) {
          // Add mock course completion notification for Expo Go
          const mockNotification: Notification = {
            notification_id: Date.now(),
            user_id: 1,
            notification_type: 'course_completed',
            template_name: 'course_completed',
            title: `🎉 ${completionData.courseTitle} Tamamlandı!`,
            content: `Tebrikler! ${completionData.courseTitle} dersini başarıyla tamamladınız. %${completionData.completionPercentage} tamamlanma oranı.`,
            variables: {
              course_id: completionData.courseId.toString(),
              course_title: completionData.courseTitle,
              completion_percentage: completionData.completionPercentage,
            },
            is_read: false,
            status: 'sent',
            priority: 'high',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            sent_at: new Date().toISOString(),
            read_at: null,
            course_data: {
              course_id: completionData.courseId.toString(),
              course_title: completionData.courseTitle,
              course_type: completionData.courseType,
              completion_percentage: completionData.completionPercentage,
              total_study_time_minutes: Math.round(
                (completionData.totalStudyTimeSeconds || 0) / 60,
              ),
            },
          };

          setNotifications((prev) => [mockNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);
          console.log('✅ Mock course completion notification added');
          return;
        }

        const result =
          await notificationService.sendCourseCompletionNotification(
            completionData,
          );
        if (result) {
          console.log('✅ Course completion notification sent successfully');
          // Note: UI components should refresh notifications when needed
        }
      } catch (err) {
        handleError(err, 'ders tamamlama bildirimi gönderme');
      } finally {
        setIsLoading(false);
      }
    },
    [handleError],
  );

  // ✅ NEW: Send course test notification
  const sendCourseTestNotification = useCallback(
    async (
      courseId: string | number,
      courseTitle: string,
      courseType?: 'temel_dersler' | 'klinik_dersler',
    ) => {
      try {
        setIsLoading(true);
        console.log('🧪 Sending course test notification...', {
          courseId,
          courseTitle,
          courseType,
        });

        if (isExpoGo) {
          // Add mock course test notification for Expo Go
          const mockNotification: Notification = {
            notification_id: Date.now(),
            user_id: 1,
            notification_type: 'course_reminder',
            template_name: 'course_test_reminder',
            title: `🧪 ${courseTitle} Test Bildirimi`,
            content: `Bu ${courseTitle} dersi için bir test bildirimidir. Ders tabanlı bildirim sistemi çalışıyor!`,
            variables: {
              course_id: courseId.toString(),
              course_title: courseTitle,
              course_type: courseType,
            },
            is_read: false,
            status: 'sent',
            priority: 'normal',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            sent_at: new Date().toISOString(),
            read_at: null,
            course_data: {
              course_id: courseId.toString(),
              course_title: courseTitle,
              course_type: courseType,
            },
          };

          setNotifications((prev) => [mockNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);
          console.log('✅ Mock course test notification added');
          return;
        }

        const result = await notificationService.sendCourseTestNotification(
          courseId,
          courseTitle,
          courseType,
        );
        if (result) {
          console.log('✅ Course test notification sent successfully');
          // Note: UI components should refresh notifications when needed
        }
      } catch (err) {
        handleError(err, 'ders test bildirimi gönderme');
      } finally {
        setIsLoading(false);
      }
    },
    [handleError],
  );

  // ✅ NEW: Send course local test notification
  const sendCourseLocalTestNotification = useCallback(
    async (
      courseTitle: string = 'Örnek Ders',
      courseId: string | number = 'test_course_123',
    ) => {
      try {
        console.log('🧪 Sending course local test notification...', {
          courseTitle,
          courseId,
        });
        const success =
          await notificationService.sendCourseLocalTestNotification(
            courseTitle,
            courseId,
          );
        if (success) {
          console.log('📱 Course local test notification sent successfully');
        }
      } catch (err) {
        handleError(err, 'ders yerel test bildirimi gönderme');
      }
    },
    [handleError],
  );

  // ✅ NEW: Course notification utilities
  const extractCourseDataFromNotification = useCallback(
    (notification: Notification): CourseNotificationData | null => {
      return notificationService.extractCourseDataFromNotification(
        notification,
      );
    },
    [],
  );

  const isCourseRelatedNotification = useCallback(
    (notification: Notification): boolean => {
      return notificationService.isCourseRelatedNotification(notification);
    },
    [],
  );

  const formatCourseNotificationBody = useCallback(
    (notification: Notification, maxLength: number = 100): string => {
      return notificationService.formatCourseNotificationBody(
        notification,
        maxLength,
      );
    },
    [],
  );

  const getCourseNotifications = useCallback((): Notification[] => {
    return notifications.filter((notification) =>
      notificationService.isCourseRelatedNotification(notification),
    );
  }, [notifications]);

  const debugCourseNotifications = useCallback(async () => {
    try {
      console.log('🔍 === COURSE NOTIFICATION CONTEXT DEBUG ===');

      const courseNotifications = getCourseNotifications();
      console.log(
        `📚 Found ${courseNotifications.length} course notifications in context`,
      );

      courseNotifications.forEach((notification, index) => {
        const courseData = extractCourseDataFromNotification(notification);
        console.log(`Course Notification ${index + 1}:`, {
          id: notification.notification_id,
          type: notification.notification_type,
          title: notification.title,
          courseData,
          isRead: notification.is_read,
        });
      });

      // Call service-level debug
      await notificationService.debugCourseNotifications();
    } catch (err) {
      console.error('❌ Debug course notifications failed:', err);
    }
  }, [getCourseNotifications, extractCourseDataFromNotification]);

  // ✅ NEW: Integrated achievement handling
  const handleCourseStudySessionCompleted = useCallback(
    async (sessionData: CourseStudySessionData) => {
      try {
        setIsLoading(true);
        console.log(
          '🎯 Handling course study session completion (integrated)...',
          sessionData,
        );

        // Trigger achievements
        const achievementResult =
          await achievementService.handleCourseStudySessionCompleted(
            sessionData,
          );
        if (achievementResult && achievementResult.newAchievements > 0) {
          console.log(
            `🏆 Earned ${achievementResult.newAchievements} achievements from session`,
          );
        }

        // Send notification
        await sendCourseStudySessionNotification(sessionData);

        console.log('✅ Course study session completion handled successfully');
      } catch (err) {
        handleError(err, 'ders seansı tamamlama işleme');
      } finally {
        setIsLoading(false);
      }
    },
    [sendCourseStudySessionNotification, handleError],
  );

  const handleCourseCompleted = useCallback(
    async (completionData: CourseCompletionData) => {
      try {
        setIsLoading(true);
        console.log(
          '🎯 Handling course completion (integrated)...',
          completionData,
        );

        // Trigger achievements
        const achievementResult =
          await achievementService.handleCourseCompleted(completionData);
        if (achievementResult && achievementResult.newAchievements > 0) {
          console.log(
            `🏆 Earned ${achievementResult.newAchievements} achievements from course completion`,
          );
        }

        // Send notification
        await sendCourseCompletionNotification(completionData);

        console.log('✅ Course completion handled successfully');
      } catch (err) {
        handleError(err, 'ders tamamlama işleme');
      } finally {
        setIsLoading(false);
      }
    },
    [sendCourseCompletionNotification, handleError],
  );

  // ✅ NEW: Testing functions
  const testCourseNotificationFlow = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('🧪 Testing complete course notification flow...');

      // Test course study session
      const testSessionData: CourseStudySessionData = {
        courseId: 'test_course_123',
        courseTitle: 'Test Matematik',
        courseType: 'temel_dersler',
        studyDurationSeconds: 1800, // 30 minutes
        breakDurationSeconds: 300, // 5 minutes
        sessionDate: new Date().toISOString().split('T')[0],
        sessionId: 999,
      };

      await sendCourseStudySessionNotification(testSessionData);

      // Test course completion
      const testCompletionData: CourseCompletionData = {
        courseId: 'test_course_123',
        courseTitle: 'Test Matematik',
        courseType: 'temel_dersler',
        completionPercentage: 100,
        totalStudyTimeSeconds: 7200, // 2 hours
        totalSessions: 10,
      };

      await sendCourseCompletionNotification(testCompletionData);

      // Test course test notification
      await sendCourseTestNotification(
        'test_course_123',
        'Test Matematik',
        'temel_dersler',
      );

      // Test local notification
      await sendCourseLocalTestNotification(
        'Test Matematik',
        'test_course_123',
      );

      // Service-level test
      await notificationService.testCourseNotificationFlow();

      console.log('✅ Course notification flow test completed');
    } catch (err) {
      handleError(err, 'ders bildirim akışı test');
    } finally {
      setIsLoading(false);
    }
  }, [
    sendCourseStudySessionNotification,
    sendCourseCompletionNotification,
    sendCourseTestNotification,
    sendCourseLocalTestNotification,
    handleError,
  ]);

  const testFullCourseFlow = useCallback(
    async (
      sessionData: CourseStudySessionData,
      completionData?: CourseCompletionData,
    ) => {
      try {
        setIsLoading(true);
        console.log('🧪 Testing full integrated course flow...', {
          sessionData,
          completionData,
        });

        // Test session completion with achievements
        await handleCourseStudySessionCompleted(sessionData);

        // Test course completion with achievements if provided
        if (completionData) {
          await handleCourseCompleted(completionData);
        }

        // Test achievement service course flow
        await achievementService.testCourseAchievementFlow(sessionData);

        console.log('✅ Full integrated course flow test completed');
      } catch (err) {
        handleError(err, 'tam ders akışı test');
      } finally {
        setIsLoading(false);
      }
    },
    [handleCourseStudySessionCompleted, handleCourseCompleted, handleError],
  );

  // ===============================
  // EXISTING NOTIFICATION FUNCTIONS (Enhanced)
  // ===============================

  // REAL: Load notifications from API
  const loadNotifications = useCallback(
    async (refresh: boolean = false) => {
      try {
        setIsLoading(true);
        clearError();

        console.log(
          `📥 Loading notifications (SDK 53 + Course) - refresh: ${refresh}, page: ${page}`,
        );

        // Load real notifications using your API interface
        const currentPage = refresh ? 0 : page;
        const response = await notificationService.getNotifications(
          NOTIFICATIONS_PER_PAGE,
          currentPage * NOTIFICATIONS_PER_PAGE,
        );

        console.log(
          `📥 Loaded ${response.notifications.length} notifications (SDK 53 + Course)`,
        );

        if (refresh) {
          setNotifications(response.notifications);
          setPage(1);
        } else {
          setNotifications((prev) => [...prev, ...response.notifications]);
          setPage((prev) => prev + 1);
        }

        setUnreadCount(response.unread_count);
        setHasMore(response.notifications.length === NOTIFICATIONS_PER_PAGE);

        // Log course notification stats
        const courseNotificationCount = response.notifications.filter((n) =>
          notificationService.isCourseRelatedNotification(n),
        ).length;
        console.log(
          `📚 Found ${courseNotificationCount} course-related notifications`,
        );
      } catch (err) {
        handleError(err, 'bildirim yükleme');

        // Fallback to mock data only in Expo Go
        if (isExpoGo) {
          console.log(
            '🚀 Loading mock notifications for Expo Go with course support...',
          );
          const mockNotifications = await loadMockNotifications();
          setNotifications(mockNotifications);
          setUnreadCount(mockNotifications.filter((n) => !n.is_read).length);
          setHasMore(false);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [page, handleError, clearError],
  );

  // Mock data fallback for Expo Go - UPDATED with course support
  const loadMockNotifications = useCallback(async (): Promise<
    Notification[]
  > => {
    const stored = await AsyncStorage.getItem('mockNotifications_SDK53_Course');
    if (stored) {
      return JSON.parse(stored);
    }

    // Generate mock notifications with course support
    const mockData: Notification[] = [
      {
        notification_id: 1,
        user_id: 1,
        notification_type: 'course_study_session',
        template_name: 'course_study_session_completed',
        title: '📚 Matematik Seansı Tamamlandı!',
        content: '30 dakika matematik çalışması tamamlandı. Harika ilerleme!',
        variables: {
          course_id: 'math_101',
          course_title: 'Matematik',
          study_duration_minutes: 30,
          break_duration_minutes: 5,
        },
        is_read: false,
        status: 'sent',
        priority: 'normal',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sent_at: new Date().toISOString(),
        read_at: null,
        course_data: {
          course_id: 'math_101',
          course_title: 'Matematik',
          course_type: 'temel_dersler',
          study_duration_minutes: 30,
          break_duration_minutes: 5,
          session_date: new Date().toISOString().split('T')[0],
        },
      },
      {
        notification_id: 2,
        user_id: 1,
        notification_type: 'course_completed',
        template_name: 'course_completed',
        title: '🎉 Fizik Dersi Tamamlandı!',
        content: 'Tebrikler! Fizik dersini başarıyla tamamladınız.',
        variables: {
          course_id: 'physics_101',
          course_title: 'Fizik',
          completion_percentage: 100,
        },
        is_read: false,
        status: 'sent',
        priority: 'high',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString(),
        sent_at: new Date(Date.now() - 3600000).toISOString(),
        read_at: null,
        course_data: {
          course_id: 'physics_101',
          course_title: 'Fizik',
          course_type: 'temel_dersler',
          completion_percentage: 100,
        },
      },
      {
        notification_id: 3,
        user_id: 1,
        notification_type: 'achievement_unlock',
        template_name: 'achievement_unlock',
        title: 'Yeni Başarı! 🏆',
        content: '5 ders tamamlama başarısını kazandınız!',
        variables: {
          achievement_name: '5 Ders Uzmanı',
          achievement_id: 'course_expert_5',
        },
        is_read: false,
        status: 'sent',
        priority: 'high',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        updated_at: new Date(Date.now() - 7200000).toISOString(),
        sent_at: new Date(Date.now() - 7200000).toISOString(),
        read_at: null,
      },
      {
        notification_id: 4,
        user_id: 1,
        notification_type: 'course_reminder',
        template_name: 'course_daily_reminder',
        title: '⏰ Kimya Çalışma Zamanı!',
        content:
          'Kimya dersiniz için çalışma zamanı. Bugünkü hedefinizi tamamlayın!',
        variables: {
          course_id: 'chemistry_101',
          course_title: 'Kimya',
          reminder_type: 'daily',
        },
        is_read: true,
        status: 'read',
        priority: 'normal',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 43200000).toISOString(),
        sent_at: new Date(Date.now() - 86400000).toISOString(),
        read_at: new Date(Date.now() - 43200000).toISOString(),
        course_data: {
          course_id: 'chemistry_101',
          course_title: 'Kimya',
          course_type: 'temel_dersler',
        },
      },
      {
        notification_id: 5,
        user_id: 1,
        notification_type: 'system_announcement',
        template_name: 'system_announcement',
        title: 'Ders Tabanlı Sistem Aktif! 🚀',
        content:
          'Yeni ders tabanlı bildirim sistemi aktif. Ders başarılarınızı takip edin!',
        variables: {
          feature: 'course_based_notifications',
        },
        is_read: true,
        status: 'read',
        priority: 'normal',
        created_at: new Date(Date.now() - 172800000).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString(),
        sent_at: new Date(Date.now() - 172800000).toISOString(),
        read_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ];

    await AsyncStorage.setItem(
      'mockNotifications_SDK53_Course',
      JSON.stringify(mockData),
    );
    return mockData;
  }, []);

  const loadMoreNotifications = useCallback(async () => {
    if (!hasMore || isLoading) return;
    console.log('📥 Loading more notifications (SDK 53 + Course)...');
    await loadNotifications(false);
  }, [hasMore, isLoading, loadNotifications]);

  // ✅ NEW: Independent refresh function to avoid circular dependencies
  const refreshNotifications = useCallback(async () => {
    console.log('🔄 Refreshing notifications (SDK 53 + Course)...');
    await loadNotifications(true);
  }, [loadNotifications]);

  // Mark notification as read - Updated for SDK 53 + Course
  const markAsRead = useCallback(
    async (notificationId: number) => {
      try {
        console.log(
          `📖 Marking notification ${notificationId} as read (SDK 53 + Course)...`,
        );

        if (isExpoGo) {
          // Update mock data
          setNotifications((prev) =>
            prev.map((notif) =>
              notif.notification_id === notificationId
                ? {
                    ...notif,
                    is_read: true,
                    status: 'read',
                    read_at: new Date().toISOString(),
                  }
                : notif,
            ),
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));
          return;
        }

        await notificationService.markAsRead(notificationId);
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.notification_id === notificationId
              ? {
                  ...notif,
                  is_read: true,
                  status: 'read',
                  read_at: new Date().toISOString(),
                }
              : notif,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        console.log(
          `✅ Notification ${notificationId} marked as read (SDK 53 + Course)`,
        );
      } catch (err) {
        handleError(err, 'bildirim okundu işaretleme');
      }
    },
    [handleError],
  );

  const markAllAsRead = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('📖 Marking all notifications as read (SDK 53 + Course)...');

      if (isExpoGo) {
        setNotifications((prev) =>
          prev.map((notif) => ({
            ...notif,
            is_read: true,
            status: 'read' as const,
            read_at: notif.read_at || new Date().toISOString(),
          })),
        );
        setUnreadCount(0);
        return;
      }

      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((notif) => ({
          ...notif,
          is_read: true,
          status: 'read' as const,
          read_at: notif.read_at || new Date().toISOString(),
        })),
      );
      setUnreadCount(0);
      console.log('✅ All notifications marked as read (SDK 53 + Course)');
    } catch (err) {
      handleError(err, 'tüm bildirimleri okundu işaretleme');
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const deleteNotification = useCallback(
    async (notificationId: number) => {
      try {
        console.log(
          `🗑️ Deleting notification ${notificationId} (SDK 53 + Course)...`,
        );

        if (isExpoGo) {
          const deletedNotification = notifications.find(
            (n) => n.notification_id === notificationId,
          );
          setNotifications((prev) =>
            prev.filter((notif) => notif.notification_id !== notificationId),
          );
          if (deletedNotification && !deletedNotification.is_read) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
          return;
        }

        await notificationService.deleteNotification(notificationId);
        const deletedNotification = notifications.find(
          (n) => n.notification_id === notificationId,
        );
        setNotifications((prev) =>
          prev.filter((notif) => notif.notification_id !== notificationId),
        );
        if (deletedNotification && !deletedNotification.is_read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        console.log(
          `✅ Notification ${notificationId} deleted (SDK 53 + Course)`,
        );
      } catch (err) {
        handleError(err, 'bildirim silme');
      }
    },
    [notifications, handleError],
  );

  // Load preferences - Updated for SDK 53 + Course
  const loadPreferences = useCallback(async () => {
    try {
      console.log('⚙️ Loading notification preferences (SDK 53 + Course)...');

      if (isExpoGo) {
        const mockPrefs = await loadMockPreferences();
        setPreferences(mockPrefs);
        return;
      }

      const prefs = await notificationService.getPreferences();
      setPreferences(prefs);
      console.log(
        `✅ Loaded ${prefs.length} notification preferences (SDK 53 + Course)`,
      );
    } catch (err) {
      handleError(err, 'bildirim tercihlerini yükleme');
    }
  }, [handleError]);

  // Mock preferences with course support
  const loadMockPreferences = useCallback(async (): Promise<
    NotificationPreferences[]
  > => {
    const allNotificationTypes: NotificationType[] = [
      'study_reminder',
      'achievement_unlock',
      'duel_invitation',
      'duel_result',
      'friend_request',
      'friend_activity',
      'content_update',
      'streak_reminder',
      'plan_reminder',
      'coaching_note',
      'motivational_message',
      'system_announcement',
      // ✅ NEW: Course-specific types
      'course_reminder',
      'course_completed',
      'course_progress',
      'course_milestone',
      'course_study_session',
    ];

    const mockPreferences: NotificationPreferences[] = allNotificationTypes.map(
      (type) => ({
        notification_type: type,
        in_app_enabled: true,
        push_enabled: !isExpoGo, // Enhanced: Enable push in development builds
        email_enabled: false,
        frequency_hours: type.startsWith('course_') ? 12 : 24, // More frequent for course notifications
        quiet_hours_start: '22:00:00',
        quiet_hours_end: '08:00:00',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    );

    return mockPreferences;
  }, []);

  const updatePreferences = useCallback(
    async (type: NotificationType, prefs: Partial<NotificationPreferences>) => {
      try {
        console.log(`⚙️ Updating preferences for ${type} (SDK 53 + Course)...`);

        if (isExpoGo) {
          setPreferences((prev) => {
            const index = prev.findIndex((p) => p.notification_type === type);
            if (index >= 0) {
              const newPrefs = [...prev];
              newPrefs[index] = { ...newPrefs[index], ...prefs };
              return newPrefs;
            }
            return prev;
          });
          return;
        }

        const updatedPref = await notificationService.updatePreferences(
          type,
          prefs,
        );
        setPreferences((prev) => {
          const index = prev.findIndex((p) => p.notification_type === type);
          if (index >= 0) {
            const newPrefs = [...prev];
            newPrefs[index] = updatedPref;
            return newPrefs;
          }
          return [...prev, updatedPref];
        });
        console.log(`✅ Updated preferences for ${type} (SDK 53 + Course)`);
      } catch (err) {
        handleError(err, 'bildirim tercihlerini güncelleme');
      }
    },
    [handleError],
  );

  // Load stats - Updated for SDK 53 + Course
  const loadStats = useCallback(async () => {
    try {
      console.log('📊 Loading notification stats (SDK 53 + Course)...');

      if (isExpoGo) {
        // Mock stats with course support
        const mockStats: NotificationStats = {
          total_notifications: 25,
          read_count: 18,
          unread_count: 7,
          type_counts: {
            study_reminder: 4,
            achievement_unlock: 3,
            duel_invitation: 2,
            duel_result: 2,
            friend_request: 1,
            friend_activity: 2,
            content_update: 1,
            streak_reminder: 1,
            plan_reminder: 1,
            coaching_note: 1,
            motivational_message: 1,
            system_announcement: 2,
            // ✅ NEW: Course-specific stats
            course_reminder: 3,
            course_completed: 1,
            course_progress: 2,
            course_milestone: 1,
            course_study_session: 4,
          },
        };
        setStats(mockStats);
        return;
      }

      const statsData = await notificationService.getStats();
      setStats(statsData);
      console.log('✅ Loaded notification stats (SDK 53 + Course)');
    } catch (err) {
      handleError(err, 'bildirim istatistiklerini yükleme');
    }
  }, [handleError]);

  const refreshUnreadCount = useCallback(async () => {
    try {
      if (isExpoGo) {
        const unread = notifications.filter((n) => !n.is_read).length;
        setUnreadCount(unread);
        return;
      }

      const { unread_count } = await notificationService.getUnreadCount();
      setUnreadCount(unread_count);
    } catch (err) {
      console.warn('Failed to refresh unread count (SDK 53 + Course):', err);
    }
  }, [notifications]);

  // ENHANCED: Initialize notifications and setup listeners for SDK 53 + Course
  useEffect(() => {
    const initialize = async () => {
      if (isInitialized) return;

      console.log(
        '🚀 Initializing enhanced notifications (SDK 53 + Course)...',
      );

      try {
        // Load stored push token
        const storedToken = await notificationService.getCurrentPushToken();
        if (storedToken) {
          setPushToken(storedToken);
          console.log('📱 Found stored push token (SDK 53 + Course)');
        }

        // Setup notification listeners if supported
        let cleanupListeners: (() => void) | undefined;
        if (notificationsSupported) {
          console.log(
            '👂 Setting up notification listeners (SDK 53 + Course)...',
          );
          cleanupListeners = notificationService.setupNotificationListeners();

          // Setup course notification handling
          const courseCleanup =
            await notificationService.setupCourseNotificationHandling();
          const originalCleanup = cleanupListeners;
          cleanupListeners = () => {
            if (originalCleanup) originalCleanup();
            if (courseCleanup) courseCleanup();
          };

          // Register for push notifications with enhanced validation
          await registerForPushNotifications();
        }

        // Load initial data
        await Promise.all([loadNotifications(true), loadPreferences()]);

        setIsInitialized(true);
        console.log(
          '✅ Enhanced notification initialization complete (SDK 53 + Course)',
        );

        // Return cleanup function
        return cleanupListeners;
      } catch (error) {
        console.error('❌ Enhanced notification initialization failed:', error);
        handleError(error, 'bildirim başlatma');
      }
    };

    const cleanup = initialize();

    return () => {
      if (cleanup instanceof Promise) {
        cleanup.then((cleanupFn) => {
          if (typeof cleanupFn === 'function') {
            cleanupFn();
          }
        });
      }
    };
  }, [isInitialized]); // Only run when not initialized

  const value: NotificationContextType = {
    // State
    notifications,
    unreadCount,
    preferences,
    stats,
    isLoading,
    error,
    notificationsSupported,
    isDevelopmentMode,
    pushToken,

    // Core Actions
    loadNotifications,
    loadMoreNotifications,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadPreferences,
    updatePreferences,
    loadStats,
    registerForPushNotifications,
    sendLocalTestNotification,

    // Enhanced token management
    refreshPushToken,
    clearTokensAndReset,
    debugTokenStatus,

    // ✅ NEW: Course-based notification actions
    sendCourseStudySessionNotification,
    sendCourseCompletionNotification,
    sendCourseTestNotification,
    sendCourseLocalTestNotification,

    // ✅ NEW: Course notification utilities
    extractCourseDataFromNotification,
    isCourseRelatedNotification,
    formatCourseNotificationBody,
    getCourseNotifications,
    debugCourseNotifications,

    // ✅ NEW: Integrated achievement handling
    handleCourseStudySessionCompleted,
    handleCourseCompleted,

    // ✅ NEW: Testing and debugging
    testCourseNotificationFlow,
    testFullCourseFlow,

    // Utilities
    refreshUnreadCount,
    clearError,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
