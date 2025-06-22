import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  RefreshControl,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  PlayfulCard,
  GameCard,
  PlayfulButton,
  StatCard,
  EmptyState,
  Avatar,
  Badge,
  AppLink,
  Container,
  PlayfulTitle,
  Paragraph,
  Alert,
  ProgressBar,
  Row,
  Column,
  AnimatedCounter,
  FloatingElement,
  BouncyButton,
  Timer,
  ScoreDisplay,
  GameButton,
  SlideInElement,
  PulseElement,
} from '../../components/ui';
import {
  courseService,
  testService,
  duelService,
  achievementService,
  analyticsService,
} from '../../src/api';
import { checkAndRefreshSession } from '../../src/api/authService';
import { useAuth } from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Course, Test, Duel } from '../../src/types/models';
import { Colors, Spacing } from '../../constants/theme';

// Use the theme constants correctly
const VIBRANT_COLORS = Colors.vibrant;
const GRADIENTS = Colors.gradients;

// Define interface to extend Course with additional fields we need
interface CourseWithProgress extends Course {
  progress: number;
  iconName: string;
}

// Extend Test interface with display properties
interface TestWithDetails extends Test {
  difficulty: string;
  questionCount?: number;
  timeLimit?: number;
}

// Define interface for Analytics data
interface AnalyticsData {
  branchPerformance?: Array<{
    branchId: number;
    branchName: string;
    averageScore: number;
    totalQuestions: number;
    correctAnswers: number;
  }>;
  totalQuestionsAnswered?: number;
  overallAccuracy?: number;
  studyTime?: number;
  studySessions?: number;
  averageSessionDuration?: number;
}

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

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { refreshSession } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState<{ username?: string } | null>(null);
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [tests, setTests] = useState<TestWithDetails[]>([]);
  const [activeDuels, setActiveDuels] = useState<Duel[]>([]);
  const [userAchievements, setUserAchievements] = useState<Achievement[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

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
      const [
        coursesResponse,
        testsResponse,
        duelsResponse,
        achievementsResponse,
        analyticsResponse,
      ] = await Promise.allSettled([
        courseService.getAllCourses(),
        testService.getAllTests(),
        duelService.getActiveDuels(),
        achievementService.getUserAchievements(),
        analyticsService.getUserPerformanceAnalytics(),
      ]);

      // Process each response individually
      let hasData = false;

      // Process courses
      if (coursesResponse.status === 'fulfilled') {
        const coursesWithProgress = coursesResponse.value.map((course) => ({
          ...course,
          progress: 0,
          iconName: getIconForCourse(course.title),
        }));

        // Fetch progress for each course (non-blocking)
        for (let i = 0; i < coursesWithProgress.length; i++) {
          try {
            const courseProgress = await courseService.getCourseProgress(
              coursesWithProgress[i].course_id,
            );
            if (courseProgress) {
              coursesWithProgress[i].progress = courseProgress.progress || 0;
            }
          } catch (err) {
            console.error(
              `Failed to fetch progress for course ${coursesWithProgress[i].course_id}:`,
              err,
            );
            // Continue without progress data
          }
        }

        coursesWithProgress.sort((a, b) => b.progress - a.progress);
        setCourses(coursesWithProgress.slice(0, 3));
        hasData = true;
      } else {
        console.error('Failed to fetch courses:', coursesResponse.reason);
        setCourses([]); // Set empty array instead of keeping old data
      }

      // Process tests
      if (testsResponse.status === 'fulfilled') {
        const testsWithDetails = testsResponse.value.map((test) => ({
          ...test,
          difficulty: getDifficultyLabel(test.difficulty_level || 2),
          questionCount: test.question_count || 0,
          timeLimit: test.time_limit || 30,
        }));
        setTests(testsWithDetails.slice(0, 2));
        hasData = true;
      } else {
        console.error('Failed to fetch tests:', testsResponse.reason);
        setTests([]);
      }

      // Process duels
      if (duelsResponse.status === 'fulfilled') {
        setActiveDuels(duelsResponse.value.slice(0, 3));
        hasData = true;
      } else {
        console.error('Failed to fetch duels:', duelsResponse.reason);
        setActiveDuels([]);
      }

      // Process achievements
      if (achievementsResponse.status === 'fulfilled') {
        setUserAchievements(achievementsResponse.value.slice(0, 3));
        hasData = true;
      } else {
        console.error(
          'Failed to fetch achievements:',
          achievementsResponse.reason,
        );
        setUserAchievements([]);
      }

      // Process analytics
      if (analyticsResponse.status === 'fulfilled') {
        setAnalyticsData(analyticsResponse.value);
        hasData = true;
      } else {
        console.error('Failed to fetch analytics:', analyticsResponse.reason);
        setAnalyticsData(null);
      }

      // Check if all requests failed
      if (!hasData) {
        const firstError = [
          coursesResponse,
          testsResponse,
          duelsResponse,
          achievementsResponse,
          analyticsResponse,
        ].find((response) => response.status === 'rejected')?.reason;

        if (firstError?.message?.includes('Oturum süresi doldu')) {
          router.replace('/(auth)/login');
          return;
        }

        setError('Veri yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } catch (error) {
      console.error('Error fetching homepage data:', error);

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

      console.log('Refreshing data...');

      // Check session before refreshing
      const sessionValid = await checkAndRefreshSession();
      if (!sessionValid) {
        console.log('Session invalid during refresh, redirecting to login');
        router.replace('/(auth)/login');
        return;
      }

      await fetchData();
      console.log('Refresh completed successfully');
    } catch (error) {
      console.error('Refresh failed:', error);

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

      console.log('Retrying data fetch...');

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

      console.log('Retry completed successfully');
    } catch (error) {
      console.error('Retry failed:', error);

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
        console.error('Initial fetch error:', error);
        setError('Başlangıç verisi yüklenemedi. Lütfen tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    }

    initialFetch();
  }, [fetchData, router]);

  // Helper function to get opponent display name
  const getOpponentDisplayName = (duel: Duel): string => {
    // Try different possible properties
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

  // Helper to map course titles to FontAwesome icons
  const getIconForCourse = (title?: string): string => {
    const titleLower = title?.toLowerCase() || '';

    // Only return valid FontAwesome icon names that exist in the library
    if (titleLower.includes('anatomi')) return 'tooth';
    if (titleLower.includes('patoloji')) return 'microscope';
    if (titleLower.includes('cerrahi')) return 'cut';
    if (titleLower.includes('protez')) return 'cogs';
    if (titleLower.includes('periodon')) return 'bacteria';
    if (titleLower.includes('pedodonti')) return 'child';
    if (titleLower.includes('endodonti')) return 'syringe';
    if (titleLower.includes('ortodonti')) return 'exchange';

    // Default icon
    return 'book-medical';
  };

  // Helper to convert numeric difficulty to text labels
  const getDifficultyLabel = (level: number): string => {
    switch (level) {
      case 1:
        return 'Kolay';
      case 2:
        return 'Orta';
      case 3:
        return 'Zor';
      case 4:
        return 'Çok Zor';
      case 5:
        return 'Uzman';
      default:
        return 'Orta';
    }
  };

  // Calculate progress percentage for progress bar
  const calculateProgress = (completed: number, total: number): number => {
    if (!total || total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  // Render badge for duel status
  const renderDuelStatusBadge = (status?: string) => {
    // Use string comparison instead of enum comparison
    if (status === 'pending' || status === 'waiting') {
      return <Badge text='Bekliyor' variant='info' size='sm' />;
    } else if (
      status === 'active' ||
      status === 'in_progress' ||
      status === 'your_turn'
    ) {
      return <Badge text='Senin Sıran' variant='warning' size='sm' />;
    } else if (status === 'completed') {
      return <Badge text='Tamamlandı' variant='success' size='sm' />;
    }
    return null;
  };

  // Get icon for achievement - returns only valid FontAwesome icon names
  const getAchievementIcon = (achievement: Achievement): any => {
    // Use achievement.icon if available AND it's a valid FontAwesome icon
    if (achievement.icon) {
      // This is a simplification - in reality we would need to check if the icon is valid
      return achievement.icon;
    }

    const category = achievement.category?.toLowerCase() || '';

    // Only return valid FontAwesome icon names
    if (category.includes('course')) return 'book';
    if (category.includes('study')) return 'clock';
    if (category.includes('duel')) return 'trophy';
    if (category.includes('test')) return 'check-circle';
    if (category.includes('streak')) return 'fire';

    // Default icon
    return 'certificate';
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
              color: isDark ? Colors.white : Colors.gray[800],
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
              style={{ width: '100%' }}
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

  // Calculate duel score safely to avoid undefined errors
  const calculateDuelScore = () => {
    if (!analyticsData || !analyticsData.branchPerformance) {
      return '0-0';
    }

    const correctAnswers = analyticsData.branchPerformance.reduce(
      (acc, branch) => acc + (branch.correctAnswers || 0),
      0,
    );

    const totalQuestions = analyticsData.totalQuestionsAnswered || 0;
    const incorrectAnswers = Math.max(0, totalQuestions - correctAnswers);

    return `${correctAnswers}-${incorrectAnswers}`;
  };

  return (
    <ScrollView
      style={{
        flex: 1,
        paddingHorizontal: Spacing[4],
        paddingVertical: Spacing[8],
      }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.primary.DEFAULT}
          colors={[Colors.primary.DEFAULT]}
          title='Yenileniyor...'
          titleColor={isDark ? Colors.white : Colors.gray[600]}
        />
      }
    >
      {/* Welcome message and streak */}
      <SlideInElement direction='down' delay={0}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: Spacing[6],
            flexWrap: 'wrap',
          }}
        >
          <View style={{ flex: 1, marginRight: Spacing[3] }}>
            <PlayfulTitle
              level={2}
              style={{ marginBottom: Spacing[1], fontFamily: 'PrimaryFont' }}
              variant='purple'
              animated
            >
              Merhaba {userData?.username || 'Öğrenci'}!
            </PlayfulTitle>
            <Paragraph
              color={isDark ? Colors.white : Colors.gray[100]}
              style={{
                fontFamily: 'SecondaryFont-Regular',
              }}
            >
              DUS sınavına hazırlanmaya devam edelim
            </Paragraph>
          </View>

          <View style={{ alignItems: 'center', marginTop: 8 }}>
            <FloatingElement>
              <PulseElement>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: isDark
                      ? Colors.vibrant.purpleDark
                      : Colors.vibrant.orange,
                    borderRadius: 999,
                    paddingHorizontal: Spacing[3],
                    paddingVertical: Spacing[2],
                    minWidth: 80,
                    justifyContent: 'center',
                  }}
                >
                  <FontAwesome
                    name='fire'
                    size={16}
                    color={
                      isDark ? Colors.secondary.DEFAULT : Colors.secondary.light
                    }
                  />
                  <Text
                    style={{
                      marginLeft: Spacing[2],
                      fontWeight: '500',
                      color: isDark ? Colors.white : Colors.gray[800],
                      fontSize: 14,
                      fontFamily: 'SecondaryFont-Bold',
                    }}
                  >
                    {analyticsData?.studySessions || 0} gün
                  </Text>
                </View>
              </PulseElement>
            </FloatingElement>
          </View>
        </View>
      </SlideInElement>

      {loading ? (
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            padding: Spacing[8],
          }}
        >
          <ActivityIndicator
            size='large'
            color={isDark ? Colors.primary.DEFAULT : Colors.vibrant.coral}
          />
          <Text
            style={{
              marginTop: Spacing[4],
              color: isDark ? Colors.gray[400] : Colors.white,
              fontFamily: 'SecondaryFont-Regular',
              fontSize: 16,
            }}
          >
            Ana sayfa yükleniyor...
          </Text>
          <Text
            style={{
              marginTop: Spacing[2],
              color: isDark ? Colors.gray[500] : Colors.gray[200],
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
          {/* User statistics */}
          <SlideInElement direction='up' delay={200}>
            <Row
              style={{
                justifyContent: 'space-between',
                flexWrap: 'nowrap',
                marginBottom: Spacing[6],
              }}
            >
              <StatCard
                icon='book'
                title='Tamamlanan Dersler'
                value={
                  analyticsData
                    ? `${analyticsData.branchPerformance?.length || 0}/${
                        courses.length || 0
                      }`
                    : '0/0'
                }
                color={isDark ? VIBRANT_COLORS.purple : VIBRANT_COLORS.yellow}
                titleFontFamily='SecondaryFont-Bold'
              />
              <StatCard
                icon='check-circle'
                title='Çözülen Sorular'
                value={(analyticsData?.totalQuestionsAnswered || 0).toString()}
                color={isDark ? VIBRANT_COLORS.mint : VIBRANT_COLORS.green}
                titleFontFamily='SecondaryFont-Bold'
              />
              <StatCard
                icon='trophy'
                title={'Düello\nSkoru'}
                value={calculateDuelScore()}
                color={VIBRANT_COLORS.orange}
                titleFontFamily='SecondaryFont-Bold'
              />
            </Row>
          </SlideInElement>

          {/* Continue studying */}
          <SlideInElement direction='left' delay={400}>
            <PlayfulCard
              title='Çalışmaya Devam Et'
              style={{ marginBottom: Spacing[6] }}
              titleFontFamily='PrimaryFont'
              variant='elevated'
              animated
              floatingAnimation
            >
              {courses.length > 0 ? (
                courses.map((course) => (
                  <AppLink
                    key={course.course_id}
                    href={`/courses/${course.course_id}`}
                  >
                    <BouncyButton
                      style={{ marginBottom: Spacing[3] }}
                      onPress={() => {}}
                    >
                      <TouchableOpacity
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          padding: Spacing[3],
                          backgroundColor: isDark
                            ? Colors.vibrant.purpleDark
                            : Colors.vibrant.orangeLight,
                          borderRadius: 8,
                        }}
                      >
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: isDark
                              ? Colors.white
                              : VIBRANT_COLORS.purple,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: Spacing[3],
                          }}
                        >
                          <FontAwesome
                            name={course.iconName as any}
                            size={20}
                            color={
                              isDark ? Colors.vibrant.purpleDark : Colors.white
                            }
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontWeight: '600',
                              color: isDark ? Colors.white : Colors.gray[800],
                              marginBottom: Spacing[1],
                              fontFamily: 'SecondaryFont-Bold',
                            }}
                          >
                            {course.title}
                          </Text>
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 12,
                                color: isDark
                                  ? Colors.gray[200]
                                  : Colors.gray[700],
                                marginBottom: Spacing[1],
                                fontFamily: 'SecondaryFont-Regular',
                              }}
                            >
                              {course.progress}% tamamlandı
                            </Text>
                          </View>
                          <ProgressBar
                            progress={course.progress}
                            height={8}
                            width='100%'
                            trackColor={
                              isDark ? Colors.gray[200] : Colors.white
                            }
                            progressColor={VIBRANT_COLORS.purple}
                            style={{ borderRadius: 4 }}
                            animated
                          />
                        </View>
                        <FontAwesome
                          name='chevron-right'
                          size={16}
                          color={isDark ? Colors.gray[200] : Colors.gray[800]}
                        />
                      </TouchableOpacity>
                    </BouncyButton>
                  </AppLink>
                ))
              ) : (
                <EmptyState
                  icon='book'
                  title='Henüz kurs yok'
                  fontFamily='PrimaryFont'
                  message='Kurslar sekmesinden ilk kursunuzu seçin ve çalışmaya başlayın.'
                  actionButton={{
                    title: 'Kurslara Git',
                    onPress: () => router.push('/courses' as any),
                    variant: 'primary',
                  }}
                  buttonFontFamily='PrimaryFont'
                  style={{
                    backgroundColor: isDark
                      ? Colors.primary.dark
                      : Colors.white,
                  }}
                />
              )}
              <AppLink href='/courses'>
                <PlayfulButton
                  title='Tüm Kursları Gör'
                  onPress={() => {}}
                  variant='outline'
                  style={{ marginTop: Spacing[2] }}
                  fontFamily='PrimaryFont'
                  animated
                />
              </AppLink>
            </PlayfulCard>
          </SlideInElement>

          {/* Recent Tests */}
          <SlideInElement direction='right' delay={600}>
            <PlayfulCard
              title='Popüler Testler'
              style={{ marginBottom: Spacing[6] }}
              titleFontFamily='PrimaryFont'
              variant='playful'
              animated
              floatingAnimation
            >
              {tests.length > 0 ? (
                tests.map((test) => (
                  <AppLink key={test.test_id} href={`/tests/${test.test_id}`}>
                    <BouncyButton
                      style={{ marginBottom: Spacing[3] }}
                      onPress={() => {}}
                    >
                      <TouchableOpacity
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          padding: Spacing[3],
                          backgroundColor: isDark
                            ? Colors.vibrant.purpleDark
                            : Colors.white,
                          borderRadius: 8,
                        }}
                      >
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: isDark
                              ? Colors.white
                              : VIBRANT_COLORS.blue,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: Spacing[3],
                          }}
                        >
                          <FontAwesome
                            name='question-circle'
                            size={20}
                            color={isDark ? VIBRANT_COLORS.blue : Colors.white}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontWeight: '600',
                              color: isDark
                                ? Colors.white
                                : Colors.vibrant.purpleDark,
                              marginBottom: Spacing[1],
                              fontFamily: 'SecondaryFont-Bold',
                            }}
                          >
                            {test.title}
                          </Text>
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 12,
                                color: isDark
                                  ? Colors.gray[200]
                                  : Colors.gray[500],
                                fontFamily: 'SecondaryFont-Regular',
                              }}
                            >
                              {test.questionCount || 0} soru •{' '}
                              {test.timeLimit || 0} dakika •{' '}
                            </Text>
                            <Text
                              style={{
                                fontSize: 12,
                                marginLeft: Spacing[1],
                                color:
                                  test.difficulty === 'Kolay'
                                    ? Colors.success
                                    : test.difficulty === 'Orta'
                                    ? Colors.warning
                                    : Colors.error,
                                fontFamily: 'SecondaryFont-Regular',
                              }}
                            >
                              {test.difficulty}
                            </Text>
                          </View>
                        </View>
                        <FontAwesome
                          name='chevron-right'
                          size={16}
                          color={
                            isDark
                              ? Colors.gray[200]
                              : Colors.vibrant.purpleLight
                          }
                        />
                      </TouchableOpacity>
                    </BouncyButton>
                  </AppLink>
                ))
              ) : (
                <EmptyState
                  icon='file'
                  title='Test bulunamadı'
                  fontFamily='PrimaryFont'
                  buttonFontFamily='PrimaryFont'
                  message='Testler sekmesinden testlere erişebilirsiniz.'
                  style={{
                    backgroundColor: isDark
                      ? Colors.vibrant.purpleDark
                      : Colors.white,
                  }}
                />
              )}
              <AppLink href='/tests'>
                <PlayfulButton
                  title='Tüm Testleri Gör'
                  onPress={() => {}}
                  variant='outline'
                  style={{ marginTop: Spacing[2] }}
                  fontFamily='PrimaryFont'
                  animated
                />
              </AppLink>
            </PlayfulCard>
          </SlideInElement>

          {/* Active Duels */}
          <SlideInElement direction='up' delay={800}>
            <PlayfulCard
              title='Aktif Düellolar'
              style={{ marginBottom: Spacing[6] }}
              titleFontFamily='PrimaryFont'
              variant='playful'
              animated
              floatingAnimation
            >
              {activeDuels.length > 0 ? (
                activeDuels.map((duel) => (
                  <AppLink key={duel.duel_id} href={`/duels/${duel.duel_id}`}>
                    <BouncyButton
                      style={{ marginBottom: Spacing[3] }}
                      onPress={() => {}}
                    >
                      <TouchableOpacity
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          padding: Spacing[3],
                          backgroundColor: isDark
                            ? Colors.vibrant.purpleDark
                            : Colors.white,
                          borderRadius: 8,
                        }}
                      >
                        <Avatar
                          name={getOpponentAvatarInitial(duel)}
                          size='md'
                          bgColor={
                            isDark ? Colors.white : VIBRANT_COLORS.orange
                          }
                          borderGlow
                          animated
                        />
                        <View style={{ flex: 1, marginLeft: Spacing[3] }}>
                          <Text
                            style={{
                              fontWeight: '600',
                              color: isDark
                                ? Colors.white
                                : Colors.vibrant.purpleDark,
                              marginBottom: Spacing[1],
                              fontFamily: 'SecondaryFont-Bold',
                            }}
                          >
                            {getOpponentDisplayName(duel)}
                          </Text>
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              marginTop: Spacing[1],
                            }}
                          >
                            {renderDuelStatusBadge(duel.status)}
                          </View>
                        </View>
                        <FontAwesome
                          name='chevron-right'
                          size={16}
                          color={
                            isDark
                              ? Colors.gray[200]
                              : Colors.vibrant.purpleLight
                          }
                        />
                      </TouchableOpacity>
                    </BouncyButton>
                  </AppLink>
                ))
              ) : (
                <EmptyState
                  icon='users'
                  title='Aktif düello yok'
                  fontFamily='PrimaryFont'
                  buttonFontFamily='PrimaryFont'
                  message='Arkadaşlarınızı düelloya davet edin ve rekabeti başlatın.'
                  actionButton={{
                    title: 'Düello Başlat',
                    onPress: () => router.push('/duel/new' as any),
                    variant: 'secondary',
                  }}
                  style={{
                    backgroundColor: isDark
                      ? Colors.vibrant.purpleDark
                      : Colors.white,
                  }}
                />
              )}
              <AppLink href='/duels'>
                <PlayfulButton
                  title='Tüm Düelloları Gör'
                  onPress={() => {}}
                  variant='outline'
                  style={{ marginTop: Spacing[2] }}
                  fontFamily='PrimaryFont'
                  animated
                />
              </AppLink>
            </PlayfulCard>
          </SlideInElement>

          {/* Recent Achievements */}
          <SlideInElement direction='left' delay={1000}>
            <PlayfulCard
              title='Son Başarılar'
              style={{ marginBottom: Spacing[6] }}
              titleFontFamily='PrimaryFont'
              variant='playful'
              animated
              floatingAnimation
            >
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {userAchievements.length > 0 ? (
                  userAchievements.map((achievement) => (
                    <View
                      key={achievement.achievement_id}
                      style={{
                        width: '33.33%',
                        alignItems: 'center',
                        padding: Spacing[2],
                      }}
                    >
                      <FloatingElement>
                        <View
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 24,
                            backgroundColor: isDark
                              ? Colors.white
                              : VIBRANT_COLORS.yellow,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: Spacing[2],
                          }}
                        >
                          <FontAwesome
                            name={getAchievementIcon(achievement)}
                            size={24}
                            color={
                              isDark ? VIBRANT_COLORS.yellow : Colors.white
                            }
                          />
                        </View>
                      </FloatingElement>
                      <Text
                        style={{
                          fontSize: 12,
                          textAlign: 'center',
                          color: isDark
                            ? Colors.white
                            : Colors.vibrant.purpleDark,
                          fontFamily: 'SecondaryFont-Regular',
                        }}
                      >
                        {achievement.name}
                      </Text>
                    </View>
                  ))
                ) : (
                  <EmptyState
                    icon='trophy'
                    title='Henüz başarı yok'
                    fontFamily='PrimaryFont'
                    buttonFontFamily='PrimaryFont'
                    message='Daha fazla çalışıkça başarılar kazanacaksınız.'
                    style={{
                      backgroundColor: isDark
                        ? Colors.vibrant.purpleDark
                        : Colors.white,
                    }}
                  />
                )}
              </View>
              {userAchievements.length > 0 && (
                <AppLink href='/profile'>
                  <PlayfulButton
                    title='Tüm Başarıları Gör'
                    onPress={() => {}}
                    variant='outline'
                    style={{ marginTop: Spacing[4] }}
                    fontFamily='PrimaryFont'
                    animated
                  />
                </AppLink>
              )}
            </PlayfulCard>
          </SlideInElement>

          {/* Error display at bottom if there's an error but data is loaded */}
          {error &&
            !loading &&
            (courses.length > 0 ||
              tests.length > 0 ||
              activeDuels.length > 0) && (
              <Alert
                type='warning'
                message='Veriler yenilenirken sorun yaşandı. Çekmek için aşağı kaydırın.'
                style={{ marginTop: Spacing[4] }}
              />
            )}

          {/* Retry button at bottom for partial failures */}
          {!loading &&
            courses.length === 0 &&
            tests.length === 0 &&
            activeDuels.length === 0 &&
            !error && (
              <View
                style={{
                  alignItems: 'center',
                  padding: Spacing[6],
                  backgroundColor: isDark
                    ? 'rgba(255,255,255,0.05)'
                    : 'rgba(0,0,0,0.05)',
                  borderRadius: 12,
                  marginTop: Spacing[4],
                }}
              >
                <FontAwesome
                  name='wifi'
                  size={48}
                  color={Colors.gray[400]}
                  style={{ marginBottom: Spacing[3] }}
                />
                <Text
                  style={{
                    color: isDark ? Colors.gray[300] : Colors.gray[600],
                    fontFamily: 'SecondaryFont-Regular',
                    textAlign: 'center',
                    marginBottom: Spacing[4],
                    fontSize: 16,
                  }}
                >
                  Veriler yüklenemedi
                </Text>
                <PlayfulButton
                  title='Tekrar Dene'
                  onPress={handleRetry}
                  variant='primary'
                  size='medium'
                  animated
                  icon='refresh'
                />
              </View>
            )}
        </>
      )}

      {/* Bottom spacing to ensure content is fully visible */}
      <View style={{ height: Spacing[8] }} />
    </ScrollView>
  );
}
