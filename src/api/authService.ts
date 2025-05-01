import apiRequest from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse, User } from '../types/models';

export const login = async (
  email: string,
  password: string,
): Promise<AuthResponse> => {
  const response = await apiRequest<AuthResponse>('/auth/login', 'POST', {
    email,
    password,
  });

  if (response.token) {
    await AsyncStorage.setItem('userToken', response.token);
    await AsyncStorage.setItem('userData', JSON.stringify(response.user));
  }

  return response;
};

export const register = async (
  username: string,
  email: string,
  password: string,
): Promise<AuthResponse> => {
  const response = await apiRequest<AuthResponse>('/auth/register', 'POST', {
    username,
    email,
    password,
  });

  if (response.token) {
    await AsyncStorage.setItem('userToken', response.token);
    await AsyncStorage.setItem('userData', JSON.stringify(response.user));
  }

  return response;
};

export const logout = async (): Promise<void> => {
  try {
    // Call the signout endpoint
    await apiRequest('/auth/signout', 'POST');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear local storage regardless of API response
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
  }
};

export const getProfile = async (): Promise<User> => {
  return await apiRequest<User>('/auth/me');
};

export const updateProfile = async (
  profileData: Partial<User>,
): Promise<User> => {
  return await apiRequest<User>('/users/profile', 'PUT', profileData);
};

export const getDuelStats = async (): Promise<{
  totalDuels: number;
  wins: number;
  losses: number;
  longestLosingStreak: number;
  currentLosingStreak: number;
  winRate: number;
}> => {
  return await apiRequest('/users/duel-stats');
};

export const updateStudyTime = async (
  duration: number,
): Promise<{
  message: string;
  totalStudyTime: number;
}> => {
  return await apiRequest('/users/study-time', 'POST', { duration });
};

export const requestPasswordReset = async (
  email: string,
): Promise<{ message: string }> => {
  return await apiRequest('/auth/reset-password', 'POST', { email });
};

export const updatePassword = async (
  password: string,
): Promise<{ message: string }> => {
  return await apiRequest('/auth/update-password', 'POST', { password });
};

export const refreshToken = async (
  refreshToken: string,
): Promise<{ token: string; refreshToken: string }> => {
  return await apiRequest('/auth/refresh-token', 'POST', { refreshToken });
};

export const getUserPermissions = async (): Promise<{
  role: string;
  permissions: string[];
}> => {
  return await apiRequest('/auth/permissions');
};
