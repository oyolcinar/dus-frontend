// app/(tabs)/duels/[id].tsx - Real-time Duel Room Screen

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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
import { duelService } from '../../../src/api';

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

  // Refs
  const socket = useRef<Socket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const answerStartTime = useRef<number>(0);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Initialize socket connection
  useEffect(() => {
    initializeConnection();
    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
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

  const initializeConnection = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        setError('Authentication token not found');
        return;
      }

      // Initialize socket connection
      socket.current = io(
        process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001',
        {
          auth: { token },
        },
      );

      // Socket event listeners
      socket.current.on('connect', () => {
        console.log('Connected to socket server');
        joinDuelRoom();
      });

      socket.current.on('room_joined', handleRoomJoined);
      socket.current.on('opponent_joined', handleOpponentJoined);
      socket.current.on('player_ready', handlePlayerReady);
      socket.current.on('both_players_connected', handleBothPlayersConnected);
      socket.current.on('duel_starting', handleDuelStarting);
      socket.current.on('question_presented', handleQuestionPresented);
      socket.current.on('opponent_answered', handleOpponentAnswered);
      socket.current.on('round_result', handleRoundResult);
      socket.current.on('duel_completed', handleDuelCompleted);
      socket.current.on('opponent_disconnected', handleOpponentDisconnected);
      socket.current.on('room_error', handleRoomError);

      socket.current.on('disconnect', () => {
        console.log('Disconnected from socket server');
        if (phase !== 'final') {
          setError('Connection lost. Attempting to reconnect...');
        }
      });
    } catch (error) {
      console.error('Error initializing connection:', error);
      setError('Failed to connect to game server');
    }
  };

  const joinDuelRoom = () => {
    if (socket.current) {
      socket.current.emit('join_duel_room', { duelId });
    }
  };

  const handleRoomJoined = (data: { session: DuelSession }) => {
    setSession(data.session);
    setPhase('lobby');

    // Auto-ready for user
    setTimeout(() => {
      if (socket.current) {
        socket.current.emit('ready_for_duel');
      }
    }, 1000);
  };

  const handleOpponentJoined = (data: { username: string }) => {
    console.log('Opponent joined:', data.username);
  };

  const handlePlayerReady = (data: { userId: number; username: string }) => {
    console.log('Player ready:', data.username);
  };

  const handleBothPlayersConnected = () => {
    console.log('Both players connected and ready');
  };

  const handleDuelStarting = (data: { countdown: number }) => {
    setPhase('countdown');
    setCountdown(data.countdown);
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

  const handleAnswerSelect = (answer: string) => {
    if (hasAnswered || phase !== 'question') return;

    setSelectedAnswer(answer);
    setHasAnswered(true);

    const timeTaken = Date.now() - answerStartTime.current;

    if (socket.current && currentQuestion) {
      socket.current.emit('submit_answer', {
        questionId: currentQuestion.id,
        selectedAnswer: answer,
        timeTaken: timeTaken,
      });
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handleAutoSubmit = () => {
    if (!hasAnswered && socket.current && currentQuestion) {
      socket.current.emit('submit_answer', {
        questionId: currentQuestion.id,
        selectedAnswer: null,
        timeTaken: 30000,
      });
      setHasAnswered(true);
    }
  };

  const handleOpponentAnswered = (data: {
    userId: number;
    username: string;
  }) => {
    setOpponentAnswered(true);
  };

  const handleRoundResult = (data: RoundResult) => {
    setPhase('results');
    setRoundResult(data);

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

  const handleDuelCompleted = (data: FinalResults) => {
    setPhase('final');
    setFinalResults(data);
  };

  const handleOpponentDisconnected = (data: {
    userId: number;
    username: string;
  }) => {
    Alert.alert(
      'Opponent Disconnected',
      'Your opponent has left the duel. You win by default!',
      [{ text: 'OK', onPress: () => router.back() }],
    );
  };

  const handleRoomError = (data: { message: string }) => {
    setError(data.message);
    setPhase('error');
  };

  const handleExitDuel = () => {
    Alert.alert(
      'Exit Duel',
      'Are you sure you want to leave? This will count as a loss.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Exit',
          style: 'destructive',
          onPress: () => {
            if (socket.current) {
              socket.current.disconnect();
            }
            router.back();
          },
        },
      ],
    );
  };

  const renderConnecting = () => (
    <Container style={styles.centerContainer}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Avatar
          size='xl'
          name='🔥'
          bgColor={VIBRANT_COLORS.orange}
          style={{ marginBottom: Spacing[4] }}
        />
      </Animated.View>
      <PlayfulTitle level={2} style={styles.whiteText}>
        Connecting to Duel...
      </PlayfulTitle>
      <ActivityIndicator
        size='large'
        color={Colors.white}
        style={{ marginTop: Spacing[4] }}
      />
    </Container>
  );

  const renderLobby = () => (
    <Container style={styles.centerContainer}>
      <PlayfulCard variant='glass' style={styles.lobbyCard}>
        <Column style={{ alignItems: 'center' }}>
          <Row style={{ alignItems: 'center', marginBottom: Spacing[6] }}>
            <Avatar
              size='lg'
              name={userData?.username?.charAt(0) || 'U'}
              bgColor={VIBRANT_COLORS.purple}
            />
            <Text style={styles.vsText}>VS</Text>
            <Avatar size='lg' name='?' bgColor={VIBRANT_COLORS.orange} />
          </Row>

          <PlayfulTitle level={3} style={styles.whiteText}>
            Duel Lobby
          </PlayfulTitle>

          <Paragraph style={styles.lightText}>
            Waiting for both players to be ready...
          </Paragraph>

          <Row style={{ marginTop: Spacing[4] }}>
            <Badge text='Ready ✓' variant='success' />
            <Badge text='Waiting...' variant='warning' />
          </Row>
        </Column>
      </PlayfulCard>
    </Container>
  );

  const renderCountdown = () => (
    <Container style={styles.centerContainer}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Text style={styles.countdownText}>{countdown}</Text>
      </Animated.View>
      <PlayfulTitle level={2} style={styles.whiteText}>
        Get Ready!
      </PlayfulTitle>
    </Container>
  );

  const renderQuestion = () => (
    <Container style={styles.questionContainer}>
      {/* Header */}
      <Row style={styles.questionHeader}>
        <Column>
          <Text style={styles.questionCounter}>
            Question {questionIndex + 1} of {totalQuestions}
          </Text>
          <ProgressBar
            progress={(questionIndex + 1) / totalQuestions}
            color={VIBRANT_COLORS.mint}
            style={{ width: 120 }}
          />
        </Column>
        <Column style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.timer, timeLeft <= 10 && styles.timerDanger]}>
            {timeLeft}s
          </Text>
          <Text style={styles.opponentStatus}>
            {opponentAnswered ? 'Opponent: Done ✓' : 'Opponent: Thinking...'}
          </Text>
        </Column>
      </Row>

      {/* Score Display */}
      <Row style={styles.scoreRow}>
        <ScoreDisplay
          score={userScore}
          maxScore={totalQuestions}
          label='You'
          variant='gradient'
          size='small'
        />
        <ScoreDisplay
          score={opponentScore}
          maxScore={totalQuestions}
          label='Opponent'
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
          <Badge text='Answer Submitted ✓' variant='success' size='lg' />
          <Paragraph style={styles.lightText}>
            Waiting for opponent...
          </Paragraph>
        </View>
      )}
    </Container>
  );

  const renderResults = () => (
    <Container style={styles.centerContainer}>
      <PlayfulCard variant='glass' style={styles.resultsCard}>
        <Column style={{ alignItems: 'center' }}>
          <PlayfulTitle level={2} style={styles.whiteText}>
            Round {questionIndex + 1} Results
          </PlayfulTitle>

          {roundResult && (
            <>
              <Text style={styles.correctAnswer}>
                Correct Answer: {roundResult.question.correctAnswer}){' '}
                {
                  roundResult.question.options[
                    roundResult.question.correctAnswer
                  ]
                }
              </Text>

              <Row style={styles.resultRow}>
                {roundResult.answers.map((answer, idx) => {
                  const isUser = answer.userId === userData?.userId;
                  return (
                    <Column key={idx} style={styles.playerResult}>
                      <Text style={styles.playerName}>
                        {isUser ? 'You' : 'Opponent'}
                      </Text>
                      <Badge
                        text={answer.isCorrect ? 'Correct ✓' : 'Wrong ✗'}
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
                <AnimatedCounter
                  value={userScore}
                  label='Your Score'
                  color={VIBRANT_COLORS.mint}
                />
                <Text style={styles.scoreVs}>-</Text>
                <AnimatedCounter
                  value={opponentScore}
                  label='Opponent'
                  color={VIBRANT_COLORS.coral}
                />
              </Row>
            </>
          )}

          <Paragraph style={styles.lightText}>
            Next question in 3 seconds...
          </Paragraph>
        </Column>
      </PlayfulCard>
    </Container>
  );

  const renderFinal = () => (
    <Container style={styles.centerContainer}>
      <PlayfulCard variant='glass' style={styles.finalCard}>
        <Column style={{ alignItems: 'center' }}>
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
                      VICTORY!
                    </PlayfulTitle>
                  </>
                ) : finalResults.winnerId ? (
                  <>
                    <Text style={styles.winnerEmoji}>😔</Text>
                    <PlayfulTitle level={1} style={styles.loserText}>
                      Defeat
                    </PlayfulTitle>
                  </>
                ) : (
                  <>
                    <Text style={styles.winnerEmoji}>🤝</Text>
                    <PlayfulTitle level={1} style={styles.drawText}>
                      Draw!
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
                  label='You'
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
                  label='Opponent'
                  variant='gradient'
                  size='large'
                />
              </Row>

              {/* Stats */}
              <View style={styles.statsSection}>
                <Row>
                  <Text style={styles.statText}>
                    Accuracy:{' '}
                    {(finalResults.user1.userId === userData?.userId
                      ? finalResults.user1.accuracy
                      : finalResults.user2.accuracy * 100
                    ).toFixed(0)}
                    %
                  </Text>
                  <Text style={styles.statText}>
                    Avg Time:{' '}
                    {(finalResults.user1.userId === userData?.userId
                      ? finalResults.user1.totalTime
                      : finalResults.user2.totalTime / 1000 / totalQuestions
                    ).toFixed(1)}
                    s
                  </Text>
                </Row>
              </View>

              {/* Action Buttons */}
              <Row style={styles.actionButtons}>
                <Button
                  title='New Duel'
                  variant='primary'
                  onPress={() => router.push('/(tabs)/duels/new')}
                  style={{ flex: 1, marginRight: Spacing[2] }}
                />
                <Button
                  title='Exit'
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

  const renderError = () => (
    <Container style={styles.centerContainer}>
      <UIAlert
        type='error'
        title='Connection Error'
        message={error || 'Something went wrong'}
        style={{ marginBottom: Spacing[4] }}
      />
      <Button
        title='Try Again'
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[4],
  },
  questionContainer: {
    flex: 1,
    padding: Spacing[4],
  },
  questionHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  questionCounter: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
    fontFamily: 'SecondaryFont-Bold',
  },
  timer: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    fontFamily: 'PrimaryFont',
  },
  timerDanger: {
    color: VIBRANT_COLORS.coral,
  },
  opponentStatus: {
    fontSize: 12,
    color: Colors.gray[300],
    fontFamily: 'SecondaryFont-Regular',
  },
  scoreRow: {
    justifyContent: 'space-between',
    marginBottom: Spacing[6],
  },
  questionCard: {
    flex: 1,
    justifyContent: 'center',
  },
  questionContent: {
    padding: Spacing[6],
  },
  questionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing[6],
    fontFamily: 'PrimaryFont',
    lineHeight: 28,
  },
  optionsContainer: {
    gap: Spacing[3],
  },
  optionButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    backgroundColor: VIBRANT_COLORS.purple,
    borderColor: Colors.white,
  },
  disabledOption: {
    opacity: 0.6,
  },
  optionText: {
    fontSize: 16,
    color: Colors.white,
    fontFamily: 'SecondaryFont-Regular',
  },
  selectedOptionText: {
    fontWeight: 'bold',
    fontFamily: 'SecondaryFont-Bold',
  },
  answerStatus: {
    alignItems: 'center',
    marginTop: Spacing[4],
  },
  lobbyCard: {
    padding: Spacing[6],
    width: width * 0.9,
  },
  resultsCard: {
    padding: Spacing[6],
    width: width * 0.9,
  },
  finalCard: {
    padding: Spacing[6],
    width: width * 0.9,
  },
  vsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    marginHorizontal: Spacing[4],
    fontFamily: 'PrimaryFont',
  },
  whiteText: {
    color: Colors.white,
  },
  lightText: {
    color: Colors.gray[300],
    textAlign: 'center',
    fontFamily: 'SecondaryFont-Regular',
  },
  countdownText: {
    fontSize: 120,
    fontWeight: 'bold',
    color: Colors.white,
    fontFamily: 'PrimaryFont',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  correctAnswer: {
    fontSize: 16,
    color: VIBRANT_COLORS.mint,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: Spacing[4],
    fontFamily: 'SecondaryFont-Bold',
  },
  resultRow: {
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: Spacing[4],
  },
  playerResult: {
    alignItems: 'center',
    gap: Spacing[2],
  },
  playerName: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: 'bold',
    fontFamily: 'SecondaryFont-Bold',
  },
  timeText: {
    fontSize: 12,
    color: Colors.gray[300],
    fontFamily: 'SecondaryFont-Regular',
  },
  currentScore: {
    alignItems: 'center',
    gap: Spacing[4],
    marginTop: Spacing[4],
  },
  scoreVs: {
    fontSize: 24,
    color: Colors.white,
    fontWeight: 'bold',
    fontFamily: 'PrimaryFont',
  },
  winnerSection: {
    alignItems: 'center',
    marginBottom: Spacing[6],
  },
  winnerEmoji: {
    fontSize: 64,
    marginBottom: Spacing[2],
  },
  winnerText: {
    color: VIBRANT_COLORS.mint,
  },
  loserText: {
    color: VIBRANT_COLORS.coral,
  },
  drawText: {
    color: VIBRANT_COLORS.yellow,
  },
  finalScore: {
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: Spacing[6],
  },
  statsSection: {
    width: '100%',
    marginBottom: Spacing[6],
  },
  statText: {
    fontSize: 14,
    color: Colors.gray[300],
    fontFamily: 'SecondaryFont-Regular',
  },
  actionButtons: {
    gap: Spacing[4],
    width: '100%',
  },
};
