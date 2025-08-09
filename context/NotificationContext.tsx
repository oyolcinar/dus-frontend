// context/NotificationContext.tsx - OPTIMIZED for Performance with Caching (No Mock Data)
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
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

// 🚀 PERFORMANCE FIX: Add caching for notification data
const NOTIFICATION_CACHE_DURATION = 3 * 60 * 1000; // 3 minutes cache
const PREFERENCES_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes cache
const STATS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

let notificationsCache: {
  notifications: Notification[];
  timestamp: number;
  unreadCount: number;
} | null = null;
let preferencesCache: {
  preferences: NotificationPreferences[];
  timestamp: number;
} | null = null;
let statsCache: { stats: NotificationStats; timestamp: number } | null = null;

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

  // Core Actions - All memoized
  loadNotifications: (refresh?: boolean) => Promise<void>;
  loadMoreNotifications: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
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

  // Course-based notification actions - Memoized
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

  // Utilities - Memoized
  getCourseNotifications: () => Notification[];
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
  // 🚀 PERFORMANCE FIX: Reduced state complexity
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState<NotificationPreferences[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pushToken, setPushToken] = useState<string | null>(null);

  // 🚀 PERFORMANCE FIX: Use refs to prevent unnecessary re-renders
  const hasInitialized = useRef(false);
  const lastNotificationsFetch = useRef(0);
  const lastPreferencesFetch = useRef(0);
  const page = useRef(0);
  const hasMore = useRef(true);

  const NOTIFICATIONS_PER_PAGE = 20;
  const notificationsSupported = !isExpoGo && Device.isDevice;
  const isDevelopmentMode = isExpoGo;

  // 🚀 PERFORMANCE FIX: Memoized error handler
  const handleError = useCallback((err: any, action: string) => {
    console.error(`Notification ${action} error (SDK 53 + Course):`, err);

    if (isExpoGo) {
      console.warn(`🚀 Expo Go: ${action} failed (expected in Expo Go)`);
      return;
    }

    setError(err?.message || `${action} başarısız oldu`);
  }, []);

  // 🚀 PERFORMANCE FIX: Memoized clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 🚀 PERFORMANCE FIX: Cached notification loading
  const loadNotificationsFromAPI = useCallback(async (currentPage: number) => {
    console.log(`📥 Loading notifications from API (page ${currentPage})...`);
    const response = await notificationService.getNotifications(
      NOTIFICATIONS_PER_PAGE,
      currentPage * NOTIFICATIONS_PER_PAGE,
    );
    console.log(
      `✅ Loaded ${response.notifications.length} notifications from API`,
    );
    return response;
  }, []);

  // 🚀 PERFORMANCE FIX: Main load function with caching
  const loadNotifications = useCallback(
    async (refresh: boolean = false) => {
      const now = Date.now();

      // Check cache first (only for refresh = true, fresh loads)
      if (
        refresh &&
        notificationsCache &&
        now - notificationsCache.timestamp < NOTIFICATION_CACHE_DURATION
      ) {
        console.log('📥 Using cached notifications');
        setNotifications(notificationsCache.notifications);
        setUnreadCount(notificationsCache.unreadCount);
        return;
      }

      // Rate limiting for frequent calls
      if (now - lastNotificationsFetch.current < 1000) {
        console.log('⏸️ Skipping notifications fetch (too recent)');
        return;
      }

      lastNotificationsFetch.current = now;

      try {
        setIsLoading(true);
        clearError();

        console.log(
          `📥 Loading notifications (SDK 53 + Course) - refresh: ${refresh}, page: ${page.current}`,
        );

        const currentPage = refresh ? 0 : page.current;
        const response = await loadNotificationsFromAPI(currentPage);

        if (refresh) {
          setNotifications(response.notifications);
          page.current = 1;
        } else {
          setNotifications((prev) => [...prev, ...response.notifications]);
          page.current = page.current + 1;
        }

        setUnreadCount(response.unread_count);
        hasMore.current =
          response.notifications.length === NOTIFICATIONS_PER_PAGE;

        // Cache the result (only for refresh)
        if (refresh) {
          notificationsCache = {
            notifications: response.notifications,
            timestamp: now,
            unreadCount: response.unread_count,
          };
        }

        const courseNotificationCount = response.notifications.filter((n) =>
          notificationService.isCourseRelatedNotification(n),
        ).length;
        console.log(
          `📚 Found ${courseNotificationCount} course-related notifications`,
        );
      } catch (err) {
        handleError(err, 'bildirim yükleme');
      } finally {
        setIsLoading(false);
      }
    },
    [handleError, clearError, loadNotificationsFromAPI],
  );

  // 🚀 PERFORMANCE FIX: Memoized load more
  const loadMoreNotifications = useCallback(async () => {
    if (!hasMore.current || isLoading) return;
    console.log('📥 Loading more notifications (SDK 53 + Course)...');
    await loadNotifications(false);
  }, [isLoading, loadNotifications]);

  // 🚀 PERFORMANCE FIX: Memoized refresh
  const refreshNotifications = useCallback(async () => {
    console.log('🔄 Refreshing notifications (SDK 53 + Course)...');
    // Clear cache to force fresh data
    notificationsCache = null;
    await loadNotifications(true);
  }, [loadNotifications]);

  // 🚀 PERFORMANCE FIX: Cached preferences loading
  const loadPreferences = useCallback(async () => {
    const now = Date.now();

    // Check cache first
    if (
      preferencesCache &&
      now - preferencesCache.timestamp < PREFERENCES_CACHE_DURATION
    ) {
      console.log('⚙️ Using cached preferences');
      setPreferences(preferencesCache.preferences);
      return;
    }

    // Rate limiting
    if (now - lastPreferencesFetch.current < 2000) {
      console.log('⏸️ Skipping preferences fetch (too recent)');
      return;
    }

    lastPreferencesFetch.current = now;

    try {
      console.log('⚙️ Loading notification preferences (SDK 53 + Course)...');

      const prefs = await notificationService.getPreferences();
      setPreferences(prefs);

      // Cache the result
      preferencesCache = {
        preferences: prefs,
        timestamp: now,
      };

      console.log(
        `✅ Loaded ${prefs.length} notification preferences (SDK 53 + Course)`,
      );
    } catch (err) {
      handleError(err, 'bildirim tercihlerini yükleme');
    }
  }, [handleError]);

  // 🚀 PERFORMANCE FIX: Cached stats loading
  const loadStats = useCallback(async () => {
    const now = Date.now();

    // Check cache first
    if (statsCache && now - statsCache.timestamp < STATS_CACHE_DURATION) {
      console.log('📊 Using cached stats');
      setStats(statsCache.stats);
      return;
    }

    try {
      console.log('📊 Loading notification stats (SDK 53 + Course)...');

      const statsData = await notificationService.getStats();
      setStats(statsData);

      // Cache the result
      statsCache = {
        stats: statsData,
        timestamp: now,
      };

      console.log('✅ Loaded notification stats (SDK 53 + Course)');
    } catch (err) {
      handleError(err, 'bildirim istatistiklerini yükleme');
    }
  }, [handleError]);

  // 🚀 PERFORMANCE FIX: Simplified and memoized functions
  const markAsRead = useCallback(
    async (notificationId: number) => {
      try {
        console.log(`📖 Marking notification ${notificationId} as read...`);

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

        // Invalidate cache
        notificationsCache = null;

        console.log(`✅ Notification ${notificationId} marked as read`);
      } catch (err) {
        handleError(err, 'bildirim okundu işaretleme');
      }
    },
    [handleError],
  );

  const markAllAsRead = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('📖 Marking all notifications as read...');

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

      // Invalidate cache
      notificationsCache = null;

      console.log('✅ All notifications marked as read');
    } catch (err) {
      handleError(err, 'tüm bildirimleri okundu işaretleme');
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const deleteNotification = useCallback(
    async (notificationId: number) => {
      try {
        console.log(`🗑️ Deleting notification ${notificationId}...`);

        const deletedNotification = notifications.find(
          (n) => n.notification_id === notificationId,
        );

        await notificationService.deleteNotification(notificationId);
        setNotifications((prev) =>
          prev.filter((notif) => notif.notification_id !== notificationId),
        );
        if (deletedNotification && !deletedNotification.is_read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }

        // Invalidate cache
        notificationsCache = null;

        console.log(`✅ Notification ${notificationId} deleted`);
      } catch (err) {
        handleError(err, 'bildirim silme');
      }
    },
    [notifications, handleError],
  );

  const updatePreferences = useCallback(
    async (type: NotificationType, prefs: Partial<NotificationPreferences>) => {
      try {
        console.log(`⚙️ Updating preferences for ${type}...`);

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

        // Invalidate preferences cache
        preferencesCache = null;

        console.log(`✅ Updated preferences for ${type}`);
      } catch (err) {
        handleError(err, 'bildirim tercihlerini güncelleme');
      }
    },
    [handleError],
  );

  // 🚀 PERFORMANCE FIX: Simplified course notification functions
  const sendCourseStudySessionNotification = useCallback(
    async (sessionData: CourseStudySessionData) => {
      try {
        setIsLoading(true);
        console.log(
          '📚 Sending course study session notification...',
          sessionData,
        );

        const result =
          await notificationService.sendCourseStudySessionNotification(
            sessionData,
          );
        if (result) {
          console.log('✅ Course study session notification sent successfully');
          // Invalidate cache to show new notification
          notificationsCache = null;
        }
      } catch (err) {
        handleError(err, 'ders seansı bildirimi gönderme');
      } finally {
        setIsLoading(false);
      }
    },
    [handleError],
  );

  const sendCourseCompletionNotification = useCallback(
    async (completionData: CourseCompletionData) => {
      try {
        setIsLoading(true);
        console.log(
          '🎯 Sending course completion notification...',
          completionData,
        );

        const result =
          await notificationService.sendCourseCompletionNotification(
            completionData,
          );
        if (result) {
          console.log('✅ Course completion notification sent successfully');
          // Invalidate cache to show new notification
          notificationsCache = null;
        }
      } catch (err) {
        handleError(err, 'ders tamamlama bildirimi gönderme');
      } finally {
        setIsLoading(false);
      }
    },
    [handleError],
  );

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

        const result = await notificationService.sendCourseTestNotification(
          courseId,
          courseTitle,
          courseType,
        );
        if (result) {
          console.log('✅ Course test notification sent successfully');
          // Invalidate cache to show new notification
          notificationsCache = null;
        }
      } catch (err) {
        handleError(err, 'ders test bildirimi gönderme');
      } finally {
        setIsLoading(false);
      }
    },
    [handleError],
  );

  // 🚀 PERFORMANCE FIX: Simplified utility functions
  const registerForPushNotifications = useCallback(async () => {
    try {
      if (isExpoGo || !Device.isDevice) {
        console.log(
          '🚀 Skipping push notification registration (Expo Go or simulator)',
        );
        return;
      }

      console.log('🔔 Setting up push notifications...');
      const result = await notificationService.setupPushNotifications();

      if (result.success && result.token) {
        setPushToken(result.token);
        console.log('✅ Push notifications registered successfully');
      }
    } catch (err) {
      handleError(err, 'push bildirim kayıt');
    }
  }, [handleError]);

  const sendLocalTestNotification = useCallback(async () => {
    try {
      console.log('🧪 Sending test notification...');
      const success = await notificationService.sendLocalTestNotification();
      if (success) {
        console.log('📱 Local test notification sent successfully');
      }
    } catch (err) {
      handleError(err, 'test bildirimi gönderme');
    }
  }, [handleError]);

  // 🚀 PERFORMANCE FIX: Memoized utility functions
  const getCourseNotifications = useCallback((): Notification[] => {
    return notifications.filter((notification) =>
      notificationService.isCourseRelatedNotification(notification),
    );
  }, [notifications]);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const { unread_count } = await notificationService.getUnreadCount();
      setUnreadCount(unread_count);
    } catch (err) {
      console.warn('Failed to refresh unread count:', err);
    }
  }, []);

  // 🚀 PERFORMANCE FIX: Optimized initialization
  useEffect(() => {
    if (hasInitialized.current) return;

    const initialize = async () => {
      console.log(
        '🚀 Initializing enhanced notifications (SDK 53 + Course)...',
      );

      try {
        hasInitialized.current = true;

        // Load stored push token
        const storedToken = await notificationService.getCurrentPushToken();
        if (storedToken) {
          setPushToken(storedToken);
        }

        // Setup notification listeners if supported
        if (notificationsSupported) {
          const cleanupListeners =
            notificationService.setupNotificationListeners();
          await registerForPushNotifications();

          // Return cleanup function
          return cleanupListeners;
        }

        // Load initial data (cached)
        await Promise.all([loadNotifications(true), loadPreferences()]);

        console.log('✅ Enhanced notification initialization complete');
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
  }, []); // 🚀 PERFORMANCE FIX: Only run once

  // 🚀 PERFORMANCE FIX: Memoized context value
  const value = useMemo(
    (): NotificationContextType => ({
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

      // Course-based notification actions
      sendCourseStudySessionNotification,
      sendCourseCompletionNotification,
      sendCourseTestNotification,

      // Utilities
      getCourseNotifications,
      refreshUnreadCount,
      clearError,
    }),
    [
      notifications,
      unreadCount,
      preferences,
      stats,
      isLoading,
      error,
      pushToken,
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
      sendCourseStudySessionNotification,
      sendCourseCompletionNotification,
      sendCourseTestNotification,
      getCourseNotifications,
      refreshUnreadCount,
      clearError,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
