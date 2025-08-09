// app/(tabs)/notifications/index.tsx - Updated with new store architecture

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
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  useNotifications,
  usePreferredCourse,
  useAuth,
} from '../../../stores/appStore';
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

// Optimized shadow configuration
const OPTIMIZED_SHADOW = {
  // Remove shadows for better performance if needed
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
    backgroundColor: '#A29BFE',
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

// Main Notifications Screen Component
const NotificationsScreen = React.memo(() => {
  // 🚀 NEW: Use store hooks instead of context
  const {
    notifications,
    unreadCount,
    isLoading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  } = useNotifications();

  const { preferredCourse, getCourseColor } = usePreferredCourse();

  const { isAuthenticated } = useAuth();

  const { navigateFromNotification } = useNotificationNavigation();

  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Refs for cleanup
  const isMountedRef = useRef(true);

  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [error, setError] = useState<string | null>(null);

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
      context: contextColor || Colors.primary.DEFAULT,
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

  // 🚀 SIMPLIFIED: Refresh using store's refresh function
  const onRefresh = useCallback(async () => {
    if (!isMountedRef.current) return;
    setRefreshing(true);
    try {
      await refreshNotifications();
      setError(null);
    } catch (err) {
      if (isMountedRef.current) {
        setError(
          err instanceof Error
            ? err.message
            : 'Bildirimler yüklenirken hata oluştu',
        );
      }
    } finally {
      if (isMountedRef.current) {
        setRefreshing(false);
      }
    }
  }, [refreshNotifications]);

  const handleNotificationPress = useCallback(
    (notification: Notification) => {
      navigateFromNotification(notification);
    },
    [navigateFromNotification],
  );

  // 🚀 SIMPLIFIED: Mark all as read using store function
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
          onPress: () => {
            markAllAsRead().catch((err) => {
              setError('Bildirimler işaretlenirken hata oluştu');
            });
          },
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

  // 🚀 SIMPLIFIED: Retry using store function
  const handleRetryLoad = useCallback(() => {
    setError(null);
    loadNotifications().catch((err) => {
      setError(
        err instanceof Error
          ? err.message
          : 'Bildirimler yüklenirken hata oluştu',
      );
    });
  }, [loadNotifications]);

  // 🚀 SIMPLIFIED: Handle notification actions with store functions
  const handleMarkAsRead = useCallback(
    async (notificationId: number) => {
      try {
        await markAsRead(notificationId);
      } catch (err) {
        setError('Bildirim işaretlenirken hata oluştu');
      }
    },
    [markAsRead],
  );

  // 🚀 NEW: Handle delete notification (if available in store)
  const handleDeleteNotification = useCallback(
    async (notificationId: number) => {
      // Since the store doesn't have delete functionality, we'll show a message
      Alert.alert(
        'Bildirim Sil',
        'Bildirim silme özelliği henüz mevcut değil.',
        [{ text: 'Tamam' }],
      );
    },
    [],
  );

  // Load more notifications (placeholder - the store would need to support pagination)
  const loadMoreNotifications = useCallback(() => {
    // Store would need to implement pagination
    console.log('Load more notifications requested');
  }, []);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

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
        onMarkAsRead={handleMarkAsRead}
        onDelete={handleDeleteNotification}
      />
    ),
    [handleNotificationPress, handleMarkAsRead, handleDeleteNotification],
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

  // Initial load effect
  useEffect(() => {
    if (isAuthenticated && notifications.length === 0 && !isLoading) {
      loadNotifications().catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : 'Bildirimler yüklenirken hata oluştu',
        );
      });
    }
  }, [isAuthenticated, notifications.length, isLoading, loadNotifications]);

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

  // 🚀 NEW: Check authentication
  if (!isAuthenticated) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <View style={styles.errorContainer}>
          <Feather
            name='lock'
            size={64}
            color={Colors.white}
            style={styles.errorIcon}
          />
          <Text style={styles.errorTitle}>Giriş Gerekli</Text>
          <Text style={styles.errorMessage}>
            Bildirimlerinizi görmek için giriş yapmanız gerekiyor.
          </Text>
          <PlayfulButton
            title='Giriş Yap'
            onPress={() => router.replace('/(auth)/login')}
            variant='primary'
            animated
            icon='key'
            size='medium'
            style={styles.errorButton}
          />
        </View>
      </GestureHandlerRootView>
    );
  }

  if (error && !isLoading && notifications.length === 0) {
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

NotificationsScreen.displayName = 'NotificationsScreen';

export default NotificationsScreen;
