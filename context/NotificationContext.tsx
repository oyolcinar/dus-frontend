// context/NotificationContext.tsx - Latest version for Expo SDK 53
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
} from '../src/types/models';
import * as notificationService from '../src/api/notificationService';

// UPDATED: Proper detection for Expo SDK 53
const isExpoGo = Constants.appOwnership === 'expo';
const isDevelopmentBuild = !isExpoGo;

console.log('🚀 NotificationContext (SDK 53):', {
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
  sendLocalTestNotification: () => Promise<void>;

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

  const NOTIFICATIONS_PER_PAGE = 20;
  const notificationsSupported = !isExpoGo && Device.isDevice;
  const isDevelopmentMode = isExpoGo;

  // Error handling - Updated for SDK 53
  const handleError = useCallback((err: any, action: string) => {
    console.error(`Notification ${action} error (SDK 53):`, err);

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

  // UPDATED: Push notification registration for SDK 53
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

      console.log('🔔 Setting up push notifications (SDK 53)...');

      const result = await notificationService.setupPushNotifications();

      if (result.success && result.token) {
        setPushToken(result.token);
        console.log('✅ Push notifications registered successfully (SDK 53)');

        // Store token locally for debugging
        await AsyncStorage.setItem('pushToken', result.token);
        await AsyncStorage.setItem('pushTokenSDK', '53');
      } else {
        console.warn('⚠️ Push notification setup failed (SDK 53):', result);
      }
    } catch (err) {
      handleError(err, 'push bildirim kayıt');
    }
  }, [handleError]);

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

  // REAL: Load notifications from API
  const loadNotifications = useCallback(
    async (refresh: boolean = false) => {
      try {
        setIsLoading(true);
        clearError();

        console.log(
          `📥 Loading notifications (SDK 53) - refresh: ${refresh}, page: ${page}`,
        );

        // Load real notifications using your API interface
        const currentPage = refresh ? 0 : page;
        const response = await notificationService.getNotifications(
          NOTIFICATIONS_PER_PAGE,
          currentPage * NOTIFICATIONS_PER_PAGE,
        );

        console.log(
          `📥 Loaded ${response.notifications.length} notifications (SDK 53)`,
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

        // Fallback to mock data only in Expo Go
        if (isExpoGo) {
          console.log('🚀 Loading mock notifications for Expo Go...');
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

  // Mock data fallback for Expo Go - Matching your exact Notification interface
  const loadMockNotifications = useCallback(async (): Promise<
    Notification[]
  > => {
    const stored = await AsyncStorage.getItem('mockNotifications_SDK53');
    if (stored) {
      return JSON.parse(stored);
    }

    // Generate mock notifications matching your exact interface for SDK 53
    const mockData: Notification[] = [
      {
        notification_id: 1,
        user_id: 1,
        notification_type: 'study_reminder',
        title: 'Çalışma Zamanı! 📚',
        body: 'Günlük çalışma hedefinizi tamamlamak için harika bir zaman!',
        action_url: '/(tabs)/courses',
        icon_name: 'book',
        status: 'sent',
        is_read: false,
        metadata: {
          reminder_type: 'daily',
          sdk_version: '53',
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sent_at: new Date().toISOString(),
        read_at: null,
      },
      {
        notification_id: 2,
        user_id: 1,
        notification_type: 'achievement_unlock',
        title: 'Yeni Başarı! 🏆',
        body: '7 gün üst üste çalışma başarısını kazandınız!',
        action_url: '/(tabs)/profile/achievements',
        icon_name: 'trophy',
        status: 'sent',
        is_read: false,
        metadata: {
          achievement_id: 'streak_7_days',
          achievement_name: '7 Günlük Seri',
          sdk_version: '53',
        },
        created_at: new Date(Date.now() - 3600000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString(),
        sent_at: new Date(Date.now() - 3600000).toISOString(),
        read_at: null,
      },
      {
        notification_id: 3,
        user_id: 1,
        notification_type: 'duel_invitation',
        title: 'Düello Daveti! ⚔️',
        body: 'Ali sizi matematik düellosuna davet etti!',
        action_url: '/duels/123',
        icon_name: 'users',
        status: 'read',
        is_read: true,
        metadata: {
          duel_id: 123,
          opponent: 'Ali',
          challenger_name: 'Ali',
          sdk_version: '53',
        },
        created_at: new Date(Date.now() - 7200000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString(),
        sent_at: new Date(Date.now() - 7200000).toISOString(),
        read_at: new Date(Date.now() - 3600000).toISOString(),
      },
    ];

    await AsyncStorage.setItem(
      'mockNotifications_SDK53',
      JSON.stringify(mockData),
    );
    return mockData;
  }, []);

  const loadMoreNotifications = useCallback(async () => {
    if (!hasMore || isLoading) return;
    console.log('📥 Loading more notifications (SDK 53)...');
    await loadNotifications(false);
  }, [hasMore, isLoading, loadNotifications]);

  // Mark notification as read - Updated for SDK 53
  const markAsRead = useCallback(
    async (notificationId: number) => {
      try {
        console.log(
          `📖 Marking notification ${notificationId} as read (SDK 53)...`,
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
          `✅ Notification ${notificationId} marked as read (SDK 53)`,
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
      console.log('📖 Marking all notifications as read (SDK 53)...');

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
      console.log('✅ All notifications marked as read (SDK 53)');
    } catch (err) {
      handleError(err, 'tüm bildirimleri okundu işaretleme');
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  const deleteNotification = useCallback(
    async (notificationId: number) => {
      try {
        console.log(`🗑️ Deleting notification ${notificationId} (SDK 53)...`);

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
        console.log(`✅ Notification ${notificationId} deleted (SDK 53)`);
      } catch (err) {
        handleError(err, 'bildirim silme');
      }
    },
    [notifications, handleError],
  );

  // Load preferences - Updated for SDK 53
  const loadPreferences = useCallback(async () => {
    try {
      console.log('⚙️ Loading notification preferences (SDK 53)...');

      if (isExpoGo) {
        const mockPrefs = await loadMockPreferences();
        setPreferences(mockPrefs);
        return;
      }

      const prefs = await notificationService.getPreferences();
      setPreferences(prefs);
      console.log(
        `✅ Loaded ${prefs.length} notification preferences (SDK 53)`,
      );
    } catch (err) {
      handleError(err, 'bildirim tercihlerini yükleme');
    }
  }, [handleError]);

  // Mock preferences matching your exact interface
  const loadMockPreferences = useCallback(async (): Promise<
    NotificationPreferences[]
  > => {
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
      quiet_hours_start: '22:00:00',
      quiet_hours_end: '08:00:00',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    return mockPreferences;
  }, []);

  const updatePreferences = useCallback(
    async (type: NotificationType, prefs: Partial<NotificationPreferences>) => {
      try {
        console.log(`⚙️ Updating preferences for ${type} (SDK 53)...`);

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
        console.log(`✅ Updated preferences for ${type} (SDK 53)`);
      } catch (err) {
        handleError(err, 'bildirim tercihlerini güncelleme');
      }
    },
    [handleError],
  );

  // Load stats - Updated for SDK 53
  const loadStats = useCallback(async () => {
    try {
      console.log('📊 Loading notification stats (SDK 53)...');

      if (isExpoGo) {
        // Mock stats matching your exact interface
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
      console.log('✅ Loaded notification stats (SDK 53)');
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
      console.warn('Failed to refresh unread count (SDK 53):', err);
    }
  }, [notifications]);

  // Initialize notifications and setup listeners - Updated for SDK 53
  useEffect(() => {
    const initialize = async () => {
      console.log('🚀 Initializing notifications (SDK 53)...');

      // Load stored push token
      const storedToken = await notificationService.getCurrentPushToken();
      if (storedToken) {
        setPushToken(storedToken);
        console.log('📱 Found stored push token (SDK 53)');
      }

      // Setup notification listeners if supported
      if (notificationsSupported) {
        console.log('👂 Setting up notification listeners (SDK 53)...');
        const removeListeners =
          notificationService.setupNotificationListeners();

        // Register for push notifications
        await registerForPushNotifications();

        // Cleanup listeners on unmount
        return removeListeners;
      }

      // Load initial data
      await loadNotifications(true);
      await loadPreferences();

      console.log('✅ Notification initialization complete (SDK 53)');
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
  }, []); // Empty dependency array for initialization

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
    sendLocalTestNotification,

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
