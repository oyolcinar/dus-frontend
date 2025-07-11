import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons';
import {
  formatNotificationTime,
  getNotificationIcon,
  getNotificationColor,
  getNotificationPriority,
} from '../../src/api/notificationService';
import { NotificationItemProps } from './types';

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onPress,
  onMarkAsRead,
  onDelete,
  style,
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const priority = getNotificationPriority(notification.notification_type);
  const iconName = getNotificationIcon(notification.notification_type);
  const color = getNotificationColor(notification.notification_type);
  const timeAgo = formatNotificationTime(notification.created_at);

  const handlePress = () => {
    if (onPress) {
      onPress(notification);
    }

    // Auto-mark as read when tapped
    if (!notification.is_read && onMarkAsRead) {
      onMarkAsRead(notification.notification_id);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Bildirimi Sil',
      'Bu bildirimi silmek istediğinizden emin misiniz?',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => onDelete?.(notification.notification_id),
        },
      ],
    );
  };

  const handleMarkAsRead = () => {
    if (!notification.is_read && onMarkAsRead) {
      onMarkAsRead(notification.notification_id);
    }
  };

  const renderRightActions = (
    progress: Animated.AnimatedAddition<number>,
    dragX: Animated.AnimatedAddition<number>,
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-100, -50, 0],
      outputRange: [1, 0.8, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.rightActions}>
        {!notification.is_read && (
          <Animated.View
            style={[
              styles.actionButton,
              styles.readButton,
              { transform: [{ scale }] },
            ]}
          >
            <TouchableOpacity
              onPress={handleMarkAsRead}
              style={styles.actionTouchable}
            >
              <Feather name='check' size={20} color='#fff' />
              <Text style={styles.actionText}>Okundu</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
        <Animated.View
          style={[
            styles.actionButton,
            styles.deleteButton,
            { transform: [{ scale }] },
          ]}
        >
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.actionTouchable}
          >
            <Feather name='trash-2' size={20} color='#fff' />
            <Text style={styles.actionText}>Sil</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  };

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <TouchableOpacity
        style={[
          styles.container,
          !notification.is_read && styles.unreadContainer,
          priority === 'high' && styles.highPriorityContainer,
          isPressed && styles.pressedContainer,
          style,
        ]}
        onPress={handlePress}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        activeOpacity={0.7}
      >
        <View style={styles.content}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: color }]}>
            <Feather name={iconName as any} size={20} color='#fff' />
          </View>

          {/* Content */}
          <View style={styles.textContainer}>
            <View style={styles.header}>
              <Text
                style={[
                  styles.title,
                  !notification.is_read && styles.unreadTitle,
                ]}
                numberOfLines={2}
              >
                {notification.title}
              </Text>
              <Text style={styles.time}>{timeAgo}</Text>
            </View>

            <Text
              style={[styles.body, !notification.is_read && styles.unreadBody]}
              numberOfLines={3}
            >
              {notification.body}
            </Text>

            {/* Priority indicator */}
            {priority === 'high' && (
              <View style={styles.priorityIndicator}>
                <Text style={styles.priorityText}>Yüksek Öncelik</Text>
              </View>
            )}
          </View>

          {/* Unread indicator */}
          {!notification.is_read && <View style={styles.unreadDot} />}
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadContainer: {
    backgroundColor: '#f8faff',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  highPriorityContainer: {
    borderWidth: 1,
    borderColor: '#FEE2E2',
    backgroundColor: '#FFFBFB',
  },
  pressedContainer: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  content: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {
    fontWeight: '700',
    color: '#111827',
  },
  time: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  body: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  unreadBody: {
    color: '#4B5563',
  },
  priorityIndicator: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  priorityText: {
    fontSize: 10,
    color: '#DC2626',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginTop: 4,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 16,
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    marginLeft: 8,
    borderRadius: 8,
  },
  actionTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  readButton: {
    backgroundColor: '#10B981',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});

export default NotificationItem;
