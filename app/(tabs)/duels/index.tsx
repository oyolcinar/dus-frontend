// app/(tabs)/duels.tsx - PERFORMANCE OPTIMIZED VERSION
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Text,
  View,
  ActivityIndicator,
  useColorScheme,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ListRenderItem,
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
const OPTIMIZED_SHADOW = {};

// Optimized DuelCard with better memoization
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
    // Memoize display data to prevent recalculation
    const displayData = useMemo(
      () => ({
        opponentName:
          (duel as any).opponent_username ||
          (duel as any).opponent_name ||
          (duel.opponent_id ? `Rakip ${duel.opponent_id}` : 'Rakip'),
        courseName:
          (duel as any).course_name ||
          (duel as any).course_title ||
          (duel as any).subject ||
          (duel as any).category ||
          (duel as any).course ||
          (duel as any).topic ||
          'Tıp Bilgisi Düellosu',
        score: (duel as any).your_score,
        maxScore: (duel as any).max_score || 100,
      }),
      [
        (duel as any).opponent_username,
        (duel as any).opponent_name,
        duel.opponent_id,
        (duel as any).course_name,
        (duel as any).course_title,
        (duel as any).subject,
        (duel as any).your_score,
        (duel as any).max_score,
      ],
    );

    // Simplified card props - reduced animations for performance
    const cardProps = useMemo(() => {
      switch (duel.status) {
        case 'active':
          return {
            variant: 'playful' as const,
            animated: true,
            pulseEffect: false,
            borderGlow: false,
          };
        case 'completed':
          return {
            variant: 'elevated' as const,
            animated: false,
            pulseEffect: false,
            borderGlow: false,
          };
        case 'pending':
          return {
            variant: 'glass' as const,
            animated: false,
            pulseEffect: false,
            borderGlow: false,
          };
        default:
          return {
            variant: 'default' as const,
            animated: false,
            pulseEffect: false,
            borderGlow: false,
          };
      }
    }, [duel.status]);

    // Memoize status badge
    const statusBadge = useMemo(() => {
      switch (duel.status) {
        case 'pending':
          return (
            <Badge
              text='Bekliyor'
              variant='info'
              size='md'
              fontFamily='SecondaryFont-Bold'
            />
          );
        case 'active':
          return (
            <Badge
              text='Senin Sıran'
              variant='warning'
              size='md'
              fontFamily='SecondaryFont-Bold'
            />
          );
        case 'completed':
          return (
            <Badge
              text='Tamamlandı'
              variant='success'
              size='md'
              fontFamily='SecondaryFont-Bold'
            />
          );
        default:
          return null;
      }
    }, [duel.status]);

    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={styles.duelCardContainer}
      >
        <PlayfulCard
          title={`${displayData.opponentName} ile Düello`}
          titleFontFamily='PrimaryFont'
          category={preferredCourse?.category}
          style={[styles.duelCard, { backgroundColor: contextColor }]}
          {...cardProps}
        >
          <Row style={styles.duelCardContent}>
            <Row style={styles.duelCardLeft}>
              <Column style={styles.duelCardInfo}>
                <Title level={3} style={styles.opponentName}>
                  {displayData.opponentName}
                </Title>
                <Text style={styles.courseName}>{displayData.courseName}</Text>
                {statusBadge}
              </Column>
            </Row>

            {displayData.score !== undefined && (
              <ScoreDisplay
                score={displayData.score || 0}
                maxScore={displayData.maxScore}
                variant='gradient'
                size='small'
                animated={false} // Disabled for performance
              />
            )}
          </Row>
        </PlayfulCard>
      </TouchableOpacity>
    );
  },
  // Custom comparison function for better memoization
  (prevProps, nextProps) => {
    return (
      prevProps.duel.duel_id === nextProps.duel.duel_id &&
      prevProps.duel.status === nextProps.duel.status &&
      prevProps.contextColor === nextProps.contextColor &&
      prevProps.preferredCourse?.category ===
        nextProps.preferredCourse?.category &&
      (prevProps.duel as any).your_score ===
        (nextProps.duel as any).your_score &&
      (prevProps.duel as any).opponent_username ===
        (nextProps.duel as any).opponent_username
    );
  },
);

// Optimized StatsSection
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
    const stats = useMemo(
      () => ({
        activeCount: activeDuels.length,
        wins: duelStats?.wins || 0,
        pendingCount: activeDuels.filter((d) => d.status === 'pending').length,
      }),
      [activeDuels, duelStats?.wins],
    );

    return (
      <Row style={styles.statsContainer}>
        <StatCard
          icon='trophy'
          title='Aktif Düellolar'
          value={stats.activeCount.toString()}
          color={Colors.white}
          titleFontFamily='SecondaryFont-Bold'
          style={[styles.statCard, { backgroundColor: contextColor }]}
        />
        <StatCard
          icon='fire'
          title='Kazanılan'
          value={stats.wins.toString()}
          color={Colors.white}
          titleFontFamily='SecondaryFont-Bold'
          style={[styles.statCard, { backgroundColor: contextColor }]}
        />
        <StatCard
          icon='hourglass'
          title='Bekleyen'
          value={stats.pendingCount.toString()}
          color={Colors.white}
          titleFontFamily='SecondaryFont-Bold'
          style={[styles.statCard, { backgroundColor: contextColor }]}
        />
      </Row>
    );
  },
  (prevProps, nextProps) =>
    prevProps.activeDuels.length === nextProps.activeDuels.length &&
    prevProps.duelStats?.wins === nextProps.duelStats?.wins &&
    prevProps.contextColor === nextProps.contextColor &&
    prevProps.activeDuels.filter((d) => d.status === 'pending').length ===
      nextProps.activeDuels.filter((d) => d.status === 'pending').length,
);

// Header component for better performance
const DuelsHeader = React.memo(
  ({
    contextColor,
    dynamicStyles,
    onNewDuel,
  }: {
    contextColor: string;
    dynamicStyles: any;
    onNewDuel: () => void;
  }) => (
    <>
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

      <PlayfulButton
        title='Yeni Düello Başlat'
        onPress={onNewDuel}
        variant='secondary'
        gradient='fire'
        animated={false} // Disabled for performance
        style={[styles.newDuelButton, { backgroundColor: contextColor }]}
        icon='plus'
      />
    </>
  ),
);

// Footer component
const QuickActions = React.memo(
  ({
    contextColor,
    preferredCourse,
    onDuelHistory,
  }: {
    contextColor: string;
    preferredCourse: any;
    onDuelHistory: () => void;
  }) => (
    <View style={styles.quickActionsContainer}>
      <PlayfulCard
        title='Hızlı İşlemler'
        variant='playful'
        titleFontFamily='PrimaryFont'
        category={preferredCourse?.category}
        style={[styles.quickActionsCard, { backgroundColor: contextColor }]}
        animated={false} // Disabled for performance
      >
        <Row style={styles.quickActionsRow}>
          <PlayfulButton
            title='Tüm Düellolar'
            onPress={onDuelHistory}
            variant='outline'
            style={styles.quickActionLeft}
            icon='list'
            animated={false}
            size='xs'
            fontFamily='PrimaryFont'
          />
          <PlayfulButton
            title='Düello Geçmişi'
            onPress={onDuelHistory}
            variant='outline'
            style={styles.quickActionRight}
            icon='history'
            animated={false}
            size='xs'
            fontFamily='PrimaryFont'
          />
        </Row>
      </PlayfulCard>
    </View>
  ),
);

// Main Duels Screen Component
export default function DuelsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Store hooks
  const { user, isAuthenticated, refreshSession } = useAuth();
  const { preferredCourse, getCourseColor } = usePreferredCourse();

  // Data hooks
  const {
    activeDuels,
    activeDuelsError,
    duelStats,
    duelStatsError,
    isLoading,
    hasError,
    refetchAll,
  } = useDuelsData();

  // Local state
  const [refreshing, setRefreshing] = useState(false);

  // Memoized context color with stable reference
  const contextColor = useMemo(() => {
    return preferredCourse?.category
      ? getCourseColor(preferredCourse.category) || '#4285F4'
      : '#4285F4';
  }, [preferredCourse?.category, getCourseColor]);

  // Memoized theme styles
  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        loadingText: {
          marginTop: Spacing[4],
          color: Colors.white,
          fontFamily: 'SecondaryFont-Regular',
          fontSize: 16,
        },
        loadingSubtext: {
          marginTop: Spacing[2],
          color: Colors.gray[200],
          fontFamily: 'SecondaryFont-Regular',
          fontSize: 14,
          textAlign: 'center',
        },
        headerTitle: {
          fontFamily: 'PrimaryFont',
          color: Colors.gray[900],
        },
        headerSubtitle: {
          color: Colors.gray[700],
          fontFamily: 'SecondaryFont-Regular',
        },
        errorTitle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: Colors.gray[800],
          textAlign: 'center',
          marginBottom: Spacing[2],
          fontFamily: 'SecondaryFont-Bold',
        },
        noDataText: {
          color: Colors.gray[600],
          fontFamily: 'SecondaryFont-Regular',
          textAlign: 'center',
          marginBottom: Spacing[4],
          fontSize: 16,
        },
      }),
    [isDark],
  );

  // Optimized handlers with stable references
  const handleRefresh = useCallback(async () => {
    if (refreshing) return; // Prevent multiple refreshes

    try {
      setRefreshing(true);
      await Promise.all([refreshSession().catch(console.warn), refetchAll()]);
    } catch (error) {
      console.error('Refresh failed:', error);
      if (
        error instanceof Error &&
        (error.message.includes('unauthorized') ||
          error.message.includes('401'))
      ) {
        router.replace('/(auth)/login');
      }
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, refreshSession, refetchAll, router]);

  const handleRetry = useCallback(async () => {
    try {
      const sessionValid = await refreshSession();
      if (!sessionValid) {
        router.replace('/(auth)/login');
        return;
      }
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

  const handleNewDuel = useCallback(() => {
    router.push('/(tabs)/duels/new' as any);
  }, [router]);

  const handleDuelHistory = useCallback(() => {
    router.push('/(tabs)/duels/history' as any);
  }, [router]);

  const handleLoginRedirect = useCallback(() => {
    router.replace('/(auth)/login');
  }, [router]);

  // FlatList optimizations
  const renderDuelItem: ListRenderItem<Duel> = useCallback(
    ({ item: duel }) => (
      <DuelCard
        duel={duel}
        contextColor={contextColor}
        onPress={() => router.push(`/(tabs)/duels/${duel.duel_id}` as any)}
        preferredCourse={preferredCourse}
      />
    ),
    [contextColor, router, preferredCourse],
  );

  const keyExtractor = useCallback((item: Duel) => item.duel_id.toString(), []);

  const getItemLayout = useCallback(
    (data: any, index: number) => ({
      length: 120, // Approximate item height
      offset: 120 * index,
      index,
    }),
    [],
  );

  const ListEmptyComponent = useCallback(
    () => (
      <PlayfulCard
        variant='glass'
        animated={false}
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
    ),
    [handleNewDuel],
  );

  const ListHeaderComponent = useCallback(
    () => (
      <>
        <DuelsHeader
          contextColor={contextColor}
          dynamicStyles={dynamicStyles}
          onNewDuel={handleNewDuel}
        />

        {!isLoading && (
          <StatsSection
            activeDuels={activeDuels}
            duelStats={duelStats}
            contextColor={contextColor}
          />
        )}
      </>
    ),
    [
      contextColor,
      dynamicStyles,
      handleNewDuel,
      isLoading,
      activeDuels,
      duelStats,
    ],
  );

  const ListFooterComponent = useCallback(
    () => (
      <>
        <QuickActions
          contextColor={contextColor}
          preferredCourse={preferredCourse}
          onDuelHistory={handleDuelHistory}
        />

        {/* Error display */}
        {(activeDuelsError || duelStatsError) && activeDuels.length > 0 && (
          <Alert
            type='warning'
            message='Veriler yenilenirken sorun yaşandı. Çekmek için aşağı kaydırın.'
            style={styles.bottomAlert}
          />
        )}

        {/* No data state */}
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
              animated={false}
              icon='refresh'
              style={[styles.noDataButton, { backgroundColor: contextColor }]}
            />
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </>
    ),
    [
      contextColor,
      preferredCourse,
      handleDuelHistory,
      activeDuelsError,
      duelStatsError,
      activeDuels.length,
      isLoading,
      hasError,
      dynamicStyles,
      handleRetry,
    ],
  );

  // Auth check effect
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, router]);

  // Error state
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
              animated={false}
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

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={contextColor} />
          <Text style={dynamicStyles.loadingText}>Düellolar yükleniyor...</Text>
          <Text style={dynamicStyles.loadingSubtext}>
            Bu birkaç saniye sürebilir
          </Text>
        </View>
      </View>
    );
  }

  // Main render with FlatList
  return (
    <View style={styles.container}>
      <FlatList
        data={activeDuels}
        renderItem={renderDuelItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={styles.flatListContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={contextColor}
            colors={[contextColor]}
            title='Yenileniyor...'
          />
        }
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        windowSize={10}
        initialNumToRender={3}
        updateCellsBatchingPeriod={50}
        getItemLayout={getItemLayout}
        // Prevent unnecessary re-renders
        extraData={`${contextColor}-${preferredCourse?.category || ''}`}
      />
    </View>
  );
}

// Optimized styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flatListContent: {
    padding: Spacing[4],
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing[8],
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
  noDataButton: {},
  bottomSpacing: {
    height: Spacing[8],
  },
  errorContainer: {
    flex: 1,
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
