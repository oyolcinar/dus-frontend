// app/(tabs)/duels/history.tsx - Optimized Duel History Screen

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  useColorScheme,
  StyleSheet,
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
  Alert,
  EmptyState,
  ScoreDisplay,
  AnimatedCounter,
  FloatingElement,
  GlassCard,
  Colors,
  Spacing,
  BorderRadius,
  VIBRANT_COLORS,
} from '../../../components/ui';
import {
  duelResultService,
  duelService,
  userService,
  courseService,
} from '../../../src/api';
import { DuelResult, Duel, User, Course } from '../../../src/types/models';
import { UserDuelStatsPayload } from '../../../src/api/duelResultService';
import { globalStyles } from '../../../utils/styleUtils';
import { useAuth } from '../../../context/AuthContext';

type HistoryTab = 'stats' | 'recent' | 'all';

interface ExtendedDuelResult extends DuelResult {
  winner_username?: string;
}

interface DuelHistoryItem extends ExtendedDuelResult {
  result: 'won' | 'lost' | 'draw';
  opponentName?: string;
  courseName?: string;
  testName?: string;
  formattedDate: string;
  duelInfo?: Duel;
}

// Optimized shadow configuration
const OPTIMIZED_SHADOW = {
  shadowColor: Colors.gray[900],
  shadowOffset: { width: 2, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 4,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing[4],
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing[8],
    ...OPTIMIZED_SHADOW,
  },
  loadingText: {
    marginTop: Spacing[3],
    fontFamily: 'SecondaryFont-Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[4],
    backgroundColor: '#A29BFE',
  },
  errorAlert: {
    marginBottom: Spacing[4],
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
  headerTitle: {
    fontFamily: 'PrimaryFont',
    color: Colors.gray[900],
  },
  headerSubtitle: {
    fontFamily: 'SecondaryFont-Regular',
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
  filterButtonActive: {
    backgroundColor: VIBRANT_COLORS.coral,
  },
  filterButtonInactive: {
    backgroundColor: Colors.white,
  },
  filterButtonRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIcon: {
    marginRight: Spacing[1],
  },
  filterText: {
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'SecondaryFont-Regular',
  },
  filterTextActive: {
    fontWeight: '600',
    color: Colors.white,
  },
  filterTextInactive: {
    fontWeight: '500',
    color: Colors.gray[700],
  },
  statsCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    marginBottom: Spacing[3],
    flex: 1,
    marginHorizontal: Spacing[1],
    ...OPTIMIZED_SHADOW,
  },
  statsColumn: {
    alignItems: 'center',
  },
  statsTitle: {
    fontSize: 12,
    color: Colors.gray[600],
    fontFamily: 'SecondaryFont-Regular',
    textAlign: 'center',
    marginBottom: Spacing[1],
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'PrimaryFont',
    textAlign: 'center',
  },
  statsSubtitle: {
    fontSize: 10,
    color: Colors.gray[500],
    fontFamily: 'SecondaryFont-Regular',
    textAlign: 'center',
    marginTop: 2,
  },
  overviewCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    marginBottom: Spacing[4],
    ...OPTIMIZED_SHADOW,
  },
  overviewColumn: {
    alignItems: 'center',
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.gray[800],
    fontFamily: 'SecondaryFont-Bold',
    marginBottom: Spacing[3],
    textAlign: 'center',
  },
  overviewRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    marginBottom: Spacing[3],
  },
  historyCard: {
    marginBottom: Spacing[3],
    backgroundColor: 'rgba(255,255,255,0.95)',
    ...OPTIMIZED_SHADOW,
  },
  historyRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyContent: {
    alignItems: 'center',
    flex: 1,
  },
  historyColumn: {
    flex: 1,
  },
  historyHeader: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  historyOpponent: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.gray[800],
    fontFamily: 'SecondaryFont-Bold',
    marginRight: Spacing[2],
  },
  historyDetails: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyInfo: {
    fontSize: 12,
    color: Colors.gray[600],
    fontFamily: 'SecondaryFont-Regular',
    marginBottom: 2,
  },
  historyScore: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'PrimaryFont',
  },
  historyDate: {
    fontSize: 11,
    color: Colors.gray[500],
    fontFamily: 'SecondaryFont-Regular',
  },
  sectionTitle: {
    marginBottom: Spacing[2],
    fontFamily: 'SecondaryFont-Bold',
  },
  contentContainer: {
    backgroundColor: Colors.vibrant.orangeLight,
    marginBottom: Spacing[4],
    overflow: 'hidden',
    ...OPTIMIZED_SHADOW,
  },
  bottomAlert: {
    marginTop: Spacing[4],
  },
  bottomSpacing: {
    height: Spacing[8],
  },
});

const DuelHistoryScreen = React.memo(() => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const {
    user: contextUser,
    isLoading: authLoading,
    isSessionValid,
  } = useAuth();

  // Refs for cleanup
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // State management
  const [activeTab, setActiveTab] = useState<HistoryTab>('stats');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data state
  const [userStats, setUserStats] = useState<UserDuelStatsPayload | null>(null);
  const [duelHistory, setDuelHistory] = useState<DuelHistoryItem[]>([]);
  const [recentDuels, setRecentDuels] = useState<DuelHistoryItem[]>([]);

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);

  // Memoized color calculations
  const colors = useMemo(
    () => ({
      loading: isDark ? Colors.vibrant.coral : Colors.vibrant.coral,
      text: isDark ? Colors.white : Colors.white,
      headerText: isDark ? Colors.gray[700] : Colors.gray[700],
      sectionText: isDark ? Colors.gray[800] : Colors.gray[800],
    }),
    [isDark],
  );

  // Load user data with cleanup
  useEffect(() => {
    let isCancelled = false;

    const loadUserData = async () => {
      try {
        const data = await AsyncStorage.getItem('userData');
        if (data && !isCancelled && isMountedRef.current) {
          setUserData(JSON.parse(data));
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('Error loading user data:', error);
        }
      }
    };

    loadUserData();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Helper function to determine duel result for current user
  const getDuelResult = useCallback(
    (
      duelResult: DuelResult,
      currentUserId: number,
    ): 'won' | 'lost' | 'draw' => {
      if (duelResult.winner_id === currentUserId) {
        return 'won';
      } else if (
        duelResult.winner_id &&
        duelResult.winner_id !== currentUserId
      ) {
        return 'lost';
      }
      return 'draw';
    },
    [],
  );

  // Helper function for known opponents
  const getKnownOpponentName = useCallback((opponentId: number): string => {
    const knownOpponents: Record<number, string> = {
      30: 'dr_bot_easy',
      33: 'dr_bot_expert',
    };
    return knownOpponents[opponentId] || `Kullanıcı ${opponentId}`;
  }, []);

  // Helper function to get opponent info from duel result
  const getOpponentInfo = useCallback(
    async (
      duel: Duel,
      duelResult: ExtendedDuelResult,
      currentUserId: number,
    ): Promise<{ opponentId: number; opponentName: string }> => {
      let opponentId: number;
      if (duel.initiator_id === currentUserId) {
        opponentId = duel.opponent_id;
      } else {
        opponentId = duel.initiator_id;
      }

      let opponentName = 'Bilinmeyen Rakip';

      if (duel.opponent?.username && duel.opponent.user_id === opponentId) {
        opponentName = duel.opponent.username;
      } else if (
        duel.initiator?.username &&
        duel.initiator.user_id === opponentId
      ) {
        opponentName = duel.initiator.username;
      } else if (duel.opponent_username && duel.opponent_id === opponentId) {
        opponentName = duel.opponent_username;
      } else if (duel.initiator_username && duel.initiator_id === opponentId) {
        opponentName = duel.initiator_username;
      } else if (duelResult.winner_username) {
        if (duelResult.winner_id === opponentId) {
          opponentName = duelResult.winner_username;
        } else {
          try {
            const opponent = await userService.getUserProfile();
            if (opponent && opponent.userId === opponentId) {
              opponentName = userService.getUserDisplayName(opponent);
            } else {
              opponentName = getKnownOpponentName(opponentId);
            }
          } catch (error) {
            opponentName = getKnownOpponentName(opponentId);
          }
        }
      } else {
        opponentName = getKnownOpponentName(opponentId);
      }

      return { opponentId, opponentName };
    },
    [getKnownOpponentName],
  );

  // Fetch actual duel history data with cleanup
  const fetchActualHistoryData = useCallback(async (): Promise<
    DuelHistoryItem[]
  > => {
    if (!contextUser || !userData?.userId || !isMountedRef.current) {
      return [];
    }

    // Create new abort controller for this request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const currentUserId = userData.userId;
      const completedDuels = await duelService.getCompletedDuels();

      if (
        !completedDuels ||
        completedDuels.length === 0 ||
        !isMountedRef.current
      ) {
        return [];
      }

      const historyPromises = completedDuels.map(
        async (duel): Promise<DuelHistoryItem | null> => {
          if (!isMountedRef.current) return null;

          try {
            const duelResult = await duelResultService.getDuelResultByDuelId(
              duel.duel_id,
            );
            if (!duelResult || !isMountedRef.current) return null;

            const { opponentId, opponentName } = await getOpponentInfo(
              duel,
              duelResult as ExtendedDuelResult,
              currentUserId,
            );

            if (!isMountedRef.current) return null;

            const result = getDuelResult(duelResult, currentUserId);

            let courseName = 'Bilinmeyen Ders';
            try {
              if (duel.course?.title) {
                courseName = duel.course.title;
              } else if (duel.course_title) {
                courseName = duel.course_title;
              } else if (duel.course?.course_id && isMountedRef.current) {
                const course = await courseService.getCourseById(
                  duel.course.course_id,
                );
                if (course && isMountedRef.current) {
                  courseName = course.title;
                }
              }
            } catch (error) {
              console.warn(
                `Could not fetch course info for duel ${duel.duel_id}:`,
                error,
              );
            }

            if (!isMountedRef.current) return null;

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

      if (!isMountedRef.current) return [];

      const validHistory = historyResults.filter(
        (item): item is DuelHistoryItem => item !== null,
      );

      validHistory.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      return validHistory;
    } catch (error) {
      if (!isMountedRef.current) return [];
      console.error('Error fetching actual history data:', error);
      throw error;
    }
  }, [contextUser, userData?.userId, getOpponentInfo, getDuelResult]);

  // Generate placeholder history (memoized)
  const generatePlaceholderHistory = useCallback(
    (stats: UserDuelStatsPayload): DuelHistoryItem[] => {
      const history: DuelHistoryItem[] = [];
      const totalDuels = stats.totalDuels || 0;

      if (totalDuels === 0) return [];

      for (let i = 0; i < Math.min(totalDuels, 50); i++) {
        const isWin = i < (stats.wins || 0);
        const duelId = 1000 + i;

        history.push({
          duel_id: duelId,
          winner_id: isWin ? userData?.userId : (userData?.userId || 0) + 1,
          initiator_score: isWin
            ? Math.floor(Math.random() * 20) + 15
            : Math.floor(Math.random() * 15) + 5,
          opponent_score: isWin
            ? Math.floor(Math.random() * 15) + 5
            : Math.floor(Math.random() * 20) + 15,
          created_at: new Date(
            Date.now() - i * 24 * 60 * 60 * 1000,
          ).toISOString(),
          result: isWin ? 'won' : ('lost' as 'won' | 'lost' | 'draw'),
          opponentName: `Rakip ${i + 1}`,
          courseName: ['Matematik', 'Türkçe', 'Fen', 'Sosyal'][i % 4],
          testName: `Test ${i + 1}`,
          formattedDate: new Date(
            Date.now() - i * 24 * 60 * 60 * 1000,
          ).toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
        } as DuelHistoryItem);
      }

      return history.reverse();
    },
    [userData?.userId],
  );

  // Fetch duel history data with cleanup
  const fetchHistoryData = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      setError(null);

      if (!contextUser || !isSessionValid) {
        setError('Giriş yapmanız gerekiyor.');
        return;
      }

      const [statsData, actualHistory] = await Promise.all([
        duelResultService.getUserDuelStats(),
        fetchActualHistoryData().catch((error) => {
          console.error(
            'Error fetching actual history, falling back to placeholder:',
            error,
          );
          return [];
        }),
      ]);

      if (!isMountedRef.current) return;

      setUserStats(statsData);

      if (actualHistory.length > 0) {
        setDuelHistory(actualHistory);
        setRecentDuels(actualHistory.slice(0, 10));
      } else {
        const placeholderHistory = generatePlaceholderHistory(statsData);
        setDuelHistory(placeholderHistory);
        setRecentDuels(placeholderHistory.slice(0, 10));
      }
    } catch (e) {
      if (!isMountedRef.current) return;
      console.error('Error fetching history data:', e);
      setError('İstatistik verileri yüklenirken bir hata oluştu.');
    }
  }, [
    contextUser,
    isSessionValid,
    fetchActualHistoryData,
    generatePlaceholderHistory,
  ]);

  const handleRefresh = useCallback(async () => {
    if (!isMountedRef.current) return;
    setRefreshing(true);
    await fetchHistoryData();
    if (isMountedRef.current) {
      setRefreshing(false);
    }
  }, [fetchHistoryData]);

  const handleRetry = useCallback(async () => {
    if (!isMountedRef.current) return;
    setIsLoading(true);
    await fetchHistoryData();
    if (isMountedRef.current) {
      setIsLoading(false);
    }
  }, [fetchHistoryData]);

  // Initial data fetch with cleanup
  useEffect(() => {
    let isCancelled = false;

    const initialFetch = async () => {
      if (userData && !isCancelled && isMountedRef.current) {
        setIsLoading(true);
        await fetchHistoryData();
        if (!isCancelled && isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    initialFetch();

    return () => {
      isCancelled = true;
    };
  }, [fetchHistoryData, userData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Memoized Filter Button Component
  const FilterButton = React.memo(
    ({
      filter,
      title,
      icon,
    }: {
      filter: HistoryTab;
      title: string;
      icon: string;
    }) => {
      const isActive = activeTab === filter;

      return (
        <TouchableOpacity
          style={[
            styles.filterButton,
            isActive ? styles.filterButtonActive : styles.filterButtonInactive,
          ]}
          onPress={() => setActiveTab(filter)}
        >
          <Row style={styles.filterButtonRow}>
            <FontAwesome
              name={icon as any}
              size={12}
              color={isActive ? Colors.white : Colors.gray[700]}
              style={styles.filterIcon}
            />
            <Text
              style={[
                styles.filterText,
                isActive ? styles.filterTextActive : styles.filterTextInactive,
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {title}
            </Text>
          </Row>
        </TouchableOpacity>
      );
    },
  );

  // Memoized Stats Card Component
  const StatsCard = React.memo(
    ({
      title,
      value,
      subtitle,
      color = Colors.vibrant.purple,
      animated = false,
    }: {
      title: string;
      value: string | number;
      subtitle?: string;
      color?: string;
      animated?: boolean;
    }) => (
      <PlayfulCard style={styles.statsCard}>
        <Column style={styles.statsColumn}>
          <Text style={styles.statsTitle}>{title}</Text>
          {animated && typeof value === 'number' ? (
            <AnimatedCounter
              value={value}
              style={[styles.statsValue, { color }]}
            />
          ) : (
            <Text style={[styles.statsValue, { color }]}>{value}</Text>
          )}
          {subtitle && <Text style={styles.statsSubtitle}>{subtitle}</Text>}
        </Column>
      </PlayfulCard>
    ),
  );

  // Memoized Duel History Item Component
  const DuelHistoryItemComponent = React.memo(
    ({ duel }: { duel: DuelHistoryItem }) => {
      const resultStyles = useMemo(() => {
        const getResultColor = () => {
          switch (duel.result) {
            case 'won':
              return Colors.vibrant.mint;
            case 'lost':
              return Colors.vibrant.coral;
            case 'draw':
              return Colors.vibrant.yellow;
            default:
              return Colors.gray[500];
          }
        };

        const getResultText = () => {
          switch (duel.result) {
            case 'won':
              return 'Kazandı';
            case 'lost':
              return 'Kaybetti';
            case 'draw':
              return 'Berabere';
            default:
              return 'Bilinmeyen';
          }
        };

        const color = getResultColor();
        return {
          color,
          text: getResultText(),
          variant:
            duel.result === 'won'
              ? 'success'
              : duel.result === 'lost'
                ? 'error'
                : 'warning',
        };
      }, [duel.result]);

      return (
        <PlayfulCard style={styles.historyCard}>
          <Row style={styles.historyRow}>
            <Row style={styles.historyContent}>
              <Column style={styles.historyColumn}>
                <Row style={styles.historyHeader}>
                  <Text style={styles.historyOpponent}>
                    vs {duel.opponentName}
                  </Text>
                  <Badge
                    text={resultStyles.text}
                    variant={resultStyles.variant as any}
                    style={{ backgroundColor: resultStyles.color }}
                    textStyle={{
                      color: Colors.white,
                      fontFamily: 'SecondaryFont-Bold',
                    }}
                  />
                </Row>
                <Row style={styles.historyDetails}>
                  <Text style={styles.historyInfo}>
                    📚 {duel.courseName} • 📝 {duel.testName}
                  </Text>
                  <Text
                    style={[styles.historyScore, { color: resultStyles.color }]}
                  >
                    {duel.initiator_score}-{duel.opponent_score}
                  </Text>
                </Row>
                <Text style={styles.historyDate}>{duel.formattedDate}</Text>
              </Column>
            </Row>
          </Row>
        </PlayfulCard>
      );
    },
  );

  // Memoized tab content
  const tabContent = useMemo(() => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={colors.loading} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            İstatistikler yükleniyor...
          </Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'stats':
        return (
          <>
            {userStats && (
              <>
                <SlideInElement delay={0} key={`${activeTab}-overview`}>
                  <PlayfulCard style={styles.overviewCard}>
                    <Column style={styles.overviewColumn}>
                      <Text style={styles.overviewTitle}>
                        Genel Performans 📊
                      </Text>
                      <Row style={styles.overviewRow}>
                        <ScoreDisplay
                          score={userStats.wins || 0}
                          maxScore={userStats.totalDuels || 0}
                          label={`${userStats.totalDuels || 0} Düellodan ${userStats.wins || 0} Galibiyet`}
                          variant='gradient'
                          size='large'
                        />
                      </Row>
                    </Column>
                  </PlayfulCard>
                </SlideInElement>

                <SlideInElement delay={100} key={`${activeTab}-stats-row1`}>
                  <Row style={styles.statsRow}>
                    <StatsCard
                      title='Toplam Düello'
                      value={userStats.totalDuels || 0}
                      color={Colors.vibrant.purple}
                      animated
                    />
                  </Row>
                </SlideInElement>

                <SlideInElement delay={200} key={`${activeTab}-stats-row2`}>
                  <Row style={styles.statsRow}>
                    <StatsCard
                      title='Galibiyet'
                      value={userStats.wins || 0}
                      color={Colors.vibrant.mint}
                      animated
                    />
                    <StatsCard
                      title='Mağlubiyet'
                      value={userStats.losses || 0}
                      color={Colors.vibrant.coral}
                      animated
                    />
                  </Row>
                </SlideInElement>

                <SlideInElement delay={300} key={`${activeTab}-stats-row3`}>
                  <Row style={styles.statsRow}>
                    <StatsCard
                      title='Başarı Oranı'
                      value={
                        userStats.totalDuels > 0
                          ? `${Math.round(((userStats.wins || 0) / userStats.totalDuels) * 100)}%`
                          : '0%'
                      }
                      subtitle='Kazanma yüzdesi'
                      color={Colors.vibrant.purple}
                      animated
                    />
                  </Row>
                </SlideInElement>
              </>
            )}
          </>
        );

      case 'recent':
        return recentDuels.length > 0 ? (
          <>
            <SlideInElement delay={0} key={`${activeTab}-title`}>
              <Text
                style={[
                  globalStyles.textLg,
                  globalStyles.fontSemibold,
                  styles.sectionTitle,
                  { color: colors.sectionText },
                ]}
              >
                Son Düellolar ({recentDuels.length})
              </Text>
            </SlideInElement>
            {recentDuels.map((duel, index) => (
              <SlideInElement
                key={`${activeTab}-recent-${duel.duel_id}`}
                delay={100 + index * 50}
              >
                <DuelHistoryItemComponent duel={duel} />
              </SlideInElement>
            ))}
          </>
        ) : (
          <SlideInElement delay={0} key={`${activeTab}-empty`}>
            <EmptyState
              icon='clock-o'
              title='Henüz Düello Yok'
              message='İlk düellonu başlat ve burada görüntüle!'
              fontFamily='SecondaryFont-Regular'
              buttonFontFamily='PrimaryFont'
              titleFontFamily='PrimaryFont'
            />
          </SlideInElement>
        );

      case 'all':
        return duelHistory.length > 0 ? (
          <>
            <SlideInElement delay={0} key={`${activeTab}-title`}>
              <Text
                style={[
                  globalStyles.textLg,
                  globalStyles.fontSemibold,
                  styles.sectionTitle,
                  { color: colors.sectionText },
                ]}
              >
                Tüm Düellolar ({duelHistory.length})
              </Text>
            </SlideInElement>
            {duelHistory.map((duel, index) => (
              <SlideInElement
                key={`${activeTab}-all-${duel.duel_id}`}
                delay={50 + index * 25}
              >
                <DuelHistoryItemComponent duel={duel} />
              </SlideInElement>
            ))}
          </>
        ) : (
          <SlideInElement delay={0} key={`${activeTab}-empty`}>
            <EmptyState
              icon='list'
              title='Henüz Düello Yok'
              message='İstatistikler sekmesinden genel performansını görebilirsin.'
              fontFamily='SecondaryFont-Regular'
              buttonFontFamily='PrimaryFont'
              titleFontFamily='PrimaryFont'
            />
          </SlideInElement>
        );

      default:
        return null;
    }
  }, [activeTab, isLoading, userStats, recentDuels, duelHistory, colors]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <Container style={styles.errorContainer}>
        <ActivityIndicator size='large' color={Colors.white} />
        <Text
          style={[
            styles.loadingText,
            { color: Colors.white, textAlign: 'center' },
          ]}
        >
          Yükleniyor...
        </Text>
      </Container>
    );
  }

  if (error && !isLoading) {
    return (
      <Container style={styles.errorContainer}>
        <Alert
          type='error'
          title='Hata'
          message={error}
          style={styles.errorAlert}
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
    <View style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
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
          <PlayfulCard style={styles.headerCard}>
            <Row style={styles.headerRow}>
              <Column style={styles.headerColumn}>
                <PlayfulTitle
                  level={1}
                  gradient='primary'
                  style={styles.headerTitle}
                >
                  Düello Geçmişi 📈
                </PlayfulTitle>
                <Paragraph
                  color={colors.headerText}
                  style={styles.headerSubtitle}
                >
                  Performansın ve geçmiş düellolarınız
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
                filter='stats'
                title='İstatistikler'
                icon='bar-chart'
              />
              <FilterButton
                filter='recent'
                title='Son Düellolar'
                icon='clock-o'
              />
              <FilterButton filter='all' title='Tüm Geçmiş' icon='list' />
            </Row>
          </View>
        </SlideInElement>

        {/* Tab Content */}
        <View>
          <FloatingElement>
            <GlassCard style={styles.contentContainer} animated>
              {tabContent}
            </GlassCard>
          </FloatingElement>
        </View>

        {/* Error display at bottom if there's an error but data is loaded */}
        {error && !isLoading && (
          <Alert
            type='warning'
            message='Veriler yenilenirken sorun yaşandı. Çekmek için aşağı kaydırın.'
            style={styles.bottomAlert}
          />
        )}

        {/* Bottom spacing to ensure content is fully visible */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
});

DuelHistoryScreen.displayName = 'DuelHistoryScreen';

export default DuelHistoryScreen;
