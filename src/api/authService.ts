import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import apiRequest, { ApiError } from './apiClient';
import { ApiResponse } from '../types/api';
import { User, AuthResponse } from '../types/models';

// Achievement integration
import { triggerAchievementCheck } from './achievementService';
import { router } from 'expo-router';

// This is a standard part of Expo's OAuth flow, keep it.
WebBrowser.maybeCompleteAuthSession();

// Add token refresh flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<any> | null = null;

interface AuthApiPayload {
  message?: string;
  user?: any;
  session?: {
    access_token: string;
    refresh_token?: string;
    expires_at?: number;
    expires_in?: number;
    token_type?: string;
  };
}

function normalizeUser(apiUser: any): User {
  if (!apiUser) return {} as User;
  return {
    id: apiUser.userId || apiUser.id || apiUser.user_id || 0,
    userId: apiUser.userId || apiUser.id || apiUser.user_id || 0,
    username: apiUser.username || '',
    email: apiUser.email || '',
    dateRegistered:
      apiUser.date_registered ||
      apiUser.dateRegistered ||
      new Date().toISOString(),
    role: apiUser.role || 'student',
    subscriptionType:
      apiUser.subscriptionType || apiUser.subscription_type || 'free',
    totalDuels: apiUser.totalDuels || apiUser.total_duels || 0,
    duelsWon: apiUser.duelsWon || apiUser.duels_won || 0,
    duelsLost: apiUser.duelsLost || apiUser.duels_lost || 0,
    longestLosingStreak:
      apiUser.longestLosingStreak || apiUser.longest_losing_streak || 0,
    currentLosingStreak:
      apiUser.currentLosingStreak || apiUser.current_losing_streak || 0,
    totalStudyTime: apiUser.totalStudyTime || apiUser.total_study_time || 0,
    permissions: apiUser.permissions || [],
    oauthProvider: apiUser.oauth_provider || apiUser.oauthProvider || null,
    isOAuthUser: !!(apiUser.oauth_provider || apiUser.oauthProvider),
    preferred_course_id: apiUser.preferred_course_id || null,
  };
}

// SIMPLIFIED: Just check if token exists - let API calls handle validation
export async function isTokenValid(): Promise<boolean> {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      console.log('No token found in storage');
      return false;
    }

    // Don't make API calls here - just check if token exists
    // API calls will handle 401s and redirect to login if needed
    console.log('Token exists in storage');
    return true;
  } catch (error) {
    console.error('Error checking token validity:', error);
    return false;
  }
}

// SIMPLIFIED: Just check if token exists - don't try to refresh
export async function checkAndRefreshSession(): Promise<boolean> {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      console.log('No token found during session check');
      router.replace('/(auth)/login');
      return false;
    }

    // Token exists, assume it's valid until an API call says otherwise
    console.log('Session token exists');
    return true;
  } catch (error) {
    console.error('Error checking session:', error);
    return false;
  }
}

// Simple wrapper function with better error messages
export async function safeApiRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any,
): Promise<ApiResponse<T>> {
  try {
    return await apiRequest<T>(endpoint, method, data);
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);

    if (error instanceof ApiError) {
      if (error.status === 401) {
        // For infinite tokens, 401 means user needs to login again
        await logout();
        throw new Error('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
      } else if (error.status === 403) {
        throw new Error('Bu işlem için yetkiniz bulunmuyor.');
      } else if (error.status === 404) {
        throw new Error('İstenen kaynak bulunamadı.');
      } else if (error.status === 500) {
        throw new Error(
          'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.',
        );
      } else if (error.status === 0) {
        throw new Error('İnternet bağlantınızı kontrol edin.');
      }
      throw new Error(
        error.message || 'Bir hata oluştu. Lütfen tekrar deneyin.',
      );
    }

    throw new Error('Beklenmeyen bir hata oluştu.');
  }
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  try {
    const response = await apiRequest<AuthApiPayload>('/auth/login', 'POST', {
      email,
      password,
    });
    const apiData = response.data;
    if (!apiData?.user || !apiData.session?.access_token) {
      throw new Error('Geçersiz giriş yanıtı sunucudan alındı');
    }
    const user: User = normalizeUser(apiData.user);

    // Store the infinite token
    await AsyncStorage.setItem('userToken', apiData.session.access_token);
    await AsyncStorage.setItem('authToken', apiData.session.access_token);

    // Only store refresh token if provided (for backward compatibility)
    if (apiData.session.refresh_token) {
      await AsyncStorage.setItem('refreshToken', apiData.session.refresh_token);
    }

    await AsyncStorage.setItem('userData', JSON.stringify(user));
    console.log('Login successful, user data stored');

    // Achievement check for login
    try {
      console.log(
        'User logged in successfully - achievement check skipped for login',
      );
    } catch (achievementError) {
      console.error('Achievement check failed after login:', achievementError);
    }

    return {
      user,
      token: apiData.session.access_token,
      refreshToken: apiData.session.refresh_token || null,
    };
  } catch (error) {
    console.error('Login service error:', error);
    if (error instanceof ApiError) {
      if (error.status === 401) {
        throw new Error('E-posta veya şifre hatalı.');
      } else if (error.status === 429) {
        throw new Error(
          'Çok fazla deneme yaptınız. Lütfen daha sonra tekrar deneyin.',
        );
      }
      throw error;
    }
    throw new Error(
      error instanceof Error ? error.message : 'Giriş başarısız oldu.',
    );
  }
}

export async function register(
  username: string,
  email: string,
  password: string,
): Promise<AuthResponse & { achievementCheck?: any }> {
  try {
    const response = await apiRequest<AuthApiPayload>(
      '/auth/register',
      'POST',
      { username, email, password },
    );
    const apiData = response.data;
    if (!apiData?.user || !apiData.session?.access_token) {
      throw new Error('Geçersiz kayıt yanıtı sunucudan alındı');
    }
    const user: User = normalizeUser(apiData.user);

    // Store the infinite token
    await AsyncStorage.setItem('userToken', apiData.session.access_token);
    await AsyncStorage.setItem('authToken', apiData.session.access_token);

    if (apiData.session.refresh_token) {
      await AsyncStorage.setItem('refreshToken', apiData.session.refresh_token);
    }

    await AsyncStorage.setItem('userData', JSON.stringify(user));
    console.log('Registration successful, user data stored');

    // Achievement check for registration
    let achievementCheck = null;
    try {
      console.log('🎉 Checking achievements after user registration');
      setTimeout(async () => {
        try {
          achievementCheck = await triggerAchievementCheck('user_registered');
          console.log(
            'Registration achievement check result:',
            achievementCheck,
          );
          if (achievementCheck?.newAchievements > 0) {
            console.log(
              `🎉 New user earned ${achievementCheck.newAchievements} achievement(s) on registration!`,
            );
          }
        } catch (error) {
          console.error('Achievement check failed after registration:', error);
        }
      }, 2000);
    } catch (error) {
      console.error(
        'Achievement check setup failed after registration:',
        error,
      );
    }

    return {
      user,
      token: apiData.session.access_token,
      refreshToken: apiData.session.refresh_token || null,
      achievementCheck,
    };
  } catch (error) {
    console.error('Registration service error:', error);
    if (error instanceof ApiError) {
      if (error.status === 409) {
        throw new Error('Bu e-posta adresi zaten kullanılıyor.');
      } else if (error.status === 400) {
        throw new Error('Geçersiz bilgiler girdiniz. Lütfen kontrol edin.');
      }
      throw error;
    }
    throw new Error(
      error instanceof Error ? error.message : 'Kayıt başarısız oldu.',
    );
  }
}

export async function logout(): Promise<void> {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      // Try to call logout endpoint, but don't fail if it doesn't work
      await apiRequest('/auth/signout', 'POST').catch((apiError) =>
        console.warn(
          'Logout API call failed, proceeding with local logout:',
          apiError,
        ),
      );
    }
  } finally {
    // Reset refresh state
    isRefreshing = false;
    refreshPromise = null;

    await AsyncStorage.multiRemove([
      'userToken',
      'refreshToken',
      'userData',
      'authToken',
    ]);
    console.log('User tokens and data cleared from AsyncStorage.');
  }
}

export async function getAuthStatus(): Promise<{
  user: User | null;
  token: string | null;
}> {
  try {
    const token = await AsyncStorage.getItem('userToken');
    const userDataString = await AsyncStorage.getItem('userData');
    const user: User | null = userDataString
      ? normalizeUser(JSON.parse(userDataString))
      : null;
    return { user, token };
  } catch (error) {
    console.error('Error in getAuthStatus:', error);
    return { user: null, token: null };
  }
}

export async function requestPasswordReset(
  email: string,
): Promise<ApiResponse<any>> {
  try {
    return await apiRequest<any>('/auth/reset-password', 'POST', { email });
  } catch (error) {
    console.error('Password reset request service error:', error);
    if (error instanceof ApiError) {
      if (error.status === 404) {
        throw new Error('Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı.');
      } else if (error.status === 429) {
        throw new Error(
          'Çok fazla şifre sıfırlama talebi gönderdินiz. Lütfen daha sonra tekrar deneyin.',
        );
      }
      throw error;
    }
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Şifre sıfırlama talebi başarısız oldu.',
    );
  }
}

// OPTIONAL: Simple refresh token function (only call when explicitly needed)
export async function refreshAuthToken(): Promise<{
  token: string;
  refreshToken: string | null;
}> {
  try {
    const currentRefreshToken = await AsyncStorage.getItem('refreshToken');
    if (!currentRefreshToken) {
      console.error('No refresh token available for refresh.');
      throw new Error('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
    }

    console.log('Attempting to refresh token...');
    const response = await apiRequest<AuthApiPayload>(
      '/auth/refresh-token',
      'POST',
      {
        refreshToken: currentRefreshToken,
      },
    );

    const apiData = response.data;

    if (
      !apiData ||
      typeof apiData !== 'object' ||
      !apiData.session ||
      !apiData.session.access_token
    ) {
      console.error('Invalid refresh token response structure:', apiData);
      throw new Error(
        'Geçersiz token yenileme yanıtı. Lütfen tekrar giriş yapın.',
      );
    }

    await AsyncStorage.setItem('userToken', apiData.session.access_token);
    await AsyncStorage.setItem('authToken', apiData.session.access_token);
    if (apiData.session.refresh_token) {
      await AsyncStorage.setItem('refreshToken', apiData.session.refresh_token);
    }

    console.log('Token refreshed successfully');
    return {
      token: apiData.session.access_token,
      refreshToken: apiData.session.refresh_token || null,
    };
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Clear tokens on refresh failure
    await AsyncStorage.multiRemove([
      'userToken',
      'refreshToken',
      'userData',
      'authToken',
    ]);

    if (error instanceof ApiError) {
      if (error.status === 401 || error.status === 403) {
        throw new Error('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
      }
    }

    throw new Error(
      error instanceof Error ? error.message : 'Token yenileme başarısız oldu.',
    );
  }
}

// SIMPLIFIED: API request wrapper without automatic token refresh loops
export async function authenticatedRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any,
): Promise<ApiResponse<T>> {
  try {
    return await apiRequest<T>(endpoint, method, data);
  } catch (error) {
    // If we get a 401, the token is expired - user needs to login again
    if (error instanceof ApiError && error.status === 401) {
      console.log('Received 401 - token expired, clearing session');
      await logout();
      throw new Error('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
    }
    throw error;
  }
}

// SIMPLIFIED: Session validation without refresh attempts
export async function validateSession(): Promise<{
  isValid: boolean;
  message?: string;
}> {
  try {
    const { token } = await getAuthStatus();

    if (!token) {
      return {
        isValid: false,
        message: 'Oturum bulunamadı. Lütfen giriş yapın.',
      };
    }

    // Just return true if token exists - let API calls handle validation
    return {
      isValid: true,
      message: 'Oturum var.',
    };
  } catch (error) {
    console.error('Session validation error:', error);
    return {
      isValid: false,
      message: 'Oturum doğrulanırken hata oluştu.',
    };
  }
}

// OAuth functions remain the same
async function startOAuth(
  provider: 'google' | 'apple' | 'facebook',
): Promise<void> {
  try {
    console.log(`Starting ${provider} OAuth flow from authService`);

    const response = await apiRequest<{ url: string; message: string }>(
      `/auth/oauth/${provider}`,
      'GET',
    );

    if (!response.data?.url) {
      throw new Error(`${provider} OAuth URL alınamadı sunucudan.`);
    }

    console.log(`Opening ${provider} OAuth URL...`);
    await WebBrowser.openAuthSessionAsync(response.data.url);
    console.log(`${provider} OAuth browser session completed`);
  } catch (error) {
    console.error(`Error in authService startOAuth for ${provider}:`, error);
    if (error instanceof ApiError) {
      if (error.status === 500) {
        throw new Error(
          `${provider} giriş servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.`,
        );
      }
      throw error;
    }
    if (error instanceof Error && error.message.includes('cancelled')) {
      console.log('OAuth flow cancelled by user.');
      return;
    }
    throw new Error(`${provider} giriş işlemi başlatılamadı.`);
  }
}

export async function signInWithGoogle(): Promise<void> {
  return startOAuth('google');
}

export async function signInWithApple(): Promise<void> {
  return startOAuth('apple');
}

export async function signInWithFacebook(): Promise<void> {
  return startOAuth('facebook');
}

// Rest of the functions remain the same...
export async function getCurrentUserWithAchievements(): Promise<{
  user: User | null;
  achievements?: any[];
  achievementProgress?: any[];
  completionPercentage?: number;
}> {
  try {
    const { user } = await getAuthStatus();

    if (!user) {
      return { user: null };
    }

    try {
      const achievementService = await import('./achievementService');
      const [achievements, achievementProgress] = await Promise.all([
        achievementService.getUserAchievements(),
        achievementService.getUserAchievementProgress(),
      ]);

      const totalPossible = achievements.length + achievementProgress.length;
      const completed = achievements.length;
      const completionPercentage =
        totalPossible > 0 ? Math.round((completed / totalPossible) * 100) : 0;

      return {
        user,
        achievements,
        achievementProgress,
        completionPercentage,
      };
    } catch (achievementError) {
      console.error('Error loading achievement data:', achievementError);
      return { user };
    }
  } catch (error) {
    console.error('Error getting current user with achievements:', error);
    return { user: null };
  }
}

export async function manualAchievementCheck(): Promise<any> {
  try {
    console.log('Manual achievement check triggered');
    const result = await triggerAchievementCheck('manual_check' as any);

    if (result?.newAchievements > 0) {
      console.log(
        `🎉 Manual check found ${result.newAchievements} new achievements!`,
      );
    } else {
      console.log('No new achievements found in manual check');
    }

    return result;
  } catch (error) {
    console.error('Manual achievement check failed:', error);
    throw error;
  }
}

export async function checkNewUserOnboarding(): Promise<{
  isNewUser: boolean;
  shouldShowAchievementIntro: boolean;
  hasEarnedFirstAchievement: boolean;
}> {
  try {
    const { user } = await getAuthStatus();

    if (!user) {
      return {
        isNewUser: false,
        shouldShowAchievementIntro: false,
        hasEarnedFirstAchievement: false,
      };
    }

    const registrationDate = new Date(user.dateRegistered);
    const now = new Date();
    const hoursSinceRegistration =
      (now.getTime() - registrationDate.getTime()) / (1000 * 60 * 60);
    const isNewUser = hoursSinceRegistration < 24;

    let hasEarnedFirstAchievement = false;
    let shouldShowAchievementIntro = false;

    try {
      const achievementService = await import('./achievementService');
      const userAchievements = await achievementService.getUserAchievements();

      hasEarnedFirstAchievement = userAchievements.length > 0;
      shouldShowAchievementIntro = isNewUser && !hasEarnedFirstAchievement;
    } catch (achievementError) {
      console.error(
        'Error checking achievements for onboarding:',
        achievementError,
      );
    }

    return {
      isNewUser,
      shouldShowAchievementIntro,
      hasEarnedFirstAchievement,
    };
  } catch (error) {
    console.error('Error checking new user onboarding:', error);
    return {
      isNewUser: false,
      shouldShowAchievementIntro: false,
      hasEarnedFirstAchievement: false,
    };
  }
}

export async function updateStoredUserData(
  updatedUser: Partial<User>,
): Promise<void> {
  try {
    const { user } = await getAuthStatus();

    if (user) {
      const mergedUser = { ...user, ...updatedUser };
      await AsyncStorage.setItem('userData', JSON.stringify(mergedUser));
      console.log('Stored user data updated');
    }
  } catch (error) {
    console.error('Error updating stored user data:', error);
  }
}

export async function debugAuthState(): Promise<void> {
  if (__DEV__) {
    try {
      const { user, token } = await getAuthStatus();
      const tokenValid = await isTokenValid();

      console.log('=== AUTH DEBUG INFO ===');
      console.log('User:', user ? `${user.username} (${user.email})` : 'None');
      console.log('Token exists:', !!token);
      console.log('Token valid:', tokenValid);
      console.log('Is refreshing:', isRefreshing);

      if (user) {
        try {
          const achievementService = await import('./achievementService');
          const achievements = await achievementService.getUserAchievements();
          console.log('User achievements:', achievements.length);
        } catch (achievementError) {
          console.log('Achievement debug failed:', achievementError);
        }
      }

      console.log('=====================');
    } catch (error) {
      console.error('Debug auth state error:', error);
    }
  }
}
