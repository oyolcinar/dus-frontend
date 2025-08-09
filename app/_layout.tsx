import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { View, useColorScheme, StyleSheet } from 'react-native';
import { SplashScreen } from 'expo-router';
import { useFonts } from 'expo-font';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Stack, useSegments, usePathname } from 'expo-router';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';

// Auth Context Provider
import { AuthProvider, useAuth } from '../context/AuthContext';

// Theme Context - for app-wide theme management beyond navigation
import { ThemeContext } from '../context/ThemeContext';

// Safe area context for proper layout across different devices
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Error logging and monitoring
import * as ErrorReporting from '../services/errorReporting';

// Network/API provider to handle global API state and network connectivity
import { NetworkProvider } from '../context/NetworkContext';

// Localization provider for multi-language support

// Asset prefetching for improved performance
import { AssetProvider, preloadAssets } from '../services/assetManager';
import AppBackground from '@/components/AppBackground';
import NotificationProvider from '@/context/NotificationContext';
import { PreferredCourseProvider } from '@/context/PreferredCourseContext';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Import ErrorBoundary directly
export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  // Force the app to start with the auth flow if no token is available
  initialRouteName: '(auth)',
};

// Memoized font configuration to prevent recreation
const fontConfig = {
  ...FontAwesome.font,
  // Your custom fonts
  PrimaryFont: require('../assets/fonts/primaryFont.ttf'),
  'SecondaryFont-Regular': require('../assets/fonts/secondaryFontRegular.ttf'),
  'SecondaryFont-Bold': require('../assets/fonts/secondaryFontBold.ttf'),
};

// Performance Navigation Tracker for Expo Router
function PerformanceNavigationTracker() {
  const segments = useSegments();
  const pathname = usePathname();
  const previousScreen = useRef<string | null>(null);
  const navigationCount = useRef(0);

  useEffect(() => {
    const currentScreen = segments.join('/') || 'root';

    if (previousScreen.current && currentScreen !== previousScreen.current) {
      navigationCount.current += 1;

      console.log('🔄 EXPO ROUTER NAVIGATION #' + navigationCount.current);
      console.log(`  From: ${previousScreen.current}`);
      console.log(`  To: ${currentScreen}`);
      console.log(`  Pathname: ${pathname}`);
      console.log('  ⚠️ CHECK PERFORMANCE MONITOR NOW!');
      console.log(
        '  📊 UI FPS should stay above 55 (currently drops to 37-38)',
      );
      console.log(
        '  💾 RAM was 270MB, now growing to 330MB - check current usage',
      );
      console.log('---');

      // Track every 5 navigations for memory pattern
      if (navigationCount.current % 5 === 0) {
        console.log('🚨 MEMORY CHECK: After 5 navigations - check RAM usage!');
      }
    }

    previousScreen.current = currentScreen;
  }, [segments, pathname]);

  return null;
}

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [loaded, error] = useFonts(fontConfig);

  // Initialize app resources and services
  useEffect(() => {
    let isMounted = true;

    async function prepare() {
      try {
        // Initialize error reporting
        await ErrorReporting.initialize();

        // Preload critical assets
        await preloadAssets();

        // Any other initialization logic
      } catch (e) {
        console.warn('Error in app initialization:', e);
        ErrorReporting.logError(e as Error);
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

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) {
      ErrorReporting.logError(error);
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded && appIsReady) {
      // Hide the splash screen once fonts are loaded and app is ready
      SplashScreen.hideAsync();
    }
  }, [loaded, appIsReady]);

  if (!loaded || !appIsReady) {
    return null;
  }

  // Return the root layout with comprehensive provider structure
  // Note: ErrorBoundary is handled by Expo Router itself, not as a wrapper component
  return (
    <SafeAreaProvider>
      <NetworkProvider>
        <PreferredCourseProvider>
          <AssetProvider>
            <AuthProvider>
              <RootLayoutNav />
            </AuthProvider>
          </AssetProvider>
        </PreferredCourseProvider>
      </NetworkProvider>
    </SafeAreaProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isLoading } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>(
    colorScheme === 'dark' ? 'dark' : 'light',
  );

  // Sync theme with system preference by default
  useEffect(() => {
    if (colorScheme) {
      setTheme(colorScheme === 'dark' ? 'dark' : 'light');
    }
  }, [colorScheme]);

  // Memoize theme context value to prevent unnecessary re-renders
  const themeContextValue = useMemo(
    () => ({
      theme,
      setTheme: (newTheme: string) => {
        if (newTheme === 'light' || newTheme === 'dark') {
          setTheme(newTheme);
        }
      },
      isDark: theme === 'dark',
      toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    }),
    [theme],
  );

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
        text: theme === 'dark' ? '#1f2937' : '#1f2937',
      },
    };
  }, [theme]);

  // Memoize status bar style
  const statusBarStyle = useMemo(
    () => (theme === 'dark' ? 'light' : 'dark'),
    [theme],
  );

  // Show a loading screen while checking auth state
  if (isLoading) {
    return <View style={styles.loadingContainer} />;
  }

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <NotificationProvider>
        <ThemeProvider value={customNavigationTheme}>
          <StatusBar style={statusBarStyle} />
          {/* Performance Navigation Tracker */}
          <PerformanceNavigationTracker />
          <AppBackground>
            <Stack screenOptions={stackScreenOptions}>
              {/* Your existing Auth Context already handles redirections,
              but we'll set up the screens here for proper stack navigation */}
              <Stack.Screen name='(auth)' options={authScreenOptions} />
              <Stack.Screen name='(tabs)' options={tabsScreenOptions} />

              {/* These screens are available regardless of authentication state */}
              {/* <Stack.Screen
                name='study/[id]'
                options={{
                  headerShown: true,
                  title: 'Study',
                  headerStyle: {
                    backgroundColor: theme === 'dark' ? '#ffffff' : '#ffffff',
                  },
                  headerTintColor: theme === 'dark' ? '#1f2937' : '#1f2937',
                }}
              /> */}
              {/* <Stack.Screen
                name='topic/[id]'
                options={{
                  headerShown: true,
                  title: 'Topic',
                  headerStyle: {
                    backgroundColor: theme === 'dark' ? '#ffffff' : '#ffffff',
                  },
                  headerTintColor: theme === 'dark' ? '#1f2937' : '#1f2937',
                }}
              /> */}
              {/* <Stack.Screen
                name='subtopic/[id]'
                options={{
                  headerShown: true,
                  title: 'Lesson',
                  headerStyle: {
                    backgroundColor: theme === 'dark' ? '#ffffff' : '#ffffff',
                  },
                  headerTintColor: theme === 'dark' ? '#1f2937' : '#1f2937',
                }}
              /> */}
              {/* <Stack.Screen
                name='test/[id]'
                options={{
                  headerShown: true,
                  title: 'Quiz',
                  headerStyle: {
                    backgroundColor: theme === 'dark' ? '#ffffff' : '#ffffff',
                  },
                  headerTintColor: theme === 'dark' ? '#1f2937' : '#1f2937',
                }}
              /> */}
            </Stack>
          </AppBackground>
        </ThemeProvider>
      </NotificationProvider>
    </ThemeContext.Provider>
  );
}

// Memoized screen options to prevent recreation
const stackScreenOptions = {
  headerShown: false,
  animation: 'fade' as const,
  // Apply consistent styling to all screens in the stack
  // contentStyle: {
  //   backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
  // },
};

const authScreenOptions = { headerShown: false };
const tabsScreenOptions = { headerShown: false };

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
});
