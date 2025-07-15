import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import API_URL from '../config/api.config';

// Socket event interfaces based on backend
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
  question_presented: (data: {
    questionIndex: number;
    totalQuestions: number;
    question: {
      id: number;
      text: string;
      options: Record<string, string>;
    };
    timeLimit: number;
  }) => void;
  opponent_answered: (data: {
    userId: number;
    username: string;
    isBot?: boolean;
  }) => void;
  round_result: (data: RoundResult) => void;
  duel_completed: (data: FinalResult) => void;

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
  apiUrl: string;
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
let eventListeners = new Map<string, Function[]>();
let connectionState: ConnectionState = {
  connected: false,
  connecting: false,
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,
  socketId: null,
  error: null,
};

// Configuration
const getSocketConfig = (): SocketConfig => ({
  apiUrl: API_URL || 'http://localhost:3001',
  transports: ['websocket', 'polling'],
  timeout: 10000,
  forceNew: true,
});

// Connection management
export const connect = async (token?: string): Promise<void> => {
  if (
    connectionState.connecting ||
    (socketInstance && socketInstance.connected)
  ) {
    return;
  }

  connectionState.connecting = true;
  connectionState.error = null;

  try {
    const authToken = token || (await AsyncStorage.getItem('authToken'));
    if (!authToken) {
      throw new Error('No authentication token available');
    }

    const config = getSocketConfig();
    console.log('Connecting to socket server:', config.apiUrl);

    socketInstance = io(config.apiUrl, {
      auth: { token: authToken },
      transports: config.transports,
      timeout: config.timeout,
      forceNew: config.forceNew,
    });

    setupEventListeners();

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, config.timeout);

      socketInstance!.on('connect', () => {
        clearTimeout(timeoutId);
        connectionState.connecting = false;
        connectionState.connected = true;
        connectionState.reconnectAttempts = 0;
        connectionState.socketId = socketInstance!.id || null;
        console.log('Socket connected successfully');
        resolve();
      });

      socketInstance!.on('connect_error', (error) => {
        clearTimeout(timeoutId);
        connectionState.connecting = false;
        connectionState.error = error.message;
        console.error('Socket connection error:', error);
        reject(error);
      });
    });
  } catch (error) {
    connectionState.connecting = false;
    connectionState.error =
      error instanceof Error
        ? error.message || 'Unknown error'
        : 'Unknown error';
    console.error('Failed to initialize socket connection:', error);
    throw error;
  }
};

export const disconnect = (): void => {
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
};

export const isConnected = (): boolean => {
  return socketInstance?.connected || false;
};

export const getConnectionState = (): ConnectionState => {
  return { ...connectionState };
};

// Event listener management
const setupEventListeners = (): void => {
  if (!socketInstance) return;

  socketInstance.on('connect', () => {
    console.log('Connected to socket server');
    connectionState.connected = true;
    connectionState.reconnectAttempts = 0;
    connectionState.socketId = socketInstance!.id || null;
    emitToListeners('connect');
  });

  socketInstance.on('disconnect', (reason) => {
    console.log('Disconnected from socket server:', reason);
    connectionState.connected = false;
    connectionState.socketId = null;
    emitToListeners('disconnect');

    // Auto-reconnect for certain disconnect reasons
    if (reason !== 'io server disconnect') {
      handleReconnection();
    }
  });

  socketInstance.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
    connectionState.error = error?.message || 'Connection error';
    handleReconnection();
  });
};

const handleReconnection = async (): Promise<void> => {
  if (
    connectionState.reconnectAttempts >= connectionState.maxReconnectAttempts
  ) {
    console.log('Max reconnection attempts reached');
    return;
  }

  connectionState.reconnectAttempts++;
  const delay = 1000 * Math.pow(2, connectionState.reconnectAttempts - 1); // Exponential backoff

  console.log(
    `Attempting to reconnect in ${delay}ms (attempt ${connectionState.reconnectAttempts})`,
  );

  setTimeout(async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Reconnection failed:', error);
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

// Type-safe event listener helpers
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
export const onQuestionPresented = (
  callback: (data: {
    questionIndex: number;
    totalQuestions: number;
    question: { id: number; text: string; options: Record<string, string> };
    timeLimit: number;
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

// Duel-specific actions
export const joinDuelRoom = (duelId: number): void => {
  if (!socketInstance || !socketInstance.connected) {
    throw new Error('Socket not connected');
  }
  console.log('Joining duel room:', duelId);
  socketInstance.emit('join_duel_room', { duelId });
};

export const leaveDuelRoom = (): void => {
  if (socketInstance && socketInstance.connected) {
    socketInstance.emit('leave_duel_room');
  }
};

export const signalReady = (): void => {
  if (!socketInstance || !socketInstance.connected) {
    throw new Error('Socket not connected');
  }
  console.log('Signaling ready for duel');
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
  console.log('Submitting answer:', { questionId, selectedAnswer, timeTaken });
  socketInstance.emit('submit_answer', {
    questionId,
    selectedAnswer,
    timeTaken,
  });
};

export const challengeBot = (testId: number, difficulty: number = 1): void => {
  if (!socketInstance || !socketInstance.connected) {
    throw new Error('Socket not connected');
  }
  console.log('Challenging bot:', { testId, difficulty });
  socketInstance.emit('challenge_bot', { testId, difficulty });
};

export const sendHeartbeat = (): void => {
  if (socketInstance && socketInstance.connected) {
    socketInstance.emit('heartbeat');
  }
};

// Auto-initialization helper
export const initializeSocket = async (): Promise<void> => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      await connect(token);
    }
  } catch (error) {
    console.error('Error auto-initializing socket:', error);
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
