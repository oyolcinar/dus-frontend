// src/api/friendService.ts
import apiRequest from './apiClient';
import { Friend, FriendRequest } from '../types/models';
import { ApiResponse } from '../types/api';

// Response interfaces for friend endpoints
interface SendFriendRequestResponse
  extends ApiResponse<{
    message: string;
    request: FriendRequest;
  }> {}

interface GetFriendsResponse extends ApiResponse<Friend[]> {}

interface GetFriendRequestsResponse extends ApiResponse<FriendRequest[]> {}

interface FriendActionResponse extends ApiResponse<{ message: string }> {}

/**
 * Send a friend request to another user
 * @param friendId ID of the user to send the request to
 * @returns Friend request with success message
 */
export const sendFriendRequest = async (
  friendId: number,
): Promise<{
  message: string;
  request: FriendRequest;
}> => {
  const response = await apiRequest<SendFriendRequestResponse>(
    '/friends/request',
    'POST',
    { friendId },
  );

  if (!response.data) {
    throw new Error('Failed to send friend request');
  }

  return response.data;
};

/**
 * Get all friends of the current user
 * @returns Array of friends
 */
export const getUserFriends = async (): Promise<Friend[]> => {
  const response = await apiRequest<GetFriendsResponse>('/friends');
  return response.data || [];
};

/**
 * Get all pending friend requests for the current user
 * @returns Array of friend requests
 */
export const getPendingRequests = async (): Promise<FriendRequest[]> => {
  const response = await apiRequest<GetFriendRequestsResponse>(
    '/friends/requests',
  );
  return response.data || [];
};

/**
 * Accept a friend request
 * @param friendId ID of the user whose request to accept
 * @returns Success message
 */
export const acceptRequest = async (
  friendId: number,
): Promise<{ message: string }> => {
  const response = await apiRequest<FriendActionResponse>(
    `/friends/${friendId}/accept`,
    'POST',
  );

  if (!response.data) {
    return { message: 'Friend request accepted successfully' };
  }

  return response.data;
};

/**
 * Reject a friend request
 * @param friendId ID of the user whose request to reject
 * @returns Success message
 */
export const rejectRequest = async (
  friendId: number,
): Promise<{ message: string }> => {
  const response = await apiRequest<FriendActionResponse>(
    `/friends/${friendId}/reject`,
    'POST',
  );

  if (!response.data) {
    return { message: 'Friend request rejected successfully' };
  }

  return response.data;
};

/**
 * Remove a user from friends list
 * @param friendId ID of the friend to remove
 * @returns Success message
 */
export const removeFriend = async (
  friendId: number,
): Promise<{ message: string }> => {
  const response = await apiRequest<FriendActionResponse>(
    `/friends/${friendId}`,
    'DELETE',
  );

  if (!response.data) {
    return { message: 'Friend removed successfully' };
  }

  return response.data;
};

/**
 * Get friend suggestions for the current user
 * @param limit Maximum number of suggestions to return (default: 10)
 * @returns Array of suggested users
 */
export const getFriendSuggestions = async (
  limit: number = 10,
): Promise<
  Array<{
    userId: number;
    username: string;
    email?: string;
    commonFriends: number;
    mutualInterests?: string[];
  }>
> => {
  const response = await apiRequest<
    ApiResponse<
      Array<{
        userId: number;
        username: string;
        email?: string;
        commonFriends: number;
        mutualInterests?: string[];
      }>
    >
  >(`/friends/suggestions?limit=${limit}`);

  return response.data || [];
};

/**
 * Search for users to add as friends
 * @param query Search query (username or email)
 * @returns Array of matching users
 */
export const searchUsers = async (
  query: string,
): Promise<
  Array<{
    userId: number;
    username: string;
    email?: string;
    isFriend: boolean;
    hasPendingRequest: boolean;
  }>
> => {
  const response = await apiRequest<
    ApiResponse<
      Array<{
        userId: number;
        username: string;
        email?: string;
        isFriend: boolean;
        hasPendingRequest: boolean;
      }>
    >
  >(`/friends/search?query=${encodeURIComponent(query)}`);

  return response.data || [];
};

/**
 * Check friendship status with another user
 * @param userId ID of the user to check status with
 * @returns Friendship status details
 */
export const getFriendshipStatus = async (
  userId: number,
): Promise<{
  areFriends: boolean;
  pendingRequest: boolean;
  requestSent: boolean;
  requestReceived: boolean;
  since?: string;
}> => {
  const response = await apiRequest<
    ApiResponse<{
      areFriends: boolean;
      pendingRequest: boolean;
      requestSent: boolean;
      requestReceived: boolean;
      since?: string;
    }>
  >(`/friends/status/${userId}`);

  if (!response.data) {
    return {
      areFriends: false,
      pendingRequest: false,
      requestSent: false,
      requestReceived: false,
    };
  }

  return response.data;
};
