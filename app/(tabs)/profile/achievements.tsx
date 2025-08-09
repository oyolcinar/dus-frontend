import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  useAchievementsData,
  useAchievementDetails,
  useFilteredAchievements,
  useAchievementCategories,
  achievementHelpers,
  type EnhancedAchievement,
  type AchievementFilters,
} from '../../../src/hooks/useAchievementsData';
import {
  getTurkishRequirementName,
  getTurkishRequirementDetail,
  getTurkishCompletionStatus,
  getTurkishCategoryName,
  getTurkishRarityName,
  getNextMilestone,
  formatProgressPercentage,
} from '../../../src/api/achievementService';
import type { AchievementProgress } from '../../../src/types/models';
import { usePreferredCourse } from '../../../context/PreferredCourseContext';

// ✅ Type-safe filter value types
type StatusFilterValue = AchievementFilters['status'];
type CategoryFilterValue = string;
type RarityFilterValue = AchievementFilters['rarity'];
type DifficultyFilterValue = AchievementFilters['difficulty'];

// Optimized shadow style
const OPTIMIZED_SHADOW = {
  // shadowColor: Colors.gray[900],
  // shadowOffset: { width: 2, height: 4 },
  // shadowOpacity: 0.3,
  // shadowRadius: 4,
  // elevation: 4,
};

function AchievementScreenContent() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Use the preferred course context
  const {
    preferredCourse,
    isLoading: courseLoading,
    getCourseColor,
  } = usePreferredCourse();

  // Determine if this is list mode or detail mode
  const isListMode = !id;
  const achievementId = !isListMode
    ? Number(Array.isArray(id) ? id[0] : id)
    : null;

  // State for filters (list mode)
  const [filters, setFilters] = useState<AchievementFilters>({
    category: 'all',
    status: 'all',
    rarity: 'all',
    difficulty: 'all',
  });

  // State for celebration modal
  const [showCelebration, setShowCelebration] = useState(false);

  // 🚀 NEW: Use the comprehensive achievement hooks
  const {
    achievements,
    achievementsLoading,
    achievementsError,
    userStats,
    courseMetrics,
    leaderboard,
    completionStats,
    isLoading: allDataLoading,
    hasError,
    refetchAll,
  } = useAchievementsData();

  // Hook for achievement details (detail mode only)
  const {
    data: achievementDetails,
    isLoading: detailLoading,
    error: detailError,
  } = useAchievementDetails(achievementId || 0);

  // Hook for filtered achievements (list mode only)
  const filteredAchievements = useFilteredAchievements(filters);

  // Hook for categories
  const categories = useAchievementCategories();

  // Memoized context color
  const contextColor = useMemo(() => {
    return (
      ((preferredCourse as any)?.category &&
        getCourseColor((preferredCourse as any).category)) ||
      Colors.vibrant?.purple ||
      '#8b5cf6'
    );
  }, [preferredCourse, getCourseColor]);

  // Memoized dynamic styles
  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        contextBackground: {
          backgroundColor: contextColor,
        },
        filterButtonActive: {
          backgroundColor: '#FFFFFF',
          borderColor: '#FFFFFF',
        },
        filterButtonInactive: {
          backgroundColor: 'transparent',
          borderColor: 'rgba(255, 255, 255, 0.3)',
        },
        activeFilterText: {
          color: contextColor,
        },
        inactiveFilterText: {
          color: '#FFFFFF',
        },
      }),
    [contextColor],
  );

  // Safe color fallbacks - memoized
  const colorHelpers = useMemo(
    () => ({
      getHeaderColor: () => contextColor,
      getCoralColor: () => Colors.vibrant?.coral || '#f97316',
      getYellowColor: () => Colors.vibrant?.yellow || '#fbbf24',
    }),
    [contextColor],
  );

  // 🚀 NEW: Use helper functions from the hook
  const { getRarityColor, getRarityBadgeVariant, safeProgress } =
    achievementHelpers;

  // Get related achievements for detail mode
  const relatedAchievements = useMemo(() => {
    if (!achievementDetails || isListMode) return [];

    return achievements
      .filter(
        (a) =>
          a.category === achievementDetails.category &&
          a.achievement_id !== achievementDetails.achievement_id,
      )
      .slice(0, 3);
  }, [achievementDetails, achievements, isListMode]);

  // Check for celebration on mount (detail mode)
  useEffect(() => {
    if (
      !isListMode &&
      achievementDetails?.is_unlocked &&
      achievementDetails.date_earned
    ) {
      const unlockTime = new Date(achievementDetails.date_earned).getTime();
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

      if (unlockTime > fiveMinutesAgo) {
        setTimeout(() => {
          setShowCelebration(true);
        }, 500);
      }
    }
  }, [isListMode, achievementDetails]);

  // ✅ FIXED: Type-safe filter handlers
  const handleStatusFilter = useCallback((status: StatusFilterValue) => {
    setFilters((prev) => ({ ...prev, status }));
  }, []);

  const handleCategoryFilter = useCallback((category: CategoryFilterValue) => {
    setFilters((prev) => ({ ...prev, category }));
  }, []);

  const handleRarityFilter = useCallback((rarity: RarityFilterValue) => {
    setFilters((prev) => ({ ...prev, rarity }));
  }, []);

  const handleDifficultyFilter = useCallback(
    (difficulty: DifficultyFilterValue) => {
      setFilters((prev) => ({ ...prev, difficulty }));
    },
    [],
  );

  // Event handlers - memoized
  const handleShareAchievement = useCallback(() => {
    console.log('Sharing achievement:', achievementDetails?.name);
  }, [achievementDetails]);

  const handleViewAllAchievements = useCallback(() => {
    router.push('/(tabs)/profile/achievements' as any);
  }, [router]);

  const handleAchievementPress = useCallback(
    (achievementItem: EnhancedAchievement) => {
      router.push(
        `/(tabs)/profile/achievement/${achievementItem.achievement_id}` as any,
      );
    },
    [router],
  );

  // 🚀 IMPROVED: Render progress requirements with better performance
  const renderProgressRequirements = useCallback(
    (progressData: AchievementProgress) => {
      const requirements = Object.entries(progressData.requirements);

      return (
        <Column style={styles.requirementsContainer}>
          <Text style={styles.requirementsTitle}>Gereksinimler:</Text>
          {requirements.map(
            ([key, req]: [
              string,
              { current: number; required: number | boolean; progress: number },
            ]) => (
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
                  trackColor={contextColor || '#e5e7eb'}
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
            ),
          )}
        </Column>
      );
    },
    [contextColor, getRarityColor],
  );

  // 🚀 OPTIMIZED: Achievement list item with improved performance
  const renderAchievementItem = useCallback(
    ({ item }: { item: EnhancedAchievement }) => (
      <SlideInElement delay={0}>
        <TouchableOpacity
          style={styles.achievementListItem}
          onPress={() => handleAchievementPress(item)}
        >
          <GlassCard style={styles.listItemCard}>
            <View style={styles.listItemContainer}>
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
                <Text style={styles.listItemDescription}>
                  {item.description || 'Açıklama bulunmuyor'}
                </Text>

                {/* Next milestone for locked achievements */}
                {!item.is_unlocked && item.next_milestone && (
                  <Text style={styles.nextMilestone}>
                    {item.next_milestone}
                  </Text>
                )}

                {/* Status badge */}
                <Row style={styles.listItemFooter}>
                  <Badge
                    text={item.completion_status}
                    variant={item.is_unlocked ? 'success' : 'warning'}
                    size='sm'
                    fontFamily='SecondaryFont-Bold'
                  />
                  <Badge
                    text={item.turkish_rarity}
                    variant={getRarityBadgeVariant(item.rarity)}
                    size='sm'
                    fontFamily='SecondaryFont-Bold'
                  />
                </Row>

                {/* Progress bar for incomplete achievements */}
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
    ),
    [
      handleAchievementPress,
      getRarityColor,
      getRarityBadgeVariant,
      safeProgress,
    ],
  );

  // Get header title - memoized
  const getHeaderTitle = useCallback(() => {
    if (isListMode) return 'Başarılar';
    return achievementDetails?.name || 'Başarı';
  }, [isListMode, achievementDetails]);

  // 🚀 IMPROVED: Determine loading state
  const isLoading = isListMode ? achievementsLoading : detailLoading;
  const currentError = isListMode ? achievementsError : detailError;
  const currentData = isListMode ? filteredAchievements : achievementDetails;

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: getHeaderTitle(),
            headerStyle: { backgroundColor: colorHelpers.getHeaderColor() },
            headerTintColor: Colors.white || '#ffffff',
            headerTitleStyle: {
              fontFamily: 'PrimaryFont',
            },
          }}
        />
        <View style={styles.centerContent}>
          <ActivityIndicator
            size='large'
            color={colorHelpers.getCoralColor()}
          />
          <Text style={styles.loadingText}>
            {isListMode ? 'Başarılar' : 'Başarı'} yükleniyor...
          </Text>
        </View>
      </View>
    );
  }

  // Error state
  if (currentError || (!isListMode && !achievementDetails)) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: getHeaderTitle(),
            headerStyle: { backgroundColor: colorHelpers.getHeaderColor() },
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
            currentError?.message ||
            (isListMode
              ? 'Henüz başarı bulunmuyor'
              : 'İstenen başarı bulunamadı')
          }
          fontFamily='SecondaryFont-Regular'
          titleFontFamily='PrimaryFont'
          actionButton={{
            title: 'Yeniden Dene',
            onPress: () => refetchAll(),
            variant: 'primary',
          }}
          buttonFontFamily='PrimaryFont'
          style={styles.emptyStateContainer}
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
            headerStyle: { backgroundColor: colorHelpers.getHeaderColor() },
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
          {/* 🚀 NEW: Stats Overview */}
          {completionStats && (
            <SlideInElement delay={0}>
              <PlayfulCard
                title='İlerleme Özeti'
                titleFontFamily='PrimaryFont'
                style={[styles.statsCard, dynamicStyles.contextBackground]}
                variant='playful'
                animated
              >
                <Row style={styles.statsRow}>
                  <StatCard
                    icon='trophy'
                    title='Tamamlanan'
                    value={completionStats.completed.toString()}
                    color={Colors.vibrant?.green || '#10b981'}
                    titleFontFamily='SecondaryFont-Bold'
                  />
                  <StatCard
                    icon='plus'
                    title='Toplam'
                    value={completionStats.total.toString()}
                    color={Colors.vibrant?.blue || '#3b82f6'}
                    titleFontFamily='SecondaryFont-Bold'
                  />
                  <StatCard
                    icon='percent'
                    title='Tamamlanma'
                    value={`${completionStats.percentage}%`}
                    color={Colors.vibrant?.orange || '#f59e0b'}
                    titleFontFamily='SecondaryFont-Bold'
                  />
                </Row>
              </PlayfulCard>
            </SlideInElement>
          )}

          {/* Filter Section */}
          <SlideInElement delay={100}>
            <PlayfulCard
              title='Filtreler'
              variant='playful'
              titleFontFamily='PrimaryFont'
              category={(preferredCourse as any)?.category}
              style={[
                styles.filterCard,
                dynamicStyles.contextBackground,
                OPTIMIZED_SHADOW,
              ]}
              animated
              floatingAnimation
            >
              <View style={styles.filterContainer}>
                <TouchableOpacity
                  onPress={() => handleStatusFilter('all')}
                  style={[
                    styles.filterButton,
                    filters.status === 'all'
                      ? dynamicStyles.filterButtonActive
                      : dynamicStyles.filterButtonInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      filters.status === 'all'
                        ? dynamicStyles.activeFilterText
                        : dynamicStyles.inactiveFilterText,
                    ]}
                  >
                    Tümü
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleStatusFilter('unlocked')}
                  style={[
                    styles.filterButton,
                    styles.filterButtonMiddle,
                    filters.status === 'unlocked'
                      ? dynamicStyles.filterButtonActive
                      : dynamicStyles.filterButtonInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      filters.status === 'unlocked'
                        ? dynamicStyles.activeFilterText
                        : dynamicStyles.inactiveFilterText,
                    ]}
                  >
                    Tamamlanan
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleStatusFilter('locked')}
                  style={[
                    styles.filterButton,
                    filters.status === 'locked'
                      ? dynamicStyles.filterButtonActive
                      : dynamicStyles.filterButtonInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      filters.status === 'locked'
                        ? dynamicStyles.activeFilterText
                        : dynamicStyles.inactiveFilterText,
                    ]}
                  >
                    Devam Eden
                  </Text>
                </TouchableOpacity>
              </View>
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

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
    );
  }

  // Detail Mode Render
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: achievementDetails!.name,
          headerStyle: { backgroundColor: colorHelpers.getHeaderColor() },
          headerTintColor: Colors.white || '#ffffff',
          headerTitleStyle: {
            fontFamily: 'PrimaryFont',
          },
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
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
                      backgroundColor: achievementDetails!.is_unlocked
                        ? getRarityColor(achievementDetails!.rarity)
                        : Colors.gray?.[400] || '#9ca3af',
                      opacity: achievementDetails!.is_unlocked ? 1 : 0.6,
                    },
                  ]}
                >
                  <FontAwesome
                    name={(achievementDetails!.icon as any) || 'star'}
                    size={48}
                    color={Colors.white || '#ffffff'}
                  />
                </View>
              </FloatingElement>

              <PlayfulTitle level={1} style={styles.achievementTitle}>
                {achievementDetails!.name}
              </PlayfulTitle>

              <Paragraph style={styles.achievementDescription}>
                {achievementDetails!.description || 'Açıklama bulunmuyor'}
              </Paragraph>

              <Row style={styles.badgeRow}>
                <Badge
                  text={achievementDetails!.completion_status}
                  variant={
                    achievementDetails!.is_unlocked ? 'success' : 'warning'
                  }
                  size='md'
                  fontFamily='SecondaryFont-Bold'
                />
                <Badge
                  text={achievementDetails!.turkish_rarity}
                  variant={getRarityBadgeVariant(achievementDetails!.rarity)}
                  size='md'
                  fontFamily='SecondaryFont-Bold'
                />
              </Row>

              <View style={styles.pointsContainer}>
                <Text style={styles.pointsText}>
                  {achievementDetails!.points} Puan
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
            style={[styles.sectionCard, OPTIMIZED_SHADOW]}
            variant='elevated'
            animated
          >
            <Column style={styles.progressContent}>
              <Row style={styles.progressHeader}>
                <Text style={styles.progressText}>Genel İlerleme</Text>
              </Row>

              <ProgressBar
                progress={safeProgress(achievementDetails!.overall_progress)}
                height={32}
                width='100%'
                trackColor={Colors.gray?.[200] || '#e5e7eb'}
                progressColor={getRarityColor(achievementDetails!.rarity)}
                style={styles.progressBar}
                showPercentageInside={true}
                animated
              />

              {/* Next milestone */}
              {!achievementDetails!.is_unlocked &&
                achievementDetails!.next_milestone && (
                  <Text style={styles.remainingText}>
                    {achievementDetails!.next_milestone}
                  </Text>
                )}

              {/* Date earned */}
              {achievementDetails!.date_earned && (
                <Text style={styles.dateEarnedText}>
                  {new Date(achievementDetails!.date_earned).toLocaleDateString(
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
              {achievementDetails!.progress_data &&
                !achievementDetails!.is_unlocked && (
                  <View style={styles.detailedProgress}>
                    {renderProgressRequirements(
                      achievementDetails!.progress_data,
                    )}
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
              value={achievementDetails!.turkish_category}
              color={getRarityColor(achievementDetails!.rarity)}
              titleFontFamily='SecondaryFont-Bold'
            />
            <StatCard
              icon='calendar'
              title='Oluşturulma'
              value={new Date(achievementDetails!.created_at)
                .getFullYear()
                .toString()}
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
            style={[styles.sectionCard, OPTIMIZED_SHADOW]}
            variant='playful'
            animated
          >
            <Row>
              {achievementDetails!.is_unlocked && (
                <PlayfulButton
                  title='Başarıyı Paylaş'
                  onPress={handleShareAchievement}
                  variant='outline'
                  style={styles.shareButton}
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
                style={[
                  styles.viewAllButton,
                  !achievementDetails!.is_unlocked && styles.viewAllButtonFull,
                ]}
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
              style={[styles.sectionCard, OPTIMIZED_SHADOW]}
              variant='glass'
              animated
              floatingAnimation
            >
              <Column style={styles.relatedContent}>
                {relatedAchievements.map((related) => (
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
                          text={related.completion_status}
                          variant={related.is_unlocked ? 'success' : 'warning'}
                          size='sm'
                          fontFamily='SecondaryFont-Bold'
                          style={[styles.relatedItemBadge, OPTIMIZED_SHADOW]}
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

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Celebration Modal */}
      {achievementDetails && (
        <CelebrationModal
          visible={showCelebration}
          onClose={() => setShowCelebration(false)}
          title='Başarı Kazanıldı!'
          celebrationType='achievement'
          achievement={achievementDetails.name}
          score={achievementDetails.points}
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
  emptyStateContainer: {
    margin: Spacing?.[4] || 16,
  },

  // List Mode Styles
  listContainer: {
    flex: 1,
    backgroundColor: Colors.primary?.dark || '#1e3a8a',
  },
  listContent: {
    paddingHorizontal: Spacing?.[4] || 16,
  },
  statsCard: {
    margin: Spacing?.[4] || 16,
    marginBottom: Spacing?.[2] || 8,
  },
  filterCard: {
    margin: Spacing?.[4] || 16,
    marginBottom: Spacing?.[3] || 12,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  filterButtonMiddle: {
    marginHorizontal: 4,
  },
  filterButtonText: {
    fontSize: 11,
    fontFamily: 'PrimaryFont',
    textAlign: 'center',
    fontWeight: '500',
  },
  achievementListItem: {
    marginBottom: Spacing?.[3] || 12,
  },
  listItemCard: {
    padding: Spacing?.[4] || 16,
  },
  listItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing?.[4] || 16,
  },
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
  shareButton: {
    flex: 1,
    marginRight: Spacing?.[1] || 4,
    alignSelf: 'stretch',
  },
  viewAllButton: {
    flex: 1,
    marginLeft: Spacing?.[1] || 4,
    alignSelf: 'stretch',
  },
  viewAllButtonFull: {
    marginLeft: 0,
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
  },
  bottomSpacing: {
    height: Spacing?.[8] || 32,
  },
});

// Main component with context provider
export default function AchievementScreen() {
  return <AchievementScreenContent />;
}
