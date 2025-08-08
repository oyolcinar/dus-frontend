import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  useColorScheme,
  ScrollView,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useNotifications } from '../../../context/NotificationContext';
import { useNotificationNavigation } from '../../../src/hooks/useNotificationNavigation';
import { NotificationItem } from '../../../components/ui';
import { Notification } from '../../../src/types/models';
import {
  PlayfulCard,
  PlayfulButton,
  EmptyState,
  Badge,
  Container,
  PlayfulTitle,
  Paragraph,
  Row,
  Column,
  SlideInElement,
  FloatingElement,
  NotificationBadge,
} from '../../../components/ui';
import { Colors, Spacing, BorderRadius } from '../../../constants/theme';
import {
  usePreferredCourse,
  PreferredCourseProvider,
} from '../../../context/PreferredCourseContext';

// Optimized shadow configuration
const OPTIMIZED_SHADOW = {
  shadowColor: Colors.gray[900],
  shadowOffset: { width: 2, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 4,
};

// Use the theme constants correctly
const VIBRANT_COLORS = Colors.vibrant;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing[4],
    flexGrow: 1,
  },
  headerCard: {
    marginBottom: Spacing[6],
    backgroundColor: 'transparent',
  },
  headerRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[4],
  },
  headerColumn: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: 'PrimaryFont',
    color: Colors.gray[900],
  },
  headerSubtitle: {
    fontFamily: 'SecondaryFont-Regular',
  },
  unreadRow: {
    alignItems: 'center',
    marginTop: Spacing[1],
  },
  unreadText: {
    color: Colors.gray[700],
    fontSize: 14,
    fontFamily: 'SecondaryFont-Regular',
    marginLeft: Spacing[1],
  },
  filterRow: {
    marginBottom: Spacing[4],
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing[1],
    flex: 1,
    ...OPTIMIZED_SHADOW,
  },
  quickSettingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing[2],
    ...OPTIMIZED_SHADOW,
  },
  filterButton: {
    flex: 1,
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  activeFilterButton: {
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.gray[600],
    fontFamily: 'SecondaryFont-Regular',
  },
  activeFilterButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontFamily: 'SecondaryFont-Bold',
  },
  actionButtonsRow: {
    marginTop: Spacing[2],
  },
  actionButton: {
    flex: 1,
    marginRight: Spacing[2],
    ...OPTIMIZED_SHADOW,
  },
  loadingFooter: {
    paddingVertical: Spacing[4],
    alignItems: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  loadingText: {
    marginTop: Spacing[3],
    color: Colors.white,
    fontFamily: 'SecondaryFont-Regular',
    fontSize: 16,
  },
  floatingSettingsButton: {
    position: 'absolute',
    bottom: Spacing[6],
    right: Spacing[4],
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[4],
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing[2],
    fontFamily: 'SecondaryFont-Bold',
  },
  errorMessage: {
    fontSize: 16,
    color: Colors.white,
    textAlign: 'center',
    fontFamily: 'SecondaryFont-Regular',
  },
  errorIcon: {
    marginBottom: Spacing[4],
  },
  errorButton: {
    marginTop: Spacing[4],
  },
  emptyStateContainer: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing[4],
    marginTop: Spacing[6],
  },
  notificationBadge: {
    position: 'relative',
    top: 0,
    right: 0,
    marginLeft: Spacing[1],
  },
});

// Main Notifications Screen Component (wrapped with context)
const NotificationsScreenContent = React.memo(() => {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    loadNotifications,
    loadMoreNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearError,
  } = useNotifications();

  const { navigateFromNotification } = useNotificationNavigation();

  const {
    preferredCourse,
    isLoading: courseLoading,
    getCourseColor,
  } = usePreferredCourse();

  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Refs for cleanup
  const isMountedRef = useRef(true);

  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Memoized context color
  const contextColor = useMemo(() => {
    return (
      (preferredCourse as any)?.category &&
      getCourseColor((preferredCourse as any).category)
    );
  }, [preferredCourse, getCourseColor]);

  // Memoized color calculations
  const colors = useMemo(
    () => ({
      headerText: isDark ? Colors.gray[700] : Colors.gray[700],
      context: contextColor,
    }),
    [isDark, contextColor],
  );

  // Filter notifications based on current filter (memoized)
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      if (filter === 'unread') {
        return !notification.is_read;
      }
      return true;
    });
  }, [notifications, filter]);

  const onRefresh = useCallback(async () => {
    if (!isMountedRef.current) return;
    setRefreshing(true);
    try {
      await loadNotifications(true);
    } finally {
      if (isMountedRef.current) {
        setRefreshing(false);
      }
    }
  }, [loadNotifications]);

  const handleNotificationPress = useCallback(
    (notification: Notification) => {
      navigateFromNotification(notification);
    },
    [navigateFromNotification],
  );

  const handleMarkAllAsRead = useCallback(() => {
    if (unreadCount === 0) return;

    Alert.alert(
      'Tümünü Okundu İşaretle',
      `${unreadCount} bildirimi okundu olarak işaretlemek istediğinizden emin misiniz?`,
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Evet',
          onPress: markAllAsRead,
        },
      ],
    );
  }, [unreadCount, markAllAsRead]);

  const handleNavigateToSettings = useCallback(() => {
    router.push('/(tabs)/notifications/settings' as any);
  }, [router]);

  const handleFilterChange = useCallback((filterType: 'all' | 'unread') => {
    setFilter(filterType);
  }, []);

  const handleRetryLoad = useCallback(() => {
    loadNotifications(true);
  }, [loadNotifications]);

  // Memoized Filter Button Component
  const FilterButton = React.memo(
    ({
      filterType,
      title,
      isActive,
    }: {
      filterType: 'all' | 'unread';
      title: string;
      isActive: boolean;
    }) => {
      const buttonStyle = useMemo(
        () => [
          styles.filterButton,
          isActive && {
            ...styles.activeFilterButton,
            backgroundColor: colors.context,
          },
        ],
        [isActive, colors.context],
      );

      const textStyle = useMemo(
        () => [
          styles.filterButtonText,
          isActive && styles.activeFilterButtonText,
        ],
        [isActive],
      );

      return (
        <TouchableOpacity
          style={buttonStyle}
          onPress={() => handleFilterChange(filterType)}
        >
          <Text style={textStyle}>{title}</Text>
          {filterType === 'unread' && unreadCount > 0 && (
            <NotificationBadge
              count={unreadCount}
              style={styles.notificationBadge}
            />
          )}
        </TouchableOpacity>
      );
    },
  );

  // Memoized render functions for FlatList
  const renderNotificationItem = useCallback(
    ({ item }: { item: Notification }) => (
      <NotificationItem
        notification={item}
        onPress={handleNotificationPress}
        onMarkAsRead={markAsRead}
        onDelete={deleteNotification}
      />
    ),
    [handleNotificationPress, markAsRead, deleteNotification],
  );

  const renderFooter = useCallback(() => {
    if (!isLoading) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size='small' color={colors.context} />
      </View>
    );
  }, [isLoading, colors.context]);

  const keyExtractor = useCallback(
    (item: Notification) => item.notification_id.toString(),
    [],
  );

  // Memoized refresh control
  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        colors={[colors.context]}
        tintColor={colors.context}
      />
    ),
    [refreshing, onRefresh, colors.context],
  );

  // Memoized header component
  const listHeaderComponent = useMemo(
    () => (
      <SlideInElement delay={0}>
        <View style={styles.headerCard}>
          {/* Title Row */}
          <Row style={styles.headerRow}>
            <Column style={styles.headerColumn}>
              <PlayfulTitle
                level={1}
                gradient='primary'
                style={styles.headerTitle}
              >
                Bildirimler
              </PlayfulTitle>
              <Paragraph
                color={colors.headerText}
                style={styles.headerSubtitle}
              >
                Tüm bildirimlerinizi yönetin
              </Paragraph>
              {unreadCount > 0 && (
                <Row style={styles.unreadRow}>
                  <Feather name='bell' size={16} color={Colors.gray[700]} />
                  <Text style={styles.unreadText}>
                    {unreadCount} yeni bildirim
                  </Text>
                </Row>
              )}
            </Column>
          </Row>

          {/* Filter Buttons */}
          <Row style={styles.filterRow}>
            <View style={styles.filterContainer}>
              <FilterButton
                filterType='all'
                title='Tümü'
                isActive={filter === 'all'}
              />
              <FilterButton
                filterType='unread'
                title='Okunmamış'
                isActive={filter === 'unread'}
              />
            </View>

            <TouchableOpacity
              style={styles.quickSettingsButton}
              onPress={handleNavigateToSettings}
            >
              <Feather name='sliders' size={18} color={Colors.gray[600]} />
            </TouchableOpacity>
          </Row>

          {/* Action Buttons */}
          <Row style={styles.actionButtonsRow}>
            {unreadCount > 0 && (
              <PlayfulButton
                title='Tümünü Okundu İşaretle'
                onPress={handleMarkAllAsRead}
                variant='secondary'
                size='medium'
                icon='check-circle'
                fontFamily='SecondaryFont-Bold'
                animated
                style={[
                  styles.actionButton,
                  { backgroundColor: colors.context },
                ]}
              />
            )}
          </Row>
        </View>
      </SlideInElement>
    ),
    [
      unreadCount,
      colors.headerText,
      colors.context,
      filter,
      handleNavigateToSettings,
      handleMarkAllAsRead,
    ],
  );

  // Memoized empty state component
  const listEmptyComponent = useMemo(() => {
    if (isLoading) return null;

    return (
      <SlideInElement delay={200}>
        <EmptyState
          icon='bell-o'
          title={
            filter === 'unread' ? 'Okunmamış bildirim yok' : 'Bildirim yok'
          }
          message={
            filter === 'unread'
              ? 'Tüm bildirimlerinizi okumuşsunuz!'
              : 'Henüz bildiriminiz bulunmuyor.'
          }
          fontFamily='SecondaryFont-Regular'
          titleFontFamily='PrimaryFont'
          actionButton={
            filter !== 'unread'
              ? {
                  title: 'Bildirim Ayarları',
                  onPress: handleNavigateToSettings,
                  variant: 'primary',
                }
              : undefined
          }
          buttonFontFamily='SecondaryFont-Bold'
          style={styles.emptyStateContainer}
        />
      </SlideInElement>
    );
  }, [isLoading, filter, handleNavigateToSettings]);

  // Clear error on mount with cleanup
  useEffect(() => {
    let isCancelled = false;

    if (error && !isCancelled && isMountedRef.current) {
      clearError();
    }

    return () => {
      isCancelled = true;
    };
  }, [error, clearError]);

  // Show error alert if there's an error with cleanup
  useEffect(() => {
    let isCancelled = false;

    if (error && !isCancelled && isMountedRef.current) {
      Alert.alert('Hata', error, [
        {
          text: 'Tamam',
          onPress: clearError,
        },
      ]);
    }

    return () => {
      isCancelled = true;
    };
  }, [error, clearError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // FlatList optimization props
  const flatListProps = useMemo(
    () => ({
      removeClippedSubviews: true,
      maxToRenderPerBatch: 10,
      windowSize: 10,
      initialNumToRender: 15,
      updateCellsBatchingPeriod: 50,
      getItemLayout: undefined, // We don't know the exact height, so disable this
    }),
    [],
  );

  if (error && !isLoading) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Feather
              name='alert-triangle'
              size={64}
              color={Colors.vibrant?.orange || Colors.warning}
              style={styles.errorIcon}
            />
            <Text style={styles.errorTitle}>Bir Sorun Oluştu</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <PlayfulButton
              title='Yeniden Dene'
              onPress={handleRetryLoad}
              variant='primary'
              animated
              icon='refresh'
              size='medium'
              style={[styles.errorButton, { backgroundColor: colors.context }]}
            />
          </View>
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.container}>
        <FlatList
          data={filteredNotifications}
          renderItem={renderNotificationItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.contentContainer}
          refreshControl={refreshControl}
          onEndReached={loadMoreNotifications}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={listHeaderComponent}
          ListEmptyComponent={listEmptyComponent}
          {...flatListProps}
        />

        {/* Loading state overlay */}
        {isLoading && filteredNotifications.length === 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size='large' color={colors.context} />
            <Text style={styles.loadingText}>Bildirimler yükleniyor...</Text>
          </View>
        )}

        {/* Floating Action Button */}
        <SlideInElement delay={1000}>
          <FloatingElement>
            <TouchableOpacity
              style={[
                styles.floatingSettingsButton,
                { backgroundColor: colors.context },
              ]}
              onPress={handleNavigateToSettings}
            >
              <Feather name='settings' size={24} color={Colors.white} />
            </TouchableOpacity>
          </FloatingElement>
        </SlideInElement>
      </View>
    </GestureHandlerRootView>
  );
});

NotificationsScreenContent.displayName = 'NotificationsScreenContent';

// Main component with context provider
const NotificationsScreen: React.FC = React.memo(() => {
  return (
    <PreferredCourseProvider>
      <NotificationsScreenContent />
    </PreferredCourseProvider>
  );
});

NotificationsScreen.displayName = 'NotificationsScreen';

export default NotificationsScreen;
