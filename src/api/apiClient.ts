import API_URL from '../config/api.config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiResponse } from '../types/api'; // Make sure this path and interface are correct

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
  '/auth/signout', // Added signout as it's auth related
];

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
      },
      body: JSON.stringify({ refreshToken: refreshToken }), // Or { "refresh_token": refreshToken } if backend expects that
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
      newRefreshTokenFromResponse = responseData.refresh_token; // Or responseData.newRefreshToken etc.
    } else if (responseData.data && responseData.data.token) {
      // e.g. if wrapped in { data: { token: ..., refreshToken: ...} }
      newAccessToken = responseData.data.token;
      newRefreshTokenFromResponse = responseData.data.refreshToken;
    }
    // Add more specific checks here if your backend uses a different structure

    if (!response.ok || !newAccessToken) {
      console.log(
        'apiClient.refreshAuthTokenInternal: Token refresh failed. Response:',
        { status: response.status, data: responseData },
      );
      // If refresh fails (e.g. refresh token expired/invalid), clear all tokens to force re-login
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
      method === 'GET' && !endpoint.includes('_t=') // Avoid adding _t if already present (e.g. during retry)
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
        // If not JSON or parsing failed, and response was ok, treat text as data
        // If response was not ok, text will be used for error message
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
      const cleanEndpoint = endpoint.split('?')[0]; // Remove query params for matching

      // If the 401 is from an auth endpoint itself (login, refresh), don't try to refresh.
      // This usually means credentials are bad or the refresh token is invalid.
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

      // For other endpoints, attempt to refresh the token
      console.log(
        `Unauthorized for ${endpoint} - attempting to refresh token (via apiClient.refreshAuthTokenInternal)`,
      );
      const newToken = await refreshAuthTokenInternal();

      if (newToken) {
        console.log(`Token refreshed, retrying ${endpoint}`);
        // Update headers with the new token
        const newHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
        const retryConfig = { ...config, headers: newHeaders };

        // Retry the request
        response = await fetch(url, retryConfig); // Use original url (might include _t from first attempt)

        // Re-process response data for the retry
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

        // If retry still fails with 401, or another error, it will be caught by the !response.ok check below
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
        // Refresh token failed (newToken is null)
        console.log(`Token refresh failed for ${endpoint}. Clearing session.`);
        // Tokens would have been cleared by refreshAuthTokenInternal already
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
    // If backend already returns { status: 'success', data: ... }, use its data.
    // Otherwise, wrap the raw responseData.
    if (
      typeof responseData === 'object' &&
      responseData !== null &&
      responseData.status === 'success' &&
      responseData.data !== undefined
    ) {
      return responseData as ApiResponse<TData>; // Backend already provided the ApiResponse structure
    } else {
      // Backend provided raw data, wrap it.
      return {
        status: 'success',
        data: responseData as TData, // Assume responseData is of type TData
      };
    }
  } catch (error) {
    console.error(`API Request Error (${endpoint}):`, error);
    if (error instanceof ApiError) {
      throw error;
    }
    // For network errors or other unexpected issues
    throw new ApiError(
      error instanceof Error
        ? error.message
        : 'Network request failed or an unknown error occurred',
      0, // 0 status for client-side/network errors
    );
  }
};

export default apiRequest;
