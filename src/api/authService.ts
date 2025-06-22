import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import apiRequest, { ApiError } from './apiClient';
import { ApiResponse } from '../types/api';
import { User, AuthResponse } from '../types/models';

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
  };
}

// Enhanced token validation
export async function isTokenValid(): Promise<boolean> {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      console.log('No token found in storage');
      return false;
    }

    // Try to decode the token to check expiration
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);

      // Check if token expires within the next 5 minutes
      if (payload.exp && payload.exp < currentTime + 300) {
        console.log('Token is expired or expiring soon');
        return false;
      }

      console.log('Token is valid');
      return true;
    } catch (e) {
      // If we can't decode the token, test it with a simple API call
      console.log('Could not decode token, testing with API call');
      try {
        await apiRequest('/auth/verify', 'GET');
        console.log('Token validated via API call');
        return true;
      } catch (apiError) {
        console.warn('Token validation failed:', apiError);
        return false;
      }
    }
  } catch (error) {
    console.error('Error checking token validity:', error);
    return false;
  }
}

// Enhanced session check that works with your existing API client
export async function checkAndRefreshSession(): Promise<boolean> {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      console.log('No token found during session check');
      return false;
    }

    // Check if token is valid
    const tokenValid = await isTokenValid();
    if (tokenValid) {
      console.log('Session is valid');
      return true;
    }

    console.log('Token invalid, will be refreshed by apiClient automatically');

    // Make a test request to trigger automatic token refresh in apiClient
    try {
      await apiRequest('/auth/verify', 'GET');
      console.log('Session refreshed successfully via apiClient');
      return true;
    } catch (error) {
      console.error('Session refresh failed:', error);
      return false;
    }
  } catch (error) {
    console.error('Error checking session:', error);
    return false;
  }
}

// Simple wrapper function to handle API requests with better error messages
export async function safeApiRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any,
): Promise<ApiResponse<T>> {
  try {
    return await apiRequest<T>(endpoint, method, data);
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);

    // Enhance error messages for better user experience
    if (error instanceof ApiError) {
      if (error.status === 401) {
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
    await AsyncStorage.setItem('userToken', apiData.session.access_token);
    if (apiData.session.refresh_token) {
      await AsyncStorage.setItem('refreshToken', apiData.session.refresh_token);
    }
    await AsyncStorage.setItem('userData', JSON.stringify(user));
    console.log('Login successful, user data stored');
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
): Promise<AuthResponse> {
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
    await AsyncStorage.setItem('userToken', apiData.session.access_token);
    if (apiData.session.refresh_token) {
      await AsyncStorage.setItem('refreshToken', apiData.session.refresh_token);
    }
    await AsyncStorage.setItem('userData', JSON.stringify(user));
    console.log('Registration successful, user data stored');
    return {
      user,
      token: apiData.session.access_token,
      refreshToken: apiData.session.refresh_token || null,
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

    await AsyncStorage.multiRemove(['userToken', 'refreshToken', 'userData']);
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
          'Çok fazla şifre sıfırlama talebi gönderdينiz. Lütfen daha sonra tekrar deneyin.',
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

// Enhanced refresh token function with better error handling
export async function refreshAuthToken(): Promise<{
  token: string;
  refreshToken: string | null;
}> {
  // Prevent multiple simultaneous refresh attempts
  if (isRefreshing && refreshPromise) {
    console.log('Token refresh already in progress, waiting...');
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = performTokenRefresh();

  try {
    const result = await refreshPromise;
    console.log('Token refresh completed successfully');
    return result;
  } finally {
    isRefreshing = false;
    refreshPromise = null;
  }
}

async function performTokenRefresh(): Promise<{
  token: string;
  refreshToken: string | null;
}> {
  try {
    const currentRefreshToken = await AsyncStorage.getItem('refreshToken');
    if (!currentRefreshToken) {
      console.error('No refresh token available for refresh.');
      await logout();
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
      await logout();
      throw new Error(
        'Geçersiz token yenileme yanıtı. Lütfen tekrar giriş yapın.',
      );
    }

    await AsyncStorage.setItem('userToken', apiData.session.access_token);
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
    await logout();

    if (error instanceof ApiError) {
      if (error.status === 401) {
        throw new Error('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
      } else if (error.status === 403) {
        throw new Error(
          'Token yenileme yetkisi yok. Lütfen tekrar giriş yapın.',
        );
      }
    }

    throw new Error(
      error instanceof Error ? error.message : 'Token yenileme başarısız oldu.',
    );
  }
}

// Enhanced API request wrapper with automatic token refresh
export async function authenticatedRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any,
  retryCount = 0,
): Promise<ApiResponse<T>> {
  try {
    // Check if token is valid before making request
    const tokenValid = await isTokenValid();
    if (!tokenValid && retryCount === 0) {
      console.log('Token invalid, attempting refresh...');
      await refreshAuthToken();
    }

    return await apiRequest<T>(endpoint, method, data);
  } catch (error) {
    // If we get a 401 and haven't retried yet, try refreshing the token
    if (error instanceof ApiError && error.status === 401 && retryCount === 0) {
      console.log('Received 401, attempting token refresh...');
      try {
        await refreshAuthToken();
        return await authenticatedRequest<T>(endpoint, method, data, 1);
      } catch (refreshError) {
        console.error('Token refresh failed, logging out:', refreshError);
        await logout();
        throw new Error('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
      }
    }

    throw error;
  }
}

// Utility function to validate session and provide user feedback
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

    const tokenValid = await isTokenValid();
    if (!tokenValid) {
      // Try to refresh
      try {
        await refreshAuthToken();
        return {
          isValid: true,
          message: 'Oturum yenilendi.',
        };
      } catch (refreshError) {
        return {
          isValid: false,
          message: 'Oturum süresi doldu. Lütfen tekrar giriş yapın.',
        };
      }
    }

    return {
      isValid: true,
      message: 'Oturum geçerli.',
    };
  } catch (error) {
    console.error('Session validation error:', error);
    return {
      isValid: false,
      message: 'Oturum doğrulanırken hata oluştu.',
    };
  }
}

// OAuth functions with enhanced error handling
async function startOAuth(
  provider: 'google' | 'apple' | 'facebook',
): Promise<void> {
  try {
    console.log(`Starting ${provider} OAuth flow from authService`);

    // 1. Get the OAuth URL from your backend
    const response = await apiRequest<{ url: string; message: string }>(
      `/auth/oauth/${provider}`,
      'GET',
    );

    if (!response.data?.url) {
      throw new Error(`${provider} OAuth URL alınamadı sunucudan.`);
    }

    // 2. Open the URL in a special browser session designed for authentication.
    console.log(`Opening ${provider} OAuth URL...`);
    await WebBrowser.openAuthSessionAsync(response.data.url);
    console.log(`${provider} OAuth browser session completed`);

    // 3. That's it. The function is done.
  } catch (error) {
    // This will only catch errors in the process of starting the flow.
    console.error(`Error in authService startOAuth for ${provider}:`, error);
    if (error instanceof ApiError) {
      if (error.status === 500) {
        throw new Error(
          `${provider} giriş servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.`,
        );
      }
      throw error; // Re-throw API errors
    }
    // Don't rethrow user cancellation errors
    if (error instanceof Error && error.message.includes('cancelled')) {
      console.log('OAuth flow cancelled by user.');
      return;
    }
    throw new Error(`${provider} giriş işlemi başlatılamadı.`);
  }
}

/**
 * Google OAuth: Kicks off the sign-in process.
 */
export async function signInWithGoogle(): Promise<void> {
  return startOAuth('google');
}

/**
 * Apple OAuth: Kicks off the sign-in process.
 */
export async function signInWithApple(): Promise<void> {
  return startOAuth('apple');
}

/**
 * Facebook OAuth: Kicks off the sign-in process.
 */
export async function signInWithFacebook(): Promise<void> {
  return startOAuth('facebook');
}

// Debug function for development
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
      console.log('=====================');
    } catch (error) {
      console.error('Debug auth state error:', error);
    }
  }
}
