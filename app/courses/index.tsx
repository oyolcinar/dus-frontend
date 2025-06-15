// app/courses/index.tsx - Courses listing screen
import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Container,
  Title,
  CourseCard,
  EmptyState,
  Spinner,
} from '../../components/ui';
import { courseService } from '../../src/api';
import { Course } from '@/src/types/models';

export default function CoursesScreen() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const coursesData = await courseService.getAllCourses();
      setCourses(coursesData);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Spinner />
      </Container>
    );
  }

  return (
    <Container>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        <Title level={2}>Kurslar</Title>

        {courses.length > 0 ? (
          courses.map((course) => (
            <CourseCard
              key={course.course_id}
              {...course}
              onPress={() =>
                router.push({
                  pathname: '/courses/[id]' as any,
                  params: { id: course.course_id },
                })
              }
            />
          ))
        ) : (
          <EmptyState
            icon='book'
            title='Henüz kurs yok'
            message='Yakında kurslar eklenecek.'
          />
        )}
      </ScrollView>
    </Container>
  );
}
