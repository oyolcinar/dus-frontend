import React, { useEffect, useState } from 'react';
import { View, useColorScheme } from 'react-native';
import { SplashScreen } from 'expo-router';
import { useFonts } from 'expo-font';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
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
import { LocalizationProvider } from '../context/LocalizationContext';

// Asset prefetching for improved performance
import { AssetProvider, preloadAssets } from '../services/assetManager';
import AppBackground from '@/components/AppBackground';
import NotificationProvider from '@/context/NotificationContext';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Import ErrorBoundary directly
export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  // Force the app to start with the auth flow if no token is available
  initialRouteName: '(auth)',
};

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [loaded, error] = useFonts({
    ...FontAwesome.font,

    // Your custom fonts
    PrimaryFont: require('../assets/fonts/primaryFont.ttf'),
    'SecondaryFont-Regular': require('../assets/fonts/secondaryFontRegular.ttf'),
    'SecondaryFont-Bold': require('../assets/fonts/secondaryFontBold.ttf'),
  });

  // Initialize app resources and services
  useEffect(() => {
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
        setAppIsReady(true);
      }
    }

    prepare();
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
        <LocalizationProvider>
          <AssetProvider>
            <AuthProvider>
              <RootLayoutNav />
            </AuthProvider>
          </AssetProvider>
        </LocalizationProvider>
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

  // Create a theme context value with the current theme and setter
  const themeContextValue = {
    theme,
    setTheme: (newTheme: string) => {
      if (newTheme === 'light' || newTheme === 'dark') {
        setTheme(newTheme);
      }
    },
    isDark: theme === 'dark',
    toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
  };

  // Show a loading screen while checking auth state
  if (isLoading) {
    return (
      <View className='flex-1 items-center justify-center bg-white dark:bg-gray-900' />
    );
  }

  // Use appropriate navigation theme based on current theme
  const navigationTheme = theme === 'dark' ? DarkTheme : DefaultTheme;

  // Customize navigation theme to match your app's color scheme
  const customNavigationTheme = {
    ...navigationTheme,
    colors: {
      ...navigationTheme.colors,
      primary: '#722ea5', // Your primary color from global.css
      // background: theme === 'dark' ? '#1f2937' : '#A29BFE',
      // card: theme === 'dark' ? '#1f2937' : '#ffffff',
      background: 'transparent',
      card: 'transparent',
      text: theme === 'dark' ? '#1f2937' : '#1f2937',
    },
  };

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <NotificationProvider>
        <ThemeProvider value={customNavigationTheme}>
          <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
          <AppBackground>
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'fade',
                // Apply consistent styling to all screens in the stack
                // contentStyle: {
                //   backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                // },
              }}
            >
              {/* Your existing Auth Context already handles redirections,
              but we'll set up the screens here for proper stack navigation */}
              <Stack.Screen name='(auth)' options={{ headerShown: false }} />
              <Stack.Screen name='(tabs)' options={{ headerShown: false }} />

              {/* These screens are available regardless of authentication state */}
              <Stack.Screen
                name='study/[id]'
                options={{
                  headerShown: true,
                  title: 'Study',
                  headerStyle: {
                    backgroundColor: theme === 'dark' ? '#ffffff' : '#ffffff',
                  },
                  headerTintColor: theme === 'dark' ? '#1f2937' : '#1f2937',
                }}
              />
              <Stack.Screen
                name='topic/[id]'
                options={{
                  headerShown: true,
                  title: 'Topic',
                  headerStyle: {
                    backgroundColor: theme === 'dark' ? '#ffffff' : '#ffffff',
                  },
                  headerTintColor: theme === 'dark' ? '#1f2937' : '#1f2937',
                }}
              />
              <Stack.Screen
                name='subtopic/[id]'
                options={{
                  headerShown: true,
                  title: 'Lesson',
                  headerStyle: {
                    backgroundColor: theme === 'dark' ? '#ffffff' : '#ffffff',
                  },
                  headerTintColor: theme === 'dark' ? '#1f2937' : '#1f2937',
                }}
              />
              <Stack.Screen
                name='test/[id]'
                options={{
                  headerShown: true,
                  title: 'Quiz',
                  headerStyle: {
                    backgroundColor: theme === 'dark' ? '#ffffff' : '#ffffff',
                  },
                  headerTintColor: theme === 'dark' ? '#1f2937' : '#1f2937',
                }}
              />
            </Stack>
          </AppBackground>
        </ThemeProvider>
      </NotificationProvider>
    </ThemeContext.Provider>
  );
}
