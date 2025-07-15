import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import {
  PlayfulCard,
  PlayfulButton,
  EmptyState,
  Badge,
  PlayfulTitle,
  Paragraph,
  Row,
  Column,
  SlideInElement,
  FloatingElement,
  CelebrationModal,
  ProgressBar,
  StatCard,
  Avatar,
} from '../../../components/ui';
import { Colors, Spacing, BorderRadius } from '../../../constants/theme';
import {
  getAchievementById,
  getUserAchievements,
  getAchievementsByCategory,
  type Achievement,
  type UserAchievement,
} from '../../../src/api/achievementService';

// Enhanced achievement interface for UI
interface EnhancedAchievement extends Achievement {
  date_earned?: string;
  progress?: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  is_unlocked: boolean;
  max_progress: number;
}

export default function AchievementScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // State
  const [achievement, setAchievement] = useState<EnhancedAchievement | null>(
    null,
  );
  const [relatedAchievements, setRelatedAchievements] = useState<
    EnhancedAchievement[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Helper functions
  const determineRarity = (
    points?: number,
  ): 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' => {
    if (!points) return 'common';
    if (points < 25) return 'common';
    if (points < 50) return 'uncommon';
    if (points < 100) return 'rare';
    if (points < 200) return 'epic';
    return 'legendary';
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return Colors.gray[500];
      case 'uncommon':
        return Colors.vibrant?.green || Colors.success;
      case 'rare':
        return Colors.vibrant?.blue || Colors.primary.DEFAULT;
      case 'epic':
        return Colors.vibrant?.purple || Colors.primary.dark;
      case 'legendary':
        return Colors.vibrant?.orange || Colors.secondary.DEFAULT;
      default:
        return Colors.gray[500];
    }
  };

  const getRarityBadgeVariant = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'secondary' as const;
      case 'uncommon':
        return 'success' as const;
      case 'rare':
        return 'info' as const;
      case 'epic':
        return 'warning' as const;
      case 'legendary':
        return 'error' as const;
      default:
        return 'secondary' as const;
    }
  };

  const enhanceAchievement = (
    baseAchievement: Achievement,
    userAchievement?: UserAchievement,
  ): EnhancedAchievement => {
    return {
      ...baseAchievement,
      date_earned: userAchievement?.date_earned,
      progress: userAchievement?.progress || 0,
      rarity: determineRarity(baseAchievement.points),
      is_unlocked: !!userAchievement,
      max_progress: 1,
    };
  };

  const getProgressPercentage = () => {
    if (!achievement) return 0;
    if (achievement.is_unlocked) return 100;
    return Math.round(
      ((achievement.progress || 0) / achievement.max_progress) * 100,
    );
  };

  // Data fetching
  const fetchAchievementData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate ID parameter
      if (!id) {
        setError("Başarı ID'si bulunamadı");
        return;
      }

      // Handle array case (if multiple params with same key)
      const achievementIdString = Array.isArray(id) ? id[0] : id;

      // Validate that ID is a valid number
      const achievementId = Number(achievementIdString);
      if (
        isNaN(achievementId) ||
        !Number.isInteger(achievementId) ||
        achievementId <= 0
      ) {
        setError("Geçersiz başarı ID'si");
        return;
      }

      // Get the specific achievement
      const achievementData = await getAchievementById(achievementId);
      if (!achievementData) {
        setError('Başarı bulunamadı');
        return;
      }

      // Get user achievements to check unlock status
      const userAchievements = await getUserAchievements();
      const userAchievement = userAchievements.find(
        (ua) => ua.achievement_id === achievementData.achievement_id,
      );

      // Enhance achievement with UI data
      const enhanced = enhanceAchievement(achievementData, userAchievement);
      setAchievement(enhanced);

      // Get related achievements from same category
      if (achievementData.category) {
        try {
          const categoryAchievements = await getAchievementsByCategory(
            achievementData.category,
          );
          const relatedList = categoryAchievements
            .filter((a) => a.achievement_id !== achievementData.achievement_id)
            .slice(0, 3)
            .map((a) => {
              const userAch = userAchievements.find(
                (ua) => ua.achievement_id === a.achievement_id,
              );
              return enhanceAchievement(a, userAch);
            });
          setRelatedAchievements(relatedList);
        } catch (err) {
          console.error('Error fetching related achievements:', err);
        }
      }

      // Check if just unlocked (within last 5 minutes)
      if (enhanced.is_unlocked && enhanced.date_earned) {
        const unlockTime = new Date(enhanced.date_earned).getTime();
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        if (unlockTime > fiveMinutesAgo) {
          setTimeout(() => setShowCelebration(true), 500);
        }
      }
    } catch (err) {
      console.error('Error fetching achievement:', err);

      // Handle specific API errors
      if (err instanceof Error) {
        if (err.message.includes('Failed to retrieve achievement')) {
          setError('Başarı bilgileri alınamadı');
        } else if (err.message.includes('404')) {
          setError('Başarı bulunamadı');
        } else {
          setError('Başarı bilgileri yüklenirken hata oluştu');
        }
      } else {
        setError('Başarı bilgileri yüklenirken hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAchievementData();
  }, [fetchAchievementData]);

  // Event handlers
  const handleShareAchievement = () => {
    console.log('Sharing achievement:', achievement?.name);
    // Implement sharing logic
  };

  const handleViewAllAchievements = () => {
    router.push('/(tabs)/profile/achievements' as any);
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Başarı',
            headerStyle: { backgroundColor: Colors.vibrant?.purpleDark },
            headerTintColor: Colors.white,
          }}
        />
        <View style={styles.centerContent}>
          <ActivityIndicator
            size='large'
            color={Colors.vibrant?.coral || Colors.primary.DEFAULT}
          />
          <Text style={styles.loadingText}>Başarı yükleniyor...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error || !achievement) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Başarı',
            headerStyle: { backgroundColor: Colors.vibrant?.purpleDark },
            headerTintColor: Colors.white,
          }}
        />
        <EmptyState
          icon='exclamation-triangle'
          title='Başarı Bulunamadı'
          message={error || 'İstenen başarı bulunamadı'}
          fontFamily='SecondaryFont-Regular'
          titleFontFamily='PrimaryFont'
          actionButton={{
            title: 'Geri Dön',
            onPress: () => router.back(),
            variant: 'primary',
          }}
          buttonFontFamily='PrimaryFont'
          style={{ margin: Spacing[4] }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: achievement.name,
          headerStyle: { backgroundColor: Colors.vibrant?.purpleDark },
          headerTintColor: Colors.white,
        }}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: Spacing[4] }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <SlideInElement delay={0}>
          <PlayfulCard
            style={styles.heroCard}
            variant='gradient'
            gradient='primary'
            animated
            floatingAnimation
          >
            <Column style={styles.heroContent}>
              {/* Achievement Icon */}
              <FloatingElement distance={15}>
                <View
                  style={[
                    styles.achievementIcon,
                    {
                      backgroundColor: achievement.is_unlocked
                        ? getRarityColor(achievement.rarity)
                        : Colors.gray[400],
                      opacity: achievement.is_unlocked ? 1 : 0.6,
                    },
                  ]}
                >
                  <FontAwesome
                    name={(achievement.icon as any) || 'star'}
                    size={48}
                    color={Colors.white}
                  />
                </View>
              </FloatingElement>

              {/* Achievement Info */}
              <PlayfulTitle level={1} style={styles.achievementTitle}>
                {achievement.name}
              </PlayfulTitle>

              <Paragraph style={styles.achievementDescription}>
                {achievement.description}
              </Paragraph>

              {/* Status and Rarity Badges */}
              <Row style={styles.badgeRow}>
                <Badge
                  text={achievement.is_unlocked ? 'Tamamlandı' : 'Devam Ediyor'}
                  variant={achievement.is_unlocked ? 'success' : 'warning'}
                  size='md'
                />
                <Badge
                  text={achievement.rarity.toUpperCase()}
                  variant={getRarityBadgeVariant(achievement.rarity)}
                  size='md'
                />
              </Row>

              {/* Points Display */}
              <View style={styles.pointsContainer}>
                <FontAwesome
                  name='star'
                  size={16}
                  color={Colors.vibrant?.yellow}
                />
                <Text style={styles.pointsText}>{achievement.points} Puan</Text>
              </View>
            </Column>
          </PlayfulCard>
        </SlideInElement>

        {/* Progress Section */}
        <SlideInElement delay={200}>
          <PlayfulCard
            title='İlerleme'
            titleFontFamily='PrimaryFont'
            style={styles.sectionCard}
            variant='elevated'
            animated
          >
            <Column style={styles.progressContent}>
              <Row style={styles.progressHeader}>
                <Text style={styles.progressText}>
                  {achievement.is_unlocked
                    ? achievement.max_progress
                    : achievement.progress || 0}{' '}
                  / {achievement.max_progress}
                </Text>
                <Text style={styles.progressPercentage}>
                  %{getProgressPercentage()}
                </Text>
              </Row>

              <ProgressBar
                progress={getProgressPercentage()}
                height={12}
                width='100%'
                trackColor={Colors.gray[200]}
                progressColor={getRarityColor(achievement.rarity)}
                style={styles.progressBar}
                animated
              />

              {!achievement.is_unlocked && (
                <Text style={styles.remainingText}>
                  {achievement.max_progress - (achievement.progress || 0)} adım
                  kaldı
                </Text>
              )}

              {achievement.date_earned && (
                <Text style={styles.dateEarnedText}>
                  {new Date(achievement.date_earned).toLocaleDateString(
                    'tr-TR',
                    {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    },
                  )}{' '}
                  tarihinde kazanıldı
                </Text>
              )}
            </Column>
          </PlayfulCard>
        </SlideInElement>

        {/* Stats Section */}
        <SlideInElement delay={400}>
          <Row style={styles.statsRow}>
            <StatCard
              icon='tag'
              title='Kategori'
              value={achievement.category || 'Genel'}
              color={getRarityColor(achievement.rarity)}
              titleFontFamily='SecondaryFont-Bold'
            />
            <StatCard
              icon='calendar'
              title='Oluşturulma'
              value={new Date(achievement.created_at).getFullYear().toString()}
              color={Colors.vibrant?.blue || Colors.primary.DEFAULT}
              titleFontFamily='SecondaryFont-Bold'
            />
          </Row>
        </SlideInElement>

        {/* Actions Section */}
        <SlideInElement delay={600}>
          <PlayfulCard
            title='Hızlı İşlemler'
            titleFontFamily='PrimaryFont'
            style={styles.sectionCard}
            variant='playful'
            animated
          >
            <Row>
              {achievement.is_unlocked && (
                <PlayfulButton
                  title='Başarıyı Paylaş'
                  onPress={handleShareAchievement}
                  variant='outline'
                  style={{
                    flex: 1,
                    marginRight: Spacing[1],
                    alignSelf: 'stretch',
                  }}
                  icon='share'
                  animated
                  size='xs'
                  fontFamily='PrimaryFont'
                />
              )}
              <PlayfulButton
                title='Tüm Başarıları Gör'
                onPress={handleViewAllAchievements}
                variant='outline'
                style={{
                  flex: 1,
                  marginLeft: achievement.is_unlocked ? Spacing[1] : 0,
                  alignSelf: 'stretch',
                }}
                icon='list'
                animated
                size='xs'
                fontFamily='PrimaryFont'
              />
            </Row>
          </PlayfulCard>
        </SlideInElement>

        {/* Related Achievements */}
        {relatedAchievements.length > 0 && (
          <SlideInElement delay={800}>
            <PlayfulCard
              title='İlgili Başarılar'
              titleFontFamily='PrimaryFont'
              style={styles.sectionCard}
              variant='glass'
              animated
              floatingAnimation
            >
              <Column style={styles.relatedContent}>
                {relatedAchievements.map((related, index) => (
                  <TouchableOpacity
                    key={related.achievement_id}
                    style={styles.relatedItem}
                    onPress={() =>
                      router.push(
                        `/(tabs)/profile/achievement/${related.achievement_id}` as any,
                      )
                    }
                  >
                    <Row style={styles.relatedItemContent}>
                      <Avatar
                        name={related.icon || 'star'}
                        size='md'
                        bgColor={
                          related.is_unlocked
                            ? getRarityColor(related.rarity)
                            : Colors.gray[400]
                        }
                        style={{ opacity: related.is_unlocked ? 1 : 0.6 }}
                      />
                      <Column style={styles.relatedItemText}>
                        <Text style={styles.relatedItemTitle}>
                          {related.name}
                        </Text>
                        <Text style={styles.relatedItemDescription}>
                          {related.description}
                        </Text>
                        <Badge
                          text={
                            related.is_unlocked ? 'Tamamlandı' : 'Devam Ediyor'
                          }
                          variant={related.is_unlocked ? 'success' : 'warning'}
                          size='sm'
                          style={styles.relatedItemBadge}
                        />
                      </Column>
                      <FontAwesome
                        name='chevron-right'
                        size={16}
                        color={Colors.gray[400]}
                      />
                    </Row>
                  </TouchableOpacity>
                ))}
              </Column>
            </PlayfulCard>
          </SlideInElement>
        )}

        {/* Bottom spacing */}
        <View style={{ height: Spacing[8] }} />
      </ScrollView>

      {/* Celebration Modal */}
      {achievement && (
        <CelebrationModal
          visible={showCelebration}
          onClose={() => setShowCelebration(false)}
          title='Başarı Kazanıldı!'
          celebrationType='achievement'
          achievement={achievement.name}
          score={achievement.points}
          autoClose={5000}
          animated
        >
          <></>
        </CelebrationModal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: Colors.vibrant?.purpleDark || Colors.primary.dark,
    marginTop: Spacing[3],
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing[3],
    color: Colors.white,
    fontFamily: 'SecondaryFont-Regular',
    fontSize: 16,
  },
  heroCard: {
    marginBottom: Spacing[6],
  },
  heroContent: {
    alignItems: 'center',
  },
  achievementIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[4],
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  achievementTitle: {
    fontFamily: 'PrimaryFont',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing[2],
  },
  achievementDescription: {
    color: Colors.white,
    textAlign: 'center',
    fontFamily: 'SecondaryFont-Regular',
    opacity: 0.9,
    marginBottom: Spacing[4],
  },
  badgeRow: {
    gap: Spacing[3],
    marginBottom: Spacing[3],
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[4],
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BorderRadius.full,
  },
  pointsText: {
    color: Colors.white,
    fontFamily: 'SecondaryFont-Bold',
    fontSize: 16,
  },
  sectionCard: {
    marginBottom: Spacing[4],
  },
  progressContent: {
    gap: Spacing[3],
  },
  progressHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray[800],
    fontFamily: 'SecondaryFont-Bold',
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.gray[800],
    fontFamily: 'PrimaryFont',
  },
  progressBar: {
    borderRadius: BorderRadius.lg,
  },
  remainingText: {
    fontSize: 14,
    color: Colors.gray[600],
    fontFamily: 'SecondaryFont-Regular',
    textAlign: 'center',
  },
  dateEarnedText: {
    fontSize: 14,
    color: Colors.gray[600],
    fontFamily: 'SecondaryFont-Regular',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  statsRow: {
    justifyContent: 'space-between',
    marginBottom: Spacing[4],
  },
  relatedContent: {
    gap: Spacing[3],
  },
  relatedItem: {
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  relatedItemContent: {
    alignItems: 'center',
    gap: Spacing[3],
  },
  relatedItemText: {
    flex: 1,
  },
  relatedItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[800],
    fontFamily: 'SecondaryFont-Bold',
    marginBottom: Spacing[1],
  },
  relatedItemDescription: {
    fontSize: 14,
    color: Colors.gray[600],
    fontFamily: 'SecondaryFont-Regular',
    marginBottom: Spacing[2],
  },
  relatedItemBadge: {
    alignSelf: 'flex-start',
  },
});
