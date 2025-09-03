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
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
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
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const initializationAttempted = useRef(false);

  useEffect(() => {
    if (initializationAttempted.current || isInitializing || isInitialized) {
      return;
    }

    let networkUnsubscribe: (() => void) | null = null;

    const initialize = async () => {
      try {
        initializationAttempted.current = true;
        setIsInitializing(true);

        console.log('🚀 Starting single app initialization...');

        try {
          const netInfoUnsubscribe = NetInfo.addEventListener((state) => {
            const isOnline = !!state.isConnected && !!state.isInternetReachable;
            setNetworkStatus(isOnline);
          });
          networkUnsubscribe = netInfoUnsubscribe;
        } catch (networkError) {
          console.warn('⚠️ Network monitoring setup failed:', networkError);
        }
        await initializeApp();

        setIsInitialized(true);
        console.log('✅ App initialization complete');
      } catch (error) {
        console.error('❌ App initialization failed:', error);
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
    return () => {
      if (networkUnsubscribe) {
        networkUnsubscribe();
      }
    };
  }, []);

  return null;
}
function NavigationGuard() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const lastRedirect = useRef<string | null>(null);
  const redirectCount = useRef(0);
  const redirectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (redirectTimeout.current) {
      clearTimeout(redirectTimeout.current);
    }
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

    if (redirectCount.current > 3) {
      console.warn('⚠️ Too many redirects, resetting counter');
      redirectCount.current = 0;
      return;
    }

    const targetPath = isAuthenticated ? '/(tabs)' : '/(auth)/login';
    const shouldRedirect = isAuthenticated ? inAuthGroup : !inAuthGroup;

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
      }, 100);
    } else if (!shouldRedirect) {
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

function DeepLinkListener() {
  useEffect(() => {
    console.log('🔗 Setting up deep link listening...');

    Linking.getInitialURL()
      .then((url) => {
        if (url) {
          console.log('📱 Initial deep link detected:', url);
          handleDeepLink(url).catch((error) => {
            console.error('❌ Error handling initial deep link:', error);
          });
        }
      })
      .catch((error) => {
        console.error('❌ Error getting initial URL:', error);
      });

    const subscription = Linking.addEventListener('url', (event) => {
      console.log('📱 Runtime deep link detected:', event.url);
      handleDeepLink(event.url).catch((error) => {
        console.error('❌ Error handling runtime deep link:', error);
      });
    });

    console.log('✅ Deep link listener setup complete');

    return () => {
      console.log('🔗 Cleaning up deep link listener...');
      subscription?.remove();
    };
  }, []);

  return null;
}

// function LoadingScreen({ message = 'Loading...' }: { message?: string }) {
//   return (
//     <View style={styles.loadingContainer}>
//       <ActivityIndicator size='large' color='#4285F4' />
//       <Text style={styles.loadingText}>{message}</Text>
//     </View>
//   );
// }

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
        } catch (errorReportingError) {
          console.warn(
            'Error reporting initialization failed:',
            errorReportingError,
          );
        }
        try {
          await preloadAssets();
        } catch (assetError) {
          console.warn('Asset preloading failed:', assetError);
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

  useEffect(() => {
    if (loaded && appIsReady && hasInitServices) {
      setTimeout(() => {
        SplashScreen.hideAsync().catch((error) => {
          console.warn('Failed to hide splash screen:', error);
        });
      }, 100);
    }
  }, [loaded, appIsReady, hasInitServices]);

  // if (!loaded || !appIsReady || !hasInitServices) {
  //   return <LoadingScreen message='Preparing app...' />;
  // }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AssetProvider>
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

  // if (isLoading) {
  //   return <LoadingScreen message='Checking authentication...' />;
  // }

  return (
    <ThemeProvider value={customNavigationTheme}>
      <StatusBar style={statusBarStyle} />
      <AppBackground>
        <DeepLinkListener />

        <Stack screenOptions={stackScreenOptions}>
          <Stack.Screen name='(auth)' options={authScreenOptions} />
          <Stack.Screen name='(tabs)' options={tabsScreenOptions} />
        </Stack>
      </AppBackground>
    </ThemeProvider>
  );
}

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
