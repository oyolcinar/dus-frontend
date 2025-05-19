import AsyncStorage from '@react-native-async-storage/async-storage';
import apiRequest, { ApiError } from './apiClient';
import { ApiResponse } from '../types/api'; // Ensure this path is correct
import { User, AuthResponse } from '../types/models'; // Ensure this path and interfaces are correct

// Define the expected payload structure from backend for auth operations,
// which will be nested under 'data' by apiRequest's wrapper.
interface AuthApiPayload {
  message?: string; // Message might be optional
  user?: any; // Raw user object from backend, could be optional in some responses
  session?: {
    // Session object, could be optional
    access_token: string; // access_token is mandatory if session exists
    refresh_token?: string;
    expires_at?: number;
    expires_in?: number;
    token_type?: string;
    // other session fields from backend if any
  };
}

// Helper function to normalize user data
function normalizeUser(apiUser: any): User {
  if (!apiUser) return {} as User; // Handle null/undefined input gracefully
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
    // Ensure User interface has 'permissions' defined (e.g., permissions?: string[])
    permissions: apiUser.permissions || [],
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
    console.log('Login - apiRequest response:', response);

    const apiData = response.data;

    if (
      !apiData ||
      typeof apiData !== 'object' || // Ensure apiData is an object
      !apiData.user || // Ensure user object exists
      !apiData.session || // Ensure session object exists
      !apiData.session.access_token // Ensure access_token exists within session
    ) {
      console.error(
        'Invalid login response structure from server data:',
        apiData,
      );
      throw new Error(
        'Invalid login response from server (missing or malformed user/session data)',
      );
    }

    const user: User = normalizeUser(apiData.user);

    await AsyncStorage.setItem('userToken', apiData.session.access_token);
    if (apiData.session.refresh_token) {
      await AsyncStorage.setItem('refreshToken', apiData.session.refresh_token);
      console.log(
        'Refresh token stored from login:',
        apiData.session.refresh_token.substring(0, 10) + '...',
      );
    } else {
      console.warn('No refresh token received in login response.');
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
    console.log('Register - apiRequest response:', response);

    const apiData = response.data;

    if (
      !apiData ||
      typeof apiData !== 'object' || // Ensure apiData is an object
      !apiData.user || // Ensure user object exists
      !apiData.session || // Ensure session object exists
      !apiData.session.access_token // Ensure access_token exists within session
    ) {
      console.log(
        'Registration response did not contain full user/session data. This might be expected (e.g., email verification pending) or an issue.',
        apiData,
      );
      // If your backend always returns full session on successful register, this is an error.
      // If it might not (e.g. email verification needed), you might handle it differently,
      // or attempt login as a fallback if appropriate for your flow.
      // For now, treating as an error if full session not returned:
      // return await login(email, password); // Or:
      throw new Error(
        'Invalid registration response from server (missing or malformed user/session data)',
      );
    }

    const user: User = normalizeUser(apiData.user);

    await AsyncStorage.setItem('userToken', apiData.session.access_token);
    if (apiData.session.refresh_token) {
      await AsyncStorage.setItem('refreshToken', apiData.session.refresh_token);
      console.log(
        'Refresh token stored from registration:',
        apiData.session.refresh_token.substring(0, 10) + '...',
      );
    } else {
      console.warn('No refresh token received in registration response.');
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
      try {
        await apiRequest('/auth/signout', 'POST');
        console.log('Successfully called /auth/signout endpoint.');
      } catch (apiError) {
        console.warn(
          'Logout API call failed, proceeding with local logout:',
          apiError,
        );
      }
    }
  } catch (storageError) {
    console.error(
      'Error accessing token from AsyncStorage during logout pre-API call:',
      storageError,
    );
  } finally {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('userData');
      console.log('User tokens and data cleared from AsyncStorage.');
    } catch (clearError) {
      console.error(
        'Failed to clear tokens from AsyncStorage during logout:',
        clearError,
      );
    }
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

export async function getAuthStatus(): Promise<{
  user: User | null;
  token: string | null;
}> {
  try {
    const token = await AsyncStorage.getItem('userToken');
    const userDataString = await AsyncStorage.getItem('userData');
    let user: User | null = null;

    if (userDataString) {
      try {
        const parsedUser = JSON.parse(userDataString);
        user = normalizeUser(parsedUser);
      } catch (e) {
        console.error('Error parsing user data from AsyncStorage:', e);
        await AsyncStorage.removeItem('userData');
      }
    }
    return { user, token };
  } catch (error) {
    console.error('Error in getAuthStatus:', error);
    return { user: null, token: null };
  }
}

export async function updateUserData(
  newUserData: Partial<User>,
): Promise<User> {
  try {
    const currentUserJson = await AsyncStorage.getItem('userData');
    let currentUser: Partial<User> = {};
    if (currentUserJson) {
      try {
        currentUser = JSON.parse(currentUserJson);
      } catch (e) {
        console.error('Error parsing current user data for update:', e);
      }
    }

    const mergedUser = { ...currentUser, ...newUserData };
    const normalizedUser = normalizeUser(mergedUser);

    await AsyncStorage.setItem('userData', JSON.stringify(normalizedUser));
    return normalizedUser;
  } catch (error) {
    console.error('Update user data in AsyncStorage error:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to update user data.',
    );
  }
}
