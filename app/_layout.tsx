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
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Stack, useSegments, usePathname, useRouter } from 'expo-router';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

// React Query for data fetching
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 🚀 YOUR ZUSTAND STORE (replaces multiple context providers)
import {
  useAuth,
  useTheme as useAppTheme,
  useNetwork,
} from '../stores/appStore';

// Safe area context for proper layout across different devices
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Error logging and monitoring
import * as ErrorReporting from '../services/errorReporting';

// Asset prefetching for improved performance
import { AssetProvider, preloadAssets } from '../services/assetManager';
import AppBackground from '@/components/AppBackground';

// Network monitoring
import NetInfo from '@react-native-community/netinfo';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Import ErrorBoundary directly
export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  // Force the app to start with the auth flow if no token is available
  initialRouteName: '(auth)',
};

// Create QueryClient instance (only once)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false, // 🚀 PREVENT unnecessary refetches
    },
    mutations: {
      retry: 1,
    },
  },
});

// Memoized font configuration to prevent recreation
const fontConfig = {
  ...FontAwesome.font,
  // Your custom fonts
  PrimaryFont: require('../assets/fonts/primaryFont.ttf'),
  'SecondaryFont-Regular': require('../assets/fonts/secondaryFontRegular.ttf'),
  'SecondaryFont-Bold': require('../assets/fonts/secondaryFontBold.ttf'),
};

// 🚀 FIXED APP INITIALIZER - prevents multiple initializations
function AppInitializer() {
  const { initializeApp } = useAuth();
  const { setNetworkStatus } = useNetwork();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const initializationAttempted = useRef(false);

  useEffect(() => {
    // 🚀 FIX: Only initialize once, ever
    if (initializationAttempted.current || isInitializing || isInitialized) {
      return;
    }

    let networkUnsubscribe: (() => void) | null = null;

    const initialize = async () => {
      try {
        initializationAttempted.current = true;
        setIsInitializing(true);

        console.log('🚀 Starting single app initialization...');

        // Setup network monitoring first (non-blocking)
        try {
          const netInfoUnsubscribe = NetInfo.addEventListener((state) => {
            const isOnline = !!state.isConnected && !!state.isInternetReachable;
            setNetworkStatus(isOnline);
          });
          networkUnsubscribe = netInfoUnsubscribe;
        } catch (networkError) {
          console.warn('⚠️ Network monitoring setup failed:', networkError);
        }

        // Initialize your store (handles session restoration, etc.)
        await initializeApp();

        setIsInitialized(true);
        console.log('✅ App initialization complete');
      } catch (error) {
        console.error('❌ App initialization failed:', error);

        // Don't prevent app from starting on initialization failure
        setIsInitialized(true);

        try {
          ErrorReporting.logError(error as Error);
        } catch (reportingError) {
          console.warn('Error reporting failed:', reportingError);
        }
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();

    // Cleanup function
    return () => {
      if (networkUnsubscribe) {
        networkUnsubscribe();
      }
    };
  }, []); // 🚀 EMPTY dependency array - only run once

  return null;
}

// 🚀 FIXED NAVIGATION GUARD - prevents infinite loops
function NavigationGuard() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const lastRedirect = useRef<string | null>(null);
  const redirectCount = useRef(0);
  const redirectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear any pending redirects
    if (redirectTimeout.current) {
      clearTimeout(redirectTimeout.current);
    }

    // Don't navigate while loading or during app initialization
    if (isLoading) {
      console.log('🔄 Navigation guard waiting - auth loading...');
      return;
    }

    const currentPath = segments.join('/');
    const inAuthGroup = segments[0] === '(auth)';

    console.log('🔄 Navigation check:', {
      currentPath,
      inAuthGroup,
      isAuthenticated,
      redirectCount: redirectCount.current,
    });

    // 🚀 FIX: Prevent too many redirects
    if (redirectCount.current > 3) {
      console.warn('⚠️ Too many redirects, resetting counter');
      redirectCount.current = 0;
      return;
    }

    const targetPath = isAuthenticated ? '/(tabs)' : '/(auth)/login';
    const shouldRedirect = isAuthenticated ? inAuthGroup : !inAuthGroup;

    // 🚀 FIX: Use timeout to prevent rapid redirects
    if (shouldRedirect && targetPath !== lastRedirect.current) {
      redirectTimeout.current = setTimeout(() => {
        try {
          console.log(`🔀 Redirecting to ${targetPath}`);
          lastRedirect.current = targetPath;
          redirectCount.current++;

          router.replace(targetPath);
        } catch (error) {
          console.error('❌ Navigation error:', error);
        }
      }, 100); // Small delay to prevent rapid redirects
    } else if (!shouldRedirect) {
      // Reset when we're in the right place
      redirectCount.current = 0;
      lastRedirect.current = null;
    }

    return () => {
      if (redirectTimeout.current) {
        clearTimeout(redirectTimeout.current);
      }
    };
  }, [isAuthenticated, isLoading, segments, router]);

  return null;
}

// 🚀 NEW: Loading Screen Component
function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size='large' color='#4285F4' />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
}

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [loaded, error] = useFonts(fontConfig);
  const [hasInitServices, setHasInitServices] = useState(false);

  // Initialize app resources and services
  useEffect(() => {
    let isMounted = true;

    async function prepare() {
      try {
        console.log('🔄 Preparing app services...');

        // Initialize error reporting (non-blocking)
        try {
          await ErrorReporting.initialize();
        } catch (errorReportingError) {
          console.warn(
            'Error reporting initialization failed:',
            errorReportingError,
          );
        }

        // Preload critical assets (non-blocking)
        try {
          await preloadAssets();
        } catch (assetError) {
          console.warn('Asset preloading failed:', assetError);
        }

        setHasInitServices(true);
        console.log('✅ App services prepared');
      } catch (e) {
        console.warn('Error in app preparation:', e);

        // Don't fail app startup on service initialization errors
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

  // Handle font loading errors
  useEffect(() => {
    if (error) {
      console.error('Font loading error:', error);
      try {
        ErrorReporting.logError(error);
      } catch (reportingError) {
        console.warn('Error reporting failed:', reportingError);
      }
      // Don't throw - let app continue with default fonts
    }
  }, [error]);

  // Hide splash screen when ready
  useEffect(() => {
    if (loaded && appIsReady && hasInitServices) {
      // Small delay to ensure everything is ready
      setTimeout(() => {
        SplashScreen.hideAsync().catch((error) => {
          console.warn('Failed to hide splash screen:', error);
        });
      }, 100);
    }
  }, [loaded, appIsReady, hasInitServices]);

  // 🚀 FIX: Show loading screen while app is preparing
  if (!loaded || !appIsReady || !hasInitServices) {
    return <LoadingScreen message='Preparing app...' />;
  }

  // 🎉 SIMPLIFIED LAYOUT - Only 3 providers instead of 7!
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AssetProvider>
          {/* 🚀 App initializer and navigation guard */}
          <AppInitializer />
          <NavigationGuard />
          <RootLayoutNav />
        </AssetProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isLoading } = useAuth();

  // 🚀 Use your store's theme instead of device color scheme
  const { theme: storeTheme } = useAppTheme();

  // Use store theme if available, fallback to device color scheme
  const theme = storeTheme || (colorScheme === 'dark' ? 'dark' : 'light');

  // Memoize navigation theme to prevent recreation on every render
  const customNavigationTheme = useMemo(() => {
    const navigationTheme = theme === 'dark' ? DarkTheme : DefaultTheme;

    return {
      ...navigationTheme,
      colors: {
        ...navigationTheme.colors,
        primary: '#722ea5', // Your primary color from global.css
        background: 'transparent',
        card: 'transparent',
        text: theme === 'dark' ? '#ffffff' : '#1f2937',
      },
    };
  }, [theme]);

  // Memoize status bar style
  const statusBarStyle = useMemo(
    () => (theme === 'dark' ? 'light' : 'dark'),
    [theme],
  );

  // 🚀 FIX: Show better loading screen while checking auth state
  if (isLoading) {
    return <LoadingScreen message='Checking authentication...' />;
  }

  return (
    <ThemeProvider value={customNavigationTheme}>
      <StatusBar style={statusBarStyle} />
      <AppBackground>
        <Stack screenOptions={stackScreenOptions}>
          <Stack.Screen name='(auth)' options={authScreenOptions} />
          <Stack.Screen name='(tabs)' options={tabsScreenOptions} />
        </Stack>
      </AppBackground>
    </ThemeProvider>
  );
}

// Memoized screen options to prevent recreation
const stackScreenOptions = {
  headerShown: false,
  animation: 'fade' as const,
};

const authScreenOptions = { headerShown: false };
const tabsScreenOptions = { headerShown: false };

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

// 🎉 SUMMARY OF CRITICAL FIXES:
/*
🔥 PROBLEMS FIXED:

1. **Infinite Initialization Loop**:
   - ❌ Before: AppInitializer ran multiple times
   - ✅ After: Uses useRef to ensure single initialization

2. **Navigation Redirect Loop**:
   - ❌ Before: Rapid redirects caused infinite loops
   - ✅ After: Uses timeout and redirect counting to prevent loops

3. **Blocking Operations**:
   - ❌ Before: Failed service initialization blocked app startup
   - ✅ After: All service initialization is non-blocking

4. **Missing Loading States**:
   - ❌ Before: No proper loading screens during initialization
   - ✅ After: Clear loading messages for each phase

5. **Error Handling**:
   - ❌ Before: Errors could crash app startup
   - ✅ After: Graceful error handling with fallbacks

🚀 RESULT:
- No more screen flashing
- No more infinite loops
- Smooth app startup
- Proper loading states
- Graceful error handling
*/
