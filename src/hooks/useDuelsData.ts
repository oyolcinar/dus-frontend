// src/hooks/useDuelsData.ts - COMPLETE DUELS DATA MANAGEMENT
import { useQuery, useQueries } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import {
  duelService,
  duelResultService,
  friendService,
  botService,
  userService,
  courseService,
  testService,
} from '../api';
import type { Duel, User, Course, Test, DuelResult } from '../types/models';
import type { UserDuelStatsPayload } from '../api/duelResultService';
import type { Bot } from '../api/botService';

// Enhanced types for duels data
export interface DuelOpponent {
  id: number;
  username: string;
  winRate?: number;
  totalDuels?: number;
  isBot?: boolean;
  botInfo?: Bot;
  skillLevel?: number;
  compatibility?: number;
}

export interface DuelHistoryItem extends DuelResult {
  result: 'won' | 'lost' | 'draw';
  opponentName?: string;
  courseName?: string;
  testName?: string;
  formattedDate: string;
  duelInfo?: Duel;
}

export interface LeaderboardEntry {
  userId: number;
  username: string;
  winRate: number;
  totalDuels: number;
  wins: number;
  rank: number;
}

// 🚀 MAIN ACTIVE DUELS HOOK
export function useActiveDuels() {
  return useQuery({
    queryKey: ['active-duels'],
    queryFn: async (): Promise<Duel[]> => {
      console.log('🔄 Fetching active duels...');

      try {
        const activeDuels = await duelService.getActiveDuels();
        console.log('⚔️ Active duels fetched:', activeDuels?.length || 0);
        return activeDuels || [];
      } catch (error) {
        console.error('❌ Error fetching active duels:', error);
        return [];
      }
    },
    staleTime: 30 * 1000, // 30 seconds - duels change frequently
    gcTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
    refetchOnWindowFocus: true, // Refetch when user returns to app
  });
}

// 🚀 USER DUEL STATISTICS HOOK
export function useDuelStats() {
  return useQuery({
    queryKey: ['user-duel-stats'],
    queryFn: async (): Promise<UserDuelStatsPayload | null> => {
      console.log('📊 Fetching user duel statistics...');

      try {
        const stats = await duelResultService.getUserDuelStats();
        console.log('📈 Duel stats fetched:', {
          totalDuels: stats?.totalDuels || 0,
          wins: stats?.wins || 0,
          losses: stats?.losses || 0,
        });
        return stats;
      } catch (error) {
        console.error('❌ Error fetching duel stats:', error);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - stats don't change often
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}

// 🚀 DUEL OPPONENTS HOOK (Friends + Recommended + Bots)
export function useDuelOpponents() {
  return useQueries({
    queries: [
      {
        queryKey: ['recommended-opponents'],
        queryFn: async (): Promise<DuelOpponent[]> => {
          try {
            const recommended = await duelService.getRecommendedOpponents();
            return recommended.map((opponent) => ({
              id: opponent.userId,
              username: opponent.username,
              winRate: opponent.winRate || 0,
              totalDuels: opponent.totalDuels || 0,
              skillLevel: opponent.skillLevel || 0,
              compatibility: opponent.compatibility || 0,
              isBot: false,
            }));
          } catch (error) {
            console.warn('Failed to fetch recommended opponents:', error);
            return [];
          }
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
      },
      {
        queryKey: ['friend-opponents'],
        queryFn: async (): Promise<DuelOpponent[]> => {
          try {
            const friends = await friendService.getUserFriends();
            return friends.map((friend: any) => ({
              id: friend.friend_id,
              username: friend.friend_username || 'Bilinmeyen Kullanıcı',
              winRate: friend.winRate || 0,
              totalDuels: friend.totalDuels || 0,
              isBot: false,
            }));
          } catch (error) {
            console.warn('Failed to fetch friend opponents:', error);
            return [];
          }
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
      {
        queryKey: ['bot-opponents'],
        queryFn: async (): Promise<DuelOpponent[]> => {
          try {
            const bots = await botService.getAvailableBots();
            return bots.map((bot: Bot) => ({
              id: bot.botId,
              username: bot.botName,
              winRate: bot.accuracyRate || 0,
              totalDuels: 0,
              isBot: true,
              botInfo: bot,
            }));
          } catch (error) {
            console.warn('Failed to fetch bot opponents:', error);
            return [];
          }
        },
        staleTime: 15 * 60 * 1000, // 15 minutes - bots don't change often
      },
    ],
  });
}

// 🚀 DUEL LEADERBOARD HOOK
export function useDuelLeaderboard(limit: number = 20) {
  return useQuery({
    queryKey: ['duel-leaderboard', limit],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      console.log('🏆 Fetching duel leaderboard...');

      try {
        const leaderboardResponse = await duelService.getDuelLeaderboard(limit);
        const leaderboard = leaderboardResponse.leaderboard || [];

        return leaderboard.map((entry: any, index: number) => ({
          userId: entry.userId,
          username: entry.username,
          winRate: entry.winRate || 0,
          totalDuels: entry.totalDuels || 0,
          wins: entry.wins || 0,
          rank: index + 1,
        }));
      } catch (error) {
        console.error('❌ Error fetching leaderboard:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    enabled: limit > 0,
  });
}

// 🚀 DUEL HISTORY HOOK
export function useDuelHistory(limit: number = 50) {
  return useQuery({
    queryKey: ['duel-history', limit],
    queryFn: async (): Promise<DuelHistoryItem[]> => {
      console.log('📚 Fetching duel history...');

      try {
        const completedDuels = await duelService.getCompletedDuels();

        if (!completedDuels || completedDuels.length === 0) {
          return [];
        }

        // Process duels in parallel but limit to requested amount
        const duelsToProcess = completedDuels.slice(0, limit);

        const historyPromises = duelsToProcess.map(
          async (duel): Promise<DuelHistoryItem | null> => {
            try {
              const duelResult = await duelResultService.getDuelResultByDuelId(
                duel.duel_id,
              );
              if (!duelResult) return null;

              // 🚀 FIXED: Use AsyncStorage instead of localStorage for React Native
              const { default: AsyncStorage } = await import(
                '@react-native-async-storage/async-storage'
              );
              const userDataString = await AsyncStorage.getItem('userData');
              const userData = userDataString ? JSON.parse(userDataString) : {};
              const currentUserId = userData.userId;

              if (!currentUserId) return null;

              // Determine result for current user
              let result: 'won' | 'lost' | 'draw';
              if (duelResult.winner_id === currentUserId) {
                result = 'won';
              } else if (
                duelResult.winner_id &&
                duelResult.winner_id !== currentUserId
              ) {
                result = 'lost';
              } else {
                result = 'draw';
              }

              // Get opponent info
              const opponentId =
                duel.initiator_id === currentUserId
                  ? duel.opponent_id
                  : duel.initiator_id;

              let opponentName = 'Bilinmeyen Rakip';
              if (
                duel.opponent?.username &&
                duel.opponent.user_id === opponentId
              ) {
                opponentName = duel.opponent.username;
              } else if (
                duel.initiator?.username &&
                duel.initiator.user_id === opponentId
              ) {
                opponentName = duel.initiator.username;
              } else if (duel.opponent_username) {
                opponentName = duel.opponent_username;
              }

              // Get course name
              let courseName = 'Bilinmeyen Ders';
              if (duel.course?.title) {
                courseName = duel.course.title;
              } else if (duel.course_title) {
                courseName = duel.course_title;
              }

              const formattedDate = new Date(
                duelResult.created_at,
              ).toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return {
                ...duelResult,
                result,
                opponentName,
                courseName,
                testName: `Test ${duel.duel_id}`,
                formattedDate,
                duelInfo: duel,
              };
            } catch (error) {
              console.error(`Error processing duel ${duel.duel_id}:`, error);
              return null;
            }
          },
        );

        const historyResults = await Promise.all(historyPromises);
        const validHistory = historyResults.filter(
          (item): item is DuelHistoryItem => item !== null,
        );

        // Sort by date (newest first)
        validHistory.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );

        console.log(
          '📖 Duel history processed:',
          validHistory.length,
          'entries',
        );
        return validHistory;
      } catch (error) {
        console.error('❌ Error fetching duel history:', error);
        return [];
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    enabled: limit > 0,
  });
}

// 🚀 SPECIFIC DUEL DETAILS HOOK
export function useDuelDetails(duelId: number) {
  return useQuery({
    queryKey: ['duel-details', duelId],
    queryFn: async () => {
      console.log(`🔍 Fetching duel details for duel ${duelId}...`);

      try {
        const duelDetails = await duelService.getDuelDetails(duelId);
        console.log('⚔️ Duel details fetched:', duelDetails?.duel?.duel_id);
        return duelDetails;
      } catch (error) {
        console.error(`❌ Error fetching duel ${duelId} details:`, error);
        throw error;
      }
    },
    staleTime: 30 * 1000, // 30 seconds - active duel data changes frequently
    gcTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
    enabled: !!duelId && duelId > 0,
  });
}

// 🚀 COMBINED DUELS DATA HOOK (Main hook for duels screens)
export function useDuelsData() {
  const activeDuelsQuery = useActiveDuels();
  const duelStatsQuery = useDuelStats();
  const opponentsQueries = useDuelOpponents();
  const leaderboardQuery = useDuelLeaderboard();

  // Extract opponents data
  const [recommendedQuery, friendsQuery, botsQuery] = opponentsQueries;

  return {
    // Active duels
    activeDuels: activeDuelsQuery.data || [],
    activeDuelsLoading: activeDuelsQuery.isLoading,
    activeDuelsError: activeDuelsQuery.error,
    refetchActiveDuels: activeDuelsQuery.refetch,

    // Duel statistics
    duelStats: duelStatsQuery.data,
    duelStatsLoading: duelStatsQuery.isLoading,
    duelStatsError: duelStatsQuery.error,

    // Opponents
    recommendedOpponents: recommendedQuery.data || [],
    friendOpponents: friendsQuery.data || [],
    botOpponents: botsQuery.data || [],
    opponentsLoading: opponentsQueries.some((q) => q.isLoading),
    opponentsError: opponentsQueries.find((q) => q.error)?.error,

    // Leaderboard
    leaderboard: leaderboardQuery.data || [],
    leaderboardLoading: leaderboardQuery.isLoading,
    leaderboardError: leaderboardQuery.error,

    // Overall state
    isLoading: activeDuelsQuery.isLoading || duelStatsQuery.isLoading,
    hasError: !!(activeDuelsQuery.error || duelStatsQuery.error),

    // Refetch all data
    refetchAll: async () => {
      await Promise.all([
        activeDuelsQuery.refetch(),
        duelStatsQuery.refetch(),
        ...opponentsQueries.map((q) => q.refetch()),
        leaderboardQuery.refetch(),
      ]);
    },
  };
}

// 🚀 HOOK FOR NEW DUEL SCREEN SPECIFICALLY
export function useNewDuelData() {
  const opponentsQueries = useDuelOpponents();
  const [recommendedQuery, friendsQuery, botsQuery] = opponentsQueries;

  // Get available courses for duel creation
  const coursesQuery = useQuery({
    queryKey: ['duel-courses'],
    queryFn: async (): Promise<Course[]> => {
      try {
        const courses = await courseService.getAllCourses();
        return courses || [];
      } catch (error) {
        console.error('Error fetching courses for duels:', error);
        return [];
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });

  return {
    // Opponents
    recommendedOpponents: recommendedQuery.data || [],
    friendOpponents: friendsQuery.data || [],
    botOpponents: botsQuery.data || [],
    opponentsLoading: opponentsQueries.some((q) => q.isLoading),

    // Courses
    courses: coursesQuery.data || [],
    coursesLoading: coursesQuery.isLoading,
    coursesError: coursesQuery.error,

    // Overall loading state
    isLoading:
      opponentsQueries.some((q) => q.isLoading) || coursesQuery.isLoading,

    // Refetch all
    refetchAll: async () => {
      await Promise.all([
        ...opponentsQueries.map((q) => q.refetch()),
        coursesQuery.refetch(),
      ]);
    },
  };
}

// 🚀 HOOK FOR DUEL HISTORY SCREEN SPECIFICALLY
export function useDuelHistoryData(
  historyLimit: number = 50,
  recentLimit: number = 10,
) {
  const duelStatsQuery = useDuelStats();
  const historyQuery = useDuelHistory(historyLimit);

  // Compute recent duels from history
  const recentDuels = historyQuery.data?.slice(0, recentLimit) || [];

  return {
    // Statistics
    duelStats: duelStatsQuery.data,
    duelStatsLoading: duelStatsQuery.isLoading,
    duelStatsError: duelStatsQuery.error,

    // History
    duelHistory: historyQuery.data || [],
    recentDuels,
    historyLoading: historyQuery.isLoading,
    historyError: historyQuery.error,

    // Overall state
    isLoading: duelStatsQuery.isLoading || historyQuery.isLoading,
    hasError: !!(duelStatsQuery.error || historyQuery.error),

    // Refetch all
    refetchAll: async () => {
      await Promise.all([duelStatsQuery.refetch(), historyQuery.refetch()]);
    },
  };
}

// 🚀 HELPER HOOK FOR USER SEARCH IN DUELS
export function useUserSearch() {
  return {
    searchUser: async (username: string): Promise<DuelOpponent | null> => {
      try {
        const user = await userService.searchUserByUsername(username.trim());

        if (user) {
          // 🚀 FIXED: Don't access non-existent properties, use defaults
          // We could optionally fetch duel stats for this user, but for search results
          // it's better to keep it simple and fast
          return {
            id: user.userId || user.id,
            username: user.username,
            winRate: 0, // Default - would need separate API call to get actual stats
            totalDuels: 0, // Default - would need separate API call to get actual stats
            isBot: false,
          };
        }

        return null;
      } catch (error) {
        console.error('Error searching user:', error);
        throw error;
      }
    },

    // 🚀 NEW: Enhanced search that includes duel stats (slower but more complete)
    searchUserWithStats: async (
      username: string,
    ): Promise<DuelOpponent | null> => {
      try {
        const user = await userService.searchUserByUsername(username.trim());

        if (user) {
          // Try to get duel stats for this user (might not be available)
          let winRate = 0;
          let totalDuels = 0;

          try {
            // Note: This would require a new API endpoint to get another user's duel stats
            // For now, we'll use defaults. You could add this to your backend if needed.
            console.log(
              'Getting duel stats for user would require additional API endpoint',
            );
          } catch (statsError) {
            console.warn('Could not fetch duel stats for user:', statsError);
          }

          return {
            id: user.userId || user.id,
            username: user.username,
            winRate,
            totalDuels,
            isBot: false,
          };
        }

        return null;
      } catch (error) {
        console.error('Error searching user with stats:', error);
        throw error;
      }
    },
  };
}

// 🚀 HELPER HOOK FOR DUEL CREATION
export function useDuelCreation() {
  return {
    challengeUser: async (
      opponentId: number,
      courseId: number,
      questionCount: number = 5,
    ) => {
      try {
        console.log('🎯 Creating user challenge:', {
          opponentId,
          courseId,
          questionCount,
        });
        const response = await duelService.challengeUserWithCourse(
          opponentId,
          courseId,
          questionCount,
        );
        return response;
      } catch (error) {
        console.error('❌ Error creating user challenge:', error);
        throw error;
      }
    },

    challengeBot: async (courseId: number, difficulty: number) => {
      try {
        console.log('🤖 Creating bot challenge:', { courseId, difficulty });
        const response = await botService.challengeBotWithCourse(
          courseId,
          difficulty,
        );
        return response;
      } catch (error) {
        console.error('❌ Error creating bot challenge:', error);
        throw error;
      }
    },

    // 🚀 NEW: Challenge with test (backward compatibility)
    challengeUserWithTest: async (
      opponentId: number,
      testId: number,
      questionCount: number = 5,
    ) => {
      try {
        console.log('🎯 Creating user challenge with test:', {
          opponentId,
          testId,
          questionCount,
        });
        const response = await duelService.challengeUser(
          opponentId,
          testId,
          questionCount,
        );
        return response;
      } catch (error) {
        console.error('❌ Error creating user challenge with test:', error);
        throw error;
      }
    },

    // 🚀 NEW: Accept challenge
    acceptChallenge: async (duelId: number) => {
      try {
        console.log('✅ Accepting challenge:', duelId);
        const response = await duelService.acceptChallenge(duelId);
        return response;
      } catch (error) {
        console.error('❌ Error accepting challenge:', error);
        throw error;
      }
    },

    // 🚀 NEW: Decline challenge
    declineChallenge: async (duelId: number) => {
      try {
        console.log('❌ Declining challenge:', duelId);
        const response = await duelService.declineChallenge(duelId);
        return response;
      } catch (error) {
        console.error('❌ Error declining challenge:', error);
        throw error;
      }
    },
  };
}

// 🚀 NEW: REAL-TIME SOCKET CONNECTION HOOK
export function useSocketConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<any>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const connect = useCallback(async (token?: string) => {
    try {
      const { connect: socketConnect, getConnectionState } = await import(
        '../api/socketService'
      );
      await socketConnect(token);
      setIsConnected(true);
      setConnectionState(getConnectionState());
      setConnectionError(null);
    } catch (error) {
      console.error('Socket connection failed:', error);
      setConnectionError(
        error instanceof Error ? error.message : 'Connection failed',
      );
      setIsConnected(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      const { disconnect: socketDisconnect } = await import(
        '../api/socketService'
      );
      socketDisconnect();
      setIsConnected(false);
      setConnectionState(null);
      setConnectionError(null);
    } catch (error) {
      console.error('Socket disconnect failed:', error);
    }
  }, []);

  const checkConnection = useCallback(async () => {
    try {
      const { isConnected: socketIsConnected, getConnectionState } =
        await import('../api/socketService');
      const connected = socketIsConnected();
      setIsConnected(connected);
      setConnectionState(getConnectionState());
    } catch (error) {
      console.error('Socket connection check failed:', error);
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return {
    isConnected,
    connectionState,
    connectionError,
    connect,
    disconnect,
    checkConnection,
  };
}

// 🚀 NEW: BOT DETECTION AND INFO HOOK
export function useBotInfo(userId?: number) {
  return useQuery({
    queryKey: ['bot-info', userId],
    queryFn: async (): Promise<{ isBot: boolean; botInfo?: Bot | null }> => {
      if (!userId) return { isBot: false };

      try {
        console.log('🤖 Checking if user is bot:', userId);
        const isBot = await botService.isBot(userId);

        if (isBot) {
          const botInfo = await botService.getBotInfo(userId);
          console.log('🤖 Bot info fetched:', botInfo?.botName);
          return { isBot: true, botInfo };
        }

        return { isBot: false };
      } catch (error) {
        console.error('❌ Error checking bot info:', error);
        return { isBot: false };
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - bot status doesn't change
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
    enabled: !!userId && userId > 0,
  });
}

// 🚀 NEW: REAL-TIME DUEL ROOM HOOK
export function useDuelRoom(duelId: number) {
  const [roomState, setRoomState] = useState<any>(null);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [eventListeners, setEventListeners] = useState<Array<() => void>>([]);

  const joinRoom = useCallback(async () => {
    try {
      const { joinDuelRoom } = await import('../api/socketService');
      console.log('🚪 Joining duel room:', duelId);
      joinDuelRoom(duelId);
    } catch (error) {
      console.error('❌ Error joining duel room:', error);
      setRoomError(
        error instanceof Error ? error.message : 'Failed to join room',
      );
    }
  }, [duelId]);

  const leaveRoom = useCallback(async () => {
    try {
      const { leaveDuelRoom } = await import('../api/socketService');
      console.log('🚪 Leaving duel room');
      leaveDuelRoom();
      setRoomState(null);
    } catch (error) {
      console.error('❌ Error leaving duel room:', error);
    }
  }, []);

  const signalReady = useCallback(async () => {
    try {
      const { signalReady } = await import('../api/socketService');
      console.log('✅ Signaling ready for duel');
      signalReady();
    } catch (error) {
      console.error('❌ Error signaling ready:', error);
    }
  }, []);

  const submitAnswer = useCallback(
    async (
      questionId: number,
      selectedAnswer: string | null,
      timeTaken: number,
    ) => {
      try {
        const { submitAnswer } = await import('../api/socketService');
        console.log('📝 Submitting answer:', {
          questionId,
          selectedAnswer,
          timeTaken,
        });
        submitAnswer(questionId, selectedAnswer, timeTaken);
      } catch (error) {
        console.error('❌ Error submitting answer:', error);
      }
    },
    [],
  );

  const setupEventListeners = useCallback(async () => {
    try {
      const { on, off } = await import('../api/socketService');

      // Clear existing listeners
      eventListeners.forEach((cleanup) => cleanup());

      const newListeners: Array<() => void> = [];

      // Room events
      const handleRoomJoined = (data: any) => {
        console.log('🚪 Room joined:', data);
        setRoomState(data.session);
        setRoomError(null);
      };

      const handleRoomError = (data: any) => {
        console.log('❌ Room error:', data);
        setRoomError(data.message);
      };

      on('room_joined', handleRoomJoined);
      on('room_error', handleRoomError);

      newListeners.push(
        () => off('room_joined', handleRoomJoined),
        () => off('room_error', handleRoomError),
      );

      setEventListeners(newListeners);
    } catch (error) {
      console.error('❌ Error setting up event listeners:', error);
    }
  }, [eventListeners]);

  useEffect(() => {
    setupEventListeners();

    return () => {
      // Cleanup on unmount
      eventListeners.forEach((cleanup) => cleanup());
      leaveRoom();
    };
  }, []);

  return {
    roomState,
    roomError,
    joinRoom,
    leaveRoom,
    signalReady,
    submitAnswer,
  };
}

// 🚀 NEW: ENHANCED DUEL DETAILS WITH BOT INFO
export function useEnhancedDuelDetails(duelId: number) {
  const duelDetailsQuery = useDuelDetails(duelId);
  const [botInfo, setBotInfo] = useState<{
    isBot: boolean;
    botInfo?: Bot | null;
  } | null>(null);

  useEffect(() => {
    const checkBotInfo = async () => {
      if (duelDetailsQuery.data?.duel) {
        const duel = duelDetailsQuery.data.duel;
        const opponentId = duel.opponent_id;

        if (opponentId) {
          try {
            const isBot = await botService.isBot(opponentId);
            if (isBot) {
              const botData = await botService.getBotInfo(opponentId);
              setBotInfo({ isBot: true, botInfo: botData });
            } else {
              setBotInfo({ isBot: false });
            }
          } catch (error) {
            console.error('Error checking bot info:', error);
            setBotInfo({ isBot: false });
          }
        }
      }
    };

    checkBotInfo();
  }, [duelDetailsQuery.data]);

  return {
    ...duelDetailsQuery,
    botInfo,
    duelInfo: duelDetailsQuery.data?.duel,
    opponentInfo: duelDetailsQuery.data?.duel
      ? {
          userId: duelDetailsQuery.data.duel.opponent_id,
          username: duelDetailsQuery.data.duel.opponent_username,
          isBot: botInfo?.isBot || false,
          botInfo: botInfo?.botInfo,
        }
      : null,
  };
}

// 🚀 NEW: COMPREHENSIVE DUEL ROOM MANAGEMENT HOOK
export function useDuelRoomManagement(duelId: number) {
  const socketConnection = useSocketConnection();
  const duelRoom = useDuelRoom(duelId);
  const enhancedDetails = useEnhancedDuelDetails(duelId);

  // Game state
  const [gamePhase, setGamePhase] = useState<
    | 'connecting'
    | 'lobby'
    | 'countdown'
    | 'question'
    | 'results'
    | 'final'
    | 'error'
  >('connecting');
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(3);
  const [timeLeft, setTimeLeft] = useState(60);
  const [userScore, setUserScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [opponentAnswered, setOpponentAnswered] = useState(false);
  const [gameError, setGameError] = useState<string | null>(null);

  // Initialize socket connection
  const initializeConnection = useCallback(
    async (token?: string) => {
      try {
        await socketConnection.connect(token);
        if (socketConnection.isConnected) {
          await duelRoom.joinRoom();
          setGamePhase('lobby');
        }
      } catch (error) {
        console.error('Failed to initialize duel room:', error);
        setGameError(
          error instanceof Error ? error.message : 'Connection failed',
        );
        setGamePhase('error');
      }
    },
    [socketConnection, duelRoom],
  );

  // Setup real-time event listeners
  const setupRealTimeListeners = useCallback(async () => {
    try {
      const { on, off } = await import('../api/socketService');

      // Game flow events
      const handleDuelStarting = (data: { countdown: number }) => {
        setGamePhase('countdown');
      };

      const handleQuestionPresented = (data: {
        questionIndex: number;
        totalQuestions: number;
        question: any;
        timeLimit: number;
        serverStartTime: number;
        serverEndTime: number;
      }) => {
        setGamePhase('question');
        setCurrentQuestion(data.question);
        setQuestionIndex(data.questionIndex);
        setTotalQuestions(data.totalQuestions);
        setTimeLeft(Math.ceil(data.timeLimit / 1000));
        setHasAnswered(false);
        setOpponentAnswered(false);
      };

      const handleTimerUpdate = (data: {
        timeRemaining: number;
        serverTime: number;
        questionIndex: number;
      }) => {
        if (data.questionIndex === questionIndex) {
          setTimeLeft(data.timeRemaining);
        }
      };

      const handleOpponentAnswered = () => {
        setOpponentAnswered(true);
      };

      const handleRoundResult = (data: any) => {
        setGamePhase('results');
        // Update scores based on results
        if (data.answers) {
          data.answers.forEach((answer: any) => {
            if (answer.isCorrect) {
              if (answer.userId === enhancedDetails.opponentInfo?.userId) {
                setOpponentScore((prev) => prev + 1);
              } else {
                setUserScore((prev) => prev + 1);
              }
            }
          });
        }
      };

      const handleDuelCompleted = (data: any) => {
        setGamePhase('final');
      };

      const handleGameError = (data: { message: string }) => {
        setGameError(data.message);
        setGamePhase('error');
      };

      // Register all event listeners
      on('duel_starting', handleDuelStarting);
      on('question_presented', handleQuestionPresented);
      on('timer_update', handleTimerUpdate);
      on('opponent_answered', handleOpponentAnswered);
      on('round_result', handleRoundResult);
      on('duel_completed', handleDuelCompleted);
      on('duel_error', handleGameError);

      return () => {
        // Cleanup function
        off('duel_starting', handleDuelStarting);
        off('question_presented', handleQuestionPresented);
        off('timer_update', handleTimerUpdate);
        off('opponent_answered', handleOpponentAnswered);
        off('round_result', handleRoundResult);
        off('duel_completed', handleDuelCompleted);
        off('duel_error', handleGameError);
      };
    } catch (error) {
      console.error('Failed to setup real-time listeners:', error);
    }
  }, [questionIndex, enhancedDetails.opponentInfo?.userId]);

  // Answer submission
  const submitAnswer = useCallback(
    async (selectedAnswer: string | null, timeTaken: number) => {
      if (!currentQuestion || hasAnswered) return;

      try {
        await duelRoom.submitAnswer(
          currentQuestion.id,
          selectedAnswer,
          timeTaken,
        );
        setHasAnswered(true);
      } catch (error) {
        console.error('Failed to submit answer:', error);
        setGameError('Failed to submit answer');
      }
    },
    [currentQuestion, hasAnswered, duelRoom],
  );

  // Ready signal
  const signalReady = useCallback(async () => {
    try {
      await duelRoom.signalReady();
    } catch (error) {
      console.error('Failed to signal ready:', error);
      setGameError('Failed to signal ready');
    }
  }, [duelRoom]);

  // Cleanup
  const cleanup = useCallback(async () => {
    try {
      await duelRoom.leaveRoom();
      socketConnection.disconnect();
    } catch (error) {
      console.error('Failed to cleanup duel room:', error);
    }
  }, [duelRoom, socketConnection]);

  useEffect(() => {
    const cleanupListeners = setupRealTimeListeners();

    return () => {
      if (cleanupListeners) {
        cleanupListeners.then((cleanup) => cleanup && cleanup());
      }
    };
  }, [setupRealTimeListeners]);

  return {
    // Connection state
    isConnected: socketConnection.isConnected,
    connectionError: socketConnection.connectionError,

    // Room state
    roomState: duelRoom.roomState,
    roomError: duelRoom.roomError,

    // Duel details
    duelInfo: enhancedDetails.duelInfo,
    opponentInfo: enhancedDetails.opponentInfo,
    botInfo: enhancedDetails.botInfo,

    // Game state
    gamePhase,
    currentQuestion,
    questionIndex,
    totalQuestions,
    timeLeft,
    userScore,
    opponentScore,
    hasAnswered,
    opponentAnswered,
    gameError,

    // Actions
    initializeConnection,
    submitAnswer,
    signalReady,
    cleanup,

    // Loading states
    isLoading: enhancedDetails.isLoading,
    hasError: !!(
      socketConnection.connectionError ||
      duelRoom.roomError ||
      gameError ||
      enhancedDetails.error
    ),
  };
}

// 🚀 NEW: REAL-TIME TIMER MANAGEMENT HOOK
export function useDuelTimer(initialTime: number = 60) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isActive, setIsActive] = useState(false);
  const [serverSynced, setServerSynced] = useState(false);

  const startTimer = useCallback(
    (time: number = initialTime) => {
      setTimeLeft(time);
      setIsActive(true);
      setServerSynced(false);
    },
    [initialTime],
  );

  const stopTimer = useCallback(() => {
    setIsActive(false);
  }, []);

  const resetTimer = useCallback(
    (time: number = initialTime) => {
      setTimeLeft(time);
      setIsActive(false);
      setServerSynced(false);
    },
    [initialTime],
  );

  const syncWithServer = useCallback((serverTime: number) => {
    setTimeLeft(serverTime);
    setServerSynced(true);
  }, []);

  // Setup server timer sync
  useEffect(() => {
    const setupTimerSync = async () => {
      try {
        const { on, off } = await import('../api/socketService');

        const handleTimerUpdate = (data: {
          timeRemaining: number;
          serverTime: number;
          questionIndex: number;
        }) => {
          syncWithServer(data.timeRemaining);
        };

        const handleTimeUp = () => {
          setTimeLeft(0);
          setIsActive(false);
        };

        on('timer_update', handleTimerUpdate);
        on('question_time_up', handleTimeUp);

        return () => {
          off('timer_update', handleTimerUpdate);
          off('question_time_up', handleTimeUp);
        };
      } catch (error) {
        console.error('Failed to setup timer sync:', error);
      }
    };

    const cleanup = setupTimerSync();

    return () => {
      cleanup.then((cleanupFn) => cleanupFn && cleanupFn());
    };
  }, [syncWithServer]);

  return {
    timeLeft,
    isActive,
    serverSynced,
    startTimer,
    stopTimer,
    resetTimer,
    syncWithServer,
  };
}

// 🚀 NEW: SOCKET-BASED BOT CHALLENGE HOOK
export function useSocketBotChallenge() {
  const [challengeState, setChallengeState] = useState<
    'idle' | 'challenging' | 'success' | 'error'
  >('idle');
  const [challengeError, setChallengeError] = useState<string | null>(null);
  const [createdDuel, setCreatedDuel] = useState<any>(null);

  const challengeBotWithSocket = useCallback(
    async (courseId: number, difficulty: number) => {
      setChallengeState('challenging');
      setChallengeError(null);
      setCreatedDuel(null);

      try {
        const { challengeBotWithCourse } = await import('../api/socketService');
        await challengeBotWithCourse(courseId, difficulty);

        // The socket will emit bot_challenge_created or bot_challenge_error
        setChallengeState('success');
      } catch (error) {
        console.error('Socket bot challenge failed:', error);
        setChallengeError(
          error instanceof Error ? error.message : 'Challenge failed',
        );
        setChallengeState('error');
      }
    },
    [],
  );

  const challengeBotWithHttp = useCallback(
    async (courseId: number, difficulty: number) => {
      setChallengeState('challenging');
      setChallengeError(null);
      setCreatedDuel(null);

      try {
        const response = await botService.challengeBotWithCourse(
          courseId,
          difficulty,
        );

        if (response.success && response.duel) {
          setCreatedDuel(response.duel);
          setChallengeState('success');
        } else {
          setChallengeError(response.message || 'Challenge failed');
          setChallengeState('error');
        }
      } catch (error) {
        console.error('HTTP bot challenge failed:', error);
        setChallengeError(
          error instanceof Error ? error.message : 'Challenge failed',
        );
        setChallengeState('error');
      }
    },
    [],
  );

  const challengeBot = useCallback(
    async (
      courseId: number,
      difficulty: number,
      preferSocket: boolean = true,
    ) => {
      if (preferSocket) {
        try {
          const { isConnected } = await import('../api/socketService');
          if (isConnected()) {
            await challengeBotWithSocket(courseId, difficulty);
            return;
          }
        } catch (error) {
          console.warn('Socket challenge failed, falling back to HTTP:', error);
        }
      }

      // Fallback to HTTP
      await challengeBotWithHttp(courseId, difficulty);
    },
    [challengeBotWithSocket, challengeBotWithHttp],
  );

  // Setup socket event listeners for bot challenge responses
  useEffect(() => {
    const setupBotChallengeListeners = async () => {
      try {
        const { on, off } = await import('../api/socketService');

        const handleBotChallengeCreated = (data: { duel: any }) => {
          console.log('🤖 Bot challenge created via socket:', data);
          setCreatedDuel(data.duel);
          setChallengeState('success');
        };

        const handleBotChallengeError = (data: { message: string }) => {
          console.log('❌ Bot challenge error via socket:', data);
          setChallengeError(data.message);
          setChallengeState('error');
        };

        const handleAutoJoinDuel = (data: { duelId: number }) => {
          console.log('🎯 Auto-joining duel:', data.duelId);
          // This could trigger navigation to the duel room
        };

        on('bot_challenge_created', handleBotChallengeCreated);
        on('bot_challenge_error', handleBotChallengeError);
        on('auto_join_duel', handleAutoJoinDuel);

        return () => {
          off('bot_challenge_created', handleBotChallengeCreated);
          off('bot_challenge_error', handleBotChallengeError);
          off('auto_join_duel', handleAutoJoinDuel);
        };
      } catch (error) {
        console.error('Failed to setup bot challenge listeners:', error);
      }
    };

    const cleanup = setupBotChallengeListeners();

    return () => {
      cleanup.then((cleanupFn) => cleanupFn && cleanupFn());
    };
  }, []);

  const reset = useCallback(() => {
    setChallengeState('idle');
    setChallengeError(null);
    setCreatedDuel(null);
  }, []);

  return {
    challengeState,
    challengeError,
    createdDuel,
    challengeBot,
    challengeBotWithSocket,
    challengeBotWithHttp,
    reset,
    isLoading: challengeState === 'challenging',
    hasError: challengeState === 'error',
    isSuccess: challengeState === 'success',
  };
}

// 🚀 HELPER FUNCTIONS FOR DUEL PROCESSING
export const duelHelpers = {
  getDuelResult: (
    duelResult: DuelResult,
    currentUserId: number,
  ): 'won' | 'lost' | 'draw' => {
    if (duelResult.winner_id === currentUserId) {
      return 'won';
    } else if (duelResult.winner_id && duelResult.winner_id !== currentUserId) {
      return 'lost';
    }
    return 'draw';
  },

  getResultColor: (result: 'won' | 'lost' | 'draw') => {
    switch (result) {
      case 'won':
        return '#10b981'; // green
      case 'lost':
        return '#f87171'; // red
      case 'draw':
        return '#fbbf24'; // yellow
      default:
        return '#6b7280'; // gray
    }
  },

  getResultText: (result: 'won' | 'lost' | 'draw') => {
    switch (result) {
      case 'won':
        return 'Kazandı';
      case 'lost':
        return 'Kaybetti';
      case 'draw':
        return 'Berabere';
      default:
        return 'Bilinmeyen';
    }
  },

  formatDuelDate: (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  getBotDisplayInfo: (bot: Bot) => {
    const getDifficultyColor = (level: number): string => {
      switch (level) {
        case 1:
          return '#10b981'; // mint
        case 2:
          return '#fbbf24'; // yellow
        case 3:
          return '#f97316'; // orange
        case 4:
          return '#f87171'; // coral
        case 5:
          return '#8b5cf6'; // purple
        default:
          return '#6b7280'; // gray
      }
    };

    return {
      name: bot.botName,
      avatar: '🤖',
      difficulty: bot.difficultyLevel,
      accuracy: Math.floor(bot.accuracyRate * 100),
      avgTime: Math.floor(bot.avgResponseTime / 1000),
      color: getDifficultyColor(bot.difficultyLevel),
    };
  },

  getDifficultyLabel: (level: number): string => {
    switch (level) {
      case 1:
        return 'Kolay';
      case 2:
        return 'Orta';
      case 3:
        return 'Zor';
      case 4:
        return 'Uzman';
      case 5:
        return 'Efsane';
      default:
        return 'Bilinmeyen';
    }
  },

  // 🚀 NEW: Helper to get opponent ID from duel based on current user
  getOpponentId: (duel: Duel, currentUserId: number): number => {
    return duel.initiator_id === currentUserId
      ? duel.opponent_id
      : duel.initiator_id;
  },

  // 🚀 NEW: Helper to get opponent name from duel
  getOpponentName: (duel: Duel, currentUserId: number): string => {
    const opponentId = duelHelpers.getOpponentId(duel, currentUserId);

    if (duel.opponent?.username && duel.opponent.user_id === opponentId) {
      return duel.opponent.username;
    } else if (
      duel.initiator?.username &&
      duel.initiator.user_id === opponentId
    ) {
      return duel.initiator.username;
    } else if (duel.opponent_username && duel.opponent_id === opponentId) {
      return duel.opponent_username;
    } else if (duel.initiator_username && duel.initiator_id === opponentId) {
      return duel.initiator_username;
    }

    return `Rakip ${opponentId}`;
  },

  // 🚀 NEW: Helper to get course name from duel
  getCourseName: (duel: Duel): string => {
    if (duel.course?.title) {
      return duel.course.title;
    } else if (duel.course_title) {
      return duel.course_title;
    } else if ((duel as any).course_name) {
      return (duel as any).course_name;
    }
    return 'Bilinmeyen Ders';
  },

  // 🚀 NEW: Helper to determine if user can act on duel
  canUserActOnDuel: (duel: Duel, currentUserId: number): boolean => {
    if (duel.status === 'completed') return false;
    if (duel.status === 'pending' && duel.opponent_id === currentUserId)
      return true;
    if (duel.status === 'active') return true;
    return false;
  },

  // 🚀 NEW: Helper to get duel status badge variant
  getDuelStatusVariant: (
    status: string,
  ): 'info' | 'warning' | 'success' | 'error' => {
    switch (status) {
      case 'pending':
        return 'info';
      case 'active':
        return 'warning';
      case 'completed':
        return 'success';
      default:
        return 'error';
    }
  },
};

// 🚀 COMBINED EXPORTS FOR REAL-TIME DUEL FUNCTIONALITY
export const realTimeDuelHooks = {
  useSocketConnection,
  useBotInfo,
  useDuelRoom,
  useEnhancedDuelDetails,
  useDuelRoomManagement,
  useDuelTimer,
  useSocketBotChallenge,
};

// 🚀 ENHANCED MAIN DUELS DATA HOOK WITH REAL-TIME CAPABILITIES
export function useCompleteDuelsData() {
  const duelsData = useDuelsData();
  const socketConnection = useSocketConnection();
  const socketBotChallenge = useSocketBotChallenge();

  return {
    ...duelsData,
    // Real-time capabilities
    socketConnection,
    socketBotChallenge,
    // Helper functions to create duels with real-time support
    challengeBotRealTime: socketBotChallenge.challengeBot,
    isSocketConnected: socketConnection.isConnected,
  };
}
