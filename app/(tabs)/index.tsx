import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  RefreshControl,
  TextInput,
  Alert as RNAlert,
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
// Add these new imports for analytics functions
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
} from '../../context/PreferredCourseContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Course,
  Topic,
  UserTopicDetails,
  CourseStudyOverview,
  StudyStatistics,
  // Add these new type imports
  LongestStreak,
  DailyProgress,
  WeeklyProgress,
  TopCourse,
  StreaksSummary,
} from '../../src/types/models';
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

// Interface for topic with analytics instead of progress
interface TopicWithAnalytics extends Topic {
  isDetailsExpanded?: boolean;
  details?: UserTopicDetails | null;
  analytics?: {
    totalStudyTime: number;
    sessionCount: number;
    lastStudied?: string;
    tekrarSayisi: number;
    difficultyRating: number;
    isCompleted: boolean;
  };
}

// Define interface for editing details that matches the update request
interface EditingTopicDetails {
  topic_id?: number;
  tekrar_sayisi?: number;
  konu_kaynaklari?: string[];
  soru_bankasi_kaynaklari?: string[];
  difficulty_rating?: number;
  notes?: string;
  is_completed?: boolean;
}

// Utility function to ensure safe numeric values
const ensureSafeNumber = (
  value: number | undefined,
  fallback: number = 0,
): number => {
  if (value === undefined || isNaN(value) || !isFinite(value)) {
    return fallback;
  }
  return Math.round(value); // Always return rounded integers for native components
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

  // New states for enhanced functionality
  const [isStudyCardCollapsed, setIsStudyCardCollapsed] = useState(false);
  const [courseAnalytics, setCourseAnalytics] = useState<CourseStudyOverview[]>(
    [],
  );
  const [studyStatistics, setStudyStatistics] =
    useState<StudyStatistics | null>(null);
  const [courseTopics, setCourseTopics] = useState<TopicWithAnalytics[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState<number | null>(null);
  const [editingDetails, setEditingDetails] = useState<EditingTopicDetails>({});
  const [updatingTopic, setUpdatingTopic] = useState<number | null>(null);

  // NEW: Performance data states
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

  // NEW: Fetch performance data function
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
        getUserDailyProgress(undefined, undefined, 7), // Last 7 days
        getUserWeeklyProgress(4), // Last 4 weeks
        getUserTopCourses(3), // Top 3 courses
      ]);

      setPerformanceData({
        longestStreaks:
          streaksResponse.status === 'fulfilled' ? streaksResponse.value : [],
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

  // Fetch course analytics and topics when preferred course changes
  useEffect(() => {
    if (preferredCourse && !isStudyCardCollapsed) {
      fetchCourseAnalytics();
      fetchCourseTopics();
      fetchPerformanceData(); // Add performance data fetch
    }
  }, [preferredCourse, isStudyCardCollapsed, fetchPerformanceData]);

  // Fetch course analytics
  const fetchCourseAnalytics = useCallback(async () => {
    if (!preferredCourse) return;

    try {
      const [overview, stats] = await Promise.allSettled([
        studyService.getUserCourseStudyOverview(preferredCourse.course_id),
        studyService.getUserStudyStatistics(),
      ]);

      if (overview.status === 'fulfilled') {
        setCourseAnalytics(overview.value);
      }

      if (stats.status === 'fulfilled') {
        setStudyStatistics(stats.value);
      }
    } catch (error) {
      console.error('Error fetching course analytics:', error);
    }
  }, [preferredCourse]);

  // Fetch course topics with analytics instead of progress
  const fetchCourseTopics = useCallback(async () => {
    if (!preferredCourse) return;

    try {
      setTopicsLoading(true);
      const topics = await courseService.getTopicsByCourse(
        preferredCourse.course_id,
      );

      // Fetch analytics for each topic
      const topicsWithAnalytics: TopicWithAnalytics[] = await Promise.all(
        topics.map(async (topic) => {
          try {
            const details = await studyService.getUserTopicDetails(
              topic.topic_id,
            );

            return {
              ...topic,
              isDetailsExpanded: false,
              details,
              analytics: details
                ? {
                    totalStudyTime: details.total_study_time_seconds || 0,
                    sessionCount: details.tekrar_sayisi || 0,
                    lastStudied: details.last_studied_at,
                    tekrarSayisi: details.tekrar_sayisi || 0,
                    difficultyRating: details.difficulty_rating || 1,
                    isCompleted: details.is_completed || false,
                  }
                : {
                    totalStudyTime: 0,
                    sessionCount: 0,
                    tekrarSayisi: 0,
                    difficultyRating: 1,
                    isCompleted: false,
                  },
            };
          } catch (error) {
            console.error(
              `Error fetching analytics for topic ${topic.topic_id}:`,
              error,
            );
            return {
              ...topic,
              isDetailsExpanded: false,
              details: null,
              analytics: {
                totalStudyTime: 0,
                sessionCount: 0,
                tekrarSayisi: 0,
                difficultyRating: 1,
                isCompleted: false,
              },
            };
          }
        }),
      );

      setCourseTopics(topicsWithAnalytics);
    } catch (error) {
      console.error('Error fetching course topics:', error);
    } finally {
      setTopicsLoading(false);
    }
  }, [preferredCourse]);

  // Fetch topic details
  const fetchTopicDetails = useCallback(async (topicId: number) => {
    try {
      const details = await studyService.getUserTopicDetails(topicId);

      setCourseTopics((prev) =>
        prev.map((topic) =>
          topic.topic_id === topicId
            ? {
                ...topic,
                details,
                analytics: details
                  ? {
                      totalStudyTime: details.total_study_time_seconds || 0,
                      sessionCount: details.tekrar_sayisi || 0,
                      lastStudied: details.last_studied_at,
                      tekrarSayisi: details.tekrar_sayisi || 0,
                      difficultyRating: details.difficulty_rating || 1,
                      isCompleted: details.is_completed || false,
                    }
                  : topic.analytics,
              }
            : topic,
        ),
      );
    } catch (error) {
      console.error('Error fetching topic details:', error);
    }
  }, []);

  // Handle topic details toggle
  const handleTopicDetailsToggle = useCallback(
    async (topicId: number) => {
      setCourseTopics((prev) =>
        prev.map((topic) => {
          if (topic.topic_id === topicId) {
            const newExpanded = !topic.isDetailsExpanded;

            // Fetch details if expanding and not already fetched
            if (newExpanded && !topic.details) {
              fetchTopicDetails(topicId);
            }

            return { ...topic, isDetailsExpanded: newExpanded };
          }
          return topic;
        }),
      );
    },
    [fetchTopicDetails],
  );

  // Updated handle edit topic details with proper array initialization for text inputs
  const handleEditTopicDetails = useCallback((topic: TopicWithAnalytics) => {
    setEditingTopicId(topic.topic_id);
    setEditingDetails({
      topic_id: topic.topic_id,
      tekrar_sayisi: topic.details?.tekrar_sayisi || 0,
      konu_kaynaklari: topic.details?.konu_kaynaklari
        ? [...topic.details.konu_kaynaklari]
        : [],
      soru_bankasi_kaynaklari: topic.details?.soru_bankasi_kaynaklari
        ? [...topic.details.soru_bankasi_kaynaklari]
        : [],
      difficulty_rating: topic.details?.difficulty_rating || 1,
      notes: topic.details?.notes || '',
      is_completed: topic.details?.is_completed || false,
    });
  }, []);

  // Handle save topic details (updated to remove unused state resets)
  const handleSaveTopicDetails = useCallback(async () => {
    if (!editingTopicId || !editingDetails.topic_id) return;

    try {
      setUpdatingTopic(editingTopicId);

      await studyService.updateUserTopicDetails({
        topicId: editingDetails.topic_id,
        tekrarSayisi: editingDetails.tekrar_sayisi,
        konuKaynaklari: editingDetails.konu_kaynaklari,
        soruBankasiKaynaklari: editingDetails.soru_bankasi_kaynaklari,
        difficultyRating: editingDetails.difficulty_rating,
        notes: editingDetails.notes || undefined,
        isCompleted: editingDetails.is_completed,
      });

      // Refresh topic details
      await fetchTopicDetails(editingTopicId);

      setEditingTopicId(null);
      setEditingDetails({});

      RNAlert.alert('Başarılı', 'Konu detayları güncellendi!');
    } catch (error) {
      console.error('Error updating topic details:', error);
      RNAlert.alert('Hata', 'Konu detayları güncellenirken bir hata oluştu.');
    } finally {
      setUpdatingTopic(null);
    }
  }, [editingTopicId, editingDetails, fetchTopicDetails]);

  // Handle cancel edit (updated to remove unused state resets)
  const handleCancelEdit = useCallback(() => {
    setEditingTopicId(null);
    setEditingDetails({});
  }, []);

  // NEW: Helper functions for performance data
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
      percentage: ensureSafeNumber((day.daily_study_minutes / maxValue) * 100), // Use ensureSafeNumber
      date: new Date(day.study_date).toLocaleDateString('tr-TR', {
        weekday: 'short',
        day: 'numeric',
      }),
    }));
  };

  // NEW: Render performance summary section
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
            category={(preferredCourse as any)?.category}
            animated
            floatingAnimation
          >
            <View style={{ alignItems: 'center', padding: Spacing[4] }}>
              <ActivityIndicator
                size='small'
                color={
                  (preferredCourse as any)?.category &&
                  getCourseColor((preferredCourse as any).category)
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
            category={(preferredCourse as any)?.category}
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
          category={(preferredCourse as any)?.category}
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
                            ), // Use ensureSafeNumber
                            borderRadius: 4,
                            minHeight: 4,
                            width: '100%',
                            marginBottom: Spacing[2],
                          }}
                        />
                        <Text
                          style={{
                            fontSize: 10,
                            color: isDark ? Colors.gray[900] : Colors.gray[900],
                            fontFamily: 'SecondaryFont-Regular',
                            textAlign: 'center',
                          }}
                        >
                          {day.date}
                        </Text>
                        <Text
                          style={{
                            fontSize: 9,
                            color: isDark ? Colors.gray[700] : Colors.gray[700],
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
                          chartData.filter((day) => day.daily_study_minutes > 0)
                            .length
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

            {/* En Çok Zaman Harcanan Branş */}
            <View>
              <Text
                style={{
                  fontSize: 16,
                  color: isDark ? Colors.white : Colors.white,
                  marginBottom: Spacing[3],
                  fontFamily: 'SecondaryFont-Bold',
                }}
              >
                🎯 En Çok Zaman Harcanan Branş
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
                      {formatTimeForDisplay(topCourse.total_time_hours * 60)}
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
                          topCourse.study_session_hours * 60,
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
                        Düello
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          color: Colors.white,
                          fontFamily: 'SecondaryFont-Bold',
                        }}
                      >
                        {formatTimeForDisplay(topCourse.duel_hours * 60)}
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
                        Konu Sayısı
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          color: Colors.white,
                          fontFamily: 'SecondaryFont-Bold',
                        }}
                      >
                        {topCourse.topics_studied}
                      </Text>
                    </View>
                  </View>

                  {/* Progress Bar for this course */}
                  <ProgressBar
                    progress={ensureSafeNumber(topCourse.accuracy_percentage)}
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
                    %{ensureSafeNumber(topCourse.accuracy_percentage)} doğruluk
                    oranı
                  </Text>
                </View>
              ) : (
                <EmptyState
                  icon='trophy'
                  title='Veri bulunamadı'
                  message='Henüz branş bazında çalışma verisi bulunmuyor.'
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
      </SlideInElement>
    );
  };

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
              coursesWithProgress[i].progress = ensureSafeNumber(
                courseProgress.progress,
              );
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

      // Refresh course-specific data if preferred course exists
      if (preferredCourse) {
        await fetchCourseAnalytics();
        await fetchCourseTopics();
        await fetchPerformanceData(); // Add performance data refresh
      }

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
  }, [
    fetchData,
    router,
    preferredCourse,
    fetchCourseAnalytics,
    fetchCourseTopics,
    fetchPerformanceData, // Add to dependencies
  ]);

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

  // Get difficulty color
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

  // Get difficulty text
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

  // Handle course modal close
  const handleCourseModalClose = () => {
    setShowCourseModal(false);
  };

  // Handle course selection
  const handleCourseSelected = () => {
    setShowCourseModal(false);
  };

  // Render topic analytics instead of progress
  const renderTopicAnalytics = (topic: TopicWithAnalytics) => {
    const analytics = topic.analytics;
    if (!analytics) return null;

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
              📚 {formatTimeFromSeconds(analytics.totalStudyTime)}
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
              🔁 {analytics.tekrarSayisi} tekrar
            </Text>
          </View>

          {/* Difficulty */}
          <View
            style={{
              backgroundColor: getDifficultyColor(analytics.difficultyRating),
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
              {getDifficultyText(analytics.difficultyRating)}
            </Text>
          </View>

          {/* Completion Status */}
          {analytics.isCompleted && (
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

        {/* Last Studied */}
        {analytics.lastStudied && (
          <Text
            style={{
              fontSize: 12,
              color: isDark ? Colors.gray[700] : Colors.gray[700],
              fontFamily: 'SecondaryFont-Regular',
            }}
          >
            Son çalışma:{' '}
            {new Date(analytics.lastStudied).toLocaleDateString('tr-TR')}
          </Text>
        )}
      </View>
    );
  };

  // ENHANCED: Render topic details editing form with simple text inputs like notes
  const renderTopicDetailsForm = (topic: TopicWithAnalytics) => {
    const isEditing = editingTopicId === topic.topic_id;
    const isUpdating = updatingTopic === topic.topic_id;

    if (!isEditing && !topic.details) {
      return (
        <View style={{ padding: Spacing[4], alignItems: 'center' }}>
          <Text
            style={{
              color: isDark ? Colors.gray[600] : Colors.gray[600],
              fontFamily: 'SecondaryFont-Regular',
              textAlign: 'center',
            }}
          >
            Bu konu için henüz detay bilgisi yok.
          </Text>
        </View>
      );
    }

    return (
      <View style={{}}>
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
                Konu Detayları:
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
                  Tekrar Sayısı: {topic.details?.tekrar_sayisi || 0}
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
                  {getDifficultyText(topic.details?.difficulty_rating || 1)}
                </Text>

                <View
                  style={{
                    borderBottomColor: Colors.white,
                    borderBottomWidth: 1,
                    marginBottom: Spacing[2],
                    width: '100%',
                  }}
                />

                {topic.details?.is_completed && (
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

            {/* Render Konu Kaynakları like Notes */}
            {topic.details?.konu_kaynaklari &&
              topic.details.konu_kaynaklari.length > 0 && (
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
                    {topic.details.konu_kaynaklari.join('\n')}
                  </Text>
                </View>
              )}

            {/* Render Soru Bankası Kaynakları like Notes */}
            {topic.details?.soru_bankasi_kaynaklari &&
              topic.details.soru_bankasi_kaynaklari.length > 0 && (
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
                    {topic.details.soru_bankasi_kaynaklari.join('\n')}
                  </Text>
                </View>
              )}

            {topic.details?.notes && (
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
                  {topic.details.notes}
                </Text>
              </View>
            )}

            <Button
              title='Düzenle'
              onPress={() => handleEditTopicDetails(topic)}
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
              Konu Detaylarını Düzenle
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
              value={editingDetails.tekrar_sayisi?.toString() || '0'}
              onChangeText={(text) =>
                setEditingDetails((prev) => ({
                  ...prev,
                  tekrar_sayisi: parseInt(text) || 0,
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
            <View
              style={{
                borderBottomColor: Colors.white,
                borderBottomWidth: 1,
                marginBottom: Spacing[2],
                width: '100%',
              }}
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
            <View
              style={{
                borderBottomColor: Colors.white,
                borderBottomWidth: 1,
                marginBottom: Spacing[2],
                width: '100%',
              }}
            />

            {/* Konu Kaynakları as text input like Notes */}
            <Input
              label='Konu Kaynakları:'
              value={
                Array.isArray(editingDetails.konu_kaynaklari)
                  ? editingDetails.konu_kaynaklari.join('\n')
                  : ''
              }
              onChangeText={(text) =>
                setEditingDetails((prev) => ({
                  ...prev,
                  konu_kaynaklari: text
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
            <View
              style={{
                borderBottomColor: Colors.white,
                borderBottomWidth: 1,
                marginBottom: Spacing[2],
                width: '100%',
              }}
            />

            {/* Soru Bankası Kaynakları as text input like Notes */}
            <Input
              label='Soru Bankası Kaynakları:'
              value={
                Array.isArray(editingDetails.soru_bankasi_kaynaklari)
                  ? editingDetails.soru_bankasi_kaynaklari.join('\n')
                  : ''
              }
              onChangeText={(text) =>
                setEditingDetails((prev) => ({
                  ...prev,
                  soru_bankasi_kaynaklari: text
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
            <View
              style={{
                borderBottomColor: Colors.white,
                borderBottomWidth: 1,
                marginBottom: Spacing[2],
                width: '100%',
              }}
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
            <View
              style={{
                borderBottomColor: Colors.white,
                borderBottomWidth: 1,
                marginBottom: Spacing[4],
                width: '100%',
              }}
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
              label='Konu tamamlandı'
              style={{ marginBottom: Spacing[4] }}
            />
            <View
              style={{
                borderBottomColor: Colors.white,
                borderBottomWidth: 1,
                marginBottom: Spacing[2],
                width: '100%',
              }}
            />

            <View style={{ flexDirection: 'row', gap: Spacing[2] }}>
              <Button
                title='Güncelle'
                onPress={handleSaveTopicDetails}
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
            tintColor={
              (preferredCourse as any)?.category &&
              getCourseColor((preferredCourse as any).category)
            }
            colors={[
              (preferredCourse as any)?.category &&
                getCourseColor((preferredCourse as any).category),
            ]}
            title='Yenileniyor...'
            titleColor={isDark ? Colors.gray[600] : Colors.gray[600]}
          />
        }
      >
        {/* Header with rearranged layout */}
        <SlideInElement direction='down' delay={0}>
          <View
            style={{
              flexDirection: 'column',
              marginBottom: Spacing[6],
            }}
          >
            {/* User info text */}
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

            {/* Bottom row - Streak (left) and Avatar (right) at same level */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: Spacing[4],
              }}
            >
              {/* Left side - Streak */}
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

              {/* Right side - Avatar */}
              <Avatar
                name={userData?.username?.charAt(0).toUpperCase() || 'Ö'}
                size='lg'
                bgColor={
                  (preferredCourse as any)?.category &&
                  getCourseColor((preferredCourse as any).category)
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

            {/* Bottom - Full width Chronometer */}
            {preferredCourse && (
              <StudyChronometer
                courseId={preferredCourse.course_id}
                courseTitle={preferredCourse.title}
                category={(preferredCourse as any)?.category}
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
                  // Optionally refresh analytics data here
                  fetchPerformanceData();
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
                (preferredCourse as any)?.category &&
                getCourseColor((preferredCourse as any).category)
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
            {/* Enhanced Continue studying card with collapsible functionality */}
            <SlideInElement direction='left' delay={200}>
              <PlayfulCard
                title='Çalışmaya Devam Et'
                style={{
                  marginBottom: Spacing[6],
                  shadowColor: Colors.gray[900],
                  shadowOffset: { width: 10, height: 20 },
                  shadowOpacity: 0.8,
                  shadowRadius: 10,
                  elevation: 10,
                }}
                titleFontFamily='PrimaryFont'
                variant='elevated'
                category={(preferredCourse as any)?.category}
                animated
                floatingAnimation
                collapsible
                defaultCollapsed={isStudyCardCollapsed}
                onCollapseToggle={setIsStudyCardCollapsed}
              >
                {preferredCourse ? (
                  <View>
                    {/* Course Analytics Section */}
                    <View style={{ marginBottom: Spacing[4] }}>
                      <Text
                        style={{
                          fontSize: 16,

                          color: isDark ? Colors.white : Colors.white,
                          marginBottom: Spacing[3],
                          fontFamily: 'SecondaryFont-Bold',
                        }}
                      >
                        {preferredCourse.title} - Genel Durum
                      </Text>

                      {studyStatistics && (
                        <View
                          style={{
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            gap: Spacing[2],
                            marginBottom: Spacing[3],
                          }}
                        >
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
                              {ensureSafeNumber(
                                studyStatistics.total_study_hours,
                              )}
                              saat çalışma
                            </Text>
                          </View>

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
                              {studyStatistics.unique_topics_studied} konu
                            </Text>
                          </View>

                          <View
                            style={{
                              backgroundColor: Colors.vibrant.orange,
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
                              {studyStatistics.current_streak_days} gün seri
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>

                    {/* Course Topics Section */}
                    <View>
                      <Text
                        style={{
                          fontSize: 16,

                          color: isDark ? Colors.white : Colors.white,
                          marginBottom: Spacing[3],
                          fontFamily: 'SecondaryFont-Bold',
                        }}
                      >
                        Konu Listesi
                      </Text>

                      {topicsLoading ? (
                        <View
                          style={{ alignItems: 'center', padding: Spacing[4] }}
                        >
                          <ActivityIndicator
                            size='small'
                            color={
                              (preferredCourse as any)?.category &&
                              getCourseColor((preferredCourse as any).category)
                            }
                          />
                          <Text
                            style={{
                              marginTop: Spacing[2],
                              color: isDark
                                ? Colors.gray[400]
                                : Colors.gray[400],
                              fontFamily: 'SecondaryFont-Regular',
                            }}
                          >
                            Konular yükleniyor...
                          </Text>
                        </View>
                      ) : courseTopics.length > 0 ? (
                        <View>
                          {courseTopics.map((topic, index) => (
                            <SlideInElement
                              key={topic.topic_id}
                              direction='right'
                              delay={300 + index * 100}
                            >
                              <PlayfulCard
                                title={topic.title}
                                variant='outlined'
                                category={(preferredCourse as any)?.category}
                                style={{
                                  marginBottom: Spacing[3],
                                  shadowColor: Colors.gray[900],
                                  shadowOffset: { width: 10, height: 20 },
                                  shadowOpacity: 0.8,
                                  shadowRadius: 10,
                                  elevation: 10,
                                }}
                                titleFontFamily='SecondaryFont-Bold'
                                collapsible
                                defaultCollapsed={!topic.isDetailsExpanded}
                                onCollapseToggle={() =>
                                  handleTopicDetailsToggle(topic.topic_id)
                                }
                              >
                                <View>
                                  {/* Topic Analytics instead of Progress */}
                                  {renderTopicAnalytics(topic)}

                                  {/* Topic Details */}
                                  {topic.isDetailsExpanded &&
                                    renderTopicDetailsForm(topic)}
                                </View>
                              </PlayfulCard>
                            </SlideInElement>
                          ))}
                        </View>
                      ) : (
                        <EmptyState
                          icon='book'
                          title='Konu bulunamadı'
                          message='Bu kurs için henüz konu tanımlanmamış.'
                          style={{
                            backgroundColor: isDark
                              ? Colors.white
                              : Colors.white,
                            padding: Spacing[4],
                            borderRadius: 8,
                          }}
                        />
                      )}
                    </View>
                  </View>
                ) : courses.length > 0 ? (
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
                              backgroundColor:
                                (preferredCourse as any)?.category &&
                                getCourseColor(
                                  (preferredCourse as any).category,
                                ),
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
                                {ensureSafeNumber(course.progress)}% tamamlandı
                              </Text>
                            </View>
                            <ProgressBar
                              progress={ensureSafeNumber(course.progress)}
                              height={8}
                              width='100%'
                              trackColor={isDark ? Colors.white : Colors.white}
                              progressColor={
                                (preferredCourse as any)?.category &&
                                getCourseColor(
                                  (preferredCourse as any).category,
                                )
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
            </SlideInElement>

            {/* NEW: General Performance Summary Section */}
            {!loading && renderPerformanceSummary()}
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
