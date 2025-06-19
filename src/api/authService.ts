import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import apiRequest, { ApiError } from './apiClient';
import { ApiResponse } from '../types/api';
import { User, AuthResponse } from '../types/models';

// This is a standard part of Expo's OAuth flow, keep it.
WebBrowser.maybeCompleteAuthSession();

// ====================================================================
// UNCHANGED FUNCTIONS - The following functions are correct as they were.
// ====================================================================

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
      throw new Error(
        'Invalid login response from server (missing user/session data)',
      );
    }
    const user: User = normalizeUser(apiData.user);
    await AsyncStorage.setItem('userToken', apiData.session.access_token);
    if (apiData.session.refresh_token) {
      await AsyncStorage.setItem('refreshToken', apiData.session.refresh_token);
    }
    await AsyncStorage.setItem('userData', JSON.stringify(user));
    return {
      user,
      token: apiData.session.access_token,
      refreshToken: apiData.session.refresh_token || null,
    };
  } catch (error) {
    console.error('Login service error:', error);
    if (error instanceof ApiError) throw error;
    throw new Error(error instanceof Error ? error.message : 'Login failed.');
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
      throw new Error(
        'Invalid registration response from server (missing user/session data)',
      );
    }
    const user: User = normalizeUser(apiData.user);
    await AsyncStorage.setItem('userToken', apiData.session.access_token);
    if (apiData.session.refresh_token) {
      await AsyncStorage.setItem('refreshToken', apiData.session.refresh_token);
    }
    await AsyncStorage.setItem('userData', JSON.stringify(user));
    return {
      user,
      token: apiData.session.access_token,
      refreshToken: apiData.session.refresh_token || null,
    };
  } catch (error) {
    console.error('Registration service error:', error);
    if (error instanceof ApiError) throw error;
    throw new Error(
      error instanceof Error ? error.message : 'Registration failed.',
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
    if (error instanceof ApiError) throw error;
    throw new Error(
      error instanceof Error ? error.message : 'Password reset request failed.',
    );
  }
}

export async function refreshAuthToken(): Promise<{
  token: string;
  refreshToken: string | null;
}> {
  try {
    const currentRefreshToken = await AsyncStorage.getItem('refreshToken');
    if (!currentRefreshToken) {
      console.error(
        'authService.refreshAuthToken: No refresh token available.',
      );
      await logout();
      throw new Error('No refresh token available');
    }

    const response = await apiRequest<AuthApiPayload>(
      '/auth/refresh-token',
      'POST',
      {
        refreshToken: currentRefreshToken,
      },
    );

    console.log(
      'authService.refreshAuthToken - apiRequest response:',
      response,
    );
    const apiData = response.data;

    if (
      !apiData ||
      typeof apiData !== 'object' || // Ensure apiData is an object
      !apiData.session || // Ensure session object exists
      !apiData.session.access_token // Ensure access_token exists within session
    ) {
      console.error(
        'Invalid refresh token response structure from server data (authService):',
        apiData,
      );
      await logout();
      throw new Error(
        'Invalid refresh token response: structure is not as expected.',
      );
    }

    await AsyncStorage.setItem('userToken', apiData.session.access_token);
    if (apiData.session.refresh_token) {
      await AsyncStorage.setItem('refreshToken', apiData.session.refresh_token);
    }

    return {
      token: apiData.session.access_token,
      refreshToken: apiData.session.refresh_token || null,
    };
  } catch (error) {
    console.error('authService.refreshAuthToken error:', error);
    await logout();
    if (error instanceof ApiError) throw error;
    throw new Error(
      error instanceof Error ? error.message : 'Token refresh failed.',
    );
  }
}

// ...any other non-OAuth functions like requestPasswordReset, etc., also go here...

// ====================================================================
// CORRECTED OAUTH FUNCTIONS - The changes are below
// ====================================================================

/**
 * Starts the OAuth flow with a given provider.
 * This function's ONLY job is to get a URL from the backend and open the browser.
 * It does NOT handle the result. The AuthContext deep link listener does.
 */
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
      throw new Error(`Failed to get ${provider} OAuth URL from server.`);
    }

    // 2. Open the URL in a special browser session designed for authentication.
    // The promise resolves when the browser is closed by the user or by a deep link.
    // We do not need the result, as our AuthContext listener handles it.
    await WebBrowser.openAuthSessionAsync(response.data.url);

    // 3. That's it. The function is done.
  } catch (error) {
    // This will only catch errors in the process of starting the flow.
    console.error(`Error in authService startOAuth for ${provider}:`, error);
    if (error instanceof ApiError) {
      throw error; // Re-throw API errors
    }
    // Don't rethrow user cancellation errors
    if (error instanceof Error && error.message.includes('cancelled')) {
      console.log('OAuth flow cancelled by user.');
      return;
    }
    throw new Error(`The ${provider} sign-in process could not be started.`);
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

// --- DELETED FUNCTION ---
// The `handleOAuthDeepLink` function is no longer needed in this file.
// The AuthContext now correctly handles this logic as the single source of truth.
