// stores/appStore.ts - COMPLETE FIXED VERSION WITH EXACT CATEGORY MAPPING
import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import existing services
import * as authService from '../src/api/authService';
import * as notificationService from '../src/api/notificationService';
import * as studyService from '../src/api/studyService';

import {
  User,
  Notification,
  PreferredCourse,
  NotificationPreferences,
  NotificationType,
  DeviceToken,
  NotificationStats,
} from '../src/types/models';

// 🚀 EXACT COPY: CourseCategory from PreferredCourseContext
export type CourseCategory =
  | 'radyoloji'
  | 'restoratif'
  | 'endodonti'
  | 'pedodonti'
  | 'protetik'
  | 'peridontoloji'
  | 'cerrahi'
  | 'ortodonti';

// 🚀 FIXED: Extended interface for UI-specific properties
type ExtendedPreferredCourse = PreferredCourse & {
  category?: CourseCategory;
  selectedAt?: string;
};

// Notification filters type
type NotificationFilters = {
  category?: 'study' | 'social' | 'system';
  unreadOnly: boolean;
  courseRelatedOnly: boolean;
};

interface AppState {
  // AUTH STATE
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  isOAuthLoading: boolean;
  oauthProvider: 'google' | 'apple' | 'facebook' | null;

  // COURSE STATE - 🚀 FIXED: Use ExtendedPreferredCourse
  preferredCourse: ExtendedPreferredCourse | null;
  availableCourses: ExtendedPreferredCourse[];
  coursesLoading: boolean;

  // NOTIFICATION STATE
  notifications: Notification[];
  unreadCount: number;
  notificationPreferences: NotificationPreferences[];
  notificationsLoading: boolean;
  deviceToken: DeviceToken | null;
  notificationStats: NotificationStats | null;
  pushNotificationsEnabled: boolean;
  lastNotificationSync: string | null;
  notificationFilters: NotificationFilters;

  // THEME STATE
  theme: 'light' | 'dark';

  // NETWORK STATE
  isOnline: boolean;

  // UI STATE
  showCourseModal: boolean;
  selectedCourseId: number | null;
  showNotificationSettings: boolean;
  notificationListOffset: number;

  // INITIALIZATION STATE
  hasInitialized: boolean;
  initializationError: string | null;
}

interface AppActions {
  // AUTH ACTIONS
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
  ) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  handleOAuthCallback: (code: string) => Promise<void>;
  refreshSession: () => Promise<boolean>;
  checkSession: () => Promise<boolean>;
  validateSession: () => Promise<{ isValid: boolean; message?: string }>;
  setUser: (user: User | null) => void;
  setAuthError: (error: string | null) => void;
  setAuthLoading: (loading: boolean) => void;
  initializeApp: () => Promise<void>;

  // COURSE ACTIONS - 🚀 FIXED: Use ExtendedPreferredCourse
  setPreferredCourse: (course: ExtendedPreferredCourse) => Promise<void>;
  loadAvailableCourses: () => Promise<void>;
  selectCourse: (courseId: number) => void;
  refreshPreferredCourse: () => Promise<void>;

  // NOTIFICATION ACTIONS
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

  // THEME ACTIONS
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;

  // NETWORK ACTIONS
  setNetworkStatus: (isOnline: boolean) => void;

  // UI ACTIONS
  setShowCourseModal: (show: boolean) => void;
  setShowNotificationSettings: (show: boolean) => void;
  setNotificationListOffset: (offset: number) => void;
  resetNotificationListOffset: () => void;

  // COMPUTED VALUES - 🚀 FIXED: Same as PreferredCourseContext
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

// 🚀 EXACT COPY: Course category mapping from PreferredCourseContext
const COURSE_CATEGORY_MAPPING: Record<string, CourseCategory> = {
  radyoloji: 'radyoloji',
  restoratif: 'restoratif',
  endodonti: 'endodonti',
  pedodonti: 'pedodonti',
  protetik: 'protetik',
  periodontoloji: 'peridontoloji',
  cerrahi: 'cerrahi',
  ortodonti: 'ortodonti',
};

// 🚀 EXACT COPY: Colors from PreferredCourseContext
export const CATEGORY_COLORS: Record<CourseCategory, string> = {
  radyoloji: '#FF7675',
  restoratif: '#4285F4',
  endodonti: '#FFD93D',
  pedodonti: '#FF6B9D',
  protetik: '#21b958',
  peridontoloji: '#800000',
  cerrahi: '#ec1c24',
  ortodonti: '#702963',
};

// 🚀 EXACT COPY: Fallback courses from PreferredCourseContext
const FALLBACK_COURSES: ExtendedPreferredCourse[] = [
  {
    course_id: 29,
    title: 'Ağız, Diş ve Çene Radyolojisi',
    description: 'Ağız, diş ve çene radyolojisi dersleri',
    category: 'radyoloji',
    course_type: 'klinik_dersler',
  },
  {
    course_id: 24,
    title: 'Restoratif Diş Tedavisi',
    description: 'Restoratif diş tedavisi dersleri',
    category: 'restoratif',
    course_type: 'klinik_dersler',
  },
  {
    course_id: 25,
    title: 'Endodonti',
    description: 'Endodonti dersleri',
    category: 'endodonti',
    course_type: 'klinik_dersler',
  },
  {
    course_id: 26,
    title: 'Pedodonti',
    description: 'Pedodonti dersleri',
    category: 'pedodonti',
    course_type: 'klinik_dersler',
  },
  {
    course_id: 27,
    title: 'Protetik Diş Tedavisi',
    description: 'Protetik diş tedavisi dersleri',
    category: 'protetik',
    course_type: 'klinik_dersler',
  },
  {
    course_id: 28,
    title: 'Periodontoloji',
    description: 'Periodontoloji dersleri',
    category: 'peridontoloji',
    course_type: 'klinik_dersler',
  },
  {
    course_id: 23,
    title: 'Ağız, Diş ve Çene Cerrahisi',
    description: 'Ağız, diş ve çene cerrahisi dersleri',
    category: 'cerrahi',
    course_type: 'klinik_dersler',
  },
  {
    course_id: 30,
    title: 'Ortodonti',
    description: 'Ortodonti dersleri',
    category: 'ortodonti',
    course_type: 'klinik_dersler',
  },
];

// Notification type categorization
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

// 🚀 PERFORMANCE FIX: Add caching for course data (from PreferredCourseContext)
const COURSE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
let coursesCache: {
  courses: ExtendedPreferredCourse[];
  timestamp: number;
} | null = null;
let preferredCourseCache: {
  course: ExtendedPreferredCourse | null;
  timestamp: number;
} | null = null;

// Main store implementation
export const useAppStore = create<AppStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => {
        // 🚀 EXACT COPY: getCourseCategory logic from PreferredCourseContext
        const getCourseCategory = (
          courseTitle: string,
        ): CourseCategory | undefined => {
          if (!courseTitle || typeof courseTitle !== 'string') {
            console.warn(
              '⚠️ getCourseCategory called with invalid title:',
              courseTitle,
            );
            return undefined;
          }

          const titleLower = courseTitle.toLowerCase();

          for (const [keyword, category] of Object.entries(
            COURSE_CATEGORY_MAPPING,
          )) {
            if (titleLower.includes(keyword)) {
              return category;
            }
          }

          return undefined;
        };

        // 🚀 EXACT COPY: getCourseColor logic from PreferredCourseContext
        const getCourseColor = (category?: CourseCategory): string => {
          if (!category) return '#4285F4';
          return CATEGORY_COLORS[category] || '#4285F4';
        };

        // 🚀 FIXED: Helper function to ensure proper course structure
        const ensureCourseStructure = (
          course: any,
        ): ExtendedPreferredCourse => {
          if (!course) {
            throw new Error('Course is null or undefined');
          }

          // Compute category using the exact same logic as PreferredCourseContext
          const computedCategory =
            course.category || getCourseCategory(course.title);

          return {
            course_id: course.course_id,
            title: course.title || 'Unknown Course',
            description: course.description || undefined,
            course_type: course.course_type || 'klinik_dersler',
            image_url: course.image_url || undefined,
            selectedAt: course.selectedAt || new Date().toISOString(),
            category: computedCategory,
          };
        };

        // 🚀 EXACT COPY: Load courses from API logic from PreferredCourseContext
        const loadCoursesFromAPI = async (): Promise<
          ExtendedPreferredCourse[]
        > => {
          console.log('📚 Loading courses from API...');
          const courses = await studyService.getAllCourses('klinik_dersler');
          console.log(`✅ Fetched ${courses.length} courses from API`);

          const mappedCourses = courses.map((course) => {
            const category = getCourseCategory(course.title);
            return {
              course_id: course.course_id,
              title: course.title,
              description: course.description,
              course_type: course.course_type || 'klinik_dersler',
              image_url: course.image_url,
              category,
              selectedAt: new Date().toISOString(),
            };
          });

          return mappedCourses;
        };

        return {
          // INITIAL STATE
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
          hasInitialized: false,
          initializationError: null,

          // AUTH ACTIONS (keeping existing implementation)
          signIn: async (email: string, password: string) => {
            try {
              set({ isLoading: true, authError: null });
              const response = await authService.login(email, password);
              set({
                user: response.user,
                isAuthenticated: true,
                isLoading: false,
                authError: null,
              });

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
              await authService.logout();
              console.log('✅ Logout successful via authService');
            } catch (error) {
              console.warn('⚠️ Logout error:', error);
            } finally {
              // 🚀 FIXED: Clear caches on logout
              coursesCache = null;
              preferredCourseCache = null;

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
                hasInitialized: false,
              });
            }
          },

          register: async (
            username: string,
            email: string,
            password: string,
          ) => {
            try {
              set({ isLoading: true, authError: null });
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

          // OAuth actions (keeping existing implementation)
          signInWithGoogle: async () => {
            try {
              set({
                isOAuthLoading: true,
                oauthProvider: 'google',
                authError: null,
              });
              await authService.signInWithGoogle();
              console.log('🔐 Google OAuth flow initiated via authService');
            } catch (error) {
              const errorMessage =
                error instanceof Error
                  ? error.message
                  : 'Google sign-in failed';
              console.error('❌ Google OAuth error:', errorMessage);
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
              const response = await authService.handleOAuthCallback(code);
              set({
                user: response.user,
                isAuthenticated: true,
                isLoading: false,
                isOAuthLoading: false,
                oauthProvider: null,
                authError: null,
              });

              Promise.allSettled([
                get().loadNotifications(),
                get().loadAvailableCourses(),
              ]).catch((error) => {
                console.warn('Failed to load initial data after OAuth:', error);
              });

              console.log('✅ OAuth callback successful via authService');
            } catch (error) {
              const errorMessage =
                error instanceof Error
                  ? error.message
                  : 'OAuth callback failed';
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
              const { user, token } = await authService.getAuthStatus();
              if (user && token) {
                const isValid = await authService.isTokenValid();
                if (isValid) {
                  set({ user, isAuthenticated: true, authError: null });
                  return true;
                } else {
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
              return await authService.checkAndRefreshSession();
            } catch (error) {
              console.error('Session check error:', error);
              return false;
            }
          },

          validateSession: async () => {
            try {
              return await authService.validateSession();
            } catch (error) {
              console.error('Session validation error:', error);
              return { isValid: false, message: 'Session validation failed' };
            }
          },

          setUser: (user: User | null) => {
            set({ user, isAuthenticated: !!user, authError: null });
          },

          setAuthError: (authError: string | null) => set({ authError }),
          setAuthLoading: (isLoading: boolean) => set({ isLoading }),

          // 🚀 FIXED: INITIALIZATION with proper course handling
          initializeApp: async () => {
            try {
              set({ isLoading: true, initializationError: null });
              console.log('🚀 Initializing app...');

              const sessionRestored = await get().refreshSession();

              if (sessionRestored) {
                // 🚀 FIXED: Restore preferred course with proper category computation
                try {
                  const storedCourse =
                    await AsyncStorage.getItem('selectedCourse');
                  if (storedCourse) {
                    const course = JSON.parse(storedCourse);
                    console.log(
                      '📱 Restoring preferred course from storage:',
                      course.title,
                    );

                    // Ensure the course has proper structure with computed category
                    const properCourse = ensureCourseStructure(course);

                    set({ preferredCourse: properCourse });
                    console.log(
                      '✅ Preferred course restored with category:',
                      properCourse.category,
                    );
                  }
                } catch (error) {
                  console.warn('⚠️ Failed to restore preferred course:', error);
                }

                // Restore notification preferences
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

                console.log(
                  '📱 User authenticated, data will load when needed',
                );
              } else {
                console.log('📱 No valid session found');
              }

              set({ hasInitialized: true });
              console.log('✅ App initialization complete');
            } catch (error) {
              console.error('❌ App initialization failed:', error);
              set({
                initializationError:
                  error instanceof Error
                    ? error.message
                    : 'Initialization failed',
                hasInitialized: true,
              });
            } finally {
              set({ isLoading: false });
            }
          },

          // 🚀 FIXED: COURSE ACTIONS with exact logic from PreferredCourseContext
          setPreferredCourse: async (course: ExtendedPreferredCourse) => {
            try {
              if (!course || !course.course_id || !course.title) {
                throw new Error('Invalid course data');
              }

              console.log('🎯 Setting preferred course:', course.title);

              // Try to save to API (non-blocking)
              try {
                await studyService.setUserPreferredCourse(course.course_id);
                console.log('✅ Preferred course saved to API');

                // Clear cache since we updated it
                preferredCourseCache = null;
              } catch (apiError) {
                console.warn(
                  '⚠️ API save failed, continuing with local:',
                  apiError,
                );
              }

              // Ensure course has proper structure with computed category
              const properCourse = ensureCourseStructure(course);

              set({ preferredCourse: properCourse });

              // Save to local storage
              await AsyncStorage.setItem(
                'selectedCourse',
                JSON.stringify(properCourse),
              );

              console.log(
                '✅ Preferred course saved locally with category:',
                properCourse.category,
              );
            } catch (error) {
              console.error('❌ Failed to set preferred course:', error);
              throw error;
            }
          },

          // 🚀 FIXED: Load available courses with caching from PreferredCourseContext
          loadAvailableCourses: async () => {
            const now = Date.now();

            // Return cached courses if still valid
            if (
              coursesCache &&
              now - coursesCache.timestamp < COURSE_CACHE_DURATION
            ) {
              console.log('📚 Using cached courses');
              set({
                availableCourses: coursesCache.courses,
                coursesLoading: false,
              });
              return;
            }

            try {
              set({ coursesLoading: true });
              console.log('📚 Loading available courses...');

              let courses: ExtendedPreferredCourse[];

              try {
                courses = await loadCoursesFromAPI();
              } catch (err) {
                console.error('❌ Error loading courses, using fallback:', err);
                courses = FALLBACK_COURSES;
              }

              // Cache the result
              coursesCache = {
                courses,
                timestamp: now,
              };

              set({
                availableCourses: courses,
                coursesLoading: false,
              });

              console.log(
                '✅ Available courses loaded with categories:',
                courses.map((c) => `${c.title} -> ${c.category}`),
              );
            } catch (error) {
              console.error('❌ Failed to load courses:', error);
              set({ coursesLoading: false });
            }
          },

          selectCourse: (courseId: number) => {
            set({ selectedCourseId: courseId });
          },

          // 🚀 FIXED: Refresh preferred course with caching
          refreshPreferredCourse: async () => {
            const now = Date.now();

            // Return cached preferred course if still valid
            if (
              preferredCourseCache &&
              now - preferredCourseCache.timestamp < COURSE_CACHE_DURATION
            ) {
              console.log('🎯 Using cached preferred course');
              if (preferredCourseCache.course) {
                set({ preferredCourse: preferredCourseCache.course });
              }
              return;
            }

            try {
              console.log('🔄 Refreshing preferred course...');
              const apiCourse = await studyService.getUserPreferredCourse();

              let finalCourse: ExtendedPreferredCourse | null = null;

              if (apiCourse) {
                const properCourse = ensureCourseStructure(apiCourse);
                finalCourse = properCourse;

                set({ preferredCourse: properCourse });

                // Update local storage
                await AsyncStorage.setItem(
                  'selectedCourse',
                  JSON.stringify(properCourse),
                );

                console.log(
                  '✅ Preferred course refreshed from API with category:',
                  properCourse.category,
                );
              }

              // Cache the result
              preferredCourseCache = {
                course: finalCourse,
                timestamp: now,
              };
            } catch (error) {
              console.warn(
                '⚠️ Failed to refresh preferred course from API:',
                error,
              );

              // Cache null result too
              preferredCourseCache = {
                course: null,
                timestamp: now,
              };
            }
          },

          // NOTIFICATION ACTIONS (keeping existing implementation)
          loadNotifications: async () => {
            try {
              set({ notificationsLoading: true });
              const response = await notificationService.getNotifications(
                20,
                0,
              );
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

          setUnreadCount: (unreadCount: number) => set({ unreadCount }),

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

          setDeviceToken: (deviceToken: DeviceToken | null) =>
            set({ deviceToken }),
          setNotificationStats: (notificationStats: NotificationStats | null) =>
            set({ notificationStats }),
          setPushNotificationsEnabled: (pushNotificationsEnabled: boolean) =>
            set({ pushNotificationsEnabled }),
          updateLastNotificationSync: () =>
            set({ lastNotificationSync: new Date().toISOString() }),

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
            return (
              preferences.find((p) => p.notification_type === type) || null
            );
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
                (n) =>
                  notificationIds.includes(n.notification_id) && !n.is_read,
              ).length;
              set((state) => ({
                notifications: state.notifications.filter(
                  (n) => !notificationIds.includes(n.notification_id),
                ),
                unreadCount: Math.max(
                  0,
                  state.unreadCount - deletedUnreadCount,
                ),
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

          // THEME ACTIONS
          setTheme: (theme: 'light' | 'dark') => set({ theme }),
          toggleTheme: () => {
            const currentTheme = get().theme;
            set({ theme: currentTheme === 'light' ? 'dark' : 'light' });
          },

          // NETWORK ACTIONS
          setNetworkStatus: (isOnline: boolean) => set({ isOnline }),

          // UI ACTIONS
          setShowCourseModal: (showCourseModal: boolean) =>
            set({ showCourseModal }),
          setShowNotificationSettings: (showNotificationSettings: boolean) =>
            set({ showNotificationSettings }),
          setNotificationListOffset: (notificationListOffset: number) =>
            set({ notificationListOffset }),
          resetNotificationListOffset: () => set({ notificationListOffset: 0 }),

          // 🚀 FIXED: COMPUTED VALUES (exactly like PreferredCourseContext)
          getCourseColor,
          getCourseCategory,

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
        };
      },
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
          initializationError: null,
        }),
      },
    ),
  ),
);

// ===== CONVENIENCE HOOKS (same as before) =====

// Auth hook
export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    authError,
    isOAuthLoading,
    oauthProvider,
    hasInitialized,
    initializationError,
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
    hasInitialized,
    initializationError,

    // Actions
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
    initializeApp,
    clearError: () => setAuthError(null),
    setLoading: setAuthLoading,

    // Computed
    isSigningIn: isLoading && !isOAuthLoading,
    isOAuthInProgress: isOAuthLoading,
    currentOAuthProvider: oauthProvider,
  };
};

// 🚀 FIXED: Course hook with proper category support
export const usePreferredCourse = () => {
  const {
    preferredCourse,
    availableCourses,
    coursesLoading,
    setPreferredCourse,
    loadAvailableCourses,
    refreshPreferredCourse,
    getCourseColor,
    getCourseCategory,
  } = useAppStore();

  return {
    preferredCourse,
    availableCourses,
    isLoading: coursesLoading,
    setPreferredCourse,
    refreshCourses: loadAvailableCourses,
    refreshPreferredCourse,
    getCourseColor,
    getCourseCategory,
  };
};

// Notification hook
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

// Theme hook
export const useTheme = () => {
  const { theme, setTheme, toggleTheme } = useAppStore();
  return {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark',
  };
};

// Network hook
export const useNetwork = () => {
  const { isOnline, setNetworkStatus } = useAppStore();
  return {
    isOnline,
    setNetworkStatus,
  };
};

// Notification preferences hook
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

// Store subscriptions
useAppStore.subscribe(
  (state) => state.preferredCourse,
  (preferredCourse) => {
    if (preferredCourse) {
      useAppStore.getState().setShowCourseModal(false);
    }
  },
);

useAppStore.subscribe(
  (state) => state.unreadCount,
  (unreadCount) => {
    console.log('📱 Unread count changed:', unreadCount);
  },
);

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
