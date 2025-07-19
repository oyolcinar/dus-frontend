// app/(tabs)/duels/[id].tsx - Enhanced with analytics and results integration

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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// FIXED: Import socket functions from socketService instead of socket.io-client directly
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
} from '../../../src/api/socketService';

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

const { width, height } = Dimensions.get('window');

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
  const [timeLeft, setTimeLeft] = useState(30);
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

  // New state for analytics and results tracking
  const [answeredQuestions, setAnsweredQuestions] = useState<
    AnsweredQuestion[]
  >([]);
  const [duelStartTime, setDuelStartTime] = useState<number | null>(null);
  const [duelEndTime, setDuelEndTime] = useState<number | null>(null);
  const [isCreatingDuelResult, setIsCreatingDuelResult] = useState(false);
  const [duelResultCreated, setDuelResultCreated] = useState(false);

  // Refs
  const timerRef = useRef<number | null>(null);
  const answerStartTime = useRef<number>(0);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Load duel information and check for bots
  useEffect(() => {
    const loadDuelInfo = async () => {
      try {
        setIsLoadingDuelInfo(true);

        const duelDetails = await duelService.getDuelDetails(duelId);

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

          // If missing data, fetch separately
          if (duelDetails.duel.test_id && !duelInfoData.test_name) {
            const test = await testService.getTestById(
              duelDetails.duel.test_id,
            );
            if (test) {
              duelInfoData.test_name = test.title;
              if (!duelInfoData.course_name && test.course_id) {
                const course = await courseService.getCourseById(
                  test.course_id,
                );
                if (course) {
                  duelInfoData.course_name = course.title;
                }
              }
            }
          }

          setDuelInfo(duelInfoData);

          // Check if opponent is a bot
          const currentUserId = userData?.userId;
          const opponentId =
            duelInfoData.initiator_id === currentUserId
              ? duelInfoData.opponent_id
              : duelInfoData.initiator_id;

          if (opponentId) {
            const isOpponentBot = await botService.isBot(opponentId);

            if (isOpponentBot) {
              const botInfo = await botService.getBotInfo(opponentId);
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
      } finally {
        setIsLoadingDuelInfo(false);
      }
    };

    if (duelId && userData) {
      loadDuelInfo();
    }
  }, [duelId, userData]);

  // FIXED: Initialize socket connection using socketService
  useEffect(() => {
    initializeConnection();
    return () => {
      disconnect();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
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

  // FIXED: Setup event listeners using socketService
  const setupEventListeners = () => {
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
    on('question_presented', handleQuestionPresented);
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

    // Auto-ready for user
    setTimeout(() => {
      if (isConnected()) {
        signalReady();
      }
    }, 1000);
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

  const handleQuestionPresented = (data: {
    questionIndex: number;
    totalQuestions: number;
    question: Question;
    timeLimit: number;
  }) => {
    setPhase('question');
    setCurrentQuestion(data.question);
    setQuestionIndex(data.questionIndex);
    setTotalQuestions(data.totalQuestions);
    setTimeLeft(data.timeLimit / 1000);
    setSelectedAnswer(null);
    setHasAnswered(false);
    setOpponentAnswered(false);
    answerStartTime.current = Date.now();

    // Start countdown timer
    startQuestionTimer(data.timeLimit / 1000);

    // Animate question appearance
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const startQuestionTimer = (duration: number) => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          if (!hasAnswered) {
            handleAutoSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // FIXED: Use socketService submitAnswer function
  const handleAnswerSelect = (answer: string) => {
    if (hasAnswered || phase !== 'question') return;

    setSelectedAnswer(answer);
    setHasAnswered(true);

    const timeTaken = Date.now() - answerStartTime.current;

    if (isConnected() && currentQuestion) {
      submitAnswer(currentQuestion.id, answer, timeTaken);
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  // FIXED: Use socketService submitAnswer function
  const handleAutoSubmit = () => {
    if (!hasAnswered && isConnected() && currentQuestion) {
      submitAnswer(currentQuestion.id, null, 30000);
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
    setPhase('results');
    setRoundResult(data);

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

    // Create duel result record
    await createDuelResultRecord(data);
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
            disconnect();
            router.back();
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

      const duelResult = await duelResultService.createDuelResult(
        createDuelResultData,
      );
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
      accuracy: (bot.accuracyRate * 100).toFixed(0),
      avgTime: (bot.avgResponseTime / 1000).toFixed(0),
      color: getDifficultyColor(bot.difficultyLevel),
    };
  };

  const renderDuelInfoHeader = () => {
    if (isLoadingDuelInfo) {
      return (
        <View style={styles.duelInfoHeader}>
          <ActivityIndicator size='small' color={Colors.white} />
          <Text style={styles.duelInfoLoading}>
            Düello bilgileri yükleniyor...
          </Text>
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
    <Container style={styles.centerContainer}>
      {renderDuelInfoHeader()}
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Avatar
          size='xl'
          name='🔥'
          bgColor={Colors.vibrant.orange}
          style={{ marginBottom: Spacing[4] }}
        />
      </Animated.View>
      <PlayfulTitle level={2} style={styles.whiteText}>
        Düelloya Bağlanıyor...
      </PlayfulTitle>
      <ActivityIndicator
        size='large'
        color={Colors.white}
        style={{ marginTop: Spacing[4] }}
      />
    </Container>
  );

  const renderLobby = () => {
    const botInfo = getBotDisplayInfo();

    return (
      <Container style={styles.centerContainer}>
        {renderDuelInfoHeader()}
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
              <Badge text='Hazır ✓' variant='success' />
              <Badge
                text={opponentInfo?.isBot ? 'Bot Hazır ✓' : 'Bekliyor...'}
                variant={opponentInfo?.isBot ? 'success' : 'warning'}
              />
            </Row>
          </Column>
        </PlayfulCard>
      </Container>
    );
  };

  const renderCountdown = () => (
    <Container style={styles.centerContainer}>
      {renderDuelInfoHeader()}
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Text style={styles.countdownText}>{countdown}</Text>
      </Animated.View>
      <PlayfulTitle level={2} style={styles.whiteText}>
        Hazır Olun!
      </PlayfulTitle>
    </Container>
  );

  const renderQuestion = () => {
    const botInfo = getBotDisplayInfo();

    return (
      <Container style={styles.questionContainer}>
        {/* Duel Info Header */}
        {renderDuelInfoHeader()}

        {/* Header */}
        <Row style={styles.questionHeader}>
          <Column>
            <Text style={styles.questionCounter}>
              Soru {questionIndex + 1} / {totalQuestions}
            </Text>
            <ProgressBar
              progress={(questionIndex + 1) / totalQuestions}
              progressColor={Colors.vibrant.mint}
              style={{ width: 120 }}
            />
          </Column>
          <Column style={{ alignItems: 'flex-end' as const }}>
            <Text style={[styles.timer, timeLeft <= 10 && styles.timerDanger]}>
              {timeLeft}s
            </Text>
            <Text style={styles.opponentStatus}>
              {opponentAnswered
                ? `${opponentInfo?.isBot ? 'Bot' : 'Rakip'}: Tamamladı ✓`
                : `${opponentInfo?.isBot ? 'Bot' : 'Rakip'}: ${
                    opponentInfo?.isBot ? 'Hesaplıyor...' : 'Düşünüyor...'
                  }`}
            </Text>
          </Column>
        </Row>

        {/* Score Display */}
        <Row style={styles.scoreRow}>
          <ScoreDisplay
            score={userScore}
            maxScore={totalQuestions}
            label='Siz'
            variant='gradient'
            size='small'
          />
          <ScoreDisplay
            score={opponentScore}
            maxScore={totalQuestions}
            label={opponentInfo?.username || 'Rakip'}
            variant='gradient'
            size='small'
          />
        </Row>

        {/* Question */}
        <Animated.View
          style={[
            styles.questionCard,
            {
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <GlassCard style={styles.questionContent}>
            <Text style={styles.questionText}>{currentQuestion?.text}</Text>

            <View style={styles.optionsContainer}>
              {currentQuestion?.options &&
                Object.entries(currentQuestion.options).map(([key, value]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.optionButton,
                      selectedAnswer === key && styles.selectedOption,
                      hasAnswered && styles.disabledOption,
                    ]}
                    onPress={() => handleAnswerSelect(key)}
                    disabled={hasAnswered}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selectedAnswer === key && styles.selectedOptionText,
                      ]}
                    >
                      {key}) {value}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>
          </GlassCard>
        </Animated.View>

        {/* Answer Status */}
        {hasAnswered && (
          <View style={styles.answerStatus}>
            <Badge text='Cevap Gönderildi ✓' variant='success' size='md' />
            <Paragraph style={styles.lightText}>
              {opponentInfo?.isBot
                ? 'Bot hesaplıyor...'
                : 'Rakip bekleniyor...'}
            </Paragraph>
          </View>
        )}
      </Container>
    );
  };

  const renderResults = () => (
    <Container style={styles.centerContainer}>
      <PlayfulCard variant='glass' style={styles.resultsCard}>
        <Column style={{ alignItems: 'center' as const }}>
          <PlayfulTitle level={2} style={styles.whiteText}>
            {questionIndex + 1}. Tur Sonuçları
          </PlayfulTitle>

          {roundResult && (
            <>
              <Text style={styles.correctAnswer}>
                Doğru Cevap: {roundResult.question.correctAnswer}){' '}
                {
                  roundResult.question.options[
                    roundResult.question.correctAnswer
                  ]
                }
              </Text>

              <Row style={styles.resultRow}>
                {roundResult.answers.map((answer, idx) => {
                  const isUser = answer.userId === userData?.userId;
                  const displayName = isUser
                    ? 'Siz'
                    : opponentInfo?.username || 'Rakip';

                  return (
                    <Column key={idx} style={styles.playerResult}>
                      <Text style={styles.playerName}>
                        {displayName}
                        {!isUser && opponentInfo?.isBot && ' 🤖'}
                      </Text>
                      <Badge
                        text={answer.isCorrect ? 'Doğru ✓' : 'Yanlış ✗'}
                        variant={answer.isCorrect ? 'success' : 'error'}
                      />
                      <Text style={styles.timeText}>
                        {(answer.timeTaken / 1000).toFixed(1)}s
                      </Text>
                    </Column>
                  );
                })}
              </Row>

              <Row style={styles.currentScore}>
                <Column style={{ alignItems: 'center' as const }}>
                  <AnimatedCounter
                    value={userScore}
                    style={{ color: Colors.vibrant.mint }}
                  />
                  <Text style={styles.scoreLabel}>Puanınız</Text>
                </Column>
                <Text style={styles.scoreVs}>-</Text>
                <Column style={{ alignItems: 'center' as const }}>
                  <AnimatedCounter
                    value={opponentScore}
                    style={{ color: Colors.vibrant.coral }}
                  />
                  <Text style={styles.scoreLabel}>
                    {opponentInfo?.isBot ? 'Bot' : 'Rakip'}
                  </Text>
                </Column>
              </Row>
            </>
          )}

          <Paragraph style={styles.lightText}>
            Sonraki soru 3 saniye içinde...
          </Paragraph>
        </Column>
      </PlayfulCard>
    </Container>
  );

  const renderFinal = () => {
    const botInfo = getBotDisplayInfo();

    return (
      <Container style={styles.centerContainer}>
        <PlayfulCard variant='glass' style={styles.finalCard}>
          <Column style={{ alignItems: 'center' as const }}>
            {/* Duel Summary */}
            {duelInfo && (
              <View style={styles.duelSummary}>
                <Text style={styles.duelSummaryTitle}>Düello Özeti</Text>
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
                    style={[styles.duelSummaryText, { color: botInfo.color }]}
                  >
                    🎯 Zorluk Seviye {botInfo.difficulty} • {botInfo.accuracy}%
                    Doğruluk
                  </Text>
                )}
                {/* Show answered questions count */}
                <Text style={styles.duelSummaryText}>
                  📊 {answeredQuestions.length} soru yanıtlandı
                </Text>
                {duelResultCreated && (
                  <Badge
                    text='Sonuçlar Kaydedildi ✓'
                    variant='success'
                    style={{ marginTop: Spacing[2] }}
                  />
                )}
              </View>
            )}

            {finalResults && (
              <>
                {/* Winner Display */}
                <View style={styles.winnerSection}>
                  {finalResults.winnerId === userData?.userId ? (
                    <>
                      <Text style={styles.winnerEmoji}>🏆</Text>
                      <PlayfulTitle
                        level={1}
                        gradient='primary'
                        style={styles.winnerText}
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

                {/* Final Score */}
                <Row style={styles.finalScore}>
                  <ScoreDisplay
                    score={
                      finalResults.user1.userId === userData?.userId
                        ? finalResults.user1.score
                        : finalResults.user2.score
                    }
                    maxScore={totalQuestions}
                    label='Siz'
                    variant='gradient'
                    size='large'
                  />
                  <ScoreDisplay
                    score={
                      finalResults.user1.userId === userData?.userId
                        ? finalResults.user2.score
                        : finalResults.user1.score
                    }
                    maxScore={totalQuestions}
                    label={opponentInfo?.username || 'Rakip'}
                    variant='gradient'
                    size='large'
                  />
                </Row>

                {/* Enhanced Stats */}
                <View style={styles.statsSection}>
                  <Row>
                    <Text style={styles.statText}>
                      Doğruluk:{' '}
                      {(finalResults.user1.userId === userData?.userId
                        ? finalResults.user1.accuracy
                        : finalResults.user2.accuracy * 100
                      ).toFixed(0)}
                      %
                    </Text>
                    <Text style={styles.statText}>
                      Ort. Süre:{' '}
                      {(finalResults.user1.userId === userData?.userId
                        ? finalResults.user1.totalTime
                        : finalResults.user2.totalTime / 1000 / totalQuestions
                      ).toFixed(1)}
                      s
                    </Text>
                  </Row>

                  {/* Additional stats from answered questions */}
                  {answeredQuestions.length > 0 && (
                    <Row style={{ marginTop: Spacing[2] }}>
                      <Text style={styles.statText}>
                        Doğru:{' '}
                        {answeredQuestions.filter((q) => q.isCorrect).length}
                      </Text>
                      <Text style={styles.statText}>
                        Yanlış:{' '}
                        {answeredQuestions.filter((q) => !q.isCorrect).length}
                      </Text>
                    </Row>
                  )}
                </View>

                {/* Action Buttons */}
                <Row style={styles.actionButtons}>
                  <Button
                    title='Yeni Düello'
                    variant='primary'
                    onPress={() => router.push('/(tabs)/duels/new')}
                    style={{ flex: 1, marginRight: Spacing[2] }}
                  />
                  <Button
                    title='Çık'
                    variant='outline'
                    onPress={() => router.back()}
                    style={{ flex: 1, marginLeft: Spacing[2] }}
                  />
                </Row>
              </>
            )}
          </Column>
        </PlayfulCard>
      </Container>
    );
  };

  const renderError = () => (
    <Container style={styles.centerContainer}>
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
          initializeConnection();
        }}
      />
    </Container>
  );

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

const styles = {
  centerContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: Spacing[4],
  } as ViewStyle,
  questionContainer: {
    flex: 1,
    padding: Spacing[4],
  } as ViewStyle,
  duelInfoHeader: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    marginBottom: Spacing[4],
    alignSelf: 'stretch',
  } as ViewStyle,
  duelInfoCourse: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: Colors.white,
    textAlign: 'center' as const,
    fontFamily: 'SecondaryFont-Bold',
    marginBottom: 4,
  } as TextStyle,
  duelInfoTest: {
    fontSize: 12,
    color: Colors.gray[300],
    textAlign: 'center' as const,
    fontFamily: 'SecondaryFont-Regular',
  } as TextStyle,
  duelInfoBot: {
    fontSize: 12,
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
    fontFamily: 'SecondaryFont-Bold',
    marginTop: 4,
  } as TextStyle,
  duelInfoLoading: {
    fontSize: 12,
    color: Colors.gray[300],
    textAlign: 'center' as const,
    fontFamily: 'SecondaryFont-Regular',
    marginLeft: Spacing[2],
  } as TextStyle,
  botInfoCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    marginTop: Spacing[4],
    alignSelf: 'stretch',
  } as ViewStyle,
  botInfoTitle: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: Colors.white,
    textAlign: 'center' as const,
    marginBottom: Spacing[2],
    fontFamily: 'SecondaryFont-Bold',
  } as TextStyle,
  botInfoText: {
    fontSize: 12,
    color: Colors.gray[300],
    textAlign: 'center' as const,
    fontFamily: 'SecondaryFont-Regular',
    marginBottom: 2,
  } as TextStyle,
  botVictoryText: {
    fontSize: 16,
    color: Colors.vibrant.mint,
    textAlign: 'center' as const,
    fontFamily: 'SecondaryFont-Bold',
    marginTop: Spacing[2],
  } as TextStyle,
  botDefeatText: {
    fontSize: 16,
    color: Colors.vibrant.coral,
    textAlign: 'center' as const,
    fontFamily: 'SecondaryFont-Bold',
    marginTop: Spacing[2],
  } as TextStyle,
  duelSummary: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing[4],
    marginBottom: Spacing[6],
    alignSelf: 'stretch',
  } as ViewStyle,
  duelSummaryTitle: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: Colors.white,
    textAlign: 'center' as const,
    marginBottom: Spacing[2],
    fontFamily: 'SecondaryFont-Bold',
  } as TextStyle,
  duelSummaryText: {
    fontSize: 12,
    color: Colors.gray[300],
    textAlign: 'center' as const,
    fontFamily: 'SecondaryFont-Regular',
    marginBottom: 2,
  } as TextStyle,
  questionHeader: {
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: Spacing[4],
  } as ViewStyle,
  questionCounter: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: Colors.white,
    fontFamily: 'SecondaryFont-Bold',
  } as TextStyle,
  timer: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: Colors.white,
    fontFamily: 'PrimaryFont',
  } as TextStyle,
  timerDanger: {
    color: Colors.vibrant.coral,
  } as TextStyle,
  opponentStatus: {
    fontSize: 12,
    color: Colors.gray[300],
    fontFamily: 'SecondaryFont-Regular',
  } as TextStyle,
  scoreRow: {
    justifyContent: 'space-between' as const,
    marginBottom: Spacing[6],
  } as ViewStyle,
  questionCard: {
    flex: 1,
    justifyContent: 'center' as const,
  } as ViewStyle,
  questionContent: {
    padding: Spacing[6],
  } as ViewStyle,
  questionText: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: Colors.white,
    textAlign: 'center' as const,
    marginBottom: Spacing[6],
    fontFamily: 'PrimaryFont',
    lineHeight: 28,
  } as TextStyle,
  optionsContainer: {
    gap: Spacing[3],
  } as ViewStyle,
  optionButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
    borderWidth: 2,
    borderColor: 'transparent',
  } as ViewStyle,
  selectedOption: {
    backgroundColor: Colors.vibrant.purple,
    borderColor: Colors.white,
  } as ViewStyle,
  disabledOption: {
    opacity: 0.6,
  } as ViewStyle,
  optionText: {
    fontSize: 16,
    color: Colors.white,
    fontFamily: 'SecondaryFont-Regular',
  } as TextStyle,
  selectedOptionText: {
    fontWeight: 'bold' as const,
    fontFamily: 'SecondaryFont-Bold',
  } as TextStyle,
  answerStatus: {
    alignItems: 'center' as const,
    marginTop: Spacing[4],
  } as ViewStyle,
  lobbyCard: {
    padding: Spacing[6],
    width: width * 0.9,
  } as ViewStyle,
  resultsCard: {
    padding: Spacing[6],
    width: width * 0.9,
  } as ViewStyle,
  finalCard: {
    padding: Spacing[6],
    width: width * 0.9,
  } as ViewStyle,
  vsText: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: Colors.white,
    marginHorizontal: Spacing[4],
    fontFamily: 'PrimaryFont',
  } as TextStyle,
  whiteText: {
    color: Colors.white,
  } as TextStyle,
  lightText: {
    color: Colors.gray[300],
    textAlign: 'center' as const,
    fontFamily: 'SecondaryFont-Regular',
  } as TextStyle,
  countdownText: {
    fontSize: 120,
    fontWeight: 'bold' as const,
    color: Colors.white,
    fontFamily: 'PrimaryFont',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  } as TextStyle,
  correctAnswer: {
    fontSize: 16,
    color: Colors.vibrant.mint,
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
    marginBottom: Spacing[4],
    fontFamily: 'SecondaryFont-Bold',
  } as TextStyle,
  resultRow: {
    justifyContent: 'space-around' as const,
    width: '100%',
    marginVertical: Spacing[4],
  } as ViewStyle,
  playerResult: {
    alignItems: 'center' as const,
    gap: Spacing[2],
  } as ViewStyle,
  playerName: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: 'bold' as const,
    fontFamily: 'SecondaryFont-Bold',
  } as TextStyle,
  timeText: {
    fontSize: 12,
    color: Colors.gray[300],
    fontFamily: 'SecondaryFont-Regular',
  } as TextStyle,
  currentScore: {
    alignItems: 'center' as const,
    gap: Spacing[4],
    marginTop: Spacing[4],
  } as ViewStyle,
  scoreVs: {
    fontSize: 24,
    color: Colors.white,
    fontWeight: 'bold' as const,
    fontFamily: 'PrimaryFont',
  } as TextStyle,
  scoreLabel: {
    fontSize: 12,
    color: Colors.gray[300],
    fontFamily: 'SecondaryFont-Regular',
    marginTop: 4,
  } as TextStyle,
  winnerSection: {
    alignItems: 'center' as const,
    marginBottom: Spacing[6],
  } as ViewStyle,
  winnerEmoji: {
    fontSize: 64,
    marginBottom: Spacing[2],
  } as TextStyle,
  winnerText: {
    color: Colors.vibrant.mint,
  } as TextStyle,
  loserText: {
    color: Colors.vibrant.coral,
  } as TextStyle,
  drawText: {
    color: Colors.vibrant.yellow,
  } as TextStyle,
  finalScore: {
    justifyContent: 'space-around' as const,
    width: '100%',
    marginBottom: Spacing[6],
  } as ViewStyle,
  statsSection: {
    width: '100%',
    marginBottom: Spacing[6],
  } as ViewStyle,
  statText: {
    fontSize: 14,
    color: Colors.gray[300],
    fontFamily: 'SecondaryFont-Regular',
  } as TextStyle,
  actionButtons: {
    gap: Spacing[4],
    width: '100%',
  } as ViewStyle,
};
