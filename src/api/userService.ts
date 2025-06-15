// src/api/userService.ts

import apiRequest from './apiClient';
import { User } from '../types/models';

/**
 * Searches for a user by their exact username.
 * This will use the backend's GET /users/search?query=... endpoint.
 *
 * @param username The username to search for.
 * @returns A promise that resolves to the User object if an exact match is found, otherwise null.
 */
export const searchUserByUsername = async (
  username: string,
): Promise<User | null> => {
  // We need to handle the case where the username might contain special characters
  const encodedUsername = encodeURIComponent(username);

  try {
    // Make the API call to the search endpoint provided by your backend
    const response = await apiRequest<User[]>(
      `/users/search?query=${encodedUsername}`,
    );

    // The backend returns an array of users. We need to find the exact match.
    const users = response.data;
    if (users && users.length > 0) {
      // Find the user whose username is an exact case-insensitive match
      const exactMatch = users.find(
        (user) => user.username.toLowerCase() === username.toLowerCase(),
      );
      return exactMatch || null;
    }

    // If no users are returned, there's no match
    return null;
  } catch (error) {
    // apiRequest will throw for 4xx/5xx errors. We can safely assume "not found".
    console.error(`Error searching for user '${username}':`, error);
    return null;
  }
};
