// app/(tabs)/duels/new.tsx - UPDATED WITH NEW ARCHITECTURE
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Platform, ActionSheetIOS, StyleSheet } from 'react-native';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  useColorScheme,
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
  Badge,
  Button,
  Input,
  Card,
  Alert,
  Picker,
  Modal,
  EmptyState,
  SpinningWheel,
  FloatingElement,
  GlassCard,
  Colors,
  Spacing,
  BorderRadius,
} from '../../../components/ui';
import {
  useNewDuelData,
  useDuelCreation,
  useSocketBotChallenge,
  useUserSearch,
  duelHelpers,
} from '../../../src/hooks/useDuelsData';
import { useAuth, usePreferredCourse } from '../../../stores/appStore';
import { Test, Course } from '../../../src/types/models';
import { Bot } from '../../../src/api/botService';
import { globalStyles } from '../../../utils/styleUtils';

// Performance optimized shadow configuration
const OPTIMIZED_SHADOW = {
  // shadowColor: Colors.gray[900],
  // shadowOffset: { width: 2, height: 4 },
  // shadowOpacity: 0.3,
  // shadowRadius: 4,
  // elevation: 4,
};

type DuelHubTab = 'find' | 'friends' | 'leaderboard' | 'bots';
type ChallengeStep = 'selectOpponent' | 'selectCourse' | 'confirm';

// Define opponent interface locally since it might not be in the hook
interface Opponent {
  id: number;
  username: string;
  winRate?: number;
  totalDuels?: number;
  isBot?: boolean;
}

// Memoized components for better performance
const FilterButton = React.memo(
  ({
    filter,
    title,
    activeTab,
    contextColor,
    isDark,
    onPress,
  }: {
    filter: DuelHubTab;
    title: string;
    activeTab: DuelHubTab;
    contextColor: string;
    isDark: boolean;
    onPress: (filter: DuelHubTab) => void;
  }) => {
    const handlePress = useCallback(() => {
      onPress(filter);
    }, [filter, onPress]);

    return (
      <TouchableOpacity
        style={[
          styles.filterButton,
          {
            backgroundColor: activeTab === filter ? contextColor : Colors.white,
          },
        ]}
        onPress={handlePress}
      >
        <Text
          style={[
            styles.filterButtonText,
            {
              fontWeight: activeTab === filter ? '600' : '500',
              color:
                activeTab === filter
                  ? Colors.white
                  : isDark
                    ? Colors.gray[700]
                    : Colors.gray[700],
            },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {title}
        </Text>
      </TouchableOpacity>
    );
  },
);

const BotListItem = React.memo(
  ({
    bot,
    contextColor,
    isLoading,
    isAuthenticated,
    onChallenge,
  }: {
    bot: Bot;
    contextColor: string;
    isLoading: boolean;
    isAuthenticated: boolean;
    onChallenge: (bot: Bot) => void;
  }) => {
    const difficultyInfo = useMemo(() => {
      return duelHelpers.getBotDisplayInfo(bot);
    }, [bot]);

    const handlePress = useCallback(() => {
      onChallenge(bot);
    }, [bot, onChallenge]);

    const buttonTitle = useMemo(() => {
      if (isLoading) return 'Bağlanıyor...';
      if (!isAuthenticated) return 'Giriş Gerekli';
      return 'Meydan Oku';
    }, [isLoading, isAuthenticated]);

    return (
      <View style={styles.listItemContainer}>
        <PlayfulCard style={styles.botCard}>
          <Row style={styles.listItemRow}>
            <Row style={styles.listItemLeft}>
              <Column style={styles.listItemInfo}>
                <Text style={styles.botName}>{difficultyInfo.name}</Text>
                <Text style={styles.botStats}>
                  Doğruluk: {difficultyInfo.accuracy}% • Süre:{' '}
                  {difficultyInfo.avgTime}s
                </Text>
                <Row style={styles.badgeRow}>
                  <Badge
                    text={duelHelpers.getDifficultyLabel(
                      difficultyInfo.difficulty,
                    )}
                    variant='primary'
                    style={[
                      styles.difficultyBadge,
                      { backgroundColor: difficultyInfo.color },
                    ]}
                    textStyle={styles.badgeText}
                  />
                </Row>
              </Column>
            </Row>
            <Button
              title={buttonTitle}
              variant='primary'
              size='small'
              onPress={handlePress}
              disabled={isLoading || !isAuthenticated}
              style={[
                styles.challengeButton,
                {
                  backgroundColor: !isAuthenticated
                    ? Colors.gray[500]
                    : difficultyInfo.color,
                },
              ]}
              textStyle={styles.challengeButtonText}
            />
          </Row>
        </PlayfulCard>
      </View>
    );
  },
);

const OpponentListItem = React.memo(
  ({
    opponent,
    isAuthenticated,
    onChallenge,
  }: {
    opponent: Opponent;
    isAuthenticated: boolean;
    onChallenge: (opponent: Opponent) => void;
  }) => {
    const handlePress = useCallback(() => {
      onChallenge(opponent);
    }, [opponent, onChallenge]);

    const buttonTitle = useMemo(() => {
      return !isAuthenticated ? 'Giriş Gerekli' : 'Meydan Oku';
    }, [isAuthenticated]);

    return (
      <View style={styles.listItemContainer}>
        <PlayfulCard style={styles.opponentCard}>
          <Row style={styles.listItemRow}>
            <Row style={styles.listItemLeft}>
              <Column style={styles.listItemInfo}>
                <Text style={styles.opponentName}>{opponent.username}</Text>
                <Text style={styles.opponentStats}>
                  Kazanma Oranı: {((opponent.winRate || 0) * 100).toFixed(0)}%
                  {opponent.totalDuels && ` • ${opponent.totalDuels} Düello`}
                </Text>
              </Column>
            </Row>
            <Button
              title={buttonTitle}
              variant='primary'
              size='small'
              onPress={handlePress}
              disabled={!isAuthenticated}
              style={[
                styles.challengeButton,
                {
                  backgroundColor: !isAuthenticated
                    ? Colors.gray[500]
                    : Colors.vibrant.coral,
                },
              ]}
              textStyle={styles.challengeButtonText}
            />
          </Row>
        </PlayfulCard>
      </View>
    );
  },
);

const UsernameSearch = React.memo(
  ({
    onChallenge,
    contextColor,
    isAuthenticated,
  }: {
    onChallenge: (user: Opponent) => void;
    contextColor: string;
    isAuthenticated: boolean;
  }) => {
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { searchUser } = useUserSearch();

    const handleSearch = useCallback(async () => {
      if (!username.trim() || !isAuthenticated) return;

      setLoading(true);
      setError(null);

      try {
        const opponent = await searchUser(username.trim());
        if (opponent) {
          onChallenge(opponent);
          setUsername(''); // Clear search on success
        } else {
          setError(`'${username}' bulunamadı.`);
        }
      } catch (err) {
        setError('Arama sırasında hata oluştu.');
      } finally {
        setLoading(false);
      }
    }, [username, onChallenge, searchUser, isAuthenticated]);

    return (
      <Card style={styles.searchCard}>
        <Input
          placeholder='Kullanıcı adı ile ara'
          value={username}
          onChangeText={setUsername}
          autoCapitalize='none'
          disabled={loading || !isAuthenticated}
          inputStyle={styles.searchInput}
        />
        <Button
          title={isAuthenticated ? 'Ara ve Meydan Oku' : 'Giriş Gerekli'}
          onPress={handleSearch}
          loading={loading}
          disabled={!isAuthenticated || !username.trim()}
          style={[
            styles.searchButton,
            {
              backgroundColor: isAuthenticated
                ? contextColor
                : Colors.gray[500],
            },
          ]}
          textStyle={styles.searchButtonText}
        />
        {error && (
          <Alert type='error' message={error} style={styles.searchError} />
        )}
      </Card>
    );
  },
);

// Main New Duel Screen Component
export default function NewDuelScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // 🚀 NEW: Use the new store hooks
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { preferredCourse, getCourseColor } = usePreferredCourse();

  // 🚀 NEW: Use the comprehensive new duel data hook
  const {
    recommendedOpponents,
    friendOpponents,
    botOpponents,
    courses,
    isLoading: dataLoading,
    refetchAll,
  } = useNewDuelData();

  // 🚀 NEW: Use the duel creation hook
  const { challengeUser, challengeBot, challengeUserWithTest } =
    useDuelCreation();

  // 🚀 NEW: Use the socket bot challenge hook
  const {
    challengeBot: socketChallengeBot,
    challengeState,
    challengeError: socketError,
    createdDuel,
    reset: resetSocketChallenge,
    isLoading: socketLoading,
  } = useSocketBotChallenge();

  // Memoized context color to prevent unnecessary re-renders
  const contextColor = useMemo(() => {
    return (
      ((preferredCourse as any)?.category &&
        getCourseColor((preferredCourse as any).category)) ||
      '#4285F4'
    );
  }, [preferredCourse, getCourseColor]);

  // Local UI state
  const [activeTab, setActiveTab] = useState<DuelHubTab>('find');
  const [refreshing, setRefreshing] = useState(false);

  // Challenge flow state
  const [challengeStep, setChallengeStep] =
    useState<ChallengeStep>('selectOpponent');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState<Opponent | null>(
    null,
  );
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // UI state
  const [showWheelForCourse, setShowWheelForCourse] = useState(false);
  const [isSubmittingChallenge, setIsSubmittingChallenge] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBotChallenge, setIsBotChallenge] = useState(false);

  // Memoized styles that depend on theme
  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        loadingText: {
          marginTop: Spacing[3],
          color: isDark ? Colors.white : Colors.white,
          fontFamily: 'SecondaryFont-Regular',
        },
        headerTitle: {
          fontFamily: 'PrimaryFont',
          color: Colors.gray[900],
        },
        headerSubtitle: {
          color: isDark ? Colors.gray[700] : Colors.gray[700],
          fontFamily: 'SecondaryFont-Regular',
        },
        sectionTitle: {
          color: isDark ? Colors.white : Colors.white,
          marginTop: Spacing[6],
          marginBottom: Spacing[2],
          fontFamily: 'SecondaryFont-Bold',
        },
        emptyText: {
          fontFamily: 'SecondaryFont-Regular',
        },
      }),
    [isDark],
  );

  // Reset challenge state function
  const resetChallengeState = useCallback(() => {
    setSelectedOpponent(null);
    setSelectedBot(null);
    setSelectedCourse(null);
    setIsBotChallenge(false);
    setChallengeStep('selectOpponent');
    setShowWheelForCourse(false);
    setError(null);
    setIsSubmittingChallenge(false);
    resetSocketChallenge();
  }, [resetSocketChallenge]);

  // Handle modal close
  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    resetChallengeState();
  }, [resetChallengeState]);

  // 🚀 SIMPLIFIED: Handle refresh with new hook
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchAll();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetchAll]);

  // Handle socket challenge result
  useEffect(() => {
    if (challengeState === 'success' && createdDuel) {
      setModalVisible(false);
      resetChallengeState();
      router.push({
        pathname: '/(tabs)/duels/[id]' as any,
        params: { id: createdDuel.duel_id.toString() },
      });
    } else if (challengeState === 'error' && socketError) {
      setError(socketError);
    }
  }, [challengeState, createdDuel, socketError, router, resetChallengeState]);

  // Memoized challenge handlers
  const handleOpenChallengeModal = useCallback(
    (opponent: Opponent) => {
      if (!isAuthenticated) {
        setError('Meydan okumak için giriş yapmanız gerekiyor.');
        return;
      }

      setSelectedOpponent(opponent);
      setSelectedBot(null);
      setSelectedCourse(null);
      setIsBotChallenge(false);
      setChallengeStep('selectCourse');
      setShowWheelForCourse(false);
      setModalVisible(true);
      setError(null);
    },
    [isAuthenticated],
  );

  const handleOpenBotChallengeModal = useCallback(
    (bot: Bot) => {
      if (!isAuthenticated) {
        setError('Bot meydan okumak için giriş yapmanız gerekiyor.');
        return;
      }

      setSelectedBot(bot);
      setSelectedOpponent(null);
      setSelectedCourse(null);
      setIsBotChallenge(true);
      setChallengeStep('selectCourse');
      setShowWheelForCourse(false);
      setModalVisible(true);
      setError(null);
    },
    [isAuthenticated],
  );

  const handleCourseSpinComplete = useCallback(
    (courseName: string, index: number) => {
      const winningCourse = courses[index];
      if (winningCourse) {
        handleCourseSelected(winningCourse);
      }
      setShowWheelForCourse(false);
    },
    [courses],
  );

  const handleCourseSelected = useCallback(async (course: Course) => {
    setSelectedCourse(course);
    setError(null);
    setChallengeStep('confirm');
  }, []);

  // Memoized tab change handler
  const handleTabChange = useCallback((tab: DuelHubTab) => {
    setActiveTab(tab);
  }, []);

  // 🚀 SIMPLIFIED: Challenge submission with new hooks
  const handleChallengeSubmit = useCallback(async () => {
    if (!selectedCourse) {
      setError('Ders seçilmedi.');
      return;
    }

    if (!isAuthenticated || !user) {
      setError('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
      return;
    }

    setError(null);

    try {
      if (isBotChallenge && selectedBot) {
        // Try socket first, then fallback to HTTP
        await socketChallengeBot(
          selectedCourse.course_id,
          selectedBot.difficultyLevel,
          true, // prefer socket
        );
        // Success handling is done in useEffect above
      } else if (!isBotChallenge && selectedOpponent) {
        setIsSubmittingChallenge(true);

        const response = await challengeUser(
          selectedOpponent.id,
          selectedCourse.course_id,
          5, // question count
        );

        if (response?.duel) {
          setModalVisible(false);
          resetChallengeState();

          router.push({
            pathname: '/(tabs)/duels/[id]' as any,
            params: { id: response.duel.duel_id.toString() },
          });
        }
      }
    } catch (err) {
      console.error('Challenge submission failed:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Meydan okuma gönderilemedi. Lütfen tekrar deneyin.',
      );
    } finally {
      setIsSubmittingChallenge(false);
    }
  }, [
    selectedCourse,
    isAuthenticated,
    user,
    isBotChallenge,
    selectedBot,
    selectedOpponent,
    socketChallengeBot,
    challengeUser,
    resetChallengeState,
    router,
  ]);

  const renderTabContent = useCallback(() => {
    if (dataLoading && !refreshing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={contextColor} />
          <Text style={dynamicStyles.loadingText}>
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
              <UsernameSearch
                onChallenge={handleOpenChallengeModal}
                contextColor={contextColor}
                isAuthenticated={isAuthenticated}
              />
            </SlideInElement>
            <SlideInElement delay={100} key={`${activeTab}-title`}>
              <Text
                style={[
                  globalStyles.textLg,
                  globalStyles.fontSemibold,
                  dynamicStyles.sectionTitle,
                ]}
              >
                Önerilen Rakipler
              </Text>
            </SlideInElement>
            {recommendedOpponents.length > 0 ? (
              recommendedOpponents.map((user, index) => (
                <SlideInElement
                  key={`${activeTab}-rec-${user.id}`}
                  delay={200 + index * 100}
                >
                  <OpponentListItem
                    opponent={user}
                    isAuthenticated={isAuthenticated}
                    onChallenge={handleOpenChallengeModal}
                  />
                </SlideInElement>
              ))
            ) : (
              <SlideInElement delay={200} key={`${activeTab}-empty`}>
                <Paragraph style={dynamicStyles.emptyText}>
                  Şu an için önerilen rakip bulunmuyor.
                </Paragraph>
              </SlideInElement>
            )}
          </>
        );
      case 'friends':
        return friendOpponents.length > 0 ? (
          friendOpponents.map((user, index) => (
            <SlideInElement
              key={`${activeTab}-friend-${user.id}`}
              delay={index * 100}
            >
              <OpponentListItem
                opponent={user}
                isAuthenticated={isAuthenticated}
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
        return (
          <SlideInElement delay={0} key={`${activeTab}-empty`}>
            <EmptyState
              icon='trophy'
              title='Liderlik Tablosu'
              message='Liderlik tablosu özelliği yakında gelecek!'
            />
          </SlideInElement>
        );
      case 'bots':
        return botOpponents.length > 0 ? (
          botOpponents.map((bot, index) => (
            <SlideInElement
              key={`${activeTab}-bot-${bot.id}`}
              delay={100 + index * 100}
            >
              <BotListItem
                bot={bot.botInfo!} // We know it's a bot from botOpponents
                contextColor={contextColor}
                isLoading={socketLoading}
                isAuthenticated={isAuthenticated}
                onChallenge={(bot) => handleOpenBotChallengeModal(bot)}
              />
            </SlideInElement>
          ))
        ) : (
          <SlideInElement delay={0} key={`${activeTab}-empty`}>
            <EmptyState
              icon='gears'
              title='Bot Yok'
              message='Şu an kullanılabilir bot bulunmuyor.'
            />
          </SlideInElement>
        );
      default:
        return null;
    }
  }, [
    dataLoading,
    refreshing,
    activeTab,
    contextColor,
    recommendedOpponents,
    friendOpponents,
    botOpponents,
    isAuthenticated,
    socketLoading,
    handleOpenChallengeModal,
    handleOpenBotChallengeModal,
    dynamicStyles,
  ]);

  const getModalTitle = useCallback(() => {
    if (isBotChallenge && selectedBot) {
      return `${selectedBot.botName} ile Düello`;
    }
    switch (challengeStep) {
      case 'selectCourse':
        return 'Ders Seçin';
      case 'confirm':
        return 'Meydan Okumayı Onayla';
      default:
        return 'Meydan Okuma';
    }
  }, [isBotChallenge, selectedBot, challengeStep]);

  const getOpponentDisplayName = useCallback(() => {
    if (isBotChallenge && selectedBot) {
      return selectedBot.botName;
    }
    return selectedOpponent?.username || 'Rakip';
  }, [isBotChallenge, selectedBot, selectedOpponent]);

  const renderChallengeModal = useCallback(() => {
    return (
      <Modal
        visible={modalVisible}
        onClose={handleCloseModal}
        title={getModalTitle()}
      >
        <View style={[styles.modalContent, { backgroundColor: contextColor }]}>
          {/* Opponent Info */}
          <View style={styles.opponentInfo}>
            <Text style={styles.opponentTitle}>
              Rakip: {getOpponentDisplayName()}
            </Text>
            {isBotChallenge && selectedBot && (
              <>
                <Text style={styles.botDetails}>
                  Zorluk: Seviye {selectedBot.difficultyLevel} • Doğruluk:{' '}
                  {(selectedBot.accuracyRate * 100).toFixed(0)}%
                </Text>
              </>
            )}
          </View>

          {/* Course Selection Step */}
          {challengeStep === 'selectCourse' && (
            <>
              <Text style={styles.courseDescription}>
                Bir ders seçin! Seçilen dersten 5 rastgele soru gelecek.
              </Text>

              {showWheelForCourse ? (
                <View style={styles.wheelContainer}>
                  <SpinningWheel
                    items={courses.map((c) => c.nicknames || c.title)}
                    onSpinEnd={handleCourseSpinComplete}
                    size={280}
                    spinButtonText='ÇEVİR'
                    sliceFontFamily='PrimaryFont'
                    winnerFontFamily='PrimaryFont'
                    fontFamily='PrimaryFont'
                    showWinnerModal={true}
                    winnerModalDuration={2000}
                    onWinnerModalClose={() => {}}
                  />
                </View>
              ) : (
                <View style={styles.courseSelectionContainer}>
                  {Platform.OS === 'ios' ? (
                    <TouchableOpacity
                      style={styles.iosCoursePicker}
                      onPress={() => {
                        const options = [
                          'İptal',
                          ...courses.map((c) => c.title),
                        ];

                        ActionSheetIOS.showActionSheetWithOptions(
                          {
                            options,
                            cancelButtonIndex: 0,
                            title: 'Bir Ders Seçin',
                            message: 'Bu dersten 5 rastgele soru gelecek',
                          },
                          (buttonIndex) => {
                            if (buttonIndex > 0) {
                              const selectedCourse = courses[buttonIndex - 1];
                              if (selectedCourse) {
                                handleCourseSelected(selectedCourse);
                              }
                            }
                          },
                        );
                      }}
                    >
                      <Text style={styles.iosPickerText}>
                        {selectedCourse
                          ? selectedCourse.title
                          : 'Bir Ders Seçin...'}
                      </Text>
                      <View style={styles.iosPickerChevron}>
                        <FontAwesome
                          name='chevron-down'
                          size={12}
                          color={Colors.gray[600]}
                        />
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <Picker
                      items={courses.map((c) => ({
                        label: c.title,
                        value: c.course_id,
                      }))}
                      selectedValue={selectedCourse?.course_id || null}
                      onValueChange={(val) => {
                        const course = courses.find((c) => c.course_id === val);
                        if (course) {
                          handleCourseSelected(course);
                        }
                      }}
                      placeholder='Bir Ders Seçin...'
                      enabled={true}
                      forceLight={true}
                      style={styles.androidPicker}
                      fontFamily='SecondaryFont-Regular'
                      placeholderFontFamily='SecondaryFont-Regular'
                    />
                  )}

                  <Button
                    title='Ders İçin Çevir'
                    onPress={() => setShowWheelForCourse(true)}
                    variant='secondary'
                    icon='random'
                    disabled={false}
                    style={styles.spinButton}
                    textStyle={styles.spinButtonText}
                  />
                </View>
              )}
            </>
          )}

          {/* Confirmation Step */}
          {challengeStep === 'confirm' && selectedCourse && (
            <>
              <View style={styles.confirmationContainer}>
                <Text style={styles.confirmationTitle}>
                  {isBotChallenge ? 'Bot Meydan Okuma' : 'Meydan Okuma'} Özeti
                </Text>

                <View style={styles.summaryCard}>
                  <Text style={styles.summaryText}>
                    <Text style={styles.summaryLabel}>Rakip:</Text>{' '}
                    {getOpponentDisplayName()}
                  </Text>
                  <Text style={styles.summaryText}>
                    <Text style={styles.summaryLabel}>Ders:</Text>{' '}
                    {selectedCourse.title}
                  </Text>
                  <Text style={styles.summaryText}>
                    <Text style={styles.summaryLabel}>Soru Sayısı:</Text> 5
                    Rastgele Soru
                  </Text>
                </View>
              </View>

              <Button
                title={isBotChallenge ? 'Bota Meydan Oku!' : 'Meydan Oku!'}
                onPress={handleChallengeSubmit}
                loading={isSubmittingChallenge || socketLoading}
                disabled={isSubmittingChallenge || socketLoading}
                style={styles.submitButton}
                textStyle={styles.submitButtonText}
              />

              <Button
                title='Geri Dön'
                onPress={() => setChallengeStep('selectCourse')}
                variant='outline'
                disabled={isSubmittingChallenge || socketLoading}
                style={styles.backButton}
                textStyle={styles.backButtonText}
              />
            </>
          )}

          {/* Error Display */}
          {error && (
            <View style={styles.errorContainer}>
              <Alert type='error' message={error} style={styles.errorAlert} />
            </View>
          )}
        </View>
      </Modal>
    );
  }, [
    modalVisible,
    handleCloseModal,
    getModalTitle,
    contextColor,
    getOpponentDisplayName,
    isBotChallenge,
    selectedBot,
    challengeStep,
    showWheelForCourse,
    courses,
    handleCourseSpinComplete,
    selectedCourse,
    handleCourseSelected,
    isSubmittingChallenge,
    socketLoading,
    handleChallengeSubmit,
    error,
  ]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <Container
        style={[styles.authLoadingContainer, { backgroundColor: contextColor }]}
      >
        <ActivityIndicator size='large' color={Colors.white} />
        <Text style={dynamicStyles.loadingText}>Kimlik doğrulanıyor...</Text>
      </Container>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={contextColor}
            colors={[contextColor]}
          />
        }
      >
        {/* Header Section */}
        <SlideInElement delay={0}>
          <PlayfulCard style={styles.headerCard}>
            <Row style={styles.headerRow}>
              <Column style={styles.headerColumn}>
                <PlayfulTitle
                  level={1}
                  gradient='primary'
                  style={dynamicStyles.headerTitle}
                >
                  Yeni Düello ⚔️
                </PlayfulTitle>
                <Paragraph style={dynamicStyles.headerSubtitle}>
                  {isAuthenticated
                    ? 'Rakip seç ve meydan okumaya başla'
                    : 'Meydan okumak için giriş yapın'}
                </Paragraph>
              </Column>
            </Row>
          </PlayfulCard>
        </SlideInElement>

        {/* Filter Buttons */}
        <SlideInElement delay={100}>
          <View style={styles.filterContainer}>
            <Row style={styles.filterRow}>
              <FilterButton
                filter='find'
                title='Rakip Bul'
                activeTab={activeTab}
                contextColor={contextColor}
                isDark={isDark}
                onPress={handleTabChange}
              />
              <FilterButton
                filter='friends'
                title='Arkadaşlar'
                activeTab={activeTab}
                contextColor={contextColor}
                isDark={isDark}
                onPress={handleTabChange}
              />
              {botOpponents.length > 0 && (
                <FilterButton
                  filter='bots'
                  title='Botlar'
                  activeTab={activeTab}
                  contextColor={contextColor}
                  isDark={isDark}
                  onPress={handleTabChange}
                />
              )}
              <FilterButton
                filter='leaderboard'
                title='Liderlik'
                activeTab={activeTab}
                contextColor={contextColor}
                isDark={isDark}
                onPress={handleTabChange}
              />
            </Row>
          </View>
        </SlideInElement>

        {/* Tab Content */}
        <View>
          <FloatingElement>
            <GlassCard
              style={[styles.tabContent, { backgroundColor: contextColor }]}
              animated
            >
              {renderTabContent()}
            </GlassCard>
          </FloatingElement>
        </View>

        {/* Bottom spacing to ensure content is fully visible */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Challenge Modal */}
      {renderChallengeModal()}
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing[4],
  },
  headerCard: {
    marginBottom: Spacing[6],
    backgroundColor: 'transparent',
  },
  headerRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerColumn: {
    flex: 1,
  },
  filterContainer: {
    marginBottom: Spacing[6],
  },
  filterRow: {
    marginBottom: Spacing[3],
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterButton: {
    flex: 1,
    marginHorizontal: Spacing[1],
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[2],
    borderRadius: BorderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    ...OPTIMIZED_SHADOW,
  },
  filterButtonText: {
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'SecondaryFont-Regular',
  },
  tabContent: {
    marginBottom: Spacing[4],
    overflow: 'hidden',
    ...OPTIMIZED_SHADOW,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing[8],
  },
  listItemContainer: {
    ...OPTIMIZED_SHADOW,
  },
  botCard: {
    marginBottom: Spacing[3],
    backgroundColor: 'rgba(255,255,255,0.95)',
    ...OPTIMIZED_SHADOW,
  },
  opponentCard: {
    marginBottom: Spacing[3],
    backgroundColor: 'rgba(255,255,255,0.95)',
    ...OPTIMIZED_SHADOW,
  },
  listItemRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listItemLeft: {
    alignItems: 'center',
    flex: 1,
  },
  listItemInfo: {
    flex: 1,
  },
  botName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.gray[800],
    fontFamily: 'SecondaryFont-Bold',
  },
  botStats: {
    fontSize: 12,
    color: Colors.gray[600],
    fontFamily: 'SecondaryFont-Regular',
  },
  opponentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.gray[800],
    fontFamily: 'SecondaryFont-Bold',
  },
  opponentStats: {
    fontSize: 12,
    color: Colors.gray[600],
    fontFamily: 'SecondaryFont-Regular',
  },
  badgeRow: {
    alignItems: 'center',
    marginTop: 4,
  },
  difficultyBadge: {
    marginRight: Spacing[2],
  },
  badgeText: {
    color: Colors.white,
    fontFamily: 'SecondaryFont-Bold',
  },
  challengeButton: {
    // backgroundColor set dynamically
  },
  challengeButtonText: {
    fontFamily: 'SecondaryFont-Bold',
  },
  searchCard: {
    marginTop: Spacing[4],
    ...OPTIMIZED_SHADOW,
  },
  searchInput: {
    fontFamily: 'PrimaryFont',
  },
  searchButton: {
    marginTop: Spacing[2],
    // backgroundColor set dynamically
  },
  searchButtonText: {
    fontFamily: 'SecondaryFont-Bold',
    color: Colors.white,
  },
  searchError: {
    marginTop: Spacing[2],
  },
  modalContent: {
    padding: Spacing[4],
    minHeight: 300,
  },
  opponentInfo: {
    marginBottom: Spacing[4],
  },
  opponentTitle: {
    fontSize: 16,
    color: Colors.gray[100],
    fontFamily: 'SecondaryFont-Bold',
    textAlign: 'center',
  },
  botDetails: {
    fontSize: 12,
    color: Colors.gray[300],
    fontFamily: 'SecondaryFont-Regular',
    textAlign: 'center',
    marginTop: 4,
  },
  courseDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.gray[300],
    fontFamily: 'SecondaryFont-Regular',
    marginBottom: Spacing[4],
    textAlign: 'center',
  },
  wheelContainer: {
    alignItems: 'center',
    paddingVertical: Spacing[4],
    minHeight: 300,
    marginBottom: Spacing[4],
  },
  courseSelectionContainer: {
    marginBottom: Spacing[4],
  },
  iosCoursePicker: {
    backgroundColor: Colors.white,
    borderColor: Colors.gray[300],
    borderWidth: 2,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[3],
    marginBottom: Spacing[3],
    minHeight: 44,
    justifyContent: 'center',
  },
  iosPickerText: {
    fontSize: 16,
    fontFamily: 'SecondaryFont-Regular',
  },
  iosPickerChevron: {
    position: 'absolute',
    right: Spacing[3],
    top: '50%',
    transform: [{ translateY: -6 }],
  },
  androidPicker: {
    backgroundColor: Colors.white,
    borderColor: Colors.gray[300],
    borderWidth: 2,
    marginBottom: Spacing[3],
  },
  spinButton: {
    minHeight: 44,
    backgroundColor: Colors.vibrant.purple,
    borderRadius: BorderRadius.lg,
  },
  spinButtonText: {
    fontFamily: 'SecondaryFont-Bold',
    fontSize: 16,
    color: Colors.white,
  },
  confirmationContainer: {
    marginBottom: Spacing[6],
  },
  confirmationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.gray[100],
    fontFamily: 'SecondaryFont-Bold',
    textAlign: 'center',
    marginBottom: Spacing[3],
  },
  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: Spacing[3],
    borderRadius: BorderRadius.md,
  },
  summaryText: {
    color: Colors.gray[200],
    fontFamily: 'SecondaryFont-Regular',
    marginBottom: Spacing[1],
  },
  summaryLabel: {
    fontWeight: 'bold',
  },
  submitButton: {
    minHeight: 48,
    backgroundColor: Colors.vibrant.purple,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing[2],
  },
  submitButtonText: {
    fontFamily: 'SecondaryFont-Bold',
    fontSize: 16,
    color: Colors.white,
  },
  backButton: {
    borderColor: Colors.white,
  },
  backButtonText: {
    fontFamily: 'SecondaryFont-Regular',
    color: Colors.white,
  },
  errorContainer: {
    marginTop: Spacing[3],
  },
  errorAlert: {
    backgroundColor: 'rgba(236, 28, 36, 0.1)',
    borderColor: Colors.error,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    margin: 0,
  },
  authLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[4],
  },
  bottomSpacing: {
    height: Spacing[8],
  },
});
