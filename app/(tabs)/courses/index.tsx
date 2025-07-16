// app/(tabs)/courses.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  useColorScheme,
  RefreshControl,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { courseService } from '../../../src/api';
import { Course } from '../../../src/types/models';
import {
  PlayfulCard,
  EmptyState,
  Container,
  PlayfulTitle,
  Paragraph,
  ProgressBar,
  PlayfulButton,
  PlayfulAlert,
  Row,
  Column,
  Avatar,
  Badge,
  GlassCard,
  ScoreDisplay,
  FloatingElement,
  SlideInElement,
  LinearGradient,
} from '../../../components/ui';
import {
  Colors,
  Spacing,
  BorderRadius,
  VIBRANT_COLORS,
  GRADIENTS,
  createVibrantStyle,
  createPlayfulShadow,
  getDifficultyColor,
} from '../../../components/ui';
import { globalStyles } from '../../../utils/styleUtils';
import { router } from 'expo-router';

// Define interface to extend Course with additional fields we need
interface CourseWithProgress extends Course {
  progress: number;
  iconName: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeEstimate: string;
  studentsCount: number;
}

export default function CoursesScreen() {
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<
    'all' | 'in-progress' | 'completed'
  >('all');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const fetchCourses = useCallback(async () => {
    try {
      setError(null);

      // Fetch courses from API
      const coursesResponse = await courseService.getAllCourses();

      // Map courses to include progress and icon
      const coursesWithProgress: CourseWithProgress[] = await Promise.all(
        coursesResponse.map(async (course) => {
          // Get progress for each course
          let progress = 0;
          try {
            const courseProgress = await courseService.getCourseProgress(
              course.course_id,
            );
            if (courseProgress) {
              progress = courseProgress.progress || 0;
            }
          } catch (err) {
            console.error(
              `Failed to fetch progress for course ${course.course_id}:`,
              err,
            );
          }

          return {
            ...course,
            progress,
            iconName: getIconForCourse(course.title),
            difficulty: getDifficultyForCourse(course.title),
            timeEstimate: getTimeEstimate(progress),
            studentsCount: Math.floor(Math.random() * 1000) + 100, // Mock data
          };
        }),
      );

      // Sort courses by progress (highest first)
      coursesWithProgress.sort((a, b) => b.progress - a.progress);

      setCourses(coursesWithProgress);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('Dersler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCourses();
    setRefreshing(false);
  }, [fetchCourses]);

  const handleRetry = useCallback(async () => {
    setLoading(true);
    await fetchCourses();
    setLoading(false);
  }, [fetchCourses]);

  useEffect(() => {
    async function initialFetch() {
      setLoading(true);
      await fetchCourses();
      setLoading(false);
    }

    initialFetch();
  }, [fetchCourses]);

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

  const getDifficultyForCourse = (
    title?: string,
  ): 'easy' | 'medium' | 'hard' => {
    const titleLower = title?.toLowerCase() || '';

    if (titleLower.includes('anatomi') || titleLower.includes('pedodonti'))
      return 'easy';
    if (titleLower.includes('patoloji') || titleLower.includes('endodonti'))
      return 'hard';
    return 'medium';
  };

  const getTimeEstimate = (progress: number): string => {
    if (progress >= 80) return '2-3 saat';
    if (progress >= 50) return '5-8 saat';
    if (progress >= 20) return '10-15 saat';
    return '20+ saat';
  };

  const getFilteredCourses = () => {
    switch (selectedFilter) {
      case 'in-progress':
        return courses.filter(
          (course) => course.progress > 0 && course.progress < 100,
        );
      case 'completed':
        return courses.filter((course) => course.progress >= 100);
      default:
        return courses;
    }
  };

  const FilterButton = ({
    filter,
    title,
  }: {
    filter: typeof selectedFilter;
    title: string;
  }) => (
    <TouchableOpacity
      style={{
        flex: 1,
        marginHorizontal: Spacing[1],
        paddingVertical: Spacing[2],
        paddingHorizontal: Spacing[2],
        borderRadius: BorderRadius.button,
        backgroundColor:
          selectedFilter === filter
            ? VIBRANT_COLORS.purple
            : isDark
            ? Colors.white
            : Colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 36,
      }}
      onPress={() => setSelectedFilter(filter)}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: selectedFilter === filter ? '600' : '500',
          color:
            selectedFilter === filter
              ? Colors.white
              : isDark
              ? Colors.gray[700]
              : Colors.gray[700],
          textAlign: 'center',
          fontFamily: 'SecondaryFont-Regular',
        }}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  if (error && !loading) {
    return (
      <Container
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: Spacing[4],
          backgroundColor: '#A29BFE',
        }}
      >
        <PlayfulAlert
          type='error'
          title='Hata'
          message={error}
          style={{ marginBottom: Spacing[4] }}
        />
        <PlayfulButton
          title='Yenile'
          variant='primary'
          onPress={handleRetry}
          icon='refresh'
          animated
        />
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
            tintColor={Colors.primary.DEFAULT}
            colors={[Colors.primary.DEFAULT]}
          />
        }
      >
        {/* Header Section */}
        <SlideInElement delay={0}>
          <PlayfulCard
            style={{ marginBottom: Spacing[6], backgroundColor: 'transparent' }}
          >
            <Row
              style={{ alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Column style={{ flex: 1 }}>
                <PlayfulTitle
                  level={1}
                  gradient='primary'
                  style={{ fontFamily: 'PrimaryFont', color: 'white' }}
                >
                  Dersler
                </PlayfulTitle>
                <Paragraph
                  color={isDark ? Colors.gray[100] : Colors.gray[100]}
                  style={{
                    fontFamily: 'SecondaryFont-Regular',
                  }}
                >
                  Tüm dersleri görüntüleyin ve çalışmaya devam edin
                </Paragraph>
              </Column>
              <Avatar size='md' name='📚' bgColor={VIBRANT_COLORS.purple} />
            </Row>
          </PlayfulCard>
        </SlideInElement>

        {/* Filter Buttons */}
        <SlideInElement delay={100}>
          <View style={{ marginBottom: Spacing[6] }}>
            <Row
              style={{
                marginBottom: Spacing[3],
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <FilterButton filter='all' title='Tümü' />
              <FilterButton filter='in-progress' title='Devam Eden' />
              <FilterButton filter='completed' title='Tamamlanan' />
            </Row>
          </View>
        </SlideInElement>

        {loading ? (
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              padding: Spacing[4],
            }}
          >
            <ActivityIndicator
              size='large'
              color={isDark ? Colors.vibrant.coral : Colors.vibrant.coral}
            />
            <Text
              style={{
                marginTop: Spacing[3],
                color: isDark ? Colors.white : Colors.white,
                fontFamily: 'SecondaryFont-Regular',
              }}
            >
              Dersler yükleniyor...
            </Text>
          </View>
        ) : (
          <>
            {getFilteredCourses().length > 0 ? (
              <View>
                {getFilteredCourses().map((course, index) => (
                  <SlideInElement
                    key={course.course_id}
                    delay={200 + index * 100}
                  >
                    <FloatingElement>
                      <PlayfulCard
                        style={[
                          {
                            backgroundColor: Colors.vibrant.orangeLight,
                            marginBottom: Spacing[4],
                            overflow: 'hidden',
                          },
                          createPlayfulShadow(
                            getDifficultyColor(course.difficulty),
                            'medium',
                          ),
                        ]}
                        animated
                      >
                        <TouchableOpacity
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                          }}
                          onPress={() => {
                            router.push(
                              `/(tabs)/courses/${course.course_id}` as any,
                            );
                            console.log('Course pressed:', course.course_id);
                          }}
                        >
                          {/* Course Icon */}
                          <View
                            style={{
                              width: 60,
                              height: 60,
                              borderRadius: BorderRadius.bubble,
                              backgroundColor: VIBRANT_COLORS.purple,
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: Spacing[4],
                            }}
                          >
                            <FontAwesome
                              name={course.iconName as any}
                              size={24}
                              color={Colors.white}
                            />
                          </View>

                          {/* Course Content */}
                          <Column style={{ flex: 1 }}>
                            {/* Title and Badge Row */}
                            <Row
                              style={{
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: Spacing[2],
                              }}
                            >
                              <Text
                                style={[
                                  globalStyles.textLg,
                                  globalStyles.fontSemibold,
                                  {
                                    color: isDark
                                      ? Colors.gray[800]
                                      : Colors.gray[800],
                                    flex: 1,
                                    marginRight: Spacing[2],
                                    fontFamily: 'SecondaryFont-Bold',
                                  },
                                ]}
                                numberOfLines={2}
                              >
                                {course.title}
                              </Text>
                              <Badge
                                text={course.difficulty}
                                variant={
                                  course.difficulty === 'easy'
                                    ? 'success'
                                    : course.difficulty === 'hard'
                                    ? 'error'
                                    : 'warning'
                                }
                                size='md'
                                fontFamily='SecondaryFont-Bold'
                              />
                            </Row>

                            {/* Progress Info */}
                            <Row
                              style={{
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: Spacing[2],
                              }}
                            >
                              <ScoreDisplay
                                score={course.progress}
                                maxScore={100}
                                label='%'
                                variant='horizontal'
                                size='small'
                                showProgress={false}
                                scoreFontFamily='SecondaryFont-Bold'
                                labelFontFamily='SecondaryFont-Bold'
                                maxScoreFontFamily='SecondaryFont-Bold'
                                animated
                              />
                              <Text
                                style={[
                                  globalStyles.textPrimary,
                                  {
                                    color: isDark
                                      ? Colors.gray[500]
                                      : Colors.gray[500],

                                    // marginBottom: 1,
                                    fontFamily: 'SecondaryFont-Bold',
                                  },
                                ]}
                              >
                                {course.timeEstimate} kaldı
                              </Text>
                            </Row>

                            {/* Progress Bar */}
                            <ProgressBar
                              progress={course.progress}
                              height={6}
                              width='100%'
                              trackColor={isDark ? Colors.white : Colors.white}
                              progressColor={getDifficultyColor(
                                course.difficulty,
                              )}
                              style={{
                                borderRadius: BorderRadius.button,
                                marginBottom: Spacing[2],
                              }}
                              animated
                            />

                            {/* Stats Row */}
                            <Row
                              style={{
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                            >
                              <Row style={{ alignItems: 'center' }}>
                                <FontAwesome
                                  name='users'
                                  size={12}
                                  color={
                                    isDark ? Colors.gray[800] : Colors.gray[800]
                                  }
                                  style={{ marginRight: Spacing[1] }}
                                />
                                <Text
                                  style={[
                                    globalStyles.textXs,
                                    {
                                      color: isDark
                                        ? Colors.gray[800]
                                        : Colors.gray[800],
                                    },
                                  ]}
                                >
                                  {course.studentsCount.toLocaleString()}{' '}
                                  öğrenci
                                </Text>
                              </Row>
                              <FontAwesome
                                name='chevron-right'
                                size={16}
                                color={
                                  isDark ? Colors.gray[800] : Colors.gray[800]
                                }
                              />
                            </Row>
                          </Column>
                        </TouchableOpacity>
                      </PlayfulCard>
                    </FloatingElement>
                  </SlideInElement>
                ))}
              </View>
            ) : (
              <SlideInElement delay={200}>
                <EmptyState
                  icon='book'
                  title={
                    selectedFilter === 'all'
                      ? 'Henüz ders yok'
                      : 'Bu kategoride ders yok'
                  }
                  message={
                    selectedFilter === 'all'
                      ? 'Yeni dersler yakında eklenecektir.'
                      : 'Farklı bir filtre seçmeyi deneyin.'
                  }
                  fontFamily='SecondaryFont-Regular'
                  buttonFontFamily='PrimaryFont'
                  titleFontFamily='PrimaryFont'
                />
              </SlideInElement>
            )}
          </>
        )}

        {/* Error display at bottom if there's an error but data is loaded */}
        {error && !loading && courses.length > 0 && (
          <PlayfulAlert
            type='warning'
            message='Veriler yenilenirken sorun yaşandı. Çekmek için aşağı kaydırın.'
            style={{ marginTop: Spacing[4] }}
          />
        )}

        {/* Bottom spacing to ensure content is fully visible */}
        <View style={{ height: Spacing[8] }} />
      </ScrollView>
    </View>
  );
}
