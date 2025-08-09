// screens/OptimizedHomeScreen.tsx
import React, { useEffect, useCallback, useMemo, memo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  RefreshControl,
  Alert as RNAlert,
  Dimensions,
  FlatList,
  StyleSheet,
  ListRenderItem,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  PlayfulCard,
  EmptyState,
  Avatar,
  Container,
  Paragraph,
  Alert,
  FloatingElement,
  PulseElement,
  StudyChronometer,
  CourseSelectionModal,
  Button,
} from '../../components/ui';
import { courseService, analyticsService, studyService } from '../../src/api';
import { checkAndRefreshSession } from '../../src/api/authService';
import { useAuth } from '../../context/AuthContext';
import {
  usePreferredCourse,
  PreferredCourseProvider,
} from '../../context/PreferredCourseContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Course,
  StudyStatistics,
  CourseWithProgress,
  EditingCourseDetails,
  User,
} from '../../src/types/models';
import { Colors, Spacing } from '../../constants/theme';

// Import optimized hooks and components
import { useHomeScreenState } from '../../src/hooks/useHomeScreenState';
import {
  useUtilityFunctions,
  useDataMapping,
  useCourseProcessing,
} from '../../src/hooks/useOptimizedDataProcessing';
import { useOptimizedAPIService } from '../../services/optimizedAPIService';
import {
  OptimizedCourseAnalytics,
  OptimizedStudySessionCard,
  OptimizedCourseDetailsForm,
  OptimizedPerformanceSummary,
} from '../../components/OptimizedHomeComponents';

// Get screen dimensions once
const { width: screenWidth } = Dimensions.get('window');

// StyleSheet for performance optimization (keeping original styles)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: Spacing[8],
  },
  headerContainer: {
    flexDirection: 'column',
    marginBottom: Spacing[6],
    paddingHorizontal: Spacing[4],
  },
  headerContent: {
    alignItems: 'flex-end',
    marginBottom: Spacing[3],
  },
  welcomeText: {
    fontSize: 18,
    textAlign: 'right',
    fontFamily: 'PrimaryFont',
    marginBottom: Spacing[1],
  },
  welcomeSubtext: {
    fontFamily: 'SecondaryFont-Regular',
    textAlign: 'right',
    fontSize: 12,
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.vibrant.orange,
    borderRadius: 999,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    minWidth: 80,
    justifyContent: 'center',
    // shadowColor: Colors.gray[900],
    // shadowOffset: { width: 2, height: 4 },
    // shadowOpacity: 0.3,
    // shadowRadius: 4,
    // elevation: 4,
  },
  streakText: {
    marginLeft: Spacing[2],
    fontSize: 14,
    fontFamily: 'SecondaryFont-Bold',
  },
  avatarStyle: {
    // shadowColor: Colors.gray[900],
    // shadowOffset: { width: 2, height: 4 },
    // shadowOpacity: 0.3,
    // shadowRadius: 4,
    // elevation: 4,
  },
  chronometerContainer: {
    width: '100%',
    alignSelf: 'stretch',
    // shadowColor: Colors.gray[900],
    // shadowOffset: { width: 2, height: 4 },
    // shadowOpacity: 0.3,
    // shadowRadius: 4,
    // elevation: 4,
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
    textAlign: 'center',
    marginBottom: Spacing[2],
    fontFamily: 'SecondaryFont-Bold',
  },
  errorAlert: {
    marginBottom: Spacing[6],
  },
  courseCardContainer: {
    width: screenWidth,
    paddingHorizontal: Spacing[4],
    // shadowColor: Colors.gray[900],
    // shadowOffset: { width: 2, height: 4 },
    // shadowOpacity: 0.3,
    // shadowRadius: 4,
    // elevation: 4,
    paddingTop: Spacing[6],
    paddingBottom: Spacing[12],
  },
  courseCard: {
    width: '100%',
    // shadowColor: Colors.gray[900],
    // shadowOffset: { width: 4, height: 8 },
    // shadowOpacity: 0.4,
    // shadowRadius: 8,
    // elevation: 8,
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[4],
  },
  courseIcon: {
    padding: Spacing[3],
    borderRadius: 50,
    marginRight: Spacing[3],
  },
  courseTitleContainer: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 16,
    fontFamily: 'SecondaryFont-Bold',
    marginBottom: Spacing[1],
  },
  courseDescription: {
    fontSize: 12,
    fontFamily: 'SecondaryFont-Regular',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'SecondaryFont-Bold',
    marginBottom: Spacing[3],
  },
  toggleButton: {
    padding: Spacing[3],
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  toggleButtonText: {
    color: Colors.white,
    fontFamily: 'SecondaryFont-Bold',
  },
  detailsFormContainer: {
    marginBottom: Spacing[4],
  },
  emptySessionContainer: {
    alignItems: 'center',
    padding: Spacing[4],
  },
  emptySessionIcon: {
    marginBottom: Spacing[2],
  },
  emptySessionText: {
    fontFamily: 'SecondaryFont-Regular',
    textAlign: 'center',
  },
  navigationIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  indicator: {
    marginHorizontal: 4,
    marginBottom: Spacing[4],
  },
  emptyStateContainer: {
    backgroundColor: Colors.white,
    padding: Spacing[4],
    borderRadius: 8,
  },
  spacer: {
    height: Spacing[8],
  },
  debugContainer: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  debugText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
});

// Color getter functions (keeping original implementations)
const getTextColor = (isDark: boolean): string =>
  isDark ? Colors.gray[900] : Colors.gray[900];
const getSecondaryTextColor = (isDark: boolean): string =>
  isDark ? Colors.gray[700] : Colors.gray[700];
const getWhiteTextColor = (isDark: boolean): string =>
  isDark ? Colors.white : Colors.white;
const getTertiaryTextColor = (isDark: boolean): string =>
  isDark ? Colors.gray[300] : Colors.gray[300];

// Memoized Components
const MemoizedPlayfulCard = memo(PlayfulCard);
const MemoizedStudyChronometer = memo(StudyChronometer);

// Debug Component
// const DebugInfo = memo(({ state, preferredCourse }: any) => {
//   return (
//     <View style={styles.debugContainer}>
//       <Text style={styles.debugText}>🐛 DEBUG INFO:</Text>
//       <Text style={styles.debugText}>
//         Loading: {state.uiState.loading.toString()}
//       </Text>
//       <Text style={styles.debugText}>
//         Courses Loading: {state.courseData.coursesLoading.toString()}
//       </Text>
//       <Text style={styles.debugText}>
//         Courses Count: {state.courseData.courses.length}
//       </Text>
//       <Text style={styles.debugText}>
//         Selected Course: {state.courseData.selectedCourse ? 'Yes' : 'No'}
//       </Text>
//       <Text style={styles.debugText}>
//         Preferred Course: {preferredCourse ? preferredCourse.title : 'None'}
//       </Text>
//       <Text style={styles.debugText}>
//         Show Modal: {state.uiState.showCourseModal.toString()}
//       </Text>
//       <Text style={styles.debugText}>
//         Error: {state.uiState.error || 'None'}
//       </Text>
//     </View>
//   );
// });

// Main Home Screen Component
function HomeScreenContent() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { refreshSession } = useAuth();
  const {
    preferredCourse,
    isLoading: courseLoading,
    getCourseColor,
    getCourseCategory,
  } = usePreferredCourse();

  // Use refs to prevent infinite loops
  const initialLoadRef = useRef(false);
  const mountedRef = useRef(true);

  // Use optimized state management
  const { state, actions } = useHomeScreenState();

  // Add debug logging
  // useEffect(() => {
  //   console.log('🏠 HomeScreen State Updated:', {
  //     loading: state.uiState.loading,
  //     coursesLoading: state.courseData.coursesLoading,
  //     coursesCount: state.courseData.courses.length,
  //     selectedCourse: !!state.courseData.selectedCourse,
  //     preferredCourse: preferredCourse?.title || 'None',
  //     showModal: state.uiState.showCourseModal,
  //     error: state.uiState.error,
  //   });
  // }, [state, preferredCourse]);

  // Use optimized utility functions
  const {
    ensureSafeNumber,
    getIconForCourse,
    getDifficultyColor,
    getDifficultyText,
    formatTimeFromSeconds,
    formatTimeForDisplay,
  } = useUtilityFunctions();

  // Use optimized data processing
  const { mapProgressData, mapSessionsData } = useDataMapping();

  // Use optimized API service
  const apiService = useOptimizedAPIService({
    courseService,
    analyticsService,
    studyService,
  });

  // Simplified and more robust course fetching
  const stableFetchCoursesWithData = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      console.log('🔄 Starting course fetch...');
      actions.setCoursesLoading(true);
      actions.setError(null);

      // First get all courses
      const allCourses = await apiService.fetchAllCourses();
      console.log('📚 Fetched courses:', allCourses?.length || 0);

      if (!mountedRef.current || !allCourses?.length) {
        console.log('❌ No courses or component unmounted');
        if (mountedRef.current) {
          actions.setCourses([]);
        }
        return;
      }

      // Filter to klinik courses only
      const klinikCourses = allCourses.filter(
        (course: Course) => course.course_type === 'klinik_dersler',
      );

      console.log('🏥 Klinik courses:', klinikCourses.length);

      if (!klinikCourses.length) {
        console.log('❌ No klinik courses found');
        if (mountedRef.current) {
          actions.setCourses([]);
        }
        return;
      }

      // Process courses with timeout protection
      const coursesWithProgress: CourseWithProgress[] = [];

      for (let i = 0; i < klinikCourses.length; i++) {
        const course = klinikCourses[i];

        try {
          console.log(
            `🔄 Processing course ${i + 1}/${klinikCourses.length}: ${course.title} (ID: ${course.course_id})`,
          );

          // Add timeout protection for each course
          const coursePromise = Promise.race([
            Promise.allSettled([
              apiService.fetchCourseProgress(course.course_id),
              apiService.fetchStudySessions(1, 5, course.course_id),
            ]),
            new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error('Course processing timeout')),
                10000,
              ),
            ),
          ]);

          const [progressResult, sessionsResult] = (await coursePromise) as any;

          const progress =
            progressResult.status === 'fulfilled'
              ? mapProgressData(
                  progressResult.value?.progress || progressResult.value,
                )
              : null;

          const sessions =
            sessionsResult.status === 'fulfilled'
              ? mapSessionsData(sessionsResult.value?.sessions || [])
              : [];

          console.log(
            `✅ Processed course ${course.course_id}: Progress=${!!progress}, Sessions=${sessions.length}`,
          );

          const processedCourse: CourseWithProgress = {
            ...course,
            progress,
            studySessions: sessions,
            iconName: getIconForCourse(course.title),
            isSessionsExpanded: false,
            category: getCourseCategory(course.title),
          };

          coursesWithProgress.push(processedCourse);
        } catch (error) {
          console.error(
            `❌ Error processing course ${course.course_id}:`,
            error,
          );

          // Still add the course but without progress data
          const fallbackCourse: CourseWithProgress = {
            ...course,
            progress: null,
            studySessions: [],
            iconName: getIconForCourse(course.title),
            isSessionsExpanded: false,
            category: getCourseCategory(course.title),
          };

          coursesWithProgress.push(fallbackCourse);
        }

        // Check if component is still mounted after each course
        if (!mountedRef.current) {
          console.log('❌ Component unmounted during processing');
          return;
        }
      }

      console.log('✅ All courses processed:', coursesWithProgress.length);

      if (mountedRef.current && coursesWithProgress.length > 0) {
        // Sort by study time
        const sortedCourses = coursesWithProgress.sort(
          (a, b) =>
            (b.progress?.total_study_time_seconds || 0) -
            (a.progress?.total_study_time_seconds || 0),
        );

        console.log('🎯 Setting courses in state:', sortedCourses.length);
        actions.setCourses(sortedCourses);
        console.log('✅ Courses successfully set in state!');
      } else {
        console.log('❌ No courses to set or component unmounted');
      }
    } catch (error) {
      console.error('❌ Error fetching courses with data:', error);
      if (mountedRef.current) {
        actions.setError('Dersler yüklenirken bir hata oluştu.');
      }
    } finally {
      if (mountedRef.current) {
        actions.setCoursesLoading(false);
        console.log('✅ Course loading complete');
      }
    }
  }, [
    actions.setCoursesLoading,
    actions.setCourses,
    actions.setError,
    apiService,
    mapProgressData,
    mapSessionsData,
    getIconForCourse,
    getCourseCategory,
  ]);

  const stableFetchAnalyticsData = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      console.log('📊 Fetching analytics data...');
      const [analyticsResult, statsResult] = await Promise.allSettled([
        apiService.fetchAnalyticsData(),
        apiService.fetchStudyStatistics(),
      ]);

      if (mountedRef.current) {
        actions.updateAppData({
          analyticsData:
            analyticsResult.status === 'fulfilled'
              ? analyticsResult.value
              : null,
          studyStatistics:
            statsResult.status === 'fulfilled' ? statsResult.value : null,
        });
        console.log('✅ Analytics data updated');
      }
    } catch (error) {
      console.error('❌ Error fetching analytics data:', error);
    }
  }, [actions.updateAppData, apiService]);

  const stableFetchPerformanceData = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      console.log('🏆 Fetching performance data...');
      actions.setPerformanceLoading(true);
      actions.setPerformanceError(null);

      const performanceData = await apiService.fetchPerformanceDataOptimized();

      if (mountedRef.current) {
        actions.setPerformanceData(performanceData);
        console.log('✅ Performance data updated');
      }
    } catch (error) {
      console.error('❌ Error fetching performance data:', error);
      if (mountedRef.current) {
        actions.setPerformanceError(
          'Performans verileri yüklenirken bir hata oluştu.',
        );
      }
    } finally {
      if (mountedRef.current) {
        actions.setPerformanceLoading(false);
      }
    }
  }, [
    actions.setPerformanceLoading,
    actions.setPerformanceError,
    actions.setPerformanceData,
    apiService,
  ]);

  // Load user data from AsyncStorage (only once)
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        if (userData && mountedRef.current) {
          actions.setUserData(JSON.parse(userData));
          console.log('👤 User data loaded from storage');
        }
      } catch (error) {
        console.error('❌ Error loading user data from AsyncStorage:', error);
      }
    };
    loadUserData();
  }, [actions.setUserData]);

  // Course selection modal logic (simplified)
  useEffect(() => {
    console.log('🎯 Modal logic check:', {
      courseLoading,
      preferredCourse: !!preferredCourse,
      loading: state.uiState.loading,
      showModal: state.uiState.showCourseModal,
      coursesLength: state.courseData.courses.length,
    });

    // Only show modal if we have no preferred course and we're not loading
    if (
      !courseLoading &&
      !preferredCourse &&
      !state.uiState.loading &&
      !state.uiState.showCourseModal &&
      state.courseData.courses.length > 0
    ) {
      console.log('🎯 Showing course selection modal');
      actions.setShowCourseModal(true);
    }
  }, [
    courseLoading,
    preferredCourse,
    state.uiState.loading,
    state.uiState.showCourseModal,
    state.courseData.courses.length,
    actions.setShowCourseModal,
  ]);

  // Set initial selected course (simplified)
  useEffect(() => {
    if (
      preferredCourse &&
      state.courseData.courses.length > 0 &&
      !state.courseData.selectedCourse
    ) {
      console.log('🎯 Setting preferred course as selected');
      const preferredCourseWithProgress = state.courseData.courses.find(
        (c) => c.course_id === preferredCourse.course_id,
      );
      const courseToSelect =
        preferredCourseWithProgress || state.courseData.courses[0];
      actions.setSelectedCourse(courseToSelect);
      console.log('✅ Selected course set:', courseToSelect?.title);
    } else if (
      !state.courseData.selectedCourse &&
      state.courseData.courses.length > 0 &&
      !preferredCourse
    ) {
      console.log('🎯 Setting first course as selected (no preferred)');
      actions.setSelectedCourse(state.courseData.courses[0]);
    }
  }, [
    preferredCourse?.course_id,
    state.courseData.courses.length,
    state.courseData.selectedCourse,
    actions.setSelectedCourse,
  ]);

  // Course editing handlers
  const handleEditCourseDetails = useCallback(
    (course: CourseWithProgress) => {
      actions.setEditingCourse(course.course_id, {
        courseId: course.course_id,
        tekrarSayisi: course.progress?.tekrar_sayisi || 0,
        konuKaynaklari: course.progress?.konu_kaynaklari
          ? [...course.progress.konu_kaynaklari]
          : [],
        soruBankasiKaynaklari: course.progress?.soru_bankasi_kaynaklari
          ? [...course.progress.soru_bankasi_kaynaklari]
          : [],
        difficulty_rating: course.progress?.difficulty_rating || 1,
        notes: course.progress?.notes || '',
        is_completed: course.progress?.is_completed || false,
        completionPercentage: course.progress?.completion_percentage || 0,
      });
    },
    [actions.setEditingCourse],
  );

  const handleSaveCourseDetails = useCallback(async () => {
    if (
      !state.editingState.editingCourseId ||
      !state.editingState.editingDetails.courseId
    )
      return;

    try {
      actions.setUpdatingCourse(state.editingState.editingCourseId);

      await studyService.updateUserCourseProgress({
        courseId: state.editingState.editingDetails.courseId,
        tekrarSayisi: state.editingState.editingDetails.tekrarSayisi,
        konuKaynaklari: state.editingState.editingDetails.konuKaynaklari,
        soruBankasiKaynaklari:
          state.editingState.editingDetails.soruBankasiKaynaklari,
        difficultyRating: state.editingState.editingDetails.difficulty_rating,
        notes: state.editingState.editingDetails.notes || undefined,
        isCompleted: state.editingState.editingDetails.is_completed,
        completionPercentage:
          state.editingState.editingDetails.completionPercentage,
      });

      await stableFetchCoursesWithData();
      actions.setEditingCourse(null, {});
      RNAlert.alert('Başarılı', 'Ders detayları güncellendi!');
    } catch (error) {
      console.error('Error updating course details:', error);
      RNAlert.alert('Hata', 'Ders detayları güncellenirken bir hata oluştu.');
    } finally {
      actions.setUpdatingCourse(null);
    }
  }, [
    state.editingState,
    actions.setUpdatingCourse,
    actions.setEditingCourse,
    stableFetchCoursesWithData,
  ]);

  const handleCancelEdit = useCallback(() => {
    actions.setEditingCourse(null, {});
  }, [actions.setEditingCourse]);

  const handleToggleSessionsExpansion = useCallback(
    (courseId: number) => {
      actions.toggleSessionExpansion(courseId);
    },
    [actions.toggleSessionExpansion],
  );

  // Optimized refresh handler
  const handleRefresh = useCallback(async () => {
    if (state.uiState.refreshing || !mountedRef.current) return;

    try {
      console.log('🔄 Refreshing data...');
      actions.setRefreshing(true);
      actions.setError(null);

      const sessionValid = await checkAndRefreshSession();
      if (!sessionValid) {
        router.replace('/(auth)/login');
        return;
      }

      await Promise.all([
        stableFetchCoursesWithData(),
        stableFetchAnalyticsData(),
        stableFetchPerformanceData(),
      ]);
      console.log('✅ Refresh complete');
    } catch (error) {
      console.error('❌ Refresh failed:', error);
      if (mountedRef.current) {
        actions.setError('Yenileme başarısız.');
      }
    } finally {
      if (mountedRef.current) {
        actions.setRefreshing(false);
      }
    }
  }, [
    state.uiState.refreshing,
    actions.setRefreshing,
    actions.setError,
    router,
    stableFetchCoursesWithData,
    stableFetchAnalyticsData,
    stableFetchPerformanceData,
  ]);

  // Initial data fetch (only once)
  useEffect(() => {
    if (initialLoadRef.current) return;

    const initialLoad = async () => {
      if (!mountedRef.current) return;

      console.log('🚀 Starting initial load...');
      initialLoadRef.current = true;
      actions.setLoading(true);

      try {
        const sessionValid = await checkAndRefreshSession();
        if (!sessionValid) {
          router.replace('/(auth)/login');
          return;
        }

        if (mountedRef.current) {
          await Promise.all([
            stableFetchCoursesWithData(),
            stableFetchAnalyticsData(),
            stableFetchPerformanceData(),
          ]);
          console.log('✅ Initial load complete');
        }
      } catch (error) {
        console.error('❌ Initial load error:', error);
        if (mountedRef.current) {
          actions.setError('Başlangıç verisi yüklenemedi.');
        }
      } finally {
        if (mountedRef.current) {
          actions.setLoading(false);
        }
      }
    };

    initialLoad();
  }, [
    actions.setLoading,
    actions.setError,
    router,
    stableFetchCoursesWithData,
    stableFetchAnalyticsData,
    stableFetchPerformanceData,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Modal handlers
  const handleCourseModalClose = useCallback(() => {
    actions.setShowCourseModal(false);
  }, [actions.setShowCourseModal]);

  const handleCourseSelected = useCallback(() => {
    actions.setShowCourseModal(false);
  }, [actions.setShowCourseModal]);

  // Memoized setEditingDetails function
  const setEditingDetails = useCallback(
    (details: EditingCourseDetails) => {
      actions.setEditingCourse(state.editingState.editingCourseId, details);
    },
    [actions.setEditingCourse, state.editingState.editingCourseId],
  );

  // Render course card function
  const renderCourseCard: ListRenderItem<CourseWithProgress> = useCallback(
    ({ item: course }) => (
      <View style={styles.courseCardContainer}>
        <MemoizedPlayfulCard
          title='Çalışmaya Devam Et'
          style={styles.courseCard}
          titleFontFamily='PrimaryFont'
          variant='elevated'
          category={preferredCourse?.category}
          animated={false}
          floatingAnimation={false}
        >
          <View>
            {/* Course Header */}
            <View style={styles.courseHeader}>
              <View
                style={[
                  styles.courseIcon,
                  {
                    backgroundColor: preferredCourse?.category
                      ? getCourseColor(preferredCourse?.category)
                      : Colors.vibrant.blue,
                  },
                ]}
              >
                <FontAwesome
                  name={course.iconName as any}
                  size={24}
                  color={Colors.white}
                />
              </View>
              <View style={styles.courseTitleContainer}>
                <Text
                  style={[
                    styles.courseTitle,
                    { color: getWhiteTextColor(isDark) },
                  ]}
                >
                  {course.title}
                </Text>
                {course.description && (
                  <Text
                    style={[
                      styles.courseDescription,
                      { color: getTertiaryTextColor(isDark) },
                    ]}
                  >
                    {course.description.length > 100
                      ? `${course.description.substring(0, 100)}...`
                      : course.description}
                  </Text>
                )}
              </View>
            </View>

            {/* Course Analytics */}
            <OptimizedCourseAnalytics
              course={course}
              isDark={isDark}
              formatTime={formatTimeFromSeconds}
              ensureSafeNumber={ensureSafeNumber}
              getDifficultyColor={getDifficultyColor}
              getDifficultyText={getDifficultyText}
            />

            {/* Current Session */}
            <View style={styles.detailsFormContainer}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: getWhiteTextColor(isDark) },
                ]}
              >
                📝 Aktif Çalışma Seansı
              </Text>

              {course.studySessions.find(
                (s) => s.session_status === 'active',
              ) ? (
                <OptimizedStudySessionCard
                  session={
                    course.studySessions.find(
                      (s) => s.session_status === 'active',
                    )!
                  }
                  isCurrentSession={true}
                  isDark={isDark}
                  category={preferredCourse?.category}
                  formatTime={formatTimeFromSeconds}
                  getSecondaryTextColor={getSecondaryTextColor}
                  getTertiaryTextColor={getTertiaryTextColor}
                />
              ) : (
                <MemoizedPlayfulCard
                  title='Yeni Çalışma Seansı Başlat'
                  variant='outlined'
                  category={preferredCourse?.category}
                  style={[
                    { marginBottom: 12 },
                    { backgroundColor: Colors.gray[100] },
                  ]}
                >
                  <View style={styles.emptySessionContainer}>
                    <FontAwesome
                      name='play-circle'
                      size={48}
                      color={
                        preferredCourse?.category
                          ? getCourseColor(preferredCourse.category)
                          : Colors.vibrant.blue
                      }
                      style={styles.emptySessionIcon}
                    />
                    <Text
                      style={[
                        styles.emptySessionText,
                        { color: Colors.gray[600] },
                      ]}
                    >
                      Bu ders için aktif bir çalışma seansı yok. Yukarıdaki
                      kronometre ile yeni bir seans başlatabilirsiniz.
                    </Text>
                  </View>
                </MemoizedPlayfulCard>
              )}
            </View>

            {/* Recent 3 Sessions */}
            <View style={styles.detailsFormContainer}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: getWhiteTextColor(isDark) },
                ]}
              >
                📚 Son 3 Çalışma Seansı
              </Text>

              <FlatList
                data={course.studySessions
                  .filter((s) => s.session_status === 'completed')
                  .slice(0, 3)}
                keyExtractor={(item) => item.session_id.toString()}
                renderItem={({ item }) => (
                  <OptimizedStudySessionCard
                    session={item}
                    isCurrentSession={false}
                    isDark={isDark}
                    category={preferredCourse?.category}
                    formatTime={formatTimeFromSeconds}
                    getSecondaryTextColor={getSecondaryTextColor}
                    getTertiaryTextColor={getTertiaryTextColor}
                  />
                )}
                scrollEnabled={false}
                removeClippedSubviews={true}
                maxToRenderPerBatch={3}
                windowSize={5}
                ListEmptyComponent={
                  <EmptyState
                    icon='history'
                    title='Henüz tamamlanmış seans yok'
                    message='Bu ders için tamamlanmış çalışma seansı bulunmuyor.'
                    style={styles.emptyStateContainer}
                  />
                }
              />
            </View>

            {/* All Sessions Toggle */}
            {course.studySessions.length > 3 && (
              <View>
                <TouchableOpacity
                  onPress={() =>
                    handleToggleSessionsExpansion(course.course_id)
                  }
                  style={[
                    styles.toggleButton,
                    { backgroundColor: Colors.gray[700] },
                  ]}
                >
                  <Text style={styles.toggleButtonText}>
                    {course.isSessionsExpanded
                      ? 'Tüm Seansları Gizle'
                      : `Tüm Seansları Göster (${course.studySessions.length - 3} tane daha)`}
                  </Text>
                </TouchableOpacity>

                {course.isSessionsExpanded && (
                  <View>
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: getWhiteTextColor(isDark) },
                      ]}
                    >
                      📋 Tüm Çalışma Seansları
                    </Text>

                    <FlatList
                      data={course.studySessions
                        .filter((s) => s.session_status === 'completed')
                        .slice(3)}
                      keyExtractor={(item) => item.session_id.toString()}
                      renderItem={({ item }) => (
                        <OptimizedStudySessionCard
                          session={item}
                          isCurrentSession={false}
                          isDark={isDark}
                          category={preferredCourse?.category}
                          formatTime={formatTimeFromSeconds}
                          getSecondaryTextColor={getSecondaryTextColor}
                          getTertiaryTextColor={getTertiaryTextColor}
                        />
                      )}
                      scrollEnabled={false}
                      removeClippedSubviews={true}
                      maxToRenderPerBatch={5}
                      windowSize={10}
                    />
                  </View>
                )}
              </View>
            )}

            {/* Course Details Form */}
            <View>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: getWhiteTextColor(isDark) },
                ]}
              >
                ⚙️ Ders Detayları
              </Text>
              <OptimizedCourseDetailsForm
                course={course}
                editingCourseId={state.editingState.editingCourseId}
                editingDetails={state.editingState.editingDetails}
                setEditingDetails={setEditingDetails}
                handleEditCourseDetails={handleEditCourseDetails}
                handleSaveCourseDetails={handleSaveCourseDetails}
                handleCancelEdit={handleCancelEdit}
                updatingCourse={state.editingState.updatingCourse}
                isDark={isDark}
                getDifficultyColor={getDifficultyColor}
                getDifficultyText={getDifficultyText}
                getWhiteTextColor={getWhiteTextColor}
                getTertiaryTextColor={getTertiaryTextColor}
              />
            </View>
          </View>
        </MemoizedPlayfulCard>
      </View>
    ),
    [
      isDark,
      preferredCourse,
      getCourseColor,
      formatTimeFromSeconds,
      ensureSafeNumber,
      getDifficultyColor,
      getDifficultyText,
      getWhiteTextColor,
      getTertiaryTextColor,
      getSecondaryTextColor,
      handleToggleSessionsExpansion,
      state.editingState,
      setEditingDetails,
      handleEditCourseDetails,
      handleSaveCourseDetails,
      handleCancelEdit,
    ],
  );

  // Error screen
  if (state.uiState.error && !state.uiState.loading) {
    return (
      <Container style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <FontAwesome
            name='exclamation-triangle'
            size={64}
            color={Colors.vibrant?.orange || Colors.warning}
            style={styles.errorIcon}
          />
          <Text style={[styles.errorTitle, { color: getTextColor(isDark) }]}>
            Bir Sorun Oluştu
          </Text>
          <Alert
            type='error'
            message={state.uiState.error}
            style={styles.errorAlert}
          />
          <Button
            title='Tekrar Dene'
            onPress={handleRefresh}
            variant='primary'
          />
        </View>
      </Container>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={state.uiState.refreshing}
            onRefresh={handleRefresh}
            tintColor={
              preferredCourse?.category
                ? getCourseColor(preferredCourse.category)
                : Colors.vibrant.blue
            }
            colors={[
              preferredCourse?.category
                ? getCourseColor(preferredCourse.category)
                : Colors.vibrant.blue,
            ]}
            title='Yenileniyor...'
            titleColor={getSecondaryTextColor(isDark)}
          />
        }
        removeClippedSubviews={true}
        showsVerticalScrollIndicator={false}
      >
        {/* DEBUG INFO - Remove this in production */}
        {/* <DebugInfo state={state} preferredCourse={preferredCourse} /> */}

        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <Text style={[styles.welcomeText, { color: getTextColor(isDark) }]}>
              Merhaba {state.appData.userData?.username || 'Öğrenci'}!
            </Text>
            <Paragraph
              color={getSecondaryTextColor(isDark)}
              style={styles.welcomeSubtext}
            >
              DUS sınavına hazırlanmaya devam edelim
            </Paragraph>
          </View>

          <View style={styles.headerStats}>
            <FloatingElement>
              <PulseElement>
                <View style={[styles.streakContainer]}>
                  <FontAwesome
                    name='fire'
                    size={16}
                    color={Colors.secondary.light}
                  />
                  <Text
                    style={[styles.streakText, { color: getTextColor(isDark) }]}
                  >
                    {state.appData.analyticsData?.studySessions || 0} gün
                  </Text>
                </View>
              </PulseElement>
            </FloatingElement>

            <Avatar
              name={
                state.appData.userData?.username?.charAt(0).toUpperCase() || 'Ö'
              }
              size='lg'
              bgColor={
                preferredCourse?.category
                  ? getCourseColor(preferredCourse.category)
                  : Colors.vibrant.blue
              }
              borderGlow
              animated
              style={styles.avatarStyle}
            />
          </View>

          {/* Chronometer */}
          {state.courseData.selectedCourse && (
            <MemoizedStudyChronometer
              selectedCourse={{
                course_id:
                  state.courseData.courses[state.courseData.activeCourseIndex]
                    ?.course_id,
                title:
                  state.courseData.courses[state.courseData.activeCourseIndex]
                    ?.title,
                description:
                  state.courseData.courses[state.courseData.activeCourseIndex]
                    ?.description,
                category:
                  state.courseData.courses[state.courseData.activeCourseIndex]
                    ?.category,
              }}
              category={preferredCourse?.category as any}
              variant='elevated'
              style={styles.chronometerContainer}
              maxWidth='100%'
              onSessionStart={(sessionId: number, courseId: number) => {
                console.log(
                  'Study session started:',
                  sessionId,
                  'for course:',
                  courseId,
                );
              }}
              onSessionEnd={(sessionData: any) => {
                console.log('Study session ended:', sessionData);
                stableFetchPerformanceData();
                stableFetchCoursesWithData();
              }}
            />
          )}
        </View>

        {state.uiState.loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size='large'
              color={
                preferredCourse?.category
                  ? getCourseColor(preferredCourse.category)
                  : Colors.vibrant.blue
              }
            />
            <Text
              style={[styles.loadingText, { color: getWhiteTextColor(isDark) }]}
            >
              Ana sayfa yükleniyor...
            </Text>
          </View>
        ) : (
          <>
            {/* Course Cards */}
            {state.courseData.courses.length > 0 ? (
              <View>
                <FlatList
                  horizontal
                  data={state.courseData.courses}
                  keyExtractor={(item) => item.course_id.toString()}
                  renderItem={renderCourseCard}
                  showsHorizontalScrollIndicator={false}
                  pagingEnabled
                  snapToInterval={screenWidth}
                  decelerationRate='fast'
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={1}
                  windowSize={3}
                  getItemLayout={(data, index) => ({
                    length: screenWidth,
                    offset: screenWidth * index,
                    index,
                  })}
                  onScroll={(event) => {
                    const slideIndex = Math.round(
                      event.nativeEvent.contentOffset.x / screenWidth,
                    );
                    if (
                      slideIndex !== state.courseData.activeCourseIndex &&
                      slideIndex >= 0 &&
                      slideIndex < state.courseData.courses.length
                    ) {
                      actions.setActiveCourseIndex(slideIndex);
                    }
                  }}
                  scrollEventThrottle={16}
                />

                {/* Navigation Indicators */}
                <View style={styles.navigationIndicators}>
                  {state.courseData.courses.map((course, index) => (
                    <View
                      key={index}
                      style={[
                        styles.indicator,
                        {
                          width:
                            index === state.courseData.activeCourseIndex
                              ? 12
                              : 8,
                          height:
                            index === state.courseData.activeCourseIndex
                              ? 12
                              : 8,
                          borderRadius:
                            index === state.courseData.activeCourseIndex
                              ? 6
                              : 4,
                          backgroundColor:
                            index === state.courseData.activeCourseIndex
                              ? preferredCourse?.category
                                ? getCourseColor(preferredCourse.category)
                                : Colors.vibrant.blue
                              : Colors.gray[500],
                          opacity:
                            index === state.courseData.activeCourseIndex
                              ? 1
                              : 0.6,
                        },
                      ]}
                    />
                  ))}
                </View>
              </View>
            ) : state.courseData.coursesLoading ? (
              <View style={styles.courseCardContainer}>
                <MemoizedPlayfulCard
                  title='Çalışmaya Devam Et'
                  style={styles.courseCard}
                  titleFontFamily='PrimaryFont'
                  variant='elevated'
                  category={preferredCourse?.category}
                >
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator
                      size='small'
                      color={
                        preferredCourse?.category
                          ? getCourseColor(preferredCourse.category)
                          : Colors.vibrant.blue
                      }
                    />
                    <Text
                      style={[styles.loadingText, { color: Colors.gray[400] }]}
                    >
                      Dersler yükleniyor...
                    </Text>
                  </View>
                </MemoizedPlayfulCard>
              </View>
            ) : (
              <View style={styles.courseCardContainer}>
                <MemoizedPlayfulCard
                  title='Çalışmaya Devam Et'
                  style={styles.courseCard}
                  titleFontFamily='PrimaryFont'
                  variant='elevated'
                  category={preferredCourse?.category}
                >
                  <EmptyState
                    icon='book'
                    title='Henüz ders yok'
                    message='Dersler sekmesinden ilk dersinizi seçin ve çalışmaya başlayın.'
                    buttonFontFamily='PrimaryFont'
                    style={styles.emptyStateContainer}
                  />
                </MemoizedPlayfulCard>
              </View>
            )}

            {/* Performance Summary */}
            {!state.uiState.performanceLoading &&
              !state.uiState.performanceError && (
                <OptimizedPerformanceSummary
                  performanceData={state.performanceData}
                  isDark={isDark}
                  preferredCourseCategory={preferredCourse?.category}
                  formatTime={formatTimeForDisplay}
                  ensureSafeNumber={ensureSafeNumber}
                  getTextColor={getTextColor}
                  getSecondaryTextColor={getSecondaryTextColor}
                  getWhiteTextColor={getWhiteTextColor}
                  getTertiaryTextColor={getTertiaryTextColor}
                />
              )}

            {state.uiState.performanceLoading && (
              <View style={{ marginTop: 16, paddingHorizontal: 16 }}>
                <MemoizedPlayfulCard
                  title='Genel Performans Özeti'
                  style={{
                    marginBottom: 24,
                    // shadowColor: Colors.gray[900],
                    // shadowOffset: { width: 4, height: 8 },
                    // shadowOpacity: 0.4,
                    // shadowRadius: 8,
                    // elevation: 8,
                  }}
                  titleFontFamily='PrimaryFont'
                  variant='elevated'
                  category={preferredCourse?.category}
                >
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator
                      size='small'
                      color={
                        preferredCourse?.category
                          ? getCourseColor(preferredCourse.category)
                          : Colors.vibrant.blue
                      }
                    />
                    <Text
                      style={[styles.loadingText, { color: Colors.gray[400] }]}
                    >
                      Performans verileri yükleniyor...
                    </Text>
                  </View>
                </MemoizedPlayfulCard>
              </View>
            )}

            {state.uiState.performanceError && (
              <View style={{ marginTop: 16, paddingHorizontal: 16 }}>
                <MemoizedPlayfulCard
                  title='Genel Performans Özeti'
                  style={{
                    marginBottom: 24,
                    // shadowColor: Colors.gray[900],
                    // shadowOffset: { width: 4, height: 8 },
                    // shadowOpacity: 0.4,
                    // shadowRadius: 8,
                    // elevation: 8,
                  }}
                  titleFontFamily='PrimaryFont'
                  variant='elevated'
                >
                  <Alert
                    type='error'
                    message={state.uiState.performanceError}
                    style={styles.errorAlert}
                  />
                </MemoizedPlayfulCard>
              </View>
            )}
          </>
        )}

        <View style={styles.spacer} />
      </ScrollView>

      {/* Course Selection Modal */}
      <CourseSelectionModal
        visible={state.uiState.showCourseModal}
        onClose={handleCourseModalClose}
        onCourseSelected={handleCourseSelected}
      />
    </>
  );
}

// Main component with context provider
export default function OptimizedHomeScreen() {
  return (
    <PreferredCourseProvider>
      <HomeScreenContent />
    </PreferredCourseProvider>
  );
}
