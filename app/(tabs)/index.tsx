import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Card,
  Button,
  StatCard,
  EmptyState,
  Avatar,
  Badge,
  AppLink,
  Container,
  Title,
  Paragraph,
  Alert,
  ProgressBar,
  Row,
  Column,
} from '../../components/ui';
import {
  courseService,
  testService,
  duelService,
  achievementService,
  analyticsService,
} from '../../src/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Course, Test, Duel } from '../../src/types/models';
import { Colors, Spacing } from '../../constants/theme';

// Define interface to extend Course with additional fields we need
interface CourseWithProgress extends Course {
  progress: number;
  iconName: string;
}

// Extend Test interface with display properties
interface TestWithDetails extends Test {
  difficulty: string;
  // Now these properties should be present in your database
  // But we'll provide backup defaults if they're missing for any reason
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
  const [loading, setLoading] = useState(true);
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

  // Fetch all required data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all data in parallel
        const [
          coursesResponse,
          testsResponse,
          duelsResponse,
          achievementsResponse,
          analyticsResponse,
        ] = await Promise.all([
          courseService.getAllCourses(),
          testService.getAllTests(),
          duelService.getActiveDuels(),
          achievementService.getUserAchievements(),
          analyticsService.getUserPerformanceAnalytics(),
        ]);

        // Sort courses by progress descending
        const coursesWithProgress: CourseWithProgress[] = coursesResponse.map(
          (course) => {
            return {
              ...course,
              // If we have course progress data, use it, otherwise set to 0
              progress: 0, // Will be updated if we have course progress data
              iconName: getIconForCourse(course.title), // Helper function to map course to icon
            };
          },
        );

        // Try to get progress for each course
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
          }
        }

        // Sort courses by progress (highest first)
        coursesWithProgress.sort((a, b) => b.progress - a.progress);

        // Take top 3 courses for the homepage
        setCourses(coursesWithProgress.slice(0, 3));

        // Sort tests by difficulty
        const testsWithDetails: TestWithDetails[] = testsResponse.map(
          (test) => {
            return {
              ...test,
              difficulty: getDifficultyLabel(test.difficulty_level || 2),
              // Map question_count to questionCount for the UI
              questionCount: test.question_count || 0,
              // Map time_limit to timeLimit for the UI
              timeLimit: test.time_limit || 30,
            };
          },
        );
        setTests(testsWithDetails.slice(0, 2)); // Take just 2 tests for the homepage

        setActiveDuels(duelsResponse.slice(0, 3)); // Just take top 3 for the homepage
        setUserAchievements(achievementsResponse.slice(0, 3)); // Just take the most recent 3
        setAnalyticsData(analyticsResponse);
      } catch (error) {
        console.error('Error fetching homepage data:', error);
        setError('Veri yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
    if (titleLower.includes('periodont')) return 'bacteria';
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

  if (error) {
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
        <Button
          title='Yenile'
          onPress={() => window.location.reload()}
          variant='primary'
        />
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
        paddingVertical: Spacing[4],
      }}
    >
      {/* Welcome message and streak */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: Spacing[6],
        }}
      >
        <View>
          <Title level={2} style={{ marginBottom: Spacing[1] }}>
            Merhaba {userData?.username || 'Öğrenci'}!
          </Title>
          <Paragraph color={isDark ? Colors.gray[400] : Colors.gray[600]}>
            DUS sınavına hazırlanmaya devam edelim
          </Paragraph>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: isDark
              ? Colors.primary.dark
              : Colors.primary.light,
            borderRadius: 999,
            paddingHorizontal: Spacing[3],
            paddingVertical: Spacing[1],
          }}
        >
          <FontAwesome name='fire' size={16} color={Colors.secondary.DEFAULT} />
          <Text
            style={{
              marginLeft: Spacing[2],
              fontWeight: '500',
              color: isDark ? Colors.white : Colors.gray[800],
            }}
          >
            {analyticsData?.studySessions || 0} gün
          </Text>
        </View>
      </View>

      {loading ? (
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            padding: Spacing[4],
          }}
        >
          <ActivityIndicator size='large' color={Colors.primary.DEFAULT} />
        </View>
      ) : (
        <>
          {/* User statistics */}
          <Row
            style={{
              justifyContent: 'space-between',
              flexWrap: 'wrap',
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
              color={Colors.primary.DEFAULT}
            />
            <StatCard
              icon='check-circle'
              title='Çözülen Sorular'
              value={(analyticsData?.totalQuestionsAnswered || 0).toString()}
              color={Colors.info}
            />
            <StatCard
              icon='trophy'
              title='Düello Skoru'
              value={calculateDuelScore()}
              color={Colors.secondary.DEFAULT}
            />
          </Row>

          {/* Continue studying */}
          <Card title='Çalışmaya Devam Et' style={{ marginBottom: Spacing[6] }}>
            {courses.length > 0 ? (
              courses.map((course) => (
                <AppLink
                  key={course.course_id}
                  href={`/courses/${course.course_id}`}
                >
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: Spacing[3],
                      backgroundColor: isDark
                        ? Colors.gray[700]
                        : Colors.gray[50],
                      borderRadius: 8,
                      marginBottom: Spacing[3],
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: Colors.primary.DEFAULT,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: Spacing[3],
                      }}
                    >
                      <FontAwesome
                        name={course.iconName as any}
                        size={20}
                        color={Colors.white}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontWeight: '600',
                          color: isDark ? Colors.white : Colors.gray[800],
                          marginBottom: Spacing[1],
                        }}
                      >
                        {course.title}
                      </Text>
                      <View
                        style={{ flexDirection: 'row', alignItems: 'center' }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            color: isDark ? Colors.gray[400] : Colors.gray[500],
                            marginBottom: Spacing[1],
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
                          isDark ? Colors.gray[700] : Colors.gray[200]
                        }
                        progressColor={Colors.primary.DEFAULT}
                        style={{ borderRadius: 4 }}
                      />
                    </View>
                    <FontAwesome
                      name='chevron-right'
                      size={16}
                      color={isDark ? Colors.gray[400] : Colors.gray[500]}
                    />
                  </TouchableOpacity>
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
                }}
              />
            )}
            <AppLink href='/courses'>
              <Button
                title='Tüm Kursları Gör'
                onPress={() => {}} // No-op function since AppLink handles navigation
                variant='outline'
                style={{ marginTop: Spacing[2] }}
              />
            </AppLink>
          </Card>

          {/* Recent Tests */}
          <Card title='Popüler Testler' style={{ marginBottom: Spacing[6] }}>
            {tests.length > 0 ? (
              tests.map((test) => (
                <AppLink key={test.test_id} href={`/tests/${test.test_id}`}>
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: Spacing[3],
                      backgroundColor: isDark
                        ? Colors.gray[700]
                        : Colors.gray[50],
                      borderRadius: 8,
                      marginBottom: Spacing[3],
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: Colors.info,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: Spacing[3],
                      }}
                    >
                      <FontAwesome
                        name='question-circle'
                        size={20}
                        color={Colors.white}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontWeight: '600',
                          color: isDark ? Colors.white : Colors.gray[800],
                          marginBottom: Spacing[1],
                        }}
                      >
                        {test.title}
                      </Text>
                      <View
                        style={{ flexDirection: 'row', alignItems: 'center' }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            color: isDark ? Colors.gray[400] : Colors.gray[500],
                          }}
                        >
                          {test.questionCount || 0} soru • {test.timeLimit || 0}{' '}
                          dakika •
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
                          }}
                        >
                          {test.difficulty}
                        </Text>
                      </View>
                    </View>
                    <Button
                      title='Başla'
                      variant='primary'
                      onPress={() => {}} // No-op function since AppLink handles navigation
                      style={{
                        paddingHorizontal: Spacing[3],
                        paddingVertical: Spacing[1],
                      }}
                    />
                  </TouchableOpacity>
                </AppLink>
              ))
            ) : (
              <EmptyState
                icon='file'
                title='Test bulunamadı'
                message='Testler sekmesinden testlere erişebilirsiniz.'
              />
            )}
            <AppLink href='/tests'>
              <Button
                title='Tüm Testleri Gör'
                onPress={() => {}} // No-op function since AppLink handles navigation
                variant='outline'
                style={{ marginTop: Spacing[2] }}
              />
            </AppLink>
          </Card>

          {/* Active Duels */}
          <Card title='Aktif Düellolar' style={{ marginBottom: Spacing[6] }}>
            {activeDuels.length > 0 ? (
              activeDuels.map((duel) => (
                <AppLink key={duel.duel_id} href={`/duels/${duel.duel_id}`}>
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: Spacing[3],
                      backgroundColor: isDark
                        ? Colors.gray[700]
                        : Colors.gray[50],
                      borderRadius: 8,
                      marginBottom: Spacing[3],
                    }}
                  >
                    <Avatar
                      name={getOpponentAvatarInitial(duel)}
                      size='md'
                      bgColor={Colors.secondary.DEFAULT}
                    />
                    <View style={{ flex: 1, marginLeft: Spacing[3] }}>
                      <Text
                        style={{
                          fontWeight: '600',
                          color: isDark ? Colors.white : Colors.gray[800],
                          marginBottom: Spacing[1],
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
                    <Button
                      title={duel.status === 'active' ? 'Oyna' : 'Görüntüle'}
                      variant={duel.status === 'active' ? 'primary' : 'outline'}
                      onPress={() => {}} // No-op function since AppLink handles navigation
                      style={{
                        paddingHorizontal: Spacing[3],
                        paddingVertical: Spacing[1],
                      }}
                    />
                  </TouchableOpacity>
                </AppLink>
              ))
            ) : (
              <EmptyState
                icon='users'
                title='Aktif düello yok'
                message='Arkadaşlarınızı düelloya davet edin ve rekabeti başlatın.'
                actionButton={{
                  title: 'Düello Başlat',
                  onPress: () => router.push('/duel/new' as any),
                }}
              />
            )}
            <AppLink href='/duels'>
              <Button
                title='Tüm Düelloları Gör'
                onPress={() => {}} // No-op function since AppLink handles navigation
                variant='outline'
                style={{ marginTop: Spacing[2] }}
              />
            </AppLink>
          </Card>

          {/* Recent Achievements */}
          <Card title='Son Başarılar'>
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
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: isDark
                          ? Colors.primary.dark
                          : Colors.primary.light,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: Spacing[2],
                      }}
                    >
                      <FontAwesome
                        name={getAchievementIcon(achievement)}
                        size={24}
                        color={Colors.primary.DEFAULT}
                      />
                    </View>
                    <Text
                      style={{
                        fontSize: 12,
                        textAlign: 'center',
                        color: isDark ? Colors.gray[300] : Colors.gray[700],
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
                  message='Daha fazla çalıştıkça başarılar kazanacaksınız.'
                />
              )}
            </View>
            {userAchievements.length > 0 && (
              <AppLink href='/profile'>
                <Button
                  title='Tüm Başarılar'
                  onPress={() => {}} // No-op function since AppLink handles navigation
                  variant='outline'
                  style={{ marginTop: Spacing[4] }}
                />
              </AppLink>
            )}
          </Card>
        </>
      )}
    </ScrollView>
  );
}
