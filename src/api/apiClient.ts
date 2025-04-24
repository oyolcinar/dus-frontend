import API_URL from '../config/api.config';
import AsyncStorage from '@react-native-async-storage/async-storage';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface ApiError extends Error {
  status?: number;
}

const apiRequest = async <T>(
  endpoint: string,
  method: HttpMethod = 'GET',
  data: any = null,
): Promise<T> => {
  try {
    const token = await AsyncStorage.getItem('userToken');

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
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

    const response = await fetch(`${API_URL}${endpoint}`, config);

    // Handle unauthorized responses
    if (response.status === 401) {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      const error = new Error(
        'Session expired. Please login again.',
      ) as ApiError;
      error.status = 401;
      throw error;
    }

    const responseData = await response.json();

    if (!response.ok) {
      const error = new Error(
        responseData.message || 'Something went wrong',
      ) as ApiError;
      error.status = response.status;
      throw error;
    }

    return responseData as T;
  } catch (error) {
    console.error(`API Request Error (${endpoint}):`, error);
    throw error;
  }
};

export default apiRequest;
