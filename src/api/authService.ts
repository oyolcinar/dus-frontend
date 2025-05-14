// src/api/authService.ts
import apiRequest, { ApiError } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse, User } from '../types/models';
import { ApiResponse } from '../types/api';

// Response type for login and registration
interface AuthApiResponse extends ApiResponse<AuthResponse> {}

// Response type for user profile
interface UserProfileResponse extends ApiResponse<User> {}

// Response type for duel stats
interface DuelStatsResponse
  extends ApiResponse<{
    totalDuels: number;
    wins: number;
    losses: number;
    longestLosingStreak: number;
    currentLosingStreak: number;
    winRate: number;
  }> {}

// Response type for study time update
interface StudyTimeResponse
  extends ApiResponse<{
    message: string;
    totalStudyTime: number;
  }> {}

// Response type for simple message responses
interface MessageResponse extends ApiResponse<{ message: string }> {}

// Response type for token refresh
interface TokenRefreshResponse
  extends ApiResponse<{
    token: string;
    refreshToken: string;
  }> {}

// Response type for user permissions
interface PermissionsResponse
  extends ApiResponse<{
    role: string;
    permissions: string[];
  }> {}

/**
 * Log in a user with email and password
 * @param email User's email
 * @param password User's password
 * @returns Authentication response with user data and token
 * @throws ApiError if authentication fails
 */
export const login = async (
  email: string,
  password: string,
): Promise<AuthResponse> => {
  try {
    const response = await apiRequest<AuthApiResponse>('/auth/login', 'POST', {
      email,
      password,
    });

    if (!response.data || !response.data.token) {
      throw new ApiError('Invalid login response from server', 500);
    }

    // Store the authentication data
    await AsyncStorage.setItem('userToken', response.data.token);
    await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));

    return response.data;
  } catch (error) {
    console.error('Login error:', error);

    // Ensure we're throwing an ApiError
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Authentication failed',
      401,
    );
  }
};

/**
 * Register a new user
 * @param username User's username
 * @param email User's email
 * @param password User's password
 * @returns Authentication response with new user data and token
 * @throws ApiError if registration fails
 */
export const register = async (
  username: string,
  email: string,
  password: string,
): Promise<AuthResponse> => {
  try {
    const response = await apiRequest<AuthApiResponse>(
      '/auth/register',
      'POST',
      {
        username,
        email,
        password,
      },
    );

    if (!response.data || !response.data.token) {
      throw new ApiError('Invalid registration response from server', 500);
    }

    // Store the authentication data
    await AsyncStorage.setItem('userToken', response.data.token);
    await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));

    return response.data;
  } catch (error) {
    console.error('Registration error:', error);

    // Ensure we're throwing an ApiError
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Registration failed',
      400,
    );
  }
};

/**
 * Log out the current user
 * @returns Promise that resolves when logout is complete
 */
export const logout = async (): Promise<void> => {
  try {
    // Call the signout endpoint
    await apiRequest<MessageResponse>('/auth/signout', 'POST');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear local storage regardless of API response
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
  }
};

/**
 * Get the current user's profile
 * @returns User profile data
 * @throws ApiError if retrieval fails
 */
export const getProfile = async (): Promise<User> => {
  try {
    const response = await apiRequest<UserProfileResponse>('/auth/me');

    if (!response.data) {
      throw new ApiError('Invalid user profile response from server', 500);
    }

    return response.data;
  } catch (error) {
    console.error('Get profile error:', error);
    throw error;
  }
};

/**
 * Update the current user's profile
 * @param profileData Partial user data to update
 * @returns Updated user profile
 * @throws ApiError if update fails
 */
export const updateProfile = async (
  profileData: Partial<User>,
): Promise<User> => {
  try {
    const response = await apiRequest<UserProfileResponse>(
      '/users/profile',
      'PUT',
      profileData,
    );

    if (!response.data) {
      throw new ApiError('Invalid profile update response from server', 500);
    }

    // Update stored user data
    const currentUserData = await AsyncStorage.getItem('userData');
    if (currentUserData) {
      const updatedUserData = {
        ...JSON.parse(currentUserData),
        ...response.data,
      };
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
    }

    return response.data;
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
};

/**
 * Get duel statistics for the current user
 * @returns Duel statistics including wins, losses, and streaks
 * @throws ApiError if retrieval fails
 */
export const getDuelStats = async (): Promise<{
  totalDuels: number;
  wins: number;
  losses: number;
  longestLosingStreak: number;
  currentLosingStreak: number;
  winRate: number;
}> => {
  try {
    const response = await apiRequest<DuelStatsResponse>('/users/duel-stats');

    if (!response.data) {
      return {
        totalDuels: 0,
        wins: 0,
        losses: 0,
        longestLosingStreak: 0,
        currentLosingStreak: 0,
        winRate: 0,
      };
    }

    return response.data;
  } catch (error) {
    console.error('Get duel stats error:', error);

    // Return default stats on error
    return {
      totalDuels: 0,
      wins: 0,
      losses: 0,
      longestLosingStreak: 0,
      currentLosingStreak: 0,
      winRate: 0,
    };
  }
};

/**
 * Update the user's study time
 * @param duration Duration to add in seconds
 * @returns Message and updated total study time
 * @throws ApiError if update fails
 */
export const updateStudyTime = async (
  duration: number,
): Promise<{
  message: string;
  totalStudyTime: number;
}> => {
  try {
    const response = await apiRequest<StudyTimeResponse>(
      '/users/study-time',
      'POST',
      { duration },
    );

    if (!response.data) {
      throw new ApiError('Invalid study time update response from server', 500);
    }

    return response.data;
  } catch (error) {
    console.error('Update study time error:', error);
    throw error;
  }
};

/**
 * Request a password reset for a user
 * @param email User's email address
 * @returns Success message
 * @throws ApiError if request fails
 */
export const requestPasswordReset = async (
  email: string,
): Promise<{ message: string }> => {
  try {
    const response = await apiRequest<MessageResponse>(
      '/auth/reset-password',
      'POST',
      { email },
    );

    if (!response.data) {
      return { message: 'Password reset request sent if the email exists' };
    }

    return response.data;
  } catch (error) {
    console.error('Request password reset error:', error);
    // Return a generic message for security reasons
    return { message: 'Password reset request sent if the email exists' };
  }
};

/**
 * Update user's password
 * @param password New password
 * @returns Success message
 * @throws ApiError if update fails
 */
export const updatePassword = async (
  password: string,
): Promise<{ message: string }> => {
  try {
    const response = await apiRequest<MessageResponse>(
      '/auth/update-password',
      'POST',
      { password },
    );

    if (!response.data) {
      throw new ApiError('Invalid password update response from server', 500);
    }

    return response.data;
  } catch (error) {
    console.error('Update password error:', error);
    throw error;
  }
};

/**
 * Refresh the authentication token
 * @param refreshToken Current refresh token
 * @returns New auth token and refresh token
 * @throws ApiError if refresh fails
 */
export const refreshToken = async (
  refreshToken: string,
): Promise<{ token: string; refreshToken: string }> => {
  try {
    const response = await apiRequest<TokenRefreshResponse>(
      '/auth/refresh-token',
      'POST',
      { refreshToken },
    );

    if (!response.data || !response.data.token) {
      throw new ApiError('Invalid token refresh response from server', 500);
    }

    // Update stored token
    await AsyncStorage.setItem('userToken', response.data.token);

    return response.data;
  } catch (error) {
    console.error('Refresh token error:', error);

    // Clear tokens on refresh failure
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');

    throw error;
  }
};

/**
 * Get user permissions and role
 * @returns User role and permissions array
 * @throws ApiError if retrieval fails
 */
export const getUserPermissions = async (): Promise<{
  role: string;
  permissions: string[];
}> => {
  try {
    const response = await apiRequest<PermissionsResponse>('/auth/permissions');

    if (!response.data) {
      return { role: 'user', permissions: [] };
    }

    return response.data;
  } catch (error) {
    console.error('Get user permissions error:', error);
    // Return default permissions on error
    return { role: 'user', permissions: [] };
  }
};
