import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useColorScheme } from 'react-native';
import { SplashScreen, Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { 
  DarkTheme, 
  DefaultTheme, 
  ThemeProvider 
} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import '../global.css';

// Auth Context Provider
import { AuthProvider, useAuth } from '../context/AuthContext';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Force the app to start with the auth flow if no token is available
  // or with the tabs flow if a token is available
  initialRouteName: '(auth)',
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
    // Add any custom fonts here
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      // Hide the splash screen once fonts are loaded
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  // Return the root layout with the AuthProvider wrapping everything
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { authState } = useAuth();
  const [isLoading, setIsLoading] = React.useState(true);

  // Check for token on load
  useEffect(() => {
    const checkToken = async () => {
      try {
        // Set loading state while checking authentication
        setIsLoading(true);
        
        // Initialization code can be added here if needed
        
        // Finish loading
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading app:', error);
        setIsLoading(false);
      }
    };

    checkToken();
  }, []);

  // Show a loading screen while checking auth state
  if (isLoading) {
    return <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900" />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}>
        {/* If not authenticated, show auth screens */}
        {!authState?.authenticated ? (
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        ) : (
          // If authenticated, show the main app with tabs
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        )}
        
        {/* These screens are available regardless of authentication state */}
        <Stack.Screen name="study/[id]" options={{ headerShown: true, title: 'Study' }} />
        <Stack.Screen name="topic/[id]" options={{ headerShown: true, title: 'Topic' }} />
        <Stack.Screen name="subtopic/[id]" options={{ headerShown: true, title: 'Lesson' }} />
        <Stack.Screen name="test/[id]" options={{ headerShown: true, title: 'Quiz' }} />
        <Stack.Screen name="duel/[id]" options={{ headerShown: true, title: 'Duel' }} />
        <Stack.Screen name="profile/[id]" options={{ headerShown: true, title: 'Profile' }} />
      </Stack>
    </ThemeProvider>
  );
}
