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
      console.log(`🗺️ Mapped route: ${route} → ${mappedRoute}`);
      return mappedRoute;
    }

    // If no mapping found, return original route
    console.log(`⚠️ No mapping found for route: ${route}`);
    return route;
  }, []);

  const navigateFromNotification = useCallback(
    (notification: Notification) => {
      console.log('🚀 Navigation Debug - Full notification:', notification);

      const { notification_type, action_url, metadata } = notification;

      console.log('🚀 Navigation Debug:', {
        notification_type,
        action_url,
        metadata,
      });

      // If there's a specific action URL, parse it and navigate
      if (action_url) {
        console.log('🚀 Using action_url:', action_url);
        const mappedUrl = mapRoute(action_url);
        handleActionUrl(mappedUrl, metadata);
        return;
      }

      console.log('🚀 Using default navigation for type:', notification_type);

      // Default navigation based on notification type
      switch (notification_type) {
        case 'study_reminder':
          router.push('/(tabs)/courses' as any);
          break;

        case 'achievement_unlock':
          console.log('🚀 Navigating to achievements (default)');
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
            router.push(`/(tabs)/profile/friends/${metadata.friend_id}` as any);
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
          router.push('/settings' as any);
          break;

        default:
          router.push('/' as any);
          break;
      }
    },
    [mapRoute],
  );

  const handleActionUrl = useCallback(
    (actionUrl: string, metadata?: Record<string, any>) => {
      console.log('🚀 handleActionUrl called with:', { actionUrl, metadata });

      try {
        const cleanUrl = actionUrl.startsWith('/')
          ? actionUrl
          : `/${actionUrl}`;

        console.log('🚀 Clean URL:', cleanUrl);
        console.log('🚀 About to navigate with router.push...');

        // Try the navigation
        router.push(cleanUrl as any);

        console.log('🚀 Navigation completed successfully');
      } catch (error) {
        console.error('🚨 Error parsing action URL:', error);
        console.log('🚀 Falling back to home screen');
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
          return '/settings';

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
        console.error('Error navigating with params:', error);
        router.push('/' as any);
      }
    },
    [],
  );

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
    mapRoute, // Export for testing
  };
};
