import apiRequest from './apiClient';
import { Friend, FriendRequest, User } from '../types/models'; // Assuming User might be useful or for consistency
// ApiResponse is implicitly handled by apiRequest

// --- Define interfaces for the *actual data payloads* your backend sends ---
// --- These will be the TData in apiRequest<TData> ---

// For POST /friends/request
interface SendFriendRequestPayload {
  message: string;
  request: FriendRequest; // FriendRequest should include details like requester_id, receiver_id, status, created_at
}

// For GET /friends
type FriendsPayload = Friend[]; // Array of Friend objects

// For GET /friends/requests
type FriendRequestsPayload = FriendRequest[]; // Array of FriendRequest objects

// For POST /friends/:friendId/accept, POST /friends/:friendId/reject, DELETE /friends/:friendId
interface FriendActionPayload {
  message: string;
  // Optionally, the backend might return the updated Friend or FriendRequest object
  friend?: Friend;
  request?: FriendRequest;
}

// For GET /friends/suggestions
interface FriendSuggestionPayload {
  userId: number;
  username: string;
  email?: string;
  commonFriends: number;
  mutualInterests?: string[]; // Array of strings representing interests
}
type FriendSuggestionsListPayload = FriendSuggestionPayload[];

// For GET /friends/search
interface SearchedUserPayload {
  userId: number;
  username: string;
  email?: string;
  isFriend: boolean;
  hasPendingRequest: boolean; // Could mean request sent by current user OR received by current user
}
type SearchedUsersListPayload = SearchedUserPayload[];

// For GET /friends/status/:userId
interface FriendshipStatusPayload {
  areFriends: boolean;
  pendingRequest: boolean; // Generic pending flag
  requestSent: boolean; // True if current user sent a request to this userId that is pending
  requestReceived: boolean; // True if current user received a request from this userId that is pending
  since?: string; // Date they became friends, if areFriends is true
}

// --- Service Functions ---

export const sendFriendRequest = async (
  friendId: number,
): Promise<SendFriendRequestPayload> => {
  const response = await apiRequest<SendFriendRequestPayload>(
    '/friends/request',
    'POST',
    { friendId },
  );
  if (!response.data) {
    throw new Error(
      'Failed to send friend request: No data returned from server.',
    );
  }
  return response.data;
};

export const getUserFriends = async (): Promise<FriendsPayload> => {
  const response = await apiRequest<FriendsPayload>('/friends');
  return response.data || [];
};

export const getPendingRequests = async (): Promise<FriendRequestsPayload> => {
  const response = await apiRequest<FriendRequestsPayload>('/friends/requests');
  return response.data || [];
};

export const acceptRequest = async (
  friendId: number,
): Promise<FriendActionPayload> => {
  const response = await apiRequest<FriendActionPayload>(
    `/friends/${friendId}/accept`,
    'POST',
  );
  if (!response.data || !response.data.message) {
    return { message: 'Friend request accepted successfully.' };
  }
  return response.data;
};

export const rejectRequest = async (
  friendId: number,
): Promise<FriendActionPayload> => {
  const response = await apiRequest<FriendActionPayload>(
    `/friends/${friendId}/reject`,
    'POST',
  );
  if (!response.data || !response.data.message) {
    return { message: 'Friend request rejected successfully.' };
  }
  return response.data;
};

export const removeFriend = async (
  friendId: number,
): Promise<FriendActionPayload> => {
  const response = await apiRequest<FriendActionPayload>(
    `/friends/${friendId}`,
    'DELETE',
  );
  if (!response.data || !response.data.message) {
    return { message: 'Friend removed successfully.' };
  }
  return response.data;
};

export const getFriendSuggestions = async (
  limit: number = 10,
): Promise<FriendSuggestionsListPayload> => {
  const response = await apiRequest<FriendSuggestionsListPayload>(
    `/friends/suggestions?limit=${limit}`,
  );
  return response.data || [];
};

export const searchUsers = async (
  query: string,
): Promise<SearchedUsersListPayload> => {
  const response = await apiRequest<SearchedUsersListPayload>(
    `/friends/search?query=${encodeURIComponent(query)}`,
  );
  return response.data || [];
};

export const getFriendshipStatus = async (
  userId: number,
): Promise<FriendshipStatusPayload> => {
  try {
    const response = await apiRequest<FriendshipStatusPayload>(
      `/friends/status/${userId}`,
    );
    if (!response.data || typeof response.data !== 'object') {
      console.warn(
        `No friendship status data for user ${userId}, returning defaults.`,
      );
      return {
        areFriends: false,
        pendingRequest: false,
        requestSent: false,
        requestReceived: false,
      };
    }
    // Ensure all boolean fields are explicitly booleans
    return {
      areFriends: !!response.data.areFriends,
      pendingRequest: !!response.data.pendingRequest,
      requestSent: !!response.data.requestSent,
      requestReceived: !!response.data.requestReceived,
      since: response.data.since, // since can be undefined
    };
  } catch (error: any) {
    if (error.status === 404) {
      console.warn(`Friendship status for user ${userId} not found (404).`);
    } else {
      console.error(
        `Error fetching friendship status for user ${userId}:`,
        error,
      );
    }
    // Return a default structure on error
    return {
      areFriends: false,
      pendingRequest: false,
      requestSent: false,
      requestReceived: false,
    };
  }
};
