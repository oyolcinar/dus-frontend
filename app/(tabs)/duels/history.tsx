// app/(tabs)/duels/history.tsx - Duel History Screen with stats and individual results

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  useColorScheme,
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
import { duelResultService } from '../../../src/api';
import { DuelResult } from '../../../src/types/models';
import { UserDuelStatsPayload } from '../../../src/api/duelResultService';
import { globalStyles } from '../../../utils/styleUtils';
import { useAuth } from '../../../context/AuthContext';

type HistoryTab = 'stats' | 'recent' | 'all';

interface DuelHistoryItem extends DuelResult {
  // Extend DuelResult with computed properties for display
  result: 'won' | 'lost' | 'draw';
  opponentName?: string;
  courseName?: string;
  testName?: string;
  formattedDate: string;
}

export default function DuelHistoryScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const {
    user: contextUser,
    isLoading: authLoading,
    isSessionValid,
  } = useAuth();

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

  // Fetch duel history data
  const fetchHistoryData = useCallback(async () => {
    try {
      setError(null);

      if (!contextUser || !isSessionValid) {
        setError('Giriş yapmanız gerekiyor.');
        return;
      }

      // Only fetch user stats (this endpoint works)
      const statsData = await duelResultService.getUserDuelStats();
      setUserStats(statsData);

      // Generate placeholder history based on stats we have
      const generatePlaceholderHistory = (
        stats: UserDuelStatsPayload,
      ): DuelHistoryItem[] => {
        const history: DuelHistoryItem[] = [];
        const totalDuels = stats.totalDuels || 0;

        if (totalDuels === 0) return [];

        // Generate placeholder duels based on win/loss counts
        for (let i = 0; i < Math.min(totalDuels, 50); i++) {
          const isWin = i < (stats.wins || 0);
          const duelId = 1000 + i;

          history.push({
            duel_id: duelId,
            winner_id: isWin ? userData?.userId : (userData?.userId || 0) + 1,
            initiator_score: isWin
              ? Math.floor(Math.random() * 20) + 15 // Winner gets higher score
              : Math.floor(Math.random() * 15) + 5, // Loser gets lower score
            opponent_score: isWin
              ? Math.floor(Math.random() * 15) + 5 // Opponent gets lower score when user wins
              : Math.floor(Math.random() * 20) + 15, // Opponent gets higher score when user loses
            created_at: new Date(
              Date.now() - i * 24 * 60 * 60 * 1000,
            ).toISOString(),
            // Computed properties
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
          });
        }

        return history.reverse(); // Most recent first
      };

      // Generate placeholder history based on our stats
      const placeholderHistory = generatePlaceholderHistory(statsData);
      setDuelHistory(placeholderHistory);
      setRecentDuels(placeholderHistory.slice(0, 10));
    } catch (e) {
      console.error('Error fetching history data:', e);
      setError('İstatistik verileri yüklenirken bir hata oluştu.');
    }
  }, [contextUser, isSessionValid, userData?.userId]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchHistoryData();
    setRefreshing(false);
  }, [fetchHistoryData]);

  const handleRetry = useCallback(async () => {
    setIsLoading(true);
    await fetchHistoryData();
    setIsLoading(false);
  }, [fetchHistoryData]);

  // Initial data fetch
  useEffect(() => {
    const initialFetch = async () => {
      if (userData) {
        setIsLoading(true);
        await fetchHistoryData();
        setIsLoading(false);
      }
    };
    initialFetch();
  }, [fetchHistoryData, userData]);

  // Filter Button Component
  const FilterButton = ({
    filter,
    title,
    icon,
  }: {
    filter: HistoryTab;
    title: string;
    icon: string;
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
      <Row style={{ alignItems: 'center', justifyContent: 'center' }}>
        <FontAwesome
          name={icon as any}
          size={12}
          color={
            activeTab === filter
              ? Colors.white
              : isDark
              ? Colors.gray[700]
              : Colors.gray[700]
          }
          style={{ marginRight: Spacing[1] }}
        />
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
      </Row>
    </TouchableOpacity>
  );

  // Stats Card Component
  const StatsCard = ({
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
    <PlayfulCard
      style={{
        backgroundColor: 'rgba(255,255,255,0.95)',
        marginBottom: Spacing[3],
        flex: 1,
        marginHorizontal: Spacing[1],
      }}
    >
      <Column style={{ alignItems: 'center' }}>
        <Text
          style={{
            fontSize: 12,
            color: Colors.gray[600],
            fontFamily: 'SecondaryFont-Regular',
            textAlign: 'center',
            marginBottom: Spacing[1],
          }}
        >
          {title}
        </Text>
        {animated && typeof value === 'number' ? (
          <AnimatedCounter
            value={value}
            style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: color,
              fontFamily: 'PrimaryFont',
            }}
          />
        ) : (
          <Text
            style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: color,
              fontFamily: 'PrimaryFont',
              textAlign: 'center',
            }}
          >
            {value}
          </Text>
        )}
        {subtitle && (
          <Text
            style={{
              fontSize: 10,
              color: Colors.gray[500],
              fontFamily: 'SecondaryFont-Regular',
              textAlign: 'center',
              marginTop: 2,
            }}
          >
            {subtitle}
          </Text>
        )}
      </Column>
    </PlayfulCard>
  );

  // Duel History Item Component (kept for future use)
  const DuelHistoryItem = ({ duel }: { duel: DuelHistoryItem }) => {
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

    const getResultIcon = () => {
      switch (duel.result) {
        case 'won':
          return '🏆';
        case 'lost':
          return '😔';
        case 'draw':
          return '🤝';
        default:
          return '❓';
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
              name={getResultIcon()}
              bgColor={getResultColor()}
              style={{ marginRight: Spacing[3] }}
            />
            <Column style={{ flex: 1 }}>
              <Row style={{ alignItems: 'center', marginBottom: 4 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: 'bold',
                    color: Colors.gray[800],
                    fontFamily: 'SecondaryFont-Bold',
                    marginRight: Spacing[2],
                  }}
                >
                  vs {duel.opponentName}
                </Text>
                <Badge
                  text={getResultText()}
                  variant={
                    duel.result === 'won'
                      ? 'success'
                      : duel.result === 'lost'
                      ? 'error'
                      : 'warning'
                  }
                  style={{
                    backgroundColor: getResultColor(),
                  }}
                  textStyle={{
                    color: Colors.white,
                    fontFamily: 'SecondaryFont-Bold',
                  }}
                />
              </Row>
              <Text
                style={{
                  fontSize: 12,
                  color: Colors.gray[600],
                  fontFamily: 'SecondaryFont-Regular',
                  marginBottom: 2,
                }}
              >
                📚 {duel.courseName} • 📝 {duel.testName}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: Colors.gray[500],
                  fontFamily: 'SecondaryFont-Regular',
                }}
              >
                {duel.formattedDate}
              </Text>
            </Column>
          </Row>
          <Column style={{ alignItems: 'center' }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: getResultColor(),
                fontFamily: 'PrimaryFont',
              }}
            >
              {duel.initiator_score}-{duel.opponent_score}
            </Text>
          </Column>
        </Row>
      </PlayfulCard>
    );
  };

  // Render tab content
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
                  <PlayfulCard
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      marginBottom: Spacing[4],
                    }}
                  >
                    <Column style={{ alignItems: 'center' }}>
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: 'bold',
                          color: Colors.gray[800],
                          fontFamily: 'SecondaryFont-Bold',
                          marginBottom: Spacing[3],
                          textAlign: 'center',
                        }}
                      >
                        Genel Performans 📊
                      </Text>
                      <Row
                        style={{
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <ScoreDisplay
                          score={userStats.wins || 0}
                          maxScore={userStats.totalDuels || 0}
                          label={`${userStats.totalDuels || 0} Düellodan ${
                            userStats.wins || 0
                          } Galibiyet`}
                          variant='gradient'
                          size='large'
                        />
                      </Row>
                    </Column>
                  </PlayfulCard>
                </SlideInElement>

                <SlideInElement delay={100} key={`${activeTab}-stats-row1`}>
                  <Row style={{ marginBottom: Spacing[3] }}>
                    {/* <StatsCard
                      title='Galibiyet Oranı'
                      value={`${parseFloat(
                        userStats.winRate?.toString() || '0',
                      ).toFixed(1)}%`}
                      color={Colors.vibrant.mint}
                    /> */}
                    <StatsCard
                      title='Toplam Düello'
                      value={userStats.totalDuels || 0}
                      color={Colors.vibrant.purple}
                      animated
                    />
                  </Row>
                </SlideInElement>

                <SlideInElement delay={200} key={`${activeTab}-stats-row2`}>
                  <Row style={{ marginBottom: Spacing[3] }}>
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
                  <Row style={{ marginBottom: Spacing[3] }}>
                    {/* <StatsCard
                      title='Ortalama Puan'
                      value={parseFloat(
                        userStats.averageScore?.toString() || '0',
                      ).toFixed(1)}
                      color={Colors.vibrant.yellow}
                    /> */}
                    <StatsCard
                      title='Başarı Oranı'
                      value={
                        userStats.totalDuels > 0
                          ? `${Math.round(
                              ((userStats.wins || 0) / userStats.totalDuels) *
                                100,
                            )}%`
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
                  {
                    color: isDark ? Colors.gray[800] : Colors.gray[800],
                    marginBottom: Spacing[2],
                    fontFamily: 'SecondaryFont-Bold',
                  },
                ]}
              >
                Son Düellolar ({recentDuels.length})
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: Colors.gray[600],
                  fontFamily: 'SecondaryFont-Regular',
                  marginBottom: Spacing[3],
                  fontStyle: 'italic',
                }}
              >
                * İstatistiklerinize dayalı örnek düello geçmişi
              </Text>
            </SlideInElement>
            {recentDuels.map((duel, index) => (
              <SlideInElement
                key={`${activeTab}-recent-${duel.duel_id}`}
                delay={100 + index * 50}
              >
                <DuelHistoryItem duel={duel} />
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
                  {
                    color: isDark ? Colors.gray[800] : Colors.gray[800],
                    marginBottom: Spacing[2],
                    fontFamily: 'SecondaryFont-Bold',
                  },
                ]}
              >
                Tüm Düellolar ({duelHistory.length})
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  color: Colors.gray[600],
                  fontFamily: 'SecondaryFont-Regular',
                  marginBottom: Spacing[3],
                  fontStyle: 'italic',
                }}
              >
                * İstatistiklerinize dayalı örnek düello geçmişi
              </Text>
            </SlideInElement>
            {duelHistory.map((duel, index) => (
              <SlideInElement
                key={`${activeTab}-all-${duel.duel_id}`}
                delay={50 + index * 25}
              >
                <DuelHistoryItem duel={duel} />
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
  };

  // Show loading while checking auth
  if (authLoading) {
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
          Yükleniyor...
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
                  Düello Geçmişi 📈
                </PlayfulTitle>
                <Paragraph
                  color={isDark ? Colors.gray[100] : Colors.gray[100]}
                  style={{
                    fontFamily: 'SecondaryFont-Regular',
                  }}
                >
                  Performansın ve geçmiş düellolarınız
                </Paragraph>
              </Column>
              <Avatar size='md' name='📈' bgColor={VIBRANT_COLORS.purple} />
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

        {/* Bottom spacing to ensure content is fully visible */}
        <View style={{ height: Spacing[8] }} />
      </ScrollView>
    </View>
  );
}
