import React, { useState, useEffect, useCallback } from 'react';
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
  SlideInElement,
  Button,
  Input,
  Checkbox,
  Row,
} from '../../components/ui';
import { courseService, analyticsService, studyService } from '../../src/api';
import {
  getUserLongestStreaks,
  getUserDailyProgress,
  getUserWeeklyProgress,
  getUserTopCourses,
  getUserStreaksSummary,
} from '../../src/api/analyticsService';
import { checkAndRefreshSession } from '../../src/api/authService';
import { useAuth } from '../../context/AuthContext';
import {
  usePreferredCourse,
  PreferredCourseProvider,
  CourseCategory,
} from '../../context/PreferredCourseContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Course,
  StudyStatistics,
  LongestStreak,
  DailyProgress,
  WeeklyProgress,
  TopCourse,
  StreaksSummary,
} from '../../src/types/models';
import { Colors, Spacing } from '../../constants/theme';

// Get screen dimensions for swipe functionality
const { width: screenWidth } = Dimensions.get('window');

// Use the theme constants correctly
const VIBRANT_COLORS = Colors.vibrant;

// Define our local interfaces for course study data
interface CourseStudySession {
  sessionId: number;
  startTime: string;
  endTime?: string | null;
  studyDurationSeconds?: number;
  breakDurationSeconds?: number;
  totalDurationSeconds?: number;
  studyDurationMinutes?: number;
  breakDurationMinutes?: number;
  sessionDate: string;
  sessionStatus: 'active' | 'completed' | 'paused';
  notes?: string | null;
}

interface CourseProgressInfo {
  courseId: number;
  userId: number;
  tekrarSayisi?: number;
  konuKaynaklari?: string[] | null;
  soruBankasiKaynaklari?: string[] | null;
  totalStudyTimeSeconds?: number;
  totalBreakTimeSeconds?: number;
  totalSessionCount?: number;
  totalStudyTimeMinutes?: number;
  totalStudyTimeHours?: number;
  lastStudiedAt?: string | null;
  difficultyRating?: number | null;
  completionPercentage?: number;
  isCompleted?: boolean;
  notes?: string | null;
}

// Define interface to extend Course with additional fields we need
interface CourseWithProgress extends Course {
  progress: CourseProgressInfo | null;
  iconName: string;
  studySessions: CourseStudySession[];
  isSessionsExpanded: boolean;
  category?: CourseCategory;
}

// Define interface for Analytics data
interface AnalyticsData {
  coursePerformance?: Array<{
    courseId: number;
    courseName: string;
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

// Define interface for editing course details
interface EditingCourseDetails {
  courseId?: number;
  tekrarSayisi?: number;
  konuKaynaklari?: string[];
  soruBankasiKaynaklari?: string[];
  difficulty_rating?: number;
  notes?: string;
  is_completed?: boolean;
  completionPercentage?: number;
}

// Utility function to ensure safe numeric values
const ensureSafeNumber = (
  value: number | undefined,
  fallback: number = 0,
): number => {
  if (value === undefined || isNaN(value) || !isFinite(value)) {
    return fallback;
  }
  return Math.round(value);
};

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
    getCourseCategory,
  } = usePreferredCourse();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState<{ username?: string } | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [showCourseModal, setShowCourseModal] = useState(false);

  // Course-based states
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [selectedCourse, setSelectedCourse] =
    useState<CourseWithProgress | null>(null);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [editingDetails, setEditingDetails] = useState<EditingCourseDetails>(
    {},
  );
  const [updatingCourse, setUpdatingCourse] = useState<number | null>(null);

  // Enhanced functionality states
  const [isStudyCardCollapsed, setIsStudyCardCollapsed] = useState(false);
  const [studyStatistics, setStudyStatistics] =
    useState<StudyStatistics | null>(null);

  // Performance data states
  const [performanceData, setPerformanceData] = useState<{
    longestStreaks: LongestStreak[];
    streaksSummary: StreaksSummary | null;
    dailyProgress: DailyProgress[];
    weeklyProgress: WeeklyProgress[];
    topCourses: TopCourse[];
  }>({
    longestStreaks: [],
    streaksSummary: null,
    dailyProgress: [],
    weeklyProgress: [],
    topCourses: [],
  });
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [performanceError, setPerformanceError] = useState<string | null>(null);

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

  // Set selected course when preferred course changes
  useEffect(() => {
    if (preferredCourse && courses.length > 0) {
      const preferredCourseWithProgress = courses.find(
        (c) => c.course_id === preferredCourse.course_id,
      );
      if (preferredCourseWithProgress) {
        setSelectedCourse(preferredCourseWithProgress);
      }
    }
  }, [preferredCourse, courses]);

  // Fetch performance data function
  const fetchPerformanceData = useCallback(async () => {
    try {
      setPerformanceLoading(true);
      setPerformanceError(null);

      const [
        streaksResponse,
        streaksSummaryResponse,
        dailyProgressResponse,
        weeklyProgressResponse,
        topCoursesResponse,
      ] = await Promise.allSettled([
        getUserLongestStreaks(),
        getUserStreaksSummary(),
        getUserDailyProgress(undefined, undefined, 7),
        getUserWeeklyProgress(4),
        getUserTopCourses(3),
      ]);

      setPerformanceData({
        longestStreaks:
          streaksResponse.status === 'fulfilled'
            ? streaksResponse.value.streaks
            : [],
        streaksSummary:
          streaksSummaryResponse.status === 'fulfilled'
            ? streaksSummaryResponse.value
            : null,
        dailyProgress:
          dailyProgressResponse.status === 'fulfilled'
            ? dailyProgressResponse.value.dailyProgress
            : [],
        weeklyProgress:
          weeklyProgressResponse.status === 'fulfilled'
            ? weeklyProgressResponse.value
            : [],
        topCourses:
          topCoursesResponse.status === 'fulfilled'
            ? topCoursesResponse.value
            : [],
      });
    } catch (error) {
      console.error('Error fetching performance data:', error);
      setPerformanceError('Performans verileri yüklenirken bir hata oluştu.');
    } finally {
      setPerformanceLoading(false);
    }
  }, []);

  // Fetch courses with their progress and study sessions
  const fetchCoursesWithData = useCallback(async () => {
    try {
      setCoursesLoading(true);

      // Get all courses
      const allCourses = await courseService.getAllCourses();

      // Fetch progress and sessions for each course
      const coursesWithData: CourseWithProgress[] = await Promise.all(
        allCourses.slice(0, 6).map(async (course) => {
          try {
            const [progressResult, sessionsResult] = await Promise.allSettled([
              courseService.getCourseProgress(course.course_id),
              studyService.getUserStudySessions(1, 10, course.course_id),
            ]);

            // Map the progress data to our local interface
            let mappedProgress: CourseProgressInfo | null = null;
            if (progressResult.status === 'fulfilled' && progressResult.value) {
              const p = progressResult.value;
              mappedProgress = {
                courseId: course.course_id,
                userId: p.userId || 0,
                tekrarSayisi: p.tekrarSayisi || 0,
                konuKaynaklari: p.konuKaynaklari || null,
                soruBankasiKaynaklari: p.soruBankasiKaynaklari || null,
                totalStudyTimeSeconds: p.studyTimeSeconds || 0,
                totalBreakTimeSeconds: p.breakTimeSeconds || 0,
                totalSessionCount: p.sessionCount || 0,
                totalStudyTimeMinutes: Math.floor(
                  (p.studyTimeSeconds || 0) / 60,
                ),
                totalStudyTimeHours: Math.floor(
                  (p.studyTimeSeconds || 0) / 3600,
                ),
                lastStudiedAt: p.lastStudiedAt || null,
                difficultyRating: p.difficultyRating || null,
                completionPercentage: p.completionPercentage || 0,
                isCompleted: p.isCompleted || false,
                notes: p.notes || null,
              };
            }

            // Map the sessions data to our local interface
            const mappedSessions: CourseStudySession[] =
              sessionsResult.status === 'fulfilled' && sessionsResult.value
                ? sessionsResult.value.sessions.map((session) => ({
                    sessionId: session.sessionId,
                    startTime: session.startTime,
                    endTime: session.endTime || null,
                    studyDurationSeconds: session.studyDurationSeconds || 0,
                    breakDurationSeconds: session.breakDurationSeconds || 0,
                    totalDurationSeconds: session.totalDurationSeconds || 0,
                    studyDurationMinutes: Math.floor(
                      (session.studyDurationSeconds || 0) / 60,
                    ),
                    breakDurationMinutes: Math.floor(
                      (session.breakDurationSeconds || 0) / 60,
                    ),
                    sessionDate: session.sessionDate,
                    sessionStatus: session.sessionStatus,
                    notes: session.notes || null,
                  }))
                : [];

            return {
              ...course,
              progress: mappedProgress,
              iconName: getIconForCourse(course.title),
              studySessions: mappedSessions,
              isSessionsExpanded: false,
              category: getCourseCategory(course.title),
            };
          } catch (error) {
            console.error(
              `Error fetching data for course ${course.course_id}:`,
              error,
            );
            return {
              ...course,
              progress: null,
              iconName: getIconForCourse(course.title),
              studySessions: [],
              isSessionsExpanded: false,
              category: getCourseCategory(course.title),
            };
          }
        }),
      );

      // Sort by study time or progress
      coursesWithData.sort((a, b) => {
        const aStudyTime = a.progress?.totalStudyTimeSeconds || 0;
        const bStudyTime = b.progress?.totalStudyTimeSeconds || 0;
        return bStudyTime - aStudyTime;
      });

      setCourses(coursesWithData);

      // Set initial selected course
      if (coursesWithData.length > 0 && !selectedCourse) {
        const preferred = preferredCourse
          ? coursesWithData.find(
              (c) => c.course_id === preferredCourse.course_id,
            )
          : coursesWithData[0];
        setSelectedCourse(preferred || coursesWithData[0]);
      }
    } catch (error) {
      console.error('Error fetching courses with data:', error);
    } finally {
      setCoursesLoading(false);
    }
  }, [preferredCourse, selectedCourse, getCourseCategory]);

  // Fetch general analytics and statistics
  const fetchAnalyticsData = useCallback(async () => {
    try {
      const [analyticsResult, statsResult] = await Promise.allSettled([
        analyticsService.getUserPerformanceAnalytics(),
        studyService.getUserStudyStatistics(),
      ]);

      if (analyticsResult.status === 'fulfilled') {
        setAnalyticsData(analyticsResult.value);
      }

      if (statsResult.status === 'fulfilled') {
        setStudyStatistics(statsResult.value);
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    }
  }, []);

  // Main data fetching effect
  useEffect(() => {
    if (!isStudyCardCollapsed) {
      fetchCoursesWithData();
      fetchAnalyticsData();
      fetchPerformanceData();
    }
  }, [
    isStudyCardCollapsed,
    fetchCoursesWithData,
    fetchAnalyticsData,
    fetchPerformanceData,
  ]);

  // Handle course selection from swipe
  const handleCourseSelect = useCallback((course: CourseWithProgress) => {
    setSelectedCourse(course);
  }, []);

  // Handle toggle sessions expansion
  const handleToggleSessionsExpansion = useCallback((courseId: number) => {
    setCourses((prev) =>
      prev.map((course) =>
        course.course_id === courseId
          ? { ...course, isSessionsExpanded: !course.isSessionsExpanded }
          : course,
      ),
    );
  }, []);

  // Handle edit course details
  const handleEditCourseDetails = useCallback((course: CourseWithProgress) => {
    setEditingCourseId(course.course_id);
    setEditingDetails({
      courseId: course.course_id,
      tekrarSayisi: course.progress?.tekrarSayisi || 0,
      konuKaynaklari: course.progress?.konuKaynaklari
        ? [...course.progress.konuKaynaklari]
        : [],
      soruBankasiKaynaklari: course.progress?.soruBankasiKaynaklari
        ? [...course.progress.soruBankasiKaynaklari]
        : [],
      difficulty_rating: course.progress?.difficultyRating || 1,
      notes: course.progress?.notes || '',
      is_completed: course.progress?.isCompleted || false,
      completionPercentage: course.progress?.completionPercentage || 0,
    });
  }, []);

  // Handle save course details
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

      // Refresh course data
      await fetchCoursesWithData();

      setEditingCourseId(null);
      setEditingDetails({});

      RNAlert.alert('Başarılı', 'Kurs detayları güncellendi!');
    } catch (error) {
      console.error('Error updating course details:', error);
      RNAlert.alert('Hata', 'Kurs detayları güncellenirken bir hata oluştu.');
    } finally {
      setUpdatingCourse(null);
    }
  }, [editingCourseId, editingDetails, fetchCoursesWithData]);

  // Handle cancel edit
  const handleCancelEdit = useCallback(() => {
    setEditingCourseId(null);
    setEditingDetails({});
  }, []);

  // Helper functions
  const formatTimeForDisplay = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)}dk`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return remainingMinutes > 0
      ? `${hours}sa ${remainingMinutes}dk`
      : `${hours}sa`;
  };

  const formatTimeFromSeconds = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    return formatTimeForDisplay(minutes);
  };

  const getProgressChartData = (dailyData: DailyProgress[]) => {
    const maxValue = Math.max(
      ...dailyData.map((d) => d.daily_study_minutes),
      1,
    );
    return dailyData.map((day) => ({
      ...day,
      percentage: ensureSafeNumber((day.daily_study_minutes / maxValue) * 100),
      date: new Date(day.study_date).toLocaleDateString('tr-TR', {
        weekday: 'short',
        day: 'numeric',
      }),
    }));
  };

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

  const getDifficultyColor = (rating: number) => {
    switch (rating) {
      case 1:
        return Colors.vibrant.greenLight;
      case 2:
        return Colors.vibrant.green;
      case 3:
        return Colors.vibrant.yellowLight;
      case 4:
        return Colors.vibrant.yellow;
      case 5:
        return Colors.vibrant.pink;
      default:
        return Colors.gray[400];
    }
  };

  const getDifficultyText = (rating: number) => {
    switch (rating) {
      case 1:
        return 'Çok Kolay';
      case 2:
        return 'Kolay';
      case 3:
        return 'Orta';
      case 4:
        return 'Zor';
      case 5:
        return 'Çok Zor';
      default:
        return 'Belirlenmemiş';
    }
  };

  // Render course analytics
  const renderCourseAnalytics = (course: CourseWithProgress) => {
    if (!course.progress) return null;

    return (
      <View style={{ marginBottom: Spacing[3] }}>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: Spacing[2],
            marginBottom: Spacing[3],
          }}
        >
          {/* Study Time */}
          <View
            style={{
              backgroundColor: Colors.vibrant.blue,
              paddingHorizontal: Spacing[3],
              paddingVertical: Spacing[2],
              borderRadius: 12,
              shadowColor: Colors.gray[900],
              shadowOffset: { width: 10, height: 20 },
              shadowOpacity: 0.8,
              shadowRadius: 10,
              elevation: 10,
            }}
          >
            <Text
              style={{
                color: Colors.white,
                fontSize: 12,
                fontFamily: 'SecondaryFont-Bold',
              }}
            >
              📚{' '}
              {formatTimeFromSeconds(
                course.progress.totalStudyTimeSeconds || 0,
              )}
            </Text>
          </View>

          {/* Session Count */}
          <View
            style={{
              backgroundColor: Colors.vibrant.green,
              paddingHorizontal: Spacing[3],
              paddingVertical: Spacing[2],
              borderRadius: 12,
              shadowColor: Colors.gray[900],
              shadowOffset: { width: 10, height: 20 },
              shadowOpacity: 0.8,
              shadowRadius: 10,
              elevation: 10,
            }}
          >
            <Text
              style={{
                color: Colors.white,
                fontSize: 12,
                fontFamily: 'SecondaryFont-Bold',
              }}
            >
              🔁 {course.progress.tekrarSayisi} tekrar
            </Text>
          </View>

          {/* Difficulty */}
          <View
            style={{
              backgroundColor: getDifficultyColor(
                course.progress.difficultyRating || 1,
              ),
              paddingHorizontal: Spacing[3],
              paddingVertical: Spacing[2],
              borderRadius: 12,
              shadowColor: Colors.gray[900],
              shadowOffset: { width: 10, height: 20 },
              shadowOpacity: 0.8,
              shadowRadius: 10,
              elevation: 10,
            }}
          >
            <Text
              style={{
                color: Colors.white,
                fontSize: 12,
                fontFamily: 'SecondaryFont-Bold',
              }}
            >
              {getDifficultyText(course.progress.difficultyRating || 1)}
            </Text>
          </View>

          {/* Completion Status */}
          {course.progress.isCompleted && (
            <View
              style={{
                backgroundColor: Colors.vibrant.green,
                paddingHorizontal: Spacing[3],
                paddingVertical: Spacing[2],
                borderRadius: 12,
              }}
            >
              <Text
                style={{
                  color: Colors.white,
                  fontSize: 12,
                  fontFamily: 'SecondaryFont-Bold',
                }}
              >
                ✅ Tamamlandı
              </Text>
            </View>
          )}
        </View>

        {/* Completion Progress */}
        <View style={{ marginBottom: Spacing[3] }}>
          <Text
            style={{
              fontSize: 12,
              color: isDark ? Colors.gray[700] : Colors.gray[700],
              fontFamily: 'SecondaryFont-Regular',
              marginBottom: Spacing[2],
            }}
          >
            İlerleme: %{ensureSafeNumber(course.progress.completionPercentage)}
          </Text>
          <ProgressBar
            progress={ensureSafeNumber(
              course.progress.completionPercentage || 0,
            )}
            height={8}
            width='100%'
            trackColor={Colors.gray[300]}
            progressColor={Colors.vibrant.green}
            animated
          />
        </View>

        {/* Last Studied */}
        {course.progress.lastStudiedAt && (
          <Text
            style={{
              fontSize: 12,
              color: isDark ? Colors.gray[700] : Colors.gray[700],
              fontFamily: 'SecondaryFont-Regular',
            }}
          >
            Son çalışma:{' '}
            {new Date(course.progress.lastStudiedAt).toLocaleDateString(
              'tr-TR',
            )}
          </Text>
        )}
      </View>
    );
  };

  // Render course details editing form
  const renderCourseDetailsForm = (course: CourseWithProgress) => {
    const isEditing = editingCourseId === course.course_id;
    const isUpdating = updatingCourse === course.course_id;

    if (!isEditing && !course.progress) {
      return (
        <View style={{ padding: Spacing[4], alignItems: 'center' }}>
          <Text
            style={{
              color: isDark ? Colors.gray[600] : Colors.gray[600],
              fontFamily: 'SecondaryFont-Regular',
              textAlign: 'center',
            }}
          >
            Bu kurs için henüz detay bilgisi yok.
          </Text>
        </View>
      );
    }

    return (
      <View>
        {!isEditing ? (
          // View mode
          <View>
            <View style={{ marginBottom: Spacing[4] }}>
              <Text
                style={{
                  marginBottom: Spacing[2],
                  color: isDark ? Colors.white : Colors.white,
                  fontFamily: 'SecondaryFont-Bold',
                }}
              >
                Kurs Detayları:
              </Text>
              <View
                style={{
                  borderBottomColor: Colors.white,
                  borderBottomWidth: 1,
                  marginBottom: Spacing[2],
                  width: '100%',
                }}
              />
              <View
                style={{
                  flexDirection: 'column',
                  flexWrap: 'wrap',
                  gap: Spacing[2],
                }}
              >
                <Text
                  style={{
                    color: isDark ? Colors.white : Colors.white,
                    fontFamily: 'SecondaryFont-Regular',
                  }}
                >
                  Tekrar Sayısı: {course.progress?.tekrarSayisi || 0}
                </Text>
                <View
                  style={{
                    borderBottomColor: Colors.white,
                    borderBottomWidth: 1,
                    marginBottom: Spacing[2],
                    width: '100%',
                  }}
                />

                <Text
                  style={{
                    color: Colors.white,
                    fontFamily: 'SecondaryFont-Regular',
                  }}
                >
                  Zorluk:{' '}
                  {getDifficultyText(course.progress?.difficultyRating || 1)}
                </Text>

                <View
                  style={{
                    borderBottomColor: Colors.white,
                    borderBottomWidth: 1,
                    marginBottom: Spacing[2],
                    width: '100%',
                  }}
                />

                {course.progress?.isCompleted && (
                  <View
                    style={{
                      backgroundColor: Colors.vibrant.green,
                      paddingHorizontal: Spacing[2],
                      paddingVertical: Spacing[1],
                      borderRadius: 12,
                    }}
                  >
                    <Text
                      style={{
                        color: Colors.white,
                        fontSize: 12,
                        fontFamily: 'SecondaryFont-Bold',
                      }}
                    >
                      Tamamlandı
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Render Konu Kaynakları */}
            {course.progress?.konuKaynaklari &&
              course.progress.konuKaynaklari.length > 0 && (
                <View style={{ marginBottom: Spacing[4] }}>
                  <Text
                    style={{
                      marginBottom: Spacing[2],
                      color: isDark ? Colors.white : Colors.white,
                      fontFamily: 'SecondaryFont-Bold',
                    }}
                  >
                    Konu Kaynakları
                  </Text>
                  <Text
                    style={{
                      color: isDark ? Colors.gray[300] : Colors.gray[300],
                      fontFamily: 'SecondaryFont-Regular',
                    }}
                  >
                    {course.progress.konuKaynaklari.join('\n')}
                  </Text>
                </View>
              )}

            {/* Render Soru Bankası Kaynakları */}
            {course.progress?.soruBankasiKaynaklari &&
              course.progress.soruBankasiKaynaklari.length > 0 && (
                <View style={{ marginBottom: Spacing[4] }}>
                  <Text
                    style={{
                      marginBottom: Spacing[2],
                      color: isDark ? Colors.white : Colors.white,
                      fontFamily: 'SecondaryFont-Bold',
                    }}
                  >
                    Soru Bankası Kaynakları
                  </Text>
                  <Text
                    style={{
                      color: isDark ? Colors.gray[300] : Colors.gray[300],
                      fontFamily: 'SecondaryFont-Regular',
                    }}
                  >
                    {course.progress.soruBankasiKaynaklari.join('\n')}
                  </Text>
                </View>
              )}

            {course.progress?.notes && (
              <View style={{ marginBottom: Spacing[4] }}>
                <Text
                  style={{
                    marginBottom: Spacing[2],
                    color: isDark ? Colors.white : Colors.white,
                    fontFamily: 'SecondaryFont-Bold',
                  }}
                >
                  Notlar
                </Text>
                <Text
                  style={{
                    color: isDark ? Colors.gray[300] : Colors.gray[300],
                    fontFamily: 'SecondaryFont-Regular',
                  }}
                >
                  {course.progress.notes}
                </Text>
              </View>
            )}

            <Button
              title='Düzenle'
              onPress={() => handleEditCourseDetails(course)}
              variant='secondary'
              size='small'
              style={{ alignSelf: 'flex-start' }}
            />
          </View>
        ) : (
          // Edit mode
          <View>
            <Text
              style={{
                marginBottom: Spacing[4],
                color: isDark ? Colors.white : Colors.white,
                fontFamily: 'SecondaryFont-Bold',
              }}
            >
              Kurs Detaylarını Düzenle
            </Text>
            <View
              style={{
                borderBottomColor: Colors.white,
                borderBottomWidth: 1,
                marginBottom: Spacing[2],
                width: '100%',
              }}
            />

            <Input
              label='Tekrar Sayısı:'
              value={editingDetails.tekrarSayisi?.toString() || '0'}
              onChangeText={(text) =>
                setEditingDetails((prev) => ({
                  ...prev,
                  tekrarSayisi: parseInt(text) || 0,
                }))
              }
              labelStyle={{
                fontFamily: 'SecondaryFont-Bold',
                color: Colors.white,
              }}
              inputStyle={{
                fontFamily: 'SecondaryFont-Regular',
                color: Colors.white,
              }}
              inputMode='numeric'
              containerStyle={{ marginBottom: Spacing[3] }}
            />

            <View style={{ marginBottom: Spacing[3] }}>
              <Text
                style={{
                  marginBottom: Spacing[2],
                  color: isDark ? Colors.white : Colors.white,
                  fontFamily: 'SecondaryFont-Bold',
                }}
              >
                Zorluk Derecesi:
              </Text>
              <View style={{ flexDirection: 'row', gap: Spacing[2] }}>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    onPress={() =>
                      setEditingDetails((prev) => ({
                        ...prev,
                        difficulty_rating: rating,
                      }))
                    }
                    style={{
                      backgroundColor:
                        editingDetails.difficulty_rating === rating
                          ? getDifficultyColor(rating)
                          : Colors.gray[600],
                      paddingHorizontal: Spacing[3],
                      paddingVertical: Spacing[2],
                      borderRadius: 8,
                      minWidth: 40,
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        color: Colors.white,
                        fontFamily: 'SecondaryFont-Bold',
                        fontSize: 12,
                      }}
                    >
                      {rating}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Input
              label='Konu Kaynakları:'
              value={
                Array.isArray(editingDetails.konuKaynaklari)
                  ? editingDetails.konuKaynaklari.join('\n')
                  : ''
              }
              onChangeText={(text) =>
                setEditingDetails((prev) => ({
                  ...prev,
                  konuKaynaklari: text
                    ? text.split('\n').filter((item) => item.trim() !== '')
                    : [],
                }))
              }
              labelStyle={{
                fontFamily: 'SecondaryFont-Bold',
                color: Colors.white,
              }}
              inputStyle={{
                fontFamily: 'SecondaryFont-Regular',
                color: Colors.white,
              }}
              multiline
              numberOfLines={3}
              placeholder='Her satıra bir kaynak yazın...'
              containerStyle={{ marginBottom: Spacing[3] }}
            />

            <Input
              label='Soru Bankası Kaynakları:'
              value={
                Array.isArray(editingDetails.soruBankasiKaynaklari)
                  ? editingDetails.soruBankasiKaynaklari.join('\n')
                  : ''
              }
              onChangeText={(text) =>
                setEditingDetails((prev) => ({
                  ...prev,
                  soruBankasiKaynaklari: text
                    ? text.split('\n').filter((item) => item.trim() !== '')
                    : [],
                }))
              }
              labelStyle={{
                fontFamily: 'SecondaryFont-Bold',
                color: Colors.white,
              }}
              inputStyle={{
                fontFamily: 'SecondaryFont-Regular',
                color: Colors.white,
              }}
              multiline
              numberOfLines={3}
              placeholder='Her satıra bir soru bankası yazın...'
              containerStyle={{ marginBottom: Spacing[3] }}
            />

            <Input
              label='Notlar:'
              value={editingDetails.notes || ''}
              onChangeText={(text) =>
                setEditingDetails((prev) => ({
                  ...prev,
                  notes: text,
                }))
              }
              labelStyle={{
                fontFamily: 'SecondaryFont-Bold',
                color: Colors.white,
              }}
              inputStyle={{
                fontFamily: 'SecondaryFont-Regular',
                color: Colors.white,
              }}
              multiline
              numberOfLines={3}
              containerStyle={{ marginBottom: Spacing[3] }}
            />

            <Checkbox
              checked={editingDetails.is_completed || false}
              onPress={() =>
                setEditingDetails((prev) => ({
                  ...prev,
                  is_completed: !prev.is_completed,
                }))
              }
              labelStyle={{ fontFamily: 'SecondaryFont-Bold' }}
              label='Kurs tamamlandı'
              style={{ marginBottom: Spacing[4] }}
            />

            <View style={{ flexDirection: 'row', gap: Spacing[2] }}>
              <Button
                title='Güncelle'
                onPress={handleSaveCourseDetails}
                loading={isUpdating}
                disabled={isUpdating}
                variant='secondary'
                style={{ flex: 1 }}
              />
              <Button
                title='İptal'
                onPress={handleCancelEdit}
                variant='secondary'
                disabled={isUpdating}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        )}
      </View>
    );
  };

  // Render study session card
  const renderStudySessionCard = (
    session: CourseStudySession,
    isCurrentSession: boolean = false,
  ) => {
    return (
      <PlayfulCard
        key={session.sessionId}
        title={
          isCurrentSession
            ? 'Mevcut Çalışma Seansı'
            : `Çalışma Seansı #${session.sessionId}`
        }
        variant='outlined'
        category={selectedCourse?.category as any}
        style={{
          marginBottom: Spacing[3],
          shadowColor: Colors.gray[900],
          shadowOffset: { width: 5, height: 10 },
          shadowOpacity: 0.6,
          shadowRadius: 8,
          elevation: 8,
        }}
        titleFontFamily='SecondaryFont-Bold'
      >
        <View>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: Spacing[2],
              marginBottom: Spacing[3],
            }}
          >
            {/* Study Duration */}
            <View
              style={{
                backgroundColor: Colors.vibrant.blue,
                paddingHorizontal: Spacing[2],
                paddingVertical: Spacing[1],
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  color: Colors.white,
                  fontSize: 11,
                  fontFamily: 'SecondaryFont-Bold',
                }}
              >
                📚 {formatTimeFromSeconds(session.studyDurationSeconds || 0)}
              </Text>
            </View>

            {/* Break Duration */}
            {session.breakDurationSeconds &&
              session.breakDurationSeconds > 0 && (
                <View
                  style={{
                    backgroundColor: Colors.vibrant.yellow,
                    paddingHorizontal: Spacing[2],
                    paddingVertical: Spacing[1],
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      color: Colors.white,
                      fontSize: 11,
                      fontFamily: 'SecondaryFont-Bold',
                    }}
                  >
                    ☕ {formatTimeFromSeconds(session.breakDurationSeconds)}
                  </Text>
                </View>
              )}

            {/* Session Status */}
            <View
              style={{
                backgroundColor:
                  session.sessionStatus === 'active'
                    ? Colors.vibrant.green
                    : session.sessionStatus === 'completed'
                      ? Colors.vibrant.blue
                      : Colors.gray[500],
                paddingHorizontal: Spacing[2],
                paddingVertical: Spacing[1],
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  color: Colors.white,
                  fontSize: 11,
                  fontFamily: 'SecondaryFont-Bold',
                }}
              >
                {session.sessionStatus === 'active'
                  ? '🟢 Aktif'
                  : session.sessionStatus === 'completed'
                    ? '✅ Tamamlandı'
                    : '⏸️ Duraklatıldı'}
              </Text>
            </View>
          </View>

          {/* Session Date and Time */}
          <Text
            style={{
              fontSize: 12,
              color: isDark ? Colors.gray[700] : Colors.gray[700],
              fontFamily: 'SecondaryFont-Regular',
              marginBottom: Spacing[2],
            }}
          >
            📅 {new Date(session.sessionDate).toLocaleDateString('tr-TR')}
            {session.startTime &&
              ` • ${new Date(session.startTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`}
          </Text>

          {/* Session Notes */}
          {session.notes && (
            <Text
              style={{
                fontSize: 12,
                color: isDark ? Colors.gray[600] : Colors.gray[600],
                fontFamily: 'SecondaryFont-Regular',
                fontStyle: 'italic',
              }}
            >
              💭 {session.notes}
            </Text>
          )}
        </View>
      </PlayfulCard>
    );
  };

  // Render performance summary section
  const renderPerformanceSummary = () => {
    if (performanceLoading) {
      return (
        <SlideInElement direction='right' delay={400}>
          <PlayfulCard
            title='Genel Performans Özeti'
            style={{
              marginBottom: Spacing[6],
              shadowColor: Colors.gray[900],
              shadowOffset: { width: 20, height: 40 },
              shadowOpacity: 0.9,
              shadowRadius: 20,
              elevation: 20,
            }}
            titleFontFamily='PrimaryFont'
            variant='elevated'
            category={preferredCourse?.category as any}
            animated
            floatingAnimation
          >
            <View style={{ alignItems: 'center', padding: Spacing[4] }}>
              <ActivityIndicator
                size='small'
                color={
                  preferredCourse?.category
                    ? getCourseColor(preferredCourse.category)
                    : Colors.vibrant.blue
                }
              />
              <Text
                style={{
                  marginTop: Spacing[2],
                  color: isDark ? Colors.gray[400] : Colors.gray[400],
                  fontFamily: 'SecondaryFont-Regular',
                }}
              >
                Performans verileri yükleniyor...
              </Text>
            </View>
          </PlayfulCard>
        </SlideInElement>
      );
    }

    if (performanceError) {
      return (
        <SlideInElement direction='right' delay={400}>
          <PlayfulCard
            title='Genel Performans Özeti'
            style={{
              marginBottom: Spacing[6],
              shadowColor: Colors.gray[900],
              shadowOffset: { width: 20, height: 40 },
              shadowOpacity: 0.9,
              shadowRadius: 20,
              elevation: 20,
            }}
            titleFontFamily='PrimaryFont'
            variant='elevated'
            category={preferredCourse?.category as any}
          >
            <Alert
              type='error'
              message={performanceError}
              style={{ marginBottom: Spacing[4] }}
            />
          </PlayfulCard>
        </SlideInElement>
      );
    }

    const chartData = getProgressChartData(performanceData.dailyProgress);
    const longestStreak =
      performanceData.streaksSummary?.longest_single_session_minutes || 0;
    const topCourse = performanceData.topCourses[0];

    return (
      <SlideInElement direction='right' delay={400}>
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
            title='Genel Performans Özeti'
            style={{
              marginBottom: Spacing[6],
              shadowColor: Colors.gray[900],
              shadowOffset: { width: 20, height: 40 },
              shadowOpacity: 0.9,
              shadowRadius: 20,
              elevation: 20,
            }}
            titleFontFamily='PrimaryFont'
            variant='elevated'
            category={preferredCourse?.category as any}
            animated
            floatingAnimation
          >
            <View>
              {/* En Uzun Kronometre Süresi */}
              <View style={{ marginBottom: Spacing[10] }}>
                <Text
                  style={{
                    fontSize: 16,
                    color: isDark ? Colors.white : Colors.white,
                    marginBottom: Spacing[3],
                    fontFamily: 'SecondaryFont-Bold',
                  }}
                >
                  🏆 En Uzun Çalışma Seansı
                </Text>

                <View
                  style={{
                    backgroundColor: Colors.white,
                    padding: Spacing[4],
                    borderRadius: 12,
                    alignItems: 'center',
                    shadowColor: Colors.gray[900],
                    shadowOffset: { width: 10, height: 20 },
                    shadowOpacity: 0.8,
                    shadowRadius: 10,
                    elevation: 10,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 28,
                      color: Colors.gray[900],
                      fontFamily: 'PrimaryFont',
                      marginBottom: Spacing[1],
                    }}
                  >
                    {formatTimeForDisplay(longestStreak)}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: Colors.gray[700],
                      fontFamily: 'SecondaryFont-Regular',
                      opacity: 0.8,
                    }}
                  >
                    Tek seansta en uzun çalışma süren
                  </Text>
                </View>
              </View>

              {/* Günlük İlerleme Grafiği */}
              <View style={{ marginBottom: Spacing[10] }}>
                <Text
                  style={{
                    fontSize: 16,
                    color: isDark ? Colors.white : Colors.white,
                    marginBottom: Spacing[3],
                    fontFamily: 'SecondaryFont-Bold',
                  }}
                >
                  📊 Son 7 Gün İlerleme
                </Text>

                {chartData.length > 0 ? (
                  <View>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'flex-end',
                        justifyContent: 'space-between',
                        height: 120,
                        marginBottom: Spacing[3],
                        paddingHorizontal: Spacing[2],
                      }}
                    >
                      {chartData.map((day, index) => (
                        <View
                          key={day.study_date}
                          style={{
                            alignItems: 'center',
                            flex: 1,
                            marginHorizontal: 2,
                          }}
                        >
                          <View
                            style={{
                              backgroundColor:
                                day.daily_study_minutes > 0
                                  ? Colors.vibrant.green
                                  : Colors.white,
                              height: Math.max(
                                ensureSafeNumber(day.percentage * 0.8),
                                4,
                              ),
                              borderRadius: 4,
                              minHeight: 4,
                              width: '100%',
                              marginBottom: Spacing[2],
                            }}
                          />
                          <Text
                            style={{
                              fontSize: 10,
                              color: isDark
                                ? Colors.gray[900]
                                : Colors.gray[900],
                              fontFamily: 'SecondaryFont-Regular',
                              textAlign: 'center',
                            }}
                          >
                            {day.date}
                          </Text>
                          <Text
                            style={{
                              fontSize: 9,
                              color: isDark
                                ? Colors.gray[700]
                                : Colors.gray[700],
                              fontFamily: 'SecondaryFont-Regular',
                              textAlign: 'center',
                            }}
                          >
                            {day.daily_study_minutes > 0
                              ? `${ensureSafeNumber(day.daily_study_minutes)}dk`
                              : '0'}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {/* Chart Summary */}
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        backgroundColor: isDark
                          ? Colors.gray[700]
                          : Colors.gray[700],
                        padding: Spacing[3],
                        borderRadius: 8,
                        shadowColor: Colors.gray[900],
                        shadowOffset: { width: 10, height: 20 },
                        shadowOpacity: 0.8,
                        shadowRadius: 10,
                        elevation: 10,
                      }}
                    >
                      <View style={{ alignItems: 'center' }}>
                        <Text
                          style={{
                            fontSize: 12,
                            color: isDark ? Colors.gray[300] : Colors.gray[300],
                            fontFamily: 'SecondaryFont-Regular',
                          }}
                        >
                          Toplam
                        </Text>
                        <Text
                          style={{
                            fontSize: 14,
                            color: isDark ? Colors.white : Colors.white,
                            fontFamily: 'SecondaryFont-Bold',
                          }}
                        >
                          {formatTimeForDisplay(
                            chartData.reduce(
                              (sum, day) => sum + day.daily_study_minutes,
                              0,
                            ),
                          )}
                        </Text>
                      </View>

                      <View style={{ alignItems: 'center' }}>
                        <Text
                          style={{
                            fontSize: 12,
                            color: isDark ? Colors.gray[300] : Colors.gray[300],
                            fontFamily: 'SecondaryFont-Regular',
                          }}
                        >
                          Ortalama
                        </Text>
                        <Text
                          style={{
                            fontSize: 14,
                            color: isDark ? Colors.white : Colors.white,
                            fontFamily: 'SecondaryFont-Bold',
                          }}
                        >
                          {formatTimeForDisplay(
                            chartData.reduce(
                              (sum, day) => sum + day.daily_study_minutes,
                              0,
                            ) / Math.max(chartData.length, 1),
                          )}
                        </Text>
                      </View>

                      <View style={{ alignItems: 'center' }}>
                        <Text
                          style={{
                            fontSize: 12,
                            color: isDark ? Colors.gray[300] : Colors.gray[300],
                            fontFamily: 'SecondaryFont-Regular',
                          }}
                        >
                          Aktif Gün
                        </Text>
                        <Text
                          style={{
                            fontSize: 14,
                            color: isDark ? Colors.white : Colors.white,
                            fontFamily: 'SecondaryFont-Bold',
                          }}
                        >
                          {
                            chartData.filter(
                              (day) => day.daily_study_minutes > 0,
                            ).length
                          }
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <EmptyState
                    icon='bar-chart'
                    title='Veri bulunamadı'
                    message='Son 7 günde çalışma verisi bulunmuyor.'
                    style={{
                      backgroundColor: isDark ? Colors.white : Colors.white,
                      padding: Spacing[4],
                      borderRadius: 8,
                    }}
                  />
                )}
              </View>

              {/* En Çok Zaman Harcanan Kurs */}
              <View>
                <Text
                  style={{
                    fontSize: 16,
                    color: isDark ? Colors.white : Colors.white,
                    marginBottom: Spacing[3],
                    fontFamily: 'SecondaryFont-Bold',
                  }}
                >
                  🎯 En Çok Zaman Harcanan Kurs
                </Text>

                {topCourse ? (
                  <View
                    style={{
                      backgroundColor: Colors.gray[700],
                      padding: Spacing[4],
                      borderRadius: 12,
                      shadowColor: Colors.gray[900],
                      shadowOffset: { width: 10, height: 20 },
                      shadowOpacity: 0.8,
                      shadowRadius: 10,
                      elevation: 10,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: Spacing[3],
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 18,
                          color: Colors.white,
                          fontFamily: 'SecondaryFont-Bold',
                          flex: 1,
                        }}
                      >
                        {topCourse.course_title}
                      </Text>
                      <Text
                        style={{
                          fontSize: 16,
                          color: Colors.white,
                          fontFamily: 'PrimaryFont',
                        }}
                      >
                        {formatTimeForDisplay(
                          (topCourse.total_time_hours || 0) * 60,
                        )}
                      </Text>
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginBottom: Spacing[3],
                      }}
                    >
                      <View style={{ alignItems: 'center' }}>
                        <Text
                          style={{
                            fontSize: 12,
                            color: Colors.white,
                            fontFamily: 'SecondaryFont-Regular',
                            opacity: 0.8,
                          }}
                        >
                          Kronometre
                        </Text>
                        <Text
                          style={{
                            fontSize: 14,
                            color: Colors.white,
                            fontFamily: 'SecondaryFont-Bold',
                          }}
                        >
                          {formatTimeForDisplay(
                            (topCourse.study_session_hours || 0) * 60,
                          )}
                        </Text>
                      </View>

                      <View style={{ alignItems: 'center' }}>
                        <Text
                          style={{
                            fontSize: 12,
                            color: Colors.white,
                            fontFamily: 'SecondaryFont-Regular',
                            opacity: 0.8,
                          }}
                        >
                          Toplam Saat
                        </Text>
                        <Text
                          style={{
                            fontSize: 14,
                            color: Colors.white,
                            fontFamily: 'SecondaryFont-Bold',
                          }}
                        >
                          {Math.round(topCourse.total_time_hours || 0)}sa
                        </Text>
                      </View>

                      <View style={{ alignItems: 'center' }}>
                        <Text
                          style={{
                            fontSize: 12,
                            color: Colors.white,
                            fontFamily: 'SecondaryFont-Regular',
                            opacity: 0.8,
                          }}
                        >
                          Çalışma Saati
                        </Text>
                        <Text
                          style={{
                            fontSize: 14,
                            color: Colors.white,
                            fontFamily: 'SecondaryFont-Bold',
                          }}
                        >
                          {Math.round(topCourse.study_session_hours || 0)}sa
                        </Text>
                      </View>
                    </View>

                    <ProgressBar
                      progress={85}
                      height={8}
                      width='100%'
                      trackColor={Colors.white}
                      progressColor={Colors.vibrant.green}
                      style={{ marginTop: Spacing[2] }}
                      animated
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        color: Colors.white,
                        fontFamily: 'SecondaryFont-Regular',
                        textAlign: 'center',
                        marginTop: Spacing[1],
                        opacity: 0.8,
                      }}
                    >
                      Toplam çalışma süresi
                    </Text>
                  </View>
                ) : (
                  <EmptyState
                    icon='trophy'
                    title='Veri bulunamadı'
                    message='Henüz kurs bazında çalışma verisi bulunmuyor.'
                    style={{
                      backgroundColor: isDark ? Colors.white : Colors.white,
                      padding: Spacing[4],
                      borderRadius: 8,
                    }}
                  />
                )}
              </View>
            </View>
          </PlayfulCard>
        </View>
      </SlideInElement>
    );
  };

  // Enhanced fetchData function
  const fetchData = useCallback(async () => {
    try {
      setError(null);

      const sessionValid = await checkAndRefreshSession();
      if (!sessionValid) {
        console.log('Session invalid, redirecting to login');
        router.replace('/(auth)/login');
        return;
      }

      const [analyticsResponse] = await Promise.allSettled([
        analyticsService.getUserPerformanceAnalytics(),
      ]);

      if (analyticsResponse.status === 'fulfilled') {
        setAnalyticsData(analyticsResponse.value);
      }
    } catch (error) {
      console.error('Error fetching homepage data:', error);
      if (
        error instanceof Error &&
        error.message.includes('Oturum süresi doldu')
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

      const sessionValid = await checkAndRefreshSession();
      if (!sessionValid) {
        router.replace('/(auth)/login');
        return;
      }

      await Promise.all([
        fetchData(),
        fetchCoursesWithData(),
        fetchAnalyticsData(),
        fetchPerformanceData(),
      ]);
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
  }, [
    fetchData,
    fetchCoursesWithData,
    fetchAnalyticsData,
    fetchPerformanceData,
    router,
  ]);

  // Enhanced handleRetry function
  const handleRetry = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      try {
        await refreshSession();
      } catch (sessionError) {
        const sessionValid = await checkAndRefreshSession();
        if (!sessionValid) {
          router.replace('/(auth)/login');
          return;
        }
      }

      await Promise.all([
        fetchData(),
        fetchCoursesWithData(),
        fetchAnalyticsData(),
        fetchPerformanceData(),
      ]);
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
  }, [
    fetchData,
    fetchCoursesWithData,
    fetchAnalyticsData,
    fetchPerformanceData,
    router,
    refreshSession,
  ]);

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

        await Promise.all([
          fetchData(),
          fetchCoursesWithData(),
          fetchAnalyticsData(),
          fetchPerformanceData(),
        ]);
      } catch (error) {
        console.error('Initial fetch error:', error);
        setError('Başlangıç verisi yüklenemedi. Lütfen tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    }

    initialFetch();
  }, [
    fetchData,
    fetchCoursesWithData,
    fetchAnalyticsData,
    fetchPerformanceData,
    router,
  ]);

  // Handle course modal close
  const handleCourseModalClose = () => {
    setShowCourseModal(false);
  };

  // Handle course selection
  const handleCourseSelected = () => {
    setShowCourseModal(false);
  };

  // Enhanced error screen
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

          <Button title='Tekrar Dene' onPress={handleRetry} variant='primary' />
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
            titleColor={isDark ? Colors.gray[600] : Colors.gray[600]}
          />
        }
      >
        {/* Header */}
        <SlideInElement direction='down' delay={0}>
          <View
            style={{
              flexDirection: 'column',
              marginBottom: Spacing[6],
            }}
          >
            <View
              style={{
                alignItems: 'flex-end',
                marginBottom: Spacing[3],
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  color: isDark ? Colors.gray[900] : Colors.gray[900],
                  textAlign: 'right',
                  fontFamily: 'PrimaryFont',
                  marginBottom: Spacing[1],
                }}
              >
                Merhaba {userData?.username || 'Öğrenci'}!
              </Text>
              <Paragraph
                color={isDark ? Colors.gray[700] : Colors.gray[700]}
                style={{
                  fontFamily: 'SecondaryFont-Regular',
                  textAlign: 'right',
                  fontSize: 12,
                }}
              >
                DUS sınavına hazırlanmaya devam edelim
              </Paragraph>
            </View>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: Spacing[4],
              }}
            >
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
                      shadowColor: Colors.gray[900],
                      shadowOffset: { width: 10, height: 20 },
                      shadowOpacity: 0.8,
                      shadowRadius: 10,
                      elevation: 10,
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

              <Avatar
                name={userData?.username?.charAt(0).toUpperCase() || 'Ö'}
                size='lg'
                bgColor={
                  preferredCourse?.category
                    ? getCourseColor(preferredCourse.category)
                    : Colors.vibrant.blue
                }
                borderGlow
                animated
                style={{
                  shadowColor: Colors.gray[900],
                  shadowOffset: { width: 10, height: 20 },
                  shadowOpacity: 0.8,
                  shadowRadius: 10,
                  elevation: 10,
                }}
              />
            </View>

            {preferredCourse && (
              <StudyChronometer
                courseId={preferredCourse.course_id}
                courseTitle={preferredCourse.title}
                category={preferredCourse.category as any}
                variant='elevated'
                style={{
                  width: '100%',
                  alignSelf: 'stretch',
                  shadowColor: Colors.gray[900],
                  shadowOffset: { width: 10, height: 20 },
                  shadowOpacity: 0.8,
                  shadowRadius: 10,
                  elevation: 10,
                }}
                maxWidth='100%'
                onTopicChange={(topicId, topicTitle) => {
                  console.log('Selected topic changed:', topicId, topicTitle);
                }}
                onSessionStart={(sessionId, topicId) => {
                  console.log(
                    'Study session started:',
                    sessionId,
                    'for topic:',
                    topicId,
                  );
                }}
                onSessionEnd={(sessionData) => {
                  console.log('Study session ended:', sessionData);
                  fetchPerformanceData();
                  fetchCoursesWithData();
                }}
              />
            )}
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
              color={
                preferredCourse?.category
                  ? getCourseColor(preferredCourse.category)
                  : Colors.vibrant.blue
              }
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
            {/* Courses Section */}
            <SlideInElement direction='left' delay={200}>
              <View
                style={{
                  shadowColor: Colors.gray[900],
                  shadowOffset: { width: 10, height: 20 },
                  shadowOpacity: 0.8,
                  shadowRadius: 10,
                  elevation: 10,
                }}
              >
                <PlayfulCard
                  title='Kurs Çalışmaları'
                  style={{
                    marginBottom: Spacing[6],
                    shadowColor: Colors.gray[900],
                    shadowOffset: { width: 20, height: 40 },
                    shadowOpacity: 0.9,
                    shadowRadius: 20,
                    elevation: 20,
                  }}
                  titleFontFamily='PrimaryFont'
                  variant='elevated'
                  category={preferredCourse?.category as any}
                  animated
                  floatingAnimation
                  collapsible
                  defaultCollapsed={isStudyCardCollapsed}
                  onCollapseToggle={setIsStudyCardCollapsed}
                >
                  {courses.length > 0 ? (
                    <View>
                      {/* Course Selection Tabs */}
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ marginBottom: Spacing[4] }}
                        contentContainerStyle={{
                          paddingHorizontal: Spacing[2],
                        }}
                      >
                        {courses.map((course, index) => (
                          <TouchableOpacity
                            key={course.course_id}
                            onPress={() => handleCourseSelect(course)}
                            style={{
                              backgroundColor:
                                selectedCourse?.course_id === course.course_id
                                  ? course.category
                                    ? getCourseColor(course.category)
                                    : Colors.vibrant.blue
                                  : Colors.gray[600],
                              paddingHorizontal: Spacing[4],
                              paddingVertical: Spacing[3],
                              borderRadius: 25,
                              marginRight: Spacing[3],
                              minWidth: 120,
                              alignItems: 'center',
                              shadowColor: Colors.gray[900],
                              shadowOffset: { width: 5, height: 10 },
                              shadowOpacity: 0.6,
                              shadowRadius: 8,
                              elevation: 8,
                            }}
                          >
                            <FontAwesome
                              name={course.iconName as any}
                              size={16}
                              color={Colors.white}
                              style={{ marginBottom: Spacing[1] }}
                            />
                            <Text
                              style={{
                                color: Colors.white,
                                fontSize: 12,
                                fontFamily: 'SecondaryFont-Bold',
                                textAlign: 'center',
                              }}
                            >
                              {course.title.length > 15
                                ? `${course.title.substring(0, 15)}...`
                                : course.title}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>

                      {/* Selected Course Content */}
                      {selectedCourse && (
                        <View>
                          <Text
                            style={{
                              fontSize: 18,
                              color: isDark ? Colors.white : Colors.white,
                              marginBottom: Spacing[4],
                              fontFamily: 'SecondaryFont-Bold',
                              textAlign: 'center',
                            }}
                          >
                            {selectedCourse.title}
                          </Text>

                          {/* Course Analytics */}
                          <View style={{ marginBottom: Spacing[4] }}>
                            {renderCourseAnalytics(selectedCourse)}
                          </View>

                          {/* Current Session */}
                          <View style={{ marginBottom: Spacing[4] }}>
                            <Text
                              style={{
                                fontSize: 16,
                                color: isDark ? Colors.white : Colors.white,
                                marginBottom: Spacing[3],
                                fontFamily: 'SecondaryFont-Bold',
                              }}
                            >
                              📝 Aktif Çalışma Seansı
                            </Text>

                            {selectedCourse.studySessions.find(
                              (s) => s.sessionStatus === 'active',
                            ) ? (
                              renderStudySessionCard(
                                selectedCourse.studySessions.find(
                                  (s) => s.sessionStatus === 'active',
                                )!,
                                true,
                              )
                            ) : (
                              <PlayfulCard
                                title='Yeni Çalışma Seansı Başlat'
                                variant='outlined'
                                category={selectedCourse.category as any}
                                style={{
                                  marginBottom: Spacing[3],
                                  backgroundColor: Colors.gray[100],
                                }}
                              >
                                <View
                                  style={{
                                    alignItems: 'center',
                                    padding: Spacing[4],
                                  }}
                                >
                                  <FontAwesome
                                    name='play-circle'
                                    size={48}
                                    color={
                                      selectedCourse.category
                                        ? getCourseColor(
                                            selectedCourse.category,
                                          )
                                        : Colors.vibrant.blue
                                    }
                                    style={{ marginBottom: Spacing[2] }}
                                  />
                                  <Text
                                    style={{
                                      color: Colors.gray[600],
                                      fontFamily: 'SecondaryFont-Regular',
                                      textAlign: 'center',
                                    }}
                                  >
                                    Bu kurs için aktif bir çalışma seansı yok.
                                    Yukarıdaki kronometre ile yeni bir seans
                                    başlatabilirsiniz.
                                  </Text>
                                </View>
                              </PlayfulCard>
                            )}
                          </View>

                          {/* Recent 3 Sessions */}
                          <View style={{ marginBottom: Spacing[4] }}>
                            <Text
                              style={{
                                fontSize: 16,
                                color: isDark ? Colors.white : Colors.white,
                                marginBottom: Spacing[3],
                                fontFamily: 'SecondaryFont-Bold',
                              }}
                            >
                              📚 Son 3 Çalışma Seansı
                            </Text>

                            {selectedCourse.studySessions
                              .filter((s) => s.sessionStatus === 'completed')
                              .slice(0, 3)
                              .map((session) =>
                                renderStudySessionCard(session),
                              )}

                            {selectedCourse.studySessions.filter(
                              (s) => s.sessionStatus === 'completed',
                            ).length === 0 && (
                              <EmptyState
                                icon='history'
                                title='Henüz tamamlanmış seans yok'
                                message='Bu kurs için tamamlanmış çalışma seansı bulunmuyor.'
                                style={{
                                  backgroundColor: Colors.white,
                                  padding: Spacing[4],
                                  borderRadius: 8,
                                }}
                              />
                            )}
                          </View>

                          {/* All Sessions Toggle */}
                          {selectedCourse.studySessions.length > 3 && (
                            <View>
                              <TouchableOpacity
                                onPress={() =>
                                  handleToggleSessionsExpansion(
                                    selectedCourse.course_id,
                                  )
                                }
                                style={{
                                  backgroundColor: Colors.gray[700],
                                  padding: Spacing[3],
                                  borderRadius: 8,
                                  alignItems: 'center',
                                  marginBottom: Spacing[4],
                                }}
                              >
                                <Text
                                  style={{
                                    color: Colors.white,
                                    fontFamily: 'SecondaryFont-Bold',
                                  }}
                                >
                                  {selectedCourse.isSessionsExpanded
                                    ? 'Tüm Seansları Gizle'
                                    : `Tüm Seansları Göster (${selectedCourse.studySessions.length - 3} tane daha)`}
                                </Text>
                              </TouchableOpacity>

                              {selectedCourse.isSessionsExpanded && (
                                <View>
                                  <Text
                                    style={{
                                      fontSize: 16,
                                      color: isDark
                                        ? Colors.white
                                        : Colors.white,
                                      marginBottom: Spacing[3],
                                      fontFamily: 'SecondaryFont-Bold',
                                    }}
                                  >
                                    📋 Tüm Çalışma Seansları
                                  </Text>

                                  {selectedCourse.studySessions
                                    .filter(
                                      (s) => s.sessionStatus === 'completed',
                                    )
                                    .slice(3)
                                    .map((session) =>
                                      renderStudySessionCard(session),
                                    )}
                                </View>
                              )}
                            </View>
                          )}

                          {/* Course Details Form */}
                          <View>
                            <Text
                              style={{
                                fontSize: 16,
                                color: isDark ? Colors.white : Colors.white,
                                marginBottom: Spacing[3],
                                fontFamily: 'SecondaryFont-Bold',
                              }}
                            >
                              ⚙️ Kurs Detayları
                            </Text>
                            {renderCourseDetailsForm(selectedCourse)}
                          </View>
                        </View>
                      )}
                    </View>
                  ) : coursesLoading ? (
                    <View style={{ alignItems: 'center', padding: Spacing[4] }}>
                      <ActivityIndicator
                        size='small'
                        color={
                          preferredCourse?.category
                            ? getCourseColor(preferredCourse.category)
                            : Colors.vibrant.blue
                        }
                      />
                      <Text
                        style={{
                          marginTop: Spacing[2],
                          color: isDark ? Colors.gray[400] : Colors.gray[400],
                          fontFamily: 'SecondaryFont-Regular',
                        }}
                      >
                        Kurslar yükleniyor...
                      </Text>
                    </View>
                  ) : (
                    <EmptyState
                      icon='book'
                      title='Henüz kurs yok'
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
              </View>
            </SlideInElement>

            {/* Performance Summary */}
            {!loading && renderPerformanceSummary()}
          </>
        )}

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
