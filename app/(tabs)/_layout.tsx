import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import '../../global.css';

// Auth Context Provider
import { AuthProvider } from '../../context/AuthContext';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on /modal works
  initialRouteName: '(auth)',
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    // Load any custom fonts here
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  return (
    <>
      {/* Keep the splash screen visible until the assets have loaded */}
      {!loaded && <LoadingScreen />}
      {loaded && <RootLayoutNav />}
    </>
  );
}

function LoadingScreen() {
  return null;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name='(auth)' options={{ headerShown: false }} />
          <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
          <Stack.Screen
            name='study/[id]'
            options={{ headerShown: true, title: 'Study' }}
          />
          <Stack.Screen
            name='topic/[id]'
            options={{ headerShown: true, title: 'Topic' }}
          />
          <Stack.Screen
            name='subtopic/[id]'
            options={{ headerShown: true, title: 'Lesson' }}
          />
          <Stack.Screen
            name='test/[id]'
            options={{ headerShown: true, title: 'Quiz' }}
          />
          <Stack.Screen
            name='duel/[id]'
            options={{ headerShown: true, title: 'Duel' }}
          />
          <Stack.Screen
            name='profile/[id]'
            options={{ headerShown: true, title: 'Profile' }}
          />
        </Stack>
      </ThemeProvider>
    </AuthProvider>
  );
}
