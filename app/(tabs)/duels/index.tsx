// app/(tabs)/duels.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { duelService } from '../../../src/api';
import {
  getUserDuelStats,
  UserDuelStatsPayload,
} from '../../../src/api/duelResultService'; // Import the service
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

// Use the theme constants correctly
const VIBRANT_COLORS = Colors.vibrant;

// Main Duels Screen Component (wrapped with context)
function DuelsScreenContent() {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Use the preferred course context
  const {
    preferredCourse,
    isLoading: courseLoading,
    getCourseColor,
  } = usePreferredCourse();

  const [activeDuels, setActiveDuels] = useState<Duel[]>([]);
  const [userStats, setUserStats] = useState<UserDuelStatsPayload | null>(null); // Add user stats state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<{ username?: string } | null>(null);

  // Get the current context color
  const contextColor =
    (preferredCourse as any)?.category &&
    getCourseColor((preferredCourse as any).category);

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
  const fetchData = useCallback(async () => {
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
      const [duelsResponse, userStatsResponse] = await Promise.allSettled([
        duelService.getActiveDuels(),
        getUserDuelStats(), // Fetch user duel stats
      ]);

      // Process each response individually
      let hasData = false;

      // Process active duels
      if (duelsResponse.status === 'fulfilled') {
        setActiveDuels(duelsResponse.value);
        hasData = true;
      } else {
        console.error('Failed to fetch duels:', duelsResponse.reason);
        setActiveDuels([]); // Set empty array instead of keeping old data
      }

      // Process user stats
      if (userStatsResponse.status === 'fulfilled') {
        setUserStats(userStatsResponse.value);
        hasData = true;
      } else {
        console.error('Failed to fetch user stats:', userStatsResponse.reason);
        // Don't set error here, just log it since this is supplementary data
        setUserStats(null);
      }

      // Check if all requests failed
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

      console.log('Refreshing duels data...');

      // Check session before refreshing
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

  // Enhanced handleRetry function
  const handleRetry = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Retrying duels data fetch...');

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

        await fetchData();
      } catch (error) {
        console.error('Initial duels fetch error:', error);
        setError('Başlangıç verisi yüklenemedi. Lütfen tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    }

    initialFetch();
  }, [fetchData, router]);

  // Helper function to get opponent display name
  const getOpponentDisplayName = (duel: Duel): string => {
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
  };

  // Helper function to get opponent avatar initial
  const getOpponentAvatarInitial = (duel: Duel): string => {
    const displayName = getOpponentDisplayName(duel);
    return displayName.charAt(0).toUpperCase();
  };

  // Helper function to get course name from duel
  const getDuelCourseName = (duel: Duel): string => {
    // Try different possible course name properties
    if ((duel as any).course_name) {
      return (duel as any).course_name;
    }
    if ((duel as any).course_title) {
      return (duel as any).course_title;
    }
    if ((duel as any).subject) {
      return (duel as any).subject;
    }
    if ((duel as any).category) {
      return (duel as any).category;
    }
    if ((duel as any).course) {
      return (duel as any).course;
    }
    if ((duel as any).topic) {
      return (duel as any).topic;
    }
    // Fallback to default
    return 'Tıp Bilgisi Düellosu';
  };

  // Render badge for duel status
  const renderDuelStatusBadge = (status?: string) => {
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
  };

  // Get PlayfulCard variant and props based on duel status
  const getDuelCardProps = (duel: Duel) => {
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
  };

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
        {/* Header with animated title */}
        <SlideInElement delay={0}>
          <PlayfulCard
            style={{ marginBottom: Spacing[6], backgroundColor: 'transparent' }}
          >
            <Row
              style={{ justifyContent: 'space-between', alignItems: 'center' }}
            >
              <Column style={{ flex: 1 }}>
                <PlayfulTitle
                  level={1}
                  gradient='primary'
                  style={{ fontFamily: 'PrimaryFont', color: Colors.gray[900] }}
                >
                  Düellolar ⚔️
                </PlayfulTitle>
                <Paragraph
                  color={isDark ? Colors.gray[700] : Colors.gray[700]}
                  style={{
                    fontFamily: 'SecondaryFont-Regular',
                  }}
                >
                  Arkadaşlarınla yarışarak öğren
                </Paragraph>
              </Column>
            </Row>
          </PlayfulCard>
        </SlideInElement>

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
              Düellolar yükleniyor...
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
            {/* Stats Cards - Apply context color */}
            <Row
              style={{
                justifyContent: 'space-between',
                flexWrap: 'nowrap',
                marginBottom: Spacing[6],
              }}
            >
              <StatCard
                icon='trophy'
                title='Aktif Düellolar'
                value={activeDuels.length.toString()}
                color={Colors.white}
                titleFontFamily='SecondaryFont-Bold'
                style={{
                  shadowColor: Colors.gray[900],
                  shadowOffset: { width: 10, height: 20 },
                  shadowOpacity: 0.8,
                  shadowRadius: 10,
                  elevation: 10,
                  backgroundColor: contextColor, // Use context color
                }}
              />
              <StatCard
                icon='fire'
                title='Kazanılan'
                value={(userStats?.wins || 0).toString()} // Use wins from user stats
                color={Colors.white}
                titleFontFamily='SecondaryFont-Bold'
                style={{
                  shadowColor: Colors.gray[900],
                  shadowOffset: { width: 10, height: 20 },
                  shadowOpacity: 0.8,
                  shadowRadius: 10,
                  elevation: 10,
                  backgroundColor: contextColor, // Keep this as yellow for contrast
                }}
              />
              <StatCard
                icon='hourglass'
                title='Bekleyen'
                value={activeDuels
                  .filter((d) => d.status === 'pending')
                  .length.toString()}
                color={Colors.white}
                titleFontFamily='SecondaryFont-Bold'
                style={{
                  shadowColor: Colors.gray[900],
                  shadowOffset: { width: 10, height: 20 },
                  shadowOpacity: 0.8,
                  shadowRadius: 10,
                  elevation: 10,
                  backgroundColor: contextColor, // Keep this as mint for contrast
                }}
              />
            </Row>

            {/* Create New Duel Button - Apply context color */}
            <PlayfulButton
              title='Yeni Düello Başlat'
              onPress={() => router.push('/(tabs)/duels/new' as any)}
              variant='secondary'
              gradient='fire'
              animated
              style={{
                marginBottom: Spacing[6],
                shadowColor: Colors.gray[900],
                shadowOffset: { width: 10, height: 20 },
                shadowOpacity: 0.8,
                shadowRadius: 10,
                elevation: 10,
                backgroundColor: contextColor, // Use context color
              }}
              icon='plus'
              wiggleOnPress
            />

            {activeDuels.length > 0 ? (
              <View>
                {activeDuels.map((duel) => {
                  const cardProps = getDuelCardProps(duel);

                  return (
                    <TouchableOpacity
                      key={duel.duel_id}
                      onPress={() =>
                        router.push(`/(tabs)/duels/${duel.duel_id}` as any)
                      }
                      activeOpacity={0.8}
                    >
                      <PlayfulCard
                        title={`${getOpponentDisplayName(duel)} ile Düello`}
                        titleFontFamily='PrimaryFont'
                        category={(preferredCourse as any)?.category}
                        style={{
                          marginBottom: Spacing[4],
                          backgroundColor: contextColor,
                        }}
                        {...cardProps}
                      >
                        <Row
                          style={{
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Row style={{ alignItems: 'center', flex: 1 }}>
                            <Column style={{ flex: 1 }}>
                              <Title
                                level={3}
                                style={{
                                  color: Colors.white,
                                  marginBottom: Spacing[1],
                                  fontFamily: 'SecondaryFont-Bold',
                                }}
                              >
                                {getOpponentDisplayName(duel)}
                              </Title>
                              <Text
                                style={{
                                  color: Colors.white,
                                  opacity: 0.8,
                                  fontSize: FontSizes.sm,
                                  fontFamily: 'SecondaryFont-Regular',
                                  marginBottom: Spacing[1],
                                }}
                              >
                                {getDuelCourseName(duel)}
                              </Text>
                              {renderDuelStatusBadge(duel.status)}
                            </Column>
                          </Row>

                          {/* Score Display if available */}
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
                })}
              </View>
            ) : (
              <PlayfulCard
                variant='glass'
                animated
                floatingAnimation
                style={{ marginTop: Spacing[4] }}
              >
                <EmptyState
                  icon='users'
                  fontFamily='PrimaryFont'
                  title='Aktif düello yok'
                  buttonFontFamily='PrimaryFont'
                  message='Arkadaşlarını düelloya davet et ve rekabeti başlat.'
                  actionButton={{
                    title: 'Düello Başlat',
                    onPress: () => router.push('/(tabs)/duels/new' as any),
                    variant: 'secondary',
                  }}
                />
              </PlayfulCard>
            )}

            {/* Quick Actions - Apply context color to background */}
            <PlayfulCard
              title='Hızlı İşlemler'
              variant='playful'
              titleFontFamily='PrimaryFont'
              category={(preferredCourse as any)?.category}
              style={{
                marginTop: Spacing[6],
                shadowColor: Colors.gray[900],
                shadowOffset: { width: 10, height: 20 },
                shadowOpacity: 0.8,
                shadowRadius: 10,
                elevation: 10,
                backgroundColor: contextColor, // Use context color
              }}
              animated
              floatingAnimation
            >
              <Row style={{ justifyContent: 'space-between' }}>
                <PlayfulButton
                  title='Tüm Düellolar'
                  onPress={() => router.push('/(tabs)/duels/history' as any)}
                  variant='outline'
                  style={{
                    flex: 1,
                    marginRight: Spacing[2],
                    borderColor: Colors.white,
                  }}
                  icon='list'
                  animated
                  size='xs'
                  fontFamily='PrimaryFont'
                />
                <PlayfulButton
                  title='Düello Geçmişi'
                  onPress={() => router.push('/(tabs)/duels/history' as any)}
                  variant='outline'
                  style={{
                    flex: 1,
                    marginLeft: Spacing[2],
                    borderColor: Colors.white,
                  }}
                  icon='history'
                  animated
                  size='xs'
                  fontFamily='PrimaryFont'
                />
              </Row>
            </PlayfulCard>

            {/* Error display at bottom if there's an error but data is loaded */}
            {error && !loading && activeDuels.length > 0 && (
              <Alert
                type='warning'
                message='Veriler yenilenirken sorun yaşandı. Çekmek için aşağı kaydırın.'
                style={{ marginTop: Spacing[4] }}
              />
            )}

            {/* Retry button at bottom for partial failures */}
            {!loading && activeDuels.length === 0 && !error && (
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
                  Düello verileri yüklenemedi
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

        {/* Bottom spacing to ensure content is fully visible */}
        <View style={{ height: Spacing[8] }} />
      </ScrollView>
    </View>
  );
}

// Main component with context provider
export default function DuelsScreen() {
  return (
    <PreferredCourseProvider>
      <DuelsScreenContent />
    </PreferredCourseProvider>
  );
}
