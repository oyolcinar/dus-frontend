import { useCallback } from 'react';
import { router } from 'expo-router';
import { Notification, NotificationType } from '../types/models';

/**
 * Hook for handling notification navigation
 * This centralizes the logic for navigating to different screens based on notification types
 * Uses Expo Router for navigation
 */
export const useNotificationNavigation = () => {
  const navigateFromNotification = useCallback((notification: Notification) => {
    const { notification_type, action_url, metadata } = notification;

    // If there's a specific action URL, parse it and navigate
    if (action_url) {
      handleActionUrl(action_url, metadata);
      return;
    }

    // Default navigation based on notification type
    switch (notification_type) {
      case 'study_reminder':
        // Navigate to study screen or dashboard
        router.push('/(tabs)/courses' as any);
        break;

      case 'achievement_unlock':
        // Navigate to achievements screen
        router.push('/(tabs)/profile/achievements' as any);
        break;

      case 'duel_invitation':
        // Navigate to duel detail or pending duels
        if (metadata?.duel_id) {
          router.push(`/duels/${metadata.duel_id}` as any);
        } else {
          router.push('/duels' as any);
        }
        break;

      case 'duel_result':
        // Navigate to duel result screen
        if (metadata?.duel_id) {
          router.push(`/(tabs)/duels/${metadata.duel_id}/result` as any);
        } else {
          router.push('/(tabs)/duels' as any);
        }
        break;

      case 'friend_request':
        // Navigate to friends screen
        router.push('/(tabs)/profile/friends' as any);
        break;

      case 'friend_activity':
        // Navigate to friends screen or specific friend profile
        if (metadata?.friend_id) {
          router.push(`/(tabs)/profile/friends/${metadata.friend_id}` as any);
        } else {
          router.push('/(tabs)/profile/friends' as any);
        }
        break;

      case 'content_update':
        // Navigate to what's new or specific content
        if (metadata?.content_id) {
          router.push(`/content/${metadata.content_id}` as any);
        } else {
          router.push('/' as any);
        }
        break;

      case 'streak_reminder':
        // Navigate to study screen to continue streak
        router.push('/study' as any);
        break;

      case 'plan_reminder':
        // Navigate to study plan
        if (metadata?.plan_id) {
          router.push(`/study/plan/${metadata.plan_id}` as any);
        } else {
          router.push('/study/plan' as any);
        }
        break;

      case 'coaching_note':
        // Navigate to coaching notes
        if (metadata?.note_id) {
          router.push(`/coaching/${metadata.note_id}` as any);
        } else {
          router.push('/coaching' as any);
        }
        break;

      case 'motivational_message':
        // Navigate to motivational content or dashboard
        router.push('/' as any);
        break;

      case 'system_announcement':
        // Navigate to announcements or settings
        router.push('/settings' as any);
        break;

      default:
        // Default to home screen
        router.push('/' as any);
        break;
    }
  }, []);

  const handleActionUrl = useCallback(
    (actionUrl: string, metadata?: Record<string, any>) => {
      // Parse action URL and navigate accordingly
      // Example action URLs:
      // "/duel/123" -> Navigate to /duel/123
      // "/achievement/unlock" -> Navigate to /achievements
      // "/study/plan/456" -> Navigate to /study/plan/456

      try {
        // Clean the URL and ensure it starts with /
        const cleanUrl = actionUrl.startsWith('/')
          ? actionUrl
          : `/${actionUrl}`;

        // Use router.push to navigate to the URL
        router.push(cleanUrl as any);
      } catch (error) {
        console.error('Error parsing action URL:', error);
        router.push('/' as any);
      }
    },
    [],
  );

  const getNotificationDeepLink = useCallback(
    (notification: Notification): string => {
      // Generate deep link for sharing or external access
      const { notification_type, metadata } = notification;

      switch (notification_type) {
        case 'duel_invitation':
        case 'duel_result':
          return metadata?.duel_id
            ? `/(tabs)/duels/${metadata.duel_id}`
            : '/duels';

        case 'achievement_unlock':
          return '/achievements';

        case 'friend_request':
        case 'friend_activity':
          return metadata?.friend_id
            ? `/friends/${metadata.friend_id}`
            : '/friends';

        case 'plan_reminder':
          return metadata?.plan_id
            ? `/study/plan/${metadata.plan_id}`
            : '/study/plan';

        case 'coaching_note':
          return metadata?.note_id
            ? `/coaching/${metadata.note_id}`
            : '/coaching';

        case 'content_update':
          return metadata?.content_id ? `/content/${metadata.content_id}` : '/';

        case 'study_reminder':
        case 'streak_reminder':
          return '/study';

        case 'motivational_message':
          return '/';

        case 'system_announcement':
          return '/settings';

        default:
          return '/';
      }
    },
    [],
  );

  // Additional helper for programmatic navigation with parameters
  const navigateWithParams = useCallback(
    (path: string, params?: Record<string, any>) => {
      try {
        if (params && Object.keys(params).length > 0) {
          const searchParams = new URLSearchParams();
          Object.entries(params).forEach(([key, value]) => {
            searchParams.append(key, String(value));
          });
          router.push(`${path}?${searchParams.toString()}` as any);
        } else {
          router.push(path as any);
        }
      } catch (error) {
        console.error('Error navigating with params:', error);
        router.push('/' as any);
      }
    },
    [],
  );

  // Safe navigation helper that checks if route exists before navigating
  const safeNavigate = useCallback((route: string, fallback: string = '/') => {
    try {
      router.push(route as any);
    } catch (error) {
      console.warn(`Route ${route} not found, falling back to ${fallback}`);
      router.push(fallback as any);
    }
  }, []);

  return {
    navigateFromNotification,
    handleActionUrl,
    getNotificationDeepLink,
    navigateWithParams,
    safeNavigate,
  };
};
