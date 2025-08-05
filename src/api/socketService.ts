import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import { SOCKET_URL } from '../config/api.config';

// ✅ UPDATED: Socket event interfaces with new timer events
interface SocketEvents {
  // Connection events
  connect: () => void;
  disconnect: () => void;
  connect_error: (error: Error) => void;

  // Room events
  room_joined: (data: { session: DuelSession }) => void;
  room_error: (data: { message: string }) => void;
  opponent_joined: (data: { username: string; isBot?: boolean }) => void;
  opponent_disconnected: (data: { userId: number; username: string }) => void;
  both_players_connected: () => void;

  // Game flow events
  player_ready: (data: {
    userId: number;
    username: string;
    isBot?: boolean;
  }) => void;
  duel_starting: (data: { countdown: number }) => void;

  // ✅ UPDATED: question_presented now includes server timing
  question_presented: (data: {
    questionIndex: number;
    totalQuestions: number;
    question: {
      id: number;
      text: string;
      options: Record<string, string>;
    };
    timeLimit: number; // Will be 60000 (60 seconds)
    serverStartTime: number; // NEW: Server timestamp when question started
    serverEndTime: number; // NEW: Server timestamp when question ends
  }) => void;

  opponent_answered: (data: {
    userId: number;
    username: string;
    isBot?: boolean;
  }) => void;
  round_result: (data: RoundResult) => void;
  duel_completed: (data: FinalResult) => void;

  // ✅ NEW: Server-controlled timer events
  timer_update: (data: {
    timeRemaining: number; // Seconds remaining
    serverTime: number; // Current server timestamp
    questionIndex: number; // Which question this update is for
  }) => void;

  question_time_up: (data: {
    questionIndex: number; // Which question timed out
    serverTime: number; // Server timestamp when time expired
  }) => void;

  // Bot events
  bot_challenge_created: (data: { duel: any }) => void;
  bot_challenge_error: (data: { message: string }) => void;
  auto_join_duel: (data: { duelId: number }) => void;
}

// Data interfaces matching backend
interface DuelSession {
  sessionId: string;
  duelId: number;
  status: 'waiting' | 'starting' | 'active' | 'completed';
  connectedUsers: Array<{
    username: string;
    ready: boolean;
  }>;
}

interface RoundResult {
  questionIndex: number;
  question: {
    text: string;
    options: Record<string, string>;
    correctAnswer: string;
  };
  answers: Array<{
    userId: number;
    selectedAnswer: string;
    isCorrect: boolean;
    timeTaken: number;
  }>;
}

interface FinalResult {
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

// Socket connection configuration
interface SocketConfig {
  socketUrl: string;
  transports: ('websocket' | 'polling')[];
  timeout: number;
  forceNew: boolean;
}

// Connection state
interface ConnectionState {
  connected: boolean;
  connecting: boolean;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  socketId: string | null;
  error: string | null;
}

// Internal socket instance and state
let socketInstance: Socket | null = null;
let eventListeners = new Map<string, ((...args: any[]) => void)[]>();
let connectionState: ConnectionState = {
  connected: false,
  connecting: false,
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,
  socketId: null,
  error: null,
};

// Connection promises to handle concurrent connection attempts
let connectionPromise: Promise<void> | null = null;

// FIXED: Use dedicated SOCKET_URL instead of parsing API_URL
const getSocketConfig = (): SocketConfig => ({
  socketUrl: SOCKET_URL || 'http://localhost:3001',
  transports: ['websocket', 'polling'],
  timeout: 10000,
  forceNew: false,
});

// Enhanced JWT token debugging function
const debugToken = (token: string): void => {
  if (!__DEV__) return;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('🔧 Token Debug: Invalid JWT format (not 3 parts)');
      return;
    }

    // Decode header
    const header = JSON.parse(
      atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')),
    );

    // Decode payload
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')),
    );

    console.log('🔧 Token Debug - Header:', header);
    console.log('🔧 Token Debug - Payload:', {
      userId: payload.userId,
      username: payload.username,
      email: payload.email,
      exp: payload.exp
        ? new Date(payload.exp * 1000).toISOString()
        : 'No expiration',
      iat: payload.iat
        ? new Date(payload.iat * 1000).toISOString()
        : 'No issued time',
      iss: payload.iss,
      aud: payload.aud,
    });

    // Check if token is expired
    if (payload.exp) {
      const isExpired = Date.now() >= payload.exp * 1000;
      console.log('🔧 Token Debug - Expired:', isExpired);
      if (isExpired) {
        console.log(
          '🔧 Token Debug - Token expired at:',
          new Date(payload.exp * 1000).toISOString(),
        );
      }
    }

    // Check token age
    if (payload.iat) {
      const tokenAge = (Date.now() - payload.iat * 1000) / 1000 / 60; // minutes
      console.log(
        '🔧 Token Debug - Token age:',
        tokenAge.toFixed(2),
        'minutes',
      );
    }
  } catch (error) {
    console.log('🔧 Token Debug: Failed to decode token:', error);
    console.log(
      '🔧 Token Debug: Token preview:',
      token.substring(0, 50) + '...',
    );
  }
};

// Enhanced authentication checking with detailed debugging
const checkAuthentication = async (): Promise<{
  token: string;
  userData: any;
} | null> => {
  try {
    console.log('🔧 Auth Check: Starting authentication check...');

    // Try both token keys for compatibility
    const [authToken, userToken, userDataStr] = await Promise.all([
      AsyncStorage.getItem('authToken'),
      AsyncStorage.getItem('userToken'),
      AsyncStorage.getItem('userData'),
    ]);

    console.log('🔧 Auth Check: Storage check results:', {
      hasAuthToken: !!authToken,
      hasUserToken: !!userToken,
      hasUserData: !!userDataStr,
      authTokenPreview: authToken ? authToken.substring(0, 50) + '...' : 'null',
      userTokenPreview: userToken ? userToken.substring(0, 50) + '...' : 'null',
    });

    // Prefer authToken, fallback to userToken
    const token = authToken || userToken;

    if (!token) {
      console.log(
        '🔧 Auth Check: No auth token found (checked both authToken and userToken)',
      );
      return null;
    }

    if (!userDataStr) {
      console.log('🔧 Auth Check: No user data found');
      return null;
    }

    const userData = JSON.parse(userDataStr);
    console.log('🔧 Auth Check: User data loaded:', {
      userId: userData.userId,
      username: userData.username,
      email: userData.email,
    });

    // Debug the token we're about to use
    debugToken(token);

    // Ensure both tokens are synced
    if (token && !authToken) {
      await AsyncStorage.setItem('authToken', token);
      console.log('🔧 Auth Check: Synced authToken from userToken');
    }
    if (token && !userToken) {
      await AsyncStorage.setItem('userToken', token);
      console.log('🔧 Auth Check: Synced userToken from authToken');
    }

    console.log('🔧 Auth Check: Authentication successful');
    return { token, userData };
  } catch (error) {
    console.error('🔧 Auth Check: Error checking authentication:', error);
    return null;
  }
};

// Enhanced connection management with authentication check
export const connect = async (token?: string): Promise<void> => {
  // If already connected, return immediately
  if (socketInstance && socketInstance.connected) {
    console.log('Socket already connected');
    return Promise.resolve();
  }

  // If already connecting, return the existing promise
  if (connectionState.connecting && connectionPromise) {
    console.log('Connection already in progress, waiting...');
    return connectionPromise;
  }

  // Create new connection promise
  connectionPromise = createConnection(token);

  try {
    await connectionPromise;
  } finally {
    connectionPromise = null;
  }
};

// Enhanced connection creation with better auth handling and debugging
const createConnection = async (token?: string): Promise<void> => {
  if (connectionState.connecting) {
    return;
  }

  connectionState.connecting = true;
  connectionState.error = null;

  try {
    console.log('🔧 Socket Connect: Starting connection process...');

    // Get authentication token - either provided or from storage
    let authToken = token;
    let userData = null;

    if (!authToken) {
      console.log('🔧 Socket Connect: No token provided, checking storage...');
      const authData = await checkAuthentication();
      if (!authData) {
        throw new Error('No authentication token available');
      }
      authToken = authData.token;
      userData = authData.userData;
    } else {
      console.log('🔧 Socket Connect: Using provided token');
      debugToken(authToken);
    }

    const config = getSocketConfig();

    console.log('🔧 Socket Connect: Creating connection with config:', {
      socketUrl: config.socketUrl,
      username: userData?.username || 'unknown',
      tokenPreview: authToken.substring(0, 50) + '...',
    });

    // Disconnect existing socket if any
    if (socketInstance) {
      console.log('🔧 Socket Connect: Disconnecting existing socket');
      socketInstance.disconnect();
    }

    // Create the socket connection with enhanced debugging
    console.log('🔧 Socket Connect: Creating socket instance...');
    socketInstance = io(config.socketUrl, {
      auth: {
        token: authToken,
        // Add additional auth info for debugging
        userId: userData?.userId,
        username: userData?.username,
      },
      transports: config.transports,
      timeout: config.timeout,
      forceNew: config.forceNew,
    });

    setupEventListeners();

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        connectionState.connecting = false;
        console.log('🔧 Socket Connect: Connection timeout');
        reject(new Error('Connection timeout'));
      }, config.timeout);

      socketInstance!.on('connect', () => {
        clearTimeout(timeoutId);
        connectionState.connecting = false;
        connectionState.connected = true;
        connectionState.reconnectAttempts = 0;
        connectionState.socketId = socketInstance!.id || null;
        console.log(
          '🔧 Socket Connect: Connected successfully:',
          socketInstance!.id,
        );
        resolve();
      });

      socketInstance!.on('connect_error', (error) => {
        clearTimeout(timeoutId);
        connectionState.connecting = false;
        connectionState.error = error.message;
        console.error('🔧 Socket Connect: Connection error:', error);
        console.error('🔧 Socket Connect: Error details:', {
          message: error.message,
        });
        reject(error);
      });
    });
  } catch (error) {
    connectionState.connecting = false;
    connectionState.error =
      error instanceof Error
        ? error.message || 'Unknown error'
        : 'Unknown error';
    console.error(
      '🔧 Socket Connect: Failed to initialize socket connection:',
      error,
    );
    throw error;
  }
};

// Enhanced disconnect function
export const disconnect = (): void => {
  console.log('🔧 Socket Disconnect: Disconnecting socket...');
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }

  eventListeners.clear();
  connectionState = {
    connected: false,
    connecting: false,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    socketId: null,
    error: null,
  };

  // Clear connection promise
  connectionPromise = null;
  console.log('🔧 Socket Disconnect: Disconnection complete');
};

export const isConnected = (): boolean => {
  return socketInstance?.connected || false;
};

export const getConnectionState = (): ConnectionState => {
  return { ...connectionState };
};

// Enhanced event listener management
const setupEventListeners = (): void => {
  if (!socketInstance) return;

  console.log('🔧 Socket Events: Setting up event listeners...');

  socketInstance.on('connect', () => {
    console.log('🔧 Socket Events: Connected to socket server');
    connectionState.connected = true;
    connectionState.reconnectAttempts = 0;
    connectionState.socketId = socketInstance!.id || null;
    emitToListeners('connect');
  });

  socketInstance.on('disconnect', (reason) => {
    console.log('🔧 Socket Events: Disconnected from socket server:', reason);
    connectionState.connected = false;
    connectionState.socketId = null;
    emitToListeners('disconnect');

    // Auto-reconnect for certain disconnect reasons
    if (reason !== 'io server disconnect') {
      handleReconnection();
    }
  });

  socketInstance.on('connect_error', (error) => {
    console.error('🔧 Socket Events: Connection error:', error);
    connectionState.error = error?.message || 'Connection error';
    handleReconnection();
  });

  // Re-register all existing event listeners
  eventListeners.forEach((listeners, event) => {
    listeners.forEach((callback) => {
      socketInstance!.on(event, callback);
    });
  });
};

const handleReconnection = async (): Promise<void> => {
  if (
    connectionState.reconnectAttempts >= connectionState.maxReconnectAttempts
  ) {
    console.log('🔧 Socket Reconnect: Max reconnection attempts reached');
    return;
  }

  connectionState.reconnectAttempts++;
  const delay = 1000 * Math.pow(2, connectionState.reconnectAttempts - 1);

  console.log(
    `🔧 Socket Reconnect: Attempting to reconnect in ${delay}ms (attempt ${connectionState.reconnectAttempts})`,
  );

  setTimeout(async () => {
    try {
      await connect();
    } catch (error) {
      console.error('🔧 Socket Reconnect: Reconnection failed:', error);
    }
  }, delay);
};

export const on = (event: string, callback: (...args: any[]) => void): void => {
  if (!eventListeners.has(event)) {
    eventListeners.set(event, []);
  }
  eventListeners.get(event)!.push(callback);

  if (socketInstance) {
    socketInstance.on(event, callback);
  }
};

export const off = (
  event: string,
  callback?: (...args: any[]) => void,
): void => {
  if (callback) {
    const listeners = eventListeners.get(event) || [];
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }

    if (socketInstance) {
      socketInstance.off(event, callback);
    }
  } else {
    eventListeners.delete(event);
    if (socketInstance) {
      socketInstance.off(event);
    }
  }
};

// ✅ UPDATED: Type-safe event listener helpers with new timer events
export const onConnect = (callback: () => void): void =>
  on('connect', callback);
export const onDisconnect = (callback: () => void): void =>
  on('disconnect', callback);
export const onRoomJoined = (
  callback: (data: { session: DuelSession }) => void,
): void => on('room_joined', callback);
export const onRoomError = (
  callback: (data: { message: string }) => void,
): void => on('room_error', callback);
export const onOpponentJoined = (
  callback: (data: { username: string; isBot?: boolean }) => void,
): void => on('opponent_joined', callback);
export const onOpponentDisconnected = (
  callback: (data: { userId: number; username: string }) => void,
): void => on('opponent_disconnected', callback);
export const onBothPlayersConnected = (callback: () => void): void =>
  on('both_players_connected', callback);
export const onPlayerReady = (
  callback: (data: {
    userId: number;
    username: string;
    isBot?: boolean;
  }) => void,
): void => on('player_ready', callback);
export const onDuelStarting = (
  callback: (data: { countdown: number }) => void,
): void => on('duel_starting', callback);

// ✅ UPDATED: onQuestionPresented now includes server timing
export const onQuestionPresented = (
  callback: (data: {
    questionIndex: number;
    totalQuestions: number;
    question: { id: number; text: string; options: Record<string, string> };
    timeLimit: number; // Will be 60000
    serverStartTime: number; // NEW
    serverEndTime: number; // NEW
  }) => void,
): void => on('question_presented', callback);

export const onOpponentAnswered = (
  callback: (data: {
    userId: number;
    username: string;
    isBot?: boolean;
  }) => void,
): void => on('opponent_answered', callback);
export const onRoundResult = (callback: (data: RoundResult) => void): void =>
  on('round_result', callback);
export const onDuelCompleted = (callback: (data: FinalResult) => void): void =>
  on('duel_completed', callback);

// ✅ NEW: Timer event listeners
export const onTimerUpdate = (
  callback: (data: {
    timeRemaining: number;
    serverTime: number;
    questionIndex: number;
  }) => void,
): void => on('timer_update', callback);

export const onQuestionTimeUp = (
  callback: (data: { questionIndex: number; serverTime: number }) => void,
): void => on('question_time_up', callback);

export const onBotChallengeCreated = (
  callback: (data: { duel: any }) => void,
): void => on('bot_challenge_created', callback);
export const onBotChallengeError = (
  callback: (data: { message: string }) => void,
): void => on('bot_challenge_error', callback);
export const onAutoJoinDuel = (
  callback: (data: { duelId: number }) => void,
): void => on('auto_join_duel', callback);

const emitToListeners = (event: string, ...args: any[]): void => {
  const listeners = eventListeners.get(event) || [];
  listeners.forEach((callback) => {
    try {
      callback(...args);
    } catch (error) {
      console.error(`Error in event listener for ${event}:`, error);
    }
  });
};

// Enhanced duel-specific actions with connection checking
export const joinDuelRoom = (duelId: number): void => {
  if (!socketInstance || !socketInstance.connected) {
    throw new Error('Socket not connected');
  }
  console.log('🔧 Socket Action: Joining duel room:', duelId);
  socketInstance.emit('join_duel_room', { duelId });
};

export const leaveDuelRoom = (): void => {
  if (socketInstance && socketInstance.connected) {
    console.log('🔧 Socket Action: Leaving duel room');
    socketInstance.emit('leave_duel_room');
  }
};

export const signalReady = (): void => {
  if (!socketInstance || !socketInstance.connected) {
    throw new Error('Socket not connected');
  }
  console.log('🔧 Socket Action: Signaling ready for duel');
  socketInstance.emit('ready_for_duel');
};

export const submitAnswer = (
  questionId: number,
  selectedAnswer: string | null,
  timeTaken: number,
): void => {
  if (!socketInstance || !socketInstance.connected) {
    throw new Error('Socket not connected');
  }
  console.log('🔧 Socket Action: Submitting answer:', {
    questionId,
    selectedAnswer,
    timeTaken,
  });
  socketInstance.emit('submit_answer', {
    questionId,
    selectedAnswer,
    timeTaken,
  });
};

// Enhanced challengeBot with connection check and auto-connect
export const challengeBot = async (
  testIdOrCourseId: number,
  difficulty: number = 1,
  isTestId: boolean = true, // true for testId, false for courseId
): Promise<void> => {
  console.log('🔧 Socket Bot: Starting bot challenge...', {
    testIdOrCourseId,
    difficulty,
    isTestId,
  });

  // First ensure we have authentication
  const authData = await checkAuthentication();
  if (!authData) {
    throw new Error('Not authenticated - please log in first');
  }

  // Try to ensure connection first
  if (!socketInstance || !socketInstance.connected) {
    console.log(
      '🔧 Socket Bot: Socket not connected, attempting to connect...',
    );
    try {
      await connect(authData.token);
    } catch (error) {
      console.error(
        '🔧 Socket Bot: Failed to connect socket for bot challenge:',
        error,
      );
      throw new Error('Socket connection failed - will use HTTP fallback');
    }
  }

  // Double-check connection after attempt
  if (!socketInstance || !socketInstance.connected) {
    throw new Error('Socket not connected - will use HTTP fallback');
  }

  const eventData = {
    difficulty,
    ...(isTestId
      ? { testId: testIdOrCourseId }
      : { courseId: testIdOrCourseId }),
  };

  console.log('🔧 Socket Bot: Challenging bot via socket:', {
    eventData,
    user: authData.userData.username,
  });

  socketInstance.emit('challenge_bot', eventData);
};

// NEW: Dedicated course-based bot challenge function
export const challengeBotWithCourse = async (
  courseId: number,
  difficulty: number = 1,
): Promise<void> => {
  console.log('🔧 Socket Bot: Starting course-based bot challenge...', {
    courseId,
    difficulty,
  });

  // First ensure we have authentication
  const authData = await checkAuthentication();
  if (!authData) {
    throw new Error('Not authenticated - please log in first');
  }

  // Try to ensure connection first
  if (!socketInstance || !socketInstance.connected) {
    console.log(
      '🔧 Socket Bot: Socket not connected, attempting to connect...',
    );
    try {
      await connect(authData.token);
    } catch (error) {
      console.error(
        '🔧 Socket Bot: Failed to connect socket for bot challenge:',
        error,
      );
      throw new Error('Socket connection failed - will use HTTP fallback');
    }
  }

  // Double-check connection after attempt
  if (!socketInstance || !socketInstance.connected) {
    throw new Error('Socket not connected - will use HTTP fallback');
  }

  console.log('🔧 Socket Bot: Challenging bot via socket with course:', {
    courseId,
    difficulty,
    user: authData.userData.username,
  });

  socketInstance.emit('challenge_bot_course', {
    courseId,
    difficulty,
  });
};

// Keep the original challengeBot function for backward compatibility
export const challengeBotLegacy = async (
  testId: number,
  difficulty: number = 1,
): Promise<void> => {
  return challengeBot(testId, difficulty, true);
};

export const sendHeartbeat = (): void => {
  if (socketInstance && socketInstance.connected) {
    socketInstance.emit('heartbeat');
  }
};

// Enhanced auto-initialization helper
export const initializeSocket = async (): Promise<void> => {
  try {
    console.log('🔧 Socket Init: Initializing socket...');

    // Check authentication first
    const authData = await checkAuthentication();
    if (!authData) {
      console.log(
        '🔧 Socket Init: No authentication found for socket initialization',
      );
      throw new Error('No authentication token available');
    }

    console.log(
      '🔧 Socket Init: Authentication found, connecting for user:',
      authData.userData.username,
    );
    await connect(authData.token);
    console.log('🔧 Socket Init: Socket auto-initialized successfully');
  } catch (error) {
    console.error('🔧 Socket Init: Error auto-initializing socket:', error);
    throw error;
  }
};

// React hooks for components
export const useSocket = () => {
  const [connected, setConnected] = useState(isConnected());
  const [connectionInfo, setConnectionInfo] = useState(getConnectionState());

  useEffect(() => {
    const handleConnect = () => {
      setConnected(true);
      setConnectionInfo(getConnectionState());
    };

    const handleDisconnect = () => {
      setConnected(false);
      setConnectionInfo(getConnectionState());
    };

    onConnect(handleConnect);
    onDisconnect(handleDisconnect);

    // Auto-initialize if not connected
    if (!connected) {
      initializeSocket().catch(console.error);
    }

    return () => {
      off('connect', handleConnect);
      off('disconnect', handleDisconnect);
    };
  }, []);

  return {
    connected,
    connectionInfo,
    connect,
    disconnect,
    isConnected,
    on,
    off,
    initializeSocket,
  };
};

export const useDuelSocket = (duelId: number | null) => {
  const { connected } = useSocket();
  const [duelState, setDuelState] = useState<DuelSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  const joinRoom = useRef<(() => void) | undefined>(undefined);
  const leaveRoom = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    if (!connected || !duelId) return;

    joinRoom.current = () => {
      try {
        joinDuelRoom(duelId);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to join duel room',
        );
      }
    };

    leaveRoom.current = () => {
      leaveDuelRoom();
    };

    const handleRoomJoined = (data: { session: DuelSession }) => {
      setDuelState(data.session);
      setError(null);
    };

    const handleRoomError = (data: { message: string }) => {
      setError(data.message);
    };

    onRoomJoined(handleRoomJoined);
    onRoomError(handleRoomError);

    return () => {
      off('room_joined', handleRoomJoined);
      off('room_error', handleRoomError);
      leaveRoom.current?.();
    };
  }, [connected, duelId]);

  return {
    connected,
    duelState,
    error,
    joinRoom: joinRoom.current,
    leaveRoom: leaveRoom.current,
    signalReady,
    submitAnswer,
    challengeBot,
  };
};

// Export types for use in components
export type {
  SocketEvents,
  DuelSession,
  RoundResult,
  FinalResult,
  ConnectionState,
};
