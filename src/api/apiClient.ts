import API_URL from '../config/api.config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiResponse } from '../types/api'; // Make sure this path and interface are correct
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Extended Error class that includes HTTP status code
 */
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * List of endpoints that should not trigger token refresh attempts if they themselves fail with 401.
 * These are typically authentication-related endpoints.
 */
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

/**
 * Detect build type for OAuth redirects
 */
const getBuildType = (): 'expo-go' | 'eas-build' => {
  // In Expo Go, __DEV__ is true and we can detect Expo Go environment
  if (__DEV__ && Platform.OS === 'ios') {
    // Additional check for Expo Go vs EAS Development build
    return 'expo-go';
  }
  return 'eas-build';
};

/**
 * Get appropriate app scheme for current build
 */
const getAppScheme = (): string => {
  const buildType = getBuildType();
  if (buildType === 'expo-go') {
    return 'exp://localhost:19000://';
  }
  // For EAS builds, use the custom scheme from app.json
  return Platform.OS === 'ios'
    ? 'com.dortac.dusfrontend://'
    : 'com.dusapptr.dusapp://';
};

/**
 * Function to refresh the authentication token (internal to apiClient for retries)
 * @returns Promise with new access token or null if refresh fails
 */
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

    const response = await fetch(refreshUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Build-Type': getBuildType(),
        'X-App-Scheme': getAppScheme(),
      },
      body: JSON.stringify({ refreshToken: refreshToken }),
    });

    const responseData = await response.json();

    let newAccessToken: string | undefined;
    let newRefreshTokenFromResponse: string | undefined;

    // Try common patterns for token response structures
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
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('userData');
      console.log(
        'apiClient.refreshAuthTokenInternal: Cleared tokens due to refresh failure.',
      );
      return null;
    }

    await AsyncStorage.setItem('userToken', newAccessToken);
    if (newRefreshTokenFromResponse) {
      await AsyncStorage.setItem('refreshToken', newRefreshTokenFromResponse);
      console.log(
        'apiClient.refreshAuthTokenInternal: New refresh token stored.',
      );
    }

    console.log(
      'apiClient.refreshAuthTokenInternal: Token refreshed successfully.',
    );
    return newAccessToken;
  } catch (error) {
    console.error(
      'apiClient.refreshAuthTokenInternal: Error during token refresh:',
      error,
    );
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('userData');
    console.log(
      'apiClient.refreshAuthTokenInternal: Cleared tokens due to error during refresh.',
    );
    return null;
  }
};

/**
 * Function to make typed API requests.
 * It wraps the actual backend response in an ApiResponse structure if the backend doesn't provide it.
 *
 * @template TData - The expected type of the 'data' field in the successful ApiResponse.
 * @param {string} endpoint - The API endpoint to call (without base URL)
 * @param {HttpMethod} method - The HTTP method to use
 * @param {any} body - The data to send in the request body (for POST, PUT, PATCH)
 * @returns {Promise<ApiResponse<TData>>} - A promise that resolves to the ApiResponse object.
 * @throws {ApiError} - If the API returns an error or the request fails.
 */
const apiRequest = async <TData>(
  endpoint: string,
  method: HttpMethod = 'GET',
  body: any = null,
): Promise<ApiResponse<TData>> => {
  try {
    console.log(`Making ${method} request to ${endpoint}`);

    let token = await AsyncStorage.getItem('userToken');
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Build-Type': getBuildType(),
      'X-App-Scheme': getAppScheme(),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method,
      headers,
    };

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

    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      const textResponse = await response.text();
      try {
        responseData = JSON.parse(textResponse);
      } catch (e) {
        if (response.ok) {
          responseData = textResponse;
        } else {
          responseData = { message: textResponse || 'Non-JSON error response' };
        }
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
        console.log(
          `Auth endpoint ${endpoint} returned 401. Not attempting token refresh.`,
        );
        const errorMessage =
          responseData?.message ||
          responseData?.error ||
          'Authentication failed on auth endpoint.';
        throw new ApiError(errorMessage, response.status);
      }

      console.log(
        `Unauthorized for ${endpoint} - attempting to refresh token (via apiClient.refreshAuthTokenInternal)`,
      );
      const newToken = await refreshAuthTokenInternal();

      if (newToken) {
        console.log(`Token refreshed, retrying ${endpoint}`);
        const newHeaders = {
          ...headers,
          Authorization: `Bearer ${newToken}`,
          'X-Build-Type': getBuildType(),
          'X-App-Scheme': getAppScheme(),
        };
        const retryConfig = { ...config, headers: newHeaders };

        response = await fetch(url, retryConfig);

        const retryContentType = response.headers.get('content-type');
        if (retryContentType && retryContentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          const retryTextResponse = await response.text();
          try {
            responseData = JSON.parse(retryTextResponse);
          } catch (e) {
            if (response.ok) {
              responseData = retryTextResponse;
            } else {
              responseData = {
                message:
                  retryTextResponse || 'Non-JSON error response on retry',
              };
            }
          }
        }

        console.log(`Retry response for ${endpoint}:`, {
          status: response.status,
          ok: response.ok,
          contentType: retryContentType,
          responseDataPreview: JSON.stringify(responseData).substring(0, 250),
        });

        if (response.status === 401) {
          console.log(
            `Retry for ${endpoint} also resulted in 401. Clearing session.`,
          );
          await AsyncStorage.removeItem('userToken');
          await AsyncStorage.removeItem('refreshToken');
          await AsyncStorage.removeItem('userData');
          throw new ApiError('Session expired. Please login again.', 401);
        }
      } else {
        console.log(`Token refresh failed for ${endpoint}. Clearing session.`);
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

    // Standardize successful response to always be ApiResponse<TData>
    if (
      typeof responseData === 'object' &&
      responseData !== null &&
      responseData.status === 'success' &&
      responseData.data !== undefined
    ) {
      return responseData as ApiResponse<TData>;
    } else {
      return {
        status: 'success',
        data: responseData as TData,
      };
    }
  } catch (error) {
    console.error(`API Request Error (${endpoint}):`, error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error
        ? error.message
        : 'Network request failed or an unknown error occurred',
      0,
    );
  }
};

/**
 * OAuth related API functions
 */
export const oauthAPI = {
  /**
   * Start OAuth flow for a provider
   */
  async startOAuth(
    provider: 'google' | 'apple' | 'facebook',
  ): Promise<{ url: string }> {
    try {
      console.log(`Starting OAuth flow for ${provider}`);
      const response = await apiRequest<{ message: string; url: string }>(
        `/auth/oauth/${provider}`,
        'GET',
      );

      // Fix: Check if response.data exists and has url property
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

  /**
   * Handle Apple Sign In with ID token (for native Apple Sign In)
   */
  async appleSignIn(data: {
    id_token: string;
    nonce?: string;
    user?: {
      name?: {
        firstName?: string;
        lastName?: string;
      };
      email?: string;
    };
  }): Promise<any> {
    try {
      console.log('Apple Sign In with ID token');
      const response = await apiRequest<any>('/auth/apple', 'POST', data);

      // Fix: Check if response.data exists
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

  /**
   * Handle OAuth callback (used when app receives deep link)
   */
  async handleOAuthCallback(token: string): Promise<any> {
    try {
      // Decode the session token from the callback
      const sessionData = JSON.parse(atob(token));

      if (sessionData.access_token) {
        await AsyncStorage.setItem('userToken', sessionData.access_token);
      }

      if (sessionData.refresh_token) {
        await AsyncStorage.setItem('refreshToken', sessionData.refresh_token);
      }

      if (sessionData.user) {
        await AsyncStorage.setItem(
          'userData',
          JSON.stringify(sessionData.user),
        );
      }

      return sessionData;
    } catch (error) {
      console.error('OAuth callback handling error:', error);
      throw new Error('Failed to process OAuth callback');
    }
  },
};

export default apiRequest;
