// app/(tabs)/courses.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { courseService } from '../../src/api';
import { Course } from '../../src/types/models';
import { Card, EmptyState } from '../../components/ui';

// Define interface to extend Course with additional fields we need
interface CourseWithProgress extends Course {
  progress: number;
  iconName: string;
}

export default function CoursesScreen() {
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Format course progress bar
  const renderProgressBar = (progress: number) => {
    return (
      <View className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1'>
        <View
          className='bg-primary rounded-full h-2'
          style={{ width: `${progress}%` }}
        />
      </View>
    );
  };

  if (error) {
    return (
      <View className='flex-1 justify-center items-center p-4'>
        <Text className='text-red-500 text-center mb-4'>{error}</Text>
        <TouchableOpacity
          className='bg-primary px-4 py-2 rounded-lg'
          onPress={() => window.location.reload()}
        >
          <Text className='text-white'>Yenile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className='flex-1 p-4'>
      <View className='mb-6'>
        <Text className='text-2xl font-bold text-gray-900 dark:text-white'>
          Kurslar
        </Text>
        <Text className='text-gray-600 dark:text-gray-400'>
          Tüm kursları görüntüleyin ve çalışmaya devam edin
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size='large' color='var(--color-primary)' />
      ) : (
        <>
          {courses.length > 0 ? (
            <View>
              {courses.map((course) => (
                <TouchableOpacity
                  key={course.course_id}
                  className='flex-row items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg mb-3'
                  onPress={() => {
                    // Navigation would go here
                  }}
                >
                  <View className='w-10 h-10 rounded-full bg-primary flex items-center justify-center mr-3'>
                    <FontAwesome
                      name={course.iconName as any}
                      size={20}
                      color='white'
                    />
                  </View>
                  <View className='flex-1'>
                    <Text className='font-semibold text-gray-800 dark:text-white'>
                      {course.title}
                    </Text>
                    <View className='flex-row items-center'>
                      <Text className='text-xs text-gray-500 dark:text-gray-400'>
                        {course.progress}% tamamlandı
                      </Text>
                    </View>
                    {renderProgressBar(course.progress)}
                  </View>
                  <FontAwesome
                    name='chevron-right'
                    size={16}
                    color='var(--color-text-muted-light)'
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
  );
}
