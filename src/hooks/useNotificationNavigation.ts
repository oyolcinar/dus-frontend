import { useCallback } from 'react';
import { router } from 'expo-router';
import { Notification, NotificationType } from '../types/models';

export const useNotificationNavigation = () => {
  // Route mapping for backend routes to actual app routes
  const ROUTE_MAPPING: Record<string, string> = {
    '/achievements': '/(tabs)/profile/achievements',
    '/friends': '/(tabs)/profile/friends',
    '/profile': '/(tabs)/profile',
    '/duels': '/(tabs)/duels',
    '/courses': '/(tabs)/courses',
    '/study': '/study',
    '/settings': '/settings',
    '/notifications': '/(tabs)/notifications',
    // Add more mappings as needed
  };

  const mapRoute = useCallback((route: string): string => {
    // If it's already a tab route, return as is
    if (route.includes('(tabs)')) {
      return route;
    }

    // Check if we have a mapping for this route
    const mappedRoute = ROUTE_MAPPING[route];
    if (mappedRoute) {
      return mappedRoute;
    }

    // If no mapping found, return original route
    return route;
  }, []);

  const navigateFromNotification = useCallback(
    (notification: Notification) => {
      // Add delay to ensure app is fully loaded when opened from notification
      const performNavigation = () => {
        const { notification_type, action_url, metadata } = notification;

        // If there's a specific action URL, parse it and navigate
        if (action_url) {
          const mappedUrl = mapRoute(action_url);
          handleActionUrl(mappedUrl, metadata);
          return;
        }

        // Default navigation based on notification type
        switch (notification_type) {
          case 'study_reminder':
            router.push('/(tabs)/courses' as any);
            break;

          case 'achievement_unlock':
            router.push('/(tabs)/profile/achievements' as any);
            break;

          case 'duel_invitation':
            if (metadata?.duel_id) {
              router.push(`/duels/${metadata.duel_id}` as any);
            } else {
              router.push('/(tabs)/duels' as any);
            }
            break;

          case 'duel_result':
            if (metadata?.duel_id) {
              router.push(`/(tabs)/duels/${metadata.duel_id}/result` as any);
            } else {
              router.push('/(tabs)/duels' as any);
            }
            break;

          case 'friend_request':
            router.push('/(tabs)/profile/friends' as any);
            break;

          case 'friend_activity':
            if (metadata?.friend_id) {
              router.push(
                `/(tabs)/profile/friends/${metadata.friend_id}` as any,
              );
            } else {
              router.push('/(tabs)/profile/friends' as any);
            }
            break;

          case 'content_update':
            if (metadata?.content_id) {
              router.push(`/content/${metadata.content_id}` as any);
            } else {
              router.push('/(tabs)/courses' as any);
            }
            break;

          case 'streak_reminder':
            router.push('/study' as any);
            break;

          case 'plan_reminder':
            if (metadata?.plan_id) {
              router.push(`/study/plan/${metadata.plan_id}` as any);
            } else {
              router.push('/study/plan' as any);
            }
            break;

          case 'coaching_note':
            if (metadata?.note_id) {
              router.push(`/coaching/${metadata.note_id}` as any);
            } else {
              router.push('/coaching' as any);
            }
            break;

          case 'motivational_message':
            router.push('/' as any);
            break;

          case 'system_announcement':
            router.push('/(tabs)/notifications' as any);
            break;

          default:
            router.push('/' as any);
            break;
        }
      };

      // Small delay to ensure app is ready when opened from notification
      setTimeout(performNavigation, 500);
    },
    [mapRoute],
  );

  const handleActionUrl = useCallback(
    (actionUrl: string, metadata?: Record<string, any>) => {
      try {
        const cleanUrl = actionUrl.startsWith('/')
          ? actionUrl
          : `/${actionUrl}`;

        router.push(cleanUrl as any);
      } catch (error) {
        // Fallback to home on error
        router.push('/' as any);
      }
    },
    [],
  );

  const getNotificationDeepLink = useCallback(
    (notification: Notification): string => {
      const { notification_type, metadata } = notification;

      switch (notification_type) {
        case 'duel_invitation':
        case 'duel_result':
          return metadata?.duel_id
            ? `/(tabs)/duels/${metadata.duel_id}`
            : '/(tabs)/duels';

        case 'achievement_unlock':
          return '/(tabs)/profile/achievements';

        case 'friend_request':
        case 'friend_activity':
          return metadata?.friend_id
            ? `/(tabs)/profile/friends/${metadata.friend_id}`
            : '/(tabs)/profile/friends';

        case 'plan_reminder':
          return metadata?.plan_id
            ? `/study/plan/${metadata.plan_id}`
            : '/study/plan';

        case 'coaching_note':
          return metadata?.note_id
            ? `/coaching/${metadata.note_id}`
            : '/coaching';

        case 'content_update':
          return metadata?.content_id
            ? `/content/${metadata.content_id}`
            : '/(tabs)/courses';

        case 'study_reminder':
        case 'streak_reminder':
          return '/(tabs)/courses';

        case 'motivational_message':
          return '/';

        case 'system_announcement':
          return '/(tabs)/notifications';

        default:
          return '/';
      }
    },
    [],
  );

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
        router.push('/' as any);
      }
    },
    [],
  );

  const safeNavigate = useCallback((route: string, fallback: string = '/') => {
    try {
      router.push(route as any);
    } catch (error) {
      router.push(fallback as any);
    }
  }, []);

  return {
    navigateFromNotification,
    handleActionUrl,
    getNotificationDeepLink,
    navigateWithParams,
    safeNavigate,
    mapRoute,
  };
};
