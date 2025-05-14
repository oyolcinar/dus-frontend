// src/api/apiClient.ts
import API_URL from '../config/api.config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiResponse, ErrorResponse } from '../types/api';

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
 * Function to make typed API requests that returns data in a consistent format
 *
 * @template T - The expected response type
 * @param {string} endpoint - The API endpoint to call (without base URL)
 * @param {HttpMethod} method - The HTTP method to use
 * @param {any} data - The data to send in the request body (for POST, PUT, PATCH)
 * @returns {Promise<T>} - A promise that resolves to the response data
 * @throws {ApiError} - If the API returns an error or the request fails
 */
const apiRequest = async <T>(
  endpoint: string,
  method: HttpMethod = 'GET',
  data: any = null,
): Promise<T> => {
  try {
    const token = await AsyncStorage.getItem('userToken');

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

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data);
    }

    // Add a timestamp to prevent caching for GET requests
    const url =
      method === 'GET'
        ? `${API_URL}${endpoint}${
            endpoint.includes('?') ? '&' : '?'
          }_t=${Date.now()}`
        : `${API_URL}${endpoint}`;

    const response = await fetch(url, config);

    // Handle JSON parsing with error handling
    let responseData: any;
    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      // Handle non-JSON responses
      const textResponse = await response.text();
      try {
        // Try to parse as JSON anyway in case content-type is wrong
        responseData = JSON.parse(textResponse);
      } catch (e) {
        // If not JSON, create a simple object with the text
        responseData = {
          status: response.ok ? 'success' : 'error',
          message: textResponse,
          data: textResponse,
        };
      }
    }

    // Handle unauthorized responses
    if (response.status === 401) {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      throw new ApiError('Session expired. Please login again.', 401);
    }

    // Handle other error responses
    if (!response.ok) {
      const errorMessage =
        responseData.message || responseData.error || 'Something went wrong';
      throw new ApiError(errorMessage, response.status);
    }

    // If we have a proper API response format already, return it as is
    if (
      typeof responseData === 'object' &&
      (responseData.status === 'success' || responseData.data !== undefined)
    ) {
      return responseData as T;
    }

    // Otherwise, wrap the response in our standard API response format
    const wrappedResponse: ApiResponse<any> = {
      status: 'success',
      data: responseData,
    };

    return wrappedResponse as unknown as T;
  } catch (error) {
    console.error(`API Request Error (${endpoint}):`, error);

    // Rethrow ApiError instances as they're already properly formatted
    if (error instanceof ApiError) {
      throw error;
    }

    // For other errors (like network errors), create a new ApiError
    throw new ApiError(
      error instanceof Error ? error.message : 'Network request failed',
      0, // Use 0 to indicate a client-side error rather than an HTTP status code
    );
  }
};

export default apiRequest;
