// app/(tabs)/tests.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { testService } from '../../src/api';
import { Test } from '../../src/types/models';
import { Card, Button, EmptyState, Badge } from '../../components/ui';

// Extend Test interface with display properties
interface TestWithDetails extends Test {
  difficulty: string;
  questionCount?: number;
  timeLimit?: number;
}

export default function TestsScreen() {
  const [tests, setTests] = useState<TestWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTests() {
      try {
        setLoading(true);
        setError(null);

        // Fetch tests from API
        const testsResponse = await testService.getAllTests();

        // Map tests to include details
        const testsWithDetails: TestWithDetails[] = testsResponse.map(
          (test) => {
            return {
              ...test,
              difficulty: getDifficultyLabel(test.difficulty_level || 2),
              questionCount: test.question_count || 0,
              timeLimit: test.time_limit || 30,
            };
          },
        );

        setTests(testsWithDetails);
      } catch (error) {
        console.error('Error fetching tests:', error);
        setError('Testler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    }

    fetchTests();
  }, []);

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

  // Get color for difficulty badge
  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'Kolay':
        return 'var(--color-success)';
      case 'Orta':
        return 'var(--color-warning)';
      case 'Zor':
      case 'Çok Zor':
      case 'Uzman':
        return 'var(--color-error)';
      default:
        return 'var(--color-info)';
    }
  };

  // Filter tests by difficulty
  const filteredTests = filter
    ? tests.filter((test) => test.difficulty === filter)
    : tests;

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
          Testler
        </Text>
        <Text className='text-gray-600 dark:text-gray-400'>
          Sınavlara hazırlanmak için testleri çözün
        </Text>
      </View>

      {/* Filter buttons */}
      <View className='flex-row mb-4 flex-wrap'>
        <TouchableOpacity
          className={`mr-2 mb-2 px-3 py-1 rounded-full ${
            filter === null ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
          }`}
          onPress={() => setFilter(null)}
        >
          <Text
            className={
              filter === null
                ? 'text-white'
                : 'text-gray-700 dark:text-gray-300'
            }
          >
            Tümü
          </Text>
        </TouchableOpacity>
        {['Kolay', 'Orta', 'Zor', 'Çok Zor', 'Uzman'].map((difficulty) => (
          <TouchableOpacity
            key={difficulty}
            className={`mr-2 mb-2 px-3 py-1 rounded-full ${
              filter === difficulty
                ? 'bg-primary'
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
            onPress={() => setFilter(difficulty)}
          >
            <Text
              className={
                filter === difficulty
                  ? 'text-white'
                  : 'text-gray-700 dark:text-gray-300'
              }
            >
              {difficulty}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size='large' color='var(--color-primary)' />
      ) : (
        <>
          {filteredTests.length > 0 ? (
            <View>
              {filteredTests.map((test) => (
                <TouchableOpacity
                  key={test.test_id}
                  className='flex-row items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg mb-3'
                  onPress={() => {
                    // Navigation would go here
                  }}
                >
                  <View className='w-10 h-10 rounded-full bg-info flex items-center justify-center mr-3'>
                    <FontAwesome
                      name='question-circle'
                      size={20}
                      color='white'
                    />
                  </View>
                  <View className='flex-1'>
                    <Text className='font-semibold text-gray-800 dark:text-white'>
                      {test.title}
                    </Text>
                    <View className='flex-row items-center'>
                      <Text className='text-xs text-gray-500 dark:text-gray-400'>
                        {test.questionCount || 0} soru • {test.timeLimit || 0}{' '}
                        dakika •
                      </Text>
                      <Text
                        className='text-xs ml-1'
                        style={{
                          color: getDifficultyColor(test.difficulty),
                        }}
                      >
                        {test.difficulty}
                      </Text>
                    </View>
                  </View>
                  <Button
                    title='Başla'
                    variant='primary'
                    onPress={() => {
                      // Navigation would go here
                    }}
                    className='px-3 py-1'
                  />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <EmptyState
              icon='file'
              title='Test bulunamadı'
              message={
                filter
                  ? `"${filter}" zorluğunda test bulunamadı.`
                  : 'Henüz test eklenmemiş.'
              }
            />
          )}
        </>
      )}
    </ScrollView>
  );
}
