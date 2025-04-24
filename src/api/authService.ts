import apiRequest from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse, User } from '../types/models';

export const login = async (
  email: string,
  password: string,
): Promise<AuthResponse> => {
  const response = await apiRequest<AuthResponse>('/users/login', 'POST', {
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
  const response = await apiRequest<AuthResponse>('/users/register', 'POST', {
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
  await AsyncStorage.removeItem('userToken');
  await AsyncStorage.removeItem('userData');
};

export const getProfile = async (): Promise<User> => {
  return await apiRequest<User>('/users/profile');
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
