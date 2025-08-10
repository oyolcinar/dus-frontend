// app/(tabs)/index.tsx - OPTIMIZED WITH ZUSTAND STORE
import React, { useEffect, useCallback, useMemo, memo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
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

// 🚀 USING YOUR ZUSTAND STORE (replaces context imports)
import {
  useAuth,
  usePreferredCourse,
  useTheme,
  useNotifications,
  useAppStore,
} from '../../stores/appStore';

import { checkAndRefreshSession } from '../../src/api/authService';
import {
  CourseWithProgress,
  EditingCourseDetails,
} from '../../src/types/models';
import { Colors, Spacing } from '../../constants/theme';
import { studyService } from '../../src/api';

// 🚀 NEW: Import the optimized data hook
import { useAppData, useUserData } from '../../src/hooks/useAppData';

// 🚀 NEW: Import optimized components
import {
  OptimizedCourseAnalytics,
  OptimizedStudySessionCard,
  OptimizedCourseDetailsForm,
  OptimizedPerformanceSummary,
} from '../../components/OptimizedHomeComponents';

// Get screen dimensions once
const { width: screenWidth } = Dimensions.get('window');

// 🚀 OPTIMIZED: Moved styles outside component (prevents recreation)
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
  },
  streakText: {
    marginLeft: Spacing[2],
    fontSize: 14,
    fontFamily: 'SecondaryFont-Bold',
  },
  chronometerContainer: {
    width: '100%',
    alignSelf: 'stretch',
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
    paddingTop: Spacing[6],
    paddingBottom: Spacing[12],
  },
  courseCard: {
    width: '100%',
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
});

// 🚀 OPTIMIZED: Moved utility functions outside component (prevents recreation)
const getTextColor = (isDark: boolean): string =>
  isDark ? Colors.gray[900] : Colors.gray[900];
const getSecondaryTextColor = (isDark: boolean): string =>
  isDark ? Colors.gray[700] : Colors.gray[700];
const getWhiteTextColor = (isDark: boolean): string =>
  isDark ? Colors.white : Colors.white;
const getTertiaryTextColor = (isDark: boolean): string =>
  isDark ? Colors.gray[300] : Colors.gray[300];

// 🚀 OPTIMIZED: Helper functions moved outside
const formatTimeFromSeconds = (seconds: number): string => {
  if (!seconds || seconds === 0) return '0dk';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}s ${minutes}dk`;
  }
  return `${minutes}dk`;
};

const formatTimeForDisplay = (seconds: number): string => {
  return formatTimeFromSeconds(seconds);
};

const ensureSafeNumber = (value: any, fallback: number = 0): number => {
  const num = Number(value);
  return isNaN(num) ? fallback : num;
};

const getDifficultyColor = (rating: number): string => {
  if (rating >= 4) return Colors.vibrant.pink;
  if (rating >= 3) return Colors.vibrant.orange;
  if (rating >= 2) return Colors.vibrant.yellow;
  return Colors.vibrant.green;
};

const getDifficultyText = (rating: number): string => {
  if (rating >= 4) return 'Çok Zor';
  if (rating >= 3) return 'Zor';
  if (rating >= 2) return 'Orta';
  return 'Kolay';
};

const getIconForCourse = (title: string): string => {
  const titleLower = title.toLowerCase();
  if (titleLower.includes('anatomi')) return 'user';
  if (titleLower.includes('patoloji')) return 'stethoscope';
  if (titleLower.includes('cerrahi')) return 'cut';
  if (titleLower.includes('protez') || titleLower.includes('protetik'))
    return 'tooth';
  if (titleLower.includes('periodon')) return 'heart';
  if (titleLower.includes('pedodonti')) return 'child';
  if (titleLower.includes('endodonti')) return 'flask';
  if (titleLower.includes('ortodonti')) return 'adjust';
  if (titleLower.includes('radyoloji')) return 'camera';
  if (titleLower.includes('restoratif')) return 'wrench';
  return 'book';
};

// 🚀 OPTIMIZED: Memoized components
const MemoizedPlayfulCard = memo(PlayfulCard);
const MemoizedStudyChronometer = memo(StudyChronometer);

// 🚀 HEAVILY SIMPLIFIED: Main Home Screen Component
function HomeScreenContent() {
  const router = useRouter();

  // 🚀 USING YOUR ZUSTAND STORE (replaces multiple context imports)
  const { user, refreshSession } = useAuth();
  const {
    preferredCourse,
    availableCourses,
    isLoading: courseLoading,
    refreshCourses,
    getCourseColor,
    getCourseCategory,
  } = usePreferredCourse();
  const { isDark } = useTheme();
  const { unreadCount } = useNotifications();

  // 🚀 ACCESS STORE DIRECTLY for modal state
  const showCourseModal = useAppStore((state) => state.showCourseModal);
  const setShowCourseModal = useAppStore((state) => state.setShowCourseModal);

  // 🚀 NEW: Use the optimized data hook instead of multiple useEffect
  const {
    courses,
    coursesLoading,
    coursesError,
    refetchCourses,
    dashboardAnalytics,
    analyticsSummary,
    studyStatistics,
    analyticsLoading,
    performanceAnalytics,
    comprehensiveAnalytics,
    performanceLoading,
    performanceError,
    recentSessions,
    isLoading,
    hasError,
    refetchAll,
  } = useAppData();

  // 🚀 NEW: Add userData hook for user profile data
  const { data: userData } = useUserData();

  // 🚀 SIMPLIFIED: Local state for UI only
  const [selectedCourse, setSelectedCourse] =
    useState<CourseWithProgress | null>(null);
  const [activeCourseIndex, setActiveCourseIndex] = useState(0);
  const [expandedSessions, setExpandedSessions] = useState<Set<number>>(
    new Set(),
  );

  // Course editing state
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [editingDetails, setEditingDetails] = useState<EditingCourseDetails>(
    {},
  );
  const [updatingCourse, setUpdatingCourse] = useState<number | null>(null);

  // 🚀 OPTIMIZED: Auto-select course logic (much simpler)
  useEffect(() => {
    if (courses.length > 0 && !selectedCourse) {
      const courseToSelect = preferredCourse
        ? courses.find((c) => c.course_id === preferredCourse.course_id) ||
          courses[0]
        : courses[0];

      setSelectedCourse(courseToSelect);
      console.log('✅ Auto-selected course:', courseToSelect?.title);
    }
  }, [courses, selectedCourse, preferredCourse]);

  // 🚀 SIMPLIFIED: Course modal logic (uses store state)
  useEffect(() => {
    if (
      !courseLoading &&
      !preferredCourse &&
      courses.length > 0 &&
      !showCourseModal
    ) {
      setShowCourseModal(true);
      console.log('🎯 Showing course selection modal');
    }
  }, [
    courseLoading,
    preferredCourse,
    courses.length,
    showCourseModal,
    setShowCourseModal,
  ]);

  // 🚀 OPTIMIZED: Refresh handler (much simpler)
  const handleRefresh = useCallback(async () => {
    try {
      const sessionValid = await checkAndRefreshSession();
      if (!sessionValid) {
        router.replace('/(auth)/login');
        return;
      }

      // 🚀 REFRESH BOTH STORE DATA AND APP DATA
      await Promise.allSettled([refreshCourses(), refetchAll()]);

      console.log('✅ Refresh complete');
    } catch (error) {
      console.error('❌ Refresh failed:', error);
      RNAlert.alert('Hata', 'Yenileme başarısız oldu.');
    }
  }, [router, refreshCourses, refetchAll]);

  // 🚀 OPTIMIZED: Course editing handlers
  const handleEditCourseDetails = useCallback((course: CourseWithProgress) => {
    setEditingCourseId(course.course_id);
    setEditingDetails({
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
  }, []);

  const handleSaveCourseDetails = useCallback(async () => {
    if (!editingCourseId || !editingDetails.courseId) return;

    try {
      setUpdatingCourse(editingCourseId);

      await studyService.updateUserCourseProgress({
        courseId: editingDetails.courseId,
        tekrarSayisi: editingDetails.tekrarSayisi,
        konuKaynaklari: editingDetails.konuKaynaklari,
        soruBankasiKaynaklari: editingDetails.soruBankasiKaynaklari,
        difficultyRating: editingDetails.difficulty_rating,
        notes: editingDetails.notes || undefined,
        isCompleted: editingDetails.is_completed,
        completionPercentage: editingDetails.completionPercentage,
      });

      await refetchCourses();
      setEditingCourseId(null);
      setEditingDetails({});
      RNAlert.alert('Başarılı', 'Ders detayları güncellendi!');
    } catch (error) {
      console.error('Error updating course details:', error);
      RNAlert.alert('Hata', 'Ders detayları güncellenirken bir hata oluştu.');
    } finally {
      setUpdatingCourse(null);
    }
  }, [editingCourseId, editingDetails, refetchCourses]);

  const handleCancelEdit = useCallback(() => {
    setEditingCourseId(null);
    setEditingDetails({});
  }, []);

  const handleToggleSessionsExpansion = useCallback((courseId: number) => {
    setExpandedSessions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
      } else {
        newSet.add(courseId);
      }
      return newSet;
    });
  }, []);

  // 🚀 OPTIMIZED: Modal handlers (uses store methods)
  const handleCourseModalClose = useCallback(() => {
    setShowCourseModal(false);
  }, [setShowCourseModal]);

  const handleCourseSelected = useCallback(() => {
    setShowCourseModal(false);
  }, [setShowCourseModal]);

  // 🚀 OPTIMIZED: Course card renderer with all functionality
  const renderCourseCard: ListRenderItem<CourseWithProgress> = useCallback(
    ({ item: course }) => {
      const isExpanded = expandedSessions.has(course.course_id);

      return (
        <View style={styles.courseCardContainer}>
          <MemoizedPlayfulCard
            title='Çalışmaya Devam Et'
            style={styles.courseCard}
            titleFontFamily='PrimaryFont'
            variant='elevated'
            category={getCourseCategory(preferredCourse?.title || '')}
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
                      backgroundColor: getCourseColor(
                        getCourseCategory(course.title),
                      ),
                    },
                  ]}
                >
                  <FontAwesome
                    name={getIconForCourse(course.title) as any}
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

                {course.studySessions?.find(
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
                    category={getCourseCategory(course.title)}
                    formatTime={formatTimeFromSeconds}
                    getSecondaryTextColor={getSecondaryTextColor}
                    getTertiaryTextColor={getTertiaryTextColor}
                  />
                ) : (
                  <MemoizedPlayfulCard
                    title='Yeni Çalışma Seansı Başlat'
                    variant='outlined'
                    category={getCourseCategory(preferredCourse?.title || '')}
                    style={[
                      { marginBottom: 12 },
                      { backgroundColor: Colors.gray[100] },
                    ]}
                  >
                    <View style={styles.emptySessionContainer}>
                      <FontAwesome
                        name='play-circle'
                        size={48}
                        color={getCourseColor(getCourseCategory(course.title))}
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

              {/* Recent Sessions */}
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
                  data={
                    course.studySessions
                      ?.filter((s) => s.session_status === 'completed')
                      ?.slice(0, 3) || []
                  }
                  keyExtractor={(item) => item.session_id.toString()}
                  renderItem={({ item }) => (
                    <OptimizedStudySessionCard
                      session={item}
                      isCurrentSession={false}
                      isDark={isDark}
                      category={getCourseCategory(course.title)}
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
              {(course.studySessions?.length || 0) > 3 && (
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
                      {isExpanded
                        ? 'Tüm Seansları Gizle'
                        : `Tüm Seansları Göster (${(course.studySessions?.length || 0) - 3} tane daha)`}
                    </Text>
                  </TouchableOpacity>

                  {isExpanded && (
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
                        data={
                          course.studySessions
                            ?.filter((s) => s.session_status === 'completed')
                            ?.slice(3) || []
                        }
                        keyExtractor={(item) => item.session_id.toString()}
                        renderItem={({ item }) => (
                          <OptimizedStudySessionCard
                            session={item}
                            isCurrentSession={false}
                            isDark={isDark}
                            category={getCourseCategory(course.title)}
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
                  editingCourseId={editingCourseId}
                  editingDetails={editingDetails}
                  setEditingDetails={setEditingDetails}
                  handleEditCourseDetails={handleEditCourseDetails}
                  handleSaveCourseDetails={handleSaveCourseDetails}
                  handleCancelEdit={handleCancelEdit}
                  updatingCourse={updatingCourse}
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
      );
    },
    [
      expandedSessions,
      isDark,
      preferredCourse,
      getCourseColor,
      getCourseCategory,
      editingCourseId,
      editingDetails,
      updatingCourse,
      handleToggleSessionsExpansion,
      handleEditCourseDetails,
      handleSaveCourseDetails,
      handleCancelEdit,
      getWhiteTextColor,
      getTertiaryTextColor,
      getSecondaryTextColor,
    ],
  );

  // 🚀 SIMPLIFIED: Error screen
  if (hasError && !isLoading) {
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
            message={
              coursesError?.message || 'Veriler yüklenirken bir hata oluştu.'
            }
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
            refreshing={isLoading || courseLoading}
            onRefresh={handleRefresh}
            tintColor={getCourseColor(
              getCourseCategory(preferredCourse?.title || ''),
            )}
            colors={[
              getCourseColor(getCourseCategory(preferredCourse?.title || '')),
            ]}
            title='Yenileniyor...'
            titleColor={getSecondaryTextColor(isDark)}
          />
        }
        removeClippedSubviews={true}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <Text style={[styles.welcomeText, { color: getTextColor(isDark) }]}>
              Merhaba {user?.username || userData?.username || 'Öğrenci'}!
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
                <View style={styles.streakContainer}>
                  <FontAwesome
                    name='fire'
                    size={16}
                    color={Colors.secondary.light}
                  />
                  <Text
                    style={[styles.streakText, { color: getTextColor(isDark) }]}
                  >
                    {dashboardAnalytics?.current_streak_days || 0} gün
                  </Text>
                </View>
              </PulseElement>
            </FloatingElement>

            <Avatar
              name={(user?.username || userData?.username || 'Öğrenci')
                .charAt(0)
                .toUpperCase()}
              size='lg'
              bgColor={getCourseColor(
                getCourseCategory(preferredCourse?.title || ''),
              )}
              borderGlow
              animated
            />
          </View>

          {/* Chronometer */}
          {selectedCourse && (
            <MemoizedStudyChronometer
              selectedCourse={{
                course_id: selectedCourse.course_id,
                title: selectedCourse.title,
                description: selectedCourse.description,
                category: getCourseCategory(selectedCourse.title),
              }}
              category={getCourseCategory(preferredCourse?.title || '')}
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
                refetchAll();
              }}
            />
          )}
        </View>

        {/* Main Content */}
        {isLoading || courseLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size='large'
              color={getCourseColor(
                getCourseCategory(preferredCourse?.title || ''),
              )}
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
            {courses.length > 0 ? (
              <View>
                <FlatList
                  horizontal
                  data={courses}
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
                      slideIndex !== activeCourseIndex &&
                      slideIndex >= 0 &&
                      slideIndex < courses.length
                    ) {
                      setActiveCourseIndex(slideIndex);
                      setSelectedCourse(courses[slideIndex]);
                    }
                  }}
                  scrollEventThrottle={16}
                />

                {/* Navigation Indicators */}
                <View style={styles.navigationIndicators}>
                  {courses.map((course, index) => (
                    <View
                      key={index}
                      style={[
                        styles.indicator,
                        {
                          width: index === activeCourseIndex ? 12 : 8,
                          height: index === activeCourseIndex ? 12 : 8,
                          borderRadius: index === activeCourseIndex ? 6 : 4,
                          backgroundColor:
                            index === activeCourseIndex
                              ? getCourseColor(getCourseCategory(course.title))
                              : Colors.gray[500],
                          opacity: index === activeCourseIndex ? 1 : 0.6,
                        },
                      ]}
                    />
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.courseCardContainer}>
                <MemoizedPlayfulCard
                  title='Çalışmaya Devam Et'
                  style={styles.courseCard}
                  titleFontFamily='PrimaryFont'
                  variant='elevated'
                  category={getCourseCategory(preferredCourse?.title || '')}
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
            {!performanceLoading &&
              !performanceError &&
              comprehensiveAnalytics && (
                <OptimizedPerformanceSummary
                  performanceData={{
                    longestStreaks: comprehensiveAnalytics.longestStreaks || [],
                    streaksSummary: {
                      longest_single_session_minutes: Math.max(
                        ...(comprehensiveAnalytics.longestStreaks?.map(
                          (s) => s.longest_streak_minutes,
                        ) || [0]),
                      ),
                      longest_single_session_course:
                        comprehensiveAnalytics.longestStreaks?.[0]
                          ?.course_title || null,
                      current_streak_days:
                        dashboardAnalytics?.current_streak_days || 0,
                      longest_streak_days:
                        dashboardAnalytics?.longest_streak_days || 0,
                    },
                    dailyProgress: comprehensiveAnalytics.dailyProgress || [],
                    weeklyProgress: comprehensiveAnalytics.weeklyProgress || [],
                    topCourses: comprehensiveAnalytics.topCourses || [],
                  }}
                  isDark={isDark}
                  preferredCourseCategory={getCourseCategory(
                    preferredCourse?.title || '',
                  )}
                  formatTime={formatTimeForDisplay}
                  ensureSafeNumber={ensureSafeNumber}
                  getTextColor={getTextColor}
                  getSecondaryTextColor={getSecondaryTextColor}
                  getWhiteTextColor={getWhiteTextColor}
                  getTertiaryTextColor={getTertiaryTextColor}
                />
              )}
          </>
        )}

        <View style={styles.spacer} />
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

// 🚀 SIMPLIFIED: Main component WITHOUT context provider wrapper!
export default function OptimizedHomeScreen() {
  // 🎉 NO MORE PreferredCourseProvider WRAPPER!
  // Your Zustand store handles everything now!
  return <HomeScreenContent />;
}
