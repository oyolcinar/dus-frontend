// app/(tabs)/duels/new.tsx - Optimized for performance
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Platform, ActionSheetIOS, StyleSheet } from 'react-native';
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
import { Bot } from '../../../src/api/botService';
import { globalStyles } from '../../../utils/styleUtils';
import { useAuth } from '../../../context/AuthContext';
import {
  usePreferredCourse,
  PreferredCourseProvider,
} from '../../../context/PreferredCourseContext';

// Performance optimized shadow configuration
const OPTIMIZED_SHADOW = {
  // shadowColor: Colors.gray[900],
  // shadowOffset: { width: 2, height: 4 },
  // shadowOpacity: 0.3,
  // shadowRadius: 4,
  // elevation: 4,
};

// Socket service imports - handle gracefully if not available
let challengeBotViaSocket:
  | ((testId: number, difficulty: number) => Promise<void>)
  | undefined;
let challengeBotWithCourse:
  | ((courseId: number, difficulty: number) => Promise<void>)
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
  challengeBotWithCourse = socketService.challengeBotWithCourse;
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
type ChallengeStep = 'selectOpponent' | 'selectCourse' | 'confirm';

// Memoized components for better performance
const FilterButton = React.memo(
  ({
    filter,
    title,
    activeTab,
    contextColor,
    isDark,
    onPress,
  }: {
    filter: DuelHubTab;
    title: string;
    activeTab: DuelHubTab;
    contextColor: string;
    isDark: boolean;
    onPress: (filter: DuelHubTab) => void;
  }) => {
    const handlePress = useCallback(() => {
      onPress(filter);
    }, [filter, onPress]);

    return (
      <TouchableOpacity
        style={[
          styles.filterButton,
          {
            backgroundColor: activeTab === filter ? contextColor : Colors.white,
          },
        ]}
        onPress={handlePress}
      >
        <Text
          style={[
            styles.filterButtonText,
            {
              fontWeight: activeTab === filter ? '600' : '500',
              color:
                activeTab === filter
                  ? Colors.white
                  : isDark
                    ? Colors.gray[700]
                    : Colors.gray[700],
            },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {title}
        </Text>
      </TouchableOpacity>
    );
  },
);

const BotListItem = React.memo(
  ({
    bot,
    contextColor,
    isConnectingSocket,
    isAuthenticated,
    onChallenge,
  }: {
    bot: Bot;
    contextColor: string;
    isConnectingSocket: boolean;
    isAuthenticated: boolean;
    onChallenge: (bot: Bot) => void;
  }) => {
    const difficultyInfo = useMemo(() => {
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
            return contextColor;
          default:
            return Colors.gray[500];
        }
      };

      return {
        label: getDifficultyLabel(bot.difficultyLevel),
        color: getDifficultyColor(bot.difficultyLevel),
      };
    }, [bot.difficultyLevel, contextColor]);

    const handlePress = useCallback(() => {
      onChallenge(bot);
    }, [bot, onChallenge]);

    const buttonTitle = useMemo(() => {
      if (isConnectingSocket) return 'Bağlanıyor...';
      if (!isAuthenticated) return 'Giriş Gerekli';
      return 'Meydan Oku';
    }, [isConnectingSocket, isAuthenticated]);

    return (
      <View style={styles.listItemContainer}>
        <PlayfulCard style={styles.botCard}>
          <Row style={styles.listItemRow}>
            <Row style={styles.listItemLeft}>
              <Column style={styles.listItemInfo}>
                <Text style={styles.botName}>{bot.botName}</Text>
                <Text style={styles.botStats}>
                  Doğruluk: {(bot.accuracyRate * 100).toFixed(0)}% • Süre:{' '}
                  {(bot.avgResponseTime / 1000).toFixed(0)}s
                </Text>
                <Row style={styles.badgeRow}>
                  <Badge
                    text={difficultyInfo.label}
                    variant='primary'
                    style={[
                      styles.difficultyBadge,
                      { backgroundColor: difficultyInfo.color },
                    ]}
                    textStyle={styles.badgeText}
                  />
                </Row>
              </Column>
            </Row>
            <Button
              title={buttonTitle}
              variant='primary'
              size='small'
              onPress={handlePress}
              disabled={isConnectingSocket || !isAuthenticated}
              style={[
                styles.challengeButton,
                {
                  backgroundColor: !isAuthenticated
                    ? Colors.gray[500]
                    : difficultyInfo.color,
                },
              ]}
              textStyle={styles.challengeButtonText}
            />
          </Row>
        </PlayfulCard>
      </View>
    );
  },
);

const StyledOpponentListItem = React.memo(
  ({
    opponent,
    isAuthenticated,
    onChallenge,
  }: {
    opponent: Opponent;
    isAuthenticated: boolean;
    onChallenge: (opponent: Opponent) => void;
  }) => {
    const handlePress = useCallback(() => {
      onChallenge(opponent);
    }, [opponent, onChallenge]);

    const buttonTitle = useMemo(() => {
      return !isAuthenticated ? 'Giriş Gerekli' : 'Meydan Oku';
    }, [isAuthenticated]);

    return (
      <View style={styles.listItemContainer}>
        <PlayfulCard style={styles.opponentCard}>
          <Row style={styles.listItemRow}>
            <Row style={styles.listItemLeft}>
              <Column style={styles.listItemInfo}>
                <Text style={styles.opponentName}>{opponent.username}</Text>
                <Text style={styles.opponentStats}>
                  Kazanma Oranı: {((opponent.winRate || 0) * 100).toFixed(0)}%
                </Text>
              </Column>
            </Row>
            <Button
              title={buttonTitle}
              variant='primary'
              size='small'
              onPress={handlePress}
              disabled={!isAuthenticated}
              style={[
                styles.challengeButton,
                {
                  backgroundColor: !isAuthenticated
                    ? Colors.gray[500]
                    : Colors.vibrant.coral,
                },
              ]}
              textStyle={styles.challengeButtonText}
            />
          </Row>
        </PlayfulCard>
      </View>
    );
  },
);

const UsernameSearch = React.memo(
  ({
    onChallenge,
    contextColor,
  }: {
    onChallenge: (user: Opponent) => void;
    contextColor: string;
  }) => {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = useCallback(async () => {
      if (!username.trim()) return;
      setLoading(true);
      setError(null);

      try {
        const opponent = await userService.searchUserByUsername(
          username.trim(),
        );
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
    }, [username, onChallenge]);

    return (
      <Card style={styles.searchCard}>
        <Input
          placeholder='Kullanıcı adı ile ara'
          value={username}
          onChangeText={setUsername}
          autoCapitalize='none'
          disabled={loading}
          inputStyle={styles.searchInput}
        />
        <Button
          title='Ara ve Meydan Oku'
          onPress={handleSearch}
          loading={loading}
          style={[styles.searchButton, { backgroundColor: contextColor }]}
          textStyle={styles.searchButtonText}
        />
        {error && (
          <Alert type='error' message={error} style={styles.searchError} />
        )}
      </Card>
    );
  },
);

// Main New Duel Screen Component (wrapped with context)
function NewDuelScreenContent() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const {
    user: contextUser,
    isLoading: authLoading,
    isSessionValid,
  } = useAuth();

  const {
    preferredCourse,
    isLoading: courseLoading,
    getCourseColor,
  } = usePreferredCourse();

  // Memoized context color to prevent unnecessary re-renders
  const contextColor = useMemo(() => {
    return (
      (preferredCourse as any)?.category &&
      getCourseColor((preferredCourse as any).category)
    );
  }, [preferredCourse, getCourseColor]);

  // Main state
  const [activeTab, setActiveTab] = useState<DuelHubTab>('find');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data state
  const [courses, setCourses] = useState<Course[]>([]);
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

  // UI state
  const [showWheelForCourse, setShowWheelForCourse] = useState(false);
  const [isSubmittingChallenge, setIsSubmittingChallenge] = useState(false);
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

  // Memoized styles that depend on theme
  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        loadingText: {
          marginTop: Spacing[3],
          color: isDark ? Colors.white : Colors.white,
          fontFamily: 'SecondaryFont-Regular',
        },
        authLoadingText: {
          marginTop: Spacing[3],
          color: Colors.white,
          fontFamily: 'SecondaryFont-Regular',
          textAlign: 'center',
        },
        headerTitle: {
          fontFamily: 'PrimaryFont',
          color: Colors.gray[900],
        },
        headerSubtitle: {
          color: isDark ? Colors.gray[700] : Colors.gray[700],
          fontFamily: 'SecondaryFont-Regular',
        },
        sectionTitle: {
          color: isDark ? Colors.white : Colors.white,
          marginTop: Spacing[6],
          marginBottom: Spacing[2],
          fontFamily: 'SecondaryFont-Bold',
        },
        emptyText: {
          fontFamily: 'SecondaryFont-Regular',
        },
      }),
    [isDark],
  );

  // Enhanced auth + socket initialization
  useEffect(() => {
    let isMounted = true;

    const checkAuthAndInitSocket = async () => {
      try {
        if (!isMounted) return;
        setIsCheckingAuth(true);

        if (authLoading) {
          console.log('Auth context still loading, waiting...');
          return;
        }

        if (!contextUser || !isSessionValid) {
          console.log('User not authenticated via context');
          if (isMounted) {
            setIsAuthenticated(false);
            setAuthToken(null);
            setSocketConnected(false);
            setIsCheckingAuth(false);
          }
          return;
        }

        const [authStorageToken, userStorageToken] = await Promise.all([
          AsyncStorage.getItem('authToken'),
          AsyncStorage.getItem('userToken'),
        ]);

        if (!authStorageToken && !userStorageToken) {
          console.log('No auth tokens found in storage');
          if (isMounted) {
            setIsAuthenticated(false);
            setAuthToken(null);
            setSocketConnected(false);
            setIsCheckingAuth(false);
          }
          return;
        }

        const effectiveToken = authStorageToken || userStorageToken;
        if (userStorageToken && !authStorageToken) {
          await AsyncStorage.setItem('authToken', userStorageToken);
          console.log('Synced authToken for socket service');
        }

        if (isMounted) {
          setAuthToken(effectiveToken);
          setIsAuthenticated(true);
        }

        console.log('User authenticated, initializing socket connection...', {
          user: contextUser.username,
          hasToken: !!effectiveToken,
        });

        if (initializeSocket && isConnected) {
          try {
            if (isMounted) {
              setIsConnectingSocket(true);
              setSocketError(null);
            }
            await initializeSocket();
            if (isMounted) {
              setSocketConnected(isConnected());
            }
            console.log('Socket initialized successfully:', isConnected());
          } catch (error) {
            console.warn(
              'Failed to initialize socket (but user is authenticated):',
              error,
            );
            if (isMounted) {
              setSocketConnected(false);
              setSocketError(
                error instanceof Error ? error.message : 'Connection failed',
              );
            }
          } finally {
            if (isMounted) {
              setIsConnectingSocket(false);
            }
          }
        } else {
          console.log('Socket service not available, will use HTTP fallback');
          if (isMounted) {
            setSocketConnected(false);
          }
        }
      } catch (error) {
        console.error('Error during auth check:', error);
        if (isMounted) {
          setIsAuthenticated(false);
          setAuthToken(null);
          setSocketConnected(false);
          setSocketError('Authentication check failed');
        }
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      }
    };

    checkAuthAndInitSocket();

    return () => {
      isMounted = false;
    };
  }, [contextUser, isSessionValid, authLoading]);

  // Reset challenge state function
  const resetChallengeState = useCallback(() => {
    setSelectedOpponent(null);
    setSelectedBot(null);
    setSelectedCourse(null);
    setIsBotChallenge(false);
    setChallengeStep('selectOpponent');
    setShowWheelForCourse(false);
    setError(null);
    setIsChallenginBot(false);
  }, []);

  // Handle modal close
  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    resetChallengeState();
  }, [resetChallengeState]);

  const fetchData = useCallback(async () => {
    try {
      setError(null);

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
          winRate: f.winRate || 0,
        })),
      );

      setLeaderboard(
        leaderboardData.leaderboard.map((u: any) => ({
          id: u.userId,
          username: u.username,
          winRate: u.winRate,
        })),
      );

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
    let isMounted = true;

    const initialFetch = async () => {
      if (!isMounted) return;

      setIsLoading(true);
      await fetchData();
      if (isMounted) {
        setIsLoading(false);
      }
    };

    initialFetch();

    return () => {
      isMounted = false;
    };
  }, [fetchData]);
  // Socket event listeners for bot challenges
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
          pathname: '/(tabs)/duels/[id]' as any,
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
  }, [router, resetChallengeState]);

  // Memoized challenge handlers
  const handleOpenChallengeModal = useCallback(
    (opponent: Opponent) => {
      if (!isAuthenticated) {
        setError('Meydan okumak için giriş yapmanız gerekiyor.');
        return;
      }

      setSelectedOpponent(opponent);
      setSelectedBot(null);
      setSelectedCourse(null);
      setIsBotChallenge(false);
      setChallengeStep('selectCourse');
      setShowWheelForCourse(false);
      setModalVisible(true);
    },
    [isAuthenticated],
  );

  const handleOpenBotChallengeModal = useCallback(
    (bot: Bot) => {
      if (!isAuthenticated) {
        setError('Bot meydan okumak için giriş yapmanız gerekiyor.');
        return;
      }

      setSelectedBot(bot);
      setSelectedOpponent(null);
      setSelectedCourse(null);
      setIsBotChallenge(true);
      setChallengeStep('selectCourse');
      setShowWheelForCourse(false);
      setModalVisible(true);
    },
    [isAuthenticated],
  );

  const handleCourseSpinComplete = useCallback(
    (courseName: string, index: number) => {
      const winningCourse = courses[index];
      if (winningCourse) {
        handleCourseSelected(winningCourse);
      }
      setShowWheelForCourse(false);
    },
    [courses],
  );

  const handleCourseSelected = useCallback(async (course: Course) => {
    setSelectedCourse(course);
    setError(null);
    setChallengeStep('confirm');
  }, []);

  // Memoized tab change handler
  const handleTabChange = useCallback((tab: DuelHubTab) => {
    setActiveTab(tab);
  }, []);

  const handleChallengeSubmit = useCallback(async () => {
    if (!selectedCourse) {
      setError('Ders seçilmedi.');
      return;
    }

    if (!isAuthenticated || !authToken || !contextUser || !isSessionValid) {
      setError(
        'Oturum süresi dolmuş. Lütfen uygulamayı yeniden başlatın veya tekrar giriş yapın.',
      );
      return;
    }

    if (isBotChallenge && selectedBot) {
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
          courseId: selectedCourse.course_id,
          difficulty: selectedBot.difficultyLevel,
        });

        if (shouldUseSocket) {
          console.log('Using socket-based bot challenge with course');
          try {
            await challengeBotWithCourse!(
              selectedCourse.course_id,
              selectedBot.difficultyLevel,
            );
            console.log('Socket course-based bot challenge sent successfully');
          } catch (socketError) {
            console.error('Socket challenge failed:', socketError);
            throw socketError;
          }
        } else {
          console.log(
            'Using HTTP API for bot challenge (socket not available/connected)',
          );
          throw new Error('Socket not available, using fallback');
        }
      } catch (err) {
        console.log('Attempting HTTP fallback for bot challenge');

        try {
          const response = await botService.challengeBotWithCourse(
            selectedCourse.course_id,
            selectedBot.difficultyLevel,
          );

          if (response.success && response.duel) {
            console.log(
              'HTTP course-based bot challenge successful:',
              response.duel,
            );
            setModalVisible(false);
            resetChallengeState();

            router.push({
              pathname: '/duels/[id]' as any,
              params: { id: response.duel.duel_id.toString() },
            });
            return;
          } else {
            throw new Error(
              response.message || 'Bot meydan okuması başarısız oldu.',
            );
          }
        } catch (fallbackError) {
          console.error('HTTP fallback also failed:', fallbackError);

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
      setIsSubmittingChallenge(true);
      setError(null);

      try {
        const response = await duelService.challengeUserWithCourse(
          selectedOpponent.id,
          selectedCourse.course_id,
          5,
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
  }, [
    selectedCourse,
    isAuthenticated,
    authToken,
    contextUser,
    isSessionValid,
    isBotChallenge,
    selectedBot,
    selectedOpponent,
    socketConnected,
    resetChallengeState,
    router,
  ]);

  const retrySocketConnection = useCallback(async () => {
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
  }, [connect, isAuthenticated, authToken]);

  const renderTabContent = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={contextColor} />
          <Text style={dynamicStyles.loadingText}>
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
              <UsernameSearch
                onChallenge={handleOpenChallengeModal}
                contextColor={contextColor}
              />
            </SlideInElement>
            <SlideInElement delay={100} key={`${activeTab}-title`}>
              <Text
                style={[
                  globalStyles.textLg,
                  globalStyles.fontSemibold,
                  dynamicStyles.sectionTitle,
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
                  <StyledOpponentListItem
                    opponent={user}
                    isAuthenticated={isAuthenticated}
                    onChallenge={handleOpenChallengeModal}
                  />
                </SlideInElement>
              ))
            ) : (
              <SlideInElement delay={200} key={`${activeTab}-empty`}>
                <Paragraph style={dynamicStyles.emptyText}>
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
              <StyledOpponentListItem
                opponent={user}
                isAuthenticated={isAuthenticated}
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
              <StyledOpponentListItem
                opponent={user}
                isAuthenticated={isAuthenticated}
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
            {(isAuthenticated || isCheckingAuth) &&
              bots.map((bot, index) => (
                <SlideInElement
                  key={`${activeTab}-bot-${bot.botId}`}
                  delay={100 + index * 100}
                >
                  <BotListItem
                    bot={bot}
                    contextColor={contextColor}
                    isConnectingSocket={isConnectingSocket}
                    isAuthenticated={isAuthenticated}
                    onChallenge={handleOpenBotChallengeModal}
                  />
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
  }, [
    isLoading,
    activeTab,
    contextColor,
    recommended,
    friends,
    leaderboard,
    bots,
    isAuthenticated,
    isCheckingAuth,
    isConnectingSocket,
    handleOpenChallengeModal,
    handleOpenBotChallengeModal,
    dynamicStyles,
  ]);

  const getModalTitle = useCallback(() => {
    if (isBotChallenge && selectedBot) {
      return `${selectedBot.botName} ile Düello`;
    }
    switch (challengeStep) {
      case 'selectCourse':
        return 'Ders Seçin';
      case 'confirm':
        return 'Meydan Okumayı Onayla';
      default:
        return 'Meydan Okuma';
    }
  }, [isBotChallenge, selectedBot, challengeStep]);

  const getOpponentDisplayName = useCallback(() => {
    if (isBotChallenge && selectedBot) {
      return selectedBot.botName;
    }
    return selectedOpponent?.username || 'Rakip';
  }, [isBotChallenge, selectedBot, selectedOpponent]);

  const renderChallengeModal = useCallback(() => {
    return (
      <Modal
        visible={modalVisible}
        onClose={handleCloseModal}
        title={getModalTitle()}
      >
        <View style={[styles.modalContent, { backgroundColor: contextColor }]}>
          {/* Opponent Info */}
          <View style={styles.opponentInfo}>
            <Text style={styles.opponentTitle}>
              Rakip: {getOpponentDisplayName()}
            </Text>
            {isBotChallenge && selectedBot && (
              <>
                <Text style={styles.botDetails}>
                  Zorluk: Seviye {selectedBot.difficultyLevel} • Doğruluk:{' '}
                  {(selectedBot.accuracyRate * 100).toFixed(0)}%
                </Text>
                <Text
                  style={[
                    styles.connectionStatus,
                    {
                      color: socketConnected
                        ? Colors.vibrant.mint
                        : Colors.vibrant.yellow,
                    },
                  ]}
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
              <Text style={styles.courseDescription}>
                Bir ders seçin! Seçilen dersten 5 rastgele soru gelecek.
              </Text>

              {showWheelForCourse ? (
                <View style={styles.wheelContainer}>
                  <SpinningWheel
                    items={courses.map((c) => c.nicknames || c.title)}
                    onSpinEnd={handleCourseSpinComplete}
                    size={280}
                    spinButtonText='ÇEVİR'
                    sliceFontFamily='PrimaryFont'
                    winnerFontFamily='PrimaryFont'
                    fontFamily='PrimaryFont'
                    showWinnerModal={true}
                    winnerModalDuration={2000}
                    onWinnerModalClose={() => {}}
                  />
                </View>
              ) : (
                <View style={styles.courseSelectionContainer}>
                  {Platform.OS === 'ios' ? (
                    <TouchableOpacity
                      style={styles.iosCoursePicker}
                      onPress={() => {
                        const options = [
                          'İptal',
                          ...courses.map((c) => c.title),
                        ];

                        ActionSheetIOS.showActionSheetWithOptions(
                          {
                            options,
                            cancelButtonIndex: 0,
                            title: 'Bir Ders Seçin',
                            message: 'Bu dersten 5 rastgele soru gelecek',
                          },
                          (buttonIndex) => {
                            if (buttonIndex > 0) {
                              const selectedCourse = courses[buttonIndex - 1];
                              if (selectedCourse) {
                                handleCourseSelected(selectedCourse);
                              }
                            }
                          },
                        );
                      }}
                    >
                      <Text style={styles.iosPickerText}>
                        {selectedCourse
                          ? selectedCourse.title
                          : 'Bir Ders Seçin...'}
                      </Text>
                      <View style={styles.iosPickerChevron}>
                        <FontAwesome
                          name='chevron-down'
                          size={12}
                          color={Colors.gray[600]}
                        />
                      </View>
                    </TouchableOpacity>
                  ) : (
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
                      enabled={true}
                      forceLight={true}
                      style={styles.androidPicker}
                      fontFamily='SecondaryFont-Regular'
                      placeholderFontFamily='SecondaryFont-Regular'
                    />
                  )}

                  <Button
                    title='Ders İçin Çevir'
                    onPress={() => setShowWheelForCourse(true)}
                    variant='secondary'
                    icon='random'
                    disabled={false}
                    style={styles.spinButton}
                    textStyle={styles.spinButtonText}
                  />
                </View>
              )}
            </>
          )}

          {/* Confirmation Step */}
          {challengeStep === 'confirm' && selectedCourse && (
            <>
              <View style={styles.confirmationContainer}>
                <Text style={styles.confirmationTitle}>
                  {isBotChallenge ? 'Bot Meydan Okuma' : 'Meydan Okuma'} Özeti
                </Text>

                <View style={styles.summaryCard}>
                  <Text style={styles.summaryText}>
                    <Text style={styles.summaryLabel}>Rakip:</Text>{' '}
                    {getOpponentDisplayName()}
                  </Text>
                  <Text style={styles.summaryText}>
                    <Text style={styles.summaryLabel}>Ders:</Text>{' '}
                    {selectedCourse.title}
                  </Text>
                  <Text style={styles.summaryText}>
                    <Text style={styles.summaryLabel}>Soru Sayısı:</Text> 5
                    Rastgele Soru
                  </Text>
                  {isBotChallenge && (
                    <Text
                      style={[
                        styles.summaryConnection,
                        {
                          color: socketConnected
                            ? Colors.vibrant.mint
                            : Colors.vibrant.yellow,
                        },
                      ]}
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
                style={styles.submitButton}
                textStyle={styles.submitButtonText}
              />

              <Button
                title='Geri Dön'
                onPress={() => setChallengeStep('selectCourse')}
                variant='outline'
                disabled={isSubmittingChallenge || isChallenginBot}
                style={styles.backButton}
                textStyle={styles.backButtonText}
              />
            </>
          )}

          {/* Error Display */}
          {error && (
            <View style={styles.errorContainer}>
              <Alert type='error' message={error} style={styles.errorAlert} />
            </View>
          )}
        </View>
      </Modal>
    );
  }, [
    modalVisible,
    handleCloseModal,
    getModalTitle,
    contextColor,
    getOpponentDisplayName,
    isBotChallenge,
    selectedBot,
    socketConnected,
    challengeStep,
    showWheelForCourse,
    courses,
    handleCourseSpinComplete,
    selectedCourse,
    handleCourseSelected,
    isSubmittingChallenge,
    isChallenginBot,
    handleChallengeSubmit,
    error,
  ]);

  // Show loading while checking auth
  if (isCheckingAuth || authLoading) {
    return (
      <Container
        style={[styles.authLoadingContainer, { backgroundColor: contextColor }]}
      >
        <ActivityIndicator size='large' color={Colors.white} />
        <Text style={dynamicStyles.authLoadingText}>
          Kimlik doğrulanıyor...
        </Text>
      </Container>
    );
  }

  if (error && !isLoading) {
    return (
      <Container
        style={[styles.errorScreenContainer, { backgroundColor: contextColor }]}
      >
        <Alert
          type='error'
          title='Hata'
          message={error}
          style={styles.errorScreenAlert}
        />
        <Button
          title='Yenile'
          variant='primary'
          onPress={handleRetry}
          icon='refresh'
          style={styles.retryButton}
          textStyle={[styles.retryButtonText, { color: contextColor }]}
        />
      </Container>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={contextColor}
            colors={[contextColor]}
          />
        }
      >
        {/* Header Section */}
        <SlideInElement delay={0}>
          <PlayfulCard style={styles.headerCard}>
            <Row style={styles.headerRow}>
              <Column style={styles.headerColumn}>
                <PlayfulTitle
                  level={1}
                  gradient='primary'
                  style={dynamicStyles.headerTitle}
                >
                  Yeni Düello ⚔️
                </PlayfulTitle>
                <Paragraph style={dynamicStyles.headerSubtitle}>
                  {isAuthenticated
                    ? 'Rakip seç ve meydan okumaya başla'
                    : 'Meydan okumak için giriş yapın'}
                </Paragraph>
              </Column>
            </Row>
          </PlayfulCard>
        </SlideInElement>

        {/* Filter Buttons */}
        <SlideInElement delay={100}>
          <View style={styles.filterContainer}>
            <Row style={styles.filterRow}>
              <FilterButton
                filter='find'
                title='Rakip Bul'
                activeTab={activeTab}
                contextColor={contextColor}
                isDark={isDark}
                onPress={handleTabChange}
              />
              <FilterButton
                filter='friends'
                title='Arkadaşlar'
                activeTab={activeTab}
                contextColor={contextColor}
                isDark={isDark}
                onPress={handleTabChange}
              />
              {bots.length > 0 && (
                <FilterButton
                  filter='bots'
                  title='Botlar'
                  activeTab={activeTab}
                  contextColor={contextColor}
                  isDark={isDark}
                  onPress={handleTabChange}
                />
              )}
              <FilterButton
                filter='leaderboard'
                title='Liderlik'
                activeTab={activeTab}
                contextColor={contextColor}
                isDark={isDark}
                onPress={handleTabChange}
              />
            </Row>
          </View>
        </SlideInElement>

        {/* Tab Content */}
        <View>
          <FloatingElement>
            <GlassCard
              style={[styles.tabContent, { backgroundColor: contextColor }]}
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
            style={styles.bottomError}
          />
        )}

        {/* Bottom spacing to ensure content is fully visible */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Challenge Modal */}
      {renderChallengeModal()}
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing[4],
  },
  headerCard: {
    marginBottom: Spacing[6],
    backgroundColor: 'transparent',
  },
  headerRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerColumn: {
    flex: 1,
  },
  filterContainer: {
    marginBottom: Spacing[6],
  },
  filterRow: {
    marginBottom: Spacing[3],
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterButton: {
    flex: 1,
    marginHorizontal: Spacing[1],
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[2],
    borderRadius: BorderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    ...OPTIMIZED_SHADOW,
  },
  filterButtonText: {
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'SecondaryFont-Regular',
  },
  tabContent: {
    marginBottom: Spacing[4],
    overflow: 'hidden',
    ...OPTIMIZED_SHADOW,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing[8],
  },
  listItemContainer: {
    ...OPTIMIZED_SHADOW,
  },
  botCard: {
    marginBottom: Spacing[3],
    backgroundColor: 'rgba(255,255,255,0.95)',
    ...OPTIMIZED_SHADOW,
  },
  opponentCard: {
    marginBottom: Spacing[3],
    backgroundColor: 'rgba(255,255,255,0.95)',
    ...OPTIMIZED_SHADOW,
  },
  listItemRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listItemLeft: {
    alignItems: 'center',
    flex: 1,
  },
  listItemInfo: {
    flex: 1,
  },
  botName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.gray[800],
    fontFamily: 'SecondaryFont-Bold',
  },
  botStats: {
    fontSize: 12,
    color: Colors.gray[600],
    fontFamily: 'SecondaryFont-Regular',
  },
  opponentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.gray[800],
    fontFamily: 'SecondaryFont-Bold',
  },
  opponentStats: {
    fontSize: 12,
    color: Colors.gray[600],
    fontFamily: 'SecondaryFont-Regular',
  },
  badgeRow: {
    alignItems: 'center',
    marginTop: 4,
  },
  difficultyBadge: {
    marginRight: Spacing[2],
  },
  badgeText: {
    color: Colors.white,
    fontFamily: 'SecondaryFont-Bold',
  },
  challengeButton: {
    // backgroundColor set dynamically
  },
  challengeButtonText: {
    fontFamily: 'SecondaryFont-Bold',
  },
  searchCard: {
    marginTop: Spacing[4],
    ...OPTIMIZED_SHADOW,
  },
  searchInput: {
    fontFamily: 'PrimaryFont',
  },
  searchButton: {
    marginTop: Spacing[2],
    // backgroundColor set dynamically
  },
  searchButtonText: {
    fontFamily: 'SecondaryFont-Bold',
    color: Colors.white,
  },
  searchError: {
    marginTop: Spacing[2],
  },
  modalContent: {
    padding: Spacing[4],
    minHeight: 300,
  },
  opponentInfo: {
    marginBottom: Spacing[4],
  },
  opponentTitle: {
    fontSize: 16,
    color: Colors.gray[100],
    fontFamily: 'SecondaryFont-Bold',
    textAlign: 'center',
  },
  botDetails: {
    fontSize: 12,
    color: Colors.gray[300],
    fontFamily: 'SecondaryFont-Regular',
    textAlign: 'center',
    marginTop: 4,
  },
  connectionStatus: {
    fontSize: 10,
    fontFamily: 'SecondaryFont-Bold',
    textAlign: 'center',
    marginTop: 4,
  },
  courseDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.gray[300],
    fontFamily: 'SecondaryFont-Regular',
    marginBottom: Spacing[4],
    textAlign: 'center',
  },
  wheelContainer: {
    alignItems: 'center',
    paddingVertical: Spacing[4],
    minHeight: 300,
    marginBottom: Spacing[4],
  },
  courseSelectionContainer: {
    marginBottom: Spacing[4],
  },
  iosCoursePicker: {
    backgroundColor: Colors.white,
    borderColor: Colors.gray[300],
    borderWidth: 2,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[3],
    marginBottom: Spacing[3],
    minHeight: 44,
    justifyContent: 'center',
  },
  iosPickerText: {
    fontSize: 16,
    fontFamily: 'SecondaryFont-Regular',
  },
  iosPickerChevron: {
    position: 'absolute',
    right: Spacing[3],
    top: '50%',
    transform: [{ translateY: -6 }],
  },
  androidPicker: {
    backgroundColor: Colors.white,
    borderColor: Colors.gray[300],
    borderWidth: 2,
    marginBottom: Spacing[3],
  },
  spinButton: {
    minHeight: 44,
    backgroundColor: Colors.vibrant.purple,
    borderRadius: BorderRadius.lg,
  },
  spinButtonText: {
    fontFamily: 'SecondaryFont-Bold',
    fontSize: 16,
    color: Colors.white,
  },
  confirmationContainer: {
    marginBottom: Spacing[6],
  },
  confirmationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.gray[100],
    fontFamily: 'SecondaryFont-Bold',
    textAlign: 'center',
    marginBottom: Spacing[3],
  },
  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: Spacing[3],
    borderRadius: BorderRadius.md,
  },
  summaryText: {
    color: Colors.gray[200],
    fontFamily: 'SecondaryFont-Regular',
    marginBottom: Spacing[1],
  },
  summaryLabel: {
    fontWeight: 'bold',
  },
  summaryConnection: {
    fontFamily: 'SecondaryFont-Bold',
    fontSize: 12,
    marginTop: Spacing[1],
  },
  submitButton: {
    minHeight: 48,
    backgroundColor: Colors.vibrant.purple,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing[2],
  },
  submitButtonText: {
    fontFamily: 'SecondaryFont-Bold',
    fontSize: 16,
    color: Colors.white,
  },
  backButton: {
    borderColor: Colors.white,
  },
  backButtonText: {
    fontFamily: 'SecondaryFont-Regular',
    color: Colors.white,
  },
  errorContainer: {
    marginTop: Spacing[3],
  },
  errorAlert: {
    backgroundColor: 'rgba(236, 28, 36, 0.1)',
    borderColor: Colors.error,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    margin: 0,
  },
  authLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[4],
  },
  errorScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[4],
  },
  errorScreenAlert: {
    marginBottom: Spacing[4],
  },
  retryButton: {
    backgroundColor: Colors.white,
  },
  retryButtonText: {
    // color set dynamically
  },
  bottomError: {
    marginTop: Spacing[4],
  },
  bottomSpacing: {
    height: Spacing[8],
  },
});

// Main component with context provider
export default function NewDuelScreen() {
  return (
    <PreferredCourseProvider>
      <NewDuelScreenContent />
    </PreferredCourseProvider>
  );
}
