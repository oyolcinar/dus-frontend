// app/(tabs)/profile.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
  RefreshControl,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { authService, achievementService, duelService } from '../../src/api';
import {
  PlayfulCard,
  ProfileHeader,
  PlayfulButton,
  StatCard,
  Avatar,
  Container,
  Title,
  Paragraph,
  Alert,
  Row,
  Column,
  GlassCard,
  Badge,
  AnimatedCounter,
  ScoreDisplay,
  SlideInElement,
  PlayfulTitle,
} from '../../components/ui';
import { Colors, Spacing, FontSizes } from '../../constants/theme';

// Define interface for Achievement since it's not exported from models
interface Achievement {
  achievement_id: number;
  name: string;
  description?: string;
  requirements?: any;
  category?: string;
  icon?: string;
  points?: number;
  created_at: string;
  date_earned?: string;
}

// Define interface for DuelStats - corrected to match the actual API response
interface DuelStats {
  totalDuels: number;
  wins: number;
  losses: number;
  winRate: number;
  longestLosingStreak: number;
  currentLosingStreak: number;
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [duelStats, setDuelStats] = useState<DuelStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfileData = useCallback(async () => {
    try {
      setError(null);

      // Fetch data in parallel
      const [userAchievements, duelStatsResponse] = await Promise.all([
        achievementService.getUserAchievements(),
        duelService.getDuelUserStats(),
      ]);

      setAchievements(userAchievements);

      // Using the correct property names from the API response
      setDuelStats({
        totalDuels: duelStatsResponse.totalDuels,
        wins: duelStatsResponse.wins,
        losses: duelStatsResponse.losses,
        winRate: duelStatsResponse.winRate,
        longestLosingStreak: duelStatsResponse.longestLosingStreak || 0,
        currentLosingStreak: duelStatsResponse.currentLosingStreak || 0,
      });
    } catch (error) {
      console.error('Error fetching profile data:', error);
      setError(
        'Profil verileri yüklenirken bir hata oluştu. Lütfen tekrar deneyin.',
      );
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfileData();
    setRefreshing(false);
  }, [fetchProfileData]);

  const handleRetry = useCallback(async () => {
    setLoading(true);
    await fetchProfileData();
    setLoading(false);
  }, [fetchProfileData]);

  useEffect(() => {
    async function initialFetch() {
      setLoading(true);
      await fetchProfileData();
      setLoading(false);
    }

    initialFetch();
  }, [fetchProfileData]);

  // Get icon for achievement - returns only valid FontAwesome icon names
  const getAchievementIcon = (achievement: Achievement): string => {
    if (achievement.icon) {
      return achievement.icon;
    }

    const category = achievement.category?.toLowerCase() || '';

    if (category.includes('course')) return 'book';
    if (category.includes('study')) return 'clock';
    if (category.includes('duel')) return 'trophy';
    if (category.includes('test')) return 'check-circle';
    if (category.includes('streak')) return 'fire';

    return 'certificate';
  };

  // Get achievement category color
  const getAchievementColor = (achievement: Achievement): string => {
    const category = achievement.category?.toLowerCase() || '';

    if (category.includes('course')) return Colors.vibrant?.blue || Colors.info;
    if (category.includes('study'))
      return Colors.vibrant?.green || Colors.success;
    if (category.includes('duel'))
      return Colors.vibrant?.orange || Colors.warning;
    if (category.includes('test'))
      return Colors.vibrant?.purple || Colors.primary.DEFAULT;
    if (category.includes('streak'))
      return Colors.vibrant?.pink || Colors.error;

    return Colors.vibrant?.yellow || Colors.secondary.DEFAULT;
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      // Navigation will be handled by the AuthContext
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (error && !loading) {
    return (
      <Container
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          padding: Spacing[4],
        }}
      >
        <Alert
          type='error'
          message={error}
          style={{ marginBottom: Spacing[4] }}
        />
        <PlayfulButton
          title='Yenile'
          variant='primary'
          onPress={handleRetry}
          icon='refresh'
          animated
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
        {/* Animated Profile Header */}
        <SlideInElement delay={0}>
          <PlayfulCard
            style={{ marginBottom: Spacing[6], backgroundColor: 'transparent' }}
          >
            <Column style={{ alignItems: 'center' }}>
              <Avatar
                name={user?.username?.[0] || 'U'}
                size='xl'
                bgColor={Colors.white}
                gradient='sunset'
                borderGlow
                animated
                floatingEffect
                style={{ marginBottom: Spacing[2] }}
              />
              <PlayfulTitle
                level={1}
                style={{
                  color: Colors.white,
                  marginBottom: Spacing[1],
                  fontSize: FontSizes['3xl'],
                  textAlign: 'center',
                  fontFamily: 'PrimaryFont',
                }}
              >
                {user?.username || 'Kullanıcı'}
              </PlayfulTitle>
              <Text
                style={{
                  color: Colors.white,
                  opacity: 0.9,
                  textAlign: 'center',
                  fontFamily: 'PrimaryFont',
                }}
              >
                {user?.email || 'email@example.com'}
              </Text>

              {/* User level/score display */}
              <View style={{ marginTop: Spacing[4] }}>
                <ScoreDisplay
                  score={duelStats?.wins || 0}
                  maxScore={duelStats?.totalDuels || 1}
                  label='DÜELLO PUANI'
                  variant='celebration'
                  size='medium'
                  scoreFontFamily='SecondaryFont-Bold'
                  labelFontFamily='SecondaryFont-Bold'
                  maxScoreFontFamily='SecondaryFont-Bold'
                  animated
                  showProgress={true}
                />
              </View>
            </Column>
          </PlayfulCard>
        </SlideInElement>

        <View>
          {loading ? (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                padding: Spacing[4],
              }}
            >
              <ActivityIndicator
                size='large'
                color={isDark ? Colors.primary.DEFAULT : Colors.vibrant.coral}
              />
              <Text
                style={{
                  marginTop: Spacing[3],
                  color: isDark ? Colors.gray[400] : Colors.white,
                  fontFamily: 'SecondaryFont-Regular',
                }}
              >
                Profil verileri yükleniyor...
              </Text>
            </View>
          ) : (
            <>
              {/* Quick Stats */}
              {duelStats && (
                <Row
                  style={{
                    justifyContent: 'space-between',
                    flexWrap: 'nowrap',
                    marginBottom: Spacing[6],
                  }}
                >
                  <StatCard
                    icon='trophy'
                    title='Toplam Düello'
                    value={duelStats.totalDuels.toString()}
                    color={Colors.secondary?.light || Colors.primary.DEFAULT}
                    size='medium'
                    titleFontFamily='SecondaryFont-Bold'
                  />
                  <StatCard
                    icon='check-circle'
                    title='Kazanılan'
                    value={duelStats.wins.toString()}
                    color={Colors.vibrant?.green || Colors.success}
                    size='medium'
                    titleFontFamily='SecondaryFont-Bold'
                  />
                  <StatCard
                    icon='fire'
                    title='Kazanma Oranı'
                    value={`${Math.round(duelStats.winRate)}%`}
                    color={Colors.vibrant?.orange || Colors.warning}
                    size='medium'
                    titleFontFamily='SecondaryFont-Bold'
                  />
                </Row>
              )}

              {/* Detailed Stats */}
              {duelStats && (
                <PlayfulCard
                  titleFontFamily='PrimaryFont'
                  title='Detaylı İstatistikler'
                  variant='playful'
                  style={{ marginBottom: Spacing[6] }}
                  animated
                >
                  <Row style={{ flexWrap: 'wrap', gap: Spacing[3] }}>
                    <View style={{ flex: 1, minWidth: '45%' }}>
                      <Row
                        style={{
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: Spacing[2],
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: 'SecondaryFont-Regular',
                            color: Colors.white,
                          }}
                        >
                          Kaybedilen:
                        </Text>
                        <AnimatedCounter
                          value={duelStats.losses}
                          fontFamily='SecondaryFont-Bold'
                          style={{ color: Colors.white }}
                          size='medium'
                        />
                      </Row>
                    </View>
                    <View style={{ flex: 1, minWidth: '45%' }}>
                      <Row
                        style={{
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: Spacing[2],
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: 'SecondaryFont-Regular',
                            color: Colors.white,
                          }}
                        >
                          En Uzun Seri:
                        </Text>
                        <AnimatedCounter
                          value={duelStats.longestLosingStreak}
                          fontFamily='SecondaryFont-Bold'
                          style={{ color: Colors.white }}
                          size='medium'
                        />
                      </Row>
                    </View>
                  </Row>
                </PlayfulCard>
              )}

              {/* Achievements */}
              <PlayfulCard
                title='Başarılar'
                titleFontFamily='PrimaryFont'
                variant='playful'
                style={{ marginBottom: Spacing[6] }}
                animated
                pulseEffect
              >
                {achievements.length > 0 ? (
                  <>
                    <Row
                      style={{
                        flexWrap: 'wrap',
                        gap: Spacing[2],
                        marginBottom: Spacing[4],
                      }}
                    >
                      {achievements.slice(0, 6).map((achievement) => (
                        <GlassCard
                          key={achievement.achievement_id}
                          style={{
                            width: '30%',
                            alignItems: 'center',
                            padding: Spacing[3],
                            minHeight: 100,
                          }}
                        >
                          <View
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 20,
                              backgroundColor: getAchievementColor(achievement),
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginBottom: Spacing[2],
                            }}
                          >
                            <FontAwesome
                              name={getAchievementIcon(achievement) as any}
                              size={20}
                              color={Colors.white}
                            />
                          </View>
                          <Paragraph
                            style={{
                              fontSize: 10,
                              textAlign: 'center',
                              color: isDark
                                ? Colors.gray[300]
                                : Colors.gray[700],
                            }}
                            numberOfLines={2}
                          >
                            {achievement.name}
                          </Paragraph>
                        </GlassCard>
                      ))}
                    </Row>

                    <Row style={{ gap: Spacing[3] }}>
                      <PlayfulButton
                        title='Tüm Başarılar'
                        onPress={() => router.push('/achievements' as any)}
                        variant='outline'
                        style={{ flex: 1 }}
                        icon='trophy'
                        animated
                      />
                      <Badge
                        text={`${achievements.length} Başarı`}
                        variant='success'
                        size='md'
                      />
                    </Row>
                  </>
                ) : (
                  <Column
                    style={{
                      alignItems: 'center',
                      paddingVertical: Spacing[4],
                    }}
                  >
                    <FontAwesome
                      name='trophy'
                      size={48}
                      color={Colors.gray[400]}
                      style={{ marginBottom: Spacing[3] }}
                    />
                    <Text
                      style={{
                        fontFamily: 'SecondaryFont-Regular',
                        color: isDark ? Colors.gray[400] : Colors.white,
                      }}
                    >
                      Henüz başarı kazanılmadı
                    </Text>
                    <PlayfulButton
                      title='Başarıları Keşfet'
                      onPress={() => router.push('/achievements' as any)}
                      variant='secondary'
                      size='small'
                      style={{ marginTop: Spacing[3] }}
                      animated
                      wiggleOnPress={true}
                      fontFamily='SecondaryFont-Bold'
                    />
                  </Column>
                )}
              </PlayfulCard>

              {/* Account Settings */}
              <PlayfulCard
                title='Hesap Ayarları'
                variant='playful'
                gradient='sky'
                titleFontFamily='PrimaryFont'
                style={{ marginBottom: Spacing[6] }}
                animated
              >
                <Column style={{ gap: Spacing[2] }}>
                  <PlayfulButton
                    title='Profil Düzenle'
                    onPress={() => router.push('/edit-profile' as any)}
                    variant='outline'
                    icon='user'
                    // style={{
                    //   backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    //   borderColor: 'rgba(255, 255, 255, 0.3)',
                    // }}
                    animated
                  />

                  <PlayfulButton
                    title='Şifre Değiştir'
                    onPress={() => router.push('/change-password' as any)}
                    variant='outline'
                    icon='lock'
                    // style={{
                    //   backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    //   borderColor: 'rgba(255, 255, 255, 0.3)',
                    // }}
                    animated
                  />

                  <PlayfulButton
                    title='Bildirim Ayarları'
                    onPress={() => router.push('/notifications' as any)}
                    variant='outline'
                    icon='bell'
                    // style={{
                    //   backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    //   borderColor: 'rgba(255, 255, 255, 0.3)',
                    // }}
                    animated
                  />
                </Column>
              </PlayfulCard>

              {/* Quick Actions */}
              <PlayfulCard
                title='Hızlı İşlemler'
                variant='playful'
                titleFontFamily='PrimaryFont'
                style={{ marginBottom: Spacing[6] }}
                animated
              >
                <Row style={{ justifyContent: 'space-between' }}>
                  <PlayfulButton
                    title='Test Geçmişi'
                    onPress={() => router.push('/test-history' as any)}
                    variant='outline'
                    style={{ flex: 1 }}
                    icon='history'
                    gradient='purple'
                    fontFamily='PrimaryFont'
                    size='small'
                    animated
                  />
                  <PlayfulButton
                    title='Düello Geçmişi'
                    onPress={() => router.push('/duel-history' as any)}
                    variant='outline'
                    style={{ flex: 1 }}
                    icon='list'
                    gradient='fire'
                    fontFamily='PrimaryFont'
                    size='small'
                    animated
                  />
                </Row>
              </PlayfulCard>

              {/* App Info & Sign Out */}
              <GlassCard style={{ marginBottom: Spacing[6] }}>
                <Column style={{ gap: Spacing[3] }}>
                  <Row
                    style={{
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        color: isDark ? Colors.gray[400] : Colors.gray[100],
                        fontFamily: 'SecondaryFont-Regular',
                      }}
                    >
                      Versiyon: 1.0.0
                    </Text>
                    <Badge
                      text='Güncel'
                      variant='success'
                      size='md'
                      fontFamily='SecondaryFont-Bold'
                    />
                  </Row>

                  <PlayfulButton
                    title='Çıkış Yap'
                    onPress={handleSignOut}
                    variant='vibrant'
                    gradient='fire'
                    icon='sign-out'
                    animated
                    wiggleOnPress
                  />
                </Column>
              </GlassCard>

              {/* Error display at bottom if there's an error but data is loaded */}
              {error && !loading && (achievements.length > 0 || duelStats) && (
                <Alert
                  type='warning'
                  message='Veriler yenilenirken sorun yaşandı. Çekmek için aşağı kaydırın.'
                  style={{ marginTop: Spacing[4] }}
                />
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
