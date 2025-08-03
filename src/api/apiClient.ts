import API_URL from '../config/api.config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiResponse } from '../types/api';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const getBuildType = (): 'expo-go' | 'eas-build' => {
  if (Constants.appOwnership === 'expo') {
    return 'expo-go';
  }
  if (__DEV__ && Constants.expoConfig?.hostUri?.includes('localhost')) {
    return 'expo-go';
  }
  if (__DEV__ && Platform.OS === 'ios' && !Constants.executionEnvironment) {
    return 'expo-go';
  }
  return 'eas-build';
};

const getAppScheme = (): string => {
  const buildType = getBuildType();
  if (buildType === 'expo-go') {
    return 'https://auth.expo.io/@dusapptr/dus-app';
  }
  return Platform.OS === 'ios' ? 'com.dortac.dusfrontend://' : 'dus-app://';
};

const apiRequest = async <TData>(
  endpoint: string,
  method: HttpMethod = 'GET',
  body: any = null,
): Promise<ApiResponse<TData>> => {
  try {
    console.log(`Making ${method} request to ${endpoint}`);
    let token = await AsyncStorage.getItem('userToken');
    const buildType = getBuildType();
    const appScheme = getAppScheme();

    if (endpoint.includes('/auth/oauth/')) {
      console.log('OAuth Request Debug:', {
        buildType,
        appScheme,
        endpoint,
        'Constants.appOwnership': Constants.appOwnership,
        'Constants.expoConfig?.hostUri': Constants.expoConfig?.hostUri,
        __DEV__: __DEV__,
        'Platform.OS': Platform.OS,
      });
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Build-Type': buildType,
      'X-App-Scheme': appScheme,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = { method, headers };
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(body);
    }

    const url =
      method === 'GET' && !endpoint.includes('_t=')
        ? `${API_URL}${endpoint}${
            endpoint.includes('?') ? '&' : '?'
          }_t=${Date.now()}`
        : `${API_URL}${endpoint}`;

    let response = await fetch(url, config);
    let responseData: any;
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      responseData = await response.json();
    } else {
      const textResponse = await response.text();
      try {
        responseData = JSON.parse(textResponse);
      } catch (e) {
        responseData = response.ok
          ? textResponse
          : { message: textResponse || 'Non-JSON error response' };
      }
    }

    console.log(`Response for ${endpoint}:`, {
      status: response.status,
      ok: response.ok,
      contentType,
      responseDataPreview: JSON.stringify(responseData).substring(0, 250),
    });

    // SIMPLIFIED: For Supabase tokens, 401 means user needs to re-login
    // Don't try to refresh automatically - just clear session
    if (response.status === 401) {
      console.log('Received 401 - token expired, clearing session');
      await AsyncStorage.multiRemove([
        'userToken',
        'refreshToken',
        'userData',
        'authToken',
      ]);
      throw new ApiError('Session expired. Please login again.', 401);
    }

    if (!response.ok) {
      const errorMessage =
        responseData?.message ||
        responseData?.error ||
        `API Error: ${response.status}`;
      throw new ApiError(errorMessage, response.status);
    }

    if (
      typeof responseData === 'object' &&
      responseData !== null &&
      responseData.status === 'success' &&
      responseData.data !== undefined
    ) {
      return responseData as ApiResponse<TData>;
    } else {
      return { status: 'success', data: responseData as TData };
    }
  } catch (error) {
    console.error(`API Request Error (${endpoint}):`, error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Network request failed',
      0,
    );
  }
};

export const oauthAPI = {
  async startOAuth(
    provider: 'google' | 'apple' | 'facebook',
  ): Promise<{ url: string }> {
    try {
      console.log(`Starting OAuth flow for ${provider}`);
      const response = await apiRequest<{ message: string; url: string }>(
        `/auth/oauth/${provider}`,
        'GET',
      );
      if (!response.data || !response.data.url) {
        throw new Error(`Failed to get OAuth URL for ${provider}`);
      }
      return { url: response.data.url };
    } catch (error) {
      console.error(`OAuth ${provider} start error:`, error);
      if (error instanceof ApiError) throw error;
      throw new Error(`Failed to start ${provider} OAuth`);
    }
  },

  async appleSignIn(data: {
    id_token: string;
    nonce?: string;
    user?: { name?: { firstName?: string; lastName?: string }; email?: string };
  }): Promise<any> {
    try {
      console.log('Apple Sign In with ID token');
      const response = await apiRequest<any>('/auth/apple', 'POST', data);
      if (!response.data) {
        throw new Error('No data received from Apple Sign In');
      }
      return response.data;
    } catch (error) {
      console.error('Apple Sign In error:', error);
      if (error instanceof ApiError) throw error;
      throw new Error('Apple Sign In failed');
    }
  },
};

export default apiRequest;
