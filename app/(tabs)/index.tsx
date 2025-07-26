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
  EmptyState,
  Avatar,
  AppLink,
  Container,
  Paragraph,
  Alert,
  ProgressBar,
  FloatingElement,
  BouncyButton,
  PulseElement,
  StudyChronometer,
  CourseSelectionModal,
} from '../../components/ui';
import { courseService, analyticsService } from '../../src/api';
import { checkAndRefreshSession } from '../../src/api/authService';
import { useAuth } from '../../context/AuthContext';
import {
  usePreferredCourse,
  PreferredCourseProvider,
} from '../../context/PreferredCourseContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Course } from '../../src/types/models';
import { Colors, Spacing } from '../../constants/theme';

// Use the theme constants correctly
const VIBRANT_COLORS = Colors.vibrant;

// Define interface to extend Course with additional fields we need
interface CourseWithProgress extends Course {
  progress: number;
  iconName: string;
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

// Main Home Screen Component (wrapped with context)
function HomeScreenContent() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { refreshSession } = useAuth();
  const {
    preferredCourse,
    isLoading: courseLoading,
    getCourseColor,
  } = usePreferredCourse();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState<{ username?: string } | null>(null);
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
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

  // Check if we should show the course selection modal
  useEffect(() => {
    if (!courseLoading && !preferredCourse && !loading) {
      setShowCourseModal(true);
    }
  }, [preferredCourse, courseLoading, loading]);

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
      const [coursesResponse, analyticsResponse] = await Promise.allSettled([
        courseService.getAllCourses(),
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
        setCourses([]);
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
        const firstError = [coursesResponse, analyticsResponse].find(
          (response) => response.status === 'rejected',
        )?.reason;

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

  // Helper to map course titles to FontAwesome icons
  const getIconForCourse = (title?: string): string => {
    const titleLower = title?.toLowerCase() || '';

    if (titleLower.includes('anatomi')) return 'tooth';
    if (titleLower.includes('patoloji')) return 'microscope';
    if (titleLower.includes('cerrahi')) return 'cut';
    if (titleLower.includes('protez') || titleLower.includes('protetik'))
      return 'cogs';
    if (titleLower.includes('periodon')) return 'heartbeat';
    if (titleLower.includes('pedodonti')) return 'child';
    if (titleLower.includes('endodonti')) return 'medkit';
    if (titleLower.includes('ortodonti')) return 'exchange';
    if (titleLower.includes('radyoloji')) return 'eye';
    if (titleLower.includes('restoratif')) return 'tooth';

    return 'book-medical';
  };

  // Handle course modal close
  const handleCourseModalClose = () => {
    setShowCourseModal(false);
  };

  // Handle course selection
  const handleCourseSelected = () => {
    setShowCourseModal(false);
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
        </View>
      </Container>
    );
  }

  return (
    <>
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
            titleColor={isDark ? Colors.gray[600] : Colors.gray[600]}
          />
        }
      >
        {/* Header with chronometer on left, user info on right */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: Spacing[6],
          }}
        >
          {/* Left side - Chronometer */}
          <View style={{ flex: 1, marginRight: Spacing[4] }}>
            {preferredCourse && courses.length > 0 && (
              <StudyChronometer
                topicId={courses[0]?.course_id || 1} // Use first course as example
                topicTitle={courses[0]?.title || 'Çalışma'}
                courseTitle={preferredCourse.title}
                category={preferredCourse.category}
                variant='elevated'
                style={{ flex: 1 }}
                maxWidth='100%'
              />
            )}
          </View>

          {/* Right side - User info and streak */}
          <View style={{ alignItems: 'flex-end' }}>
            <View style={{ alignItems: 'flex-end', marginBottom: Spacing[3] }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: isDark ? Colors.white : Colors.white,
                  textAlign: 'right',
                  fontFamily: 'PrimaryFont',
                  marginBottom: Spacing[1],
                }}
              >
                Merhaba {userData?.username || 'Öğrenci'}!
              </Text>
              <Paragraph
                color={isDark ? Colors.gray[100] : Colors.gray[100]}
                style={{
                  fontFamily: 'SecondaryFont-Regular',
                  textAlign: 'right',
                  fontSize: 12,
                }}
              >
                DUS sınavına hazırlanmaya devam edelim
              </Paragraph>
            </View>

            {/* Avatar and streak */}
            <View style={{ alignItems: 'center' }}>
              <Avatar
                name={userData?.username?.charAt(0).toUpperCase() || 'Ö'}
                size='lg'
                bgColor={
                  preferredCourse
                    ? getCourseColor(preferredCourse.category)
                    : VIBRANT_COLORS.purple
                }
                borderGlow
                animated
                style={{ marginBottom: Spacing[2] }}
              />

              <FloatingElement>
                <PulseElement>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: isDark
                        ? Colors.vibrant.orange
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
                        isDark ? Colors.secondary.light : Colors.secondary.light
                      }
                    />
                    <Text
                      style={{
                        marginLeft: Spacing[2],
                        fontWeight: '500',
                        color: isDark ? Colors.gray[800] : Colors.gray[800],
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
        </View>

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
              color={isDark ? Colors.vibrant.coral : Colors.vibrant.coral}
            />
            <Text
              style={{
                marginTop: Spacing[4],
                color: isDark ? Colors.white : Colors.white,
                fontFamily: 'SecondaryFont-Regular',
                fontSize: 16,
              }}
            >
              Ana sayfa yükleniyor...
            </Text>
          </View>
        ) : (
          <>
            {/* Continue studying - with preferred course color */}
            <PlayfulCard
              title='Çalışmaya Devam Et'
              style={{ marginBottom: Spacing[6] }}
              titleFontFamily='PrimaryFont'
              variant='elevated'
              category={preferredCourse?.category}
              animated
              floatingAnimation
            >
              {courses.length > 0 ? (
                courses.map((course) => (
                  <AppLink
                    key={course.course_id}
                    href={`/(tabs)/courses/${course.course_id}`}
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
                            ? Colors.vibrant.orangeLight
                            : Colors.vibrant.orangeLight,
                          borderRadius: 8,
                        }}
                      >
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: preferredCourse
                              ? getCourseColor(preferredCourse.category)
                              : VIBRANT_COLORS.purple,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: Spacing[3],
                          }}
                        >
                          <FontAwesome
                            name={course.iconName as any}
                            size={20}
                            color={isDark ? Colors.white : Colors.white}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontWeight: '600',
                              color: isDark
                                ? Colors.gray[800]
                                : Colors.gray[800],
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
                                  ? Colors.gray[700]
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
                            trackColor={isDark ? Colors.white : Colors.white}
                            progressColor={
                              preferredCourse
                                ? getCourseColor(preferredCourse.category)
                                : VIBRANT_COLORS.purple
                            }
                            style={{ borderRadius: 4 }}
                            animated
                          />
                        </View>
                        <FontAwesome
                          name='chevron-right'
                          size={16}
                          color={isDark ? Colors.gray[800] : Colors.gray[800]}
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
                    backgroundColor: isDark ? Colors.white : Colors.white,
                  }}
                />
              )}
            </PlayfulCard>
          </>
        )}

        {/* Bottom spacing to ensure content is fully visible */}
        <View style={{ height: Spacing[8] }} />
      </ScrollView>

      {/* Course Selection Modal */}
      <CourseSelectionModal
        visible={showCourseModal}
        onClose={handleCourseModalClose}
        onCourseSelected={handleCourseSelected}
      />
    </>
  );
}

// Main component with context provider
export default function HomeScreen() {
  return (
    <PreferredCourseProvider>
      <HomeScreenContent />
    </PreferredCourseProvider>
  );
}
