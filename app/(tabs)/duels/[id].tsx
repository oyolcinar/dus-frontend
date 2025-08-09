// app/(tabs)/duels/[id].tsx - FULLY UPDATED WITH NEW ARCHITECTURE

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
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

// 🚀 NEW: Import from new hooks and store
import {
  useDuelRoomManagement,
  useEnhancedDuelDetails,
  useDuelTimer,
  duelHelpers,
} from '../../../src/hooks/useDuelsData';
import { useAuth, usePreferredCourse } from '../../../stores/appStore';
import {
  analyticsService,
  userQuestionHistoryService,
  duelResultService,
} from '../../../src/api';
import { CreateDuelResultInput } from '../../../src/api/duelResultService';

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

// Development mode toggle
const __DEV_MODE__ = __DEV__ && false; // Set to false for production

// Mock data for development
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
      botId: 1,
      userId: 2,
      username: 'TestBot',
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
    correctAnswer: 'A',
    explanation:
      'useState hook, React Native bileşenlerinde local state yönetimi için kullanılır.',
  } as Question,
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
      explanation:
        'useState hook, React Native bileşenlerinde local state yönetimi için kullanılır.',
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

interface Question {
  id: number;
  text: string;
  options: Record<string, string>;
  correctAnswer?: string;
  explanation?: string;
}

interface MockQuestion {
  id: number;
  text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
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

// Helper function to safely access question options
const getOptionValue = (
  options: Record<string, string>,
  key: string,
): string => {
  return options[key] || 'N/A';
};

// State selector for dev mode
const getDevModeState = (): DuelPhase => {
  return 'connecting'; // Change this to test different phases
};

export default function DuelRoomScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const duelId = parseInt(id as string);

  // 🚀 NEW: Use the new store hooks
  const { user, isAuthenticated } = useAuth();
  const { preferredCourse, getCourseColor } = usePreferredCourse();

  // 🚀 NEW: Use the comprehensive duel room management hook
  const {
    // Connection state
    isConnected,
    connectionError,
    // Room state
    roomState,
    roomError,
    // Duel details
    duelInfo,
    opponentInfo,
    botInfo,
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
    isLoading,
    hasError,
  } = useDuelRoomManagement(duelId);

  // 🚀 NEW: Use the enhanced duel timer
  const {
    timeLeft: timerTimeLeft,
    isActive: timerActive,
    serverSynced,
  } = useDuelTimer(60);

  // Local UI state - only what's needed for UI that's not handled by hooks
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [finalResults, setFinalResults] = useState<FinalResults | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<
    AnsweredQuestion[]
  >([]);
  const [duelStartTime, setDuelStartTime] = useState<number | null>(null);
  const [duelEndTime, setDuelEndTime] = useState<number | null>(null);
  const [isCreatingDuelResult, setIsCreatingDuelResult] = useState(false);
  const [duelResultCreated, setDuelResultCreated] = useState(false);
  const [phase, setPhase] = useState<DuelPhase>('connecting');

  // iOS-specific state
  const [isModalStable, setIsModalStable] = useState(false);

  // Refs
  const answerStartTime = useRef<number>(0);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const logoVideo = require('../../../assets/videos/okey.mp4');

  // Memoized context color
  const contextColor = useMemo(() => {
    return (
      ((preferredCourse as any)?.category &&
        getCourseColor((preferredCourse as any).category)) ||
      '#4285F4'
    );
  }, [preferredCourse, getCourseColor]);

  // 🚀 SIMPLIFIED: Map game phase from hook to local phase
  useEffect(() => {
    if (__DEV_MODE__) {
      setPhase(getDevModeState());
      return;
    }

    setPhase(gamePhase);
  }, [gamePhase]);

  // 🚀 SIMPLIFIED: Initialize connection with auth token
  useEffect(() => {
    if (__DEV_MODE__) {
      console.log('🟡 DEV MODE: Skipping connection initialization');
      return;
    }

    if (isAuthenticated && user && duelId) {
      initializeConnection();
    }

    return () => {
      cleanup();
    };
  }, [isAuthenticated, user, duelId, initializeConnection, cleanup]);

  // Handle dev mode setup
  useEffect(() => {
    if (__DEV_MODE__) {
      console.log('🟢 DEV MODE: Setting up mock data');
      const devPhase = getDevModeState();

      // Set mock data based on phase
      switch (devPhase) {
        case 'question':
          setRoundResult(null);
          setFinalResults(null);
          break;
        case 'results':
          setRoundResult(MOCK_DATA.roundResult);
          setFinalResults(null);
          break;
        case 'final':
          setFinalResults(MOCK_DATA.finalResults);
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
      }
    }
  }, []);

  // iOS modal stability
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

  // 🚀 SIMPLIFIED: Answer selection with new hook
  const handleAnswerSelect = useCallback(
    (answer: string) => {
      if (hasAnswered || phase !== 'question') return;

      setSelectedAnswer(answer);

      const timeTaken = Date.now() - answerStartTime.current;

      // Use the new hook's submit function
      submitAnswer(answer, timeTaken);
    },
    [hasAnswered, phase, submitAnswer],
  );

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
              cleanup();
            }
            router.replace('/(tabs)/duels/new');
          },
        },
      ],
    );
  };

  // Track question history
  const trackQuestionHistory = async (answeredQuestion: AnsweredQuestion) => {
    try {
      if (!user?.userId || !duelInfo?.test_id || !duelInfo?.course?.course_id) {
        console.warn('Missing required data for question history tracking');
        return;
      }

      console.log('Question answered in duel:', {
        userId: user.userId,
        questionId: answeredQuestion.questionId,
        testId: duelInfo.test_id,
        courseId: duelInfo.course?.course_id,
        isCorrect: answeredQuestion.isCorrect,
        timeTaken: answeredQuestion.timeTaken,
        duelId: duelId,
      });
    } catch (error) {
      console.error('Error tracking question history:', error);
    }
  };

  // Create duel result record
  const createDuelResultRecord = async (results: FinalResults) => {
    if (duelResultCreated || isCreatingDuelResult) {
      return;
    }

    try {
      setIsCreatingDuelResult(true);

      const createDuelResultData: CreateDuelResultInput = {
        duelId: duelId,
        winnerId: results.winnerId || undefined,
        initiatorScore:
          duelInfo?.initiator_id === user?.userId
            ? results.user1.userId === user?.userId
              ? results.user1.score
              : results.user2.score
            : results.user1.userId === user?.userId
              ? results.user2.score
              : results.user1.score,
        opponentScore:
          duelInfo?.initiator_id === user?.userId
            ? results.user1.userId === user?.userId
              ? results.user2.score
              : results.user1.score
            : results.user1.userId === user?.userId
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
    } finally {
      setIsCreatingDuelResult(false);
    }
  };

  // Track duel analytics
  const trackDuelAnalytics = async (results: FinalResults) => {
    try {
      const isWinner = results.winnerId === user?.userId;
      const isDraw = results.winnerId === null;
      const userStats =
        results.user1.userId === user?.userId ? results.user1 : results.user2;
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
        courseId: duelInfo?.course?.course_id,
        testId: duelInfo?.test_id,
      });
    } catch (error) {
      console.error('Error tracking duel analytics:', error);
    }
  };

  const getBotDisplayInfo = () => {
    if (!opponentInfo?.isBot || !botInfo?.botInfo) return null;

    return duelHelpers.getBotDisplayInfo(botInfo.botInfo);
  };

  const renderDuelInfoHeader = () => {
    if (isLoading && !__DEV_MODE__) {
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

    // Use mock data in dev mode or real data in production
    const displayDuelInfo = __DEV_MODE__ ? MOCK_DATA.duelInfo : duelInfo;
    const displayOpponentInfo = __DEV_MODE__
      ? MOCK_DATA.opponentInfo
      : opponentInfo;

    if (!displayDuelInfo) return null;

    const botInfo = getBotDisplayInfo();

    return (
      <View style={styles.duelInfoHeader}>
        <Row style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Column style={{ alignItems: 'center', flex: 1 }}>
            {displayDuelInfo.course_name && (
              <Text style={styles.duelInfoCourse}>
                📚 {displayDuelInfo.course_name}
              </Text>
            )}
            {displayDuelInfo.test_name && (
              <Text style={styles.duelInfoTest}>
                📝 {displayDuelInfo.test_name}
              </Text>
            )}
            {botInfo && (
              <Text style={[styles.duelInfoBot, { color: botInfo.color }]}>
                🤖 {botInfo.name} (Seviye {botInfo.difficulty})
              </Text>
            )}
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
    // Use appropriate data source
    const displayUser = __DEV_MODE__ ? MOCK_DATA.userData : user;
    const displayOpponent = __DEV_MODE__
      ? MOCK_DATA.opponentInfo
      : opponentInfo;

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
                  name={displayUser?.username?.charAt(0) || 'K'}
                  bgColor={Colors.vibrant.purple}
                  style={{}}
                />
                <Text style={styles.vsText}>KARŞI</Text>
                <Avatar
                  size='lg'
                  name={
                    botInfo
                      ? botInfo.avatar
                      : displayOpponent?.username?.charAt(0) || '?'
                  }
                  bgColor={botInfo ? botInfo.color : Colors.vibrant.orange}
                  style={{}}
                />
              </Row>

              <PlayfulTitle level={3} style={styles.whiteText}>
                Düello Lobisi
              </PlayfulTitle>

              <Paragraph style={styles.lightText}>
                {displayOpponent?.isBot
                  ? `${displayOpponent.username} ile düello başlıyor...`
                  : displayOpponent?.username
                    ? `${displayOpponent.username} ile düello başlıyor...`
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
                  text={displayOpponent?.isBot ? 'Bot Hazır ✓' : 'Bekliyor...'}
                  variant={displayOpponent?.isBot ? 'success' : 'warning'}
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

  const renderQuestion = () => {
    // Use appropriate data source
    const displayQuestion = __DEV_MODE__
      ? MOCK_DATA.currentQuestion
      : currentQuestion;
    const displayTimeLeft = __DEV_MODE__
      ? 45
      : serverSynced
        ? timerTimeLeft
        : timeLeft;
    const displayQuestionIndex = __DEV_MODE__ ? 0 : questionIndex;
    const displayTotalQuestions = __DEV_MODE__ ? 3 : totalQuestions;
    const displayUserScore = __DEV_MODE__ ? 1 : userScore;
    const displayOpponentScore = __DEV_MODE__ ? 1 : opponentScore;
    const displayOpponentAnswered = __DEV_MODE__ ? false : opponentAnswered;
    const displayHasAnswered = __DEV_MODE__ ? false : hasAnswered;
    const displayUser = __DEV_MODE__ ? MOCK_DATA.userData : user;
    const displayOpponent = __DEV_MODE__
      ? MOCK_DATA.opponentInfo
      : opponentInfo;

    if (!displayQuestion || !displayQuestion.options) {
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

    return (
      <View style={styles.mainContainer}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {renderDuelInfoHeader()}

          {/* Question Header with timer */}
          <View style={styles.questionHeaderContainer}>
            <Row style={styles.questionHeader}>
              <Column>
                <Text style={styles.questionCounter}>
                  Soru {displayQuestionIndex + 1} / {displayTotalQuestions}
                </Text>
                <ProgressBar
                  progress={Number(
                    (
                      ((displayQuestionIndex + 1) / displayTotalQuestions) *
                      100
                    ).toFixed(0),
                  )}
                  progressColor={Colors.vibrant.mint}
                  style={{ width: 120, marginTop: Spacing[1] }}
                />
              </Column>
              <Column style={{ alignItems: 'flex-end' as const }}>
                <Text
                  style={[
                    styles.timer,
                    displayTimeLeft <= 10 && styles.timerDanger,
                    !serverSynced && styles.timerUnsynced,
                  ]}
                >
                  {displayTimeLeft}s {serverSynced ? '🟢' : '🔄'}
                </Text>
                <Text style={styles.questionTimeLimit}>/ 60s total</Text>
                <Text style={styles.opponentStatus}>
                  {displayOpponentAnswered
                    ? `${displayOpponent?.isBot ? 'Bot' : 'Rakip'}: Tamamladı ✓`
                    : `${displayOpponent?.isBot ? 'Bot' : 'Rakip'}: ${
                        displayOpponent?.isBot
                          ? 'Hesaplıyor...'
                          : 'Düşünüyor...'
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
                  score={displayUserScore}
                  maxScore={displayTotalQuestions}
                  label={displayUser?.username || 'Sen'}
                  variant='gradient'
                  size='small'
                />
              </View>
              <View style={styles.scoreDisplayWrapper}>
                <ScoreDisplay
                  score={displayOpponentScore}
                  maxScore={displayTotalQuestions}
                  label={displayOpponent?.username || 'Rakip'}
                  variant='gradient'
                  size='small'
                />
              </View>
            </Row>
          </View>

          {/* Question Content */}
          <View style={styles.questionCard}>
            <View style={styles.questionContent}>
              <Text style={styles.questionText}>{displayQuestion.text}</Text>

              <View style={styles.optionsContainer}>
                {Object.entries(displayQuestion.options).map(([key, value]) => {
                  const isSelected = selectedAnswer === key;
                  const isCorrect = displayQuestion.correctAnswer === key;
                  const showResultsInQuestion =
                    displayHasAnswered && displayQuestion.correctAnswer;

                  let optionStyle: StyleProp<ViewStyle> = styles.optionButton;
                  let optionTextStyle: StyleProp<TextStyle> = styles.optionText;

                  if (showResultsInQuestion) {
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
                    optionStyle = [styles.optionButton, styles.selectedOption];
                    optionTextStyle = [
                      styles.optionText,
                      styles.selectedOptionText,
                    ];
                  }

                  if (displayHasAnswered) {
                    optionStyle = Array.isArray(optionStyle)
                      ? [...optionStyle, styles.disabledOption]
                      : [optionStyle, styles.disabledOption];
                  }

                  return (
                    <TouchableOpacity
                      key={key}
                      style={optionStyle}
                      onPress={() => handleAnswerSelect(key)}
                      disabled={displayHasAnswered}
                      activeOpacity={0.8}
                    >
                      <Text style={optionTextStyle}>
                        {key}) {value}
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
          {displayHasAnswered && (
            <View style={styles.answerStatusContainer}>
              <Badge
                text='Cevap Gönderildi ✓'
                variant='success'
                size='md'
                fontFamily='SecondaryFont-Bold'
                style={styles.answerStatusBadge}
              />
              <Paragraph style={styles.answerStatusText}>
                {displayOpponent?.isBot
                  ? 'Bot hesaplıyor...'
                  : 'Rakip bekleniyor...'}
              </Paragraph>
            </View>
          )}

          {displayHasAnswered && displayQuestion.correctAnswer && (
            <View style={styles.questionResultsContainer}>
              <View style={styles.correctAnswerContainer}>
                <Text style={styles.correctAnswer}>
                  Doğru Cevap: {displayQuestion.correctAnswer}){' '}
                  {getOptionValue(
                    displayQuestion.options,
                    displayQuestion.correctAnswer,
                  )}
                </Text>
              </View>

              {displayQuestion.explanation && (
                <View style={styles.explanationContainer}>
                  <Text style={styles.explanationTitle}>💡 Açıklama</Text>
                  <Text style={styles.explanationText}>
                    {displayQuestion.explanation}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
    );
  };

  const renderResults = () => {
    const displayRoundResult = __DEV_MODE__
      ? MOCK_DATA.roundResult
      : roundResult;
    const displayUser = __DEV_MODE__ ? MOCK_DATA.userData : user;
    const displayOpponent = __DEV_MODE__
      ? MOCK_DATA.opponentInfo
      : opponentInfo;
    const displayQuestionIndex = __DEV_MODE__ ? 0 : questionIndex;

    if (!displayRoundResult || !displayRoundResult.question) {
      return null;
    }

    const userAnswer = displayRoundResult.answers?.find(
      (a) => a.userId === displayUser?.userId,
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
                  {displayQuestionIndex + 1}. Tur Sonuçları
                </PlayfulTitle>

                {/* Question Display with Answer Highlighting */}
                <View style={styles.questionResultsContainer}>
                  <Text style={styles.questionResultsText}>
                    {displayRoundResult.question.text}
                  </Text>

                  {/* Options with correct/wrong highlighting */}
                  <View style={styles.resultsOptionsContainer}>
                    {Object.entries(displayRoundResult.question.options).map(
                      ([key, value]) => {
                        const isCorrect =
                          displayRoundResult.question.correctAnswer === key;
                        const isUserSelected =
                          userAnswer?.selectedAnswer === key;

                        let optionStyle: StyleProp<ViewStyle> =
                          styles.resultOptionButton;
                        let optionTextStyle: StyleProp<TextStyle> =
                          styles.resultOptionText;

                        if (isCorrect) {
                          optionStyle = [
                            styles.resultOptionButton,
                            styles.correctResultOption,
                          ];
                          optionTextStyle = [
                            styles.resultOptionText,
                            styles.correctResultOptionText,
                          ];
                        } else if (isUserSelected) {
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
                      Doğru Cevap: {displayRoundResult.question.correctAnswer}){' '}
                      {getOptionValue(
                        displayRoundResult.question.options,
                        displayRoundResult.question.correctAnswer,
                      )}
                    </Text>
                  </View>

                  {/* Explanation if available */}
                  {displayRoundResult.question.explanation && (
                    <View style={styles.explanationContainer}>
                      <Text style={styles.explanationTitle}>💡 Açıklama</Text>
                      <Text style={styles.explanationText}>
                        {displayRoundResult.question.explanation}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Player Results */}
                <View style={styles.resultRowContainer}>
                  <Row style={styles.resultRow}>
                    {displayRoundResult.answers?.map((answer, idx) => {
                      if (!answer) return null;

                      const isUser = answer.userId === displayUser?.userId;
                      const displayName = isUser
                        ? displayUser?.username || 'Sen'
                        : displayOpponent?.username || 'Rakip';

                      return (
                        <View key={idx} style={styles.playerResultContainer}>
                          <Column style={styles.playerResult}>
                            <Text style={styles.playerName}>
                              {displayName}
                              {!isUser && displayOpponent?.isBot && ' 🤖'}
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
                        {displayOpponent?.isBot ? 'Bot' : 'Rakip'}
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
          {(currentQuestion || __DEV_MODE__) && (
            <QuestionReportModal
              isVisible={showReportModal}
              onClose={() => setShowReportModal(false)}
              questionId={
                __DEV_MODE__
                  ? MOCK_DATA.currentQuestion.id
                  : currentQuestion?.id || 0
              }
              questionText={displayRoundResult.question.text}
              questionOptions={displayRoundResult.question.options}
              correctAnswer={displayRoundResult.question.correctAnswer}
              userAnswer={userAnswer?.selectedAnswer || null}
              isCorrect={isUserCorrect}
            />
          )}
        </ScrollView>
      </View>
    );
  };

  const renderFinal = () => {
    const displayFinalResults = __DEV_MODE__
      ? MOCK_DATA.finalResults
      : finalResults;
    const displayDuelInfo = __DEV_MODE__ ? MOCK_DATA.duelInfo : duelInfo;
    const displayUser = __DEV_MODE__ ? MOCK_DATA.userData : user;
    const displayOpponent = __DEV_MODE__
      ? MOCK_DATA.opponentInfo
      : opponentInfo;
    const displayTotalQuestions = __DEV_MODE__ ? 3 : totalQuestions;
    const displayAnsweredQuestions = __DEV_MODE__
      ? [
          {
            questionId: 1,
            selectedAnswer: 'A',
            correctAnswer: 'A',
            isCorrect: true,
            timeTaken: 5000,
            questionText: MOCK_DATA.currentQuestion.text,
            options: MOCK_DATA.currentQuestion.options,
          },
        ]
      : answeredQuestions;

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
                {displayFinalResults && (
                  <>
                    {/* Winner Display */}
                    <View style={styles.winnerSectionContainer}>
                      <View style={styles.winnerSection}>
                        {displayFinalResults.winnerId ===
                        displayUser?.userId ? (
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
                            {displayOpponent?.isBot && (
                              <Text style={styles.botVictoryText}>
                                {displayOpponent.username} botu yendiniz!
                              </Text>
                            )}
                          </>
                        ) : displayFinalResults.winnerId ? (
                          <>
                            <Text style={styles.winnerEmoji}>😔</Text>
                            <PlayfulTitle level={1} style={styles.loserText}>
                              Yenilgi
                            </PlayfulTitle>
                            {displayOpponent?.isBot && (
                              <Text style={styles.botDefeatText}>
                                {displayOpponent.username} botu sizi yendi!
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

                    {/* Final Score */}
                    <View style={styles.finalScoreContainer}>
                      <Row style={styles.finalScore}>
                        <View style={styles.finalScoreWrapper}>
                          <ScoreDisplay
                            score={
                              displayFinalResults.user1.userId ===
                              displayUser?.userId
                                ? displayFinalResults.user1.score
                                : displayFinalResults.user2.score
                            }
                            maxScore={displayTotalQuestions}
                            label={displayUser?.username || 'Sen'}
                            variant='default'
                            size='medium'
                            style={{
                              width: '100%',
                              maxWidth: '100%',
                            }}
                            scoreFontFamily='PrimaryFont'
                            labelFontFamily='SecondaryFont-Bold'
                            maxScoreFontFamily='PrimaryFont'
                          />
                        </View>
                        <View style={styles.finalScoreWrapper}>
                          <ScoreDisplay
                            score={
                              displayFinalResults.user1.userId ===
                              displayUser?.userId
                                ? displayFinalResults.user2.score
                                : displayFinalResults.user1.score
                            }
                            maxScore={displayTotalQuestions}
                            label={displayOpponent?.username || 'Rakip'}
                            variant='default'
                            size='medium'
                            style={{
                              width: '100%',
                              maxWidth: '100%',
                            }}
                            scoreFontFamily='PrimaryFont'
                            labelFontFamily='SecondaryFont-Bold'
                            maxScoreFontFamily='PrimaryFont'
                          />
                        </View>
                      </Row>
                    </View>

                    {/* Duel Summary */}
                    {displayDuelInfo && (
                      <View style={styles.duelSummaryContainer}>
                        <View style={styles.duelSummary}>
                          <Text style={styles.duelSummaryTitle}>
                            Düello Özeti
                          </Text>
                          <Text style={styles.duelSummaryText}>
                            📚 {displayDuelInfo.course_name}
                          </Text>
                          <Text style={styles.duelSummaryText}>
                            📝 {displayDuelInfo.test_name}
                          </Text>
                          <Text style={styles.duelSummaryText}>
                            👥 {displayUser?.username} vs{' '}
                            {displayOpponent?.username}
                            {displayOpponent?.isBot && ' 🤖'}
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
                            📊 {displayAnsweredQuestions.length} soru yanıtlandı
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

                    {/* Enhanced Stats */}
                    <View style={styles.statsSectionContainer}>
                      <View style={styles.statsSection}>
                        <Row style={styles.statsRow}>
                          <Text style={styles.statText}>
                            Doğruluk:{' '}
                            {Math.floor(
                              (displayFinalResults.user1.userId ===
                              displayUser?.userId
                                ? displayFinalResults.user1.accuracy
                                : displayFinalResults.user2.accuracy) * 100,
                            )}
                            %
                          </Text>
                          <Text style={styles.statText}>
                            Ort. Süre:{' '}
                            {Math.floor(
                              ((displayFinalResults.user1.userId ===
                              displayUser?.userId
                                ? displayFinalResults.user1.totalTime
                                : displayFinalResults.user2.totalTime) /
                                1000 /
                                displayTotalQuestions) *
                                10,
                            ) / 10}
                            s
                          </Text>
                        </Row>

                        {displayAnsweredQuestions.length > 0 && (
                          <Row style={styles.additionalStatsRow}>
                            <Text style={styles.statText}>
                              Doğru:{' '}
                              {
                                displayAnsweredQuestions.filter(
                                  (q) => q.isCorrect,
                                ).length
                              }
                            </Text>
                            <Text style={styles.statText}>
                              Yanlış:{' '}
                              {
                                displayAnsweredQuestions.filter(
                                  (q) => !q.isCorrect,
                                ).length
                              }
                            </Text>
                          </Row>
                        )}
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtonsContainer}>
                      <Row style={styles.actionButtons}>
                        <Button
                          title='Yeni Düello'
                          variant='ghost'
                          onPress={() => {
                            if (!__DEV_MODE__) {
                              cleanup();
                            }
                            router.replace('/(tabs)/duels/new');
                          }}
                          style={styles.actionButton}
                        />
                        <Button
                          title='Çık'
                          variant='secondary'
                          onPress={() => {
                            if (!__DEV_MODE__) {
                              cleanup();
                            }
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
          message={
            gameError || connectionError || roomError || 'Bir şeyler ters gitti'
          }
          style={{ marginBottom: Spacing[4] }}
        />
        <Button
          title='Tekrar Dene'
          variant='primary'
          onPress={() => {
            if (!__DEV_MODE__) {
              initializeConnection();
            }
          }}
        />
      </View>
    </View>
  );

  // Don't render modal until stable on iOS
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

// Enhanced styles (keeping all original styles)
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
    paddingTop: Spacing[4],
    paddingBottom: Spacing[4],
  } as ViewStyle,

  // ScrollView container
  scrollContainer: {
    flex: 1,
    backgroundColor: Colors.vibrant.purple,
  } as ViewStyle,

  // ScrollView content
  scrollContent: {
    paddingTop: Spacing[4],
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[8],
    minHeight: height - 100,
  } as ViewStyle,

  // Header styling with proper z-index
  duelInfoHeader: {
    backgroundColor: Colors.vibrant.orangeLight,
    borderRadius: BorderRadius['3xl'],
    padding: Spacing[3],
    marginTop: 40,
    marginBottom: Spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    width: '100%',
    elevation: 10,
  } as ViewStyle,

  // Question header container
  questionHeaderContainer: {
    backgroundColor: Colors.vibrant.orangeLight,
    borderRadius: BorderRadius['3xl'],
    padding: Spacing[4],
    marginBottom: Spacing[4],
    minHeight: 80,
  } as ViewStyle,

  questionHeader: {
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  } as ViewStyle,

  // Score container
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
  } as ViewStyle,

  // Question card with proper dimensions
  questionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius['3xl'],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: Spacing[6],
    minHeight: 400,
  } as ViewStyle,

  // Question content with proper padding
  questionContent: {
    padding: Spacing[6],
    minHeight: 350,
    justifyContent: 'center' as const,
    fontFamily: 'SecondaryFont-Regular',
  } as ViewStyle,

  questionText: {
    fontSize: 16,
    color: Colors.white,
    textAlign: 'left' as const,
    marginBottom: Spacing[6],
    fontFamily: 'SecondaryFont-Regular',
    lineHeight: 28,
    minHeight: 60,
  } as TextStyle,

  // Options container with proper spacing
  optionsContainer: {
    gap: Spacing[3],
    minHeight: 240,
  } as ViewStyle,

  // Option button with guaranteed visibility and touch area
  optionButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    minHeight: 60,
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

  // Answer status container
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
    fontFamily: 'SecondaryFont-Bold',
  } as ViewStyle,

  answerStatusText: {
    color: Colors.gray?.[300] || '#d1d5db',
    textAlign: 'center' as const,
    fontFamily: 'SecondaryFont-Regular',
  } as TextStyle,

  // Results containers
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

  // Final screen containers
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
    width: '50%',
    maxWidth: '50%',
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
    backgroundColor: 'rgba(255, 183, 3, 0.1)',
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

  resultsOptionsContainer: {
    gap: Spacing[2],
    width: '100%',
    marginBottom: Spacing[3],
  } as ViewStyle,

  resultOptionButton: {
    borderRadius: BorderRadius.lg,
    padding: Spacing[3],
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.1)',
  } as ViewStyle,

  correctResultOption: {
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    borderColor: Colors.vibrant.mint || '#10b981',
    borderWidth: 3,
  } as ViewStyle,

  wrongResultOption: {
    backgroundColor: 'rgba(248, 113, 113, 0.3)',
    borderColor: Colors.vibrant.coral || '#f87171',
    borderWidth: 3,
  } as ViewStyle,

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

  explanationContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
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

  selectedAnswerText: {
    fontSize: 11,
    color: Colors.gray?.[400] || '#9ca3af',
    fontFamily: 'SecondaryFont-Regular',
    marginTop: 4,
    textAlign: 'center' as const,
  } as TextStyle,
};
