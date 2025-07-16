// app/(tabs)/duels/[id].tsx - Gerçek Zamanlı Düello Odası Ekranı

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
import API_URL from '@/src/config/api.config';

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
  const timerRef = useRef<number | null>(null);
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
        setError("Kimlik doğrulama token'ı bulunamadı");
        return;
      }

      // Initialize socket connection
      socket.current = io(API_URL || 'http://localhost:3001', {
        auth: { token },
      });

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
          setError('Bağlantı kesildi. Tekrar bağlanmaya çalışılıyor...');
        }
      });
    } catch (error) {
      console.error('Error initializing connection:', error);
      setError('Oyun sunucusuna bağlanılamadı');
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
      'Rakip Bağlantısı Kesildi',
      'Rakibiniz düellodan ayrıldı. Varsayılan olarak kazandınız!',
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

  const renderLobby = () => (
    <Container style={styles.centerContainer}>
      <PlayfulCard variant='glass' style={styles.lobbyCard}>
        <Column style={{ alignItems: 'center' as const }}>
          <Row
            style={{ alignItems: 'center' as const, marginBottom: Spacing[6] }}
          >
            <Avatar
              size='lg'
              name={userData?.username?.charAt(0) || 'K'}
              bgColor={Colors.vibrant.purple}
            />
            <Text style={styles.vsText}>KARŞı</Text>
            <Avatar size='lg' name='?' bgColor={Colors.vibrant.orange} />
          </Row>

          <PlayfulTitle level={3} style={styles.whiteText}>
            Düello Lobisi
          </PlayfulTitle>

          <Paragraph style={styles.lightText}>
            Her iki oyuncunun hazır olması bekleniyor...
          </Paragraph>

          <Row style={{ marginTop: Spacing[4] }}>
            <Badge text='Hazır ✓' variant='success' />
            <Badge text='Bekliyor...' variant='warning' />
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
        Hazır Olun!
      </PlayfulTitle>
    </Container>
  );

  const renderQuestion = () => (
    <Container style={styles.questionContainer}>
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
            {opponentAnswered ? 'Rakip: Tamamladı ✓' : 'Rakip: Düşünüyor...'}
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
          label='Rakip'
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
          <Paragraph style={styles.lightText}>Rakip bekleniyor...</Paragraph>
        </View>
      )}
    </Container>
  );

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
                  return (
                    <Column key={idx} style={styles.playerResult}>
                      <Text style={styles.playerName}>
                        {isUser ? 'Siz' : 'Rakip'}
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
                  <Text style={styles.scoreLabel}>Rakip</Text>
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

  const renderFinal = () => (
    <Container style={styles.centerContainer}>
      <PlayfulCard variant='glass' style={styles.finalCard}>
        <Column style={{ alignItems: 'center' as const }}>
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
                  </>
                ) : finalResults.winnerId ? (
                  <>
                    <Text style={styles.winnerEmoji}>😔</Text>
                    <PlayfulTitle level={1} style={styles.loserText}>
                      Yenilgi
                    </PlayfulTitle>
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
                  label='Rakip'
                  variant='gradient'
                  size='large'
                />
              </Row>

              {/* Stats */}
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
