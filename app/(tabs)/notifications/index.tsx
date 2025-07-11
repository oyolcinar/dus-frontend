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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNotifications } from '../../../context/NotificationContext';
import { useNotificationNavigation } from '../../../src/hooks/useNotificationNavigation';
import { NotificationItem } from '../../../components/ui';
import { Notification } from '../../../src/types/models';

const NotificationsScreen: React.FC = () => {
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

  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

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

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <NotificationItem
      notification={item}
      onPress={handleNotificationPress}
      onMarkAsRead={markAsRead}
      onDelete={deleteNotification}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Feather name='bell-off' size={64} color='#D1D5DB' />
      <Text style={styles.emptyTitle}>
        {filter === 'unread' ? 'Okunmamış bildirim yok' : 'Bildirim yok'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {filter === 'unread'
          ? 'Tüm bildirimlerinizi okumuşsunuz!'
          : 'Henüz bildiriminiz bulunmuyor.'}
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        <Text style={styles.screenTitle}>Bildirimler</Text>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      <View style={styles.headerActions}>
        {/* Filter buttons */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'all' && styles.activeFilterButton,
            ]}
            onPress={() => setFilter('all')}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === 'all' && styles.activeFilterButtonText,
              ]}
            >
              Tümü
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'unread' && styles.activeFilterButton,
            ]}
            onPress={() => setFilter('unread')}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === 'unread' && styles.activeFilterButtonText,
              ]}
            >
              Okunmamış ({unreadCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Mark all as read button */}
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={handleMarkAllAsRead}
          >
            <Feather name='check-circle' size={16} color='#10B981' />
            <Text style={styles.markAllButtonText}>Tümünü Okundu İşaretle</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!isLoading) return null;

    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size='small' color='#3B82F6' />
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

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}

      <FlatList
        data={filteredNotifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.notification_id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3B82F6']}
            tintColor='#3B82F6'
          />
        }
        onEndReached={loadMoreNotifications}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={15}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  headerActions: {
    gap: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeFilterButton: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeFilterButtonText: {
    color: '#1F2937',
    fontWeight: '600',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    gap: 6,
  },
  markAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  listContainer: {
    paddingVertical: 8,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingFooter: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});

export default NotificationsScreen;
