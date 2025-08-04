// context/NotificationContext.tsx - Updated for Expo Go compatibility
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Notification,
  NotificationPreferences,
  NotificationStats,
  NotificationType,
} from '../src/types/models';
import * as notificationService from '../src/api/notificationService';

// Detect Expo Go environment - Manual override for testing
const FORCE_EXPO_GO_MODE = false; // Set to true for Expo Go testing, false for production
const isExpoGo = FORCE_EXPO_GO_MODE && __DEV__;

console.log('🚀 Expo Go Mode:', { FORCE_EXPO_GO_MODE, __DEV__, isExpoGo });

interface NotificationContextType {
  // State
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences[];
  stats: NotificationStats | null;
  isLoading: boolean;
  error: string | null;
  notificationsSupported: boolean;
  isDevelopmentMode: boolean;

  // Actions
  loadNotifications: (refresh?: boolean) => Promise<void>;
  loadMoreNotifications: () => Promise<void>;
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

  // Utilities
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
  // State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState<NotificationPreferences[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const NOTIFICATIONS_PER_PAGE = 20;
  const notificationsSupported = !isExpoGo && Device.isDevice;
  const isDevelopmentMode = isExpoGo;

  // Error handling - more lenient for development
  const handleError = useCallback((err: any, action: string) => {
    console.error(`Notification ${action} error:`, err);

    // Don't set error state for expected Expo Go failures
    if (
      isExpoGo &&
      (err.message?.includes('device token') ||
        err.message?.includes('Internal server error') ||
        err.message?.includes('expo-notifications'))
    ) {
      console.warn(`🚀 Expo Go: ${action} failed (expected in development)`);
      return;
    }

    setError(err?.message || `${action} başarısız oldu`);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load notifications - with fallback data for Expo Go
  const loadNotifications = useCallback(
    async (refresh: boolean = false) => {
      try {
        setIsLoading(true);
        clearError();

        if (isExpoGo) {
          // Load mock data for Expo Go
          const mockNotifications = await loadMockNotifications();
          setNotifications(mockNotifications);
          setUnreadCount(mockNotifications.filter((n) => !n.is_read).length);
          setHasMore(false);
          return;
        }

        const currentPage = refresh ? 0 : page;
        const response = await notificationService.getNotifications(
          NOTIFICATIONS_PER_PAGE,
          currentPage * NOTIFICATIONS_PER_PAGE,
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
      } catch (err) {
        handleError(err, 'bildirim yükleme');
      } finally {
        setIsLoading(false);
      }
    },
    [page, handleError, clearError],
  );

  // Mock data for Expo Go development - matching your backend structure
  const loadMockNotifications = useCallback(async (): Promise<
    Notification[]
  > => {
    const stored = await AsyncStorage.getItem('mockNotifications');
    if (stored) {
      return JSON.parse(stored);
    }

    // Generate some mock notifications for development - matching your backend structure
    const mockData: Notification[] = [
      {
        notification_id: 1,
        user_id: 1,
        notification_type: 'study_reminder',
        title: 'Çalışma Zamanı! 📚',
        body: 'Günlük çalışma hedefinizi tamamlamak için harika bir zaman!',
        is_read: false,
        status: 'sent',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {},
      },
      {
        notification_id: 2,
        user_id: 1,
        notification_type: 'achievement_unlock',
        title: 'Yeni Başarı! 🏆',
        body: '7 gün üst üste çalışma başarısını kazandınız!',
        is_read: false,
        status: 'sent',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString(),
        metadata: { achievement_id: 'streak_7_days' },
        action_url: '/(tabs)/profile/achievements',
      },
      {
        notification_id: 3,
        user_id: 1,
        notification_type: 'duel_invitation',
        title: 'Düello Daveti! ⚔️',
        body: 'Ali sizi matematik düellosuna davet etti!',
        is_read: true,
        status: 'read',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString(),
        read_at: new Date(Date.now() - 3600000).toISOString(),
        metadata: { duel_id: 123, opponent: 'Ali' },
        action_url: '/duels/123',
      },
    ];

    await AsyncStorage.setItem('mockNotifications', JSON.stringify(mockData));
    return mockData;
  }, []);

  // Register for push notifications - with Expo Go handling
  const registerForPushNotifications = useCallback(async () => {
    try {
      if (isExpoGo) {
        console.log(
          '🚀 Expo Go detected - skipping push notification registration',
        );
        console.log('✅ Mock registration completed');
        return;
      }

      // Use the notification service setupPushNotifications function
      const result = await notificationService.setupPushNotifications();
      console.log('✅ Push notifications registered successfully:', result);
    } catch (err) {
      // Don't throw error for Expo Go
      if (!isExpoGo) {
        handleError(err, 'push bildirim kayıt');
      }
    }
  }, [handleError]);

  // Mark notification as read
  const markAsRead = useCallback(
    async (notificationId: number) => {
      try {
        if (isExpoGo) {
          // Update mock data
          setNotifications((prev) =>
            prev.map((notif) =>
              notif.notification_id === notificationId
                ? { ...notif, is_read: true, read_at: new Date().toISOString() }
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
              ? { ...notif, is_read: true, read_at: new Date().toISOString() }
              : notif,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        handleError(err, 'bildirim okundu işaretleme');
      }
    },
    [handleError],
  );

  const loadMoreNotifications = useCallback(async () => {
    if (!hasMore || isLoading || isExpoGo) return;
    await loadNotifications(false);
  }, [hasMore, isLoading, loadNotifications]);

  const markAllAsRead = useCallback(async () => {
    try {
      setIsLoading(true);

      if (isExpoGo) {
        setNotifications((prev) =>
          prev.map((notif) => ({
            ...notif,
            is_read: true,
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
          read_at: notif.read_at || new Date().toISOString(),
        })),
      );
      setUnreadCount(0);
    } catch (err) {
      handleError(err, 'tüm bildirimleri okundu işaretleme');
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const deleteNotification = useCallback(
    async (notificationId: number) => {
      try {
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
      } catch (err) {
        handleError(err, 'bildirim silme');
      }
    },
    [notifications, handleError],
  );

  const loadPreferences = useCallback(async () => {
    try {
      if (isExpoGo) {
        // Load mock preferences
        const mockPrefs = await loadMockPreferences();
        setPreferences(mockPrefs);
        return;
      }

      const prefs = await notificationService.getPreferences();
      setPreferences(prefs);
    } catch (err) {
      handleError(err, 'bildirim tercihlerini yükleme');
    }
  }, [handleError]);

  const loadMockPreferences = useCallback(async () => {
    // Return mock preferences for all notification types - matching your backend structure
    const mockPreferences: NotificationPreferences[] = [
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
    ].map((type) => ({
      notification_type: type as NotificationType,
      in_app_enabled: true,
      push_enabled: false, // Disabled in Expo Go
      email_enabled: false,
      frequency_hours: 24,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    return mockPreferences;
  }, []);

  const updatePreferences = useCallback(
    async (type: NotificationType, prefs: Partial<NotificationPreferences>) => {
      try {
        if (isExpoGo) {
          // Update mock preferences
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
      } catch (err) {
        handleError(err, 'bildirim tercihlerini güncelleme');
      }
    },
    [handleError],
  );

  const loadStats = useCallback(async () => {
    try {
      if (isExpoGo) {
        // Fixed mock stats with proper type_counts structure
        const mockStats: NotificationStats = {
          total_notifications: 15,
          read_count: 12,
          unread_count: 3,
          type_counts: {
            study_reminder: 4,
            achievement_unlock: 2,
            duel_invitation: 3,
            duel_result: 2,
            friend_request: 1,
            friend_activity: 2,
            content_update: 1,
            streak_reminder: 0,
            plan_reminder: 0,
            coaching_note: 0,
            motivational_message: 0,
            system_announcement: 0,
          },
        };
        setStats(mockStats);
        return;
      }

      const statsData = await notificationService.getStats();
      setStats(statsData);
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
      console.warn('Failed to refresh unread count:', err);
    }
  }, [notifications]);

  // Initialize
  useEffect(() => {
    const initialize = async () => {
      await loadNotifications(true);
      await loadPreferences();
      await registerForPushNotifications();
    };

    initialize();
  }, [loadNotifications, loadPreferences, registerForPushNotifications]);

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

    // Actions
    loadNotifications,
    loadMoreNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadPreferences,
    updatePreferences,
    loadStats,
    registerForPushNotifications,

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
