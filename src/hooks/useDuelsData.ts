// src/hooks/useDuelsData.ts - COMPLETE PERFORMANCE-OPTIMIZED DUELS DATA MANAGEMENT
import { useQuery, useQueries } from '@tanstack/react-query';
import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  useReducer,
} from 'react';
import { unstable_batchedUpdates } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  duelService,
  duelResultService,
  friendService,
  botService,
  userService,
  courseService,
  testService,
} from '../api';
import * as socketService from '../api/socketService';
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

interface RoundResult {
  questionIndex: number;
  question: {
    text: string;
    options: Record<string, string>;
    correctAnswer: string;
    explanation?: string;
  };
  answers: Array<{
    userId: number;
    selectedAnswer: string;
    isCorrect: boolean;
    timeTaken: number;
  }>;
}

export interface FinalResults {
  winnerId: number | null;
  user1: {
    userId: number;
    score: number;
    totalTime: number;
    accuracy: number;
  };
  user2: {
    userId: number;
    score: number;
    totalTime: number;
    accuracy: number;
  };
}

// 🚀 NEW: Quick Match Types
export interface QuickMatchState {
  status: 'idle' | 'searching' | 'found' | 'timeout' | 'error' | 'cancelled';
  courseId: number | null;
  message: string;
  error: string | null;
  matchedDuel: Duel | null;
  opponent: {
    username: string;
    userId?: number;
  } | null;
  searchStartTime: number | null;
  timeInQueue: number;
}

// 🚀 PERFORMANCE FIX 1: Single State Object with useReducer
interface DuelRoomState {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  retryCount: number;
  maxRetries: number;

  // Room state
  isInRoom: boolean;
  roomError: string | null;
  session: any | null;

  // Game state
  phase:
    | 'connecting'
    | 'lobby'
    | 'countdown'
    | 'question'
    | 'results'
    | 'final'
    | 'error';
  currentQuestion: any | null;
  questionIndex: number;
  totalQuestions: number;
  timeLeft: number;
  userScore: number;
  opponentScore: number;
  hasAnswered: boolean;
  opponentAnswered: boolean;
  gameError: string | null;
  roundResult: RoundResult | null;
  finalResults: FinalResults | null;
}

// 🚀 PERFORMANCE FIX 2: Action Types for Reducer
type DuelRoomAction =
  | {
      type: 'SET_CONNECTION';
      payload: Partial<
        Pick<
          DuelRoomState,
          'isConnected' | 'isConnecting' | 'connectionError' | 'retryCount'
        >
      >;
    }
  | {
      type: 'SET_ROOM';
      payload: Partial<
        Pick<DuelRoomState, 'isInRoom' | 'roomError' | 'session'>
      >;
    }
  | {
      type: 'SET_GAME';
      payload: Partial<
        Pick<
          DuelRoomState,
          | 'phase'
          | 'currentQuestion'
          | 'questionIndex'
          | 'totalQuestions'
          | 'timeLeft'
          | 'userScore'
          | 'opponentScore'
          | 'hasAnswered'
          | 'opponentAnswered'
          | 'gameError'
          | 'roundResult'
          | 'finalResults'
        >
      >;
    }
  | { type: 'BATCH_UPDATE'; payload: Partial<DuelRoomState> }
  | { type: 'RESET_GAME' };

// 🚀 PERFORMANCE FIX 3: Optimized Reducer
const initialDuelRoomState: DuelRoomState = {
  isConnected: false,
  isConnecting: false,
  connectionError: null,
  retryCount: 0,
  maxRetries: 3,
  isInRoom: false,
  roomError: null,
  session: null,
  phase: 'connecting',
  currentQuestion: null,
  questionIndex: 0,
  totalQuestions: 3,
  timeLeft: 60,
  userScore: 0,
  opponentScore: 0,
  hasAnswered: false,
  opponentAnswered: false,
  gameError: null,
  roundResult: null,
  finalResults: null,
};

const duelRoomReducer = (
  state: DuelRoomState,
  action: DuelRoomAction,
): DuelRoomState => {
  switch (action.type) {
    case 'SET_CONNECTION':
      return { ...state, ...action.payload };
    case 'SET_ROOM':
      return { ...state, ...action.payload };
    case 'SET_GAME':
      return { ...state, ...action.payload };
    case 'BATCH_UPDATE':
      return { ...state, ...action.payload };
    case 'RESET_GAME':
      return { ...initialDuelRoomState, phase: 'connecting' };
    default:
      return state;
  }
};

// 🚀 PERFORMANCE FIX 4: Memoized User ID Cache
const userIdCache = { value: null as number | null, timestamp: 0 };
const USER_ID_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedUserId = async (): Promise<number | null> => {
  const now = Date.now();

  if (
    userIdCache.value &&
    now - userIdCache.timestamp < USER_ID_CACHE_DURATION
  ) {
    return userIdCache.value;
  }

  try {
    const userDataString = await AsyncStorage.getItem('userData');
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      const userId = userData.userId || null;

      userIdCache.value = userId;
      userIdCache.timestamp = now;

      return userId;
    }
  } catch (error) {
    console.error('Error getting cached user ID:', error);
  }

  return null;
};

// 🚀 PERFORMANCE FIX 5: Optimized Auth Token Cache
const authTokenCache = { value: null as string | null, timestamp: 0 };
const AUTH_TOKEN_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

const getCachedAuthToken = async (): Promise<string | null> => {
  const now = Date.now();

  if (
    authTokenCache.value &&
    now - authTokenCache.timestamp < AUTH_TOKEN_CACHE_DURATION
  ) {
    return authTokenCache.value;
  }

  try {
    const authToken = await AsyncStorage.getItem('authToken');
    const userToken = await AsyncStorage.getItem('userToken');
    const token = authToken || userToken;

    if (token) {
      authTokenCache.value = token;
      authTokenCache.timestamp = now;
    }

    return token;
  } catch (error) {
    console.error('Error getting cached auth token:', error);
    return null;
  }
};

// 🚀 NEW: QUICK MATCH HOOK
export function useQuickMatch() {
  const [quickMatchState, setQuickMatchState] = useState<QuickMatchState>({
    status: 'idle',
    courseId: null,
    message: '',
    error: null,
    matchedDuel: null,
    opponent: null,
    searchStartTime: null,
    timeInQueue: 0,
  });

  const [eventListenersSetup, setEventListenersSetup] = useState(false);
  const timerRef = useRef<number | null>(null);
  const cleanupFunctionsRef = useRef<Array<() => void>>([]);

  // 🔄 Setup Quick Match Event Listeners
  const setupQuickMatchListeners = useCallback(async () => {
    if (eventListenersSetup) {
      console.log('🔄 Quick match listeners already setup, cleaning up first');

      // Cleanup existing listeners
      cleanupFunctionsRef.current.forEach((cleanup) => {
        try {
          cleanup();
        } catch (error) {
          console.warn('Error cleaning up quick match listener:', error);
        }
      });
      cleanupFunctionsRef.current = [];
    }

    try {
      const {
        on,
        off,
        onQuickMatchSearching,
        onQuickMatchFound,
        onQuickMatchTimeout,
        onQuickMatchError,
        onQuickMatchCancelled,
      } = socketService;

      // Clear any existing listeners first
      off('quick_match_searching');
      off('quick_match_found');
      off('quick_match_timeout');
      off('quick_match_error');
      off('quick_match_cancelled');

      console.log('🎯 Setting up quick match event listeners');

      // Handle search started
      const handleQuickMatchSearching = (data: { message: string }) => {
        console.log('🔍 Quick match searching:', data.message);
        setQuickMatchState((prev) => ({
          ...prev,
          status: 'searching',
          message: data.message || 'Eşleşme aranıyor...',
          error: null,
          searchStartTime: Date.now(),
        }));
      };

      // Handle match found
      const handleQuickMatchFound = (data: {
        duel: Duel;
        opponent: { username: string; userId?: number };
      }) => {
        console.log('✅ Quick match found:', data);
        setQuickMatchState((prev) => ({
          ...prev,
          status: 'found',
          message: `Eşleşme bulundu! Rakip: ${data.opponent.username}`,
          matchedDuel: data.duel,
          opponent: data.opponent,
          error: null,
        }));

        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      // Handle timeout (bot fallback)
      const handleQuickMatchTimeout = (data: {
        duel: Duel;
        message: string;
      }) => {
        console.log('⏰ Quick match timeout, bot created:', data);
        setQuickMatchState((prev) => ({
          ...prev,
          status: 'timeout',
          message:
            data.message || 'Eşleşme bulunamadı, bot ile düello başlatıldı',
          matchedDuel: data.duel,
          opponent: { username: 'Dr. Bot', userId: data.duel.opponent_id },
          error: null,
        }));

        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      // Handle error
      const handleQuickMatchError = (data: { message: string }) => {
        console.log('❌ Quick match error:', data.message);
        setQuickMatchState((prev) => ({
          ...prev,
          status: 'error',
          message: '',
          error: data.message || 'Eşleşme hatası oluştu',
          matchedDuel: null,
          opponent: null,
        }));

        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      // Handle cancelled
      const handleQuickMatchCancelled = (data: { message: string }) => {
        console.log('🚫 Quick match cancelled:', data.message);
        setQuickMatchState((prev) => ({
          ...prev,
          status: 'cancelled',
          message: data.message || 'Eşleşme iptal edildi',
          error: null,
          matchedDuel: null,
          opponent: null,
          searchStartTime: null,
          timeInQueue: 0,
        }));

        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      // Register event listeners using the typed functions
      onQuickMatchSearching(handleQuickMatchSearching);
      onQuickMatchFound(handleQuickMatchFound);
      onQuickMatchTimeout(handleQuickMatchTimeout);
      onQuickMatchError(handleQuickMatchError);
      onQuickMatchCancelled(handleQuickMatchCancelled);

      // Store cleanup functions
      cleanupFunctionsRef.current = [
        () => off('quick_match_searching', handleQuickMatchSearching),
        () => off('quick_match_found', handleQuickMatchFound),
        () => off('quick_match_timeout', handleQuickMatchTimeout),
        () => off('quick_match_error', handleQuickMatchError),
        () => off('quick_match_cancelled', handleQuickMatchCancelled),
      ];

      setEventListenersSetup(true);
      console.log('✅ Quick match listeners setup complete');
    } catch (error) {
      console.error('❌ Failed to setup quick match listeners:', error);
      setQuickMatchState((prev) => ({
        ...prev,
        status: 'error',
        error: 'Failed to setup quick match listeners',
      }));
    }
  }, [eventListenersSetup]);

  // 🎯 Join Quick Match Queue
  const joinQuickMatch = useCallback(
    async (courseId: number) => {
      try {
        console.log(`🚀 Joining quick match queue for course ${courseId}`);

        if (!socketService.isConnected()) {
          throw new Error('Socket bağlantısı yok. Lütfen tekrar deneyin.');
        }

        if (!eventListenersSetup) {
          await setupQuickMatchListeners();
        }

        setQuickMatchState((prev) => ({
          ...prev,
          status: 'searching',
          courseId,
          message: 'Eşleşme kuyruğuna katılıyor...',
          error: null,
          matchedDuel: null,
          opponent: null,
          searchStartTime: Date.now(),
          timeInQueue: 0,
        }));

        socketService.joinQuickMatch(courseId);

        timerRef.current = setInterval(() => {
          setQuickMatchState((prev) => {
            if (prev.searchStartTime && prev.status === 'searching') {
              const timeInQueue = Math.floor(
                (Date.now() - prev.searchStartTime) / 1000,
              );
              return { ...prev, timeInQueue };
            }
            return prev;
          });
        }, 1000) as any;

        console.log('✅ Quick match join request sent');
      } catch (error) {
        console.error('❌ Failed to join quick match:', error);
        setQuickMatchState((prev) => ({
          ...prev,
          status: 'error',
          error:
            error instanceof Error
              ? error.message
              : 'Eşleşme kuyruğuna katılım başarısız',
        }));
      }
    },
    [eventListenersSetup, setupQuickMatchListeners],
  );

  // 🚪 Leave Quick Match Queue
  const leaveQuickMatch = useCallback(async () => {
    try {
      console.log('🚪 Leaving quick match queue');

      if (!socketService.isConnected()) {
        console.warn('Socket not connected, cannot send leave request');
      } else {
        socketService.leaveQuickMatch();
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      setQuickMatchState({
        status: 'idle',
        courseId: null,
        message: '',
        error: null,
        matchedDuel: null,
        opponent: null,
        searchStartTime: null,
        timeInQueue: 0,
      });

      console.log('✅ Left quick match queue');
    } catch (error) {
      console.error('❌ Failed to leave quick match:', error);
      setQuickMatchState((prev) => ({
        ...prev,
        status: 'error',
        error:
          error instanceof Error ? error.message : 'Kuyruktan çıkış başarısız',
      }));
    }
  }, []);

  // 🔄 Reset Quick Match State
  const resetQuickMatch = useCallback(() => {
    console.log('🔄 Resetting quick match state');

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setQuickMatchState({
      status: 'idle',
      courseId: null,
      message: '',
      error: null,
      matchedDuel: null,
      opponent: null,
      searchStartTime: null,
      timeInQueue: 0,
    });
  }, []);

  // 🧹 Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Cleaning up quick match hook');

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      cleanupFunctionsRef.current.forEach((cleanup) => {
        try {
          cleanup();
        } catch (error) {
          console.warn('Error cleaning up quick match listener:', error);
        }
      });
      cleanupFunctionsRef.current = [];

      if (quickMatchState.status === 'searching') {
        try {
          if (socketService.isConnected()) {
            socketService.leaveQuickMatch();
          }
        } catch (error) {
          console.warn('Error leaving quick match on cleanup:', error);
        }
      }
    };
  }, [quickMatchState.status]);

  // 🎯 Auto-setup listeners when socket connects
  useEffect(() => {
    const checkSocketAndSetupListeners = async () => {
      if (socketService.isConnected() && !eventListenersSetup) {
        await setupQuickMatchListeners();
      }
    };

    checkSocketAndSetupListeners();
  }, [setupQuickMatchListeners, eventListenersSetup]);

  return {
    // State
    quickMatchState,
    isSearching: quickMatchState.status === 'searching',
    isMatchFound: quickMatchState.status === 'found',
    isTimeout: quickMatchState.status === 'timeout',
    hasError: quickMatchState.status === 'error',
    isCancelled: quickMatchState.status === 'cancelled',

    // Actions
    joinQuickMatch,
    leaveQuickMatch,
    resetQuickMatch,
    setupQuickMatchListeners,

    // Computed values
    canJoinQueue: quickMatchState.status === 'idle',
    canLeaveQueue: quickMatchState.status === 'searching',
    timeInQueue: quickMatchState.timeInQueue,
    matchedDuel: quickMatchState.matchedDuel,
    opponent: quickMatchState.opponent,
    error: quickMatchState.error,
    message: quickMatchState.message,
  };
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

              // Use cached user ID for better performance
              const currentUserId = await getCachedUserId();
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

// 🚀 BOT DETECTION AND INFO HOOK
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

// 🚀 PERFORMANCE OPTIMIZED DUEL ROOM MANAGEMENT HOOK
export function useDuelRoomManagement(duelId: number) {
  // 🚀 PERFORMANCE FIX 6: Single useReducer instead of 3 useState
  const [state, dispatch] = useReducer(duelRoomReducer, initialDuelRoomState);

  // Get duel details and bot info (unchanged)
  const duelDetailsQuery = useDuelDetails(duelId);
  const opponentId = duelDetailsQuery.data?.duel?.opponent_id;
  const botInfoQuery = useBotInfo(opponentId);

  // 🚀 PERFORMANCE FIX 7: Memoized dispatch functions
  const dispatchActions = useMemo(
    () => ({
      setConnection: (
        payload: Partial<
          Pick<
            DuelRoomState,
            'isConnected' | 'isConnecting' | 'connectionError' | 'retryCount'
          >
        >,
      ) => {
        unstable_batchedUpdates(() => {
          dispatch({ type: 'SET_CONNECTION', payload });
        });
      },
      setRoom: (
        payload: Partial<
          Pick<DuelRoomState, 'isInRoom' | 'roomError' | 'session'>
        >,
      ) => {
        unstable_batchedUpdates(() => {
          dispatch({ type: 'SET_ROOM', payload });
        });
      },
      setGame: (
        payload: Partial<
          Pick<
            DuelRoomState,
            | 'phase'
            | 'currentQuestion'
            | 'questionIndex'
            | 'totalQuestions'
            | 'timeLeft'
            | 'userScore'
            | 'opponentScore'
            | 'hasAnswered'
            | 'opponentAnswered'
            | 'gameError'
            | 'roundResult'
            | 'finalResults'
          >
        >,
      ) => {
        unstable_batchedUpdates(() => {
          dispatch({ type: 'SET_GAME', payload });
        });
      },
      batchUpdate: (payload: Partial<DuelRoomState>) => {
        unstable_batchedUpdates(() => {
          dispatch({ type: 'BATCH_UPDATE', payload });
        });
      },
      resetGame: () => {
        unstable_batchedUpdates(() => {
          dispatch({ type: 'RESET_GAME' });
        });
      },
    }),
    [],
  );

  // Stable refs (enhanced with duelId tracking)
  const stableRefs = useRef({
    cleanupFunctions: [] as Array<() => void>,
    connectionTimeout: null as number | null,
    isCleaningUp: false,
    connectionAttempt: null as Promise<void> | null,
    eventListenersSetup: false,
    isMounted: true,
    hasConnectedOnce: false,
    retryCount: 0,
    maxRetries: 3,
    currentDuelId: duelId, // Track current duel ID
  });

  // 🔧 CRITICAL FIX: Reset state when duel ID changes
  useEffect(() => {
    const refs = stableRefs.current;

    if (refs.currentDuelId !== duelId) {
      console.log(
        '🔄 Duel ID changed, resetting ALL state:',
        refs.currentDuelId,
        '->',
        duelId,
      );

      // Update tracked duel ID
      refs.currentDuelId = duelId;

      // Reset initialization flags
      refs.hasConnectedOnce = false;
      refs.retryCount = 0;
      refs.isCleaningUp = false;
      refs.connectionAttempt = null;

      // CRITICAL: Force cleanup of old event listeners
      if (refs.eventListenersSetup) {
        console.log(
          '🧹 Forcing cleanup of old event listeners for previous duel',
        );
        refs.cleanupFunctions.forEach((cleanupFn) => {
          try {
            cleanupFn();
          } catch (error) {
            console.warn('Error cleaning up old listener:', error);
          }
        });
        refs.cleanupFunctions = [];
        refs.eventListenersSetup = false;
      }

      // CRITICAL: Reset the reducer state completely
      dispatchActions.resetGame();

      console.log('✅ Complete state reset for new duel:', duelId);
    }
  }, [duelId, dispatchActions]);

  // 🚀 PERFORMANCE FIX 8: Debounced Event Handlers
  const debouncedEventHandlers = useMemo(() => {
    let eventTimeout: any = null;

    const debouncedDispatch = (action: DuelRoomAction, delay: number = 16) => {
      if (eventTimeout) clearTimeout(eventTimeout);
      eventTimeout = setTimeout(() => {
        unstable_batchedUpdates(() => {
          dispatch(action);
        });
      }, delay);
    };

    return {
      handleConnect: () => {
        console.log('📡 Socket connected for duel:', duelId);
        stableRefs.current.hasConnectedOnce = true;
        debouncedDispatch({
          type: 'SET_CONNECTION',
          payload: { isConnected: true },
        });
      },

      handleDisconnect: () => {
        console.log('📡 Socket disconnected for duel:', duelId);
        debouncedDispatch({
          type: 'BATCH_UPDATE',
          payload: { isConnected: false, isInRoom: false },
        });
      },

      handleRoomJoined: (data: { session: any }) => {
        console.log('🚪 ROOM JOINED SUCCESS for duel:', duelId);
        debouncedDispatch({
          type: 'BATCH_UPDATE',
          payload: {
            isInRoom: true,
            roomError: null,
            session: data.session,
            phase: 'lobby' as const,
          },
        });
      },

      handleGameStateUpdate: (
        gameUpdate: Partial<
          Pick<
            DuelRoomState,
            | 'phase'
            | 'currentQuestion'
            | 'questionIndex'
            | 'totalQuestions'
            | 'timeLeft'
            | 'hasAnswered'
            | 'opponentAnswered'
          >
        >,
      ) => {
        debouncedDispatch({ type: 'SET_GAME', payload: gameUpdate });
      },
    };
  }, [duelId]);

  // 🚀 ENHANCED EVENT LISTENERS SETUP with aggressive cleanup
  const setupEventListeners = useCallback(() => {
    const refs = stableRefs.current;

    if (refs.eventListenersSetup) {
      console.log(
        '📡 Event listeners already set up, cleaning up first for duel:',
        duelId,
      );
      // CRITICAL: Force cleanup of existing listeners before setting up new ones
      refs.cleanupFunctions.forEach((cleanupFn) => {
        try {
          cleanupFn();
        } catch (error) {
          console.warn('Error cleaning up old listener:', error);
        }
      });
      refs.cleanupFunctions = [];
      refs.eventListenersSetup = false;
    }

    console.log(
      '📡 Setting up fresh duel room event listeners for duel:',
      duelId,
    );
    refs.eventListenersSetup = true;

    // AGGRESSIVE cleanup of ALL potential event listeners
    const cleanupAllExisting = () => {
      const eventNames = [
        'connect',
        'disconnect',
        'room_joined',
        'room_error',
        'duel_starting',
        'question_presented',
        'timer_update',
        'opponent_answered',
        'round_result',
        'duel_completed',
        'duel_error',
        'question_time_up',
        // Additional potential events that might exist
        'duel_cancelled',
        'connection_lost',
        'reconnect_attempt',
        'user_disconnected',
      ];

      eventNames.forEach((eventName) => {
        try {
          socketService.off(eventName);
        } catch (error) {
          // Ignore cleanup errors but log them for debugging
          console.debug(`Cleanup warning for event ${eventName}:`, error);
        }
      });
    };

    // Perform aggressive cleanup before setting up new listeners
    cleanupAllExisting();

    // 🚀 ENHANCED EVENT HANDLERS with duel ID validation and improved error handling
    const handleRoomError = (data: { message: string; duelId?: number }) => {
      try {
        // Validate this event is for current duel
        if (data.duelId && data.duelId !== duelId) {
          console.warn(
            'Ignoring room error for different duel:',
            data.duelId,
            'vs current:',
            duelId,
          );
          return;
        }

        console.log('❌ Room error for duel:', duelId, data.message);
        dispatchActions.batchUpdate({
          roomError: data.message,
          phase: 'error',
          gameError: data.message,
        });
      } catch (error) {
        console.error('Error handling room error:', error);
      }
    };

    const handleDuelStarting = (data: {
      countdown: number;
      duelId?: number;
    }) => {
      try {
        // Validate this event is for current duel
        if (data.duelId && data.duelId !== duelId) {
          console.warn(
            'Ignoring duel starting for different duel:',
            data.duelId,
            'vs current:',
            duelId,
          );
          return;
        }

        console.log('🏁 Duel starting for duel:', duelId, data);
        dispatchActions.setGame({ phase: 'countdown' });
      } catch (error) {
        console.error('Error handling duel starting:', error);
      }
    };

    const handleQuestionPresented = (data: any) => {
      try {
        // Validate this event is for current duel
        if (data.duelId && data.duelId !== duelId) {
          console.warn(
            'Ignoring question for different duel:',
            data.duelId,
            'vs current:',
            duelId,
          );
          return;
        }

        // Validate required data structure
        if (!data.question) {
          console.error('Invalid question data - missing question:', data);
          return;
        }

        console.log('❓ Question presented for duel:', duelId, {
          questionIndex: data.questionIndex,
          totalQuestions: data.totalQuestions,
          timeLimit: data.timeLimit,
        });

        dispatchActions.batchUpdate({
          phase: 'question',
          currentQuestion: data.question,
          questionIndex: data.questionIndex || 0,
          totalQuestions: data.totalQuestions || 3,
          timeLeft: Math.ceil((data.timeLimit || 60000) / 1000),
          hasAnswered: false,
          opponentAnswered: false,
          gameError: null, // Clear any previous errors
        });
      } catch (error) {
        console.error('Error handling question presented:', error);
        dispatchActions.setGame({
          phase: 'error',
          gameError: 'Failed to process question data',
        });
      }
    };

    const handleTimerUpdate = (data: any) => {
      try {
        // Validate this event is for current duel
        if (data.duelId && data.duelId !== duelId) {
          console.debug(
            'Ignoring timer update for different duel:',
            data.duelId,
            'vs current:',
            duelId,
          );
          return;
        }

        // Validate timer data
        if (typeof data.timeRemaining !== 'number' || data.timeRemaining < 0) {
          console.warn('Invalid timer data:', data);
          return;
        }

        dispatchActions.setGame({ timeLeft: Math.max(0, data.timeRemaining) });
      } catch (error) {
        console.error('Error handling timer update:', error);
      }
    };

    const handleOpponentAnswered = (data: any = {}) => {
      try {
        // Validate this event is for current duel
        if (data.duelId && data.duelId !== duelId) {
          console.warn(
            'Ignoring opponent answer for different duel:',
            data.duelId,
            'vs current:',
            duelId,
          );
          return;
        }

        console.log('👥 Opponent answered for duel:', duelId);
        dispatchActions.setGame({ opponentAnswered: true });
      } catch (error) {
        console.error('Error handling opponent answered:', error);
      }
    };

    // 🔧 CRITICAL: Enhanced round result handler with improved validation and error handling
    const handleRoundResult = async (data: any) => {
      try {
        console.log('Round result received for duel:', duelId);

        // VALIDATION: Make sure this event is for the current duel
        if (data.duelId && data.duelId !== duelId) {
          console.warn(
            'Ignoring round result for different duel:',
            data.duelId,
            'vs current:',
            duelId,
          );
          return;
        }

        // Validate data structure
        if (!data || !data.question || !Array.isArray(data.answers)) {
          console.error('Invalid round result data structure:', data);
          dispatchActions.setGame({
            phase: 'error',
            gameError: 'Invalid round result data received',
          });
          return;
        }

        // Get user ID from cache for better performance
        const currentUserId = await getCachedUserId();
        if (!currentUserId) {
          console.warn('No current user ID found for round result processing');
          dispatchActions.setGame({
            phase: 'error',
            gameError: 'User authentication lost during duel',
          });
          return;
        }

        // Calculate score updates
        const userAnswer = data.answers.find(
          (a: any) => a && a.userId === currentUserId,
        );
        const opponentAnswer = data.answers.find(
          (a: any) => a && a.userId !== currentUserId,
        );

        // Get current scores at execution time (not from closure)
        const currentState = state; // Access current state
        const currentUserScore = currentState.userScore || 0;
        const currentOpponentScore = currentState.opponentScore || 0;

        console.log('Score calculation for duel:', duelId, {
          currentUserId,
          currentUserScore,
          currentOpponentScore,
          userAnswer: userAnswer
            ? { isCorrect: userAnswer.isCorrect, userId: userAnswer.userId }
            : null,
          opponentAnswer: opponentAnswer
            ? {
                isCorrect: opponentAnswer.isCorrect,
                userId: opponentAnswer.userId,
              }
            : null,
        });

        // Calculate new scores
        const newUserScore = currentUserScore + (userAnswer?.isCorrect ? 1 : 0);
        const newOpponentScore =
          currentOpponentScore + (opponentAnswer?.isCorrect ? 1 : 0);

        // IMMEDIATE phase switch - no delays
        console.log(
          'IMMEDIATE TRANSITION: question phase -> results phase for duel:',
          duelId,
        );

        // Single batched state update with calculated scores
        dispatchActions.batchUpdate({
          phase: 'results',
          roundResult: {
            ...data,
            // Ensure we have all required data
            questionIndex: data.questionIndex || 0,
            userCorrect: userAnswer?.isCorrect || false,
            opponentCorrect: opponentAnswer?.isCorrect || false,
          },
          userScore: newUserScore,
          opponentScore: newOpponentScore,
          timeLeft: 0, // Stop question timer immediately
          hasAnswered: false, // Reset for next question
          opponentAnswered: false, // Reset for next question
          gameError: null, // Clear any previous errors
        });

        console.log('Results phase active for duel:', duelId, {
          newUserScore,
          newOpponentScore,
        });
      } catch (error) {
        console.error('Error processing round result for duel:', duelId, error);

        // Even if score calculation fails, still switch to results immediately
        console.log(
          'FALLBACK: Switching to results phase despite error for duel:',
          duelId,
        );

        dispatchActions.batchUpdate({
          phase: 'results',
          roundResult: data || null,
          timeLeft: 0,
          hasAnswered: false,
          opponentAnswered: false,
          gameError: null,
        });
      }
    };

    // 🔧 CRITICAL: Enhanced duel completed handler with comprehensive validation
    const handleDuelCompleted = (data: any) => {
      try {
        console.log('🎉 Duel completed for duel:', duelId, data);

        // VALIDATION: Make sure this event is for the current duel
        if (data.duelId && data.duelId !== duelId) {
          console.warn(
            'Ignoring duel completion for different duel:',
            data.duelId,
            'vs current:',
            duelId,
          );
          return;
        }

        // Validate final results data structure
        if (!data) {
          console.error(
            '❌ Invalid final results data for duel:',
            duelId,
            data,
          );
          dispatchActions.setGame({
            phase: 'error',
            gameError: 'Invalid final results received',
          });
          return;
        }

        // Ensure final results have required structure
        const finalResults = {
          ...data,
          // Provide defaults if missing
          winnerId: data.winnerId || null,
          user1: data.user1 || {
            userId: 0,
            score: 0,
            totalTime: 0,
            accuracy: 0,
          },
          user2: data.user2 || {
            userId: 0,
            score: 0,
            totalTime: 0,
            accuracy: 0,
          },
        };

        dispatchActions.setGame({
          phase: 'final',
          finalResults,
          gameError: null, // Clear any errors
        });

        console.log('✅ Duel completion processed for duel:', duelId);
      } catch (error) {
        console.error(
          'Error handling duel completion for duel:',
          duelId,
          error,
        );
        dispatchActions.setGame({
          phase: 'error',
          gameError: 'Failed to process duel completion',
        });
      }
    };

    const handleGameError = (data: { message: string; duelId?: number }) => {
      try {
        // Validate this event is for current duel
        if (data.duelId && data.duelId !== duelId) {
          console.warn(
            'Ignoring game error for different duel:',
            data.duelId,
            'vs current:',
            duelId,
          );
          return;
        }

        console.log('❌ Game error for duel:', duelId, data.message);
        dispatchActions.batchUpdate({
          phase: 'error',
          gameError: data.message || 'Unknown game error occurred',
        });
      } catch (error) {
        console.error('Error handling game error:', error);
        dispatchActions.setGame({
          phase: 'error',
          gameError: 'Critical error in game state management',
        });
      }
    };

    // Additional event handlers for better connection management
    const handleConnectionLost = () => {
      try {
        console.log('🔌 Connection lost for duel:', duelId);
        dispatchActions.batchUpdate({
          isConnected: false,
          isInRoom: false,
          connectionError: 'Connection lost during duel',
        });
      } catch (error) {
        console.error('Error handling connection lost:', error);
      }
    };

    const handleDuelCancelled = (data: {
      reason?: string;
      duelId?: number;
    }) => {
      try {
        if (data.duelId && data.duelId !== duelId) {
          console.warn(
            'Ignoring cancellation for different duel:',
            data.duelId,
          );
          return;
        }

        console.log('🚫 Duel cancelled for duel:', duelId, data.reason);
        dispatchActions.setGame({
          phase: 'error',
          gameError: data.reason || 'Duel was cancelled',
        });
      } catch (error) {
        console.error('Error handling duel cancellation:', error);
      }
    };

    // Register all event listeners with enhanced error handling
    try {
      socketService.on('connect', debouncedEventHandlers.handleConnect);
      socketService.on('disconnect', debouncedEventHandlers.handleDisconnect);
      socketService.on('room_joined', debouncedEventHandlers.handleRoomJoined);
      socketService.on('room_error', handleRoomError);
      socketService.on('duel_starting', handleDuelStarting);
      socketService.on('question_presented', handleQuestionPresented);
      socketService.on('timer_update', handleTimerUpdate);
      socketService.on('opponent_answered', handleOpponentAnswered);
      socketService.on('round_result', handleRoundResult);
      socketService.on('duel_completed', handleDuelCompleted);
      socketService.on('duel_error', handleGameError);

      // Additional event listeners for better error handling
      socketService.on('connection_lost', handleConnectionLost);
      socketService.on('duel_cancelled', handleDuelCancelled);

      console.log('✅ All event listeners registered for duel:', duelId);
    } catch (error) {
      console.error(
        'Error registering event listeners for duel:',
        duelId,
        error,
      );
      dispatchActions.setGame({
        phase: 'error',
        gameError: 'Failed to set up event listeners',
      });
      return;
    }

    // Store cleanup functions with enhanced error handling
    const cleanupFunctions = [
      () => {
        try {
          socketService.off('connect', debouncedEventHandlers.handleConnect);
        } catch (e) {
          console.debug('Cleanup error for connect:', e);
        }
      },
      () => {
        try {
          socketService.off(
            'disconnect',
            debouncedEventHandlers.handleDisconnect,
          );
        } catch (e) {
          console.debug('Cleanup error for disconnect:', e);
        }
      },
      () => {
        try {
          socketService.off(
            'room_joined',
            debouncedEventHandlers.handleRoomJoined,
          );
        } catch (e) {
          console.debug('Cleanup error for room_joined:', e);
        }
      },
      () => {
        try {
          socketService.off('room_error', handleRoomError);
        } catch (e) {
          console.debug('Cleanup error for room_error:', e);
        }
      },
      () => {
        try {
          socketService.off('duel_starting', handleDuelStarting);
        } catch (e) {
          console.debug('Cleanup error for duel_starting:', e);
        }
      },
      () => {
        try {
          socketService.off('question_presented', handleQuestionPresented);
        } catch (e) {
          console.debug('Cleanup error for question_presented:', e);
        }
      },
      () => {
        try {
          socketService.off('timer_update', handleTimerUpdate);
        } catch (e) {
          console.debug('Cleanup error for timer_update:', e);
        }
      },
      () => {
        try {
          socketService.off('opponent_answered', handleOpponentAnswered);
        } catch (e) {
          console.debug('Cleanup error for opponent_answered:', e);
        }
      },
      () => {
        try {
          socketService.off('round_result', handleRoundResult);
        } catch (e) {
          console.debug('Cleanup error for round_result:', e);
        }
      },
      () => {
        try {
          socketService.off('duel_completed', handleDuelCompleted);
        } catch (e) {
          console.debug('Cleanup error for duel_completed:', e);
        }
      },
      () => {
        try {
          socketService.off('duel_error', handleGameError);
        } catch (e) {
          console.debug('Cleanup error for duel_error:', e);
        }
      },
      () => {
        try {
          socketService.off('connection_lost', handleConnectionLost);
        } catch (e) {
          console.debug('Cleanup error for connection_lost:', e);
        }
      },
      () => {
        try {
          socketService.off('duel_cancelled', handleDuelCancelled);
        } catch (e) {
          console.debug('Cleanup error for duel_cancelled:', e);
        }
      },
      () => {
        try {
          cleanupAllExisting(); // Final aggressive cleanup
        } catch (e) {
          console.debug('Cleanup error for cleanupAllExisting:', e);
        }
      },
    ];

    // Add cleanup functions to refs
    refs.cleanupFunctions.push(...cleanupFunctions);

    console.log(
      '✅ Fresh event listeners set up successfully for duel:',
      duelId,
      '- Total cleanup functions:',
      refs.cleanupFunctions.length,
    );
  }, [
    debouncedEventHandlers,
    dispatchActions,
    duelId,
    // Removed state.userScore and state.opponentScore to prevent unnecessary recreations
  ]);

  // 🚀 PERFORMANCE FIX 12: Optimized Connection Logic
  const initializeConnection = useCallback(async () => {
    const refs = stableRefs.current;

    // Prevent multiple concurrent connection attempts
    if (refs.connectionAttempt) {
      console.log(
        '🔄 Connection already in progress for duel:',
        duelId,
        'skipping...',
      );
      return refs.connectionAttempt;
    }

    console.log('🚀 Initializing duel room connection for duel:', duelId);

    const connectAttempt = async (): Promise<void> => {
      dispatchActions.setConnection({
        isConnecting: true,
        connectionError: null,
      });

      try {
        // Get cached token for better performance
        const token = await getCachedAuthToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        // Set connection timeout
        refs.connectionTimeout = setTimeout(() => {
          throw new Error('Connection timeout after 15 seconds');
        }, 15000) as any;

        // Attempt connection
        console.log('🔌 Connecting to socket for duel:', duelId);
        await socketService.connect(token);

        // Clear timeout
        if (refs.connectionTimeout) {
          clearTimeout(refs.connectionTimeout);
          refs.connectionTimeout = null;
        }

        // Verify connection
        if (!socketService.isConnected()) {
          throw new Error('Socket connection failed');
        }

        console.log('✅ Socket connected successfully for duel:', duelId);

        refs.retryCount = 0; // Reset retry count on successful connection
        dispatchActions.batchUpdate({
          isConnected: true,
          isConnecting: false,
          connectionError: null,
          retryCount: 0,
        });

        // Set up event listeners AFTER successful connection
        setupEventListeners();

        // Auto-join room after connection
        try {
          console.log('🚪 Joining duel room:', duelId);
          socketService.joinDuelRoom(duelId);
          dispatchActions.setRoom({ roomError: null });
        } catch (roomError) {
          const errorMessage =
            roomError instanceof Error
              ? roomError.message
              : 'Failed to join room';
          console.error('❌ Failed to join duel room:', duelId, errorMessage);
          dispatchActions.setRoom({ roomError: errorMessage });
        }
      } catch (error) {
        // Clear timeout
        if (refs.connectionTimeout) {
          clearTimeout(refs.connectionTimeout);
          refs.connectionTimeout = null;
        }

        const errorMessage =
          error instanceof Error ? error.message : 'Connection failed';
        console.error('❌ Connection failed for duel:', duelId, errorMessage);

        refs.retryCount++;
        dispatchActions.batchUpdate({
          isConnected: false,
          isConnecting: false,
          connectionError: errorMessage,
          retryCount: refs.retryCount,
        });

        // Retry logic
        if (refs.retryCount < refs.maxRetries) {
          const retryDelay = Math.min(
            1000 * Math.pow(2, refs.retryCount),
            10000,
          );
          console.log(
            `🔄 Retrying connection for duel ${duelId} in ${retryDelay}ms... (${refs.retryCount}/${refs.maxRetries})`,
          );

          setTimeout(() => {
            refs.connectionAttempt = null;
            initializeConnection();
          }, retryDelay);
        } else {
          dispatchActions.setGame({
            phase: 'error',
            gameError: errorMessage,
          });
        }

        throw error;
      }
    };

    refs.connectionAttempt = connectAttempt();
    return refs.connectionAttempt;
  }, [dispatchActions, setupEventListeners, duelId]);

  // 🚀 PERFORMANCE FIX 13: Optimized Actions
  const submitAnswer = useCallback(
    async (selectedAnswer: string | null, timeTaken: number) => {
      if (!state.currentQuestion || state.hasAnswered) {
        console.warn(
          '⚠️ Cannot submit answer for duel:',
          duelId,
          '- no question or already answered',
        );
        return;
      }

      if (!socketService.isConnected()) {
        throw new Error('Socket not connected');
      }

      try {
        console.log('📝 Submitting answer for duel:', duelId, {
          selectedAnswer,
          timeTaken,
        });
        socketService.submitAnswer(
          state.currentQuestion.id,
          selectedAnswer,
          timeTaken,
        );
        dispatchActions.setGame({ hasAnswered: true });
      } catch (error) {
        console.error('❌ Failed to submit answer for duel:', duelId, error);
        throw error;
      }
    },
    [state.currentQuestion, state.hasAnswered, dispatchActions, duelId],
  );

  // 🔧 STABLE: Signal ready
  const signalReady = useCallback(async () => {
    if (!socketService.isConnected()) {
      throw new Error('Socket not connected');
    }

    try {
      console.log('✅ Signaling ready for duel:', duelId);
      socketService.signalReady();
    } catch (error) {
      console.error('❌ Failed to signal ready for duel:', duelId, error);
      throw error;
    }
  }, [duelId]);

  // 🔧 ENHANCED: Cleanup with duel ID tracking
  const cleanup = useCallback(() => {
    const refs = stableRefs.current;

    console.log('🧹 FINAL CLEANUP - Component unmounting for duel:', duelId);
    refs.isCleaningUp = true;
    refs.isMounted = false;

    // Clear timeout
    if (refs.connectionTimeout) {
      clearTimeout(refs.connectionTimeout);
      refs.connectionTimeout = null;
    }

    // Run cleanup functions
    refs.cleanupFunctions.forEach((cleanupFn) => {
      try {
        cleanupFn();
      } catch (error) {
        console.warn('Error in cleanup function for duel:', duelId, error);
      }
    });
    refs.cleanupFunctions = [];

    // Reset flags
    refs.eventListenersSetup = false;
    refs.connectionAttempt = null;
    refs.hasConnectedOnce = false;
    refs.retryCount = 0;

    // Disconnect socket
    try {
      socketService.leaveDuelRoom();
      socketService.disconnect();
    } catch (error) {
      console.warn('Error during socket cleanup for duel:', duelId, error);
    }

    console.log('✅ Final cleanup complete for duel:', duelId);
  }, [duelId]);

  // 🔧 CRITICAL: One-time setup - NEVER re-runs
  useEffect(() => {
    console.log('🔧 useDuelRoomManagement: ONE-TIME SETUP for duel:', duelId);
    const refs = stableRefs.current;

    refs.isMounted = true;
    refs.isCleaningUp = false;

    // Return cleanup that only runs on unmount
    return () => {
      console.log('🔧 useDuelRoomManagement: UNMOUNTING for duel:', duelId);
      cleanup();
    };
  }, [cleanup, duelId]); // Include duelId to ensure proper cleanup tracking

  // 🚀 PERFORMANCE FIX 14: Memoized Return Value
  const opponentInfo = useMemo(() => {
    return duelDetailsQuery.data?.duel
      ? {
          userId: duelDetailsQuery.data.duel.opponent_id,
          username: duelDetailsQuery.data.duel.opponent_username,
          isBot: botInfoQuery.data?.isBot || false,
          botInfo: botInfoQuery.data?.botInfo,
        }
      : null;
  }, [duelDetailsQuery.data?.duel, botInfoQuery.data]);

  // Return stable object
  const returnValue = useMemo(
    () => ({
      // Connection state
      isConnected: state.isConnected,
      connectionError: state.connectionError,

      // Room state
      roomState: state.session,
      roomError: state.roomError,

      // Duel details
      duelInfo: duelDetailsQuery.data?.duel,
      opponentInfo,
      botInfo: botInfoQuery.data,

      // Game state - ALL game data comes from hook
      gamePhase: state.phase,
      currentQuestion: state.currentQuestion,
      questionIndex: state.questionIndex,
      totalQuestions: state.totalQuestions,
      timeLeft: state.timeLeft,
      userScore: state.userScore,
      opponentScore: state.opponentScore,
      hasAnswered: state.hasAnswered,
      opponentAnswered: state.opponentAnswered,
      gameError: state.gameError,

      // 🔧 CRITICAL: These are now properly managed by hook
      roundResult: state.roundResult,
      finalResults: state.finalResults,

      // Actions
      initializeConnection,
      submitAnswer,
      signalReady,
      cleanup,

      // Loading states
      isLoading: duelDetailsQuery.isLoading || state.isConnecting,
      hasError: !!(
        state.connectionError ||
        state.roomError ||
        state.gameError ||
        duelDetailsQuery.error
      ),
    }),
    [
      state,
      duelDetailsQuery.data?.duel,
      duelDetailsQuery.isLoading,
      duelDetailsQuery.error,
      opponentInfo,
      botInfoQuery.data,
      initializeConnection,
      submitAnswer,
      signalReady,
      cleanup,
    ],
  );

  return returnValue;
}

// 🚀 COMBINED DUELS DATA HOOK (Main hook for duels screens)
export function useDuelsData() {
  const activeDuelsQuery = useActiveDuels();
  const duelStatsQuery = useDuelStats();
  const opponentsQueries = useDuelOpponents();
  const leaderboardQuery = useDuelLeaderboard();
  const quickMatch = useQuickMatch();

  // Extract opponents data
  const [recommendedQuery, friendsQuery, botsQuery] = opponentsQueries;

  return {
    quickMatch,
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
  const quickMatch = useQuickMatch();
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
    quickMatch,
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

    // Enhanced search that includes duel stats (slower but more complete)
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

    // Challenge with test (backward compatibility)
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

    // Accept challenge
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

    // Decline challenge
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

// 🚀 REAL-TIME SOCKET CONNECTION HOOK
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

// 🚀 REAL-TIME DUEL ROOM HOOK
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

// 🚀 ENHANCED DUEL DETAILS WITH BOT INFO
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

// 🚀 REAL-TIME TIMER MANAGEMENT HOOK
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

// 🚀 SOCKET-BASED BOT CHALLENGE HOOK
// export function useSocketBotChallenge() {
//   const [challengeState, setChallengeState] = useState<
//     'idle' | 'challenging' | 'success' | 'error'
//   >('idle');
//   const [challengeError, setChallengeError] = useState<string | null>(null);
//   const [createdDuel, setCreatedDuel] = useState<any>(null);

//   const challengeBotWithSocket = useCallback(
//     async (courseId: number, difficulty: number) => {
//       setChallengeState('challenging');
//       setChallengeError(null);
//       setCreatedDuel(null);

//       try {
//         const { challengeBotWithCourse } = await import('../api/socketService');
//         await challengeBotWithCourse(courseId, difficulty);

//         // DON'T set success here!
//         // Let the event listener handle success when server responds
//       } catch (error) {
//         setChallengeError(
//           error instanceof Error ? error.message : 'Challenge failed',
//         );
//         setChallengeState('error');
//       }
//     },
//     [],
//   );

//   const challengeBotWithHttp = useCallback(
//     async (courseId: number, difficulty: number) => {
//       setChallengeState('challenging');
//       setChallengeError(null);
//       setCreatedDuel(null);

//       try {
//         const response = await botService.challengeBotWithCourse(
//           courseId,
//           difficulty,
//         );

//         if (response.success && response.duel) {
//           setCreatedDuel(response.duel);
//           setChallengeState('success');
//         } else {
//           setChallengeError(response.message || 'Challenge failed');
//           setChallengeState('error');
//         }
//       } catch (error) {
//         console.error('HTTP bot challenge failed:', error);
//         setChallengeError(
//           error instanceof Error ? error.message : 'Challenge failed',
//         );
//         setChallengeState('error');
//       }
//     },
//     [],
//   );

//   const challengeBot = useCallback(
//     async (
//       courseId: number,
//       difficulty: number,
//       preferSocket: boolean = true,
//     ) => {
//       if (preferSocket) {
//         try {
//           const { isConnected } = await import('../api/socketService');
//           if (isConnected()) {
//             await challengeBotWithSocket(courseId, difficulty);
//             return;
//           }
//         } catch (error) {
//           console.warn('Socket challenge failed, falling back to HTTP:', error);
//         }
//       }

//       // Fallback to HTTP
//       await challengeBotWithHttp(courseId, difficulty);
//     },
//     [challengeBotWithSocket, challengeBotWithHttp],
//   );

//   // Setup socket event listeners for bot challenge responses
//   useEffect(() => {
//     const setupBotChallengeListeners = async () => {
//       try {
//         const { on, off } = await import('../api/socketService');

//         const handleBotChallengeCreated = (data: { duel: any }) => {
//           console.log('🤖 Bot challenge created via socket:', data);
//           setCreatedDuel(data.duel);
//           setChallengeState('success');
//         };

//         const handleBotChallengeError = (data: { message: string }) => {
//           console.log('❌ Bot challenge error via socket:', data);
//           setChallengeError(data.message);
//           setChallengeState('error');
//         };

//         const handleAutoJoinDuel = (data: { duelId: number }) => {
//           console.log('🎯 Auto-joining duel:', data.duelId);
//           // This could trigger navigation to the duel room
//         };

//         on('bot_challenge_created', handleBotChallengeCreated);
//         on('bot_challenge_error', handleBotChallengeError);
//         on('auto_join_duel', handleAutoJoinDuel);

//         return () => {
//           off('bot_challenge_created', handleBotChallengeCreated);
//           off('bot_challenge_error', handleBotChallengeError);
//           off('auto_join_duel', handleAutoJoinDuel);
//         };
//       } catch (error) {
//         console.error('Failed to setup bot challenge listeners:', error);
//       }
//     };

//     const cleanup = setupBotChallengeListeners();

//     return () => {
//       cleanup.then((cleanupFn) => cleanupFn && cleanupFn());
//     };
//   }, []);

//   const reset = useCallback(() => {
//     setChallengeState('idle');
//     setChallengeError(null);
//     setCreatedDuel(null);
//   }, []);

//   return {
//     challengeState,
//     challengeError,
//     createdDuel,
//     challengeBot,
//     challengeBotWithSocket,
//     challengeBotWithHttp,
//     reset,
//     isLoading: challengeState === 'challenging',
//     hasError: challengeState === 'error',
//     isSuccess: challengeState === 'success',
//   };
// }

export function useSocketBotChallenge() {
  const [challengeState, setChallengeState] = useState<
    'idle' | 'challenging' | 'success' | 'error'
  >('idle');
  const [challengeError, setChallengeError] = useState<string | null>(null);
  const [createdDuel, setCreatedDuel] = useState<any>(null);

  // Add socket connection state tracking
  const [socketConnected, setSocketConnected] = useState(false);

  const challengeBotWithSocket = useCallback(
    async (courseId: number, difficulty: number) => {
      setChallengeState('challenging');
      setChallengeError(null);
      setCreatedDuel(null);

      try {
        const { challengeBotWithCourse } = await import('../api/socketService');
        await challengeBotWithCourse(courseId, difficulty);
        // DON'T set success here!
        // Let the event listener handle success when server responds
      } catch (error) {
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

  // FIXED: Setup socket event listeners with connection state tracking
  useEffect(() => {
    const setupBotChallengeListeners = async () => {
      try {
        const { on, off, isConnected } = await import('../api/socketService');

        const connected = isConnected();
        setSocketConnected(connected);

        if (!connected) {
          console.log('🔌 Socket not connected, skipping listener setup');
          return;
        }

        console.log('🔧 Setting up bot challenge listeners');

        // CRITICAL: Clean up old listeners first
        off('bot_challenge_created');
        off('bot_challenge_error');
        off('auto_join_duel');

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
          console.log('🧹 Cleaning up bot challenge listeners');
          off('bot_challenge_created', handleBotChallengeCreated);
          off('bot_challenge_error', handleBotChallengeError);
          off('auto_join_duel', handleAutoJoinDuel);
        };
      } catch (error) {
        console.error('Failed to setup bot challenge listeners:', error);
        setSocketConnected(false);
      }
    };

    const cleanup = setupBotChallengeListeners();

    // Check connection state periodically
    const connectionCheck = setInterval(async () => {
      try {
        const { isConnected } = await import('../api/socketService');
        const connected = isConnected();
        if (connected !== socketConnected) {
          console.log(
            `🔌 Socket connection changed: ${socketConnected} -> ${connected}`,
          );
          setSocketConnected(connected);
        }
      } catch (error) {
        if (socketConnected) {
          console.log('🔌 Socket connection lost');
          setSocketConnected(false);
        }
      }
    }, 2000); // Check every 2 seconds

    return () => {
      cleanup.then((cleanupFn) => cleanupFn && cleanupFn());
      clearInterval(connectionCheck);
    };
  }, [socketConnected]); // Re-run when socket connection changes

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
    socketConnected, // Expose for debugging
  };
}

// 🚀 PERFORMANCE OPTIMIZED HELPER FUNCTIONS FOR DUEL PROCESSING
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

  // Helper to get opponent ID from duel based on current user
  getOpponentId: (duel: Duel, currentUserId: number): number => {
    return duel.initiator_id === currentUserId
      ? duel.opponent_id
      : duel.initiator_id;
  },

  // Helper to get opponent name from duel
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

  // Helper to get course name from duel
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

  // Helper to determine if user can act on duel
  canUserActOnDuel: (duel: Duel, currentUserId: number): boolean => {
    if (duel.status === 'completed') return false;
    if (duel.status === 'pending' && duel.opponent_id === currentUserId)
      return true;
    if (duel.status === 'active') return true;
    return false;
  },

  // Helper to get duel status badge variant
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
