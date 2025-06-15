// app/courses/[id].tsx

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Container, Title, Paragraph } from '../../components/ui';
import { courseService } from '../../src/api';
import { Course } from '../../src/types/models';

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams(); // Gets the course ID from the URL
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const courseId = Number(id);
      const fetchCourse = async () => {
        setLoading(true);
        const courseData = await courseService.getCourseById(courseId);
        setCourse(courseData);
        setLoading(false);
      };
      fetchCourse();
    }
  }, [id]);

  if (loading) {
    return (
      <Container style={{ justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size='large' />
      </Container>
    );
  }

  if (!course) {
    return (
      <Container style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Title>Kurs Bulunamadı</Title>
      </Container>
    );
  }

  return (
    <Container>
      <ScrollView style={{ padding: 16 }}>
        <Title level={2}>{course.title}</Title>
        <Paragraph>{course.description}</Paragraph>
        {/* You can add more details here, like a list of topics */}
      </ScrollView>
    </Container>
  );
}
