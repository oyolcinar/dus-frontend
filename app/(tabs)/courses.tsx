// app/(tabs)/courses.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { courseService } from '../../src/api';
import { Course } from '../../src/types/models';
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
} from '../../components/ui';
import {
  Colors,
  Spacing,
  BorderRadius,
  VIBRANT_COLORS,
  GRADIENTS,
  createVibrantStyle,
  createPlayfulShadow,
  getDifficultyColor,
} from '../../components/ui';
import { globalStyles } from '../../utils/styleUtils';

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
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<
    'all' | 'in-progress' | 'completed'
  >('all');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    async function fetchCourses() {
      try {
        setLoading(true);
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
        setError('Kurslar yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, []);

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
    <PlayfulButton
      title={title}
      variant={selectedFilter === filter ? 'vibrant' : 'ghost'}
      size='small'
      onPress={() => setSelectedFilter(filter)}
      style={{ marginRight: Spacing[2] }}
    />
  );

  if (error) {
    return (
      <Container
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          padding: Spacing[4],
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
          onPress={() => window.location.reload()}
        />
      </Container>
    );
  }

  return (
    <Container>
      <ScrollView style={{ flex: 1, padding: Spacing[4] }}>
        {/* Header Section */}
        <SlideInElement delay={0}>
          <GlassCard style={{ marginBottom: Spacing[6] }}>
            <Row
              style={{ alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Column style={{ flex: 1 }}>
                <PlayfulTitle level={1} gradient='primary'>
                  Kurslar
                </PlayfulTitle>
                <Paragraph color={isDark ? Colors.gray[400] : Colors.gray[600]}>
                  Tüm kursları görüntüleyin ve çalışmaya devam edin
                </Paragraph>
              </Column>
              {/* FIX 1: Removed backgroundColor prop and used bgColor instead */}
              <Avatar size='md' name='📚' bgColor={VIBRANT_COLORS.purple} />
            </Row>
          </GlassCard>
        </SlideInElement>

        {/* Filter Buttons */}
        <SlideInElement delay={100}>
          <View style={{ marginBottom: Spacing[6] }}>
            <Row style={{ marginBottom: Spacing[3] }}>
              <FilterButton filter='all' title='Tümü' />
              <FilterButton filter='in-progress' title='Devam Eden' />
              <FilterButton filter='completed' title='Tamamlanan' />
            </Row>
          </View>
        </SlideInElement>

        {loading ? (
          <SlideInElement delay={200}>
            <GlassCard style={{ padding: Spacing[8] }}>
              <View style={{ alignItems: 'center' }}>
                <ActivityIndicator size='large' color={VIBRANT_COLORS.purple} />
                <Text
                  style={[
                    globalStyles.textBase,
                    {
                      color: isDark ? Colors.white : Colors.gray[600],
                      marginTop: Spacing[3],
                    },
                  ]}
                >
                  Kurslar yükleniyor...
                </Text>
              </View>
            </GlassCard>
          </SlideInElement>
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
                            marginBottom: Spacing[4],
                            overflow: 'hidden',
                          },
                          createPlayfulShadow(
                            getDifficultyColor(course.difficulty),
                            'medium',
                          ),
                        ]}
                      >
                        <TouchableOpacity
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                          }}
                          onPress={() => {
                            // Navigation would go here
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
                                      ? Colors.white
                                      : Colors.gray[800],
                                    flex: 1,
                                  },
                                ]}
                                numberOfLines={2}
                              >
                                {course.title}
                              </Text>
                              {/* FIX 2: Changed size from "small" to "sm" */}
                              <Badge
                                text={course.difficulty}
                                variant={
                                  course.difficulty === 'easy'
                                    ? 'success'
                                    : course.difficulty === 'hard'
                                    ? 'error'
                                    : 'warning'
                                }
                                size='sm'
                              />
                            </Row>

                            {/* Progress Info */}
                            <Row
                              style={{
                                alignItems: 'center',
                                marginBottom: Spacing[2],
                              }}
                            >
                              <ScoreDisplay
                                score={course.progress}
                                maxScore={100}
                                label='%'
                                size='small'
                                variant='default'
                                style={{ marginRight: Spacing[3] }}
                              />
                              <Text
                                style={[
                                  globalStyles.textSm,
                                  {
                                    color: isDark
                                      ? Colors.gray[400]
                                      : Colors.gray[500],
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
                              trackColor={
                                isDark ? Colors.gray[700] : Colors.gray[200]
                              }
                              progressColor={getDifficultyColor(
                                course.difficulty,
                              )}
                              style={{
                                borderRadius: BorderRadius.button,
                                marginBottom: Spacing[2],
                              }}
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
                                    isDark ? Colors.gray[400] : Colors.gray[500]
                                  }
                                  style={{ marginRight: Spacing[1] }}
                                />
                                <Text
                                  style={[
                                    globalStyles.textXs,
                                    {
                                      color: isDark
                                        ? Colors.gray[400]
                                        : Colors.gray[500],
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
                                  isDark ? Colors.gray[400] : Colors.gray[500]
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
                      ? 'Henüz kurs yok'
                      : 'Bu kategoride kurs yok'
                  }
                  message={
                    selectedFilter === 'all'
                      ? 'Yeni kurslar yakında eklenecektir.'
                      : 'Farklı bir filtre seçmeyi deneyin.'
                  }
                />
              </SlideInElement>
            )}
          </>
        )}
      </ScrollView>
    </Container>
  );
}
