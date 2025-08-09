// src/hooks/useFriendsData.ts - CLEAN FRIENDS DATA HOOK WITHOUT CONFLICTS
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import {
  sendFriendRequest,
  getUserFriends,
  getPendingRequests,
  acceptRequest,
  rejectRequest,
  removeFriend,
  getFriendSuggestions,
  searchUsers,
  getFriendshipStatus,
} from '../api/friendService';
import type { Friend, FriendRequest } from '../types/models';

// ===============================
// INTERFACES - Only new ones, no conflicts
// ===============================

// Friends statistics interface
export interface FriendsStats {
  totalFriends: number;
  pendingRequestsCount: number;
  recentlyAddedCount: number;
  weeklyNewFriends: number;
}

// ===============================
// INDIVIDUAL DATA HOOKS
// ===============================

// Hook for friends list
export function useFriendsList() {
  return useQuery({
    queryKey: ['friends-list'],
    queryFn: async (): Promise<Friend[]> => {
      console.log('🔄 Fetching friends list...');
      try {
        const friends = await getUserFriends();
        console.log('✅ Friends list fetched:', friends?.length || 0);
        return friends || [];
      } catch (error) {
        console.error('❌ Error fetching friends list:', error);
        return [];
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: true,
  });
}

// Hook for pending requests
export function usePendingFriendRequests() {
  return useQuery({
    queryKey: ['pending-friend-requests'],
    queryFn: async (): Promise<FriendRequest[]> => {
      console.log('🔄 Fetching pending friend requests...');
      try {
        const requests = await getPendingRequests();
        console.log('✅ Pending requests fetched:', requests?.length || 0);
        return requests || [];
      } catch (error) {
        console.error('❌ Error fetching pending requests:', error);
        return [];
      }
    },
    staleTime: 1 * 60 * 1000, // 1 minute - should be fresh
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: true,
  });
}

// Hook for friend suggestions
export function useFriendSuggestions(limit: number = 10) {
  return useQuery({
    queryKey: ['friend-suggestions', limit],
    queryFn: async () => {
      console.log('🔄 Fetching friend suggestions...');
      try {
        const suggestions = await getFriendSuggestions(limit);
        console.log('✅ Friend suggestions fetched:', suggestions?.length || 0);
        return suggestions || [];
      } catch (error) {
        console.warn('⚠️ Failed to fetch friend suggestions:', error);
        return []; // Don't throw for suggestions
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
  });
}

// ===============================
// MUTATION HOOKS FOR ACTIONS
// ===============================

export function useFriendActions() {
  const queryClient = useQueryClient();

  // Helper to invalidate related queries
  const invalidateQueries = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['friends-list'] }),
      queryClient.invalidateQueries({ queryKey: ['pending-friend-requests'] }),
      queryClient.invalidateQueries({ queryKey: ['friend-suggestions'] }),
      queryClient.invalidateQueries({ queryKey: ['friendship-status'] }),
    ]);
  }, [queryClient]);

  // Send friend request mutation
  const sendRequestMutation = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: async () => {
      console.log('✅ Friend request sent successfully');
      await invalidateQueries();
    },
    onError: (error) => {
      console.error('❌ Error sending friend request:', error);
    },
  });

  // Accept request mutation
  const acceptRequestMutation = useMutation({
    mutationFn: acceptRequest,
    onSuccess: async () => {
      console.log('✅ Friend request accepted successfully');
      await invalidateQueries();
    },
    onError: (error) => {
      console.error('❌ Error accepting friend request:', error);
    },
  });

  // Reject request mutation
  const rejectRequestMutation = useMutation({
    mutationFn: rejectRequest,
    onSuccess: async () => {
      console.log('✅ Friend request rejected successfully');
      await invalidateQueries();
    },
    onError: (error) => {
      console.error('❌ Error rejecting friend request:', error);
    },
  });

  // Remove friend mutation
  const removeFriendMutation = useMutation({
    mutationFn: removeFriend,
    onSuccess: async () => {
      console.log('✅ Friend removed successfully');
      await invalidateQueries();
    },
    onError: (error) => {
      console.error('❌ Error removing friend:', error);
    },
  });

  return {
    // Action functions
    sendFriendRequest: sendRequestMutation.mutateAsync,
    acceptRequest: acceptRequestMutation.mutateAsync,
    rejectRequest: rejectRequestMutation.mutateAsync,
    removeFriend: removeFriendMutation.mutateAsync,

    // Loading states
    isSendingRequest: sendRequestMutation.isPending,
    isAcceptingRequest: acceptRequestMutation.isPending,
    isRejectingRequest: rejectRequestMutation.isPending,
    isRemovingFriend: removeFriendMutation.isPending,

    // Error states
    sendRequestError: sendRequestMutation.error,
    acceptRequestError: acceptRequestMutation.error,
    rejectRequestError: rejectRequestMutation.error,
    removeFriendError: removeFriendMutation.error,
  };
}

// ===============================
// MAIN COMPREHENSIVE HOOK
// ===============================

export function useFriendsData(suggestionsLimit: number = 10) {
  // Individual data hooks
  const friendsQuery = useFriendsList();
  const pendingQuery = usePendingFriendRequests();
  const suggestionsQuery = useFriendSuggestions(suggestionsLimit);
  const friendActions = useFriendActions();

  // Computed statistics - memoized
  const friendsStats = useMemo((): FriendsStats => {
    const friends = friendsQuery.data || [];
    const pendingRequests = pendingQuery.data || [];

    // Calculate recently added (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentlyAddedCount = friends.filter(
      (friend) => new Date(friend.created_at) > oneWeekAgo,
    ).length;

    return {
      totalFriends: friends.length,
      pendingRequestsCount: pendingRequests.length,
      recentlyAddedCount,
      weeklyNewFriends: recentlyAddedCount,
    };
  }, [friendsQuery.data, pendingQuery.data]);

  // Overall loading and error states
  const isLoading = friendsQuery.isLoading || pendingQuery.isLoading;
  const hasError = !!(friendsQuery.error || pendingQuery.error);

  // Combined error messages
  const errorMessages = useMemo(() => {
    const errors: string[] = [];

    if (friendsQuery.error) {
      errors.push('Arkadaş listesi yüklenemedi');
    }
    if (pendingQuery.error) {
      errors.push('Bekleyen istekler yüklenemedi');
    }

    return errors;
  }, [friendsQuery.error, pendingQuery.error]);

  // Refetch all data
  const refetchAll = useCallback(async () => {
    console.log('🔄 Refetching all friends data...');
    await Promise.all([
      friendsQuery.refetch(),
      pendingQuery.refetch(),
      suggestionsQuery.refetch(),
    ]);
  }, [friendsQuery.refetch, pendingQuery.refetch, suggestionsQuery.refetch]);

  return {
    // ===== FRIENDS DATA =====
    friends: friendsQuery.data || [],
    friendsLoading: friendsQuery.isLoading,
    friendsError: friendsQuery.error,

    // ===== PENDING REQUESTS DATA =====
    pendingRequests: pendingQuery.data || [],
    pendingRequestsLoading: pendingQuery.isLoading,
    pendingRequestsError: pendingQuery.error,

    // ===== SUGGESTIONS DATA =====
    suggestions: suggestionsQuery.data || [],
    suggestionsLoading: suggestionsQuery.isLoading,
    suggestionsError: suggestionsQuery.error,

    // ===== ACTIONS =====
    sendFriendRequest: friendActions.sendFriendRequest,
    acceptRequest: friendActions.acceptRequest,
    rejectRequest: friendActions.rejectRequest,
    removeFriend: friendActions.removeFriend,

    // ===== LOADING STATES =====
    isSendingRequest: friendActions.isSendingRequest,
    isAcceptingRequest: friendActions.isAcceptingRequest,
    isRejectingRequest: friendActions.isRejectingRequest,
    isRemovingFriend: friendActions.isRemovingFriend,

    // ===== ERROR STATES =====
    sendRequestError: friendActions.sendRequestError,
    acceptRequestError: friendActions.acceptRequestError,
    rejectRequestError: friendActions.rejectRequestError,
    removeFriendError: friendActions.removeFriendError,

    // ===== STATISTICS =====
    friendsStats,

    // ===== OVERALL STATE =====
    isLoading,
    hasError,
    errorMessages,

    // ===== UTILITY FUNCTIONS =====
    refetchAll,
    refetchFriends: friendsQuery.refetch,
    refetchPendingRequests: pendingQuery.refetch,
    refetchSuggestions: suggestionsQuery.refetch,
  };
}

// ===============================
// LIGHTWEIGHT SPECIALIZED HOOKS
// ===============================

// Hook for just the friends list (lightweight)
export function useFriendsOnly() {
  const friendsQuery = useFriendsList();

  return {
    friends: friendsQuery.data || [],
    isLoading: friendsQuery.isLoading,
    error: friendsQuery.error,
    refetch: friendsQuery.refetch,
  };
}

// Hook for just pending requests (lightweight)
export function usePendingRequestsOnly() {
  const pendingQuery = usePendingFriendRequests();

  return {
    pendingRequests: pendingQuery.data || [],
    isLoading: pendingQuery.isLoading,
    error: pendingQuery.error,
    refetch: pendingQuery.refetch,
  };
}

// Hook for friend management in other screens (e.g., duel creation)
export function useFriendManagement() {
  const friendsQuery = useFriendsList();
  const friendActions = useFriendActions();

  return {
    friends: friendsQuery.data || [],
    isLoading: friendsQuery.isLoading,
    error: friendsQuery.error,
    refetch: friendsQuery.refetch,

    // Action handlers
    sendFriendRequest: friendActions.sendFriendRequest,
    removeFriend: friendActions.removeFriend,

    // Loading states
    isSendingRequest: friendActions.isSendingRequest,
    isRemovingFriend: friendActions.isRemovingFriend,
  };
}

// All exports are already handled above
