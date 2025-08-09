// app/(tabs)/profile.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
  RefreshControl,
  StyleSheet,
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
  CourseSelectionModal,
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

// Optimized shadow style
const OPTIMIZED_SHADOW = {
  // shadowColor: Colors.gray[900],
  // shadowOffset: { width: 2, height: 4 },
  // shadowOpacity: 0.3,
  // shadowRadius: 4,
  // elevation: 4,
};

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
  const [showCourseModal, setShowCourseModal] = useState(false);

  // Get the current context color - memoized to prevent recalculations
  const contextColor = useMemo(() => {
    return (
      ((preferredCourse as any)?.category &&
        getCourseColor((preferredCourse as any).category)) ||
      VIBRANT_COLORS.purple
    );
  }, [preferredCourse, getCourseColor]);

  // Create dynamic styles based on context color - memoized
  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        contextBackground: {
          backgroundColor: contextColor,
        },
        contextSemiTransparent: {
          backgroundColor: `${contextColor}80`,
        },
        contextVeryLight: {
          backgroundColor: `${contextColor}20`,
        },
        refreshControlStyle: {
          tintColor: contextColor,
        },
      }),
    [contextColor],
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
        console.error('Error loading user data from AsyncStorage:', error);
      }
    };

    loadUserData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Enhanced fetchData function with better error handling
  const fetchProfileData = useCallback(async () => {
    let isMounted = true;

    try {
      if (!isMounted) return;
      setError(null);

      // Check session before making requests
      const sessionValid = await checkAndRefreshSession();
      if (!sessionValid) {
        console.log('Session invalid, redirecting to login');
        if (isMounted) {
          router.replace('/(auth)/login');
        }
        return;
      }

      // Use Promise.allSettled to handle partial failures gracefully
      const [achievementsResponse, duelStatsResponse] =
        await Promise.allSettled([
          achievementService.getUserAchievements(),
          duelService.getDuelUserStats(),
        ]);

      if (!isMounted) return;

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
      if (!hasData && isMounted) {
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

      if (!isMounted) return;

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

    return () => {
      isMounted = false;
    };
  }, [router]);

  // Enhanced handleRefresh function
  const handleRefresh = useCallback(async () => {
    let isMounted = true;

    try {
      if (!isMounted) return;
      setRefreshing(true);
      setError(null);

      console.log('Refreshing profile data...');

      // Check session before refreshing
      const sessionValid = await checkAndRefreshSession();
      if (!sessionValid) {
        console.log('Session invalid during refresh, redirecting to login');
        if (isMounted) {
          router.replace('/(auth)/login');
        }
        return;
      }

      await fetchProfileData();
      console.log('Profile refresh completed successfully');
    } catch (error) {
      console.error('Profile refresh failed:', error);

      if (!isMounted) return;

      if (
        error instanceof Error &&
        error.message.includes('Oturum süresi doldu')
      ) {
        router.replace('/(auth)/login');
        return;
      }

      setError('Yenileme başarısız. Lütfen tekrar deneyin.');
    } finally {
      if (isMounted) {
        setRefreshing(false);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [fetchProfileData, router]);

  // Enhanced handleRetry function
  const handleRetry = useCallback(async () => {
    let isMounted = true;

    try {
      if (!isMounted) return;
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
          if (isMounted) {
            router.replace('/(auth)/login');
          }
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

      if (!isMounted) return;

      if (
        error instanceof Error &&
        error.message.includes('Oturum süresi doldu')
      ) {
        router.replace('/(auth)/login');
        return;
      }

      setError('Yeniden deneme başarısız. Lütfen uygulamayı yeniden başlatın.');
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [fetchProfileData, router, refreshSession]);

  // Enhanced initial fetch
  useEffect(() => {
    let isMounted = true;

    async function initialFetch() {
      if (!isMounted) return;
      setLoading(true);

      try {
        // Check session on app load
        const sessionValid = await checkAndRefreshSession();
        if (!sessionValid) {
          if (isMounted) {
            setLoading(false);
            router.replace('/(auth)/login');
          }
          return;
        }

        await fetchProfileData();
      } catch (error) {
        console.error('Initial profile fetch error:', error);
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
  }, [fetchProfileData, router]);

  // Get icon for achievement - returns only valid FontAwesome icon names
  const getAchievementIcon = useCallback((achievement: Achievement): string => {
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
  }, []);

  // Get achievement category color - now uses context colors as fallback
  const getAchievementColor = useCallback(
    (achievement: Achievement): string => {
      const category = achievement.category?.toLowerCase() || '';

      if (category.includes('course'))
        return Colors.vibrant?.blue || Colors.info;
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
    },
    [preferredCourse, getCourseColor],
  );

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      // Navigation will be handled by the AuthContext
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [signOut]);

  // Handler for showing course modal
  const handleShowCourseModal = useCallback(() => {
    setShowCourseModal(true);
  }, []);

  // Handler for closing course modal
  const handleCourseModalClose = useCallback(() => {
    setShowCourseModal(false);
  }, []);

  // Handler for course selection
  const handleCourseSelected = useCallback(() => {
    setShowCourseModal(false);
  }, []);

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

          <Text
            style={[
              styles.errorTitle,
              { color: isDark ? Colors.gray[800] : Colors.gray[800] },
            ]}
          >
            Bir Sorun Oluştu
          </Text>

          <Alert type='error' message={error} style={styles.errorAlert} />

          <View style={styles.errorButtons}>
            <PlayfulButton
              title='Yeniden Dene'
              onPress={handleRetry}
              variant='primary'
              animated
              icon='refresh'
              size='medium'
              style={[styles.retryButton, dynamicStyles.contextBackground]}
            />

            <PlayfulButton
              title='Giriş Ekranına Dön'
              onPress={() => router.replace('/(auth)/login')}
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
            titleColor={isDark ? Colors.gray[600] : Colors.gray[600]}
          />
        }
      >
        {/* Animated Profile Header */}
        <SlideInElement delay={0}>
          <View style={styles.headerContainer}>
            <Column style={styles.headerColumn}>
              <Avatar
                name={(user?.username || userData?.username)?.[0] || 'U'}
                size='xl'
                bgColor={contextColor}
                gradient='sunset'
                borderGlow
                animated
                floatingEffect
                style={[styles.avatar, OPTIMIZED_SHADOW]}
              />
              <PlayfulTitle level={1} style={styles.username}>
                {user?.username || userData?.username || 'Kullanıcı'}
              </PlayfulTitle>
              <Text style={styles.email}>
                {user?.email || 'email@example.com'}
              </Text>

              {/* User level/score display */}
              <View style={[styles.scoreContainer, OPTIMIZED_SHADOW]}>
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
                  style={[styles.scoreDisplay, dynamicStyles.contextBackground]}
                />
              </View>
            </Column>
          </View>
        </SlideInElement>

        <View>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size='large' color={contextColor} />
              <Text
                style={[
                  styles.loadingText,
                  { color: isDark ? Colors.white : Colors.white },
                ]}
              >
                Profil verileri yükleniyor...
              </Text>
              <Text
                style={[
                  styles.loadingSubtext,
                  { color: isDark ? Colors.gray[200] : Colors.gray[200] },
                ]}
              >
                Bu birkaç saniye sürebilir
              </Text>
            </View>
          ) : (
            <>
              {/* Quick Stats */}
              {duelStats && (
                <SlideInElement direction='up' delay={200}>
                  <Row style={styles.statsRow}>
                    <View style={[styles.statCard, OPTIMIZED_SHADOW]}>
                      <StatCard
                        icon='trophy'
                        title='Toplam Düello'
                        value={duelStats.totalDuels.toString()}
                        color={Colors.white}
                        size='medium'
                        titleFontFamily='SecondaryFont-Bold'
                        style={dynamicStyles.contextBackground}
                      />
                    </View>
                    <View style={[styles.statCard, OPTIMIZED_SHADOW]}>
                      <StatCard
                        icon='check-circle'
                        title='Kazanılan'
                        value={duelStats.wins.toString()}
                        color={Colors.white}
                        size='medium'
                        titleFontFamily='SecondaryFont-Bold'
                        style={dynamicStyles.contextBackground}
                      />
                    </View>
                    <View style={[styles.statCard, OPTIMIZED_SHADOW]}>
                      <StatCard
                        icon='fire'
                        title='Kazanma Oranı'
                        value={`${Math.round(duelStats.winRate)}%`}
                        color={Colors.white}
                        size='medium'
                        titleFontFamily='SecondaryFont-Bold'
                        style={dynamicStyles.contextBackground}
                      />
                    </View>
                  </Row>
                </SlideInElement>
              )}

              {/* Detailed Stats */}
              {duelStats && (
                <SlideInElement direction='left' delay={400}>
                  <View style={[styles.cardContainer, OPTIMIZED_SHADOW]}>
                    <PlayfulCard
                      titleFontFamily='PrimaryFont'
                      title='Detaylı İstatistikler'
                      variant='playful'
                      category={(preferredCourse as any)?.category}
                      style={[
                        styles.detailedStatsCard,
                        OPTIMIZED_SHADOW,
                        dynamicStyles.contextBackground,
                      ]}
                      animated
                      floatingAnimation
                    >
                      <Row style={styles.detailedStatsRow}>
                        <View style={styles.detailedStatItem}>
                          <Row style={styles.statItemRow}>
                            <Text style={styles.statLabel}>Kaybedilen:</Text>
                            <AnimatedCounter
                              value={duelStats.losses}
                              fontFamily='SecondaryFont-Bold'
                              style={styles.statValue}
                              size='medium'
                            />
                          </Row>
                        </View>
                        <View style={styles.detailedStatItem}>
                          <Row style={styles.statItemRow}>
                            <Text style={styles.statLabel}>En Uzun Seri:</Text>
                            <AnimatedCounter
                              value={duelStats.longestLosingStreak}
                              fontFamily='SecondaryFont-Bold'
                              style={styles.statValue}
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
                <View style={[styles.cardContainer, OPTIMIZED_SHADOW]}>
                  <PlayfulCard
                    title='Başarılar'
                    titleFontFamily='PrimaryFont'
                    variant='playful'
                    category={(preferredCourse as any)?.category}
                    style={[
                      styles.achievementsCard,
                      OPTIMIZED_SHADOW,
                      dynamicStyles.contextBackground,
                    ]}
                    animated
                    floatingAnimation
                  >
                    {achievements.length > 0 ? (
                      <>
                        <Row style={styles.achievementsGrid}>
                          {achievements.slice(0, 6).map((achievement) => (
                            <GlassCard
                              key={achievement.achievement_id}
                              style={styles.achievementCard}
                              shimmerEffect
                            >
                              <View style={styles.achievementContent}>
                                <View
                                  style={[
                                    styles.achievementIcon,
                                    {
                                      backgroundColor:
                                        getAchievementColor(achievement),
                                    },
                                  ]}
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
                                  style={[
                                    styles.achievementText,
                                    {
                                      color: isDark
                                        ? Colors.white
                                        : Colors.white,
                                    },
                                  ]}
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
                          style={styles.allAchievementsButton}
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
                        style={[styles.emptyState, OPTIMIZED_SHADOW]}
                      />
                    )}
                  </PlayfulCard>
                </View>
              </SlideInElement>

              <SlideInElement direction='right' delay={800}>
                <View style={[styles.cardContainer, OPTIMIZED_SHADOW]}>
                  <PlayfulCard
                    title='Bildirimler'
                    titleFontFamily='PrimaryFont'
                    variant='playful'
                    category={(preferredCourse as any)?.category}
                    style={[
                      styles.notificationsCard,
                      OPTIMIZED_SHADOW,
                      dynamicStyles.contextBackground,
                    ]}
                    animated
                    floatingAnimation
                  >
                    <Column style={styles.buttonColumn}>
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
                <View style={[styles.cardContainer, OPTIMIZED_SHADOW]}>
                  <PlayfulCard
                    title='Arkadaşlar'
                    titleFontFamily='PrimaryFont'
                    variant='playful'
                    category={(preferredCourse as any)?.category}
                    style={[
                      styles.friendsCard,
                      OPTIMIZED_SHADOW,
                      dynamicStyles.contextBackground,
                    ]}
                    animated
                    floatingAnimation
                  >
                    <Column style={styles.buttonColumn}>
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
                <View style={[styles.cardContainer, OPTIMIZED_SHADOW]}>
                  <PlayfulCard
                    title='Hesap Ayarları'
                    variant='playful'
                    gradient='sky'
                    titleFontFamily='PrimaryFont'
                    category={(preferredCourse as any)?.category}
                    style={[
                      styles.settingsCard,
                      OPTIMIZED_SHADOW,
                      dynamicStyles.contextBackground,
                    ]}
                    animated
                    floatingAnimation
                  >
                    <Column style={styles.buttonColumn}>
                      <PlayfulButton
                        title='Profil Düzenle'
                        onPress={handleShowCourseModal}
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
                  style={[
                    styles.appInfoCard,
                    dynamicStyles.contextSemiTransparent,
                  ]}
                >
                  <Column style={styles.buttonColumn}>
                    <Row style={styles.versionRow}>
                      <Text
                        style={[
                          styles.versionText,
                          {
                            color: isDark ? Colors.gray[100] : Colors.gray[100],
                          },
                        ]}
                      >
                        Versiyon: 1.0.0
                      </Text>
                      <Badge
                        text='Güncel'
                        variant='success'
                        size='md'
                        fontFamily='SecondaryFont-Bold'
                        style={[styles.versionBadge, OPTIMIZED_SHADOW]}
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
                      style={[styles.signOutButton, OPTIMIZED_SHADOW]}
                    />
                  </Column>
                </GlassCard>
              </SlideInElement>

              {/* Error display at bottom if there's an error but data is loaded */}
              {error && !loading && (achievements.length > 0 || duelStats) && (
                <Alert
                  type='warning'
                  message='Veriler yenilenirken sorun yaşandı. Çekmek için aşağı kaydırın.'
                  style={styles.bottomAlert}
                />
              )}

              {/* Retry button at bottom for partial failures */}
              {!loading &&
                achievements.length === 0 &&
                !duelStats &&
                !error && (
                  <View
                    style={[
                      styles.retryContainer,
                      dynamicStyles.contextVeryLight,
                    ]}
                  >
                    <FontAwesome
                      name='wifi'
                      size={48}
                      color={contextColor}
                      style={styles.retryIcon}
                    />
                    <Text
                      style={[
                        styles.retryText,
                        { color: isDark ? Colors.gray[600] : Colors.gray[600] },
                      ]}
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
                      style={dynamicStyles.contextBackground}
                    />
                  </View>
                )}
            </>
          )}
        </View>

        {/* Bottom spacing to ensure content is fully visible */}
        <View style={styles.bottomSpacing} />
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

// StyleSheet for all static styles
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
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: Spacing[2],
    fontFamily: 'SecondaryFont-Bold',
  },
  errorAlert: {
    marginBottom: Spacing[6],
  },
  errorButtons: {
    width: '100%',
    gap: Spacing[3],
  },
  retryButton: {
    width: '100%',
  },
  loginButton: {
    width: '100%',
  },
  headerContainer: {
    marginBottom: Spacing[6],
  },
  headerColumn: {
    alignItems: 'center',
  },
  avatar: {
    marginBottom: Spacing[2],
  },
  username: {
    color: Colors.gray[900],
    marginBottom: Spacing[1],
    fontSize: FontSizes['3xl'],
    textAlign: 'center',
    fontFamily: 'PrimaryFont',
  },
  email: {
    color: Colors.gray[700],
    opacity: 0.9,
    textAlign: 'center',
    fontFamily: 'PrimaryFont',
  },
  scoreContainer: {
    marginTop: Spacing[4],
  },
  scoreDisplay: {
    shadowColor: Colors.gray[900],
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing[8],
  },
  loadingText: {
    marginTop: Spacing[4],
    fontFamily: 'SecondaryFont-Regular',
    fontSize: 16,
  },
  loadingSubtext: {
    marginTop: Spacing[2],
    fontFamily: 'SecondaryFont-Regular',
    fontSize: 14,
    textAlign: 'center',
  },
  statsRow: {
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
    marginBottom: Spacing[6],
  },
  statCard: {
    marginTop: Spacing[4],
  },
  cardContainer: {
    marginTop: Spacing[4],
  },
  detailedStatsCard: {
    marginBottom: Spacing[6],
  },
  detailedStatsRow: {
    flexWrap: 'wrap',
    gap: Spacing[3],
  },
  detailedStatItem: {
    flex: 1,
    minWidth: '45%',
  },
  statItemRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  statLabel: {
    fontFamily: 'SecondaryFont-Regular',
    color: Colors.white,
  },
  statValue: {
    color: Colors.white,
  },
  achievementsCard: {
    marginBottom: Spacing[6],
  },
  achievementsGrid: {
    flexWrap: 'wrap',
    gap: Spacing[2],
    marginBottom: Spacing[4],
  },
  achievementCard: {
    width: '100%',
    padding: Spacing[3],
    minHeight: 50,
  },
  achievementContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing[2],
  },
  achievementText: {
    fontSize: 20,
    flex: 1,
    textAlign: 'center',
    fontFamily: 'SecondaryFont-Bold',
  },
  allAchievementsButton: {
    flex: 1,
  },
  emptyState: {
    backgroundColor: Colors.white,
  },
  notificationsCard: {
    marginBottom: Spacing[6],
  },
  friendsCard: {
    marginBottom: Spacing[6],
  },
  settingsCard: {
    marginBottom: Spacing[6],
  },
  buttonColumn: {
    gap: Spacing[2],
  },
  appInfoCard: {
    marginBottom: Spacing[6],
  },
  versionRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  versionText: {
    fontFamily: 'SecondaryFont-Regular',
  },
  versionBadge: {
    backgroundColor: Colors.vibrant.green,
  },
  signOutButton: {
    backgroundColor: Colors.vibrant.coral,
  },
  bottomAlert: {
    marginTop: Spacing[4],
  },
  retryContainer: {
    alignItems: 'center',
    padding: Spacing[6],
    borderRadius: 12,
    marginTop: Spacing[4],
  },
  retryIcon: {
    marginBottom: Spacing[3],
  },
  retryText: {
    fontFamily: 'SecondaryFont-Regular',
    textAlign: 'center',
    marginBottom: Spacing[4],
    fontSize: 16,
  },
  bottomSpacing: {
    height: Spacing[8],
  },
});

// Main component with context provider
export default function ProfileScreen() {
  return (
    <PreferredCourseProvider>
      <ProfileScreenContent />
    </PreferredCourseProvider>
  );
}
