// src/hooks/useNotificationsData.ts - COMPLETE NOTIFICATIONS DATA MANAGEMENT
import {
  useQuery,
  useQueries,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getPreferences,
  updatePreferences,
  sendTestNotification,
  sendCourseTestNotification,
  getStats,
  setupPushNotifications,
  getCurrentPushToken,
  registerDeviceTokenWithValidation,
  clearDeviceTokens,
  forceTokenRefresh,
  debugRegistrationStatus,
  sendCourseStudySessionNotification,
  sendCourseCompletionNotification,
  extractCourseDataFromNotification,
  isCourseRelatedNotification,
  formatCourseNotificationBody,
  setupNotificationListeners,
  setupCourseNotificationHandling,
  isNotificationTypeEnabled,
  getNotificationIcon,
  getNotificationColor,
  getTurkishNotificationTypeName,
  formatNotificationTime,
  getNotificationPriority,
} from '../api/notificationService';
import type {
  Notification,
  NotificationResponse,
  NotificationPreferences,
  NotificationStats,
  NotificationType,
  TestNotificationRequest,
  CourseTestNotificationRequest,
  CourseStudySessionData,
  CourseCompletionData,
  CourseNotificationData,
  DeviceToken,
} from '../types/models';

// Enhanced types for notifications data
export interface NotificationListItem extends Notification {
  formattedTime: string;
  iconName: string;
  color: string;
  turkishTypeName: string;
  isCourseRelated: boolean;
  courseData?: CourseNotificationData | null;
  formattedBody: string;
  priority: 'high' | 'normal' | 'low';
}

export interface NotificationPreferenceGroup {
  category: 'study' | 'social' | 'system';
  categoryName: string;
  preferences: NotificationPreferences[];
}

export interface DeviceTokenInfo {
  token: string | null;
  isValid: boolean;
  lastUpdated: string | null;
  platformInfo: any;
}

export interface NotificationFilters {
  type?: NotificationType;
  category?: 'study' | 'social' | 'system';
  unreadOnly?: boolean;
  courseRelatedOnly?: boolean;
}

// 🚀 MAIN NOTIFICATIONS LIST HOOK
export function useNotifications(
  limit: number = 20,
  offset: number = 0,
  unreadOnly: boolean = false,
  filters?: NotificationFilters,
) {
  return useQuery({
    queryKey: ['notifications', limit, offset, unreadOnly, filters],
    queryFn: async (): Promise<{
      notifications: NotificationListItem[];
      total: number;
      hasMore: boolean;
    }> => {
      console.log('🔔 Fetching notifications...', {
        limit,
        offset,
        unreadOnly,
        filters,
      });

      try {
        const response = await getNotifications(limit, offset, unreadOnly);

        // Process notifications with enhanced data
        let processedNotifications: NotificationListItem[] =
          response.notifications.map((notification) => {
            const courseData = extractCourseDataFromNotification(notification);
            const isCourseRelated = !!courseData;

            return {
              ...notification,
              formattedTime: formatNotificationTime(notification.created_at),
              iconName: getNotificationIcon(notification.notification_type),
              color: getNotificationColor(notification.notification_type),
              turkishTypeName: getTurkishNotificationTypeName(
                notification.notification_type,
              ),
              priority: getNotificationPriority(notification.notification_type),
              isCourseRelated,
              courseData,
              formattedBody: isCourseRelated
                ? formatCourseNotificationBody(notification, 150)
                : notification.content?.substring(0, 150) || '',
            };
          });

        // Apply client-side filters if provided
        if (filters) {
          if (filters.type) {
            processedNotifications = processedNotifications.filter(
              (n) => n.notification_type === filters.type,
            );
          }
          if (filters.courseRelatedOnly) {
            processedNotifications = processedNotifications.filter(
              (n) => n.isCourseRelated,
            );
          }
          if (filters.category) {
            const categoryTypes = getNotificationTypesByCategory(
              filters.category,
            );
            processedNotifications = processedNotifications.filter((n) =>
              categoryTypes.includes(n.notification_type),
            );
          }
        }

        console.log(
          '✅ Notifications processed:',
          processedNotifications.length,
        );

        return {
          notifications: processedNotifications,
          total: response.total_count || response.notifications.length,
          hasMore: offset + limit < (response.total_count || 0),
        };
      } catch (error) {
        console.error('❌ Error fetching notifications:', error);
        throw error;
      }
    },
    staleTime: 1 * 60 * 1000, // 1 minute - notifications should be fresh
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: true, // Refetch when app comes to foreground
  });
}

// 🚀 UNREAD COUNT HOOK
export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async (): Promise<number> => {
      console.log('📊 Fetching unread notification count...');

      try {
        const response = await getUnreadCount();
        console.log('✅ Unread count fetched:', response.unread_count);
        return response.unread_count;
      } catch (error) {
        console.error('❌ Error fetching unread count:', error);
        return 0;
      }
    },
    staleTime: 30 * 1000, // 30 seconds - unread count changes frequently
    gcTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
    refetchOnWindowFocus: true,
  });
}

// 🚀 NOTIFICATION PREFERENCES HOOK
export function useNotificationPreferences() {
  return useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async (): Promise<NotificationPreferenceGroup[]> => {
      console.log('⚙️ Fetching notification preferences...');

      try {
        const preferences = await getPreferences();

        // Group preferences by category
        const grouped = groupPreferencesByCategory(preferences);

        console.log(
          '✅ Preferences fetched and grouped:',
          grouped.length,
          'categories',
        );
        return grouped;
      } catch (error) {
        console.error('❌ Error fetching preferences:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - preferences don't change often
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
}

// 🚀 DEVICE TOKEN MANAGEMENT HOOK
export function useDeviceToken() {
  return useQuery({
    queryKey: ['device-token-info'],
    queryFn: async (): Promise<DeviceTokenInfo> => {
      console.log('📱 Fetching device token info...');

      try {
        const token = await getCurrentPushToken();

        // Check if token is valid by attempting to refresh if it exists
        let isValid = false;
        let platformInfo = null;

        if (token) {
          try {
            await debugRegistrationStatus();
            isValid = true;
          } catch (error) {
            console.warn('Token validation failed:', error);
            isValid = false;
          }
        }

        const tokenInfo: DeviceTokenInfo = {
          token,
          isValid,
          lastUpdated: token ? new Date().toISOString() : null,
          platformInfo,
        };

        console.log('✅ Device token info processed:', {
          hasToken: !!token,
          isValid,
        });

        return tokenInfo;
      } catch (error) {
        console.error('❌ Error fetching device token:', error);
        return {
          token: null,
          isValid: false,
          lastUpdated: null,
          platformInfo: null,
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}

// 🚀 NOTIFICATION STATISTICS HOOK
export function useNotificationStats(days: number = 30) {
  return useQuery({
    queryKey: ['notification-stats', days],
    queryFn: async (): Promise<NotificationStats | null> => {
      console.log(`📈 Fetching notification stats for ${days} days...`);

      try {
        const stats = await getStats(days);
        console.log('✅ Notification stats fetched:', {
          total: stats.total_notifications,
          unread: stats.unread_count,
        });
        return stats;
      } catch (error) {
        console.error('❌ Error fetching notification stats:', error);
        return null;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - stats don't change often
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 1,
  });
}

// 🚀 NOTIFICATION MUTATIONS
export function useNotificationMutations() {
  const queryClient = useQueryClient();

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: number) => markAsRead(notificationId),
    onSuccess: (data, notificationId) => {
      console.log('✅ Notification marked as read:', notificationId);

      // Update cache
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({
        queryKey: ['notifications-unread-count'],
      });
    },
    onError: (error) => {
      console.error('❌ Error marking notification as read:', error);
      Alert.alert(
        'Hata',
        'Bildirim okundu olarak işaretlenirken bir hata oluştu.',
      );
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => markAllAsRead(),
    onSuccess: (data) => {
      console.log('✅ All notifications marked as read:', data.marked_count);

      // Update cache
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({
        queryKey: ['notifications-unread-count'],
      });

      Alert.alert(
        'Başarılı',
        `${data.marked_count} bildirim okundu olarak işaretlendi.`,
      );
    },
    onError: (error) => {
      console.error('❌ Error marking all notifications as read:', error);
      Alert.alert(
        'Hata',
        'Bildirimler okundu olarak işaretlenirken bir hata oluştu.',
      );
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: number) => deleteNotification(notificationId),
    onSuccess: (data, notificationId) => {
      console.log('✅ Notification deleted:', notificationId);

      // Update cache
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({
        queryKey: ['notifications-unread-count'],
      });
    },
    onError: (error) => {
      console.error('❌ Error deleting notification:', error);
      Alert.alert('Hata', 'Bildirim silinirken bir hata oluştu.');
    },
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: ({
      notificationType,
      preferences,
    }: {
      notificationType: NotificationType;
      preferences: Partial<NotificationPreferences>;
    }) => updatePreferences(notificationType, preferences),
    onSuccess: (data, variables) => {
      console.log('✅ Preferences updated:', variables.notificationType);

      // Update cache
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
    onError: (error) => {
      console.error('❌ Error updating preferences:', error);
      Alert.alert(
        'Hata',
        'Bildirim tercihleri güncellenirken bir hata oluştu.',
      );
    },
  });

  // Send test notification mutation
  const sendTestMutation = useMutation({
    mutationFn: (request: TestNotificationRequest) =>
      sendTestNotification(request),
    onSuccess: (data) => {
      console.log('✅ Test notification sent:', data.message);
      Alert.alert('Başarılı', 'Test bildirimi gönderildi!');

      // Refresh notifications
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({
        queryKey: ['notifications-unread-count'],
      });
    },
    onError: (error) => {
      console.error('❌ Error sending test notification:', error);
      Alert.alert('Hata', 'Test bildirimi gönderilemedi.');
    },
  });

  // Send course test notification mutation
  const sendCourseTestMutation = useMutation({
    mutationFn: ({
      courseId,
      courseTitle,
      courseType,
    }: {
      courseId: string | number;
      courseTitle: string;
      courseType?: 'temel_dersler' | 'klinik_dersler';
    }) => sendCourseTestNotification(courseId, courseTitle, courseType),
    onSuccess: (data) => {
      console.log('✅ Course test notification sent:', data.message);
      Alert.alert('Başarılı', 'Ders test bildirimi gönderildi!');

      // Refresh notifications
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({
        queryKey: ['notifications-unread-count'],
      });
    },
    onError: (error) => {
      console.error('❌ Error sending course test notification:', error);
      Alert.alert('Hata', 'Ders test bildirimi gönderilemedi.');
    },
  });

  return {
    markAsRead: markAsReadMutation.mutate,
    markAsReadAsync: markAsReadMutation.mutateAsync,
    isMarkingAsRead: markAsReadMutation.isPending,

    markAllAsRead: markAllAsReadMutation.mutate,
    markAllAsReadAsync: markAllAsReadMutation.mutateAsync,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,

    deleteNotification: deleteNotificationMutation.mutate,
    deleteNotificationAsync: deleteNotificationMutation.mutateAsync,
    isDeleting: deleteNotificationMutation.isPending,

    updatePreferences: updatePreferencesMutation.mutate,
    updatePreferencesAsync: updatePreferencesMutation.mutateAsync,
    isUpdatingPreferences: updatePreferencesMutation.isPending,

    sendTest: sendTestMutation.mutate,
    sendTestAsync: sendTestMutation.mutateAsync,
    isSendingTest: sendTestMutation.isPending,

    sendCourseTest: sendCourseTestMutation.mutate,
    sendCourseTestAsync: sendCourseTestMutation.mutateAsync,
    isSendingCourseTest: sendCourseTestMutation.isPending,
  };
}

// 🚀 PUSH NOTIFICATION SETUP HOOK
export function usePushNotificationSetup() {
  const queryClient = useQueryClient();

  const setupMutation = useMutation({
    mutationFn: async () => {
      console.log('🔔 Setting up push notifications...');
      const result = await setupPushNotifications();
      return result;
    },
    onSuccess: (data) => {
      console.log('✅ Push notifications setup completed:', data);

      if (data.success) {
        Alert.alert('Başarılı', 'Push bildirimleri başarıyla kuruldu!');
      } else if (data.isDevelopment) {
        Alert.alert(
          'Geliştirme Modu',
          'Expo Go kullanıyorsunuz. Push bildirimler gerçek cihazda çalışacak.',
        );
      }

      // Refresh device token info
      queryClient.invalidateQueries({ queryKey: ['device-token-info'] });
    },
    onError: (error) => {
      console.error('❌ Push notification setup failed:', error);
      Alert.alert(
        'Hata',
        'Push bildirimleri kurulamadı. Lütfen izinleri kontrol edin.',
      );
    },
  });

  const refreshTokenMutation = useMutation({
    mutationFn: async () => {
      console.log('🔄 Refreshing push token...');
      const result = await forceTokenRefresh();
      return result;
    },
    onSuccess: (data) => {
      console.log('✅ Token refresh completed:', data);

      if (data.success) {
        Alert.alert('Başarılı', 'Push token yenilendi!');
      } else {
        Alert.alert('Uyarı', data.message || 'Token yenilenemedi.');
      }

      // Refresh device token info
      queryClient.invalidateQueries({ queryKey: ['device-token-info'] });
    },
    onError: (error) => {
      console.error('❌ Token refresh failed:', error);
      Alert.alert('Hata', 'Token yenilenemedi.');
    },
  });

  const clearTokensMutation = useMutation({
    mutationFn: async () => {
      console.log('🧹 Clearing device tokens...');
      await clearDeviceTokens();
    },
    onSuccess: () => {
      console.log('✅ Device tokens cleared');
      Alert.alert('Başarılı', 'Cihaz tokenları temizlendi!');

      // Refresh device token info
      queryClient.invalidateQueries({ queryKey: ['device-token-info'] });
    },
    onError: (error) => {
      console.error('❌ Clear tokens failed:', error);
      Alert.alert('Hata', 'Tokenlar temizlenemedi.');
    },
  });

  return {
    setupPushNotifications: setupMutation.mutate,
    setupPushNotificationsAsync: setupMutation.mutateAsync,
    isSettingUp: setupMutation.isPending,

    refreshToken: refreshTokenMutation.mutate,
    refreshTokenAsync: refreshTokenMutation.mutateAsync,
    isRefreshing: refreshTokenMutation.isPending,

    clearTokens: clearTokensMutation.mutate,
    clearTokensAsync: clearTokensMutation.mutateAsync,
    isClearing: clearTokensMutation.isPending,
  };
}

// 🚀 COURSE NOTIFICATION MANAGEMENT HOOK
export function useCourseNotifications() {
  const queryClient = useQueryClient();

  const sendSessionNotificationMutation = useMutation({
    mutationFn: (sessionData: CourseStudySessionData) =>
      sendCourseStudySessionNotification(sessionData),
    onSuccess: (data) => {
      if (data) {
        console.log('✅ Course session notification sent:', data.message);
        // Refresh notifications
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({
          queryKey: ['notifications-unread-count'],
        });
      }
    },
    onError: (error) => {
      console.error('❌ Error sending course session notification:', error);
    },
  });

  const sendCompletionNotificationMutation = useMutation({
    mutationFn: (completionData: CourseCompletionData) =>
      sendCourseCompletionNotification(completionData),
    onSuccess: (data) => {
      if (data) {
        console.log('✅ Course completion notification sent:', data.message);
        // Refresh notifications
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({
          queryKey: ['notifications-unread-count'],
        });
      }
    },
    onError: (error) => {
      console.error('❌ Error sending course completion notification:', error);
    },
  });

  return {
    sendSessionNotification: sendSessionNotificationMutation.mutate,
    sendSessionNotificationAsync: sendSessionNotificationMutation.mutateAsync,
    isSendingSession: sendSessionNotificationMutation.isPending,

    sendCompletionNotification: sendCompletionNotificationMutation.mutate,
    sendCompletionNotificationAsync:
      sendCompletionNotificationMutation.mutateAsync,
    isSendingCompletion: sendCompletionNotificationMutation.isPending,
  };
}

// 🚀 REAL-TIME NOTIFICATION LISTENER HOOK
export function useNotificationListener() {
  const queryClient = useQueryClient();
  const [isListening, setIsListening] = useState(false);

  const startListening = useCallback(async () => {
    try {
      console.log('👂 Starting notification listeners...');

      const cleanup = setupNotificationListeners();
      const courseCleanup = await setupCourseNotificationHandling();

      setIsListening(true);

      // Return combined cleanup function
      return () => {
        cleanup();
        courseCleanup();
        setIsListening(false);
        console.log('🧹 Notification listeners cleaned up');
      };
    } catch (error) {
      console.error('❌ Error starting notification listeners:', error);
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    setIsListening(false);
    console.log('🛑 Notification listeners stopped');
  }, []);

  // Setup automatic refresh when notifications are received
  useEffect(() => {
    if (isListening) {
      // This would be connected to actual notification events
      // For now, we'll just set up periodic refresh
      const interval = setInterval(() => {
        queryClient.invalidateQueries({
          queryKey: ['notifications-unread-count'],
        });
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }
  }, [isListening, queryClient]);

  return {
    isListening,
    startListening,
    stopListening,
  };
}

// 🚀 COMBINED NOTIFICATIONS DATA HOOK (Main hook for notification screens)
export function useNotificationsData(
  limit: number = 20,
  includePreferences: boolean = true,
  includeStats: boolean = false,
) {
  const notificationsQuery = useNotifications(limit, 0, false);
  const unreadCountQuery = useUnreadCount();
  const preferencesQuery = useNotificationPreferences();
  const statsQuery = useNotificationStats(30);
  const deviceTokenQuery = useDeviceToken();
  const mutations = useNotificationMutations();
  const pushSetup = usePushNotificationSetup();
  const courseNotifications = useCourseNotifications();
  const listener = useNotificationListener();

  return {
    // Notification data
    notifications: notificationsQuery.data?.notifications || [],
    hasMore: notificationsQuery.data?.hasMore || false,
    total: notificationsQuery.data?.total || 0,
    notificationsLoading: notificationsQuery.isLoading,
    notificationsError: notificationsQuery.error,
    refetchNotifications: notificationsQuery.refetch,

    // Unread count
    unreadCount: unreadCountQuery.data || 0,
    unreadCountLoading: unreadCountQuery.isLoading,
    unreadCountError: unreadCountQuery.error,

    // Preferences (optional)
    preferences: includePreferences ? preferencesQuery.data || [] : [],
    preferencesLoading: includePreferences ? preferencesQuery.isLoading : false,
    preferencesError: includePreferences ? preferencesQuery.error : null,

    // Stats (optional)
    stats: includeStats ? statsQuery.data : null,
    statsLoading: includeStats ? statsQuery.isLoading : false,
    statsError: includeStats ? statsQuery.error : null,

    // Device token
    deviceToken: deviceTokenQuery.data,
    deviceTokenLoading: deviceTokenQuery.isLoading,
    deviceTokenError: deviceTokenQuery.error,

    // Mutations
    ...mutations,

    // Push setup
    ...pushSetup,

    // Course notifications
    ...courseNotifications,

    // Real-time listener
    ...listener,

    // Overall state
    isLoading: notificationsQuery.isLoading || unreadCountQuery.isLoading,
    hasError: !!(notificationsQuery.error || unreadCountQuery.error),

    // Refetch all data
    refetchAll: async () => {
      await Promise.all([
        notificationsQuery.refetch(),
        unreadCountQuery.refetch(),
        includePreferences ? preferencesQuery.refetch() : Promise.resolve(),
        includeStats ? statsQuery.refetch() : Promise.resolve(),
        deviceTokenQuery.refetch(),
      ]);
    },
  };
}

// 🚀 HOOK FOR NOTIFICATION SETTINGS SCREEN
export function useNotificationSettingsData() {
  const preferencesQuery = useNotificationPreferences();
  const deviceTokenQuery = useDeviceToken();
  const mutations = useNotificationMutations();
  const pushSetup = usePushNotificationSetup();

  return {
    // Preferences
    preferenceGroups: preferencesQuery.data || [],
    preferencesLoading: preferencesQuery.isLoading,
    preferencesError: preferencesQuery.error,

    // Device token
    deviceToken: deviceTokenQuery.data,
    deviceTokenLoading: deviceTokenQuery.isLoading,

    // Actions
    updatePreferences: mutations.updatePreferences,
    updatePreferencesAsync: mutations.updatePreferencesAsync,
    isUpdatingPreferences: mutations.isUpdatingPreferences,

    sendTest: mutations.sendTest,
    sendCourseTest: mutations.sendCourseTest,
    isSendingTest: mutations.isSendingTest || mutations.isSendingCourseTest,

    setupPushNotifications: pushSetup.setupPushNotifications,
    refreshToken: pushSetup.refreshToken,
    clearTokens: pushSetup.clearTokens,
    isSettingUp:
      pushSetup.isSettingUp || pushSetup.isRefreshing || pushSetup.isClearing,

    // Overall state
    isLoading: preferencesQuery.isLoading || deviceTokenQuery.isLoading,
    hasError: !!(preferencesQuery.error || deviceTokenQuery.error),

    // Refetch all
    refetchAll: async () => {
      await Promise.all([
        preferencesQuery.refetch(),
        deviceTokenQuery.refetch(),
      ]);
    },
  };
}

// 🚀 HOOK FOR NOTIFICATION LIST SCREEN
export function useNotificationListData(
  limit: number = 20,
  filters?: NotificationFilters,
) {
  const [offset, setOffset] = useState(0);
  const [allNotifications, setAllNotifications] = useState<
    NotificationListItem[]
  >([]);

  const notificationsQuery = useNotifications(
    limit,
    offset,
    filters?.unreadOnly || false,
    filters,
  );
  const unreadCountQuery = useUnreadCount();
  const mutations = useNotificationMutations();

  // Load more functionality
  const loadMore = useCallback(() => {
    if (notificationsQuery.data?.hasMore && !notificationsQuery.isLoading) {
      setOffset((prev) => prev + limit);
    }
  }, [notificationsQuery.data?.hasMore, notificationsQuery.isLoading, limit]);

  // Reset when filters change
  const resetList = useCallback(() => {
    setOffset(0);
    setAllNotifications([]);
  }, []);

  // Update accumulated notifications
  useEffect(() => {
    if (notificationsQuery.data?.notifications) {
      if (offset === 0) {
        // First load or reset
        setAllNotifications(notificationsQuery.data.notifications);
      } else {
        // Load more
        setAllNotifications((prev) => [
          ...prev,
          ...notificationsQuery.data!.notifications,
        ]);
      }
    }
  }, [notificationsQuery.data, offset]);

  return {
    // Notification data
    notifications: allNotifications,
    hasMore: notificationsQuery.data?.hasMore || false,
    total: notificationsQuery.data?.total || 0,
    loading: notificationsQuery.isLoading,
    error: notificationsQuery.error,

    // Unread count
    unreadCount: unreadCountQuery.data || 0,

    // Actions
    loadMore,
    resetList,
    markAsRead: mutations.markAsRead,
    markAllAsRead: mutations.markAllAsRead,
    deleteNotification: mutations.deleteNotification,

    // Loading states
    isMarkingAsRead: mutations.isMarkingAsRead,
    isMarkingAllAsRead: mutations.isMarkingAllAsRead,
    isDeleting: mutations.isDeleting,

    // Refresh
    refresh: notificationsQuery.refetch,
  };
}

// 🚀 HELPER FUNCTIONS
function getNotificationTypesByCategory(
  category: 'study' | 'social' | 'system',
): NotificationType[] {
  const categoryMap: Record<string, NotificationType[]> = {
    study: [
      'study_reminder',
      'streak_reminder',
      'plan_reminder',
      'coaching_note',
      'course_reminder',
      'course_completed',
      'course_progress',
      'course_milestone',
      'course_study_session',
    ],
    social: [
      'duel_invitation',
      'duel_result',
      'friend_request',
      'friend_activity',
    ],
    system: [
      'achievement_unlock',
      'content_update',
      'motivational_message',
      'system_announcement',
    ],
  };

  return categoryMap[category] || [];
}

function groupPreferencesByCategory(
  preferences: NotificationPreferences[],
): NotificationPreferenceGroup[] {
  const groups: NotificationPreferenceGroup[] = [
    {
      category: 'study',
      categoryName: 'Çalışma',
      preferences: [],
    },
    {
      category: 'social',
      categoryName: 'Sosyal',
      preferences: [],
    },
    {
      category: 'system',
      categoryName: 'Sistem',
      preferences: [],
    },
  ];

  preferences.forEach((pref) => {
    const studyTypes = getNotificationTypesByCategory('study');
    const socialTypes = getNotificationTypesByCategory('social');
    const systemTypes = getNotificationTypesByCategory('system');

    if (studyTypes.includes(pref.notification_type)) {
      groups[0].preferences.push(pref);
    } else if (socialTypes.includes(pref.notification_type)) {
      groups[1].preferences.push(pref);
    } else if (systemTypes.includes(pref.notification_type)) {
      groups[2].preferences.push(pref);
    }
  });

  return groups;
}

// 🚀 UTILITY FUNCTIONS FOR NOTIFICATION MANAGEMENT
export const notificationHelpers = {
  getNotificationTypesByCategory,
  groupPreferencesByCategory,

  // Format notification for display
  formatNotificationForDisplay: (notification: NotificationListItem) => {
    return {
      id: notification.notification_id,
      title: notification.title,
      body: notification.formattedBody,
      time: notification.formattedTime,
      isRead: notification.is_read,
      icon: notification.iconName,
      color: notification.color,
      type: notification.turkishTypeName,
      priority: notification.priority,
      isCourseRelated: notification.isCourseRelated,
      courseData: notification.courseData,
    };
  },

  // Get notification category color
  getCategoryColor: (category: 'study' | 'social' | 'system') => {
    const colors = {
      study: '#3B82F6',
      social: '#8B5CF6',
      system: '#F59E0B',
    };
    return colors[category];
  },

  // Check if notification type is enabled
  isTypeEnabled: (
    preferences: NotificationPreferences[],
    type: NotificationType,
    channel: 'in_app' | 'push' | 'email' = 'in_app',
  ) => {
    return isNotificationTypeEnabled(preferences, type, channel);
  },

  // Get frequency display text
  getFrequencyText: (hours: number) => {
    if (hours === 1) return 'Saatte bir';
    if (hours === 24) return 'Günde bir';
    if (hours === 168) return 'Haftada bir';
    return `${hours} saatte bir`;
  },

  // Create test notification request
  createTestRequest: (
    type: NotificationType = 'system_announcement',
  ): TestNotificationRequest => {
    return {
      template_name: 'test_notification',
      notification_type: type,
      variables: {
        message: 'Bu bir test bildirimidir! 🎉',
        title: 'Test Bildirimi',
      },
    };
  },

  // Create course test notification request
  createCourseTestRequest: (
    courseId: string | number,
    courseTitle: string,
    courseType: 'temel_dersler' | 'klinik_dersler' = 'klinik_dersler',
  ): CourseTestNotificationRequest => {
    return {
      template_name: 'course_study_reminder',
      notification_type: 'course_reminder',
      course_id: courseId.toString(),
      course_title: courseTitle,
      course_type: courseType,
      variables: {
        course_id: courseId.toString(),
        course_title: courseTitle,
        course_type: courseType,
        message: `${courseTitle} dersi için çalışma zamanı!`,
      },
    };
  },
};

// 🚀 REAL-TIME NOTIFICATION HOOK FOR APP-WIDE USE
export function useGlobalNotificationListener() {
  const queryClient = useQueryClient();
  const listener = useNotificationListener();

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const setupListener = async () => {
      cleanup = await listener.startListening();
    };

    setupListener();

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

  // Auto-refresh unread count periodically
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({
        queryKey: ['notifications-unread-count'],
      });
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [queryClient]);

  return {
    isListening: listener.isListening,
  };
}
