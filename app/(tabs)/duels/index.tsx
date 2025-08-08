// app/(tabs)/duels.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { duelService } from '../../../src/api';
import {
  getUserDuelStats,
  UserDuelStatsPayload,
} from '../../../src/api/duelResultService';
import { checkAndRefreshSession } from '../../../src/api/authService';
import { Duel } from '../../../src/types/models';
import {
  PlayfulCard,
  PlayfulButton,
  EmptyState,
  Avatar,
  Badge,
  Container,
  Title,
  Paragraph,
  Alert,
  Row,
  Column,
  StatCard,
  AnimatedCounter,
  ScoreDisplay,
  SlideInElement,
  PlayfulTitle,
} from '../../../components/ui';
import { Colors, Spacing, FontSizes } from '../../../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  usePreferredCourse,
  PreferredCourseProvider,
} from '../../../context/PreferredCourseContext';

// Performance optimized shadow configuration
const OPTIMIZED_SHADOW = {
  shadowColor: Colors.gray[900],
  shadowOffset: { width: 2, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 4,
};

// Memoized components for better performance
const DuelCard = React.memo(
  ({
    duel,
    contextColor,
    onPress,
    preferredCourse,
  }: {
    duel: Duel;
    contextColor: string;
    onPress: () => void;
    preferredCourse: any;
  }) => {
    const cardProps = useMemo(() => {
      const status = duel.status;
      if (status === 'active') {
        return {
          variant: 'playful' as const,
          animated: true,
          pulseEffect: true,
          borderGlow: true,
        };
      } else if (status === 'completed') {
        return {
          variant: 'elevated' as const,
          animated: false,
          pulseEffect: false,
          borderGlow: false,
        };
      } else if (status === 'pending') {
        return {
          variant: 'glass' as const,
          animated: false,
          pulseEffect: false,
          borderGlow: false,
        };
      }
      return {
        variant: 'default' as const,
        animated: false,
        pulseEffect: false,
        borderGlow: false,
      };
    }, [duel.status]);

    const opponentDisplayName = useMemo(() => {
      if ((duel as any).opponent_username) {
        return (duel as any).opponent_username;
      }
      if ((duel as any).opponent_name) {
        return (duel as any).opponent_name;
      }
      if (duel.opponent_id) {
        return `Rakip ${duel.opponent_id}`;
      }
      return 'Rakip';
    }, [duel]);

    const courseName = useMemo(() => {
      if ((duel as any).course_name) return (duel as any).course_name;
      if ((duel as any).course_title) return (duel as any).course_title;
      if ((duel as any).subject) return (duel as any).subject;
      if ((duel as any).category) return (duel as any).category;
      if ((duel as any).course) return (duel as any).course;
      if ((duel as any).topic) return (duel as any).topic;
      return 'Tıp Bilgisi Düellosu';
    }, [duel]);

    const statusBadge = useMemo(() => {
      const status = duel.status;
      if (status === 'pending') {
        return (
          <Badge
            text='Bekliyor'
            variant='info'
            size='md'
            fontFamily='SecondaryFont-Bold'
          />
        );
      } else if (status === 'active') {
        return (
          <Badge
            text='Senin Sıran'
            variant='warning'
            size='md'
            fontFamily='SecondaryFont-Bold'
          />
        );
      } else if (status === 'completed') {
        return (
          <Badge
            text='Tamamlandı'
            variant='success'
            size='md'
            fontFamily='SecondaryFont-Bold'
          />
        );
      }
      return null;
    }, [duel.status]);

    return (
      <TouchableOpacity
        key={duel.duel_id}
        onPress={onPress}
        activeOpacity={0.8}
        style={styles.duelCardContainer}
      >
        <PlayfulCard
          title={`${opponentDisplayName} ile Düello`}
          titleFontFamily='PrimaryFont'
          category={preferredCourse?.category}
          style={[styles.duelCard, { backgroundColor: contextColor }]}
          {...cardProps}
        >
          <Row style={styles.duelCardContent}>
            <Row style={styles.duelCardLeft}>
              <Column style={styles.duelCardInfo}>
                <Title level={3} style={styles.opponentName}>
                  {opponentDisplayName}
                </Title>
                <Text style={styles.courseName}>{courseName}</Text>
                {statusBadge}
              </Column>
            </Row>

            {(duel as any).your_score !== undefined && (
              <ScoreDisplay
                score={(duel as any).your_score || 0}
                maxScore={(duel as any).max_score || 100}
                variant='gradient'
                size='small'
                animated
              />
            )}
          </Row>
        </PlayfulCard>
      </TouchableOpacity>
    );
  },
);

const StatsSection = React.memo(
  ({
    activeDuels,
    userStats,
    contextColor,
  }: {
    activeDuels: Duel[];
    userStats: UserDuelStatsPayload | null;
    contextColor: string;
  }) => {
    const pendingCount = useMemo(
      () => activeDuels.filter((d) => d.status === 'pending').length,
      [activeDuels],
    );

    return (
      <Row style={styles.statsContainer}>
        <StatCard
          icon='trophy'
          title='Aktif Düellolar'
          value={activeDuels.length.toString()}
          color={Colors.white}
          titleFontFamily='SecondaryFont-Bold'
          style={[styles.statCard, { backgroundColor: contextColor }]}
        />
        <StatCard
          icon='fire'
          title='Kazanılan'
          value={(userStats?.wins || 0).toString()}
          color={Colors.white}
          titleFontFamily='SecondaryFont-Bold'
          style={[styles.statCard, { backgroundColor: contextColor }]}
        />
        <StatCard
          icon='hourglass'
          title='Bekleyen'
          value={pendingCount.toString()}
          color={Colors.white}
          titleFontFamily='SecondaryFont-Bold'
          style={[styles.statCard, { backgroundColor: contextColor }]}
        />
      </Row>
    );
  },
);

// Main Duels Screen Component (wrapped with context)
function DuelsScreenContent() {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const {
    preferredCourse,
    isLoading: courseLoading,
    getCourseColor,
  } = usePreferredCourse();

  const [activeDuels, setActiveDuels] = useState<Duel[]>([]);
  const [userStats, setUserStats] = useState<UserDuelStatsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<{ username?: string } | null>(null);

  // Memoized context color to prevent unnecessary re-renders
  const contextColor = useMemo(() => {
    return (
      (preferredCourse as any)?.category &&
      getCourseColor((preferredCourse as any).category)
    );
  }, [preferredCourse, getCourseColor]);

  // Memoized styles that depend on theme
  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        loadingText: {
          marginTop: Spacing[4],
          color: isDark ? Colors.white : Colors.white,
          fontFamily: 'SecondaryFont-Regular',
          fontSize: 16,
        },
        loadingSubtext: {
          marginTop: Spacing[2],
          color: isDark ? Colors.gray[200] : Colors.gray[200],
          fontFamily: 'SecondaryFont-Regular',
          fontSize: 14,
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
        errorTitle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: isDark ? Colors.gray[800] : Colors.gray[800],
          textAlign: 'center',
          marginBottom: Spacing[2],
          fontFamily: 'SecondaryFont-Bold',
        },
        refreshTitle: {
          color: isDark ? Colors.gray[600] : Colors.gray[600],
        },
        noDataText: {
          color: isDark ? Colors.gray[600] : Colors.gray[600],
          fontFamily: 'SecondaryFont-Regular',
          textAlign: 'center',
          marginBottom: Spacing[4],
          fontSize: 16,
        },
      }),
    [isDark],
  );

  // Load user data from AsyncStorage
  useEffect(() => {
    let isMounted = true;

    const loadUserData = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        if (userData && isMounted) {
          setUserData(JSON.parse(userData));
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error loading user data from AsyncStorage:', error);
        }
      }
    };

    loadUserData();

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setError(null);

      const sessionValid = await checkAndRefreshSession();
      if (!sessionValid) {
        console.log('Session invalid, redirecting to login');
        router.replace('/(auth)/login');
        return;
      }

      const [duelsResponse, userStatsResponse] = await Promise.allSettled([
        duelService.getActiveDuels(),
        getUserDuelStats(),
      ]);

      let hasData = false;

      if (duelsResponse.status === 'fulfilled') {
        setActiveDuels(duelsResponse.value);
        hasData = true;
      } else {
        console.error('Failed to fetch duels:', duelsResponse.reason);
        setActiveDuels([]);
      }

      if (userStatsResponse.status === 'fulfilled') {
        setUserStats(userStatsResponse.value);
        hasData = true;
      } else {
        console.error('Failed to fetch user stats:', userStatsResponse.reason);
        setUserStats(null);
      }

      if (!hasData) {
        const firstError = [duelsResponse, userStatsResponse].find(
          (response) => response.status === 'rejected',
        )?.reason;

        if (firstError?.message?.includes('Oturum süresi doldu')) {
          router.replace('/(auth)/login');
          return;
        }

        setError('Veri yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } catch (error) {
      console.error('Error fetching duels data:', error);

      if (
        error instanceof Error &&
        (error.message.includes('Oturum süresi doldu') ||
          error.message.includes('unauthorized') ||
          error.message.includes('401'))
      ) {
        router.replace('/(auth)/login');
        return;
      }

      setError('Veri yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  }, [router]);

  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);

      console.log('Refreshing duels data...');

      const sessionValid = await checkAndRefreshSession();
      if (!sessionValid) {
        console.log('Session invalid during refresh, redirecting to login');
        router.replace('/(auth)/login');
        return;
      }

      await fetchData();
      console.log('Duels refresh completed successfully');
    } catch (error) {
      console.error('Duels refresh failed:', error);

      if (
        error instanceof Error &&
        error.message.includes('Oturum süresi doldu')
      ) {
        router.replace('/(auth)/login');
        return;
      }

      setError('Yenileme başarısız. Lütfen tekrar deneyin.');
    } finally {
      setRefreshing(false);
    }
  }, [fetchData, router]);

  const handleRetry = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Retrying duels data fetch...');

      try {
        await refreshSession();
        console.log('Session refreshed via AuthContext');
      } catch (sessionError) {
        console.error('AuthContext session refresh failed:', sessionError);

        const sessionValid = await checkAndRefreshSession();
        if (!sessionValid) {
          console.log('Manual session check failed, redirecting to login');
          router.replace('/(auth)/login');
          return;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
      await fetchData();

      console.log('Duels retry completed successfully');
    } catch (error) {
      console.error('Duels retry failed:', error);

      if (
        error instanceof Error &&
        error.message.includes('Oturum süresi doldu')
      ) {
        router.replace('/(auth)/login');
        return;
      }

      setError('Yeniden deneme başarısız. Lütfen uygulamayı yeniden başlatın.');
    } finally {
      setLoading(false);
    }
  }, [fetchData, router, refreshSession]);

  useEffect(() => {
    let isMounted = true;

    async function initialFetch() {
      if (!isMounted) return;

      setLoading(true);

      try {
        const sessionValid = await checkAndRefreshSession();
        if (!sessionValid) {
          if (isMounted) {
            setLoading(false);
            router.replace('/(auth)/login');
          }
          return;
        }

        await fetchData();
      } catch (error) {
        console.error('Initial duels fetch error:', error);
        if (isMounted) {
          setError('Başlangıç verisi yüklenemedi. Lütfen tekrar deneyin.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initialFetch();

    return () => {
      isMounted = false;
    };
  }, [fetchData, router]);

  // Memoized handlers to prevent unnecessary re-renders
  const handleNewDuel = useCallback(() => {
    router.push('/(tabs)/duels/new' as any);
  }, [router]);

  const handleDuelHistory = useCallback(() => {
    router.push('/(tabs)/duels/history' as any);
  }, [router]);

  const handleLoginRedirect = useCallback(() => {
    router.replace('/(auth)/login');
  }, [router]);

  // Memoized duel press handlers
  const createDuelPressHandler = useCallback(
    (duelId: string) => {
      return () => router.push(`/(tabs)/duels/${duelId}` as any);
    },
    [router],
  );

  // Enhanced error screen with better retry options
  if (error && !loading) {
    return (
      <Container style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <FontAwesome
            name='exclamation-triangle'
            size={64}
            color={Colors.vibrant?.orange || Colors.warning}
            style={styles.errorIcon}
          />

          <Text style={dynamicStyles.errorTitle}>Bir Sorun Oluştu</Text>

          <Alert type='error' message={error} style={styles.errorAlert} />

          <View style={styles.errorActions}>
            <PlayfulButton
              title='Yeniden Dene'
              onPress={handleRetry}
              variant='primary'
              animated
              icon='refresh'
              size='medium'
              style={[styles.retryButton, { backgroundColor: contextColor }]}
            />

            <PlayfulButton
              title='Giriş Ekranına Dön'
              onPress={handleLoginRedirect}
              variant='outline'
              size='medium'
              style={styles.loginButton}
            />
          </View>
        </View>
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
            title='Yenileniyor...'
            titleColor={dynamicStyles.refreshTitle.color}
          />
        }
      >
        {/* Header with animated title */}
        <SlideInElement delay={0}>
          <PlayfulCard style={styles.headerCard}>
            <Row style={styles.headerRow}>
              <Column style={styles.headerColumn}>
                <PlayfulTitle
                  level={1}
                  gradient='primary'
                  style={dynamicStyles.headerTitle}
                >
                  Düellolar ⚔️
                </PlayfulTitle>
                <Paragraph style={dynamicStyles.headerSubtitle}>
                  Arkadaşlarınla yarışarak öğren
                </Paragraph>
              </Column>
            </Row>
          </PlayfulCard>
        </SlideInElement>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size='large' color={contextColor} />
            <Text style={dynamicStyles.loadingText}>
              Düellolar yükleniyor...
            </Text>
            <Text style={dynamicStyles.loadingSubtext}>
              Bu birkaç saniye sürebilir
            </Text>
          </View>
        ) : (
          <>
            {/* Stats Cards */}
            <StatsSection
              activeDuels={activeDuels}
              userStats={userStats}
              contextColor={contextColor}
            />

            {/* Create New Duel Button */}
            <PlayfulButton
              title='Yeni Düello Başlat'
              onPress={handleNewDuel}
              variant='secondary'
              gradient='fire'
              animated
              style={[styles.newDuelButton, { backgroundColor: contextColor }]}
              icon='plus'
              wiggleOnPress
            />

            {activeDuels.length > 0 ? (
              <View>
                {activeDuels.map((duel) => (
                  <DuelCard
                    key={duel.duel_id}
                    duel={duel}
                    contextColor={contextColor}
                    onPress={createDuelPressHandler(duel.duel_id.toString())}
                    preferredCourse={preferredCourse}
                  />
                ))}
              </View>
            ) : (
              <PlayfulCard
                variant='glass'
                animated
                floatingAnimation
                style={styles.emptyStateCard}
              >
                <EmptyState
                  icon='users'
                  fontFamily='PrimaryFont'
                  title='Aktif düello yok'
                  buttonFontFamily='PrimaryFont'
                  message='Arkadaşlarını düelloya davet et ve rekabeti başlat.'
                  actionButton={{
                    title: 'Düello Başlat',
                    onPress: handleNewDuel,
                    variant: 'secondary',
                  }}
                />
              </PlayfulCard>
            )}

            {/* Quick Actions */}
            <View style={styles.quickActionsContainer}>
              <PlayfulCard
                title='Hızlı İşlemler'
                variant='playful'
                titleFontFamily='PrimaryFont'
                category={(preferredCourse as any)?.category}
                style={[
                  styles.quickActionsCard,
                  { backgroundColor: contextColor },
                ]}
                animated
                floatingAnimation
              >
                <Row style={styles.quickActionsRow}>
                  <PlayfulButton
                    title='Tüm Düellolar'
                    onPress={handleDuelHistory}
                    variant='outline'
                    style={styles.quickActionLeft}
                    icon='list'
                    animated
                    size='xs'
                    fontFamily='PrimaryFont'
                  />
                  <PlayfulButton
                    title='Düello Geçmişi'
                    onPress={handleDuelHistory}
                    variant='outline'
                    style={styles.quickActionRight}
                    icon='history'
                    animated
                    size='xs'
                    fontFamily='PrimaryFont'
                  />
                </Row>
              </PlayfulCard>
            </View>

            {/* Error display at bottom if there's an error but data is loaded */}
            {error && !loading && activeDuels.length > 0 && (
              <Alert
                type='warning'
                message='Veriler yenilenirken sorun yaşandı. Çekmek için aşağı kaydırın.'
                style={styles.bottomAlert}
              />
            )}

            {/* Retry button at bottom for partial failures */}
            {!loading && activeDuels.length === 0 && !error && (
              <View
                style={[
                  styles.noDataContainer,
                  { backgroundColor: `${contextColor}20` },
                ]}
              >
                <FontAwesome
                  name='wifi'
                  size={48}
                  color={contextColor}
                  style={styles.noDataIcon}
                />
                <Text style={dynamicStyles.noDataText}>
                  Düello verileri yüklenemedi
                </Text>
                <PlayfulButton
                  title='Tekrar Dene'
                  onPress={handleRetry}
                  variant='primary'
                  size='medium'
                  animated
                  icon='refresh'
                  style={[
                    styles.noDataButton,
                    { backgroundColor: contextColor },
                  ]}
                />
              </View>
            )}
          </>
        )}

        {/* Bottom spacing to ensure content is fully visible */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerColumn: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing[8],
  },
  statsContainer: {
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
    marginBottom: Spacing[6],
  },
  statCard: {
    ...OPTIMIZED_SHADOW,
  },
  newDuelButton: {
    marginBottom: Spacing[6],
    ...OPTIMIZED_SHADOW,
  },
  duelCardContainer: {
    ...OPTIMIZED_SHADOW,
  },
  duelCard: {
    marginBottom: Spacing[4],
    ...OPTIMIZED_SHADOW,
  },
  duelCardContent: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  duelCardLeft: {
    alignItems: 'center',
    flex: 1,
  },
  duelCardInfo: {
    flex: 1,
  },
  opponentName: {
    color: Colors.white,
    marginBottom: Spacing[1],
    fontFamily: 'SecondaryFont-Bold',
  },
  courseName: {
    color: Colors.white,
    opacity: 0.8,
    fontSize: FontSizes.sm,
    fontFamily: 'SecondaryFont-Regular',
    marginBottom: Spacing[1],
  },
  emptyStateCard: {
    marginTop: Spacing[4],
  },
  quickActionsContainer: {
    ...OPTIMIZED_SHADOW,
  },
  quickActionsCard: {
    marginTop: Spacing[6],
    ...OPTIMIZED_SHADOW,
  },
  quickActionsRow: {
    justifyContent: 'space-between',
  },
  quickActionLeft: {
    flex: 1,
    marginRight: Spacing[2],
    borderColor: Colors.white,
  },
  quickActionRight: {
    flex: 1,
    marginLeft: Spacing[2],
    borderColor: Colors.white,
  },
  bottomAlert: {
    marginTop: Spacing[4],
  },
  noDataContainer: {
    alignItems: 'center',
    padding: Spacing[6],
    borderRadius: 12,
    marginTop: Spacing[4],
  },
  noDataIcon: {
    marginBottom: Spacing[3],
  },
  noDataButton: {
    // backgroundColor will be set dynamically
  },
  bottomSpacing: {
    height: Spacing[8],
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[4],
  },
  errorContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  errorIcon: {
    marginBottom: Spacing[4],
  },
  errorAlert: {
    marginBottom: Spacing[6],
  },
  errorActions: {
    width: '100%',
    gap: Spacing[3],
  },
  retryButton: {
    width: '100%',
  },
  loginButton: {
    width: '100%',
  },
});

// Main component with context provider
export default function DuelsScreen() {
  return (
    <PreferredCourseProvider>
      <DuelsScreenContent />
    </PreferredCourseProvider>
  );
}
