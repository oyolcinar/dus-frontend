// app/(tabs)/duels.tsx - UPDATED WITH NEW ARCHITECTURE
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
import { useDuelsData } from '../../../src/hooks/useDuelsData';
import { useAuth, usePreferredCourse } from '../../../stores/appStore';
import { Duel } from '../../../src/types/models';
import {
  PlayfulCard,
  PlayfulButton,
  EmptyState,
  Badge,
  Container,
  Title,
  Paragraph,
  Alert,
  Row,
  Column,
  StatCard,
  ScoreDisplay,
  SlideInElement,
  PlayfulTitle,
} from '../../../components/ui';
import { Colors, Spacing, FontSizes } from '../../../constants/theme';

// Performance optimized shadow configuration
const OPTIMIZED_SHADOW = {
  // shadowColor: Colors.gray[900],
  // shadowOffset: { width: 2, height: 4 },
  // shadowOpacity: 0.3,
  // shadowRadius: 4,
  // elevation: 4,
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
    duelStats,
    contextColor,
  }: {
    activeDuels: Duel[];
    duelStats: any;
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
          value={(duelStats?.wins || 0).toString()}
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

// Main Duels Screen Component
export default function DuelsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // 🚀 NEW: Use the new store hooks instead of contexts
  const { user, isAuthenticated, refreshSession } = useAuth();
  const {
    preferredCourse,
    getCourseColor,
    isLoading: courseLoading,
  } = usePreferredCourse();

  // 🚀 NEW: Use the comprehensive duels data hook
  const {
    activeDuels,
    activeDuelsLoading,
    activeDuelsError,
    duelStats,
    duelStatsLoading,
    duelStatsError,
    isLoading,
    hasError,
    refetchAll,
  } = useDuelsData();

  // Local UI state
  const [refreshing, setRefreshing] = useState(false);

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

  // 🚀 SIMPLIFIED: Handle refresh with new hook
  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);

      // Try to refresh session first
      try {
        await refreshSession();
      } catch (sessionError) {
        console.warn(
          'Session refresh failed during manual refresh:',
          sessionError,
        );
      }

      // Refetch all duels data
      await refetchAll();

      console.log('Duels refresh completed successfully');
    } catch (error) {
      console.error('Duels refresh failed:', error);

      // If authentication failed, redirect to login
      if (
        error instanceof Error &&
        (error.message.includes('unauthorized') ||
          error.message.includes('401') ||
          error.message.includes('Oturum süresi doldu'))
      ) {
        router.replace('/(auth)/login');
        return;
      }
    } finally {
      setRefreshing(false);
    }
  }, [refetchAll, refreshSession, router]);

  // 🚀 SIMPLIFIED: Handle retry
  const handleRetry = useCallback(async () => {
    try {
      // Try to refresh session
      const sessionValid = await refreshSession();
      if (!sessionValid) {
        router.replace('/(auth)/login');
        return;
      }

      // Retry fetching data
      await refetchAll();
    } catch (error) {
      console.error('Retry failed:', error);

      if (
        error instanceof Error &&
        error.message.includes('Oturum süresi doldu')
      ) {
        router.replace('/(auth)/login');
      }
    }
  }, [refreshSession, refetchAll, router]);

  // Check authentication on mount
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, router]);

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

  // 🚀 SIMPLIFIED: Error handling - show error if there's a persistent error
  const shouldShowError = hasError && !isLoading && !refreshing;
  const errorMessage =
    activeDuelsError?.message ||
    duelStatsError?.message ||
    'Veri yüklenirken bir hata oluştu. Lütfen tekrar deneyin.';

  if (shouldShowError) {
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

          <Alert
            type='error'
            message={errorMessage}
            style={styles.errorAlert}
          />

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

        {isLoading ? (
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
              duelStats={duelStats}
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

            {/* Error display at bottom if there's a partial error */}
            {(activeDuelsError || duelStatsError) && activeDuels.length > 0 && (
              <Alert
                type='warning'
                message='Veriler yenilenirken sorun yaşandı. Çekmek için aşağı kaydırın.'
                style={styles.bottomAlert}
              />
            )}

            {/* No data state when not loading but no duels */}
            {!isLoading && activeDuels.length === 0 && !hasError && (
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
