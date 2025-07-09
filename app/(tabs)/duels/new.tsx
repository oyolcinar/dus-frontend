// app/duels/new.tsx - Now works with the corrected 'Friend' type

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Text,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Container,
  Title,
  Card,
  Button,
  Input,
  Alert,
  Picker,
  Row,
  Modal,
  Paragraph,
  EmptyState,
  OpponentListItem,
  Opponent,
  SpinningWheel,
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
  FontFamilies,
} from '../../../constants/theme';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

type DuelHubTab = 'find' | 'friends' | 'leaderboard';

export default function NewDuelScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [activeTab, setActiveTab] = useState<DuelHubTab>('find');
  const [isLoading, setIsLoading] = useState(true);
  // ... (rest of the state variables are correct)
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

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoading(true);
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

        // This line is now valid because the 'Friend' type has 'friend_username'
        setFriends(
          friendsData.map((f) => ({
            id: f.friend_id,
            username: f.friend_username || 'Bilinmeyen Kullanıcı', // Added a fallback for safety
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
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, []);

  // ... (the rest of the file is correct)
  const handleOpenChallengeModal = (opponent: Opponent) => {
    setSelectedOpponent(opponent);
    setSelectedTestId(null); // Reset test selection
    setShowWheelForTest(false);
    setModalVisible(true);
  };

  const handleTestSpinComplete = (itemName: string, index: number) => {
    const winningTest = tests[index];
    if (winningTest) {
      setSelectedTestId(winningTest.test_id);
    }
    // Hide the wheel and show the Picker again, now with the selected value
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

  const renderTabContent = () => {
    if (isLoading) {
      return (
        <ActivityIndicator size='large' style={{ marginTop: Spacing[8] }} />
      );
    }
    switch (activeTab) {
      case 'find':
        return (
          <>
            <UsernameSearch onChallenge={handleOpenChallengeModal} />
            <Title
              level={4}
              style={{
                marginTop: Spacing[6],
                marginBottom: Spacing[2],
              }}
            >
              Önerilen Rakipler
            </Title>
            {recommended.length > 0 ? (
              recommended.map((user) => (
                <OpponentListItem
                  key={`rec-${user.id}`}
                  user={user}
                  onChallenge={handleOpenChallengeModal}
                />
              ))
            ) : (
              <Paragraph>Şu an için önerilen rakip bulunmuyor.</Paragraph>
            )}
          </>
        );
      case 'friends':
        return friends.length > 0 ? (
          friends.map((user) => (
            <OpponentListItem
              key={`friend-${user.id}`}
              user={user}
              onChallenge={handleOpenChallengeModal}
            />
          ))
        ) : (
          <EmptyState
            icon='users'
            title='Arkadaş Yok'
            message='Düello yapmak için önce arkadaş eklemelisin.'
          />
        );
      case 'leaderboard':
        return leaderboard.length > 0 ? (
          leaderboard.map((user) => (
            <OpponentListItem
              key={`lead-${user.id}`}
              user={user}
              onChallenge={handleOpenChallengeModal}
            />
          ))
        ) : (
          <EmptyState
            icon='trophy'
            title='Liderlik Tablosu Boş'
            message='Henüz sıralama oluşmadı.'
          />
        );
      default:
        return null;
    }
  };

  return (
    <Container>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Title level={2}>Meydan Oku</Title>
        {error && (
          <Alert
            type='error'
            message={error}
            style={{ marginVertical: Spacing[4] }}
          />
        )}

        <Row style={[styles.tabContainer, isDark && styles.tabContainerDark]}>
          <TabButton
            title='Rakip Bul'
            isActive={activeTab === 'find'}
            onPress={() => setActiveTab('find')}
          />
          <TabButton
            title='Arkadaşlar'
            isActive={activeTab === 'friends'}
            onPress={() => setActiveTab('friends')}
          />
          <TabButton
            title='Liderlik'
            isActive={activeTab === 'leaderboard'}
            onPress={() => setActiveTab('leaderboard')}
          />
        </Row>

        {renderTabContent()}
      </ScrollView>

      <Modal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title='Meydan Okumayı Onayla'
      >
        <View style={styles.modalContent}>
          <Paragraph>
            <Text style={{ fontWeight: 'bold' }}>
              {selectedOpponent?.username}
            </Text>{' '}
            adlı kullanıcıya meydan okumak için bir konu seçin veya şansınızı
            deneyin!
          </Paragraph>

          {showWheelForTest ? (
            // If showWheelForTest is true, render the wheel
            <View style={styles.wheelContainer}>
              <SpinningWheel
                items={tests.map((t) => t.title)}
                onSpinEnd={handleTestSpinComplete}
                size={280} // A bit smaller to fit nicely in the modal
                spinButtonText='ÇEVİR'
                sliceFontFamily='PrimaryFont'
                winnerFontFamily='PrimaryFont'
                fontFamily='PrimaryFont'
              />
            </View>
          ) : (
            // Otherwise, show the Picker and the button to open the wheel
            <>
              <Picker
                items={tests.map((t) => ({
                  label: t.title,
                  value: t.test_id,
                }))}
                selectedValue={selectedTestId}
                onValueChange={(val) => setSelectedTestId(val as number)}
                placeholder='Bir Konu Seçin...'
                style={{ marginTop: Spacing[4] }}
              />
              <Button
                title='Konu İçin Çevir'
                onPress={() => setShowWheelForTest(true)}
                variant='secondary'
                icon='random'
                style={{ marginTop: Spacing[2] }}
              />
            </>
          )}

          <Button
            title='Meydan Oku'
            onPress={handleChallengeSubmit}
            loading={isSubmittingChallenge}
            disabled={!selectedTestId || isSubmittingChallenge}
            style={{ marginTop: Spacing[6] }} // More space at the top
          />
        </View>
      </Modal>
    </Container>
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
      />
      <Button
        title='Ara ve Meydan Oku'
        onPress={handleSearch}
        loading={loading}
        style={{ marginTop: Spacing[2] }}
      />
      {error && (
        <Alert type='error' message={error} style={{ marginTop: Spacing[2] }} />
      )}
    </Card>
  );
};

const TabButton = ({
  title,
  isActive,
  onPress,
}: {
  title: string;
  isActive: boolean;
  onPress: () => void;
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.tab,
        isActive && (isDark ? styles.activeTabDark : styles.activeTabLight),
      ]}
    >
      <Text
        style={[
          styles.tabText,
          isDark && styles.tabTextDark,
          isActive && styles.activeTabText,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, padding: Spacing[4] },
  tabContainer: {
    marginVertical: Spacing[4],
    borderRadius: BorderRadius.lg,
    padding: Spacing[1],
  },
  tabContainerDark: { backgroundColor: Colors.gray[800] },
  tab: {
    flex: 1,
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  activeTabLight: { backgroundColor: Colors.white },
  activeTabDark: { backgroundColor: Colors.gray[600] },
  tabText: { fontWeight: '600', color: Colors.gray[600] },
  tabTextDark: { color: Colors.gray[400] },
  activeTabText: { color: Colors.primary.DEFAULT },
  modalContent: { padding: Spacing[2] },
  wheelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[4],
  },
});
