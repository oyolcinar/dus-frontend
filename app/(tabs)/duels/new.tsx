// app/(tabs)/duels/new.tsx - Complete fix with auth + socket integration

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  useColorScheme,
  Dimensions,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Container,
  SlideInElement,
  PlayfulCard,
  PlayfulTitle,
  Paragraph,
  Row,
  Column,
  Avatar,
  Badge,
  Button,
  Input,
  Card,
  Alert,
  Picker,
  Modal,
  EmptyState,
  OpponentListItem,
  Opponent,
  SpinningWheel,
  FloatingElement,
  GlassCard,
  Colors,
  Spacing,
  BorderRadius,
  VIBRANT_COLORS,
} from '../../../components/ui';
import {
  duelService,
  userService,
  testService,
  friendService,
  courseService,
  botService,
} from '../../../src/api';
import { ApiError } from '../../../src/api/apiClient';
import { Test, Course } from '../../../src/types/models';

// Import Bot type from botService
import { Bot } from '../../../src/api/botService';
import { globalStyles } from '../../../utils/styleUtils';

// Import auth context
import { useAuth } from '../../../context/AuthContext';

// Socket service imports - handle gracefully if not available
let challengeBotViaSocket:
  | ((testId: number, difficulty: number) => Promise<void>)
  | undefined;
let onBotChallengeCreated:
  | ((callback: (data: { duel: any }) => void) => void)
  | undefined;
let onBotChallengeError:
  | ((callback: (data: { message: string }) => void) => void)
  | undefined;
let onAutoJoinDuel:
  | ((callback: (data: { duelId: number }) => void) => void)
  | undefined;
let off:
  | ((event: string, callback?: (...args: any[]) => void) => void)
  | undefined;
let initializeSocket: (() => Promise<void>) | undefined;
let isConnected: (() => boolean) | undefined;
let connect: ((token?: string) => Promise<void>) | undefined;

try {
  const socketService = require('../../../src/api/socketService');
  challengeBotViaSocket = socketService.challengeBot;
  onBotChallengeCreated = socketService.onBotChallengeCreated;
  onBotChallengeError = socketService.onBotChallengeError;
  onAutoJoinDuel = socketService.onAutoJoinDuel;
  off = socketService.off;
  initializeSocket = socketService.initializeSocket;
  isConnected = socketService.isConnected;
  connect = socketService.connect;
} catch (error) {
  console.warn('Socket service not available:', error);
}

type DuelHubTab = 'find' | 'friends' | 'leaderboard' | 'bots';
type ChallengeStep =
  | 'selectOpponent'
  | 'selectCourse'
  | 'selectTest'
  | 'confirm';

export default function NewDuelScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Auth context integration
  const {
    user: contextUser,
    isLoading: authLoading,
    isSessionValid,
  } = useAuth();

  // Main state
  const [activeTab, setActiveTab] = useState<DuelHubTab>('find');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data state
  const [courses, setCourses] = useState<Course[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [recommended, setRecommended] = useState<Opponent[]>([]);
  const [friends, setFriends] = useState<Opponent[]>([]);
  const [leaderboard, setLeaderboard] = useState<Opponent[]>([]);
  const [bots, setBots] = useState<Bot[]>([]);

  // Challenge flow state
  const [challengeStep, setChallengeStep] =
    useState<ChallengeStep>('selectOpponent');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState<Opponent | null>(
    null,
  );
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);

  // UI state
  const [showWheelForCourse, setShowWheelForCourse] = useState(false);
  const [showWheelForTest, setShowWheelForTest] = useState(false);
  const [isSubmittingChallenge, setIsSubmittingChallenge] = useState(false);
  const [isLoadingTests, setIsLoadingTests] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bot challenge state
  const [isBotChallenge, setIsBotChallenge] = useState(false);
  const [isChallenginBot, setIsChallenginBot] = useState(false);

  // Enhanced auth + socket state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [isConnectingSocket, setIsConnectingSocket] = useState(false);
  const [socketError, setSocketError] = useState<string | null>(null);

  // Enhanced auth + socket initialization
  useEffect(() => {
    const checkAuthAndInitSocket = async () => {
      try {
        setIsCheckingAuth(true);

        // Wait for auth context to finish loading
        if (authLoading) {
          console.log('Auth context still loading, waiting...');
          return;
        }

        // Check auth context state
        if (!contextUser || !isSessionValid) {
          console.log('User not authenticated via context');
          setIsAuthenticated(false);
          setAuthToken(null);
          setSocketConnected(false);
          setIsCheckingAuth(false);
          return;
        }

        // Double-check token exists in storage
        const [authStorageToken, userStorageToken] = await Promise.all([
          AsyncStorage.getItem('authToken'),
          AsyncStorage.getItem('userToken'),
        ]);

        if (!authStorageToken && !userStorageToken) {
          console.log('No auth tokens found in storage');
          setIsAuthenticated(false);
          setAuthToken(null);
          setSocketConnected(false);
          setIsCheckingAuth(false);
          return;
        }

        // Use userToken as primary, but ensure authToken exists for socket
        const effectiveToken = authStorageToken || userStorageToken;
        if (userStorageToken && !authStorageToken) {
          await AsyncStorage.setItem('authToken', userStorageToken);
          console.log('Synced authToken for socket service');
        }

        // User is authenticated
        setAuthToken(effectiveToken);
        setIsAuthenticated(true);

        console.log('User authenticated, initializing socket connection...', {
          user: contextUser.username,
          hasToken: !!effectiveToken,
        });

        // Now attempt socket initialization
        if (initializeSocket && isConnected) {
          try {
            setIsConnectingSocket(true);
            setSocketError(null);
            await initializeSocket();
            setSocketConnected(isConnected());
            console.log('Socket initialized successfully:', isConnected());
          } catch (error) {
            console.warn(
              'Failed to initialize socket (but user is authenticated):',
              error,
            );
            setSocketConnected(false);
            setSocketError(
              error instanceof Error ? error.message : 'Connection failed',
            );
          } finally {
            setIsConnectingSocket(false);
          }
        } else {
          console.log('Socket service not available, will use HTTP fallback');
          setSocketConnected(false);
        }
      } catch (error) {
        console.error('Error during auth check:', error);
        setIsAuthenticated(false);
        setAuthToken(null);
        setSocketConnected(false);
        setSocketError('Authentication check failed');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthAndInitSocket();
  }, [contextUser, isSessionValid, authLoading]);

  const fetchData = useCallback(async () => {
    try {
      setError(null);

      // Fetch core data
      const [coursesData, recommendedData, friendsData, leaderboardData] =
        await Promise.all([
          courseService.getAllCourses(),
          duelService.getRecommendedOpponents(),
          friendService.getUserFriends(),
          duelService.getDuelLeaderboard(),
        ]);

      setCourses(coursesData);
      setRecommended(
        recommendedData.map((u: any) => ({
          id: u.userId,
          username: u.username,
          winRate: u.winRate,
        })),
      );

      setFriends(
        friendsData.map((f: any) => ({
          id: f.friend_id,
          username: f.friend_username || 'Bilinmeyen Kullanıcı',
        })),
      );

      setLeaderboard(
        leaderboardData.leaderboard.map((u: any) => ({
          id: u.userId,
          username: u.username,
          winRate: u.winRate,
        })),
      );

      // Fetch bots using botService
      try {
        const botsData = await botService.getAvailableBots();
        setBots(botsData || []);
      } catch (botError) {
        console.warn('Failed to fetch bots:', botError);
        setBots([]);
      }
    } catch (e) {
      setError('Veriler yüklenirken bir hata oluştu.');
      console.error(e);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleRetry = useCallback(async () => {
    setIsLoading(true);
    await fetchData();
    setIsLoading(false);
  }, [fetchData]);

  useEffect(() => {
    const initialFetch = async () => {
      setIsLoading(true);
      await fetchData();
      setIsLoading(false);
    };
    initialFetch();
  }, [fetchData]);

  // Socket event listeners for bot challenges (only if socket service is available)
  useEffect(() => {
    if (
      !onBotChallengeCreated ||
      !onBotChallengeError ||
      !onAutoJoinDuel ||
      !off
    ) {
      return;
    }

    const handleBotChallengeCreated = (data: { duel: any }) => {
      console.log('Bot challenge created via socket:', data);
      setIsChallenginBot(false);
      setModalVisible(false);
      resetChallengeState();
      if (data.duel && data.duel.duel_id) {
        console.log('Navigating to duel:', data.duel.duel_id);
        router.push({
          pathname: '/(tabs)/duels/[id]' as any, // Note the correct path format
          params: { id: data.duel.duel_id.toString() },
        });
      }
    };

    const handleBotChallengeError = (data: { message: string }) => {
      console.error('Bot challenge error via socket:', data.message);
      setError(data.message);
      setIsChallenginBot(false);
    };

    const handleAutoJoinDuel = (data: { duelId: number }) => {
      console.log('Auto joining duel:', data.duelId);
      router.push({
        pathname: '/duels/[id]' as any,
        params: { id: data.duelId.toString() },
      });
    };

    onBotChallengeCreated(handleBotChallengeCreated);
    onBotChallengeError(handleBotChallengeError);
    onAutoJoinDuel(handleAutoJoinDuel);

    return () => {
      if (off) {
        off('bot_challenge_created', handleBotChallengeCreated);
        off('bot_challenge_error', handleBotChallengeError);
        off('auto_join_duel', handleAutoJoinDuel);
      }
    };
  }, [router]);

  // Challenge flow handlers
  const handleOpenChallengeModal = (opponent: Opponent) => {
    if (!isAuthenticated) {
      setError('Meydan okumak için giriş yapmanız gerekiyor.');
      return;
    }

    setSelectedOpponent(opponent);
    setSelectedBot(null);
    setSelectedCourse(null);
    setSelectedTest(null);
    setIsBotChallenge(false);
    setChallengeStep('selectCourse');
    setShowWheelForCourse(false);
    setShowWheelForTest(false);
    setModalVisible(true);
  };

  const handleOpenBotChallengeModal = (bot: Bot) => {
    if (!isAuthenticated) {
      setError('Bot meydan okumak için giriş yapmanız gerekiyor.');
      return;
    }

    setSelectedBot(bot);
    setSelectedOpponent(null);
    setSelectedCourse(null);
    setSelectedTest(null);
    setIsBotChallenge(true);
    setChallengeStep('selectCourse');
    setShowWheelForCourse(false);
    setShowWheelForTest(false);
    setModalVisible(true);
  };

  const handleCourseSpinComplete = (courseName: string, index: number) => {
    const winningCourse = courses[index];
    if (winningCourse) {
      handleCourseSelected(winningCourse);
    }
    setShowWheelForCourse(false);
  };

  const handleCourseSelected = async (course: Course) => {
    setSelectedCourse(course);
    setIsLoadingTests(true);
    setError(null);

    try {
      // Get tests for the selected course
      const testsData = await testService.getTestsByCourse(course.course_id);
      setTests(testsData);

      if (testsData.length === 0) {
        setError('Seçilen derste test bulunamadı.');
        return;
      }

      setChallengeStep('selectTest');
    } catch (err) {
      console.error('Error fetching tests:', err);
      setError('Testler yüklenirken hata oluştu.');
    } finally {
      setIsLoadingTests(false);
    }
  };

  const handleTestSpinComplete = (testName: string, index: number) => {
    const winningTest = tests[index];
    if (winningTest) {
      setSelectedTest(winningTest);
      setChallengeStep('confirm');
    }
    setShowWheelForTest(false);
  };

  // Enhanced challenge submit with proper auth checking
  const handleChallengeSubmit = async () => {
    if (!selectedTest) {
      setError('Test seçilmedi.');
      return;
    }

    // Enhanced auth check
    if (!isAuthenticated || !authToken || !contextUser || !isSessionValid) {
      setError(
        'Oturum süresi dolmuş. Lütfen uygulamayı yeniden başlatın veya tekrar giriş yapın.',
      );
      return;
    }

    if (isBotChallenge && selectedBot) {
      // Double-check auth state before proceeding with bot challenge
      const currentToken = await AsyncStorage.getItem('authToken');
      if (!currentToken) {
        setError(
          'Kimlik doğrulama hatası. Lütfen uygulamayı yeniden başlatın.',
        );
        setIsChallenginBot(false);
        return;
      }

      setIsChallenginBot(true);
      setError(null);

      try {
        // Check if we should try socket-based challenge
        const shouldUseSocket =
          challengeBotViaSocket &&
          isConnected &&
          isConnected() &&
          isAuthenticated;

        console.log('Bot challenge attempt:', {
          socketAvailable: !!challengeBotViaSocket,
          socketConnected: socketConnected,
          isAuthenticated: isAuthenticated,
          hasAuthToken: !!authToken,
          contextUser: contextUser.username,
          testId: selectedTest.test_id,
          difficulty: selectedBot.difficultyLevel,
        });

        if (shouldUseSocket) {
          console.log('Using socket-based bot challenge');
          try {
            await challengeBotViaSocket!(
              selectedTest.test_id,
              selectedBot.difficultyLevel,
            );
            console.log('Socket bot challenge sent successfully');
            // Response will be handled by socket listeners
          } catch (socketError) {
            console.error('Socket challenge failed:', socketError);
            throw socketError; // This will trigger the fallback
          }
        } else {
          console.log(
            'Using HTTP API for bot challenge (socket not available/connected or not authenticated)',
          );
          throw new Error('Socket not available, using fallback');
        }
      } catch (err) {
        console.log('Attempting HTTP fallback for bot challenge');

        // HTTP API fallback
        try {
          const response = await botService.challengeBot(
            selectedTest.test_id,
            selectedBot.difficultyLevel,
          );

          if (response.success && response.duel) {
            console.log('HTTP bot challenge successful:', response.duel);
            setModalVisible(false);
            resetChallengeState();

            // Navigate to duel room
            router.push({
              pathname: '/duels/[id]' as any,
              params: { id: response.duel.duel_id.toString() },
            });
            return; // Success with HTTP fallback
          } else {
            throw new Error(
              response.message || 'Bot meydan okuması başarısız oldu.',
            );
          }
        } catch (fallbackError) {
          console.error('HTTP fallback also failed:', fallbackError);

          // Handle all errors
          if (fallbackError instanceof ApiError) {
            setError(
              fallbackError.message || 'Bot meydan okuması gönderilemedi.',
            );
          } else {
            setError(
              'Bot meydan okuması gönderilemedi. Lütfen tekrar deneyin.',
            );
          }
        }

        setIsChallenginBot(false);
      }
    } else if (!isBotChallenge && selectedOpponent) {
      // Regular user challenge with auth check
      setIsSubmittingChallenge(true);
      setError(null);

      try {
        const response = await duelService.challengeUser(
          selectedOpponent.id,
          selectedTest.test_id,
        );
        const newDuel = response.duel;
        setModalVisible(false);

        resetChallengeState();

        router.push({
          pathname: '/duels/[id]' as any,
          params: { id: newDuel.duel_id.toString() },
        });
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message || 'Meydan okuma gönderilemedi.');
        } else {
          setError('Bilinmeyen bir hata oluştu.');
        }
      } finally {
        setIsSubmittingChallenge(false);
      }
    }
  };

  const resetChallengeState = () => {
    setSelectedOpponent(null);
    setSelectedBot(null);
    setSelectedCourse(null);
    setSelectedTest(null);
    setIsBotChallenge(false);
    setChallengeStep('selectOpponent');
    setShowWheelForCourse(false);
    setShowWheelForTest(false);
    setError(null);
    setIsChallenginBot(false);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    resetChallengeState();
  };

  // Enhanced retry socket connection
  const retrySocketConnection = async () => {
    if (!connect || !isAuthenticated || !authToken) {
      console.log('Cannot retry socket - not authenticated');
      setSocketError('Not authenticated');
      return;
    }

    setIsConnectingSocket(true);
    setSocketError(null);

    try {
      console.log('Retrying socket connection with auth token...');
      await connect(authToken);
      setSocketConnected(isConnected ? isConnected() : false);
      console.log('Socket reconnection successful');
    } catch (error) {
      console.error('Socket reconnection failed:', error);
      setSocketError(
        error instanceof Error ? error.message : 'Reconnection failed',
      );
    } finally {
      setIsConnectingSocket(false);
    }
  };

  const FilterButton = ({
    filter,
    title,
  }: {
    filter: DuelHubTab;
    title: string;
  }) => (
    <TouchableOpacity
      style={{
        flex: 1,
        marginHorizontal: Spacing[1],
        paddingVertical: Spacing[2],
        paddingHorizontal: Spacing[2],
        borderRadius: BorderRadius.button,
        backgroundColor:
          activeTab === filter
            ? VIBRANT_COLORS.purple
            : isDark
            ? Colors.white
            : Colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 36,
      }}
      onPress={() => setActiveTab(filter)}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: activeTab === filter ? '600' : '500',
          color:
            activeTab === filter
              ? Colors.white
              : isDark
              ? Colors.gray[700]
              : Colors.gray[700],
          textAlign: 'center',
          fontFamily: 'SecondaryFont-Regular',
        }}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  // Enhanced BotListItem with auth checking
  const BotListItem = ({ bot }: { bot: Bot }) => {
    const getDifficultyLabel = (level: number): string => {
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
    };

    const getDifficultyColor = (level: number): string => {
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

    return (
      <PlayfulCard
        style={{
          marginBottom: Spacing[3],
          backgroundColor: 'rgba(255,255,255,0.95)',
        }}
      >
        <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Row style={{ alignItems: 'center', flex: 1 }}>
            <Avatar
              size='md'
              name={bot.avatar}
              bgColor={getDifficultyColor(bot.difficultyLevel)}
              style={{ marginRight: Spacing[3] }}
            />
            <Column style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: Colors.gray[800],
                  fontFamily: 'SecondaryFont-Bold',
                }}
              >
                {bot.botName}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: Colors.gray[600],
                  fontFamily: 'SecondaryFont-Regular',
                }}
              >
                Doğruluk: {(bot.accuracyRate * 100).toFixed(0)}% • Süre:{' '}
                {(bot.avgResponseTime / 1000).toFixed(0)}s
              </Text>
              <Row style={{ alignItems: 'center', marginTop: 4 }}>
                <Badge
                  text={getDifficultyLabel(bot.difficultyLevel)}
                  variant='primary'
                  style={{
                    backgroundColor: getDifficultyColor(bot.difficultyLevel),
                    marginRight: Spacing[2],
                  }}
                  textStyle={{
                    color: Colors.white,
                    fontFamily: 'SecondaryFont-Bold',
                  }}
                />
                {/* Show connection status */}
                {/* <Badge
                  text={socketConnected ? 'Gerçek Zamanlı' : 'Standart'}
                  variant={socketConnected ? 'success' : 'warning'}
                  // style={{ fontSize: 10 }}
                /> */}
              </Row>
            </Column>
          </Row>
          <Button
            title={
              isConnectingSocket
                ? 'Bağlanıyor...'
                : !isAuthenticated
                ? 'Giriş Gerekli'
                : 'Meydan Oku'
            }
            variant='primary'
            size='small'
            onPress={() => handleOpenBotChallengeModal(bot)}
            disabled={isConnectingSocket || !isAuthenticated}
            style={{
              backgroundColor: !isAuthenticated
                ? Colors.gray[500]
                : getDifficultyColor(bot.difficultyLevel),
            }}
            textStyle={{ fontFamily: 'SecondaryFont-Bold' }}
          />
        </Row>
      </PlayfulCard>
    );
  };

  // Enhanced Auth + Socket status component
  // const AuthSocketStatus = () => {
  //   if (!challengeBotViaSocket) return null;

  //   return (
  //     <View
  //       style={{
  //         backgroundColor: 'rgba(255,255,255,0.1)',
  //         borderRadius: BorderRadius.md,
  //         padding: Spacing[2],
  //         marginBottom: Spacing[3],
  //       }}
  //     >
  //       {/* Auth Status */}
  //       {/* <Row style={{ alignItems: 'center', marginBottom: Spacing[1] }}>
  //         <View
  //           style={{
  //             width: 6,
  //             height: 6,
  //             borderRadius: 3,
  //             backgroundColor: isAuthenticated
  //               ? Colors.vibrant.mint
  //               : Colors.vibrant.coral,
  //             marginRight: Spacing[2],
  //           }}
  //         />
  //         <Text
  //           style={{
  //             fontSize: 11,
  //             color: Colors.white,
  //             fontFamily: 'SecondaryFont-Regular',
  //           }}
  //         >
  //           Kimlik:{' '}
  //           {isCheckingAuth
  //             ? 'Kontrol ediliyor...'
  //             : isAuthenticated
  //             ? 'Doğrulandı'
  //             : 'Doğrulanmadı'}
  //         </Text>
  //       </Row> */}

  //       {/* Socket Status */}
  //       <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
  //         <Row style={{ alignItems: 'center', flex: 1 }}>
  //           <View
  //             style={{
  //               width: 6,
  //               height: 6,
  //               borderRadius: 3,
  //               backgroundColor: socketConnected
  //                 ? Colors.vibrant.mint
  //                 : Colors.vibrant.coral,
  //               marginRight: Spacing[2],
  //             }}
  //           />
  //           <Text
  //             style={{
  //               fontSize: 11,
  //               color: Colors.white,
  //               fontFamily: 'SecondaryFont-Regular',
  //             }}
  //           >
  //             {isConnectingSocket
  //               ? 'Bağlanıyor...'
  //               : socketConnected
  //               ? 'Gerçek zamanlı'
  //               : 'Standart mod'}
  //           </Text>
  //         </Row>

  //         {!socketConnected &&
  //           !isConnectingSocket &&
  //           !isCheckingAuth &&
  //           isAuthenticated && (
  //             <TouchableOpacity
  //               onPress={retrySocketConnection}
  //               style={{
  //                 backgroundColor: 'rgba(255,255,255,0.2)',
  //                 borderRadius: BorderRadius.sm,
  //                 paddingHorizontal: Spacing[1],
  //                 paddingVertical: 2,
  //               }}
  //             >
  //               <Text
  //                 style={{
  //                   fontSize: 9,
  //                   color: Colors.white,
  //                   fontFamily: 'SecondaryFont-Bold',
  //                 }}
  //               >
  //                 Yeniden Bağlan
  //               </Text>
  //             </TouchableOpacity>
  //           )}
  //       </Row>

  //       {/* Error display */}
  //       {socketError && (
  //         <Text
  //           style={{
  //             fontSize: 9,
  //             color: Colors.vibrant.coral,
  //             fontFamily: 'SecondaryFont-Regular',
  //             marginTop: 2,
  //           }}
  //         >
  //           {socketError}
  //         </Text>
  //       )}
  //     </View>
  //   );
  // };

  const renderTabContent = () => {
    if (isLoading) {
      return (
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            padding: Spacing[8],
          }}
        >
          <ActivityIndicator
            size='large'
            color={isDark ? Colors.vibrant.coral : Colors.vibrant.coral}
          />
          <Text
            style={{
              marginTop: Spacing[3],
              color: isDark ? Colors.white : Colors.white,
              fontFamily: 'SecondaryFont-Regular',
            }}
          >
            Düello verileri yükleniyor...
          </Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'find':
        return (
          <>
            <SlideInElement delay={0} key={`${activeTab}-search`}>
              <UsernameSearch onChallenge={handleOpenChallengeModal} />
            </SlideInElement>
            <SlideInElement delay={100} key={`${activeTab}-title`}>
              <Text
                style={[
                  globalStyles.textLg,
                  globalStyles.fontSemibold,
                  {
                    color: isDark ? Colors.gray[800] : Colors.gray[800],
                    marginTop: Spacing[6],
                    marginBottom: Spacing[2],
                    fontFamily: 'SecondaryFont-Bold',
                  },
                ]}
              >
                Önerilen Rakipler
              </Text>
            </SlideInElement>
            {recommended.length > 0 ? (
              recommended.map((user, index) => (
                <SlideInElement
                  key={`${activeTab}-rec-${user.id}`}
                  delay={200 + index * 100}
                >
                  <OpponentListItem
                    user={user}
                    onChallenge={handleOpenChallengeModal}
                  />
                </SlideInElement>
              ))
            ) : (
              <SlideInElement delay={200} key={`${activeTab}-empty`}>
                <Paragraph style={{ fontFamily: 'SecondaryFont-Regular' }}>
                  Şu an için önerilen rakip bulunmuyor.
                </Paragraph>
              </SlideInElement>
            )}
          </>
        );
      case 'friends':
        return friends.length > 0 ? (
          friends.map((user, index) => (
            <SlideInElement
              key={`${activeTab}-friend-${user.id}`}
              delay={index * 100}
            >
              <OpponentListItem
                user={user}
                onChallenge={handleOpenChallengeModal}
              />
            </SlideInElement>
          ))
        ) : (
          <SlideInElement delay={0} key={`${activeTab}-empty`}>
            <EmptyState
              icon='users'
              title='Arkadaş Yok'
              message='Düello yapmak için önce arkadaş eklemelisin.'
              fontFamily='SecondaryFont-Regular'
              buttonFontFamily='PrimaryFont'
              titleFontFamily='PrimaryFont'
            />
          </SlideInElement>
        );
      case 'leaderboard':
        return leaderboard.length > 0 ? (
          leaderboard.map((user, index) => (
            <SlideInElement
              key={`${activeTab}-lead-${user.id}`}
              delay={index * 100}
            >
              <OpponentListItem
                user={user}
                onChallenge={handleOpenChallengeModal}
              />
            </SlideInElement>
          ))
        ) : (
          <SlideInElement delay={0} key={`${activeTab}-empty`}>
            <EmptyState
              icon='trophy'
              title='Liderlik Tablosu Boş'
              message='Henüz sıralama oluşmadı.'
            />
          </SlideInElement>
        );
      case 'bots':
        return bots.length > 0 ? (
          <>
            {/* Auth + Socket status indicator */}
            {/* {isAuthenticated && (
              <SlideInElement delay={0} key={`${activeTab}-socket-status`}>
                <AuthSocketStatus />
              </SlideInElement>
            )} */}

            {/* <SlideInElement delay={50} key={`${activeTab}-bot-title`}>
              <Text
                style={[
                  globalStyles.textLg,
                  globalStyles.fontSemibold,
                  {
                    color: isDark ? Colors.gray[800] : Colors.gray[800],
                    marginBottom: Spacing[2],
                    fontFamily: 'SecondaryFont-Bold',
                  },
                ]}
              >
                Botlara Meydan Oku 🤖
              </Text>
              <Paragraph
                style={{
                  fontFamily: 'SecondaryFont-Regular',
                  color: Colors.gray[600],
                  marginBottom: Spacing[4],
                }}
              >
                Zorluk seviyene göre bot seç ve hemen oynamaya başla!
                {isAuthenticated
                  ? socketConnected
                    ? ' ⚡ Gerçek zamanlı düello aktif!'
                    : ' 📡 Standart mod aktif.'
                  : ' 🔒 Giriş yapmanız gerekiyor.'}
              </Paragraph>
            </SlideInElement> */}

            {/* Show authentication warning if not authenticated */}
            {/* {!isAuthenticated && !isCheckingAuth && (
              <SlideInElement delay={100} key={`${activeTab}-auth-warning`}>
                <Alert
                  type='warning'
                  message='Bot meydan okumak için giriş yapmanız gerekiyor.'
                  style={{ marginBottom: Spacing[4] }}
                />
              </SlideInElement>
            )} */}

            {/* Show bots only if authenticated or checking auth */}
            {(isAuthenticated || isCheckingAuth) &&
              bots.map((bot, index) => (
                <SlideInElement
                  key={`${activeTab}-bot-${bot.botId}`}
                  delay={100 + index * 100}
                >
                  <BotListItem bot={bot} />
                </SlideInElement>
              ))}
          </>
        ) : (
          <SlideInElement delay={0} key={`${activeTab}-empty`}>
            <EmptyState
              icon='gears'
              title='Bot Yok'
              message='Şu an kullanılabilir bot bulunmuyor.'
            />
          </SlideInElement>
        );
      default:
        return null;
    }
  };

  const renderChallengeModal = () => {
    const getModalTitle = () => {
      if (isBotChallenge && selectedBot) {
        return `${selectedBot.botName} ile Düello`;
      }
      switch (challengeStep) {
        case 'selectCourse':
          return 'Ders Seçin';
        case 'selectTest':
          return 'Test Seçin';
        case 'confirm':
          return 'Meydan Okumayı Onayla';
        default:
          return 'Meydan Okuma';
      }
    };

    const getOpponentDisplayName = () => {
      if (isBotChallenge && selectedBot) {
        return selectedBot.botName;
      }
      return selectedOpponent?.username || 'Rakip';
    };

    return (
      <Modal
        visible={modalVisible}
        onClose={handleCloseModal}
        title={getModalTitle()}
      >
        <View
          style={{
            backgroundColor: Colors.vibrant.purple,
            padding: Spacing[4],
            minHeight: 300,
          }}
        >
          {/* Opponent Info */}
          <View style={{ marginBottom: Spacing[4] }}>
            <Text
              style={{
                fontSize: 16,
                color: Colors.gray[100],
                fontFamily: 'SecondaryFont-Bold',
                textAlign: 'center',
              }}
            >
              Rakip: {getOpponentDisplayName()}
            </Text>
            {isBotChallenge && selectedBot && (
              <>
                <Text
                  style={{
                    fontSize: 12,
                    color: Colors.gray[300],
                    fontFamily: 'SecondaryFont-Regular',
                    textAlign: 'center',
                    marginTop: 4,
                  }}
                >
                  Zorluk: Seviye {selectedBot.difficultyLevel} • Doğruluk:{' '}
                  {(selectedBot.accuracyRate * 100).toFixed(0)}%
                </Text>
                {/* Auth + Socket status in modal */}
                <Text
                  style={{
                    fontSize: 10,
                    color: socketConnected
                      ? Colors.vibrant.mint
                      : Colors.vibrant.yellow,
                    fontFamily: 'SecondaryFont-Bold',
                    textAlign: 'center',
                    marginTop: 4,
                  }}
                >
                  {socketConnected
                    ? '⚡ Gerçek Zamanlı Mod'
                    : '📡 Standart Mod'}
                </Text>
              </>
            )}
          </View>

          {/* Course Selection Step */}
          {challengeStep === 'selectCourse' && (
            <>
              <Text
                style={{
                  fontSize: 14,
                  lineHeight: 20,
                  color: Colors.gray[300],
                  fontFamily: 'SecondaryFont-Regular',
                  marginBottom: Spacing[4],
                  textAlign: 'center',
                }}
              >
                Önce bir ders seçin veya şansınızı deneyin!
              </Text>

              {showWheelForCourse ? (
                <View
                  style={{
                    alignItems: 'center',
                    paddingVertical: Spacing[4],
                    minHeight: 300,
                    marginBottom: Spacing[4],
                  }}
                >
                  <SpinningWheel
                    items={courses.map((c) => c.title)}
                    onSpinEnd={handleCourseSpinComplete}
                    size={280}
                    spinButtonText='ÇEVİR'
                    sliceFontFamily='PrimaryFont'
                    winnerFontFamily='PrimaryFont'
                    fontFamily='PrimaryFont'
                    showWinnerModal={true}
                    winnerModalDuration={2000}
                    onWinnerModalClose={() => {
                      // Modal automatically closes, course selection happens in handleCourseSpinComplete
                    }}
                  />
                </View>
              ) : (
                <View style={{ marginBottom: Spacing[4] }}>
                  <Picker
                    items={courses.map((c) => ({
                      label: c.title,
                      value: c.course_id,
                    }))}
                    selectedValue={selectedCourse?.course_id || null}
                    onValueChange={(val) => {
                      const course = courses.find((c) => c.course_id === val);
                      if (course) {
                        handleCourseSelected(course);
                      }
                    }}
                    placeholder='Bir Ders Seçin...'
                    enabled={!isLoadingTests}
                    forceLight={true}
                    style={{
                      backgroundColor: Colors.white,
                      borderColor: Colors.gray[300],
                      borderWidth: 2,
                      marginBottom: Spacing[3],
                    }}
                    fontFamily='SecondaryFont-Regular'
                    placeholderFontFamily='SecondaryFont-Regular'
                  />

                  <Button
                    title='Ders İçin Çevir'
                    onPress={() => setShowWheelForCourse(true)}
                    variant='secondary'
                    icon='random'
                    disabled={isLoadingTests}
                    style={{
                      minHeight: 44,
                      backgroundColor: Colors.secondary.DEFAULT,
                      borderRadius: BorderRadius.lg,
                    }}
                    textStyle={{
                      fontFamily: 'SecondaryFont-Bold',
                      fontSize: 16,
                      color: Colors.white,
                    }}
                  />
                </View>
              )}

              {isLoadingTests && (
                <View style={{ alignItems: 'center', marginTop: Spacing[4] }}>
                  <ActivityIndicator size='small' color={Colors.white} />
                  <Text
                    style={{
                      color: Colors.gray[300],
                      fontFamily: 'SecondaryFont-Regular',
                      marginTop: Spacing[2],
                    }}
                  >
                    Testler yükleniyor...
                  </Text>
                </View>
              )}
            </>
          )}

          {/* Test Selection Step */}
          {challengeStep === 'selectTest' && selectedCourse && (
            <>
              <Text
                style={{
                  fontSize: 14,
                  lineHeight: 20,
                  color: Colors.gray[300],
                  fontFamily: 'SecondaryFont-Regular',
                  marginBottom: Spacing[2],
                  textAlign: 'center',
                }}
              >
                Seçilen Ders:{' '}
                <Text style={{ fontWeight: 'bold', color: Colors.gray[100] }}>
                  {selectedCourse.title}
                </Text>
              </Text>

              <Text
                style={{
                  fontSize: 14,
                  lineHeight: 20,
                  color: Colors.gray[300],
                  fontFamily: 'SecondaryFont-Regular',
                  marginBottom: Spacing[4],
                  textAlign: 'center',
                }}
              >
                Şimdi bir test seçin!
              </Text>

              {showWheelForTest ? (
                <View
                  style={{
                    alignItems: 'center',
                    paddingVertical: Spacing[4],
                    minHeight: 300,
                    marginBottom: Spacing[4],
                  }}
                >
                  <SpinningWheel
                    items={tests.map((t) => t.title)}
                    onSpinEnd={handleTestSpinComplete}
                    size={280}
                    spinButtonText='ÇEVİR'
                    sliceFontFamily='PrimaryFont'
                    winnerFontFamily='PrimaryFont'
                    fontFamily='PrimaryFont'
                    showWinnerModal={true}
                    winnerModalDuration={2000}
                    onWinnerModalClose={() => {
                      // Selection happens in handleTestSpinComplete
                    }}
                  />
                </View>
              ) : (
                <View style={{ marginBottom: Spacing[4] }}>
                  <Picker
                    items={tests.map((t) => ({
                      label: t.title,
                      value: t.test_id,
                    }))}
                    selectedValue={selectedTest?.test_id || null}
                    onValueChange={(val) => {
                      const test = tests.find((t) => t.test_id === val);
                      if (test) {
                        setSelectedTest(test);
                        setChallengeStep('confirm');
                      }
                    }}
                    placeholder='Bir Test Seçin...'
                    enabled={true}
                    forceLight={true}
                    style={{
                      backgroundColor: Colors.white,
                      borderColor: Colors.gray[300],
                      borderWidth: 2,
                      marginBottom: Spacing[3],
                    }}
                    fontFamily='SecondaryFont-Regular'
                    placeholderFontFamily='SecondaryFont-Regular'
                  />

                  <Button
                    title='Test İçin Çevir'
                    onPress={() => setShowWheelForTest(true)}
                    variant='secondary'
                    icon='random'
                    style={{
                      minHeight: 44,
                      backgroundColor: Colors.secondary.DEFAULT,
                      borderRadius: BorderRadius.lg,
                    }}
                    textStyle={{
                      fontFamily: 'SecondaryFont-Bold',
                      fontSize: 16,
                      color: Colors.white,
                    }}
                  />

                  <Button
                    title='Geri Dön'
                    onPress={() => setChallengeStep('selectCourse')}
                    variant='outline'
                    style={{
                      marginTop: Spacing[2],
                      borderColor: Colors.white,
                    }}
                    textStyle={{
                      fontFamily: 'SecondaryFont-Regular',
                      color: Colors.white,
                    }}
                  />
                </View>
              )}
            </>
          )}

          {/* Confirmation Step */}
          {challengeStep === 'confirm' && selectedCourse && selectedTest && (
            <>
              <View style={{ marginBottom: Spacing[6] }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: Colors.gray[100],
                    fontFamily: 'SecondaryFont-Bold',
                    textAlign: 'center',
                    marginBottom: Spacing[3],
                  }}
                >
                  {isBotChallenge ? 'Bot Meydan Okuma' : 'Meydan Okuma'} Özeti
                </Text>

                <View
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    padding: Spacing[3],
                    borderRadius: BorderRadius.md,
                  }}
                >
                  <Text
                    style={{
                      color: Colors.gray[200],
                      fontFamily: 'SecondaryFont-Regular',
                      marginBottom: Spacing[1],
                    }}
                  >
                    <Text style={{ fontWeight: 'bold' }}>Rakip:</Text>{' '}
                    {getOpponentDisplayName()}
                  </Text>
                  <Text
                    style={{
                      color: Colors.gray[200],
                      fontFamily: 'SecondaryFont-Regular',
                      marginBottom: Spacing[1],
                    }}
                  >
                    <Text style={{ fontWeight: 'bold' }}>Ders:</Text>{' '}
                    {selectedCourse.title}
                  </Text>
                  <Text
                    style={{
                      color: Colors.gray[200],
                      fontFamily: 'SecondaryFont-Regular',
                      marginBottom: Spacing[1],
                    }}
                  >
                    <Text style={{ fontWeight: 'bold' }}>Test:</Text>{' '}
                    {selectedTest.title}
                  </Text>
                  {isBotChallenge && (
                    <Text
                      style={{
                        color: socketConnected
                          ? Colors.vibrant.mint
                          : Colors.vibrant.yellow,
                        fontFamily: 'SecondaryFont-Bold',
                        fontSize: 12,
                        marginTop: Spacing[1],
                      }}
                    >
                      {socketConnected
                        ? '⚡ Gerçek zamanlı düello'
                        : '📡 Standart düello'}
                    </Text>
                  )}
                </View>
              </View>

              <Button
                title={isBotChallenge ? 'Bota Meydan Oku!' : 'Meydan Oku!'}
                onPress={handleChallengeSubmit}
                loading={isSubmittingChallenge || isChallenginBot}
                disabled={isSubmittingChallenge || isChallenginBot}
                style={{
                  minHeight: 48,
                  backgroundColor: Colors.primary.DEFAULT,
                  borderRadius: BorderRadius.lg,
                  marginBottom: Spacing[2],
                }}
                textStyle={{
                  fontFamily: 'SecondaryFont-Bold',
                  fontSize: 16,
                  color: Colors.white,
                }}
              />

              <Button
                title='Geri Dön'
                onPress={() => setChallengeStep('selectTest')}
                variant='outline'
                disabled={isSubmittingChallenge || isChallenginBot}
                style={{
                  borderColor: Colors.white,
                }}
                textStyle={{
                  fontFamily: 'SecondaryFont-Regular',
                  color: Colors.white,
                }}
              />
            </>
          )}

          {/* Error Display */}
          {error && (
            <View style={{ marginTop: Spacing[3] }}>
              <Alert
                type='error'
                message={error}
                style={{
                  backgroundColor: 'rgba(236, 28, 36, 0.1)',
                  borderColor: Colors.error,
                  borderWidth: 1,
                  borderRadius: BorderRadius.md,
                  margin: 0,
                }}
              />
            </View>
          )}
        </View>
      </Modal>
    );
  };

  // Show loading while checking auth
  if (isCheckingAuth || authLoading) {
    return (
      <Container
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: Spacing[4],
          backgroundColor: '#A29BFE',
        }}
      >
        <ActivityIndicator size='large' color={Colors.white} />
        <Text
          style={{
            marginTop: Spacing[3],
            color: Colors.white,
            fontFamily: 'SecondaryFont-Regular',
            textAlign: 'center',
          }}
        >
          Kimlik doğrulanıyor...
        </Text>
      </Container>
    );
  }

  if (error && !isLoading) {
    return (
      <Container
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: Spacing[4],
          backgroundColor: '#A29BFE',
        }}
      >
        <Alert
          type='error'
          title='Hata'
          message={error}
          style={{ marginBottom: Spacing[4] }}
        />
        <Button
          title='Yenile'
          variant='primary'
          onPress={handleRetry}
          icon='refresh'
        />
      </Container>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: Spacing[4] }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary.DEFAULT}
            colors={[Colors.primary.DEFAULT]}
          />
        }
      >
        {/* Header Section */}
        <SlideInElement delay={0}>
          <PlayfulCard
            style={{ marginBottom: Spacing[6], backgroundColor: 'transparent' }}
          >
            <Row
              style={{ alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Column style={{ flex: 1 }}>
                <PlayfulTitle
                  level={1}
                  gradient='primary'
                  style={{ fontFamily: 'PrimaryFont', color: 'white' }}
                >
                  Yeni Düello ⚔️
                </PlayfulTitle>
                <Paragraph
                  color={isDark ? Colors.gray[100] : Colors.gray[100]}
                  style={{
                    fontFamily: 'SecondaryFont-Regular',
                  }}
                >
                  {isAuthenticated
                    ? 'Rakip seç ve meydan okumaya başla'
                    : 'Meydan okumak için giriş yapın'}
                </Paragraph>
              </Column>
              <Avatar size='md' name='⚔️' bgColor={VIBRANT_COLORS.purple} />
            </Row>
          </PlayfulCard>
        </SlideInElement>

        {/* Filter Buttons */}
        <SlideInElement delay={100}>
          <View style={{ marginBottom: Spacing[6] }}>
            <Row
              style={{
                marginBottom: Spacing[3],
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <FilterButton filter='find' title='Rakip Bul' />
              <FilterButton filter='friends' title='Arkadaşlar' />
              {bots.length > 0 && <FilterButton filter='bots' title='Botlar' />}
              <FilterButton filter='leaderboard' title='Liderlik' />
            </Row>
          </View>
        </SlideInElement>

        {/* Tab Content */}
        <View>
          <FloatingElement>
            <GlassCard
              style={[
                {
                  backgroundColor: Colors.vibrant.orangeLight,
                  marginBottom: Spacing[4],
                  overflow: 'hidden',
                },
              ]}
              animated
            >
              {renderTabContent()}
            </GlassCard>
          </FloatingElement>
        </View>

        {/* Error display at bottom if there's an error but data is loaded */}
        {error && !isLoading && (
          <Alert
            type='warning'
            message='Veriler yenilenirken sorun yaşandı. Çekmek için aşağı kaydırın.'
            style={{ marginTop: Spacing[4] }}
          />
        )}

        {/* Enhanced debug info */}
        {/* {__DEV__ && (
          <View
            style={{
              backgroundColor: 'rgba(0,0,0,0.1)',
              padding: Spacing[2],
              borderRadius: BorderRadius.md,
              marginTop: Spacing[4],
            }}
          >
            <Text
              style={{
                fontSize: 10,
                color: Colors.white,
                fontFamily: 'SecondaryFont-Regular',
              }}
            >
              🔧 Context: User {contextUser ? '✅' : '❌'} | Valid{' '}
              {isSessionValid ? '✅' : '❌'} | Loading{' '}
              {authLoading ? '⏳' : '✅'}
            </Text>
            <Text
              style={{
                fontSize: 10,
                color: Colors.white,
                fontFamily: 'SecondaryFont-Regular',
              }}
            >
              🔧 Local: Auth {isAuthenticated ? '✅' : '❌'} | Socket{' '}
              {socketConnected ? '✅' : '❌'} | Token {authToken ? '✅' : '❌'}
            </Text>
            <Text
              style={{
                fontSize: 10,
                color: Colors.white,
                fontFamily: 'SecondaryFont-Regular',
              }}
            >
              🔧 Error: {socketError || 'None'}
            </Text>
          </View>
        )} */}

        {/* Bottom spacing to ensure content is fully visible */}
        <View style={{ height: Spacing[8] }} />
      </ScrollView>

      {/* Challenge Modal */}
      {renderChallengeModal()}
    </View>
  );
}

const UsernameSearch = ({
  onChallenge,
}: {
  onChallenge: (user: Opponent) => void;
}) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!username.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const opponent = await userService.searchUserByUsername(username.trim());
      if (opponent) {
        onChallenge(opponent);
      } else {
        setError(`'${username}' bulunamadı.`);
      }
    } catch (err) {
      setError('Arama sırasında hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ marginTop: Spacing[4] }}>
      <Input
        placeholder='Kullanıcı adı ile ara'
        value={username}
        onChangeText={setUsername}
        autoCapitalize='none'
        disabled={loading}
        inputStyle={{ fontFamily: 'PrimaryFont' }}
      />
      <Button
        title='Ara ve Meydan Oku'
        onPress={handleSearch}
        loading={loading}
        style={{ marginTop: Spacing[2] }}
        textStyle={{ fontFamily: 'SecondaryFont-Bold' }}
      />
      {error && (
        <Alert type='error' message={error} style={{ marginTop: Spacing[2] }} />
      )}
    </Card>
  );
};
