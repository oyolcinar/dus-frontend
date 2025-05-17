// app/(tabs)/tests.tsx
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
import { testService } from '../../src/api';
import { Test } from '../../src/types/models';
import {
  Card,
  Button,
  EmptyState,
  Badge,
  Container,
  Title,
  Paragraph,
  Alert,
  Row,
} from '../../components/ui';
import { Colors, Spacing } from '../../constants/theme';

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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
        return Colors.success;
      case 'Orta':
        return Colors.warning;
      case 'Zor':
      case 'Çok Zor':
      case 'Uzman':
        return Colors.error;
      default:
        return Colors.info;
    }
  };

  // Filter tests by difficulty
  const filteredTests = filter
    ? tests.filter((test) => test.difficulty === filter)
    : tests;

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
          <Title level={2}>Testler</Title>
          <Paragraph color={isDark ? Colors.gray[400] : Colors.gray[600]}>
            Sınavlara hazırlanmak için testleri çözün
          </Paragraph>
        </View>

        {/* Filter buttons */}
        <Row style={{ marginBottom: Spacing[4], flexWrap: 'wrap' }}>
          <TouchableOpacity
            style={{
              marginRight: Spacing[2],
              marginBottom: Spacing[2],
              paddingHorizontal: Spacing[3],
              paddingVertical: Spacing[1],
              borderRadius: 9999,
              backgroundColor:
                filter === null
                  ? Colors.primary.DEFAULT
                  : isDark
                  ? Colors.gray[700]
                  : Colors.gray[200],
            }}
            onPress={() => setFilter(null)}
          >
            <Text
              style={{
                color:
                  filter === null
                    ? Colors.white
                    : isDark
                    ? Colors.gray[300]
                    : Colors.gray[700],
              }}
            >
              Tümü
            </Text>
          </TouchableOpacity>
          {['Kolay', 'Orta', 'Zor', 'Çok Zor', 'Uzman'].map((difficulty) => (
            <TouchableOpacity
              key={difficulty}
              style={{
                marginRight: Spacing[2],
                marginBottom: Spacing[2],
                paddingHorizontal: Spacing[3],
                paddingVertical: Spacing[1],
                borderRadius: 9999,
                backgroundColor:
                  filter === difficulty
                    ? Colors.primary.DEFAULT
                    : isDark
                    ? Colors.gray[700]
                    : Colors.gray[200],
              }}
              onPress={() => setFilter(difficulty)}
            >
              <Text
                style={{
                  color:
                    filter === difficulty
                      ? Colors.white
                      : isDark
                      ? Colors.gray[300]
                      : Colors.gray[700],
                }}
              >
                {difficulty}
              </Text>
            </TouchableOpacity>
          ))}
        </Row>

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
            {filteredTests.length > 0 ? (
              <View>
                {filteredTests.map((test) => (
                  <TouchableOpacity
                    key={test.test_id}
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
                      style={{
                        paddingHorizontal: Spacing[3],
                        paddingVertical: Spacing[1],
                      }}
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
    </Container>
  );
}
