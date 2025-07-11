import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Notification,
  NotificationPreferences,
  NotificationStats,
  NotificationType,
} from '../src/types/models';
import * as notificationService from '../src/api/notificationService';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface NotificationContextType {
  // State
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences[];
  stats: NotificationStats | null;
  isLoading: boolean;
  error: string | null;

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

  // Error handling
  const handleError = useCallback((err: any, action: string) => {
    console.error(`Notification ${action} error:`, err);
    setError(err?.message || `${action} başarısız oldu`);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load notifications
  const loadNotifications = useCallback(
    async (refresh: boolean = false) => {
      try {
        setIsLoading(true);
        clearError();

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

  // Load more notifications (pagination)
  const loadMoreNotifications = useCallback(async () => {
    if (!hasMore || isLoading) return;
    await loadNotifications(false);
  }, [hasMore, isLoading, loadNotifications]);

  // Mark notification as read
  const markAsRead = useCallback(
    async (notificationId: number) => {
      try {
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

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      setIsLoading(true);
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

  // Delete notification
  const deleteNotification = useCallback(
    async (notificationId: number) => {
      try {
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

  // Load preferences
  const loadPreferences = useCallback(async () => {
    try {
      const prefs = await notificationService.getPreferences();
      setPreferences(prefs);
    } catch (err) {
      handleError(err, 'bildirim tercihlerini yükleme');
    }
  }, [handleError]);

  // Update preferences
  const updatePreferences = useCallback(
    async (type: NotificationType, prefs: Partial<NotificationPreferences>) => {
      try {
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

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const statsData = await notificationService.getStats();
      setStats(statsData);
    } catch (err) {
      handleError(err, 'bildirim istatistiklerini yükleme');
    }
  }, [handleError]);

  // Refresh unread count
  const refreshUnreadCount = useCallback(async () => {
    try {
      const { unread_count } = await notificationService.getUnreadCount();
      setUnreadCount(unread_count);
    } catch (err) {
      console.warn('Failed to refresh unread count:', err);
    }
  }, []);

  // Register for push notifications
  const registerForPushNotifications = useCallback(async () => {
    try {
      if (!Device.isDevice) {
        console.warn('Push notifications require a physical device');
        return;
      }

      // Check if already registered
      const storedToken = await AsyncStorage.getItem('pushToken');
      if (storedToken) {
        console.log('Push token already exists:', storedToken);
        return;
      }

      // Request permissions
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Push notification permissions not granted');
        return;
      }

      // Get push token
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Push token obtained:', token);

      // Register with backend
      const platform = Platform.OS as 'ios' | 'android';
      await notificationService.registerDeviceToken(token, platform);

      // Store token locally
      await AsyncStorage.setItem('pushToken', token);

      console.log('Push notifications registered successfully');
    } catch (err) {
      console.error('Failed to register for push notifications:', err);
    }
  }, []);

  // Set up notification listeners
  useEffect(() => {
    let isMounted = true;

    // Listen for notifications received while app is running
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        if (isMounted) {
          refreshUnreadCount();
        }
      },
    );

    // Listen for notification responses (when user taps notification)
    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('Notification response:', response);
        if (isMounted) {
          // Handle notification tap - you can navigate to specific screens here
          const data = response.notification.request.content.data;
          if (data?.notification_id) {
            markAsRead(Number(data.notification_id));
          }
        }
      });

    return () => {
      isMounted = false;
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, [refreshUnreadCount, markAsRead]);

  // Initialize
  useEffect(() => {
    const initialize = async () => {
      await loadNotifications(true);
      await loadPreferences();
      await registerForPushNotifications();
    };

    initialize();
  }, []); // Only run on mount

  const value: NotificationContextType = {
    // State
    notifications,
    unreadCount,
    preferences,
    stats,
    isLoading,
    error,

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
