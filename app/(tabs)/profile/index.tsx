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
import { useAuth } from '../../../context/AuthContext';
import { authService, achievementService, duelService } from '../../../src/api';
import { checkAndRefreshSession } from '../../../src/api/authService';
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
  EmptyState,
  CourseSelectionModal, // Import CourseSelectionModal
} from '../../../components/ui';
import { Colors, Spacing, FontSizes } from '../../../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  usePreferredCourse,
  PreferredCourseProvider,
} from '../../../context/PreferredCourseContext';

// Use the theme constants correctly
const VIBRANT_COLORS = Colors.vibrant;

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

// Main Profile Screen Component (wrapped with context)
function ProfileScreenContent() {
  const { user, signOut, refreshSession } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Use the preferred course context
  const {
    preferredCourse,
    isLoading: courseLoading,
    getCourseColor,
  } = usePreferredCourse();

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [duelStats, setDuelStats] = useState<DuelStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<{ username?: string } | null>(null);

  // Add state for course modal visibility
  const [showCourseModal, setShowCourseModal] = useState(false);

  // Load user data from AsyncStorage
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          setUserData(JSON.parse(userData));
        }
      } catch (error) {
        console.error('Error loading user data from AsyncStorage:', error);
      }
    };

    loadUserData();
  }, []);

  // Enhanced fetchData function with better error handling
  const fetchProfileData = useCallback(async () => {
    try {
      setError(null);

      // Check session before making requests
      const sessionValid = await checkAndRefreshSession();
      if (!sessionValid) {
        console.log('Session invalid, redirecting to login');
        router.replace('/(auth)/login');
        return;
      }

      // Use Promise.allSettled to handle partial failures gracefully
      const [achievementsResponse, duelStatsResponse] =
        await Promise.allSettled([
          achievementService.getUserAchievements(),
          duelService.getDuelUserStats(),
        ]);

      // Process each response individually
      let hasData = false;

      // Process achievements
      if (achievementsResponse.status === 'fulfilled') {
        setAchievements(achievementsResponse.value);
        hasData = true;
      } else {
        console.error(
          'Failed to fetch achievements:',
          achievementsResponse.reason,
        );
        setAchievements([]); // Set empty array instead of keeping old data
      }

      // Process duel stats
      if (duelStatsResponse.status === 'fulfilled') {
        // Using the correct property names from the API response
        setDuelStats({
          totalDuels: duelStatsResponse.value.totalDuels,
          wins: duelStatsResponse.value.wins,
          losses: duelStatsResponse.value.losses,
          winRate: duelStatsResponse.value.winRate,
          longestLosingStreak: duelStatsResponse.value.longestLosingStreak || 0,
          currentLosingStreak: duelStatsResponse.value.currentLosingStreak || 0,
        });
        hasData = true;
      } else {
        console.error('Failed to fetch duel stats:', duelStatsResponse.reason);
        setDuelStats(null);
      }

      // Check if all requests failed
      if (!hasData) {
        const firstError = [achievementsResponse, duelStatsResponse].find(
          (response) => response.status === 'rejected',
        )?.reason;

        if (firstError?.message?.includes('Oturum süresi doldu')) {
          router.replace('/(auth)/login');
          return;
        }

        setError('Veri yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);

      // Check if it's an authentication error
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

  // Enhanced handleRefresh function
  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);

      console.log('Refreshing profile data...');

      // Check session before refreshing
      const sessionValid = await checkAndRefreshSession();
      if (!sessionValid) {
        console.log('Session invalid during refresh, redirecting to login');
        router.replace('/(auth)/login');
        return;
      }

      await fetchProfileData();
      console.log('Profile refresh completed successfully');
    } catch (error) {
      console.error('Profile refresh failed:', error);

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
  }, [fetchProfileData, router]);

  // Enhanced handleRetry function
  const handleRetry = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Retrying profile data fetch...');

      // First try to refresh the session using AuthContext
      try {
        await refreshSession();
        console.log('Session refreshed via AuthContext');
      } catch (sessionError) {
        console.error('AuthContext session refresh failed:', sessionError);

        // Fallback to manual session check
        const sessionValid = await checkAndRefreshSession();
        if (!sessionValid) {
          console.log('Manual session check failed, redirecting to login');
          router.replace('/(auth)/login');
          return;
        }
      }

      // Wait a bit before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Retry fetching data
      await fetchProfileData();

      console.log('Profile retry completed successfully');
    } catch (error) {
      console.error('Profile retry failed:', error);

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
  }, [fetchProfileData, router, refreshSession]);

  // Enhanced initial fetch
  useEffect(() => {
    async function initialFetch() {
      setLoading(true);

      try {
        // Check session on app load
        const sessionValid = await checkAndRefreshSession();
        if (!sessionValid) {
          setLoading(false);
          router.replace('/(auth)/login');
          return;
        }

        await fetchProfileData();
      } catch (error) {
        console.error('Initial profile fetch error:', error);
        setError('Başlangıç verisi yüklenemedi. Lütfen tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    }

    initialFetch();
  }, [fetchProfileData, router]);

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

  // Get achievement category color - now uses context colors as fallback
  const getAchievementColor = (achievement: Achievement): string => {
    const category = achievement.category?.toLowerCase() || '';

    if (category.includes('course')) return Colors.vibrant?.blue || Colors.info;
    if (category.includes('study'))
      return Colors.vibrant?.green || Colors.success;
    if (category.includes('duel'))
      return Colors.vibrant?.orange || Colors.warning;
    if (category.includes('test'))
      return (
        (preferredCourse as any)?.category &&
        getCourseColor((preferredCourse as any).category)
      );
    if (category.includes('streak'))
      return Colors.vibrant?.pink || Colors.error;

    return (
      ((preferredCourse as any)?.category &&
        getCourseColor((preferredCourse as any).category)) ||
      Colors.vibrant?.yellow ||
      Colors.secondary.DEFAULT
    );
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      // Navigation will be handled by the AuthContext
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Handler for showing course modal
  const handleShowCourseModal = () => {
    setShowCourseModal(true);
  };

  // Handler for closing course modal
  const handleCourseModalClose = () => {
    setShowCourseModal(false);
  };

  // Handler for course selection
  const handleCourseSelected = () => {
    setShowCourseModal(false);
  };

  // Get the current context color
  const contextColor =
    ((preferredCourse as any)?.category &&
      getCourseColor((preferredCourse as any).category)) ||
    VIBRANT_COLORS.purple;

  // Enhanced error screen with better retry options
  if (error && !loading) {
    return (
      <Container
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          padding: Spacing[4],
        }}
      >
        <View style={{ alignItems: 'center', maxWidth: 300 }}>
          <FontAwesome
            name='exclamation-triangle'
            size={64}
            color={Colors.vibrant?.orange || Colors.warning}
            style={{ marginBottom: Spacing[4] }}
          />

          <Text
            style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: isDark ? Colors.gray[800] : Colors.gray[800],
              textAlign: 'center',
              marginBottom: Spacing[2],
              fontFamily: 'SecondaryFont-Bold',
            }}
          >
            Bir Sorun Oluştu
          </Text>

          <Alert
            type='error'
            message={error}
            style={{ marginBottom: Spacing[6] }}
          />

          <View style={{ width: '100%', gap: Spacing[3] }}>
            <PlayfulButton
              title='Yeniden Dene'
              onPress={handleRetry}
              variant='primary'
              animated
              icon='refresh'
              size='medium'
              style={{
                width: '100%',
                backgroundColor: contextColor,
              }}
            />

            <PlayfulButton
              title='Giriş Ekranına Dön'
              onPress={() => router.replace('/(auth)/login')}
              variant='outline'
              size='medium'
              style={{ width: '100%' }}
            />
          </View>
        </View>
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
            tintColor={contextColor}
            colors={[contextColor]}
            title='Yenileniyor...'
            titleColor={isDark ? Colors.gray[600] : Colors.gray[600]}
          />
        }
      >
        {/* Animated Profile Header */}
        <SlideInElement delay={0}>
          <View
            style={{
              marginBottom: Spacing[6],
            }}
          >
            <Column style={{ alignItems: 'center' }}>
              <Avatar
                name={(user?.username || userData?.username)?.[0] || 'U'}
                size='xl'
                bgColor={contextColor}
                gradient='sunset'
                borderGlow
                animated
                floatingEffect
                style={{
                  marginBottom: Spacing[2],
                  shadowColor: Colors.gray[900],
                  shadowOffset: { width: 10, height: 20 },
                  shadowOpacity: 0.8,
                  shadowRadius: 10,
                  elevation: 10,
                }}
              />
              <PlayfulTitle
                level={1}
                style={{
                  color: Colors.gray[900],
                  marginBottom: Spacing[1],
                  fontSize: FontSizes['3xl'],
                  textAlign: 'center',
                  fontFamily: 'PrimaryFont',
                }}
              >
                {user?.username || userData?.username || 'Kullanıcı'}
              </PlayfulTitle>
              <Text
                style={{
                  color: Colors.gray[700],
                  opacity: 0.9,
                  textAlign: 'center',
                  fontFamily: 'PrimaryFont',
                }}
              >
                {user?.email || 'email@example.com'}
              </Text>

              {/* User level/score display */}
              <View
                style={{
                  marginTop: Spacing[4],
                  shadowColor: Colors.gray[900],
                  shadowOffset: { width: 10, height: 20 },
                  shadowOpacity: 0.8,
                  shadowRadius: 10,
                  elevation: 10,
                }}
              >
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
                  style={{
                    shadowColor: Colors.gray[900],

                    backgroundColor: contextColor,
                  }}
                />
              </View>
            </Column>
          </View>
        </SlideInElement>

        <View>
          {loading ? (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                padding: Spacing[8],
              }}
            >
              <ActivityIndicator size='large' color={contextColor} />
              <Text
                style={{
                  marginTop: Spacing[4],
                  color: isDark ? Colors.white : Colors.white,
                  fontFamily: 'SecondaryFont-Regular',
                  fontSize: 16,
                }}
              >
                Profil verileri yükleniyor...
              </Text>
              <Text
                style={{
                  marginTop: Spacing[2],
                  color: isDark ? Colors.gray[200] : Colors.gray[200],
                  fontFamily: 'SecondaryFont-Regular',
                  fontSize: 14,
                  textAlign: 'center',
                }}
              >
                Bu birkaç saniye sürebilir
              </Text>
            </View>
          ) : (
            <>
              {/* Quick Stats */}
              {duelStats && (
                <SlideInElement direction='up' delay={200}>
                  <Row
                    style={{
                      justifyContent: 'space-between',
                      flexWrap: 'nowrap',
                      marginBottom: Spacing[6],
                    }}
                  >
                    <View
                      style={{
                        marginTop: Spacing[4],
                        shadowColor: Colors.gray[900],
                        shadowOffset: { width: 10, height: 20 },
                        shadowOpacity: 0.8,
                        shadowRadius: 10,
                        elevation: 10,
                      }}
                    >
                      <StatCard
                        icon='trophy'
                        title='Toplam Düello'
                        value={duelStats.totalDuels.toString()}
                        color={Colors.white}
                        size='medium'
                        titleFontFamily='SecondaryFont-Bold'
                        style={{ backgroundColor: contextColor }}
                      />
                    </View>
                    <View
                      style={{
                        marginTop: Spacing[4],
                        shadowColor: Colors.gray[900],
                        shadowOffset: { width: 10, height: 20 },
                        shadowOpacity: 0.8,
                        shadowRadius: 10,
                        elevation: 10,
                      }}
                    >
                      <StatCard
                        icon='check-circle'
                        title='Kazanılan'
                        value={duelStats.wins.toString()}
                        color={Colors.white}
                        size='medium'
                        titleFontFamily='SecondaryFont-Bold'
                        style={{ backgroundColor: contextColor }}
                      />
                    </View>
                    <View
                      style={{
                        marginTop: Spacing[4],
                        shadowColor: Colors.gray[900],
                        shadowOffset: { width: 10, height: 20 },
                        shadowOpacity: 0.8,
                        shadowRadius: 10,
                        elevation: 10,
                      }}
                    >
                      <StatCard
                        icon='fire'
                        title='Kazanma Oranı'
                        value={`${Math.round(duelStats.winRate)}%`}
                        color={Colors.white}
                        size='medium'
                        titleFontFamily='SecondaryFont-Bold'
                        style={{ backgroundColor: contextColor }}
                      />
                    </View>
                  </Row>
                </SlideInElement>
              )}

              {/* Detailed Stats */}
              {duelStats && (
                <SlideInElement direction='left' delay={400}>
                  <View
                    style={{
                      marginTop: Spacing[4],
                      shadowColor: Colors.gray[900],
                      shadowOffset: { width: 10, height: 20 },
                      shadowOpacity: 0.8,
                      shadowRadius: 10,
                      elevation: 10,
                    }}
                  >
                    <PlayfulCard
                      titleFontFamily='PrimaryFont'
                      title='Detaylı İstatistikler'
                      variant='playful'
                      category={(preferredCourse as any)?.category}
                      style={{
                        marginBottom: Spacing[6],
                        shadowColor: Colors.gray[900],
                        shadowOffset: { width: 10, height: 20 },
                        shadowOpacity: 0.8,
                        shadowRadius: 10,
                        elevation: 10,
                        backgroundColor: contextColor,
                      }}
                      animated
                      floatingAnimation
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
                  </View>
                </SlideInElement>
              )}

              {/* Achievements */}
              <SlideInElement direction='right' delay={600}>
                <View
                  style={{
                    marginTop: Spacing[4],
                    shadowColor: Colors.gray[900],
                    shadowOffset: { width: 10, height: 20 },
                    shadowOpacity: 0.8,
                    shadowRadius: 10,
                    elevation: 10,
                  }}
                >
                  <PlayfulCard
                    title='Başarılar'
                    titleFontFamily='PrimaryFont'
                    variant='playful'
                    category={(preferredCourse as any)?.category}
                    style={{
                      marginBottom: Spacing[6],
                      shadowColor: Colors.gray[900],
                      shadowOffset: { width: 10, height: 20 },
                      shadowOpacity: 0.8,
                      shadowRadius: 10,
                      elevation: 10,
                      backgroundColor: contextColor,
                    }}
                    animated
                    floatingAnimation
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
                                width: '100%',
                                padding: Spacing[3],
                                minHeight: 50,
                              }}
                              shimmerEffect
                            >
                              <View
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                }}
                              >
                                <View
                                  style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 20,
                                    backgroundColor:
                                      getAchievementColor(achievement),
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: Spacing[2],
                                  }}
                                >
                                  <FontAwesome
                                    name={
                                      getAchievementIcon(achievement) as any
                                    }
                                    size={20}
                                    color={Colors.white}
                                  />
                                </View>
                                <Text
                                  style={{
                                    fontSize: 20,
                                    flex: 1,
                                    textAlign: 'center',
                                    color: isDark ? Colors.white : Colors.white,
                                    fontFamily: 'SecondaryFont-Bold',
                                  }}
                                  numberOfLines={1}
                                >
                                  {achievement.name}
                                </Text>
                              </View>
                            </GlassCard>
                          ))}
                        </Row>

                        <PlayfulButton
                          fontFamily='SecondaryFont-Bold'
                          title='Tüm Başarılar'
                          onPress={() =>
                            router.push('/(tabs)/profile/achievements' as any)
                          }
                          variant='outline'
                          style={{ flex: 1 }}
                          icon='trophy'
                          animated
                        />
                      </>
                    ) : (
                      <EmptyState
                        icon='trophy'
                        title='Henüz başarı yok'
                        fontFamily='PrimaryFont'
                        message='Daha fazla çalışıkça başarılar kazanacaksınız.'
                        actionButton={{
                          title: 'Başarıları Keşfet',
                          onPress: () =>
                            router.push('/(tabs)/profile/achievements' as any),
                          variant: 'secondary',
                        }}
                        buttonFontFamily='PrimaryFont'
                        style={{
                          backgroundColor: isDark ? Colors.white : Colors.white,
                          shadowColor: Colors.gray[900],
                          shadowOffset: { width: 10, height: 20 },
                          shadowOpacity: 0.8,
                          shadowRadius: 10,
                          elevation: 10,
                        }}
                      />
                    )}
                  </PlayfulCard>
                </View>
              </SlideInElement>

              <SlideInElement direction='right' delay={800}>
                <View
                  style={{
                    marginTop: Spacing[4],
                    shadowColor: Colors.gray[900],
                    shadowOffset: { width: 10, height: 20 },
                    shadowOpacity: 0.8,
                    shadowRadius: 10,
                    elevation: 10,
                  }}
                >
                  <PlayfulCard
                    title='Bildirimler'
                    titleFontFamily='PrimaryFont'
                    variant='playful'
                    category={(preferredCourse as any)?.category}
                    style={{
                      marginBottom: Spacing[6],
                      shadowColor: Colors.gray[900],
                      shadowOffset: { width: 10, height: 20 },
                      shadowOpacity: 0.8,
                      shadowRadius: 10,
                      elevation: 10,
                      backgroundColor: contextColor,
                    }}
                    animated
                    floatingAnimation
                  >
                    <Column style={{ gap: Spacing[2] }}>
                      <PlayfulButton
                        title='Bildirimleri Gör'
                        onPress={() =>
                          router.push('/(tabs)/notifications' as any)
                        }
                        variant='outline'
                        icon='bell'
                        fontFamily='SecondaryFont-Bold'
                        animated
                      />
                    </Column>
                  </PlayfulCard>
                </View>
              </SlideInElement>

              <SlideInElement direction='right' delay={1000}>
                <View
                  style={{
                    marginTop: Spacing[4],
                    shadowColor: Colors.gray[900],
                    shadowOffset: { width: 10, height: 20 },
                    shadowOpacity: 0.8,
                    shadowRadius: 10,
                    elevation: 10,
                  }}
                >
                  <PlayfulCard
                    title='Arkadaşlar'
                    titleFontFamily='PrimaryFont'
                    variant='playful'
                    category={(preferredCourse as any)?.category}
                    style={{
                      marginBottom: Spacing[6],
                      shadowColor: Colors.gray[900],
                      shadowOffset: { width: 10, height: 20 },
                      shadowOpacity: 0.8,
                      shadowRadius: 10,
                      elevation: 10,
                      backgroundColor: contextColor,
                    }}
                    animated
                    floatingAnimation
                  >
                    <Column style={{ gap: Spacing[2] }}>
                      <PlayfulButton
                        title='Arkadaşlarını Gör'
                        onPress={() =>
                          router.push('/(tabs)/profile/friends' as any)
                        }
                        variant='outline'
                        icon='users'
                        fontFamily='SecondaryFont-Bold'
                        animated
                      />
                    </Column>
                  </PlayfulCard>
                </View>
              </SlideInElement>

              {/* Account Settings */}
              <SlideInElement direction='left' delay={1200}>
                <View
                  style={{
                    marginTop: Spacing[4],
                    shadowColor: Colors.gray[900],
                    shadowOffset: { width: 10, height: 20 },
                    shadowOpacity: 0.8,
                    shadowRadius: 10,
                    elevation: 10,
                  }}
                >
                  <PlayfulCard
                    title='Hesap Ayarları'
                    variant='playful'
                    gradient='sky'
                    titleFontFamily='PrimaryFont'
                    category={(preferredCourse as any)?.category}
                    style={{
                      marginBottom: Spacing[6],
                      shadowColor: Colors.gray[900],
                      shadowOffset: { width: 10, height: 20 },
                      shadowOpacity: 0.8,
                      shadowRadius: 10,
                      elevation: 10,
                      backgroundColor: contextColor,
                    }}
                    animated
                    floatingAnimation
                  >
                    <Column style={{ gap: Spacing[2] }}>
                      <PlayfulButton
                        title='Profil Düzenle'
                        onPress={handleShowCourseModal} // Changed to show course modal
                        variant='outline'
                        icon='user'
                        fontFamily='SecondaryFont-Bold'
                        animated
                      />

                      <PlayfulButton
                        title='Şifre Değiştir'
                        onPress={() => router.push('/change-password' as any)}
                        variant='outline'
                        icon='lock'
                        fontFamily='SecondaryFont-Bold'
                        animated
                      />

                      <PlayfulButton
                        title='Bildirim Ayarları'
                        onPress={() => router.push('/notifications' as any)}
                        variant='outline'
                        icon='gear'
                        fontFamily='SecondaryFont-Bold'
                        animated
                      />
                    </Column>
                  </PlayfulCard>
                </View>
              </SlideInElement>

              {/* App Info & Sign Out */}
              <SlideInElement direction='up' delay={1400}>
                <GlassCard
                  style={{
                    marginBottom: Spacing[6],
                    backgroundColor: `${contextColor}80`, // Semi-transparent context color
                  }}
                >
                  <Column style={{ gap: Spacing[3] }}>
                    <Row
                      style={{
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          color: isDark ? Colors.gray[100] : Colors.gray[100],
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
                        style={{
                          shadowColor: Colors.gray[900],
                          shadowOffset: { width: 10, height: 20 },
                          shadowOpacity: 0.8,
                          shadowRadius: 10,
                          elevation: 10,
                          backgroundColor: Colors.vibrant.green,
                        }}
                      />
                    </Row>

                    <PlayfulButton
                      title='Çıkış Yap'
                      onPress={handleSignOut}
                      variant='vibrant'
                      gradient='fire'
                      icon='sign-out'
                      fontFamily='SecondaryFont-Bold'
                      animated
                      wiggleOnPress
                      style={{
                        shadowColor: Colors.gray[900],
                        shadowOffset: { width: 10, height: 20 },
                        shadowOpacity: 0.8,
                        shadowRadius: 10,
                        elevation: 10,
                        backgroundColor: Colors.vibrant.coral,
                      }}
                    />
                  </Column>
                </GlassCard>
              </SlideInElement>

              {/* Error display at bottom if there's an error but data is loaded */}
              {error && !loading && (achievements.length > 0 || duelStats) && (
                <Alert
                  type='warning'
                  message='Veriler yenilenirken sorun yaşandı. Çekmek için aşağı kaydırın.'
                  style={{ marginTop: Spacing[4] }}
                />
              )}

              {/* Retry button at bottom for partial failures */}
              {!loading &&
                achievements.length === 0 &&
                !duelStats &&
                !error && (
                  <View
                    style={{
                      alignItems: 'center',
                      padding: Spacing[6],
                      backgroundColor: `${contextColor}20`, // Very light context color
                      borderRadius: 12,
                      marginTop: Spacing[4],
                    }}
                  >
                    <FontAwesome
                      name='wifi'
                      size={48}
                      color={contextColor}
                      style={{ marginBottom: Spacing[3] }}
                    />
                    <Text
                      style={{
                        color: isDark ? Colors.gray[600] : Colors.gray[600],
                        fontFamily: 'SecondaryFont-Regular',
                        textAlign: 'center',
                        marginBottom: Spacing[4],
                        fontSize: 16,
                      }}
                    >
                      Profil verileri yüklenemedi
                    </Text>
                    <PlayfulButton
                      title='Tekrar Dene'
                      onPress={handleRetry}
                      variant='primary'
                      size='medium'
                      animated
                      icon='refresh'
                      style={{
                        backgroundColor: contextColor,
                      }}
                    />
                  </View>
                )}
            </>
          )}
        </View>

        {/* Bottom spacing to ensure content is fully visible */}
        <View style={{ height: Spacing[8] }} />
      </ScrollView>

      {/* Add Course Selection Modal */}
      <CourseSelectionModal
        visible={showCourseModal}
        onClose={handleCourseModalClose}
        onCourseSelected={handleCourseSelected}
      />
    </View>
  );
}

// Main component with context provider
export default function ProfileScreen() {
  return (
    <PreferredCourseProvider>
      <ProfileScreenContent />
    </PreferredCourseProvider>
  );
}
