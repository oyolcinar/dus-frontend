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
        // ✅ TS FIX: ErrorReporting.logError does not return a promise, so handle errors in a try/catch
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

// ✅ ====================================================================
// ✅ THE MAIN FIX: ROBUST NAVIGATION GUARD (TS-SAFE)
// ✅ ====================================================================
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
function DeepLinkListener() {
  useEffect(() => {
    console.log('🔗 Setting up deep link listening...');

    // Handle initial URL when app is opened from a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('📱 Initial deep link detected:', url);
        handleDeepLink(url).catch((error) => {
          console.error('❌ Error handling initial deep link:', error);
        });
      }
    });

    // Handle deep links when app is already running
    const subscription = Linking.addEventListener('url', (event) => {
      console.log('📱 Runtime deep link detected:', event.url);
      handleDeepLink(event.url).catch((error) => {
        console.error('❌ Error handling runtime deep link:', error);
      });
    });

    return () => {
      subscription?.remove();
    };
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
        // ✅ TS FIX: Calling functions that don't return promises in individual try/catch blocks
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
      // ✅ TS FIX: Handle potential errors from logging as well
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

  return (
    // Use a View with onLayout to guarantee hideAsync is called after layout
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AssetProvider>
            <AppInitializer />
            <NavigationGuard />
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
