// app/(tabs)/duels/history.tsx - Updated with new hooks and store

import React, { useState, useMemo } from 'react';
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
import {
  Container,
  SlideInElement,
  PlayfulCard,
  PlayfulTitle,
  Paragraph,
  Row,
  Column,
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
  useDuelHistoryData,
  duelHelpers,
  type DuelHistoryItem,
} from '../../../src/hooks/useDuelsData';
import { useAuth } from '../../../stores/appStore';
import { globalStyles } from '../../../utils/styleUtils';

type HistoryTab = 'stats' | 'recent' | 'all';

// Optimized shadow configuration
const OPTIMIZED_SHADOW = {
  // Remove shadows to improve performance if needed
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

  // 🚀 NEW: Use the simplified auth hook from store
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // 🚀 NEW: Use the specialized duel history hook
  const {
    duelStats,
    duelHistory,
    recentDuels,
    isLoading,
    hasError,
    refetchAll,
    duelStatsLoading,
    historyLoading,
    duelStatsError,
    historyError,
  } = useDuelHistoryData(50, 10); // 50 total history, 10 recent

  // State management
  const [activeTab, setActiveTab] = useState<HistoryTab>('stats');
  const [refreshing, setRefreshing] = useState(false);

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

  // 🚀 SIMPLIFIED: Handle refresh using the hook's refetch function
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchAll();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // 🚀 SIMPLIFIED: Handle retry using the hook's refetch function
  const handleRetry = async () => {
    try {
      await refetchAll();
    } catch (error) {
      console.error('Error retrying data fetch:', error);
    }
  };

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

  // 🚀 IMPROVED: Memoized Duel History Item Component using helper functions
  const DuelHistoryItemComponent = React.memo(
    ({ duel }: { duel: DuelHistoryItem }) => {
      const resultColor = duelHelpers.getResultColor(duel.result);
      const resultText = duelHelpers.getResultText(duel.result);
      const formattedDate = duelHelpers.formatDuelDate(duel.created_at);

      const resultVariant =
        duel.result === 'won'
          ? 'success'
          : duel.result === 'lost'
            ? 'error'
            : 'warning';

      return (
        <PlayfulCard style={styles.historyCard}>
          <Row style={styles.historyRow}>
            <Row style={styles.historyContent}>
              <Column style={styles.historyColumn}>
                <Row style={styles.historyHeader}>
                  <Text style={styles.historyOpponent}>
                    vs {duel.opponentName || 'Bilinmeyen Rakip'}
                  </Text>
                  <Badge
                    text={resultText}
                    variant={resultVariant as any}
                    style={{ backgroundColor: resultColor }}
                    textStyle={{
                      color: Colors.white,
                      fontFamily: 'SecondaryFont-Bold',
                    }}
                  />
                </Row>
                <Row style={styles.historyDetails}>
                  <Text style={styles.historyInfo}>
                    📚 {duel.courseName || 'Bilinmeyen Ders'} • 📝{' '}
                    {duel.testName || 'Test'}
                  </Text>
                  <Text style={[styles.historyScore, { color: resultColor }]}>
                    {duel.initiator_score || 0}-{duel.opponent_score || 0}
                  </Text>
                </Row>
                <Text style={styles.historyDate}>
                  {duel.formattedDate || formattedDate}
                </Text>
              </Column>
            </Row>
          </Row>
        </PlayfulCard>
      );
    },
  );

  // 🚀 SIMPLIFIED: Memoized tab content using hook data
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
            {duelStats && (
              <>
                <SlideInElement delay={0} key={`${activeTab}-overview`}>
                  <PlayfulCard style={styles.overviewCard}>
                    <Column style={styles.overviewColumn}>
                      <Text style={styles.overviewTitle}>
                        Genel Performans 📊
                      </Text>
                      <Row style={styles.overviewRow}>
                        <ScoreDisplay
                          score={duelStats.wins || 0}
                          maxScore={duelStats.totalDuels || 0}
                          label={`${duelStats.totalDuels || 0} Düellodan ${duelStats.wins || 0} Galibiyet`}
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
                      value={duelStats.totalDuels || 0}
                      color={Colors.vibrant.purple}
                      animated
                    />
                  </Row>
                </SlideInElement>

                <SlideInElement delay={200} key={`${activeTab}-stats-row2`}>
                  <Row style={styles.statsRow}>
                    <StatsCard
                      title='Galibiyet'
                      value={duelStats.wins || 0}
                      color={Colors.vibrant.mint}
                      animated
                    />
                    <StatsCard
                      title='Mağlubiyet'
                      value={duelStats.losses || 0}
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
                        duelStats.totalDuels > 0
                          ? `${Math.round(((duelStats.wins || 0) / duelStats.totalDuels) * 100)}%`
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
  }, [activeTab, isLoading, duelStats, recentDuels, duelHistory, colors]);

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

  // Show auth error
  if (!isAuthenticated) {
    return (
      <Container style={styles.errorContainer}>
        <Alert
          type='error'
          title='Giriş Gerekli'
          message='Düello geçmişini görmek için giriş yapmanız gerekiyor.'
          style={styles.errorAlert}
        />
        <Button
          title='Giriş Yap'
          variant='primary'
          onPress={() => router.replace('/(auth)/login')}
          icon='sign-in'
        />
      </Container>
    );
  }

  // Show error if there's a serious error and no data
  if (hasError && !duelStats && !duelHistory.length) {
    const errorMessage =
      duelStatsError?.message ||
      historyError?.message ||
      'Bilinmeyen hata oluştu';

    return (
      <Container style={styles.errorContainer}>
        <Alert
          type='error'
          title='Hata'
          message={`İstatistik verileri yüklenirken hata oluştu: ${errorMessage}`}
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

        {/* 🚀 IMPROVED: Show warning if there are errors but partial data is available */}
        {(duelStatsError || historyError) &&
          (duelStats || duelHistory.length > 0) && (
            <Alert
              type='warning'
              message='Bazı veriler yenilenirken sorun yaşandı. Çekmek için aşağı kaydırın.'
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
