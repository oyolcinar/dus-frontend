import apiRequest from './apiClient';
import { Friend, FriendRequest } from '../types/models';

export const sendFriendRequest = async (
  friendId: number,
): Promise<{
  message: string;
  request: FriendRequest;
}> => {
  return await apiRequest('/friends/request', 'POST', { friendId });
};

export const getUserFriends = async (): Promise<Friend[]> => {
  return await apiRequest<Friend[]>('/friends');
};

export const getPendingRequests = async (): Promise<FriendRequest[]> => {
  return await apiRequest<FriendRequest[]>('/friends/requests');
};

export const acceptRequest = async (
  friendId: number,
): Promise<{ message: string }> => {
  return await apiRequest<{ message: string }>(
    `/friends/${friendId}/accept`,
    'POST',
  );
};

export const rejectRequest = async (
  friendId: number,
): Promise<{ message: string }> => {
  return await apiRequest<{ message: string }>(
    `/friends/${friendId}/reject`,
    'POST',
  );
};

export const removeFriend = async (
  friendId: number,
): Promise<{ message: string }> => {
  return await apiRequest<{ message: string }>(
    `/friends/${friendId}`,
    'DELETE',
  );
};
