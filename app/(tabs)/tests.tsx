// app/(tabs)/tests.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { testService } from '../../src/api';
import { Test } from '../../src/types/models';
import {
  PlayfulCard,
  QuizCard,
  PlayfulButton,
  EmptyState,
  Badge,
  Container,
  Title,
  Paragraph,
  Alert,
  Row,
  Column,
  StatCard,
  AnimatedCounter,
  GlassCard,
} from '../../components/ui';
import { Colors, Spacing, FontSizes } from '../../constants/theme';

// Extend Test interface with display properties
interface TestWithDetails extends Test {
  difficulty: string;
  questionCount?: number;
  timeLimit?: number;
}

export default function TestsScreen() {
  const router = useRouter();
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
        return Colors.vibrant?.green || Colors.success;
      case 'Orta':
        return Colors.vibrant?.yellow || Colors.warning;
      case 'Zor':
        return Colors.vibrant?.orange || Colors.error;
      case 'Çok Zor':
        return Colors.vibrant?.pink || Colors.error;
      case 'Uzman':
        return Colors.vibrant?.purple || Colors.error;
      default:
        return Colors.vibrant?.blue || Colors.info;
    }
  };

  // Get variant for difficulty
  const getDifficultyVariant = (
    difficulty: string,
  ): 'success' | 'warning' | 'error' | 'info' => {
    switch (difficulty) {
      case 'Kolay':
        return 'success';
      case 'Orta':
        return 'warning';
      case 'Zor':
      case 'Çok Zor':
      case 'Uzman':
        return 'error';
      default:
        return 'info';
    }
  };

  // Convert Turkish difficulty to QuizCard expected format
  const mapDifficultyToQuizCard = (
    difficulty: string,
  ): 'easy' | 'medium' | 'hard' => {
    switch (difficulty) {
      case 'Kolay':
        return 'easy';
      case 'Orta':
        return 'medium';
      case 'Zor':
      case 'Çok Zor':
      case 'Uzman':
        return 'hard';
      default:
        return 'medium';
    }
  };

  // Get icon for test category
  const getTestIcon = (test: TestWithDetails): any => {
    const title = test.title?.toLowerCase() || '';

    if (title.includes('anatomi')) return 'tooth';
    if (title.includes('patoloji')) return 'microscope';
    if (title.includes('cerrahi')) return 'cut';
    if (title.includes('protez')) return 'cogs';
    if (title.includes('periodon')) return 'bacteria';
    if (title.includes('pedodon')) return 'child';
    if (title.includes('endodon')) return 'syringe';
    if (title.includes('ortodon')) return 'exchange';

    return 'question-circle';
  };

  // Filter tests by difficulty
  const filteredTests = filter
    ? tests.filter((test) => test.difficulty === filter)
    : tests;

  // Get stats
  const totalTests = tests.length;
  const averageQuestions = Math.round(
    tests.reduce((sum, test) => sum + (test.questionCount || 0), 0) /
      totalTests || 0,
  );
  const hardTests = tests.filter((test) =>
    ['Zor', 'Çok Zor', 'Uzman'].includes(test.difficulty),
  ).length;

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
        {/* Header with animated title */}
        <PlayfulCard
          variant='gradient'
          gradient='ocean'
          padding='large'
          animated
          floatingAnimation
          style={{ marginBottom: Spacing[6] }}
        >
          <Row
            style={{ justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Column style={{ flex: 1 }}>
              <Title
                level={1}
                style={{
                  color: Colors.white,
                  marginBottom: Spacing[2],
                  fontSize: FontSizes['4xl'],
                }}
              >
                Testler 📝
              </Title>
              <Paragraph style={{ color: Colors.white, opacity: 0.9 }}>
                Sınavlara hazırlanmak için testleri çözün
              </Paragraph>
            </Column>
            <AnimatedCounter
              value={totalTests}
              size='large'
              variant='vibrant'
            />
          </Row>
        </PlayfulCard>

        {/* Stats Cards */}
        <Row
          style={{
            marginBottom: Spacing[6],
            flexWrap: 'wrap',
            gap: Spacing[3],
          }}
        >
          <StatCard
            icon='file'
            title='Toplam Test'
            value={totalTests.toString()}
            color={Colors.vibrant?.blue || Colors.info}
          />
          <StatCard
            icon='question'
            title='Ortalama Soru'
            value={averageQuestions.toString()}
            color={Colors.vibrant?.green || Colors.success}
          />
          <StatCard
            icon='fire'
            title='Zor Testler'
            value={hardTests.toString()}
            color={Colors.vibrant?.orange || Colors.error}
          />
        </Row>

        {/* Filter buttons */}
        <GlassCard style={{ marginBottom: Spacing[6], padding: Spacing[4] }}>
          <Title level={3} style={{ marginBottom: Spacing[3] }}>
            Zorluk Filtresi
          </Title>
          <Row style={{ flexWrap: 'wrap', gap: Spacing[2] }}>
            <PlayfulButton
              title='Tümü'
              variant={filter === null ? 'primary' : 'outline'}
              size='small'
              onPress={() => setFilter(null)}
              animated
            />
            {['Kolay', 'Orta', 'Zor', 'Çok Zor', 'Uzman'].map((difficulty) => (
              <PlayfulButton
                key={difficulty}
                title={difficulty}
                variant={filter === difficulty ? 'primary' : 'outline'}
                size='small'
                onPress={() => setFilter(difficulty)}
                animated
              />
            ))}
          </Row>
        </GlassCard>

        {loading ? (
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              padding: Spacing[8],
            }}
          >
            <ActivityIndicator size='large' color={Colors.primary.DEFAULT} />
          </View>
        ) : (
          <>
            {filteredTests.length > 0 ? (
              <View>
                {filteredTests.map((test) => (
                  <View key={test.test_id} style={{ marginBottom: Spacing[4] }}>
                    <QuizCard
                      title={test.title || 'Test'}
                      description={`${test.questionCount || 0} soru • ${
                        test.timeLimit || 0
                      } dakika`}
                      difficulty={mapDifficultyToQuizCard(test.difficulty)}
                      questionCount={test.questionCount || 0}
                      estimatedTime={test.timeLimit || 0}
                      onPress={() =>
                        router.push(`/tests/${test.test_id}` as any)
                      }
                    />

                    {/* Additional content below QuizCard */}
                    <PlayfulCard
                      variant='glass'
                      padding='small'
                      style={{
                        marginTop: -Spacing[2],
                        marginHorizontal: Spacing[2],
                        borderTopLeftRadius: 0,
                        borderTopRightRadius: 0,
                      }}
                    >
                      <Row
                        style={{
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Badge
                          text={test.difficulty}
                          variant={getDifficultyVariant(test.difficulty)}
                          size='sm'
                        />

                        <Row style={{ gap: Spacing[2] }}>
                          <PlayfulButton
                            title='Önizle'
                            variant='outline'
                            size='small'
                            onPress={() =>
                              router.push(
                                `/tests/${test.test_id}/preview` as any,
                              )
                            }
                          />
                          <PlayfulButton
                            title='Başla'
                            variant='primary'
                            size='small'
                            gradient='success'
                            onPress={() =>
                              router.push(`/tests/${test.test_id}` as any)
                            }
                            animated
                          />
                        </Row>
                      </Row>
                    </PlayfulCard>
                  </View>
                ))}
              </View>
            ) : (
              <PlayfulCard
                variant='glass'
                animated
                floatingAnimation
                style={{ marginTop: Spacing[4] }}
              >
                <EmptyState
                  icon='file'
                  title='Test bulunamadı'
                  message={
                    filter
                      ? `"${filter}" zorluğunda test bulunamadı.`
                      : 'Henüz test eklenmemiş.'
                  }
                  actionButton={
                    !filter
                      ? {
                          title: 'Filtreyi Temizle',
                          onPress: () => setFilter(null),
                        }
                      : undefined
                  }
                />
              </PlayfulCard>
            )}
          </>
        )}

        {/* Quick Actions */}
        <PlayfulCard
          title='Hızlı İşlemler'
          variant='playful'
          style={{ marginTop: Spacing[6] }}
        >
          <Row style={{ gap: Spacing[3] }}>
            <PlayfulButton
              title='Rastgele Test'
              onPress={() => {
                if (tests.length > 0) {
                  const randomTest =
                    tests[Math.floor(Math.random() * tests.length)];
                  router.push(`/tests/${randomTest.test_id}` as any);
                }
              }}
              variant='outline'
              style={{ flex: 1 }}
              icon='random'
              gradient='sky'
            />
            <PlayfulButton
              title='Test Geçmişi'
              onPress={() => router.push('/tests/history' as any)}
              variant='outline'
              style={{ flex: 1 }}
              icon='history'
              gradient='purple'
            />
          </Row>
        </PlayfulCard>

        {/* Test Categories */}
        <PlayfulCard
          title='Popüler Kategoriler'
          variant='gradient'
          gradient='tropical'
          style={{ marginTop: Spacing[6] }}
        >
          <Row style={{ flexWrap: 'wrap', gap: Spacing[2] }}>
            {[
              'Anatomi',
              'Patoloji',
              'Cerrahi',
              'Protez',
              'Periodonti',
              'Pedodonti',
            ].map((category) => (
              <PlayfulButton
                key={category}
                title={category}
                variant='playful'
                size='small'
                onPress={() => {
                  const categoryTests = tests.filter((test) =>
                    test.title?.toLowerCase().includes(category.toLowerCase()),
                  );
                  if (categoryTests.length > 0) {
                    router.push(
                      `/tests/category/${category.toLowerCase()}` as any,
                    );
                  }
                }}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                }}
              />
            ))}
          </Row>
        </PlayfulCard>
      </ScrollView>
    </Container>
  );
}
