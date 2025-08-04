import React, { useState, useCallback, useEffect } from 'react';
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

// Use the theme constants correctly
const VIBRANT_COLORS = Colors.vibrant;

// Main Notifications Screen Component (wrapped with context)
function NotificationsScreenContent() {
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

  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Get the current context color
  const contextColor =
    (preferredCourse as any)?.category &&
    getCourseColor((preferredCourse as any).category);

  // Filter notifications based on current filter
  const filteredNotifications = notifications.filter((notification) => {
    if (filter === 'unread') {
      return !notification.is_read;
    }
    return true;
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadNotifications(true);
    } finally {
      setRefreshing(false);
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

  const FilterButton = ({
    filterType,
    title,
    isActive,
  }: {
    filterType: 'all' | 'unread';
    title: string;
    isActive: boolean;
  }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        isActive && {
          ...styles.activeFilterButton,
          backgroundColor: contextColor, // Use context color for active filter
        },
      ]}
      onPress={() => setFilter(filterType)}
    >
      <Text
        style={[
          styles.filterButtonText,
          isActive && styles.activeFilterButtonText,
        ]}
      >
        {title}
      </Text>
      {filterType === 'unread' && unreadCount > 0 && (
        <NotificationBadge
          count={unreadCount}
          style={{
            position: 'relative',
            top: 0,
            right: 0,
            marginLeft: Spacing[1],
          }}
        />
      )}
    </TouchableOpacity>
  );

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <NotificationItem
      notification={item}
      onPress={handleNotificationPress}
      onMarkAsRead={markAsRead}
      onDelete={deleteNotification}
    />
  );

  const renderFooter = () => {
    if (!isLoading) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size='small' color={contextColor} />
      </View>
    );
  };

  // Clear error on mount
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, []);

  // Show error alert if there's an error
  useEffect(() => {
    if (error) {
      Alert.alert('Hata', error, [
        {
          text: 'Tamam',
          onPress: clearError,
        },
      ]);
    }
  }, [error, clearError]);

  if (error && !isLoading) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Feather
              name='alert-triangle'
              size={64}
              color={Colors.vibrant?.orange || Colors.warning}
              style={{ marginBottom: Spacing[4] }}
            />
            <Text style={styles.errorTitle}>Bir Sorun Oluştu</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <PlayfulButton
              title='Yeniden Dene'
              onPress={() => loadNotifications(true)}
              variant='primary'
              animated
              icon='refresh'
              size='medium'
              style={{
                marginTop: Spacing[4],
                backgroundColor: contextColor,
              }}
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
          keyExtractor={(item) => item.notification_id.toString()}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[contextColor]}
              tintColor={contextColor}
            />
          }
          onEndReached={loadMoreNotifications}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={15}
          ListHeaderComponent={
            <SlideInElement delay={0}>
              <View style={styles.headerCard}>
                {/* Title Row */}
                <Row style={styles.headerRow}>
                  <Column style={{ flex: 1 }}>
                    <PlayfulTitle
                      level={1}
                      gradient='primary'
                      style={{
                        fontFamily: 'PrimaryFont',
                        color: Colors.gray[900],
                      }}
                    >
                      Bildirimler
                    </PlayfulTitle>
                    <Paragraph
                      color={isDark ? Colors.gray[700] : Colors.gray[700]}
                      style={{
                        fontFamily: 'SecondaryFont-Regular',
                      }}
                    >
                      Tüm bildirimlerinizi yönetin
                    </Paragraph>
                    {unreadCount > 0 && (
                      <Row
                        style={{ alignItems: 'center', marginTop: Spacing[1] }}
                      >
                        <Feather
                          name='bell'
                          size={16}
                          color={Colors.gray[700]}
                        />
                        <Text style={styles.unreadText}>
                          {unreadCount} yeni bildirim
                        </Text>
                      </Row>
                    )}
                  </Column>
                </Row>

                {/* Filter Buttons */}
                <Row style={{ marginBottom: Spacing[4] }}>
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
                    <Feather
                      name='sliders'
                      size={18}
                      color={Colors.gray[600]}
                    />
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
                      style={{
                        flex: 1,
                        marginRight: unreadCount > 0 ? Spacing[2] : 0,
                        shadowColor: Colors.gray[900],
                        shadowOffset: { width: 10, height: 20 },
                        shadowOpacity: 0.8,
                        shadowRadius: 10,
                        elevation: 10,
                        backgroundColor: contextColor, // Use context color
                      }}
                    />
                  )}
                </Row>
              </View>
            </SlideInElement>
          }
          ListEmptyComponent={
            !isLoading ? (
              <SlideInElement delay={200}>
                <EmptyState
                  icon='bell-o'
                  title={
                    filter === 'unread'
                      ? 'Okunmamış bildirim yok'
                      : 'Bildirim yok'
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
                  style={{
                    backgroundColor: Colors.white,
                    marginHorizontal: Spacing[4],
                    marginTop: Spacing[6],
                  }}
                />
              </SlideInElement>
            ) : null
          }
        />

        {/* Loading state overlay */}
        {isLoading && filteredNotifications.length === 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size='large' color={contextColor} />
            <Text style={styles.loadingText}>Bildirimler yükleniyor...</Text>
          </View>
        )}

        {/* Floating Action Button */}
        <SlideInElement delay={1000}>
          <FloatingElement>
            <TouchableOpacity
              style={[
                styles.floatingSettingsButton,
                { backgroundColor: contextColor }, // Use context color
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
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: Colors.vibrant?.purpleDark || Colors.primary.dark,
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
  settingsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing[3],
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing[1],
    flex: 1,
    shadowColor: Colors.gray[900],
    shadowOffset: { width: 10, height: 20 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  quickSettingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing[2],
    shadowColor: Colors.gray[900],
    shadowOffset: { width: 10, height: 20 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
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
    // backgroundColor will be set dynamically using context color
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
  unreadText: {
    color: Colors.gray[700],
    fontSize: 14,
    fontFamily: 'SecondaryFont-Regular',
    marginLeft: Spacing[1],
  },
  actionButtonsRow: {
    marginTop: Spacing[2],
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
    // backgroundColor will be set dynamically using context color
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
});

// Main component with context provider
const NotificationsScreen: React.FC = () => {
  return (
    <PreferredCourseProvider>
      <NotificationsScreenContent />
    </PreferredCourseProvider>
  );
};

export default NotificationsScreen;
