// app/(tabs)/duels/new.tsx - Updated with custom UI components following courses pattern

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  useColorScheme,
  Dimensions,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Container,
  SlideInElement,
  PlayfulCard,
  PlayfulTitle,
  Paragraph,
  Row,
  Column,
  Avatar,
  Badge,
  Button,
  Input,
  Card,
  Alert,
  Picker,
  Modal,
  EmptyState,
  OpponentListItem,
  Opponent,
  SpinningWheel,
  FloatingElement,
  GlassCard,
} from '../../../components/ui';
import {
  duelService,
  userService,
  testService,
  friendService,
} from '../../../src/api';
import { ApiError } from '../../../src/api/apiClient';
import { Test } from '../../../src/types/models';
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

type DuelHubTab = 'find' | 'friends' | 'leaderboard';

export default function NewDuelScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [activeTab, setActiveTab] = useState<DuelHubTab>('find');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tests, setTests] = useState<Test[]>([]);
  const [recommended, setRecommended] = useState<Opponent[]>([]);
  const [friends, setFriends] = useState<Opponent[]>([]);
  const [leaderboard, setLeaderboard] = useState<Opponent[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [showWheelForTest, setShowWheelForTest] = useState(false);
  const [isSubmittingChallenge, setIsSubmittingChallenge] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState<Opponent | null>(
    null,
  );
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [testsData, recommendedData, friendsData, leaderboardData] =
        await Promise.all([
          testService.getAllTests(),
          duelService.getRecommendedOpponents(),
          friendService.getUserFriends(),
          duelService.getDuelLeaderboard(),
        ]);

      setTests(testsData);
      setRecommended(
        recommendedData.map((u) => ({
          id: u.userId,
          username: u.username,
          winRate: u.winRate,
        })),
      );

      setFriends(
        friendsData.map((f) => ({
          id: f.friend_id,
          username: f.friend_username || 'Bilinmeyen Kullanıcı',
        })),
      );

      setLeaderboard(
        leaderboardData.leaderboard.map((u) => ({
          id: u.userId,
          username: u.username,
          winRate: u.winRate,
        })),
      );
    } catch (e) {
      setError('Veriler yüklenirken bir hata oluştu.');
      console.error(e);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleRetry = useCallback(async () => {
    setIsLoading(true);
    await fetchData();
    setIsLoading(false);
  }, [fetchData]);

  useEffect(() => {
    const initialFetch = async () => {
      setIsLoading(true);
      await fetchData();
      setIsLoading(false);
    };
    initialFetch();
  }, [fetchData]);

  const handleOpenChallengeModal = (opponent: Opponent) => {
    setSelectedOpponent(opponent);
    setSelectedTestId(null);
    setShowWheelForTest(false);
    setModalVisible(true);
  };

  const handleTestSpinComplete = (itemName: string, index: number) => {
    const winningTest = tests[index];
    if (winningTest) {
      setSelectedTestId(winningTest.test_id);
    }
    setShowWheelForTest(false);
  };

  const handleChallengeSubmit = async () => {
    if (!selectedOpponent || !selectedTestId) {
      setError('Rakip veya test seçilmedi.');
      return;
    }
    setIsSubmittingChallenge(true);
    setError(null);
    try {
      const response = await duelService.challengeUser(
        selectedOpponent.id,
        selectedTestId,
      );
      const newDuel = response.duel;
      setModalVisible(false);
      router.push({ pathname: '/duels/[id]', params: { id: newDuel.duel_id } });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || 'Meydan okuma gönderilemedi.');
      } else {
        setError('Bilinmeyen bir hata oluştu.');
      }
    } finally {
      setIsSubmittingChallenge(false);
    }
  };

  const FilterButton = ({
    filter,
    title,
  }: {
    filter: typeof activeTab;
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
          activeTab === filter
            ? VIBRANT_COLORS.purple
            : isDark
            ? Colors.white
            : Colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 36,
      }}
      onPress={() => setActiveTab(filter)}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: activeTab === filter ? '600' : '500',
          color:
            activeTab === filter
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

  const renderTabContent = () => {
    if (isLoading) {
      return (
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            padding: Spacing[8],
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
            Düello verileri yükleniyor...
          </Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'find':
        return (
          <>
            <SlideInElement delay={0} key={`${activeTab}-search`}>
              <UsernameSearch onChallenge={handleOpenChallengeModal} />
            </SlideInElement>
            <SlideInElement delay={100} key={`${activeTab}-title`}>
              <Text
                style={[
                  globalStyles.textLg,
                  globalStyles.fontSemibold,
                  {
                    color: isDark ? Colors.gray[800] : Colors.gray[800],
                    marginTop: Spacing[6],
                    marginBottom: Spacing[2],
                    fontFamily: 'SecondaryFont-Bold',
                  },
                ]}
              >
                Önerilen Rakipler
              </Text>
            </SlideInElement>
            {recommended.length > 0 ? (
              recommended.map((user, index) => (
                <SlideInElement
                  key={`${activeTab}-rec-${user.id}`}
                  delay={200 + index * 100}
                >
                  <OpponentListItem
                    user={user}
                    onChallenge={handleOpenChallengeModal}
                  />
                </SlideInElement>
              ))
            ) : (
              <SlideInElement delay={200} key={`${activeTab}-empty`}>
                <Paragraph style={{ fontFamily: 'SecondaryFont-Regular' }}>
                  Şu an için önerilen rakip bulunmuyor.
                </Paragraph>
              </SlideInElement>
            )}
          </>
        );
      case 'friends':
        return friends.length > 0 ? (
          friends.map((user, index) => (
            <SlideInElement
              key={`${activeTab}-friend-${user.id}`}
              delay={index * 100}
            >
              <OpponentListItem
                user={user}
                onChallenge={handleOpenChallengeModal}
              />
            </SlideInElement>
          ))
        ) : (
          <SlideInElement delay={0} key={`${activeTab}-empty`}>
            <EmptyState
              icon='users'
              title='Arkadaş Yok'
              message='Düello yapmak için önce arkadaş eklemelisin.'
              fontFamily='SecondaryFont-Regular'
              buttonFontFamily='PrimaryFont'
              titleFontFamily='PrimaryFont'
            />
          </SlideInElement>
        );
      case 'leaderboard':
        return leaderboard.length > 0 ? (
          leaderboard.map((user, index) => (
            <SlideInElement
              key={`${activeTab}-lead-${user.id}`}
              delay={index * 100}
            >
              <OpponentListItem
                user={user}
                onChallenge={handleOpenChallengeModal}
              />
            </SlideInElement>
          ))
        ) : (
          <SlideInElement delay={0} key={`${activeTab}-empty`}>
            <EmptyState
              icon='trophy'
              title='Liderlik Tablosu Boş'
              message='Henüz sıralama oluşmadı.'
            />
          </SlideInElement>
        );
      default:
        return null;
    }
  };

  if (error && !isLoading) {
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
        <Alert
          type='error'
          title='Hata'
          message={error}
          style={{ marginBottom: Spacing[4] }}
        />
        <Button
          title='Yenile'
          variant='primary'
          onPress={handleRetry}
          icon='refresh'
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
                  Yeni Düello ⚔️
                </PlayfulTitle>
                <Paragraph
                  color={isDark ? Colors.gray[100] : Colors.gray[100]}
                  style={{
                    fontFamily: 'SecondaryFont-Regular',
                  }}
                >
                  Rakip seç ve meydan okumaya başla
                </Paragraph>
              </Column>
              <Avatar size='md' name='⚔️' bgColor={VIBRANT_COLORS.purple} />
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
              <FilterButton filter='find' title='Rakip Bul' />
              <FilterButton filter='friends' title='Arkadaşlar' />
              <FilterButton filter='leaderboard' title='Liderlik' />
            </Row>
          </View>
        </SlideInElement>

        {/* Tab Content */}
        <View>
          <FloatingElement>
            <GlassCard
              style={[
                {
                  backgroundColor: Colors.vibrant.orangeLight,
                  marginBottom: Spacing[4],
                  overflow: 'hidden',
                },
                createPlayfulShadow(Colors.vibrant.purple, 'medium'),
              ]}
              animated
            >
              {renderTabContent()}
            </GlassCard>
          </FloatingElement>
        </View>

        {/* Error display at bottom if there's an error but data is loaded */}
        {error && !isLoading && (
          <Alert
            type='warning'
            message='Veriler yenilenirken sorun yaşandı. Çekmek için aşağı kaydırın.'
            style={{ marginTop: Spacing[4] }}
          />
        )}

        {/* Bottom spacing to ensure content is fully visible */}
        <View style={{ height: Spacing[8] }} />
      </ScrollView>

      <Modal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title='Meydan Okumayi Onayla'
      >
        <View
          style={{
            backgroundColor: Colors.vibrant.purple,
            padding: Spacing[4],
            minHeight: 200,
          }}
        >
          {/* Description Text */}
          <View style={{ marginBottom: Spacing[6] }}>
            <Text
              style={{
                fontSize: 16,
                lineHeight: 24,
                color: Colors.gray[300],
                fontFamily: 'SecondaryFont-Regular',
              }}
            >
              <Text
                style={{
                  fontWeight: 'bold',
                  fontFamily: 'PrimaryFont',
                  color: Colors.gray[100],
                }}
              >
                {selectedOpponent?.username}
              </Text>
              {
                ' adlı kullanıcıya meydan okumak için bir ders seçin veya şansınızı deneyin!'
              }
            </Text>
          </View>

          {/* Spinner or Picker Section */}
          {showWheelForTest ? (
            <View
              style={{
                alignItems: 'center',
                paddingVertical: Spacing[4],
                minHeight: 300,
                marginBottom: Spacing[4],
              }}
            >
              <SpinningWheel
                items={tests.map((t) => t.title)}
                onSpinEnd={handleTestSpinComplete}
                size={280}
                spinButtonText='ÇEVİR'
                sliceFontFamily='PrimaryFont'
                winnerFontFamily='PrimaryFont'
                fontFamily='PrimaryFont'
              />
            </View>
          ) : (
            <View style={{ marginBottom: Spacing[6] }}>
              {/* Picker Section */}
              <View style={{ marginBottom: Spacing[3] }}>
                <Picker
                  items={tests.map((t) => ({
                    label: t.title,
                    value: t.test_id,
                  }))}
                  selectedValue={selectedTestId}
                  onValueChange={(val) => setSelectedTestId(val as number)}
                  placeholder='Bir Ders Seçin...'
                  enabled={true}
                  forceLight={true}
                  style={{
                    backgroundColor: Colors.white,
                    borderColor: Colors.gray[300],
                    borderWidth: 2,
                  }}
                  fontFamily='SecondaryFont-Regular'
                  placeholderFontFamily='SecondaryFont-Regular'
                />
              </View>

              {/* Spin Button */}
              <Button
                title='Ders İçin Çevir'
                onPress={() => setShowWheelForTest(true)}
                variant='secondary'
                icon='random'
                style={{
                  minHeight: 44,
                  backgroundColor: Colors.secondary.DEFAULT,
                  borderRadius: BorderRadius.lg,
                }}
                textStyle={{
                  fontFamily: 'SecondaryFont-Bold',
                  fontSize: 16,
                  color: Colors.white,
                }}
              />
            </View>
          )}

          {/* Challenge Button */}
          <Button
            title='Meydan Oku'
            onPress={handleChallengeSubmit}
            loading={isSubmittingChallenge}
            disabled={!selectedTestId || isSubmittingChallenge}
            style={{
              minHeight: 48,
              backgroundColor:
                !selectedTestId || isSubmittingChallenge
                  ? Colors.gray[400]
                  : Colors.primary.DEFAULT,
              borderRadius: BorderRadius.lg,
              marginTop: Spacing[2],
            }}
            textStyle={{
              fontFamily: 'SecondaryFont-Bold',
              fontSize: 16,
              color: Colors.white,
            }}
          />

          {/* Error Display */}
          {error && (
            <View style={{ marginTop: Spacing[3] }}>
              <Alert
                type='error'
                message={error}
                style={{
                  backgroundColor: 'rgba(236, 28, 36, 0.1)',
                  borderColor: Colors.error,
                  borderWidth: 1,
                  borderRadius: BorderRadius.md,
                  margin: 0,
                }}
              />
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const UsernameSearch = ({
  onChallenge,
}: {
  onChallenge: (user: Opponent) => void;
}) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!username.trim()) return;
    setLoading(true);
    setError(null);
    const opponent = await userService.searchUserByUsername(username.trim());
    setLoading(false);
    if (opponent) {
      onChallenge(opponent);
    } else {
      setError(`'${username}' bulunamadı.`);
    }
  };

  return (
    <Card style={{ marginTop: Spacing[4] }}>
      <Input
        placeholder='Kullanıcı adı ile ara'
        value={username}
        onChangeText={setUsername}
        autoCapitalize='none'
        disabled={loading}
        inputStyle={{ fontFamily: 'PrimaryFont' }}
      />
      <Button
        title='Ara ve Meydan Oku'
        onPress={handleSearch}
        loading={loading}
        style={{ marginTop: Spacing[2] }}
        textStyle={{ fontFamily: 'SecondaryFont-Bold' }}
      />
      {error && (
        <Alert type='error' message={error} style={{ marginTop: Spacing[2] }} />
      )}
    </Card>
  );
};
