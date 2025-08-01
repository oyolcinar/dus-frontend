import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  FlatList,
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
  GlassCard,
} from '../../../components/ui';
import { Colors, Spacing, BorderRadius } from '../../../constants/theme';
import {
  getAchievementById,
  getUserAchievements,
  getUserAchievementProgress,
  getAchievementsByCategory,
  getAllAchievements,
  formatProgressPercentage,
  isAchievementCompleted,
  getNextMilestone,
  getTurkishRequirementName,
  getTurkishRequirementDetail,
  getTurkishCompletionStatus,
  getTurkishCategoryName,
  getTurkishRarityName,
  type Achievement,
  type UserAchievement,
  type AchievementProgress,
} from '../../../src/api/achievementService';

// Enhanced achievement interface combining all data sources
interface EnhancedAchievement extends Achievement {
  date_earned?: string;
  progress_data?: AchievementProgress;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  is_unlocked: boolean;
  overall_progress: number;
  next_milestone?: string | null;
}

export default function AchievementScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Determine if this is list mode or detail mode
  const isListMode = !id;

  // State for detail mode
  const [achievement, setAchievement] = useState<EnhancedAchievement | null>(
    null,
  );
  const [relatedAchievements, setRelatedAchievements] = useState<
    EnhancedAchievement[]
  >([]);

  // State for list mode
  const [achievements, setAchievements] = useState<EnhancedAchievement[]>([]);
  const [filteredAchievements, setFilteredAchievements] = useState<
    EnhancedAchievement[]
  >([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Common state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Safe color fallbacks
  const getHeaderColor = () => {
    return Colors.primary?.DEFAULT || '#3b82f6';
  };

  const getCoralColor = () => {
    return Colors.vibrant?.coral || '#f97316';
  };

  const getYellowColor = () => {
    return Colors.vibrant?.yellow || '#fbbf24';
  };

  // Helper function to safely handle progress values
  const safeProgress = (value: number | undefined | null): number => {
    if (value === undefined || value === null || isNaN(value)) {
      return 0;
    }
    return Math.max(0, Math.min(100, value));
  };

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
        return Colors.gray?.[500] || '#6b7280';
      case 'uncommon':
        return Colors.vibrant?.green || Colors.success || '#10b981';
      case 'rare':
        return Colors.vibrant?.blue || Colors.primary?.DEFAULT || '#3b82f6';
      case 'epic':
        return Colors.vibrant?.purple || Colors.primary?.dark || '#8b5cf6';
      case 'legendary':
        return Colors.vibrant?.orange || Colors.secondary?.DEFAULT || '#f59e0b';
      default:
        return Colors.gray?.[500] || '#6b7280';
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
    progressData?: AchievementProgress,
  ): EnhancedAchievement => {
    const rawProgress =
      progressData?.overall_progress || (userAchievement ? 100 : 0);
    const overall_progress = safeProgress(rawProgress);

    return {
      ...baseAchievement,
      date_earned: userAchievement?.date_earned,
      progress_data: progressData,
      rarity: determineRarity(baseAchievement.points),
      is_unlocked: !!userAchievement,
      overall_progress,
      next_milestone: progressData ? getNextMilestone(progressData) : null,
    };
  };

  // Data fetching for detail mode
  const fetchAchievementData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!id) {
        setError("Başarı ID'si bulunamadı");
        return;
      }

      const achievementIdString = Array.isArray(id) ? id[0] : id;
      const achievementId = Number(achievementIdString);

      if (
        isNaN(achievementId) ||
        !Number.isInteger(achievementId) ||
        achievementId <= 0
      ) {
        setError("Geçersiz başarı ID'si");
        return;
      }

      // Fetch all required data in parallel
      const [achievementData, userAchievements, progressData] =
        await Promise.all([
          getAchievementById(achievementId),
          getUserAchievements(),
          getUserAchievementProgress(),
        ]);

      if (!achievementData) {
        setError('Başarı bulunamadı');
        return;
      }

      const userAchievement = userAchievements.find(
        (ua) => ua.achievement_id === achievementData.achievement_id,
      );

      const achievementProgress = progressData.find(
        (ap) => ap.achievement_id === achievementData.achievement_id,
      );

      const enhanced = enhanceAchievement(
        achievementData,
        userAchievement,
        achievementProgress,
      );
      setAchievement(enhanced);

      // Fetch related achievements
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
              const achProgress = progressData.find(
                (ap) => ap.achievement_id === a.achievement_id,
              );
              return enhanceAchievement(a, userAch, achProgress);
            });
          setRelatedAchievements(relatedList);
        } catch (err) {
          console.error('Error fetching related achievements:', err);
        }
      }

      // Show celebration for recently earned achievements
      if (enhanced.is_unlocked && enhanced.date_earned) {
        const unlockTime = new Date(enhanced.date_earned).getTime();
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        if (unlockTime > fiveMinutesAgo) {
          setTimeout(() => setShowCelebration(true), 500);
        }
      }
    } catch (err) {
      console.error('Error fetching achievement:', err);
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

  // Data fetching for list mode
  const fetchAllAchievements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all required data in parallel
      const [allAchievements, userAchievements, progressData] =
        await Promise.all([
          getAllAchievements().catch(() => {
            // Fallback: Get achievements from known categories
            const categories = [
              'general',
              'learning',
              'social',
              'progress',
              'special',
            ];
            return Promise.all(
              categories.map(async (category) => {
                try {
                  return await getAchievementsByCategory(category);
                } catch (err) {
                  console.warn(`Failed to fetch category ${category}:`, err);
                  return [];
                }
              }),
            ).then((results) => results.flat());
          }),
          getUserAchievements(),
          getUserAchievementProgress(),
        ]);

      // Remove duplicates based on achievement_id
      const uniqueAchievements = allAchievements.filter(
        (achievement, index, self) =>
          index ===
          self.findIndex(
            (a) => a.achievement_id === achievement.achievement_id,
          ),
      );

      const enhancedAchievements = uniqueAchievements.map((ach) => {
        const userAch = userAchievements.find(
          (ua) => ua.achievement_id === ach.achievement_id,
        );
        const achProgress = progressData.find(
          (ap) => ap.achievement_id === ach.achievement_id,
        );
        return enhanceAchievement(ach, userAch, achProgress);
      });

      setAchievements(enhancedAchievements);
      setFilteredAchievements(enhancedAchievements);
    } catch (err) {
      console.error('Error fetching achievements:', err);
      setError('Başarılar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter achievements
  const filterAchievements = useCallback(() => {
    let filtered = [...achievements];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((ach) => ach.category === selectedCategory);
    }

    // Filter by status
    if (selectedStatus === 'unlocked') {
      filtered = filtered.filter((ach) => ach.is_unlocked);
    } else if (selectedStatus === 'locked') {
      filtered = filtered.filter((ach) => !ach.is_unlocked);
    }

    setFilteredAchievements(filtered);
  }, [achievements, selectedCategory, selectedStatus]);

  useEffect(() => {
    if (isListMode) {
      fetchAllAchievements();
    } else {
      fetchAchievementData();
    }
  }, [isListMode, fetchAllAchievements, fetchAchievementData]);

  useEffect(() => {
    if (isListMode) {
      filterAchievements();
    }
  }, [isListMode, filterAchievements]);

  // Get unique categories for filter
  const getCategories = (): string[] => {
    const categories = achievements
      .map((ach) => ach.category)
      .filter((category): category is string => Boolean(category))
      .filter((category, index, self) => self.indexOf(category) === index);
    return ['all', ...categories];
  };

  // Helper function to safely set category
  const handleCategoryChange = (category: string | undefined) => {
    setSelectedCategory(category || 'all');
  };

  // Event handlers
  const handleShareAchievement = () => {
    console.log('Sharing achievement:', achievement?.name);
  };

  const handleViewAllAchievements = () => {
    router.push('/(tabs)/profile/achievements' as any);
  };

  const handleAchievementPress = (achievementItem: EnhancedAchievement) => {
    router.push(
      `/(tabs)/profile/achievement/${achievementItem.achievement_id}` as any,
    );
  };

  // Render progress requirements detail with Turkish translations
  const renderProgressRequirements = (progressData: AchievementProgress) => {
    const requirements = Object.entries(progressData.requirements);

    return (
      <Column style={styles.requirementsContainer}>
        <Text style={styles.requirementsTitle}>Gereksinimler:</Text>
        {requirements.map(([key, req]) => (
          <View key={key} style={styles.requirementItem}>
            <Row style={styles.requirementHeader}>
              <Text style={styles.requirementLabel}>
                {getTurkishRequirementName(key)}
              </Text>
            </Row>
            <ProgressBar
              progress={req.progress}
              height={22}
              width='100%'
              trackColor={Colors.gray?.[200] || '#e5e7eb'}
              progressColor={getRarityColor(
                progressData.overall_progress >= 100 ? 'legendary' : 'rare',
              )}
              style={styles.requirementProgressBar}
              showPercentageInside={true}
              animated
            />
            <Text style={styles.requirementDetail}>
              {getTurkishRequirementDetail(key, req)}
            </Text>
          </View>
        ))}
      </Column>
    );
  };

  // Render achievement list item with improved layout and Turkish support
  const renderAchievementItem = ({ item }: { item: EnhancedAchievement }) => (
    <SlideInElement delay={0}>
      <TouchableOpacity
        style={styles.achievementListItem}
        onPress={() => handleAchievementPress(item)}
      >
        <GlassCard style={styles.listItemCard}>
          {/* Fixed horizontal alignment by wrapping content */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* Achievement Icon */}
            <View
              style={[
                styles.achievementIconSmall,
                {
                  backgroundColor: item.is_unlocked
                    ? getRarityColor(item.rarity)
                    : Colors.gray?.[400] || '#9ca3af',
                  opacity: item.is_unlocked ? 1 : 0.6,
                },
              ]}
            >
              <FontAwesome
                name={(item.icon as any) || 'star'}
                size={18}
                color={Colors.white || '#ffffff'}
              />
            </View>

            {/* Achievement Info */}
            <Column style={styles.listItemText}>
              <Text style={styles.listItemTitle}>{item.name}</Text>

              {/* Full description display */}
              <Text style={styles.listItemDescription}>
                {item.description || 'Açıklama bulunmuyor'}
              </Text>

              {/* Progress info for locked achievements */}
              {!item.is_unlocked && item.next_milestone && (
                <Text style={styles.nextMilestone}>{item.next_milestone}</Text>
              )}

              {/* Status badge - no percentage anymore */}
              <Row style={styles.listItemFooter}>
                <Badge
                  text={item.is_unlocked ? 'Tamamlandı' : 'Devam Ediyor'}
                  variant={item.is_unlocked ? 'success' : 'warning'}
                  size='sm'
                  fontFamily='SecondaryFont-Bold'
                />
              </Row>

              {/* Progress bar with percentage inside for incomplete achievements */}
              {!item.is_unlocked && (
                <ProgressBar
                  progress={safeProgress(item.overall_progress)}
                  height={24}
                  width='100%'
                  trackColor={Colors.gray?.[200] || '#e5e7eb'}
                  progressColor={getRarityColor(item.rarity)}
                  style={styles.listItemProgress}
                  showPercentageInside={true}
                  animated
                />
              )}
            </Column>
          </View>
        </GlassCard>
      </TouchableOpacity>
    </SlideInElement>
  );

  // Get header title
  const getHeaderTitle = () => {
    if (isListMode) return 'Başarılar';
    return achievement?.name || 'Başarı';
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: getHeaderTitle(),
            headerStyle: { backgroundColor: getHeaderColor() },
            headerTintColor: Colors.white || '#ffffff',
            headerTitleStyle: {
              fontFamily: 'PrimaryFont',
            },
          }}
        />
        <View style={styles.centerContent}>
          <ActivityIndicator size='large' color={getCoralColor()} />
          <Text style={styles.loadingText}>
            {isListMode ? 'Başarılar' : 'Başarı'} yükleniyor...
          </Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error || (!isListMode && !achievement)) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: getHeaderTitle(),
            headerStyle: { backgroundColor: getHeaderColor() },
            headerTintColor: Colors.white || '#ffffff',
            headerTitleStyle: {
              fontFamily: 'PrimaryFont',
            },
          }}
        />
        <EmptyState
          icon='exclamation-triangle'
          title={isListMode ? 'Başarılar Bulunamadı' : 'Başarı Bulunamadı'}
          message={
            error ||
            (isListMode
              ? 'Henüz başarı bulunmuyor'
              : 'İstenen başarı bulunamadı')
          }
          fontFamily='SecondaryFont-Regular'
          titleFontFamily='PrimaryFont'
          actionButton={{
            title: 'Geri Dön',
            onPress: () => router.back(),
            variant: 'primary',
          }}
          buttonFontFamily='PrimaryFont'
          style={{ margin: Spacing?.[4] || 16 }}
        />
      </View>
    );
  }

  // List Mode Render
  if (isListMode) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Başarılar',
            headerStyle: { backgroundColor: getHeaderColor() },
            headerTintColor: Colors.white || '#ffffff',
            headerTitleStyle: {
              fontFamily: 'PrimaryFont',
            },
          }}
        />

        <ScrollView
          style={styles.listContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Filter Section */}
          <SlideInElement delay={0}>
            <PlayfulCard style={styles.filterCard} variant='playful' animated>
              <Column style={styles.filterContent}>
                <Text style={styles.filterTitle}>Başarılar</Text>

                {/* Status Filter */}
                <Column style={styles.statusFilterContainer}>
                  <Row style={styles.statusFilterRow}>
                    {[
                      { key: 'all', label: 'Tümü' },
                      { key: 'unlocked', label: 'Tamamlanan' },
                      { key: 'locked', label: 'Devam Eden' },
                    ].map((status) => (
                      <TouchableOpacity
                        key={status.key}
                        onPress={() => setSelectedStatus(status.key)}
                        style={[
                          styles.statusButton,
                          selectedStatus === status.key &&
                            styles.statusButtonActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusButtonText,
                            selectedStatus === status.key &&
                              styles.statusButtonTextActive,
                          ]}
                        >
                          {status.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </Row>
                </Column>
              </Column>
            </PlayfulCard>
          </SlideInElement>

          {/* Achievements List */}
          <View style={styles.listContent}>
            <FlatList
              data={filteredAchievements}
              renderItem={renderAchievementItem}
              keyExtractor={(item) => item.achievement_id.toString()}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <EmptyState
                  icon='trophy'
                  title='Başarı Bulunamadı'
                  message='Seçilen filtrelere uygun başarı bulunamadı'
                  fontFamily='SecondaryFont-Regular'
                  titleFontFamily='PrimaryFont'
                />
              }
            />
          </View>

          <View style={{ height: Spacing?.[8] || 32 }} />
        </ScrollView>
      </View>
    );
  }

  // Detail Mode Render
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: achievement!.name,
          headerStyle: { backgroundColor: getHeaderColor() },
          headerTintColor: Colors.white || '#ffffff',
          headerTitleStyle: {
            fontFamily: 'PrimaryFont',
          },
        }}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: Spacing?.[4] || 16 }}
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
              <FloatingElement distance={15}>
                <View
                  style={[
                    styles.achievementIcon,
                    {
                      backgroundColor: achievement!.is_unlocked
                        ? getRarityColor(achievement!.rarity)
                        : Colors.gray?.[400] || '#9ca3af',
                      opacity: achievement!.is_unlocked ? 1 : 0.6,
                    },
                  ]}
                >
                  <FontAwesome
                    name={(achievement!.icon as any) || 'star'}
                    size={48}
                    color={Colors.white || '#ffffff'}
                  />
                </View>
              </FloatingElement>

              <PlayfulTitle level={1} style={styles.achievementTitle}>
                {achievement!.name}
              </PlayfulTitle>

              <Paragraph style={styles.achievementDescription}>
                {achievement!.description || 'Açıklama bulunmuyor'}
              </Paragraph>

              <Row style={styles.badgeRow}>
                <Badge
                  text={
                    achievement!.is_unlocked ? 'Tamamlandı' : 'Devam Ediyor'
                  }
                  variant={achievement!.is_unlocked ? 'success' : 'warning'}
                  size='md'
                  fontFamily='SecondaryFont-Bold'
                />
                <Badge
                  text={getTurkishRarityName(achievement!.rarity)}
                  variant={getRarityBadgeVariant(achievement!.rarity)}
                  size='md'
                  fontFamily='SecondaryFont-Bold'
                />
              </Row>

              <View style={styles.pointsContainer}>
                <Text style={styles.pointsText}>
                  {achievement!.points} Puan
                </Text>
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
                <Text style={styles.progressText}>Genel İlerleme</Text>
              </Row>

              <ProgressBar
                progress={safeProgress(achievement!.overall_progress)}
                height={32}
                width='100%'
                trackColor={Colors.gray?.[200] || '#e5e7eb'}
                progressColor={getRarityColor(achievement!.rarity)}
                style={styles.progressBar}
                showPercentageInside={true}
                animated
              />

              {/* Next milestone */}
              {!achievement!.is_unlocked && achievement!.next_milestone && (
                <Text style={styles.remainingText}>
                  {achievement!.next_milestone}
                </Text>
              )}

              {/* Date earned */}
              {achievement!.date_earned && (
                <Text style={styles.dateEarnedText}>
                  {new Date(achievement!.date_earned).toLocaleDateString(
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

              {/* Detailed progress requirements */}
              {achievement!.progress_data && !achievement!.is_unlocked && (
                <View style={styles.detailedProgress}>
                  {renderProgressRequirements(achievement!.progress_data)}
                </View>
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
              value={getTurkishCategoryName(achievement!.category || 'general')}
              color={getRarityColor(achievement!.rarity)}
              titleFontFamily='SecondaryFont-Bold'
            />
            <StatCard
              icon='calendar'
              title='Oluşturulma'
              value={new Date(achievement!.created_at).getFullYear().toString()}
              color={
                Colors.vibrant?.blue || Colors.primary?.DEFAULT || '#3b82f6'
              }
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
              {achievement!.is_unlocked && (
                <PlayfulButton
                  title='Başarıyı Paylaş'
                  onPress={handleShareAchievement}
                  variant='outline'
                  style={{
                    flex: 1,
                    marginRight: Spacing?.[1] || 4,
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
                  marginLeft: achievement!.is_unlocked ? Spacing?.[1] || 4 : 0,
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
                        name={(related.icon as any) || 'star'}
                        size='md'
                        bgColor={
                          related.is_unlocked
                            ? getRarityColor(related.rarity)
                            : Colors.gray?.[400] || '#9ca3af'
                        }
                        style={{ opacity: related.is_unlocked ? 1 : 0.6 }}
                      />
                      <Column style={styles.relatedItemText}>
                        <Text style={styles.relatedItemTitle}>
                          {related.name}
                        </Text>
                        <Text style={styles.relatedItemDescription}>
                          {related.description || 'Açıklama bulunmuyor'}
                        </Text>
                        <Badge
                          text={
                            related.is_unlocked
                              ? 'Tamamlandı'
                              : `${formatProgressPercentage(
                                  safeProgress(related.overall_progress),
                                )}`
                          }
                          variant={related.is_unlocked ? 'success' : 'warning'}
                          size='sm'
                          fontFamily='SecondaryFont-Bold'
                          style={styles.relatedItemBadge}
                        />
                      </Column>
                      <FontAwesome
                        name='chevron-right'
                        size={16}
                        color={Colors.gray?.[400] || '#9ca3af'}
                      />
                    </Row>
                  </TouchableOpacity>
                ))}
              </Column>
            </PlayfulCard>
          </SlideInElement>
        )}

        <View style={{ height: Spacing?.[8] || 32 }} />
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
    backgroundColor: Colors.primary?.dark || '#1e3a8a',
    paddingTop: Spacing?.[3],
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary?.dark || '#1e3a8a',
  },
  loadingText: {
    marginTop: Spacing?.[3] || 12,
    color: Colors.white || '#ffffff',
    fontFamily: 'SecondaryFont-Regular',
    fontSize: 16,
  },

  // List Mode Styles
  listContainer: {
    flex: 1,
    backgroundColor: Colors.primary?.dark || '#1e3a8a',
  },
  filterCard: {
    margin: Spacing?.[4] || 16,
    marginBottom: Spacing?.[3] || 12,
    shadowColor: Colors.gray[900],
    shadowOffset: { width: 10, height: 20 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  filterContent: {
    gap: Spacing?.[3] || 12,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white || '#ffffff',
    fontFamily: 'PrimaryFont',
    marginBottom: Spacing?.[2] || 8,
  },
  statusFilterContainer: {
    gap: Spacing?.[2] || 8,
  },
  statusFilterRow: {
    gap: Spacing?.[2] || 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: Spacing?.[2] || 8,
    paddingHorizontal: Spacing?.[2] || 8,
    borderRadius: BorderRadius?.md || 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    minHeight: 36,
    justifyContent: 'center',
  },
  statusButtonActive: {
    backgroundColor: Colors.white || '#ffffff',
    borderColor: Colors.white || '#ffffff',
  },
  statusButtonText: {
    fontSize: 14,
    color: Colors.white || '#ffffff',
    fontFamily: 'SecondaryFont-Regular',
    textAlign: 'center',
  },
  statusButtonTextActive: {
    color: Colors.primary?.dark || '#1e3a8a',
    fontFamily: 'SecondaryFont-Regular',
  },
  listContent: {
    paddingHorizontal: Spacing?.[4] || 16,
  },
  achievementListItem: {
    marginBottom: Spacing?.[3] || 12,
  },
  listItemCard: {
    padding: Spacing?.[4] || 16,
  },
  achievementIconSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing?.[3] || 12,
    shadowColor: Colors.black || '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  listItemText: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white || '#ffffff',
    fontFamily: 'SecondaryFont-Bold',
    marginBottom: Spacing?.[2] || 8,
  },
  listItemDescription: {
    fontSize: 14,
    color: Colors.gray?.[100] || '#f3f4f6',
    fontFamily: 'SecondaryFont-Regular',
    marginBottom: Spacing?.[3] || 12,
    lineHeight: 20,
  },
  nextMilestone: {
    fontSize: 12,
    color: Colors.vibrant?.yellow || '#fbbf24',
    fontFamily: 'SecondaryFont-Regular',
    marginBottom: Spacing?.[2] || 8,
    fontStyle: 'italic',
  },
  listItemFooter: {
    alignItems: 'flex-start',
    gap: Spacing?.[2] || 8,
    marginBottom: Spacing?.[3] || 12,
    flexWrap: 'wrap',
  },
  listItemProgress: {
    marginTop: Spacing?.[2] || 8,
    marginBottom: Spacing?.[1] || 4,
  },

  // Detail Mode Styles
  heroCard: {
    marginBottom: Spacing?.[6] || 24,
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
    marginBottom: Spacing?.[4] || 16,
    shadowColor: Colors.black || '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  achievementTitle: {
    fontFamily: 'PrimaryFont',
    color: Colors.white || '#ffffff',
    textAlign: 'center',
    marginBottom: Spacing?.[2] || 8,
  },
  achievementDescription: {
    color: Colors.white || '#ffffff',
    textAlign: 'center',
    fontFamily: 'SecondaryFont-Regular',
    opacity: 0.9,
    marginBottom: Spacing?.[4] || 16,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing?.[3] || 12,
    marginBottom: Spacing?.[3] || 12,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsText: {
    color: Colors.white || '#ffffff',
    fontFamily: 'SecondaryFont-Bold',
    fontSize: 16,
  },
  sectionCard: {
    marginBottom: Spacing?.[4] || 16,
    shadowColor: Colors.gray[900],
    shadowOffset: { width: 10, height: 20 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  progressContent: {
    gap: Spacing?.[3] || 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: Spacing?.[3] || 12,
  },
  progressText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray?.[800] || '#1f2937',
    fontFamily: 'SecondaryFont-Bold',
  },
  progressBar: {
    borderRadius: BorderRadius?.lg || 12,
    marginVertical: Spacing?.[2] || 8,
  },
  remainingText: {
    fontSize: 14,
    color: Colors.gray?.[600] || '#4b5563',
    fontFamily: 'SecondaryFont-Regular',
    textAlign: 'center',
  },
  dateEarnedText: {
    fontSize: 14,
    color: Colors.gray?.[600] || '#4b5563',
    fontFamily: 'SecondaryFont-Regular',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  detailedProgress: {
    marginTop: Spacing?.[4] || 16,
    paddingTop: Spacing?.[4] || 16,
    borderTopWidth: 1,
    borderTopColor: Colors.gray?.[200] || '#e5e7eb',
  },
  requirementsContainer: {
    gap: Spacing?.[3] || 12,
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray?.[800] || '#1f2937',
    fontFamily: 'SecondaryFont-Bold',
    marginBottom: Spacing?.[2] || 8,
  },
  requirementItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: BorderRadius?.sm || 6,
    padding: Spacing?.[3] || 12,
    marginBottom: Spacing?.[3] || 12,
    gap: Spacing?.[2] || 8,
  },
  requirementHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requirementLabel: {
    fontSize: 14,
    color: Colors.gray?.[700] || '#374151',
    fontFamily: 'SecondaryFont-Regular',
  },
  requirementProgressBar: {
    marginVertical: Spacing?.[2] || 8,
  },
  requirementDetail: {
    fontSize: 12,
    color: Colors.gray?.[600] || '#4b5563',
    fontFamily: 'SecondaryFont-Regular',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing?.[4] || 16,
  },
  relatedContent: {
    gap: Spacing?.[3] || 12,
  },
  relatedItem: {
    paddingVertical: Spacing?.[3] || 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray?.[100] || '#f3f4f6',
  },
  relatedItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing?.[3] || 12,
  },
  relatedItemText: {
    flex: 1,
  },
  relatedItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray?.[800] || '#1f2937',
    fontFamily: 'SecondaryFont-Bold',
    marginBottom: Spacing?.[1] || 4,
  },
  relatedItemDescription: {
    fontSize: 14,
    color: Colors.gray?.[600] || '#4b5563',
    fontFamily: 'SecondaryFont-Regular',
    marginBottom: Spacing?.[2] || 8,
  },
  relatedItemBadge: {
    alignSelf: 'flex-start',
    shadowColor: Colors.gray[900],
    shadowOffset: { width: 10, height: 20 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
});
