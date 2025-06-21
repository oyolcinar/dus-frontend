// app/(tabs)/tests.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
  RefreshControl,
  TouchableOpacity,
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
  SlideInElement,
  PlayfulTitle,
} from '../../components/ui';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
} from '../../constants/theme';

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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const fetchTests = useCallback(async () => {
    try {
      setError(null);

      // Fetch tests from API
      const testsResponse = await testService.getAllTests();

      // Map tests to include details
      const testsWithDetails: TestWithDetails[] = testsResponse.map((test) => {
        return {
          ...test,
          difficulty: getDifficultyLabel(test.difficulty_level || 2),
          questionCount: test.question_count || 0,
          timeLimit: test.time_limit || 30,
        };
      });

      setTests(testsWithDetails);
    } catch (error) {
      console.error('Error fetching tests:', error);
      setError('Testler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTests();
    setRefreshing(false);
  }, [fetchTests]);

  const handleRetry = useCallback(async () => {
    setLoading(true);
    await fetchTests();
    setLoading(false);
  }, [fetchTests]);

  useEffect(() => {
    async function initialFetch() {
      setLoading(true);
      await fetchTests();
      setLoading(false);
    }

    initialFetch();
  }, [fetchTests]);

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

  if (error && !loading) {
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
        {/* Header with animated title */}
        <SlideInElement delay={0}>
          <PlayfulCard
            style={{ marginBottom: Spacing[6], backgroundColor: 'transparent' }}
          >
            <Row
              style={{ justifyContent: 'space-between', alignItems: 'center' }}
            >
              <Column style={{ flex: 1 }}>
                <PlayfulTitle
                  level={1}
                  gradient='primary'
                  style={{ fontFamily: 'PrimaryFont', color: 'white' }}
                >
                  Testler 📝
                </PlayfulTitle>
                <Paragraph
                  color={isDark ? Colors.gray[400] : Colors.gray[100]}
                  style={{
                    fontFamily: 'SecondaryFont-Regular',
                  }}
                >
                  Sınavlara hazırlanmak için testleri çözün
                </Paragraph>
              </Column>
              {/* <AnimatedCounter
                value={totalTests}
                size='large'
                variant='vibrant'
              /> */}
            </Row>
          </PlayfulCard>
        </SlideInElement>

        {/* Stats Cards */}
        <Row
          style={{
            justifyContent: 'space-between',
            flexWrap: 'nowrap',
            marginBottom: Spacing[6],
          }}
        >
          <StatCard
            icon='file'
            title='Toplam Test'
            value={totalTests.toString()}
            color={isDark ? Colors.vibrant.purple : Colors.vibrant.yellow}
            titleFontFamily='SecondaryFont-Bold'
          />
          <StatCard
            icon='question'
            title='Ortalama Soru'
            value={averageQuestions.toString()}
            color={Colors.vibrant?.green || Colors.success}
            titleFontFamily='SecondaryFont-Bold'
          />
          <StatCard
            icon='fire'
            title='Zor Testler'
            value={hardTests.toString()}
            color={Colors.vibrant?.orange || Colors.error}
            titleFontFamily='SecondaryFont-Bold'
          />
        </Row>

        {/* Filter buttons */}
        {/* Filter buttons - Two rows layout */}
        <GlassCard style={{ marginBottom: Spacing[6] }}>
          <PlayfulTitle
            level={3}
            style={{
              fontFamily: 'PrimaryFont',
              marginBottom: Spacing[3],
              color: Colors.white,
            }}
          >
            Zorluk Filtresi
          </PlayfulTitle>

          {/* First Row - 3 buttons */}
          <Row style={{ marginBottom: Spacing[2] }}>
            <TouchableOpacity
              style={{
                flex: 1,
                marginHorizontal: Spacing[1],
                paddingVertical: Spacing[2],
                paddingHorizontal: Spacing[2],
                borderRadius: BorderRadius.button,
                backgroundColor:
                  filter === null
                    ? Colors.vibrant.purple
                    : isDark
                    ? Colors.gray[700]
                    : Colors.white,
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 36,
              }}
              onPress={() => setFilter(null)}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: filter === null ? '600' : '500',
                  color:
                    filter === null
                      ? Colors.white
                      : isDark
                      ? Colors.white
                      : Colors.gray[700],
                  textAlign: 'center',
                  fontFamily: 'SecondaryFont-Regular',
                }}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                Tümü
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                marginHorizontal: Spacing[1],
                paddingVertical: Spacing[2],
                paddingHorizontal: Spacing[2],
                borderRadius: BorderRadius.button,
                backgroundColor:
                  filter === 'Kolay'
                    ? Colors.vibrant.purple
                    : isDark
                    ? Colors.gray[700]
                    : Colors.white,
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 36,
              }}
              onPress={() => setFilter('Kolay')}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: filter === 'Kolay' ? '600' : '500',
                  color:
                    filter === 'Kolay'
                      ? Colors.white
                      : isDark
                      ? Colors.white
                      : Colors.gray[700],
                  textAlign: 'center',
                  fontFamily: 'SecondaryFont-Regular',
                }}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                Kolay
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                marginHorizontal: Spacing[1],
                paddingVertical: Spacing[2],
                paddingHorizontal: Spacing[2],
                borderRadius: BorderRadius.button,
                backgroundColor:
                  filter === 'Orta'
                    ? Colors.vibrant.purple
                    : isDark
                    ? Colors.gray[700]
                    : Colors.white,
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 36,
              }}
              onPress={() => setFilter('Orta')}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: filter === 'Orta' ? '600' : '500',
                  color:
                    filter === 'Orta'
                      ? Colors.white
                      : isDark
                      ? Colors.white
                      : Colors.gray[700],
                  textAlign: 'center',
                  fontFamily: 'SecondaryFont-Regular',
                }}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                Orta
              </Text>
            </TouchableOpacity>
          </Row>

          {/* Second Row - 3 buttons */}
          <Row>
            <TouchableOpacity
              style={{
                flex: 1,
                marginHorizontal: Spacing[1],
                paddingVertical: Spacing[2],
                paddingHorizontal: Spacing[2],
                borderRadius: BorderRadius.button,
                backgroundColor:
                  filter === 'Zor'
                    ? Colors.vibrant.purple
                    : isDark
                    ? Colors.gray[700]
                    : Colors.white,
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 36,
              }}
              onPress={() => setFilter('Zor')}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: filter === 'Zor' ? '600' : '500',
                  color:
                    filter === 'Zor'
                      ? Colors.white
                      : isDark
                      ? Colors.white
                      : Colors.gray[700],
                  textAlign: 'center',
                  fontFamily: 'SecondaryFont-Regular',
                }}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                Zor
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                marginHorizontal: Spacing[1],
                paddingVertical: Spacing[2],
                paddingHorizontal: Spacing[2],
                borderRadius: BorderRadius.button,
                backgroundColor:
                  filter === 'Çok Zor'
                    ? Colors.vibrant.purple
                    : isDark
                    ? Colors.gray[700]
                    : Colors.white,
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 36,
              }}
              onPress={() => setFilter('Çok Zor')}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: filter === 'Çok Zor' ? '600' : '500',
                  color:
                    filter === 'Çok Zor'
                      ? Colors.white
                      : isDark
                      ? Colors.white
                      : Colors.gray[700],
                  textAlign: 'center',
                  fontFamily: 'SecondaryFont-Regular',
                }}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                Çok Zor
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                marginHorizontal: Spacing[1],
                paddingVertical: Spacing[2],
                paddingHorizontal: Spacing[2],
                borderRadius: BorderRadius.button,
                backgroundColor:
                  filter === 'Uzman'
                    ? Colors.vibrant.purple
                    : isDark
                    ? Colors.gray[700]
                    : Colors.white,
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 36,
              }}
              onPress={() => setFilter('Uzman')}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: filter === 'Uzman' ? '600' : '500',
                  color:
                    filter === 'Uzman'
                      ? Colors.white
                      : isDark
                      ? Colors.white
                      : Colors.gray[700],
                  textAlign: 'center',
                  fontFamily: 'SecondaryFont-Regular',
                }}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                Uzman
              </Text>
            </TouchableOpacity>
          </Row>
        </GlassCard>

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
              color={isDark ? Colors.primary.DEFAULT : Colors.vibrant.coral}
            />
            <Text
              style={{
                marginTop: Spacing[3],
                color: isDark ? Colors.gray[400] : Colors.white,
                fontFamily: 'SecondaryFont-Regular',
              }}
            >
              Testler yükleniyor...
            </Text>
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
                            animated
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
                            wiggleOnPress
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
                  fontFamily='PrimaryFont'
                  title='Test bulunamadı'
                  buttonFontFamily='PrimaryFont'
                  message={
                    filter
                      ? `"${filter}" zorluğunda test bulunamadı.`
                      : 'Henüz test eklenmemiş.'
                  }
                  actionButton={
                    filter
                      ? {
                          title: 'Filtreyi Temizle',
                          onPress: () => setFilter(null),
                          variant: 'secondary',
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
          titleFontFamily='PrimaryFont'
          style={{ marginTop: Spacing[6] }}
          animated
        >
          <Row style={{ justifyContent: 'space-between' }}>
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
              style={{
                flex: 1,
                marginRight: Spacing[2], // Add margin instead of gap
              }}
              icon='random'
              gradient='sky'
              animated
              size='small'
              fontFamily='PrimaryFont'
            />
            <PlayfulButton
              title='Test Geçmişi'
              onPress={() => router.push('/tests/history' as any)}
              variant='outline'
              style={{ flex: 1 }}
              icon='history'
              gradient='purple'
              animated
              size='small'
              fontFamily='PrimaryFont'
            />
          </Row>
        </PlayfulCard>

        {/* Test Categories */}
        <PlayfulCard
          title='Popüler Kategoriler'
          variant='playful'
          gradient='tropical'
          style={{ marginTop: Spacing[6] }}
          titleFontFamily='PrimaryFont'
          animated
        >
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
            }}
          >
            {[
              {
                name: 'Ağız, Diş ve Çene Cerrahisi',
                bgColor: Colors.vibrant.orange,
              }, // Orange for surgery
              {
                name: 'Restoratif Diş Tedavisi',
                bgColor: Colors.vibrant.green,
              }, // Green for restorative
              { name: 'Endodonti', bgColor: Colors.vibrant.yellow }, // Yellow for endodontics
              { name: 'Pedodonti', bgColor: Colors.vibrant.pink }, // Pink for pediatrics
              { name: 'Protetik Diş Tedavisi', bgColor: Colors.vibrant.purple }, // Purple for prosthetics
              { name: 'Periodontoloji', bgColor: Colors.vibrant.mint }, // Mint for periodontics
              {
                name: 'Ağız, Diş ve Çene Radyolojisi',
                bgColor: Colors.vibrant.blue,
              }, // Blue for radiology
              { name: 'Ortodonti', bgColor: Colors.vibrant.peach }, // Peach for orthodontics
            ].map((category) => (
              <TouchableOpacity
                key={category.name}
                style={{
                  paddingVertical: Spacing[2],
                  paddingHorizontal: Spacing[2],
                  borderRadius: BorderRadius.button,
                  backgroundColor: category.bgColor,
                  marginBottom: Spacing[2],
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 60, // Fixed uniform height
                  width: '48%',
                }}
                onPress={() => {
                  const categoryTests = tests.filter((test) =>
                    test.title
                      ?.toLowerCase()
                      .includes(category.name.toLowerCase()),
                  );
                  if (categoryTests.length > 0) {
                    router.push(
                      `/tests/category/${category.name
                        .toLowerCase()
                        .replace(/[^a-z0-9]/g, '-')}` as any,
                    );
                  }
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: Colors.white,
                    textAlign: 'center',
                    fontFamily: 'SecondaryFont-Bold',
                  }}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </PlayfulCard>

        {/* Error display at bottom if there's an error but data is loaded */}
        {error && !loading && tests.length > 0 && (
          <Alert
            type='warning'
            message='Veriler yenilenirken sorun yaşandı. Çekmek için aşağı kaydırın.'
            style={{ marginTop: Spacing[4] }}
          />
        )}
      </ScrollView>
    </View>
  );
}
