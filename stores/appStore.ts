// stores/appStore.ts - ENHANCED WITH AUTHSERVICE INTEGRATION
import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🚀 UPDATED: Import existing authService instead of duplicating logic
import * as authService from '../src/api/authService';
import * as notificationService from '../src/api/notificationService';
import * as studyService from '../src/api/studyService';

import {
  User,
  Notification,
  PreferredCourse,
  CourseCategory,
  NotificationPreferences,
  NotificationType,
  DeviceToken,
  NotificationStats,
} from '../src/types/models';

// 🚀 FIX: Define notification filters type separately
type NotificationFilters = {
  category?: 'study' | 'social' | 'system';
  unreadOnly: boolean;
  courseRelatedOnly: boolean;
};

interface AppState {
  // ===== AUTH STATE (replaces AuthContext) =====
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;

  // 🚀 NEW: OAuth loading states
  isOAuthLoading: boolean;
  oauthProvider: 'google' | 'apple' | 'facebook' | null;

  // ===== COURSE STATE (replaces PreferredCourseContext) =====
  preferredCourse: PreferredCourse | null;
  availableCourses: PreferredCourse[];
  coursesLoading: boolean;

  // ===== ENHANCED NOTIFICATION STATE =====
  notifications: Notification[];
  unreadCount: number;
  notificationPreferences: NotificationPreferences[];
  notificationsLoading: boolean;

  // 🚀 NEW: Enhanced notification state
  deviceToken: DeviceToken | null;
  notificationStats: NotificationStats | null;
  pushNotificationsEnabled: boolean;
  lastNotificationSync: string | null;
  notificationFilters: NotificationFilters;

  // ===== THEME STATE (replaces ThemeContext) =====
  theme: 'light' | 'dark';

  // ===== NETWORK STATE (replaces NetworkProvider) =====
  isOnline: boolean;

  // ===== UI STATE =====
  showCourseModal: boolean;
  selectedCourseId: number | null;
  showNotificationSettings: boolean;
  notificationListOffset: number;
}

interface AppActions {
  // ===== AUTH ACTIONS (using authService) =====
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
  ) => Promise<void>;

  // 🚀 NEW: OAuth actions using existing authService
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  handleOAuthCallback: (code: string) => Promise<void>;

  // Session management
  refreshSession: () => Promise<boolean>;
  checkSession: () => Promise<boolean>;
  validateSession: () => Promise<{ isValid: boolean; message?: string }>;

  // State setters
  setUser: (user: User | null) => void;
  setAuthError: (error: string | null) => void;
  setAuthLoading: (loading: boolean) => void;
  initializeApp: () => Promise<void>;

  // ===== COURSE ACTIONS =====
  setPreferredCourse: (course: PreferredCourse) => Promise<void>;
  loadAvailableCourses: () => Promise<void>;
  selectCourse: (courseId: number) => void;

  // ===== ENHANCED NOTIFICATION ACTIONS =====
  loadNotifications: () => Promise<void>;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  setNotifications: (notifications: Notification[]) => void;
  setUnreadCount: (count: number) => void;
  addNotification: (notification: Notification) => void;
  removeNotification: (notificationId: number) => void;
  updateNotificationPreferences: (
    preferences: NotificationPreferences[],
  ) => void;
  setDeviceToken: (token: DeviceToken | null) => void;
  setNotificationStats: (stats: NotificationStats | null) => void;
  setPushNotificationsEnabled: (enabled: boolean) => void;
  updateLastNotificationSync: () => void;
  setNotificationFilters: (filters: Partial<NotificationFilters>) => void;
  resetNotificationFilters: () => void;
  isNotificationTypeEnabled: (
    type: NotificationType,
    channel?: 'in_app' | 'push' | 'email',
  ) => boolean;
  getNotificationPreference: (
    type: NotificationType,
  ) => NotificationPreferences | null;
  markMultipleAsRead: (notificationIds: number[]) => Promise<void>;
  deleteMultipleNotifications: (notificationIds: number[]) => Promise<void>;

  // ===== THEME ACTIONS =====
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;

  // ===== NETWORK ACTIONS =====
  setNetworkStatus: (isOnline: boolean) => void;

  // ===== UI ACTIONS =====
  setShowCourseModal: (show: boolean) => void;
  setShowNotificationSettings: (show: boolean) => void;
  setNotificationListOffset: (offset: number) => void;
  resetNotificationListOffset: () => void;

  // ===== COMPUTED VALUES =====
  getCourseColor: (category?: CourseCategory) => string;
  getCourseCategory: (title: string) => CourseCategory | undefined;
  getUnreadNotificationsByCategory: (
    category: 'study' | 'social' | 'system',
  ) => Notification[];
  getNotificationsByType: (type: NotificationType) => Notification[];
  getCourseRelatedNotifications: () => Notification[];
  getHighPriorityNotifications: () => Notification[];
  canReceiveNotifications: () => boolean;
}

type AppStore = AppState & AppActions;

// 🎨 COURSE COLORS (from your original context)
const CATEGORY_COLORS: Record<CourseCategory, string> = {
  radyoloji: '#FF7675',
  restoratif: '#4285F4',
  endodonti: '#FFD93D',
  pedodonti: '#FF6B9D',
  protetik: '#21b958',
  peridontoloji: '#800000',
  cerrahi: '#ec1c24',
  ortodonti: '#702963',
};

// 🚀 NOTIFICATION TYPE CATEGORIZATION
const NOTIFICATION_TYPE_CATEGORIES = {
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
  ] as NotificationType[],
  social: [
    'duel_invitation',
    'duel_result',
    'friend_request',
    'friend_activity',
  ] as NotificationType[],
  system: [
    'achievement_unlock',
    'content_update',
    'motivational_message',
    'system_announcement',
  ] as NotificationType[],
};

// ===== MAIN STORE =====
export const useAppStore = create<AppStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // ===== INITIAL STATE =====
        user: null,
        isAuthenticated: false,
        isLoading: false,
        authError: null,
        isOAuthLoading: false,
        oauthProvider: null,
        preferredCourse: null,
        availableCourses: [],
        coursesLoading: false,
        notifications: [],
        unreadCount: 0,
        notificationPreferences: [],
        notificationsLoading: false,
        deviceToken: null,
        notificationStats: null,
        pushNotificationsEnabled: false,
        lastNotificationSync: null,
        notificationFilters: {
          unreadOnly: false,
          courseRelatedOnly: false,
        },
        theme: 'light',
        isOnline: true,
        showCourseModal: false,
        selectedCourseId: null,
        showNotificationSettings: false,
        notificationListOffset: 0,

        // ===== AUTH ACTIONS (using authService) =====
        signIn: async (email: string, password: string) => {
          try {
            set({ isLoading: true, authError: null });

            // 🚀 UPDATED: Use existing authService.login
            const response = await authService.login(email, password);

            set({
              user: response.user,
              isAuthenticated: true,
              isLoading: false,
              authError: null,
            });

            // Auto-load user data after login (non-blocking)
            Promise.allSettled([
              get().loadNotifications(),
              get().loadAvailableCourses(),
            ]).catch((error) => {
              console.warn('Failed to load initial data after login:', error);
            });

            console.log('✅ Login successful via authService');
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Login failed';
            console.error('❌ Login error:', errorMessage);
            set({
              authError: errorMessage,
              isLoading: false,
              user: null,
              isAuthenticated: false,
            });
            throw error;
          }
        },

        signOut: async () => {
          try {
            set({ isLoading: true });

            // 🚀 UPDATED: Use existing authService.logout
            await authService.logout();

            console.log('✅ Logout successful via authService');
          } catch (error) {
            console.warn('⚠️ Logout error:', error);
          } finally {
            // Always clear local state
            set({
              user: null,
              isAuthenticated: false,
              preferredCourse: null,
              notifications: [],
              unreadCount: 0,
              notificationPreferences: [],
              deviceToken: null,
              notificationStats: null,
              authError: null,
              lastNotificationSync: null,
              isLoading: false,
              isOAuthLoading: false,
              oauthProvider: null,
            });
          }
        },

        register: async (username: string, email: string, password: string) => {
          try {
            set({ isLoading: true, authError: null });

            // 🚀 UPDATED: Use existing authService.register
            const response = await authService.register(
              username,
              email,
              password,
            );

            set({
              user: response.user,
              isAuthenticated: true,
              isLoading: false,
              authError: null,
            });

            // Auto-load user data after registration (non-blocking)
            Promise.allSettled([
              get().loadNotifications(),
              get().loadAvailableCourses(),
            ]).catch((error) => {
              console.warn(
                'Failed to load initial data after registration:',
                error,
              );
            });

            console.log('✅ Registration successful via authService');
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Registration failed';
            console.error('❌ Registration error:', errorMessage);
            set({
              authError: errorMessage,
              isLoading: false,
              user: null,
              isAuthenticated: false,
            });
            throw error;
          }
        },

        // 🚀 NEW: OAuth actions using existing authService
        signInWithGoogle: async () => {
          try {
            set({
              isOAuthLoading: true,
              oauthProvider: 'google',
              authError: null,
            });

            // 🚀 UPDATED: Use existing authService OAuth
            await authService.signInWithGoogle();

            // Note: OAuth completion is handled via deep link callback
            console.log('🔐 Google OAuth flow initiated via authService');
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Google sign-in failed';
            console.error('❌ Google OAuth error:', errorMessage);

            // Only set error if it's not a user cancellation
            if (!errorMessage.includes('cancelled')) {
              set({ authError: errorMessage });
            }

            set({ isOAuthLoading: false, oauthProvider: null });
            throw error;
          }
        },

        signInWithApple: async () => {
          try {
            set({
              isOAuthLoading: true,
              oauthProvider: 'apple',
              authError: null,
            });

            await authService.signInWithApple();

            console.log('🍎 Apple OAuth flow initiated via authService');
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Apple sign-in failed';
            console.error('❌ Apple OAuth error:', errorMessage);

            if (!errorMessage.includes('cancelled')) {
              set({ authError: errorMessage });
            }

            set({ isOAuthLoading: false, oauthProvider: null });
            throw error;
          }
        },

        signInWithFacebook: async () => {
          try {
            set({
              isOAuthLoading: true,
              oauthProvider: 'facebook',
              authError: null,
            });

            await authService.signInWithFacebook();

            console.log('👥 Facebook OAuth flow initiated via authService');
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : 'Facebook sign-in failed';
            console.error('❌ Facebook OAuth error:', errorMessage);

            if (!errorMessage.includes('cancelled')) {
              set({ authError: errorMessage });
            }

            set({ isOAuthLoading: false, oauthProvider: null });
            throw error;
          }
        },

        handleOAuthCallback: async (code: string) => {
          try {
            set({ isLoading: true, authError: null });

            // 🚀 UPDATED: Use existing authService OAuth callback
            const response = await authService.handleOAuthCallback(code);

            set({
              user: response.user,
              isAuthenticated: true,
              isLoading: false,
              isOAuthLoading: false,
              oauthProvider: null,
              authError: null,
            });

            // Auto-load user data after OAuth success
            Promise.allSettled([
              get().loadNotifications(),
              get().loadAvailableCourses(),
            ]).catch((error) => {
              console.warn('Failed to load initial data after OAuth:', error);
            });

            console.log('✅ OAuth callback successful via authService');
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'OAuth callback failed';
            console.error('❌ OAuth callback error:', errorMessage);
            set({
              authError: errorMessage,
              isLoading: false,
              isOAuthLoading: false,
              oauthProvider: null,
              user: null,
              isAuthenticated: false,
            });
            throw error;
          }
        },

        refreshSession: async () => {
          try {
            // 🚀 UPDATED: Use existing authService session refresh
            const { user, token } = await authService.getAuthStatus();

            if (user && token) {
              const isValid = await authService.isTokenValid();

              if (isValid) {
                set({ user, isAuthenticated: true, authError: null });
                return true;
              } else {
                // Try to refresh token
                try {
                  await authService.refreshAuthToken();
                  const refreshedAuth = await authService.getAuthStatus();
                  set({
                    user: refreshedAuth.user,
                    isAuthenticated: !!refreshedAuth.user,
                    authError: null,
                  });
                  return !!refreshedAuth.user;
                } catch (refreshError) {
                  console.warn('Token refresh failed:', refreshError);
                  set({ user: null, isAuthenticated: false });
                  return false;
                }
              }
            }

            set({ user: null, isAuthenticated: false });
            return false;
          } catch (error) {
            console.error('Session refresh error:', error);
            set({ user: null, isAuthenticated: false });
            return false;
          }
        },

        checkSession: async () => {
          try {
            // 🚀 UPDATED: Use existing authService session check
            return await authService.checkAndRefreshSession();
          } catch (error) {
            console.error('Session check error:', error);
            return false;
          }
        },

        validateSession: async () => {
          try {
            // 🚀 UPDATED: Use existing authService session validation
            return await authService.validateSession();
          } catch (error) {
            console.error('Session validation error:', error);
            return { isValid: false, message: 'Session validation failed' };
          }
        },

        setUser: (user: User | null) => {
          set({
            user,
            isAuthenticated: !!user,
            authError: null,
          });
        },

        setAuthError: (authError: string | null) => set({ authError }),

        setAuthLoading: (isLoading: boolean) => set({ isLoading }),

        // ===== INITIALIZATION =====
        initializeApp: async () => {
          try {
            set({ isLoading: true });
            console.log('🚀 Initializing app...');

            // 🚀 UPDATED: Use authService for session restoration
            const sessionRestored = await get().refreshSession();

            if (sessionRestored) {
              // Check for stored preferred course
              try {
                const storedCourse =
                  await AsyncStorage.getItem('selectedCourse');
                if (storedCourse) {
                  const course = JSON.parse(storedCourse) as PreferredCourse;
                  console.log(
                    '📱 Restored preferred course from storage:',
                    course.title,
                  );
                  set({ preferredCourse: course });
                }
              } catch (error) {
                console.warn('⚠️ Failed to restore preferred course:', error);
              }

              // Check for stored notification preferences
              try {
                const storedPrefs = await AsyncStorage.getItem(
                  'notificationPreferences',
                );
                if (storedPrefs) {
                  const preferences = JSON.parse(
                    storedPrefs,
                  ) as NotificationPreferences[];
                  console.log(
                    '📱 Restored notification preferences from storage',
                  );
                  set({ notificationPreferences: preferences });
                }
              } catch (error) {
                console.warn(
                  '⚠️ Failed to restore notification preferences:',
                  error,
                );
              }

              // 🚀 REMOVED: Don't load data during initialization
              // Data will be loaded when screens that need it are accessed
              console.log('📱 User authenticated, data will load when needed');
            } else {
              console.log('📱 No valid session found');
            }

            console.log('✅ App initialization complete');
          } catch (error) {
            console.error('❌ App initialization failed:', error);
          } finally {
            set({ isLoading: false });
          }
        },

        // ===== COURSE ACTIONS =====
        setPreferredCourse: async (course: PreferredCourse) => {
          try {
            if (!course || !course.course_id || !course.title) {
              throw new Error('Invalid course data');
            }

            try {
              await studyService.setUserPreferredCourse(course.course_id);
              console.log('✅ Preferred course saved to API');
            } catch (apiError) {
              console.warn(
                '⚠️ API save failed, continuing with local:',
                apiError,
              );
            }

            const courseWithCategory = {
              ...course,
              category: get().getCourseCategory(course.title),
              selectedAt: new Date().toISOString(),
            };

            set({ preferredCourse: courseWithCategory });

            await AsyncStorage.setItem(
              'selectedCourse',
              JSON.stringify(courseWithCategory),
            );
            console.log('✅ Preferred course saved locally');
          } catch (error) {
            console.error('❌ Failed to set preferred course:', error);
            throw error;
          }
        },

        loadAvailableCourses: async () => {
          try {
            set({ coursesLoading: true });
            const courses = await studyService.getAllCourses('klinik_dersler');
            set({ availableCourses: courses, coursesLoading: false });
          } catch (error) {
            console.error('Failed to load courses:', error);
            set({ coursesLoading: false });
          }
        },

        selectCourse: (courseId: number) => {
          set({ selectedCourseId: courseId });
        },

        // ===== NOTIFICATION ACTIONS (keeping existing implementation) =====
        loadNotifications: async () => {
          try {
            set({ notificationsLoading: true });

            const response = await notificationService.getNotifications(20, 0);

            set({
              notifications: response.notifications,
              unreadCount: response.unread_count,
              notificationsLoading: false,
              lastNotificationSync: new Date().toISOString(),
            });

            console.log(
              '✅ Notifications loaded:',
              response.notifications.length,
            );
          } catch (error) {
            console.error('Failed to load notifications:', error);
            set({ notificationsLoading: false });
          }
        },

        markAsRead: async (notificationId: number) => {
          try {
            set((state) => ({
              notifications: state.notifications.map((n) =>
                n.notification_id === notificationId
                  ? { ...n, is_read: true, read_at: new Date().toISOString() }
                  : n,
              ),
              unreadCount: Math.max(0, state.unreadCount - 1),
            }));

            await notificationService.markAsRead(notificationId);
            console.log('✅ Notification marked as read:', notificationId);
          } catch (error) {
            console.error('Failed to mark as read:', error);
            get().loadNotifications();
          }
        },

        markAllAsRead: async () => {
          try {
            set((state) => ({
              notifications: state.notifications.map((n) => ({
                ...n,
                is_read: true,
                read_at: n.read_at || new Date().toISOString(),
              })),
              unreadCount: 0,
            }));

            await notificationService.markAllAsRead();
            console.log('✅ All notifications marked as read');
          } catch (error) {
            console.error('Failed to mark all as read:', error);
            get().loadNotifications();
          }
        },

        setNotifications: (notifications: Notification[]) => {
          set({
            notifications,
            lastNotificationSync: new Date().toISOString(),
          });
        },

        setUnreadCount: (unreadCount: number) => {
          set({ unreadCount });
        },

        addNotification: (notification: Notification) => {
          set((state) => ({
            notifications: [notification, ...state.notifications],
            unreadCount: notification.is_read
              ? state.unreadCount
              : state.unreadCount + 1,
          }));
        },

        removeNotification: (notificationId: number) => {
          set((state) => {
            const notification = state.notifications.find(
              (n) => n.notification_id === notificationId,
            );
            const wasUnread = notification && !notification.is_read;

            return {
              notifications: state.notifications.filter(
                (n) => n.notification_id !== notificationId,
              ),
              unreadCount: wasUnread
                ? Math.max(0, state.unreadCount - 1)
                : state.unreadCount,
            };
          });
        },

        updateNotificationPreferences: (
          preferences: NotificationPreferences[],
        ) => {
          set({ notificationPreferences: preferences });
          AsyncStorage.setItem(
            'notificationPreferences',
            JSON.stringify(preferences),
          ).catch((error) =>
            console.warn('Failed to save notification preferences:', error),
          );
        },

        setDeviceToken: (deviceToken: DeviceToken | null) => {
          set({ deviceToken });
        },

        setNotificationStats: (notificationStats: NotificationStats | null) => {
          set({ notificationStats });
        },

        setPushNotificationsEnabled: (pushNotificationsEnabled: boolean) => {
          set({ pushNotificationsEnabled });
        },

        updateLastNotificationSync: () => {
          set({ lastNotificationSync: new Date().toISOString() });
        },

        setNotificationFilters: (filters) => {
          set((state) => ({
            notificationFilters: { ...state.notificationFilters, ...filters },
          }));
        },

        resetNotificationFilters: () => {
          set({
            notificationFilters: {
              unreadOnly: false,
              courseRelatedOnly: false,
            },
          });
        },

        isNotificationTypeEnabled: (
          type: NotificationType,
          channel = 'in_app',
        ) => {
          const preferences = get().notificationPreferences;
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
        },

        getNotificationPreference: (type: NotificationType) => {
          const preferences = get().notificationPreferences;
          return preferences.find((p) => p.notification_type === type) || null;
        },

        markMultipleAsRead: async (notificationIds: number[]) => {
          try {
            set((state) => ({
              notifications: state.notifications.map((n) =>
                notificationIds.includes(n.notification_id)
                  ? { ...n, is_read: true, read_at: new Date().toISOString() }
                  : n,
              ),
              unreadCount: Math.max(
                0,
                state.unreadCount - notificationIds.length,
              ),
            }));

            await Promise.all(
              notificationIds.map((id) => notificationService.markAsRead(id)),
            );
            console.log(
              '✅ Multiple notifications marked as read:',
              notificationIds.length,
            );
          } catch (error) {
            console.error('Failed to mark multiple as read:', error);
            get().loadNotifications();
          }
        },

        deleteMultipleNotifications: async (notificationIds: number[]) => {
          try {
            const currentNotifications = get().notifications;
            const deletedUnreadCount = currentNotifications.filter(
              (n) => notificationIds.includes(n.notification_id) && !n.is_read,
            ).length;

            set((state) => ({
              notifications: state.notifications.filter(
                (n) => !notificationIds.includes(n.notification_id),
              ),
              unreadCount: Math.max(0, state.unreadCount - deletedUnreadCount),
            }));

            await Promise.all(
              notificationIds.map((id) =>
                notificationService.deleteNotification(id),
              ),
            );
            console.log(
              '✅ Multiple notifications deleted:',
              notificationIds.length,
            );
          } catch (error) {
            console.error('Failed to delete multiple notifications:', error);
            get().loadNotifications();
          }
        },

        // ===== THEME ACTIONS =====
        setTheme: (theme: 'light' | 'dark') => set({ theme }),

        toggleTheme: () => {
          const currentTheme = get().theme;
          set({ theme: currentTheme === 'light' ? 'dark' : 'light' });
        },

        // ===== NETWORK ACTIONS =====
        setNetworkStatus: (isOnline: boolean) => set({ isOnline }),

        // ===== UI ACTIONS =====
        setShowCourseModal: (showCourseModal: boolean) =>
          set({ showCourseModal }),
        setShowNotificationSettings: (showNotificationSettings: boolean) =>
          set({ showNotificationSettings }),
        setNotificationListOffset: (notificationListOffset: number) =>
          set({ notificationListOffset }),
        resetNotificationListOffset: () => set({ notificationListOffset: 0 }),

        // ===== COMPUTED VALUES =====
        getCourseColor: (category?: CourseCategory) => {
          if (!category) return '#4285F4';
          return CATEGORY_COLORS[category] || '#4285F4';
        },

        getCourseCategory: (title: string): CourseCategory | undefined => {
          const titleLower = title.toLowerCase();

          if (titleLower.includes('radyoloji')) return 'radyoloji';
          if (titleLower.includes('restoratif')) return 'restoratif';
          if (titleLower.includes('endodonti')) return 'endodonti';
          if (
            titleLower.includes('pedodonti') ||
            titleLower.includes('çocuk diş')
          )
            return 'pedodonti';
          if (titleLower.includes('protetik')) return 'protetik';
          if (
            titleLower.includes('periodont') ||
            titleLower.includes('periodonti')
          )
            return 'peridontoloji';
          if (
            titleLower.includes('cerrahi') ||
            titleLower.includes('oral surgery')
          )
            return 'cerrahi';
          if (titleLower.includes('ortodonti') || titleLower.includes('orthod'))
            return 'ortodonti';

          return undefined;
        },

        getUnreadNotificationsByCategory: (
          category: 'study' | 'social' | 'system',
        ) => {
          const notifications = get().notifications;
          const categoryTypes = NOTIFICATION_TYPE_CATEGORIES[category];

          return notifications.filter(
            (n) => !n.is_read && categoryTypes.includes(n.notification_type),
          );
        },

        getNotificationsByType: (type: NotificationType) => {
          const notifications = get().notifications;
          return notifications.filter((n) => n.notification_type === type);
        },

        getCourseRelatedNotifications: () => {
          const notifications = get().notifications;
          const courseTypes: NotificationType[] = [
            'course_reminder',
            'course_completed',
            'course_progress',
            'course_milestone',
            'course_study_session',
          ];

          return notifications.filter((n) =>
            courseTypes.includes(n.notification_type),
          );
        },

        getHighPriorityNotifications: () => {
          const notifications = get().notifications;
          const highPriorityTypes: NotificationType[] = [
            'duel_invitation',
            'friend_request',
            'system_announcement',
            'course_completed',
          ];

          return notifications.filter(
            (n) =>
              !n.is_read &&
              (n.priority === 'high' ||
                highPriorityTypes.includes(n.notification_type)),
          );
        },

        canReceiveNotifications: () => {
          const { pushNotificationsEnabled, deviceToken, isOnline } = get();
          return isOnline && (pushNotificationsEnabled || !!deviceToken);
        },
      }),
      {
        name: 'app-store',
        storage: {
          getItem: (name) =>
            AsyncStorage.getItem(name).then((value) =>
              value ? JSON.parse(value) : null,
            ),
          setItem: (name, value) =>
            AsyncStorage.setItem(name, JSON.stringify(value)),
          removeItem: (name) => AsyncStorage.removeItem(name),
        },
        partialize: (state) => ({
          ...state,
          notificationsLoading: false,
          coursesLoading: false,
          isLoading: false,
          isOAuthLoading: false,
          authError: null,
          oauthProvider: null,
        }),
      },
    ),
  ),
);

// ===== ENHANCED CONVENIENCE HOOKS =====

// 🚀 UPDATED: Auth hook with OAuth support
export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    authError,
    isOAuthLoading,
    oauthProvider,
    signIn,
    signOut,
    register,
    signInWithGoogle,
    signInWithApple,
    signInWithFacebook,
    handleOAuthCallback,
    refreshSession,
    checkSession,
    validateSession,
    setAuthError,
    setAuthLoading,
    initializeApp,
  } = useAppStore();

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error: authError,
    isOAuthLoading,
    oauthProvider,

    // Basic auth actions
    signIn,
    signOut,
    register,

    // OAuth actions
    signInWithGoogle,
    signInWithApple,
    signInWithFacebook,
    handleOAuthCallback,

    // Session management
    refreshSession,
    checkSession,
    validateSession,

    // Utilities
    initializeApp,
    clearError: () => setAuthError(null),
    setLoading: setAuthLoading,

    // Computed
    isSigningIn: isLoading && !isOAuthLoading,
    isOAuthInProgress: isOAuthLoading,
    currentOAuthProvider: oauthProvider,
  };
};

// Hook for course-related state
export const usePreferredCourse = () => {
  const {
    preferredCourse,
    availableCourses,
    coursesLoading,
    setPreferredCourse,
    loadAvailableCourses,
    getCourseColor,
    getCourseCategory,
  } = useAppStore();

  return {
    preferredCourse,
    availableCourses,
    isLoading: coursesLoading,
    setPreferredCourse,
    refreshCourses: loadAvailableCourses,
    getCourseColor,
    getCourseCategory,
  };
};

// Hook for notifications with new features
export const useNotifications = () => {
  const {
    notifications,
    unreadCount,
    notificationsLoading,
    deviceToken,
    notificationStats,
    pushNotificationsEnabled,
    notificationFilters,
    lastNotificationSync,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    setNotifications,
    setUnreadCount,
    addNotification,
    removeNotification,
    markMultipleAsRead,
    deleteMultipleNotifications,
    isNotificationTypeEnabled,
    getNotificationPreference,
    getUnreadNotificationsByCategory,
    getNotificationsByType,
    getCourseRelatedNotifications,
    getHighPriorityNotifications,
    canReceiveNotifications,
    setNotificationFilters,
    resetNotificationFilters,
  } = useAppStore();

  return {
    notifications,
    unreadCount,
    isLoading: notificationsLoading,
    deviceToken,
    stats: notificationStats,
    pushEnabled: pushNotificationsEnabled,
    filters: notificationFilters,
    lastSync: lastNotificationSync,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    refreshNotifications: loadNotifications,
    setNotifications,
    setUnreadCount,
    addNotification,
    removeNotification,
    markMultipleAsRead,
    deleteMultipleNotifications,
    setFilters: setNotificationFilters,
    resetFilters: resetNotificationFilters,
    isTypeEnabled: isNotificationTypeEnabled,
    getPreference: getNotificationPreference,
    getUnreadByCategory: getUnreadNotificationsByCategory,
    getByType: getNotificationsByType,
    getCourseRelated: getCourseRelatedNotifications,
    getHighPriority: getHighPriorityNotifications,
    canReceive: canReceiveNotifications,
    unreadStudyCount: getUnreadNotificationsByCategory('study').length,
    unreadSocialCount: getUnreadNotificationsByCategory('social').length,
    unreadSystemCount: getUnreadNotificationsByCategory('system').length,
    courseRelatedCount: getCourseRelatedNotifications().length,
    highPriorityCount: getHighPriorityNotifications().length,
  };
};

// Hook for theme
export const useTheme = () => {
  const { theme, setTheme, toggleTheme } = useAppStore();

  return {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark',
  };
};

// Hook for network status
export const useNetwork = () => {
  const { isOnline, setNetworkStatus } = useAppStore();

  return {
    isOnline,
    setNetworkStatus,
  };
};

// Hook for notification preferences
export const useNotificationPreferences = () => {
  const {
    notificationPreferences,
    updateNotificationPreferences,
    isNotificationTypeEnabled,
    getNotificationPreference,
  } = useAppStore();

  return {
    preferences: notificationPreferences,
    updatePreferences: updateNotificationPreferences,
    isTypeEnabled: isNotificationTypeEnabled,
    getPreference: getNotificationPreference,
    getEnabledTypes: (channel: 'in_app' | 'push' | 'email' = 'in_app') => {
      return notificationPreferences
        .filter((p) => {
          switch (channel) {
            case 'in_app':
              return p.in_app_enabled;
            case 'push':
              return p.push_enabled;
            case 'email':
              return p.email_enabled;
            default:
              return p.in_app_enabled;
          }
        })
        .map((p) => p.notification_type);
    },
  };
};

// ===== STORE SUBSCRIPTIONS (auto-sync) =====

// 🚀 REMOVED: Auto-load data subscription to prevent loops
// Data loading should be triggered by individual screens when needed

// Auto-clear course modal when preferred course is set
useAppStore.subscribe(
  (state) => state.preferredCourse,
  (preferredCourse) => {
    if (preferredCourse) {
      useAppStore.getState().setShowCourseModal(false);
    }
  },
);

// Auto-update notification badge when unread count changes
useAppStore.subscribe(
  (state) => state.unreadCount,
  (unreadCount) => {
    console.log('📱 Unread count changed:', unreadCount);
  },
);

// Sync notification preferences to AsyncStorage
useAppStore.subscribe(
  (state) => state.notificationPreferences,
  (preferences) => {
    if (preferences.length > 0) {
      AsyncStorage.setItem(
        'notificationPreferences',
        JSON.stringify(preferences),
      ).catch((error) =>
        console.warn('Failed to save notification preferences:', error),
      );
    }
  },
);

export default useAppStore;
