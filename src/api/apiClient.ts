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

const AUTH_ENDPOINTS_NO_RETRY = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh-token',
  '/auth/signout',
  '/auth/oauth/google',
  '/auth/oauth/apple',
  '/auth/oauth/facebook',
  '/auth/apple',
];

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

const refreshAuthTokenInternal = async (): Promise<string | null> => {
  try {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (!refreshToken) {
      console.log(
        'apiClient.refreshAuthTokenInternal: No refresh token available in AsyncStorage.',
      );
      return null;
    }

    console.log(
      'apiClient.refreshAuthTokenInternal: Attempting to refresh token.',
    );
    const refreshUrl = `${API_URL}/auth/refresh-token`;
    const buildType = getBuildType();
    const appScheme = getAppScheme();

    const response = await fetch(refreshUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Build-Type': buildType,
        'X-App-Scheme': appScheme,
      },
      body: JSON.stringify({ refreshToken: refreshToken }),
    });

    const responseData = await response.json();

    let newAccessToken: string | undefined;
    let newRefreshTokenFromResponse: string | undefined;

    if (responseData.session && responseData.session.access_token) {
      newAccessToken = responseData.session.access_token;
      newRefreshTokenFromResponse = responseData.session.refresh_token;
    } else if (responseData.access_token) {
      newAccessToken = responseData.access_token;
      newRefreshTokenFromResponse = responseData.refresh_token;
    } else if (responseData.data && responseData.data.token) {
      newAccessToken = responseData.data.token;
      newRefreshTokenFromResponse = responseData.data.refreshToken;
    }

    if (!response.ok || !newAccessToken) {
      console.log(
        'apiClient.refreshAuthTokenInternal: Token refresh failed. Response:',
        { status: response.status, data: responseData },
      );
      await AsyncStorage.multiRemove(['userToken', 'refreshToken', 'userData']);
      return null;
    }

    await AsyncStorage.setItem('userToken', newAccessToken);
    if (newRefreshTokenFromResponse) {
      await AsyncStorage.setItem('refreshToken', newRefreshTokenFromResponse);
    }
    return newAccessToken;
  } catch (error) {
    console.error(
      'apiClient.refreshAuthTokenInternal: Error during token refresh:',
      error,
    );
    await AsyncStorage.multiRemove(['userToken', 'refreshToken', 'userData']);
    return null;
  }
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

    if (response.status === 401) {
      const cleanEndpoint = endpoint.split('?')[0];
      if (AUTH_ENDPOINTS_NO_RETRY.includes(cleanEndpoint)) {
        throw new ApiError(
          responseData?.message || 'Authentication failed',
          response.status,
        );
      }

      const newToken = await refreshAuthTokenInternal();
      if (newToken) {
        console.log(`Token refreshed, retrying ${endpoint}`);
        const newHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
        const retryConfig = { ...config, headers: newHeaders };
        response = await fetch(url, retryConfig);

        const retryContentType = response.headers.get('content-type');
        responseData = retryContentType?.includes('application/json')
          ? await response.json()
          : await response.text();

        if (response.status === 401) {
          await AsyncStorage.multiRemove([
            'userToken',
            'refreshToken',
            'userData',
          ]);
          throw new ApiError('Session expired. Please login again.', 401);
        }
      } else {
        throw new ApiError('Session expired. Please login again.', 401);
      }
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

  // REMOVED: The `handleOAuthCallback` function was here. It is now obsolete because
  // the logic is correctly handled directly within the AuthContext's deep link listener.
};

export default apiRequest;
