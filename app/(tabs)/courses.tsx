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
  Card,
  EmptyState,
  Container,
  Title,
  Paragraph,
  ProgressBar,
  Button,
  Alert,
  Row,
  Column,
} from '../../components/ui';
import { Colors, Spacing } from '../../constants/theme';

// Define interface to extend Course with additional fields we need
interface CourseWithProgress extends Course {
  progress: number;
  iconName: string;
}

export default function CoursesScreen() {
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    if (titleLower.includes('periodont')) return 'bacteria';
    if (titleLower.includes('pedodonti')) return 'child';
    if (titleLower.includes('endodonti')) return 'syringe';
    if (titleLower.includes('ortodonti')) return 'exchange';

    // Default icon
    return 'book-medical';
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
          variant='primary'
          onPress={() => window.location.reload()}
        />
      </Container>
    );
  }

  return (
    <Container>
      <ScrollView style={{ flex: 1, padding: Spacing[4] }}>
        <View style={{ marginBottom: Spacing[6] }}>
          <Title level={2}>Kurslar</Title>
          <Paragraph color={isDark ? Colors.gray[400] : Colors.gray[600]}>
            Tüm kursları görüntüleyin ve çalışmaya devam edin
          </Paragraph>
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
            {courses.length > 0 ? (
              <View>
                {courses.map((course) => (
                  <TouchableOpacity
                    key={course.course_id}
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
                    onPress={() => {
                      // Navigation would go here
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
                ))}
              </View>
            ) : (
              <EmptyState
                icon='book'
                title='Henüz kurs yok'
                message='Yeni kurslar yakında eklenecektir.'
              />
            )}
          </>
        )}
      </ScrollView>
    </Container>
  );
}
