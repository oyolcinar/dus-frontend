import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import {
  View,
  useColorScheme,
  StyleSheet,
  Text,
  ActivityIndicator,
} from 'react-native';
import { SplashScreen } from 'expo-router';
import { useFonts } from 'expo-font';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Stack, useSegments, useRouter } from 'expo-router';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useAuth,
  useTheme as useAppTheme,
  useNetwork,
} from '../stores/appStore';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as ErrorReporting from '../services/errorReporting';
import { AssetProvider, preloadAssets } from '../services/assetManager';
import AppBackground from '@/components/AppBackground';
import NetInfo from '@react-native-community/netinfo';
import * as Linking from 'expo-linking';
import { handleDeepLink } from '../utils/oauthDeepLinkHandler';
import {
  setupPushNotifications,
  setupNotificationListeners,
} from '../src/api/notificationService';

SplashScreen.preventAutoHideAsync();

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

const fontConfig = {
  ...FontAwesome.font,
  PrimaryFont: require('../assets/fonts/primaryFont.ttf'),
  'SecondaryFont-Regular': require('../assets/fonts/secondaryFontRegular.ttf'),
  'SecondaryFont-Bold': require('../assets/fonts/secondaryFontBold.ttf'),
};

function AppInitializer() {
  const { initializeApp } = useAuth();
  const { setNetworkStatus } = useNetwork();
  const initializationAttempted = useRef(false);

  useEffect(() => {
    if (initializationAttempted.current) {
      return;
    }
    initializationAttempted.current = true;

    let networkUnsubscribe: (() => void) | null = null;

    const initialize = async () => {
      try {
        console.log('🚀 Starting single app initialization...');
        networkUnsubscribe = NetInfo.addEventListener((state) => {
          const isOnline = !!state.isConnected && !!state.isInternetReachable;
          setNetworkStatus(isOnline);
        });
        await initializeApp();
        console.log('✅ App initialization complete');
      } catch (error) {
        console.error('❌ App initialization failed:', error);
        try {
          ErrorReporting.logError(error as Error);
        } catch (reportingError) {
          console.warn('Error reporting failed:', reportingError);
        }
      }
    };

    initialize();
    return () => {
      networkUnsubscribe?.();
    };
  }, [initializeApp, setNetworkStatus]);

  return null;
}

// ROBUST NAVIGATION GUARD
function NavigationGuard() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const isNavigating = useRef(false);

  useEffect(() => {
    // Wait until the initial authentication check is complete.
    if (isLoading) {
      console.log('🔄 NavigationGuard: Waiting for auth check to complete...');
      return;
    }

    // After loading, the router might need a moment to be ready.
    // A short delay helps prevent race conditions.
    const navigationTimeout = setTimeout(() => {
      if (isNavigating.current) {
        return;
      }

      const inAuthGroup = segments[0] === '(auth)';

      // Condition 1: User is logged in but is in the auth section.
      if (isAuthenticated && inAuthGroup) {
        isNavigating.current = true;
        console.log(
          '🔀 NavigationGuard: User is authenticated, redirecting to App -> /(tabs)',
        );
        router.replace('/(tabs)');
      }

      // Condition 2: User is NOT logged in and is outside the auth section.
      else if (!isAuthenticated && !inAuthGroup) {
        isNavigating.current = true;
        console.log(
          '🔀 NavigationGuard: User is not authenticated, redirecting to Auth -> /(auth)/login',
        );
        router.replace('/(auth)/login');
      }
    }, 100); // A small 100ms delay can stabilize navigation.

    // Cleanup timeout on re-render
    return () => clearTimeout(navigationTimeout);
  }, [isAuthenticated, isLoading, segments, router]);

  // Reset navigation lock when route changes, allowing for new navigation.
  useEffect(() => {
    isNavigating.current = false;
  }, [segments]);

  return null;
}

// FIXED: Enhanced Deep Link Listener with iOS bug workaround
function DeepLinkListener() {
  const url = Linking.useURL();
  const processedUrls = useRef(new Set<string>());

  // FIX for Expo Router iOS deep linking bug - process URLs directly
  useEffect(() => {
    if (!url) return;

    // Prevent processing the same URL multiple times
    if (processedUrls.current.has(url)) {
      return;
    }
    processedUrls.current.add(url);

    console.log('🔗 Deep link received via useURL:', url);

    // Check if this is an OAuth callback by parsing the URL
    const { hostname, path, queryParams } = Linking.parse(url);
    console.log('📋 Parsed URL parts:', { hostname, path, queryParams });

    // Handle OAuth callback URLs directly (bypass Expo Router bug)
    if (
      (path && path.includes('oauth-callback')) ||
      (hostname && hostname.includes('oauth-callback')) ||
      url.includes('oauth-callback')
    ) {
      console.log('🔄 Processing OAuth callback directly...');

      // Convert queryParams to string record for consistency
      const params: Record<string, string> = {};
      Object.entries(queryParams || {}).forEach(([key, value]) => {
        params[key] = String(value);
      });

      // Call the OAuth handler directly
      handleDeepLink(url).catch((error) => {
        console.error('❌ Error handling OAuth deep link:', error);
      });
    } else {
      console.log('🔗 Regular deep link, letting Expo Router handle it');
    }
  }, [url]);

  // Fallback: Traditional deep link handling for when app is already running
  useEffect(() => {
    console.log('🔗 Setting up traditional deep link listening...');

    // Handle initial URL when app is opened from a deep link
    Linking.getInitialURL().then((initialUrl) => {
      if (initialUrl && !processedUrls.current.has(initialUrl)) {
        console.log('📱 Initial deep link detected:', initialUrl);
        processedUrls.current.add(initialUrl);
        handleDeepLink(initialUrl).catch((error) => {
          console.error('❌ Error handling initial deep link:', error);
        });
      }
    });

    // Handle deep links when app is already running
    const subscription = Linking.addEventListener('url', (event) => {
      if (!processedUrls.current.has(event.url)) {
        console.log('📱 Runtime deep link detected:', event.url);
        processedUrls.current.add(event.url);
        handleDeepLink(event.url).catch((error) => {
          console.error('❌ Error handling runtime deep link:', error);
        });
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  // Clear processed URLs cache periodically to prevent memory leaks
  useEffect(() => {
    const clearCache = setInterval(
      () => {
        if (processedUrls.current.size > 50) {
          console.log('🧹 Clearing deep link URL cache');
          processedUrls.current.clear();
        }
      },
      5 * 60 * 1000,
    ); // Clear every 5 minutes

    return () => clearInterval(clearCache);
  }, []);

  return null;
}

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [loaded, error] = useFonts(fontConfig);
  const [hasInitServices, setHasInitServices] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function prepare() {
      try {
        console.log('🔄 Preparing app services...');
        try {
          await ErrorReporting.initialize();
        } catch (e) {
          console.warn('Error reporting init failed:', e);
        }
        try {
          await preloadAssets();
        } catch (e) {
          console.warn('Asset preloading failed:', e);
        }
        setHasInitServices(true);
        console.log('✅ App services prepared');
      } catch (e) {
        console.warn('Error in app preparation:', e);
        setHasInitServices(true);
        try {
          ErrorReporting.logError(e as Error);
        } catch (reportingError) {
          console.warn('Error reporting failed:', reportingError);
        }
      } finally {
        if (isMounted) {
          setAppIsReady(true);
        }
      }
    }
    prepare();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (error) {
      console.error('Font loading error:', error);
      try {
        ErrorReporting.logError(error);
      } catch (reportingError) {
        console.warn('Error reporting failed:', reportingError);
      }
    }
  }, [error]);

  const onLayoutRootView = useCallback(async () => {
    if (loaded && appIsReady && hasInitServices) {
      await SplashScreen.hideAsync();
    }
  }, [loaded, appIsReady, hasInitServices]);

  if (!loaded || !appIsReady || !hasInitServices) {
    return null; // Keep splash screen visible
  }

  function NotificationSetup() {
    const { isAuthenticated, hasInitialized } = useAuth();
    const setupAttempted = useRef(false);

    useEffect(() => {
      if (hasInitialized && isAuthenticated && !setupAttempted.current) {
        setupAttempted.current = true;

        const initNotifications = async () => {
          try {
            console.log('Setting up notifications for authenticated user...');

            // Setup push notifications
            const result = await setupPushNotifications();
            if (result.success) {
              console.log('Push notifications setup successful');
            }

            // Setup listeners
            const cleanup = setupNotificationListeners();

            return cleanup;
          } catch (error) {
            console.error('Notification setup failed:', error);
          }
        };

        const cleanupPromise = initNotifications();

        return () => {
          cleanupPromise.then((cleanup) => cleanup?.());
        };
      }
    }, [hasInitialized, isAuthenticated]);

    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AssetProvider>
            <AppInitializer />
            <NavigationGuard />
            <NotificationSetup />
            <RootLayoutNav />
          </AssetProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </View>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { theme: storeTheme } = useAppTheme();
  const theme = storeTheme || (colorScheme === 'dark' ? 'dark' : 'light');

  const customNavigationTheme = useMemo(() => {
    const navigationTheme = theme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...navigationTheme,
      colors: {
        ...navigationTheme.colors,
        primary: '#722ea5',
        background: 'transparent',
        card: 'transparent',
        text: theme === 'dark' ? '#ffffff' : '#1f2937',
      },
    };
  }, [theme]);

  const statusBarStyle = useMemo(
    () => (theme === 'dark' ? 'light' : 'dark'),
    [theme],
  );

  return (
    <ThemeProvider value={customNavigationTheme}>
      <StatusBar style={statusBarStyle} />
      <AppBackground>
        <DeepLinkListener />
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name='(auth)' />
          <Stack.Screen name='(tabs)' />
        </Stack>
      </AppBackground>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
  },
  loadingText: {
    marginTop: 16,
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
