// app/(tabs)/duels/[id].tsx - Enhanced with server timing and analytics integration

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  BackHandler,
  useColorScheme,
  Animated,
  Dimensions,
  ViewStyle,
  TextStyle,
  ScrollView,
  Platform,
  StyleProp,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ENHANCED: Import socket functions with server timing support
import {
  connect,
  disconnect,
  isConnected,
  on,
  off,
  joinDuelRoom,
  signalReady,
  submitAnswer,
  getConnectionState,
  onTimerUpdate, // ✅ NEW
  onQuestionTimeUp, // ✅ NEW
  onQuestionPresented, // ✅ UPDATED
} from '../../../src/api/socketService';

import QuestionReportModal from '../../../components/ui/QuestionReportModal';

import {
  Container,
  PlayfulCard,
  PlayfulTitle,
  Paragraph,
  Row,
  Column,
  Avatar,
  Badge,
  Button,
  EmptyState,
  Modal,
  Alert as UIAlert,
  AnimatedCounter,
  ScoreDisplay,
  ProgressBar,
  SlideInElement,
  FloatingElement,
  GlassCard,
  LinearGradient,
} from '../../../components/ui';
import { Colors, Spacing, BorderRadius } from '../../../constants/theme';
import {
  courseService,
  duelService,
  testService,
  botService,
  duelResultService,
  analyticsService,
  userQuestionHistoryService,
} from '../../../src/api';
import { Bot } from '../../../src/api/botService';
import { CreateDuelResultInput } from '../../../src/api/duelResultService';

// 1. ADD DEVELOPMENT MODE TOGGLE (add this right after your imports)
const __DEV_MODE__ = __DEV__ && false; // ✅ FIXED: Set to false for production, true for dev styling

// 2. ADD MOCK DATA (add this before your component definition)
const MOCK_DATA = {
  duelInfo: {
    id: 1,
    course_name: 'React Native Temelleri',
    test_name: 'Bileşenler ve State Yönetimi',
    opponent_username: 'TestBot',
    opponent_id: 2,
    initiator_id: 1,
    test_id: 1,
    course_id: 1,
  },
  opponentInfo: {
    userId: 2,
    username: 'TestBot',
    isBot: true,
    botInfo: {
      // Add the missing required Bot interface properties
      botId: 1, // Add this
      userId: 2, // Add this
      username: 'TestBot', // Add this
      // Keep your existing properties
      botName: 'TestBot',
      avatar: '🤖',
      difficultyLevel: 3,
      accuracyRate: 0.85,
      avgResponseTime: 3000,
    },
  },
  userData: {
    userId: 1,
    username: 'Test User',
  },
  currentQuestion: {
    id: 1,
    text: "React Native'de state yönetimi için hangi hook kullanılır?",
    options: {
      A: 'useState',
      B: 'useEffect',
      C: 'useContext',
      D: 'useReducer',
    },
  },
  finalResults: {
    winnerId: 1,
    user1: {
      userId: 1,
      score: 2,
      totalTime: 45000,
      accuracy: 0.67,
    },
    user2: {
      userId: 2,
      score: 1,
      totalTime: 30000,
      accuracy: 0.33,
    },
  },
  roundResult: {
    questionIndex: 0,
    question: {
      text: "React Native'de state yönetimi için hangi hook kullanılır?",
      options: {
        A: 'useState',
        B: 'useEffect',
        C: 'useContext',
        D: 'useReducer',
      },
      correctAnswer: 'A',
    },
    answers: [
      {
        userId: 1,
        selectedAnswer: 'A',
        isCorrect: true,
        timeTaken: 5000,
      },
      {
        userId: 2,
        selectedAnswer: 'B',
        isCorrect: false,
        timeTaken: 3000,
      },
    ],
  },
};

const { width, height } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';

interface DuelSession {
  sessionId: number;
  duelId: number;
  status: 'waiting' | 'starting' | 'active' | 'completed';
  connectedUsers: Array<{
    username: string;
    ready: boolean;
  }>;
}

interface Question {
  id: number;
  text: string;
  options: Record<string, string>;
  correctAnswer?: string;
  explanation?: string;
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

interface FinalResults {
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

interface DuelInfo {
  id: number;
  course_name?: string;
  test_name?: string;
  test_title?: string;
  course_title?: string;
  opponent_username?: string;
  opponent_id?: number;
  initiator_id?: number;
  test_id?: number;
  course_id?: number;
}

interface OpponentInfo {
  userId: number;
  username: string;
  isBot: boolean;
  botInfo?: Bot;
}

interface AnsweredQuestion {
  questionId: number;
  selectedAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  timeTaken: number;
  questionText: string;
  options: Record<string, string>;
}

type DuelPhase =
  | 'connecting'
  | 'lobby'
  | 'countdown'
  | 'question'
  | 'results'
  | 'final'
  | 'error';

// 3. ADD STATE SELECTOR FUNCTION (add this before your component)
const getDevModeState = (): DuelPhase => {
  // Change this to test different phases:
  // 'connecting' | 'lobby' | 'countdown' | 'question' | 'results' | 'final' | 'error'
  return 'connecting'; // ← CHANGE THIS TO STYLE DIFFERENT SCREENS
};

export default function DuelRoomScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const duelId = parseInt(id as string);

  // State management
  const [phase, setPhase] = useState<DuelPhase>('connecting');
  const [session, setSession] = useState<DuelSession | null>(null);
  const [duelInfo, setDuelInfo] = useState<DuelInfo | null>(null);
  const [opponentInfo, setOpponentInfo] = useState<OpponentInfo | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(3);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(60); // ✅ CHANGED: Default to 60 seconds
  const [countdown, setCountdown] = useState(3);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [finalResults, setFinalResults] = useState<FinalResults | null>(null);
  const [userScore, setUserScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [opponentAnswered, setOpponentAnswered] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isLoadingDuelInfo, setIsLoadingDuelInfo] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);

  // ✅ NEW: Add server timing state
  const [serverStartTime, setServerStartTime] = useState<number | null>(null);
  const [serverEndTime, setServerEndTime] = useState<number | null>(null);
  const [isTimerSynced, setIsTimerSynced] = useState(false);

  // New state for analytics and results tracking
  const [answeredQuestions, setAnsweredQuestions] = useState<
    AnsweredQuestion[]
  >([]);
  const [duelStartTime, setDuelStartTime] = useState<number | null>(null);
  const [duelEndTime, setDuelEndTime] = useState<number | null>(null);
  const [isCreatingDuelResult, setIsCreatingDuelResult] = useState(false);
  const [duelResultCreated, setDuelResultCreated] = useState(false);

  // ✅ FIXED: Add iOS-specific state management
  const [isModalStable, setIsModalStable] = useState(false);
  const [apiCallInProgress, setApiCallInProgress] = useState(false);

  // Refs
  const timerRef = useRef<number | null>(null);
  const answerStartTime = useRef<number>(0);
  const lastApiCallTime = useRef<number>(0);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const logoVideo = require('../../../assets/videos/okey.mp4');

  // ✅ FIXED: Add throttled API call helper
  const throttledApiCall = useCallback(
    async (apiCall: () => Promise<any>, minInterval: number = 1000) => {
      const now = Date.now();
      if (now - lastApiCallTime.current < minInterval) {
        console.log('⏱️ API call throttled, waiting...');
        return;
      }

      if (apiCallInProgress) {
        console.log('🔄 API call already in progress, skipping...');
        return;
      }

      try {
        setApiCallInProgress(true);
        lastApiCallTime.current = now;

        // Add extra delay for iOS
        if (isIOS) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }

        return await apiCall();
      } finally {
        setApiCallInProgress(false);
      }
    },
    [apiCallInProgress],
  );

  // Add this function before your other functions
  const resetDuelState = useCallback(() => {
    if (__DEV_MODE__) {
      console.log('🟡 DEV MODE: Minimal reset in dev mode');
      // In dev mode, only reset essential states but keep mock data
      setPhase('connecting');
      setError(null);
      return;
    }

    setPhase('connecting');
    setSession(null);
    setCurrentQuestion(null);
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setTimeLeft(60); // ✅ CHANGED: Reset to 60 seconds
    setCountdown(3);
    setRoundResult(null);
    setFinalResults(null);
    setUserScore(0);
    setOpponentScore(0);
    setOpponentAnswered(false);
    setHasAnswered(false);
    setAnsweredQuestions([]);
    setDuelStartTime(null);
    setDuelEndTime(null);
    setIsCreatingDuelResult(false);
    setDuelResultCreated(false);
    setError(null);
    // ✅ NEW: Reset server timing state
    setServerStartTime(null);
    setServerEndTime(null);
    setIsTimerSynced(false);
  }, []);

  // ✅ FIXED: Properly handle dev mode initialization
  useEffect(() => {
    if (__DEV_MODE__) {
      console.log('🟢 DEV MODE ACTIVE: Setting up mock data immediately');

      // Set all mock data immediately
      setDuelInfo(MOCK_DATA.duelInfo);
      setOpponentInfo(MOCK_DATA.opponentInfo);
      setUserData(MOCK_DATA.userData);
      setIsLoadingDuelInfo(false); // ✅ CRITICAL: Set loading to false immediately

      const devPhase = getDevModeState();
      console.log('🎯 Setting phase to:', devPhase);

      // Add a small delay to prevent race conditions on iOS
      const setupTimer = setTimeout(
        () => {
          setPhase(devPhase);

          // Set data based on the phase
          switch (devPhase) {
            case 'connecting':
              console.log('📱 Dev Mode: Connecting screen');
              break;
            case 'lobby':
              console.log('📱 Dev Mode: Lobby screen');
              break;
            case 'countdown':
              console.log('📱 Dev Mode: Countdown screen');
              setCountdown(2);
              break;
            case 'question':
              console.log('📱 Dev Mode: Question screen');
              setCurrentQuestion(MOCK_DATA.currentQuestion);
              setQuestionIndex(0);
              setTotalQuestions(3);
              setTimeLeft(45); // ✅ CHANGED: Mock with 45 seconds left
              setUserScore(1);
              setOpponentScore(1);
              setOpponentAnswered(false);
              setHasAnswered(false);
              break;
            case 'results':
              console.log('📱 Dev Mode: Results screen');
              setRoundResult(MOCK_DATA.roundResult);
              setUserScore(1);
              setOpponentScore(1);
              setQuestionIndex(0);
              break;
            case 'final':
              console.log('📱 Dev Mode: Final screen');
              setFinalResults(MOCK_DATA.finalResults);
              setUserScore(2);
              setOpponentScore(1);
              setAnsweredQuestions([
                {
                  questionId: 1,
                  selectedAnswer: 'A',
                  correctAnswer: 'A',
                  isCorrect: true,
                  timeTaken: 5000,
                  questionText: MOCK_DATA.currentQuestion.text,
                  options: MOCK_DATA.currentQuestion.options,
                },
              ]);
              break;
            case 'error':
              console.log('📱 Dev Mode: Error screen');
              setError('Test error message for styling');
              break;
          }
        },
        isIOS ? 200 : 50,
      ); // Longer delay for iOS

      console.log('✅ Dev mode setup complete');

      return () => clearTimeout(setupTimer);
    }

    console.log('🔴 Production mode: Will run real initialization');
  }, []); // Empty dependency array to run only once

  // ✅ FIXED: Load duel information with proper iOS handling
  useEffect(() => {
    const loadDuelInfo = async () => {
      if (__DEV_MODE__) {
        console.log(
          '🟡 DEV MODE: Skipping loadDuelInfo - already set in initialization',
        );
        return; // Exit early in dev mode - data already set above
      }

      try {
        console.log('🔄 Loading duel info for duel:', duelId);
        setIsLoadingDuelInfo(true);

        // Add iOS-specific delay to prevent rapid calls
        if (isIOS) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }

        const duelDetails = await throttledApiCall(() =>
          duelService.getDuelDetails(duelId),
        );

        if (duelDetails && duelDetails.duel) {
          let duelInfoData: DuelInfo = {
            id: duelDetails.duel.duel_id,
            course_name:
              duelDetails.duel.course_name || duelDetails.duel.course_title,
            test_name:
              duelDetails.duel.test_name || duelDetails.duel.test_title,
            opponent_username: duelDetails.duel.opponent_username,
            opponent_id: duelDetails.duel.opponent_id,
            initiator_id: duelDetails.duel.initiator_id,
            test_id: duelDetails.duel.test_id,
            course_id: duelDetails.duel.course?.course_id,
          };

          // If missing data, fetch separately with throttling
          if (duelDetails.duel.test_id && !duelInfoData.test_name) {
            const test = await throttledApiCall(() =>
              testService.getTestById(duelDetails.duel.test_id),
            );
            if (test) {
              duelInfoData.test_name = test.title;
              if (!duelInfoData.course_name && test.course_id) {
                const course = await throttledApiCall(() =>
                  courseService.getCourseById(test.course_id),
                );
                if (course) {
                  duelInfoData.course_name = course.title;
                }
              }
            }
          }

          setDuelInfo(duelInfoData);

          // Check if opponent is a bot with throttling
          const currentUserId = userData?.userId;
          const opponentId =
            duelInfoData.initiator_id === currentUserId
              ? duelInfoData.opponent_id
              : duelInfoData.initiator_id;

          if (opponentId) {
            const isOpponentBot = await throttledApiCall(() =>
              botService.isBot(opponentId),
            );

            if (isOpponentBot) {
              const botInfo = await throttledApiCall(() =>
                botService.getBotInfo(opponentId),
              );
              setOpponentInfo({
                userId: opponentId,
                username:
                  botInfo?.botName || duelInfoData.opponent_username || 'Bot',
                isBot: true,
                botInfo: botInfo || undefined,
              });
            } else {
              setOpponentInfo({
                userId: opponentId,
                username: duelInfoData.opponent_username || 'Rakip',
                isBot: false,
              });
            }
          }
        }
      } catch (error) {
        console.error('Error loading duel info:', error);
        // Don't show error in dev mode
        if (!__DEV_MODE__) {
          setError('Düello bilgileri yüklenirken hata oluştu');
        }
      } finally {
        setIsLoadingDuelInfo(false); // ✅ ALWAYS set loading to false
      }
    };

    // Only load if we have duelId and userData, and not in dev mode initialization
    if (duelId && userData && !__DEV_MODE__) {
      loadDuelInfo();
    }
  }, [duelId, userData, throttledApiCall]);

  // ✅ FIXED: Initialize socket connection only in production
  useEffect(() => {
    if (__DEV_MODE__) {
      console.log('🟡 DEV MODE: Skipping socket initialization');
      return;
    }

    console.log('🔄 Initializing socket connection...');
    initializeConnection();

    return () => {
      disconnect();
      if (!__DEV_MODE__) {
        resetDuelState();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [resetDuelState]);

  // Reset duel state when duel ID changes (only in production)
  useEffect(() => {
    if (duelId && !__DEV_MODE__) {
      resetDuelState();
    }
  }, [duelId, resetDuelState]);

  // ✅ FIXED: Load user data with proper dev mode handling
  useEffect(() => {
    const loadUserData = async () => {
      if (__DEV_MODE__) {
        console.log('🟡 DEV MODE: Using mock user data');
        setUserData(MOCK_DATA.userData);
        return;
      }

      try {
        // Add iOS-specific delay
        if (isIOS) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        const data = await AsyncStorage.getItem('userData');
        if (data) {
          setUserData(JSON.parse(data));
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    loadUserData();
  }, []);

  // ✅ FIXED: iOS modal stability
  useEffect(() => {
    const timer = setTimeout(
      () => {
        setIsModalStable(true);
      },
      isIOS ? 200 : 50,
    );

    return () => clearTimeout(timer);
  }, []);

  // Handle back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        handleExitDuel();
        return true;
      },
    );

    return () => backHandler.remove();
  }, []);

  // Pulse animation for waiting states
  useEffect(() => {
    if (phase === 'connecting' || phase === 'lobby') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [phase]);

  // FIXED: Initialize connection using socketService
  const initializeConnection = async () => {
    if (__DEV_MODE__) {
      console.log('🟡 DEV MODE: Skipping connection initialization');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        setError("Kimlik doğrulama token'ı bulunamadı");
        return;
      }

      // FIXED: Use socketService connect function
      await connect(token);
      console.log('Connected to socket server');
      setupEventListeners();
      joinDuelRoom(duelId);
    } catch (error) {
      console.error('Error initializing connection:', error);
      setError('Oyun sunucusuna bağlanılamadı');
    }
  };

  // ✅ ENHANCED: Setup event listeners with server timing support
  const setupEventListeners = () => {
    if (__DEV_MODE__) return;

    // Socket event listeners
    on('connect', () => {
      console.log('Connected to socket server');
      setPhase('lobby');
    });

    on('room_joined', handleRoomJoined);
    on('opponent_joined', handleOpponentJoined);
    on('player_ready', handlePlayerReady);
    on('both_players_connected', handleBothPlayersConnected);
    on('duel_starting', handleDuelStarting);

    // ✅ NEW: Listen for server timer updates
    onTimerUpdate(handleTimerUpdate);
    onQuestionTimeUp(handleQuestionTimeUp);

    // ✅ ENHANCED: Use enhanced question handler with server timing
    onQuestionPresented(handleQuestionPresentedWithServerTiming);

    on('opponent_answered', handleOpponentAnswered);
    on('round_result', handleRoundResult);
    on('duel_completed', handleDuelCompleted);
    on('opponent_disconnected', handleOpponentDisconnected);
    on('room_error', handleRoomError);

    on('disconnect', () => {
      console.log('Disconnected from socket server');
      if (phase !== 'final') {
        setError('Bağlantı kesildi. Tekrar bağlanmaya çalışılıyor...');
      }
    });
    on('duel_error', (data) => {
      console.log('❌ DUEL ERROR:', data);
      setError(`Düello hatası: ${data.message || 'Bilinmeyen hata'}`);
      setPhase('error');
    });

    on('question_error', (data) => {
      console.log('❌ QUESTION ERROR:', data);
      setError(`Soru hatası: ${data.message || 'Soru yüklenemedi'}`);
    });

    // ADD: Connection health check
    on('connect_error', (error) => {
      console.log('❌ CONNECTION ERROR:', error);
      setError(
        `Bağlantı hatası: ${error.message || 'Sunucuya bağlanılamıyor'}`,
      );
      setPhase('error');
    });

    // Auto-ready for user
    setTimeout(() => {
      if (isConnected()) {
        signalReady();
      }
    }, 1000);
  };

  // ✅ NEW: Handle server timer updates (every second)
  const handleTimerUpdate = (data: {
    timeRemaining: number;
    serverTime: number;
    questionIndex: number;
  }) => {
    // Only update if this is for the current question
    if (data.questionIndex === questionIndex) {
      setTimeLeft(data.timeRemaining);
      setIsTimerSynced(true);
      console.log(`⏱️ Server timer update: ${data.timeRemaining}s remaining`);
    }
  };

  // ✅ NEW: Handle server-controlled time up
  const handleQuestionTimeUp = (data: {
    questionIndex: number;
    serverTime: number;
  }) => {
    if (data.questionIndex === questionIndex) {
      setTimeLeft(0);
      if (!hasAnswered) {
        // Server has already handled auto-submit, just update UI
        setHasAnswered(true);
        console.log('⏰ Server time up - question auto-submitted');
      }
    }
  };

  const handleRoomJoined = (data: { session: DuelSession }) => {
    setSession(data.session);
    setPhase('lobby');
  };

  const handleOpponentJoined = (data: {
    username: string;
    isBot?: boolean;
  }) => {
    console.log('Opponent joined:', data.username, 'isBot:', data.isBot);
  };

  const handlePlayerReady = (data: {
    userId: number;
    username: string;
    isBot?: boolean;
  }) => {
    console.log('Player ready:', data.username, 'isBot:', data.isBot);
  };

  const handleBothPlayersConnected = () => {
    console.log('Both players connected and ready');
  };

  const handleDuelStarting = (data: { countdown: number }) => {
    setPhase('countdown');
    setCountdown(data.countdown);
    setDuelStartTime(Date.now()); // Track duel start time
  };

  // ✅ ENHANCED: Question presented handler with server timing
  const handleQuestionPresentedWithServerTiming = (data: {
    questionIndex: number;
    totalQuestions: number;
    question: Question;
    timeLimit: number; // Will be 60000 (60 seconds)
    serverStartTime: number;
    serverEndTime: number;
  }) => {
    console.log('Question presented with 60s server timing:', data);

    setPhase('question');
    setCurrentQuestion(data.question);
    setQuestionIndex(data.questionIndex);
    setTotalQuestions(data.totalQuestions);
    setSelectedAnswer(null);
    setHasAnswered(false);
    setOpponentAnswered(false);

    // ✅ NEW: Store server timing info
    setServerStartTime(data.serverStartTime);
    setServerEndTime(data.serverEndTime);
    setIsTimerSynced(false);

    // ✅ NEW: Calculate initial time based on server timestamp
    const now = Date.now();
    const elapsed = now - data.serverStartTime;
    const remaining = Math.max(0, data.timeLimit - elapsed);
    const remainingSeconds = Math.ceil(remaining / 1000);

    setTimeLeft(remainingSeconds);
    answerStartTime.current = data.serverStartTime; // Use server start time

    console.log(
      `📊 Server timing: ${remainingSeconds}s remaining (elapsed: ${Math.floor(elapsed / 1000)}s)`,
    );

    // ✅ NEW: Start client-side backup timer (syncs with server updates)
    startSyncedTimer(data.serverEndTime);

    // Reset slide animation
    slideAnim.setValue(1);
  };

  // ✅ NEW: Synced timer that works with server updates
  const startSyncedTimer = (serverEndTime: number) => {
    // Clear any existing timer
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, serverEndTime - now);
      const remainingSeconds = Math.ceil(remaining / 1000);

      // Only update if we haven't received a server update recently
      if (
        !isTimerSynced ||
        Date.now() - ((serverStartTime || 0) % 1000) < 100
      ) {
        setTimeLeft(remainingSeconds);
      }

      // Reset sync flag after each update
      setIsTimerSynced(false);

      // Auto-submit if time is up and no server notification received
      if (remainingSeconds <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        if (!hasAnswered) {
          console.log('⏰ Client-side backup auto-submit triggered');
          handleAutoSubmit();
        }
      }
    }, 100); // More frequent updates for smoother countdown
  };

  // ✅ ENHANCED: Answer selection with server timing
  const handleAnswerSelect = (answer: string) => {
    if (hasAnswered || phase !== 'question') return;

    setSelectedAnswer(answer);
    setHasAnswered(true);

    // Use server start time for accurate timing
    const timeTaken = serverStartTime
      ? Date.now() - serverStartTime
      : Date.now() - answerStartTime.current;

    if (isConnected() && currentQuestion) {
      submitAnswer(currentQuestion.id, answer, timeTaken);
      console.log(
        `📝 Answer submitted with server timing: ${Math.floor(timeTaken / 1000)}s`,
      );
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  // ✅ ENHANCED: Auto-submit with server timing awareness
  const handleAutoSubmit = () => {
    if (!hasAnswered && isConnected() && currentQuestion) {
      const timeTaken = serverStartTime ? Date.now() - serverStartTime : 60000;
      submitAnswer(currentQuestion.id, null, timeTaken);
      setHasAnswered(true);
    }
  };

  const handleOpponentAnswered = (data: {
    userId: number;
    username: string;
    isBot?: boolean;
  }) => {
    setOpponentAnswered(true);
  };

  const handleRoundResult = (data: RoundResult) => {
    // FIXED: Add a strong guard to prevent crashes from malformed round result data
    if (!data || !data.question || !data.answers) {
      console.error('Received malformed round_result data, ignoring:', data);
      // You could potentially try to advance to the next question or show an error
      // For now, we'll just prevent a crash.
      return;
    }

    console.log('Round result received:', data); // Add a log to confirm we got here
    setPhase('results');
    setRoundResult(data);

    if (currentQuestion) {
      setCurrentQuestion((prev) =>
        prev
          ? {
              ...prev,
              correctAnswer: data.question.correctAnswer,
              explanation: data.question.explanation,
            }
          : null,
      );
    }

    // Track the answered question for analytics
    if (currentQuestion) {
      const userAnswer = data.answers.find(
        (a) => a.userId === userData?.userId,
      );
      if (userAnswer) {
        const answeredQuestion: AnsweredQuestion = {
          questionId: currentQuestion.id,
          selectedAnswer: userAnswer.selectedAnswer,
          correctAnswer: data.question.correctAnswer,
          isCorrect: userAnswer.isCorrect,
          timeTaken: userAnswer.timeTaken,
          questionText: data.question.text,
          options: data.question.options,
        };

        setAnsweredQuestions((prev) => [...prev, answeredQuestion]);

        // Track question history (fire and forget)
        trackQuestionHistory(answeredQuestion).catch(console.error);
      }
    }

    // Update scores
    const userAnswer = data.answers.find((a) => a.userId === userData?.userId);
    const opponentAnswer = data.answers.find(
      (a) => a.userId !== userData?.userId,
    );

    if (userAnswer?.isCorrect) {
      setUserScore((prev) => prev + 1);
    }
    if (opponentAnswer?.isCorrect) {
      setOpponentScore((prev) => prev + 1);
    }

    // Reset slide animation for next question
    slideAnim.setValue(0);
  };

  const handleDuelCompleted = async (data: FinalResults) => {
    setPhase('final');
    setFinalResults(data);
    setDuelEndTime(Date.now());

    await trackDuelAnalytics(data);
  };

  const handleOpponentDisconnected = (data: {
    userId: number;
    username: string;
  }) => {
    const disconnectedName = opponentInfo?.isBot
      ? opponentInfo.username
      : data.username;

    Alert.alert(
      opponentInfo?.isBot ? 'Bot Hatası' : 'Rakip Bağlantısı Kesildi',
      opponentInfo?.isBot
        ? `${disconnectedName} ile bağlantı koptu. Teknik sorun nedeniyle varsayılan olarak kazandınız!`
        : `${disconnectedName} düellodan ayrıldı. Varsayılan olarak kazandınız!`,
      [{ text: 'Tamam', onPress: () => router.back() }],
    );
  };

  const handleRoomError = (data: { message: string }) => {
    setError(data.message);
    setPhase('error');
  };

  const handleExitDuel = () => {
    Alert.alert(
      'Düellodan Çık',
      'Ayrılmak istediğinizden emin misiniz? Bu yenilgi sayılacak.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çık',
          style: 'destructive',
          onPress: () => {
            if (!__DEV_MODE__) {
              disconnect();
            }
            resetDuelState();
            router.replace('/(tabs)/duels/new');
          },
        },
      ],
    );
  };

  // New function to track question history
  const trackQuestionHistory = async (answeredQuestion: AnsweredQuestion) => {
    try {
      if (!userData?.userId || !duelInfo?.test_id || !duelInfo?.course_id) {
        console.warn('Missing required data for question history tracking');
        return;
      }

      console.log('Question answered in duel:', {
        userId: userData.userId,
        questionId: answeredQuestion.questionId,
        testId: duelInfo.test_id,
        courseId: duelInfo.course_id,
        isCorrect: answeredQuestion.isCorrect,
        timeTaken: answeredQuestion.timeTaken,
        duelId: duelId,
      });
    } catch (error) {
      console.error('Error tracking question history:', error);
    }
  };

  // New function to create duel result record
  const createDuelResultRecord = async (results: FinalResults) => {
    if (duelResultCreated || isCreatingDuelResult) {
      return; // Prevent duplicate creation
    }

    try {
      setIsCreatingDuelResult(true);

      const createDuelResultData: CreateDuelResultInput = {
        duelId: duelId,
        winnerId: results.winnerId || undefined,
        initiatorScore:
          duelInfo?.initiator_id === userData?.userId
            ? results.user1.userId === userData?.userId
              ? results.user1.score
              : results.user2.score
            : results.user1.userId === userData?.userId
              ? results.user2.score
              : results.user1.score,
        opponentScore:
          duelInfo?.initiator_id === userData?.userId
            ? results.user1.userId === userData?.userId
              ? results.user2.score
              : results.user1.score
            : results.user1.userId === userData?.userId
              ? results.user1.score
              : results.user2.score,
      };

      const duelResult =
        await duelResultService.createDuelResult(createDuelResultData);
      console.log('Duel result created:', duelResult);
      setDuelResultCreated(true);

      // Track analytics for duel completion
      await trackDuelAnalytics(results);
    } catch (error) {
      console.error('Error creating duel result:', error);
      // Don't show error to user as this is background operation
    } finally {
      setIsCreatingDuelResult(false);
    }
  };

  // New function to track duel analytics
  const trackDuelAnalytics = async (results: FinalResults) => {
    try {
      const isWinner = results.winnerId === userData?.userId;
      const isDraw = results.winnerId === null;
      const userStats =
        results.user1.userId === userData?.userId
          ? results.user1
          : results.user2;
      const duelDuration =
        duelEndTime && duelStartTime ? duelEndTime - duelStartTime : 0;

      console.log('Duel completed analytics:', {
        duelId,
        isWinner,
        isDraw,
        score: userStats.score,
        accuracy: userStats.accuracy,
        totalTime: userStats.totalTime,
        duelDuration,
        opponentIsBot: opponentInfo?.isBot,
        totalQuestions,
        courseId: duelInfo?.course_id,
        testId: duelInfo?.test_id,
      });
    } catch (error) {
      console.error('Error tracking duel analytics:', error);
    }
  };

  const getDifficultyColor = (level?: number) => {
    if (!level) return Colors.gray[500];
    switch (level) {
      case 1:
        return Colors.vibrant.mint;
      case 2:
        return Colors.vibrant.yellow;
      case 3:
        return Colors.vibrant.orange;
      case 4:
        return Colors.vibrant.coral;
      case 5:
        return Colors.vibrant.purple;
      default:
        return Colors.gray[500];
    }
  };

  const getBotDisplayInfo = () => {
    if (!opponentInfo?.isBot || !opponentInfo.botInfo) return null;

    const bot = opponentInfo.botInfo;
    return {
      name: bot.botName,
      avatar: bot.avatar,
      difficulty: bot.difficultyLevel,
      accuracy: Math.floor(bot.accuracyRate * 100).toString(),
      avgTime: Math.floor(bot.avgResponseTime / 1000).toString(),
      color: getDifficultyColor(bot.difficultyLevel),
    };
  };

  const renderDuelInfoHeader = () => {
    // ✅ FIXED: Show loading state properly in both dev and prod
    if (isLoadingDuelInfo && !__DEV_MODE__) {
      return (
        <View style={styles.duelInfoHeader}>
          <Row style={{ alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size='small' color={Colors.white} />
            <Text style={styles.duelInfoLoading}>
              Düello bilgileri yükleniyor...
            </Text>
          </Row>
        </View>
      );
    }

    if (!duelInfo) return null;

    const botInfo = getBotDisplayInfo();

    return (
      <View style={styles.duelInfoHeader}>
        <Row style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Column style={{ alignItems: 'center', flex: 1 }}>
            {duelInfo.course_name && (
              <Text style={styles.duelInfoCourse}>
                📚 {duelInfo.course_name}
              </Text>
            )}
            {duelInfo.test_name && (
              <Text style={styles.duelInfoTest}>📝 {duelInfo.test_name}</Text>
            )}
            {botInfo && (
              <Text style={[styles.duelInfoBot, { color: botInfo.color }]}>
                🤖 {botInfo.name} (Seviye {botInfo.difficulty})
              </Text>
            )}
            {/* Show creation status if in progress */}
            {isCreatingDuelResult && (
              <Text style={styles.duelInfoLoading}>
                Sonuçlar kaydediliyor...
              </Text>
            )}
          </Column>
        </Row>
      </View>
    );
  };

  const renderConnecting = () => (
    <View style={styles.mainContainer}>
      <View style={{ marginHorizontal: Spacing[4] }}>
        {renderDuelInfoHeader()}
      </View>
      <View style={styles.contentWrapper}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <PlayfulCard
            variant='gradient'
            style={{
              width: 128,
              height: 128,
              borderRadius: 64,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: Spacing[4],
              alignContent: 'center',
            }}
            contentContainerStyle={{
              alignItems: 'center',
              justifyContent: 'center',
              alignContent: 'center',
            }}
            animated={true}
            floatingAnimation={true}
            gradient='purple'
          >
            <Video
              source={logoVideo}
              style={styles.logoVideo}
              shouldPlay={true}
              isLooping={true}
              isMuted={true}
              resizeMode={ResizeMode.COVER}
              useNativeControls={false}
              usePoster={false}
            />
          </PlayfulCard>
        </Animated.View>
        <PlayfulTitle level={2} style={styles.whiteText}>
          Düelloya Bağlanıyor...
        </PlayfulTitle>
        <ActivityIndicator
          size='large'
          color={Colors.white}
          style={{ marginTop: Spacing[4] }}
        />
      </View>
    </View>
  );

  const renderLobby = () => {
    const botInfo = getBotDisplayInfo();

    return (
      <ScrollView style={styles.mainContainer}>
        <View style={{ marginHorizontal: Spacing[4] }}>
          {renderDuelInfoHeader()}
        </View>
        <View style={styles.contentWrapper}>
          <PlayfulCard variant='glass' style={styles.lobbyCard}>
            <Column style={{ alignItems: 'center' as const }}>
              <Row
                style={{
                  alignItems: 'center' as const,
                  marginBottom: Spacing[6],
                }}
              >
                <Avatar
                  size='lg'
                  name={userData?.username?.charAt(0) || 'K'}
                  bgColor={Colors.vibrant.purple}
                  style={
                    {
                      // shadowColor: '#000',
                      // shadowOffset: { width: 4, height: 16 },
                      // shadowOpacity: 0.25,
                      // shadowRadius: 20,
                      // elevation: 20,
                    }
                  }
                />
                <Text style={styles.vsText}>KARŞI</Text>
                <Avatar
                  size='lg'
                  name={
                    botInfo
                      ? botInfo.avatar
                      : opponentInfo?.username?.charAt(0) || '?'
                  }
                  bgColor={botInfo ? botInfo.color : Colors.vibrant.orange}
                  style={
                    {
                      // shadowColor: '#000',
                      // shadowOffset: { width: 4, height: 16 },
                      // shadowOpacity: 0.25,
                      // shadowRadius: 20,
                      // elevation: 20,
                    }
                  }
                />
              </Row>

              <PlayfulTitle level={3} style={styles.whiteText}>
                Düello Lobisi
              </PlayfulTitle>

              <Paragraph style={styles.lightText}>
                {opponentInfo?.isBot
                  ? `${opponentInfo.username} ile düello başlıyor...`
                  : opponentInfo?.username
                    ? `${opponentInfo.username} ile düello başlıyor...`
                    : 'Her iki oyuncunun hazır olması bekleniyor...'}
              </Paragraph>

              {botInfo && (
                <View style={styles.botInfoCard}>
                  <Text style={styles.botInfoTitle}>Bot Bilgileri</Text>
                  <Text style={styles.botInfoText}>
                    Zorluk: Seviye {botInfo.difficulty} • Doğruluk:{' '}
                    {botInfo.accuracy}%
                  </Text>
                  <Text style={styles.botInfoText}>
                    Ortalama Yanıt Süresi: {botInfo.avgTime}s
                  </Text>
                </View>
              )}

              <Row style={{ marginTop: Spacing[4] }}>
                <Badge
                  text='Hazır ✓'
                  variant='success'
                  fontFamily='SecondaryFont-Bold'
                />
                <Badge
                  text={opponentInfo?.isBot ? 'Bot Hazır ✓' : 'Bekliyor...'}
                  variant={opponentInfo?.isBot ? 'success' : 'warning'}
                  fontFamily='SecondaryFont-Bold'
                />
              </Row>
            </Column>
          </PlayfulCard>
        </View>
      </ScrollView>
    );
  };

  const renderCountdown = () => (
    <View style={styles.mainContainer}>
      <View style={{ marginHorizontal: Spacing[4] }}>
        {renderDuelInfoHeader()}
      </View>
      <View style={styles.contentWrapper}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Text style={styles.countdownText}>{countdown}</Text>
        </Animated.View>
        <PlayfulTitle level={2} style={styles.whiteText}>
          Hazır Olun!
        </PlayfulTitle>
      </View>
    </View>
  );

  // ✅ FIXED: Enhanced option styling logic - only show results in results phase
  const renderQuestion = () => {
    console.log('renderQuestion called, currentQuestion:', currentQuestion);
    console.log('phase:', phase);

    // FIXED: Enhanced guard clause to prevent crashes from invalid options
    if (!currentQuestion || !currentQuestion.options) {
      console.log(
        'No current question or options available, showing loading...',
        {
          hasQuestion: !!currentQuestion,
          hasOptions: !!currentQuestion?.options,
        },
      );
      return (
        <View style={styles.mainContainer}>
          <View style={{ marginHorizontal: Spacing[4] }}>
            {renderDuelInfoHeader()}
          </View>
          <View style={styles.contentWrapper}>
            <ActivityIndicator size='large' color={Colors.white} />
            <Text style={[styles.lightText, { marginTop: Spacing[3] }]}>
              Soru yükleniyor...
            </Text>
          </View>
        </View>
      );
    }

    console.log('Rendering question:', currentQuestion.text);
    console.log('Options:', currentQuestion.options);

    return (
      <View style={styles.mainContainer}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {renderDuelInfoHeader()}

          {/* Question Header with 60s timer display */}
          <View style={styles.questionHeaderContainer}>
            <Row style={styles.questionHeader}>
              <Column>
                <Text style={styles.questionCounter}>
                  Soru {questionIndex + 1} / {totalQuestions}
                </Text>
                <ProgressBar
                  progress={Number(
                    (((questionIndex + 1) / totalQuestions) * 100).toFixed(0),
                  )}
                  progressColor={Colors.vibrant.mint}
                  style={{ width: 120, marginTop: Spacing[1] }}
                />
              </Column>
              <Column style={{ alignItems: 'flex-end' as const }}>
                <Text
                  style={[
                    styles.timer,
                    timeLeft <= 10 && styles.timerDanger,
                    !isTimerSynced && styles.timerUnsynced,
                  ]}
                >
                  {timeLeft}s {isTimerSynced ? '🟢' : '🔄'}
                </Text>
                <Text style={styles.questionTimeLimit}>/ 60s total</Text>
                <Text style={styles.opponentStatus}>
                  {opponentAnswered
                    ? `${opponentInfo?.isBot ? 'Bot' : 'Rakip'}: Tamamladı ✓`
                    : `${opponentInfo?.isBot ? 'Bot' : 'Rakip'}: ${
                        opponentInfo?.isBot ? 'Hesaplıyor...' : 'Düşünüyor...'
                      }`}
                </Text>
              </Column>
            </Row>
          </View>

          {/* Score Display */}
          <View style={styles.scoreContainer}>
            <Row style={styles.scoreRow}>
              <View style={styles.scoreDisplayWrapper}>
                <ScoreDisplay
                  score={userScore}
                  maxScore={totalQuestions}
                  label={userData.username}
                  variant='gradient'
                  size='small'
                />
              </View>
              <View style={styles.scoreDisplayWrapper}>
                <ScoreDisplay
                  score={opponentScore}
                  maxScore={totalQuestions}
                  label={opponentInfo?.username || 'Rakip'}
                  variant='gradient'
                  size='small'
                />
              </View>
            </Row>
          </View>

          {/* Question Content */}
          <View style={styles.questionCard}>
            <View style={styles.questionContent}>
              <Text style={styles.questionText}>{currentQuestion.text}</Text>

              <View style={styles.optionsContainer}>
                {Object.entries(currentQuestion.options).map(([key, value]) => {
                  // ✅ ENHANCED: Show correct/wrong styling after user answers
                  const isSelected = selectedAnswer === key;
                  const isCorrect = currentQuestion.correctAnswer === key;
                  const showResultsInQuestion =
                    hasAnswered && currentQuestion.correctAnswer; // ✅ NEW

                  let optionStyle: StyleProp<ViewStyle> = styles.optionButton;
                  let optionTextStyle: StyleProp<TextStyle> = styles.optionText;

                  if (showResultsInQuestion) {
                    // ✅ NEW: Show correct/wrong styling after answering
                    if (isCorrect) {
                      optionStyle = [styles.optionButton, styles.correctOption];
                      optionTextStyle = [
                        styles.optionText,
                        styles.correctOptionText,
                      ];
                    } else if (isSelected) {
                      optionStyle = [
                        styles.optionButton,
                        styles.wrongSelectedOption,
                      ];
                      optionTextStyle = [
                        styles.optionText,
                        styles.wrongSelectedOptionText,
                      ];
                    }
                  } else if (isSelected) {
                    // Normal selection state during answering
                    optionStyle = [styles.optionButton, styles.selectedOption];
                    optionTextStyle = [
                      styles.optionText,
                      styles.selectedOptionText,
                    ];
                  }

                  // Disable options after answering
                  if (hasAnswered) {
                    optionStyle = Array.isArray(optionStyle)
                      ? [...optionStyle, styles.disabledOption]
                      : [optionStyle, styles.disabledOption];
                  }

                  return (
                    <TouchableOpacity
                      key={key}
                      style={optionStyle}
                      onPress={() => handleAnswerSelect(key)}
                      disabled={hasAnswered}
                      activeOpacity={0.8}
                    >
                      <Text style={optionTextStyle}>
                        {key}) {value}
                        {/* ✅ NEW: Show indicators after answering */}
                        {showResultsInQuestion && isCorrect && ' ✓'}
                        {showResultsInQuestion &&
                          isSelected &&
                          !isCorrect &&
                          ' ✗'}
                        {showResultsInQuestion && isSelected && ' (Seçiminiz)'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Answer Status */}
          {hasAnswered && (
            <View style={styles.answerStatusContainer}>
              <Badge
                text='Cevap Gönderildi ✓'
                variant='success'
                size='md'
                fontFamily='SecondaryFont-Bold'
                style={styles.answerStatusBadge}
              />
              <Paragraph style={styles.answerStatusText}>
                {opponentInfo?.isBot
                  ? 'Bot hesaplıyor...'
                  : 'Rakip bekleniyor...'}
              </Paragraph>
            </View>
          )}

          {hasAnswered && currentQuestion.correctAnswer && (
            <View style={styles.questionResultsContainer}>
              <View style={styles.correctAnswerContainer}>
                <Text style={styles.correctAnswer}>
                  Doğru Cevap: {currentQuestion.correctAnswer}){' '}
                  {currentQuestion.options?.[currentQuestion.correctAnswer] ||
                    'N/A'}
                </Text>
              </View>

              {/* Explanation if available */}
              {currentQuestion.explanation && (
                <View style={styles.explanationContainer}>
                  <Text style={styles.explanationTitle}>💡 Açıklama</Text>
                  <Text style={styles.explanationText}>
                    {currentQuestion.explanation}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Bottom spacing for scroll */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
    );
  };

  // ✅ FIXED: Results rendering with proper answer highlighting and explanations
  const renderResults = () => {
    if (!roundResult || !roundResult.question) {
      return null;
    }

    const userAnswer = roundResult.answers?.find(
      (a) => a.userId === userData?.userId,
    );
    const isUserCorrect = userAnswer?.isCorrect || false;

    return (
      <View style={styles.mainContainer}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderDuelInfoHeader()}
          <View style={styles.resultsContainer}>
            <PlayfulCard variant='glass' style={styles.resultsCard}>
              <Column style={{ alignItems: 'center' as const }}>
                <PlayfulTitle level={2} style={styles.whiteText}>
                  {questionIndex + 1}. Tur Sonuçları
                </PlayfulTitle>

                {/* Question Display with Answer Highlighting */}
                <View style={styles.questionResultsContainer}>
                  <Text style={styles.questionResultsText}>
                    {roundResult.question.text}
                  </Text>

                  {/* Options with correct/wrong highlighting */}
                  <View style={styles.resultsOptionsContainer}>
                    {Object.entries(roundResult.question.options).map(
                      ([key, value]) => {
                        const isCorrect =
                          roundResult.question.correctAnswer === key;
                        const isUserSelected =
                          userAnswer?.selectedAnswer === key;

                        let optionStyle: StyleProp<ViewStyle> =
                          styles.resultOptionButton;
                        let optionTextStyle: StyleProp<TextStyle> =
                          styles.resultOptionText;

                        if (isCorrect) {
                          // Always highlight correct answer in green
                          optionStyle = [
                            styles.resultOptionButton,
                            styles.correctResultOption,
                          ];
                          optionTextStyle = [
                            styles.resultOptionText,
                            styles.correctResultOptionText,
                          ];
                        } else if (isUserSelected) {
                          // Highlight user's wrong selection in red
                          optionStyle = [
                            styles.resultOptionButton,
                            styles.wrongResultOption,
                          ];
                          optionTextStyle = [
                            styles.resultOptionText,
                            styles.wrongResultOptionText,
                          ];
                        }

                        return (
                          <View key={key} style={optionStyle}>
                            <Text style={optionTextStyle}>
                              {key}) {value}
                              {isCorrect && ' ✓'}
                              {isUserSelected && !isCorrect && ' ✗'}
                              {isUserSelected && ' (Seçiminiz)'}
                            </Text>
                          </View>
                        );
                      },
                    )}
                  </View>

                  {/* Correct Answer Display */}
                  <View style={styles.correctAnswerContainer}>
                    <Text style={styles.correctAnswer}>
                      Doğru Cevap: {roundResult.question.correctAnswer}){' '}
                      {roundResult.question.options?.[
                        roundResult.question.correctAnswer
                      ] || 'N/A'}
                    </Text>
                  </View>

                  {/* Explanation if available */}
                  {roundResult.question.explanation && (
                    <View style={styles.explanationContainer}>
                      <Text style={styles.explanationTitle}>💡 Açıklama</Text>
                      <Text style={styles.explanationText}>
                        {roundResult.question.explanation}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Player Results */}
                <View style={styles.resultRowContainer}>
                  <Row style={styles.resultRow}>
                    {roundResult.answers?.map((answer, idx) => {
                      if (!answer) return null;

                      const isUser = answer.userId === userData?.userId;
                      const displayName = isUser
                        ? userData.username
                        : opponentInfo?.username || 'Rakip';

                      return (
                        <View key={idx} style={styles.playerResultContainer}>
                          <Column style={styles.playerResult}>
                            <Text style={styles.playerName}>
                              {displayName}
                              {!isUser && opponentInfo?.isBot && ' 🤖'}
                            </Text>
                            <Badge
                              text={answer.isCorrect ? 'Doğru ✓' : 'Yanlış ✗'}
                              variant={answer.isCorrect ? 'success' : 'error'}
                              style={styles.resultBadge}
                              fontFamily='SecondaryFont-Bold'
                            />
                            <Text style={styles.timeText}>
                              {Math.floor((answer.timeTaken / 1000) * 10) / 10}s
                            </Text>
                            {answer.selectedAnswer && (
                              <Text style={styles.selectedAnswerText}>
                                Seçim: {answer.selectedAnswer}
                              </Text>
                            )}
                          </Column>
                        </View>
                      );
                    })}
                  </Row>
                </View>

                {/* Current Score */}
                <View style={styles.currentScoreContainer}>
                  <Row style={styles.currentScore}>
                    <Column
                      style={{ alignItems: 'center' as const, minWidth: 80 }}
                    >
                      <AnimatedCounter
                        value={userScore}
                        style={{ color: Colors.vibrant.mint }}
                      />
                      <Text style={styles.scoreLabel}>Puanınız</Text>
                    </Column>
                    <Text style={styles.scoreVs}>-</Text>
                    <Column
                      style={{ alignItems: 'center' as const, minWidth: 80 }}
                    >
                      <AnimatedCounter
                        value={opponentScore}
                        style={{ color: Colors.vibrant.coral }}
                      />
                      <Text style={styles.scoreLabel}>
                        {opponentInfo?.isBot ? 'Bot' : 'Rakip'}
                      </Text>
                    </Column>
                  </Row>
                </View>

                {/* Question Report Section */}
                <View style={styles.reportQuestionContainer}>
                  <Text style={styles.reportQuestionTitle}>
                    Soruyla ilgili bir sorun mu var?
                  </Text>
                  <Text style={styles.reportQuestionDescription}>
                    Yanlış cevap, yazım hatası veya belirsizlik varsa bize
                    bildirin
                  </Text>
                  <TouchableOpacity
                    style={styles.reportButton}
                    onPress={() => setShowReportModal(true)}
                    activeOpacity={0.8}
                  >
                    <FontAwesome
                      name='flag'
                      size={16}
                      color={Colors.white}
                      style={{ marginRight: Spacing[2] }}
                    />
                    <Text style={styles.reportButtonText}>Soruyu Bildir</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.nextQuestionContainer}>
                  <Paragraph style={styles.lightText}>
                    Sonraki soru 30 saniye içinde...
                  </Paragraph>
                </View>
              </Column>
            </PlayfulCard>
          </View>

          {/* Question Report Modal */}
          {currentQuestion && (
            <QuestionReportModal
              isVisible={showReportModal}
              onClose={() => setShowReportModal(false)}
              questionId={currentQuestion.id}
              questionText={roundResult.question.text}
              questionOptions={roundResult.question.options}
              correctAnswer={roundResult.question.correctAnswer}
              userAnswer={userAnswer?.selectedAnswer || null}
              isCorrect={isUserCorrect}
            />
          )}
        </ScrollView>
      </View>
    );
  };

  const renderFinal = () => {
    const botInfo = getBotDisplayInfo();

    return (
      <View style={styles.mainContainer}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderDuelInfoHeader()}
          <View style={styles.finalContainer}>
            <PlayfulCard variant='glass' style={styles.finalCard}>
              <Column style={{ alignItems: 'center' as const }}>
                {/* FIXED: Duel Summary with proper container */}

                {finalResults && (
                  <>
                    {/* FIXED: Winner Display with proper container */}
                    <View style={styles.winnerSectionContainer}>
                      <View style={styles.winnerSection}>
                        {finalResults.winnerId === userData?.userId ? (
                          <>
                            <Text style={styles.winnerEmoji}>🏆</Text>
                            <PlayfulTitle
                              level={1}
                              gradient='primary'
                              style={styles.winnerText}
                              fontFamily='SecondaryFont-Bold'
                            >
                              ZAFER!
                            </PlayfulTitle>
                            {opponentInfo?.isBot && (
                              <Text style={styles.botVictoryText}>
                                {opponentInfo.username} botu yendiniz!
                              </Text>
                            )}
                          </>
                        ) : finalResults.winnerId ? (
                          <>
                            <Text style={styles.winnerEmoji}>😔</Text>
                            <PlayfulTitle level={1} style={styles.loserText}>
                              Yenilgi
                            </PlayfulTitle>
                            {opponentInfo?.isBot && (
                              <Text style={styles.botDefeatText}>
                                {opponentInfo.username} botu sizi yendi!
                              </Text>
                            )}
                          </>
                        ) : (
                          <>
                            <Text style={styles.winnerEmoji}>🤝</Text>
                            <PlayfulTitle level={1} style={styles.drawText}>
                              Beraberlik!
                            </PlayfulTitle>
                          </>
                        )}
                      </View>
                    </View>

                    {/* FIXED: Final Score with proper container */}
                    <View style={styles.finalScoreContainer}>
                      <Row style={styles.finalScore}>
                        <View style={styles.finalScoreWrapper}>
                          <ScoreDisplay
                            score={
                              finalResults.user1.userId === userData?.userId
                                ? finalResults.user1.score
                                : finalResults.user2.score
                            }
                            maxScore={totalQuestions}
                            label={userData.username}
                            variant='default'
                            size='medium'
                            style={{
                              width: '100%',
                              maxWidth: '100%',
                              // Custom overrides for compact display
                            }}
                            scoreFontFamily='PrimaryFont' // Use a more condensed font
                            labelFontFamily='SecondaryFont-Bold'
                            maxScoreFontFamily='PrimaryFont'
                          />
                        </View>
                        <View style={styles.finalScoreWrapper}>
                          <ScoreDisplay
                            score={
                              finalResults.user1.userId === userData?.userId
                                ? finalResults.user2.score
                                : finalResults.user1.score
                            }
                            maxScore={totalQuestions}
                            label={opponentInfo?.username || 'Rakip'}
                            variant='default'
                            size='medium'
                            style={{
                              width: '100%',
                              maxWidth: '100%',
                              // Custom overrides for compact display
                            }}
                            scoreFontFamily='PrimaryFont' // Use a more condensed font
                            labelFontFamily='SecondaryFont-Bold'
                            maxScoreFontFamily='PrimaryFont'
                          />
                        </View>
                      </Row>
                    </View>
                    {duelInfo && (
                      <View style={styles.duelSummaryContainer}>
                        <View style={styles.duelSummary}>
                          <Text style={styles.duelSummaryTitle}>
                            Düello Özeti
                          </Text>
                          <Text style={styles.duelSummaryText}>
                            📚 {duelInfo.course_name}
                          </Text>
                          <Text style={styles.duelSummaryText}>
                            📝 {duelInfo.test_name}
                          </Text>
                          <Text style={styles.duelSummaryText}>
                            👥 {userData?.username} vs {opponentInfo?.username}
                            {opponentInfo?.isBot && ' 🤖'}
                          </Text>
                          {botInfo && (
                            <Text
                              style={[
                                styles.duelSummaryText,
                                { color: botInfo.color },
                              ]}
                            >
                              🎯 Zorluk Seviye {botInfo.difficulty} •{' '}
                              {botInfo.accuracy}% Doğruluk
                            </Text>
                          )}
                          <Text style={styles.duelSummaryText}>
                            📊 {answeredQuestions.length} soru yanıtlandı
                          </Text>
                          {duelResultCreated && (
                            <View style={styles.resultCreatedContainer}>
                              <Badge
                                text='Sonuçlar Kaydedildi ✓'
                                variant='success'
                                style={styles.resultCreatedBadge}
                              />
                            </View>
                          )}
                        </View>
                      </View>
                    )}

                    {/* FIXED: Enhanced Stats with proper container */}
                    <View style={styles.statsSectionContainer}>
                      <View style={styles.statsSection}>
                        <Row style={styles.statsRow}>
                          <Text style={styles.statText}>
                            Doğruluk:{' '}
                            {Math.floor(
                              (finalResults.user1.userId === userData?.userId
                                ? finalResults.user1.accuracy
                                : finalResults.user2.accuracy) * 100,
                            )}
                            %
                          </Text>
                          <Text style={styles.statText}>
                            Ort. Süre:{' '}
                            {Math.floor(
                              ((finalResults.user1.userId === userData?.userId
                                ? finalResults.user1.totalTime
                                : finalResults.user2.totalTime) /
                                1000 /
                                totalQuestions) *
                                10,
                            ) / 10}
                            s
                          </Text>
                        </Row>

                        {/* Additional stats from answered questions */}
                        {answeredQuestions.length > 0 && (
                          <Row style={styles.additionalStatsRow}>
                            <Text style={styles.statText}>
                              Doğru:{' '}
                              {
                                answeredQuestions.filter((q) => q.isCorrect)
                                  .length
                              }
                            </Text>
                            <Text style={styles.statText}>
                              Yanlış:{' '}
                              {
                                answeredQuestions.filter((q) => !q.isCorrect)
                                  .length
                              }
                            </Text>
                          </Row>
                        )}
                      </View>
                    </View>

                    {/* FIXED: Action Buttons with proper container */}
                    <View style={styles.actionButtonsContainer}>
                      <Row style={styles.actionButtons}>
                        <Button
                          title='Yeni Düello'
                          variant='ghost'
                          onPress={() => {
                            if (!__DEV_MODE__) {
                              disconnect();
                            }
                            resetDuelState();
                            router.replace('/(tabs)/duels/new');
                          }}
                          style={styles.actionButton}
                        />
                        <Button
                          title='Çık'
                          variant='secondary'
                          onPress={() => {
                            if (!__DEV_MODE__) {
                              disconnect();
                            }
                            resetDuelState();
                            router.replace('/(tabs)/duels');
                          }}
                          style={styles.actionButton}
                        />
                      </Row>
                    </View>
                  </>
                )}
              </Column>
            </PlayfulCard>
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderError = () => (
    <View style={styles.mainContainer}>
      <View style={styles.contentWrapper}>
        <UIAlert
          type='error'
          title='Bağlantı Hatası'
          message={error || 'Bir şeyler ters gitti'}
          style={{ marginBottom: Spacing[4] }}
        />
        <Button
          title='Tekrar Dene'
          variant='primary'
          onPress={() => {
            setError(null);
            setPhase('connecting');
            if (!__DEV_MODE__) {
              initializeConnection();
            }
          }}
        />
      </View>
    </View>
  );

  // ✅ NEW: Add cleanup for new event listeners
  useEffect(() => {
    return () => {
      // Clean up timer event listeners
      if (!__DEV_MODE__) {
        off('timer_update', handleTimerUpdate);
        off('question_time_up', handleQuestionTimeUp);
        off('question_presented', handleQuestionPresentedWithServerTiming);
      }

      // Clear any active timers
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // ✅ FIXED: Don't render modal until stable on iOS
  if (!isModalStable && isIOS) {
    return (
      <View style={styles.mainContainer}>
        <View style={styles.contentWrapper}>
          <ActivityIndicator size='large' color={Colors.white} />
          <Text style={[styles.lightText, { marginTop: Spacing[3] }]}>
            Hazırlanıyor...
          </Text>
        </View>
      </View>
    );
  }

  // Main render logic
  switch (phase) {
    case 'connecting':
      return renderConnecting();
    case 'lobby':
      return renderLobby();
    case 'countdown':
      return renderCountdown();
    case 'question':
      return renderQuestion();
    case 'results':
      return renderResults();
    case 'final':
      return renderFinal();
    case 'error':
      return renderError();
    default:
      return renderConnecting();
  }
}

// ✅ ENHANCED: Styles with new timer styling
const styles = {
  // Main container with proper background
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.primary.dark,
  } as ViewStyle,

  // Content wrapper that accounts for the header
  contentWrapper: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[4], // Increased for header space
    paddingBottom: Spacing[4],
  } as ViewStyle,

  // FIXED: ScrollView container
  scrollContainer: {
    flex: 1,
    backgroundColor: Colors.vibrant.purple,
  } as ViewStyle,

  // FIXED: ScrollView content
  scrollContent: {
    paddingTop: Spacing[4], // Space for fixed header
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[8],
    minHeight: height - 100, // Ensure minimum scrollable height
  } as ViewStyle,

  // FIXED: Header styling with proper z-index
  duelInfoHeader: {
    backgroundColor: Colors.vibrant.orangeLight,
    borderRadius: BorderRadius['3xl'],
    padding: Spacing[3],
    marginTop: 40,
    marginBottom: Spacing[4],
    // High z-index to stay on top
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    // shadowColor: '#000',
    // shadowOffset: { width: 2, height: 12 },
    // shadowOpacity: 0.25,
    // shadowRadius: 10,

    width: '100%',
    elevation: 10, // Higher elevation for Android
  } as ViewStyle,

  // FIXED: Question header container
  questionHeaderContainer: {
    backgroundColor: Colors.vibrant.orangeLight,
    borderRadius: BorderRadius['3xl'],
    padding: Spacing[4],
    marginBottom: Spacing[4],
    minHeight: 80,
    // shadowColor: '#000',
    // shadowOffset: { width: 2, height: 12 },
    // shadowOpacity: 0.25,
    // shadowRadius: 10,
    // elevation: 10,
  } as ViewStyle,

  questionHeader: {
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  } as ViewStyle,

  // FIXED: Score container
  scoreContainer: {
    backgroundColor: Colors.vibrant.orangeLight,
    borderRadius: BorderRadius['3xl'],
    padding: Spacing[4],
    marginBottom: Spacing[6],
    minHeight: 100,
  } as ViewStyle,

  scoreRow: {
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  } as ViewStyle,

  scoreDisplayWrapper: {
    flex: 1,
    alignItems: 'center' as const,
    minHeight: 60,
    justifyContent: 'center' as const,
    maxWidth: '50%',
    // shadowColor: '#000',
    // shadowOffset: { width: 2, height: 12 },
    // shadowOpacity: 0.25,
    // shadowRadius: 10,
    // elevation: 10,
  } as ViewStyle,

  // FIXED: Question card with proper dimensions
  questionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius['3xl'],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: Spacing[6],
    minHeight: 400, // Ensure minimum height
  } as ViewStyle,

  // FIXED: Question content with proper padding
  questionContent: {
    padding: Spacing[6],
    minHeight: 350,
    justifyContent: 'center' as const,
    fontFamily: 'SecondaryFont-Regular',
  } as ViewStyle,

  questionText: {
    fontSize: 16,
    // fontWeight: 'bold' as const,
    color: Colors.white,
    textAlign: 'left' as const,
    marginBottom: Spacing[6],
    fontFamily: 'SecondaryFont-Regular',
    lineHeight: 28,
    minHeight: 60, // Ensure text container height
  } as TextStyle,

  // FIXED: Options container with proper spacing
  optionsContainer: {
    gap: Spacing[3],
    minHeight: 240, // Ensure all options are visible
  } as ViewStyle,

  // FIXED: Option button with guaranteed visibility and touch area
  optionButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    minHeight: 60, // Guaranteed minimum touch area
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  } as ViewStyle,

  selectedOption: {
    backgroundColor: Colors.vibrant?.purple || '#8b5cf6',
    borderColor: Colors.white,
    borderWidth: 3,
    fontFamily: 'SecondaryFont-Bold',
  } as ViewStyle,

  disabledOption: {
    opacity: 0.6,
  } as ViewStyle,

  optionText: {
    fontSize: 16,
    color: Colors.white,
    fontFamily: 'SecondaryFont-Regular',
    fontWeight: '500' as const,
    textAlign: 'center' as const,
    lineHeight: 22,
  } as TextStyle,

  selectedOptionText: {
    fontFamily: 'SecondaryFont-Bold',
  } as TextStyle,

  // FIXED: Answer status container
  answerStatusContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius['3xl'],
    padding: Spacing[4],
    alignItems: 'center' as const,
    minHeight: 80,
    justifyContent: 'center' as const,
  } as ViewStyle,

  answerStatusBadge: {
    marginBottom: Spacing[2],
    // shadowColor: '#000',
    // shadowOffset: { width: 2, height: 12 },
    // shadowOpacity: 0.25,
    // shadowRadius: 10,
    // elevation: 10,
    fontFamily: 'SecondaryFont-Bold',
  } as ViewStyle,

  answerStatusText: {
    color: Colors.gray?.[300] || '#d1d5db',
    textAlign: 'center' as const,
    fontFamily: 'SecondaryFont-Regular',
  } as TextStyle,

  // FIXED: Results containers
  resultsContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    minHeight: height - 200,
  } as ViewStyle,

  resultsCard: {
    padding: Spacing[6],
    width: Math.floor(width * 0.95),
    maxWidth: 500,
    minHeight: 400,
    borderRadius: BorderRadius['3xl'],
  } as ViewStyle,

  roundResultContent: {
    width: '100%',
    minHeight: 300,
  } as ViewStyle,

  correctAnswerContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: BorderRadius['3xl'],
    padding: Spacing[3],
    marginBottom: Spacing[4],
    minHeight: 50,
    justifyContent: 'center' as const,
  } as ViewStyle,

  resultRowContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius['3xl'],
    padding: Spacing[4],
    marginVertical: Spacing[4],
    minHeight: 120,
  } as ViewStyle,

  resultRow: {
    justifyContent: 'space-around' as const,
    width: '100%',
  } as ViewStyle,

  playerResultContainer: {
    flex: 1,
    alignItems: 'center' as const,
    minHeight: 100,
    justifyContent: 'center' as const,
  } as ViewStyle,

  playerResult: {
    alignItems: 'center' as const,
    gap: Spacing[2],
  } as ViewStyle,

  resultBadge: {
    marginVertical: Spacing[1],
    // shadowColor: '#000',
    // shadowOffset: { width: 2, height: 12 },
    // shadowOpacity: 0.25,
    // shadowRadius: 10,
    // elevation: 10,
  } as ViewStyle,

  currentScoreContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius['3xl'],
    padding: Spacing[4],
    marginTop: Spacing[4],
    minHeight: 80,
    justifyContent: 'center' as const,
  } as ViewStyle,

  currentScore: {
    alignItems: 'center' as const,
    gap: Spacing[4],
    justifyContent: 'center' as const,
  } as ViewStyle,

  nextQuestionContainer: {
    marginTop: Spacing[4],
    minHeight: 40,
    justifyContent: 'center' as const,
  } as ViewStyle,

  // FIXED: Final screen containers
  finalContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    minHeight: height - 200,
  } as ViewStyle,

  finalCard: {
    padding: Spacing[6],
    width: Math.floor(width * 0.95),
    maxWidth: 500,
    minHeight: 600,
    borderRadius: BorderRadius['3xl'],
  } as ViewStyle,

  duelSummaryContainer: {
    width: '100%',
    marginBottom: Spacing[6],
    borderRadius: BorderRadius['3xl'],
  } as ViewStyle,

  duelSummary: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius['3xl'],
    padding: Spacing[4],
    minHeight: 120,
    justifyContent: 'center' as const,
  } as ViewStyle,

  resultCreatedContainer: {
    marginTop: Spacing[3],
    alignItems: 'center' as const,
  } as ViewStyle,

  resultCreatedBadge: {
    alignSelf: 'center' as const,
  } as ViewStyle,

  winnerSectionContainer: {
    width: '100%',
    marginBottom: Spacing[6],
  } as ViewStyle,

  winnerSection: {
    alignItems: 'center' as const,
    minHeight: 150,
    justifyContent: 'center' as const,
  } as ViewStyle,

  finalScoreContainer: {
    width: '100%',
    marginBottom: Spacing[6],
  } as ViewStyle,

  finalScore: {
    justifyContent: 'space-between' as const,
    width: '100%',
    minHeight: 100,
    alignItems: 'center' as const,
  } as ViewStyle,

  finalScoreWrapper: {
    flex: 1,
    alignItems: 'center' as const,
    minHeight: 80,
    justifyContent: 'center' as const,
    width: '50%', // Explicitly set to 50%
    maxWidth: '50%', // Prevent overflow
    paddingHorizontal: Spacing[2],
  } as ViewStyle,

  statsSectionContainer: {
    width: '100%',
    marginBottom: Spacing[6],
  } as ViewStyle,

  statsSection: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius['3xl'],
    padding: Spacing[4],
    minHeight: 80,
  } as ViewStyle,

  statsRow: {
    justifyContent: 'space-between' as const,
    marginBottom: Spacing[2],
  } as ViewStyle,

  additionalStatsRow: {
    justifyContent: 'space-between' as const,
    marginTop: Spacing[2],
  } as ViewStyle,

  actionButtonsContainer: {
    width: '100%',
    minHeight: 60,
  } as ViewStyle,

  actionButtons: {
    gap: Spacing[4],
    width: '100%',
    justifyContent: 'space-between' as const,
  } as ViewStyle,

  actionButton: {
    fontFamily: 'SecondaryFont-Bold',
    flex: 1,
    minHeight: 50,
  } as ViewStyle,

  // Bottom spacing for scroll
  bottomSpacing: {
    height: Spacing[8],
  } as ViewStyle,

  // Reused styles from original
  lobbyCard: {
    padding: Spacing[4],
    width: Math.floor(width * 0.9),
    maxWidth: 400,
  } as ViewStyle,

  questionCounter: {
    fontSize: 16,

    color: Colors.white,
    fontFamily: 'SecondaryFont-Bold',
  } as TextStyle,

  timer: {
    fontSize: 24,

    color: Colors.white,
    fontFamily: 'PrimaryFont',
  } as TextStyle,

  timerDanger: {
    color: Colors.vibrant?.pink,
  } as TextStyle,

  // ✅ NEW: Timer styling for server sync
  timerUnsynced: {
    opacity: 0.7,
    fontStyle: 'italic' as const,
  } as TextStyle,

  questionTimeLimit: {
    fontSize: 10,
    color: Colors.gray?.[400] || '#9ca3af',
    fontFamily: 'SecondaryFont-Regular',
    marginTop: 2,
  } as TextStyle,

  opponentStatus: {
    fontSize: 12,
    color: Colors.gray?.[200] || '#d1d5db',
    fontFamily: 'SecondaryFont-Regular',
  } as TextStyle,

  vsText: {
    fontSize: 24,
    color: Colors.white,
    marginHorizontal: Spacing[4],
    fontFamily: 'PrimaryFont',
  } as TextStyle,

  whiteText: {
    color: Colors.white,
    fontFamily: 'SecondaryFont-Bold',
  } as TextStyle,

  lightText: {
    color: Colors.gray?.[300] || '#d1d5db',
    textAlign: 'center' as const,
    fontFamily: 'SecondaryFont-Regular',
  } as TextStyle,

  countdownText: {
    fontSize: 120,
    color: Colors.white,
    fontFamily: 'PrimaryFont',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  } as TextStyle,

  correctAnswer: {
    fontSize: 16,
    color: Colors.vibrant?.mint || '#10b981',
    textAlign: 'center' as const,
    fontFamily: 'SecondaryFont-Bold',
  } as TextStyle,

  playerName: {
    fontSize: 14,
    color: Colors.white,

    fontFamily: 'SecondaryFont-Bold',
  } as TextStyle,

  timeText: {
    fontSize: 12,
    color: Colors.gray?.[300] || '#d1d5db',
    fontFamily: 'SecondaryFont-Regular',
  } as TextStyle,

  scoreVs: {
    fontSize: 24,
    color: Colors.white,
    fontFamily: 'PrimaryFont',
  } as TextStyle,

  scoreLabel: {
    fontSize: 12,
    color: Colors.gray?.[300] || '#d1d5db',
    fontFamily: 'SecondaryFont-Regular',
    marginTop: 4,
  } as TextStyle,

  duelInfoCourse: {
    fontSize: 14,
    color: Colors.white,
    textAlign: 'center' as const,
    fontFamily: 'SecondaryFont-Bold',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  } as TextStyle,

  duelInfoTest: {
    fontSize: 12,
    color: Colors.gray?.[200] || '#e5e5e5',
    textAlign: 'center' as const,
    fontFamily: 'SecondaryFont-Regular',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  } as TextStyle,

  duelInfoBot: {
    fontSize: 12,
    textAlign: 'center' as const,
    fontFamily: 'SecondaryFont-Bold',
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  } as TextStyle,

  duelInfoLoading: {
    fontSize: 12,
    color: Colors.gray?.[200] || '#e5e5e5',
    textAlign: 'center' as const,
    fontFamily: 'SecondaryFont-Regular',
    marginLeft: Spacing[2],
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  } as TextStyle,

  botInfoCard: {
    padding: Spacing[3],
    marginTop: Spacing[4],
    alignSelf: 'stretch',
  } as ViewStyle,

  botInfoTitle: {
    fontSize: 14,
    color: Colors.white,
    textAlign: 'center' as const,
    marginBottom: Spacing[2],
    fontFamily: 'SecondaryFont-Bold',
  } as TextStyle,

  botInfoText: {
    fontSize: 12,
    color: Colors.gray?.[300] || '#d1d5db',
    textAlign: 'center' as const,
    fontFamily: 'SecondaryFont-Regular',
    marginBottom: 2,
  } as TextStyle,

  botVictoryText: {
    fontSize: 16,
    color: Colors.vibrant?.mint || '#10b981',
    textAlign: 'center' as const,
    fontFamily: 'SecondaryFont-Bold',
    marginTop: Spacing[2],
  } as TextStyle,

  botDefeatText: {
    fontSize: 16,
    color: Colors.vibrant?.coral || '#f87171',
    textAlign: 'center' as const,
    fontFamily: 'SecondaryFont-Bold',
    marginTop: Spacing[2],
  } as TextStyle,

  duelSummaryTitle: {
    fontSize: 16,
    color: Colors.white,
    textAlign: 'center' as const,
    marginBottom: Spacing[2],
    fontFamily: 'SecondaryFont-Bold',
  } as TextStyle,

  duelSummaryText: {
    fontSize: 12,
    color: Colors.gray?.[300] || '#d1d5db',
    textAlign: 'center' as const,
    fontFamily: 'SecondaryFont-Regular',
    marginBottom: 2,
  } as TextStyle,

  winnerEmoji: {
    fontSize: 64,
    marginBottom: Spacing[2],
  } as TextStyle,

  winnerText: {
    color: Colors.vibrant?.mint || '#10b981',
    fontFamily: 'SecondaryFont-Bold',
  } as TextStyle,

  loserText: {
    color: Colors.vibrant?.coral || '#f87171',
  } as TextStyle,

  drawText: {
    color: Colors.vibrant?.yellow || '#fbbf24',
  } as TextStyle,

  statText: {
    fontSize: 14,
    color: Colors.gray?.[300] || '#d1d5db',
    fontFamily: 'SecondaryFont-Regular',
  } as TextStyle,

  logoVideo: {
    width: 247,
    height: 247,
    borderRadius: 20,
  },

  reportQuestionContainer: {
    backgroundColor: 'rgba(255, 183, 3, 0.1)', // Subtle yellow background
    borderRadius: BorderRadius['3xl'],
    padding: Spacing[4],
    marginVertical: Spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(255, 183, 3, 0.3)',
    alignItems: 'center' as const,
  } as ViewStyle,

  reportQuestionTitle: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: Colors.vibrant?.yellow || '#fbbf24',
    textAlign: 'center' as const,
    marginBottom: Spacing[2],
    fontFamily: 'SecondaryFont-Bold',
  } as TextStyle,

  reportQuestionDescription: {
    fontSize: 12,
    color: Colors.gray?.[300] || '#d1d5db',
    textAlign: 'center' as const,
    marginBottom: Spacing[3],
    fontFamily: 'SecondaryFont-Regular',
    lineHeight: 16,
  } as TextStyle,

  reportButton: {
    backgroundColor: Colors.vibrant?.coral || '#f87171',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.lg,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    // shadowColor: '#000',
    // shadowOffset: { width: 2, height: 4 },
    // shadowOpacity: 0.25,
    // shadowRadius: 8,
    // elevation: 8,
  } as ViewStyle,

  reportButtonText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600' as const,
    fontFamily: 'SecondaryFont-Bold',
  } as TextStyle,
  correctOption: {
    backgroundColor: Colors.vibrant.mint || '#10b981',
    borderColor: '#059669',
    borderWidth: 3,
  } as ViewStyle,

  correctOptionText: {
    color: Colors.white,
    fontFamily: 'SecondaryFont-Bold',
    fontWeight: '700' as const,
  } as TextStyle,

  // Wrong selected answer highlighting (red)
  wrongSelectedOption: {
    backgroundColor: Colors.vibrant.coral || '#f87171',
    borderColor: '#dc2626',
    borderWidth: 3,
  } as ViewStyle,

  wrongSelectedOptionText: {
    color: Colors.white,
    fontFamily: 'SecondaryFont-Bold',
    fontWeight: '700' as const,
  } as TextStyle,

  questionResultsContainer: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius['3xl'],
    padding: Spacing[4],
    marginBottom: Spacing[4],
  } as ViewStyle,

  questionResultsText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: Colors.white,
    textAlign: 'left' as const,
    marginBottom: Spacing[4],
    fontFamily: 'SecondaryFont-Bold',
    lineHeight: 24,
  } as TextStyle,

  // Results options container
  resultsOptionsContainer: {
    gap: Spacing[2],
    width: '100%',
    marginBottom: Spacing[3],
  } as ViewStyle,

  // Result option buttons
  resultOptionButton: {
    borderRadius: BorderRadius.lg,
    padding: Spacing[3],
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.1)',
  } as ViewStyle,

  correctResultOption: {
    backgroundColor: 'rgba(16, 185, 129, 0.3)', // Green tint
    borderColor: Colors.vibrant.mint || '#10b981',
    borderWidth: 3,
  } as ViewStyle,

  wrongResultOption: {
    backgroundColor: 'rgba(248, 113, 113, 0.3)', // Red tint
    borderColor: Colors.vibrant.coral || '#f87171',
    borderWidth: 3,
  } as ViewStyle,

  // Result option text
  resultOptionText: {
    fontSize: 14,
    color: Colors.white,
    fontFamily: 'SecondaryFont-Regular',
    textAlign: 'left' as const,
    lineHeight: 20,
  } as TextStyle,

  correctResultOptionText: {
    color: Colors.white,
    fontFamily: 'SecondaryFont-Bold',
    fontWeight: '700' as const,
  } as TextStyle,

  wrongResultOptionText: {
    color: Colors.white,
    fontFamily: 'SecondaryFont-Bold',
    fontWeight: '700' as const,
  } as TextStyle,

  // Explanation container (already exists but adding for completeness)
  explanationContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)', // Blue tint
    borderRadius: BorderRadius['3xl'],
    padding: Spacing[4],
    marginTop: Spacing[3],
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    width: '100%',
  } as ViewStyle,

  explanationTitle: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: Colors.vibrant.blue || '#3b82f6',
    textAlign: 'center' as const,
    marginBottom: Spacing[3],
    fontFamily: 'SecondaryFont-Bold',
  } as TextStyle,

  explanationText: {
    fontSize: 14,
    color: Colors.white,
    textAlign: 'left' as const,
    lineHeight: 22,
    fontFamily: 'SecondaryFont-Regular',
  } as TextStyle,

  // Selected answer display in results
  selectedAnswerText: {
    fontSize: 11,
    color: Colors.gray?.[400] || '#9ca3af',
    fontFamily: 'SecondaryFont-Regular',
    marginTop: 4,
    textAlign: 'center' as const,
  } as TextStyle,
};
