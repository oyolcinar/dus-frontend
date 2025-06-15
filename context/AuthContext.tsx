import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import * as Linking from 'expo-linking';
import { Buffer } from 'buffer'; // Import Buffer for robust atob

// Import authentication services
import * as authService from '../src/api/authService';
import { User, AuthResponse } from '../src/types/models';

// --- NEW HELPER FUNCTION: To parse URL fragments from OAuth callbacks ---
const getParamsFromUrl = (url: string): Record<string, string> | null => {
  const fragment = url.split('#')[1];
  if (!fragment) {
    return null;
  }

  const params = new URLSearchParams(fragment);
  const data: Record<string, string> = {};
  params.forEach((value, key) => {
    data[key] = value;
  });

  if (data.access_token && data.refresh_token) {
    return data;
  }

  return null;
};

// --- NEW HELPER FUNCTION: To decode JWT payloads safely ---
function jwt_decode(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    // Use Buffer for cross-platform base64 decoding
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to decode JWT:', e);
    return null;
  }
}

// Define AuthContext type
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (username: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
};

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signIn: async () => {},
  signUp: async () => {},
  signInWithGoogle: async () => {},
  signInWithApple: async () => {},
  signInWithFacebook: async () => {},
  signOut: async () => {},
  isAuthenticated: false,
});

// Provider component that wraps the app
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    checkUserSession();
    const deepLinkSubscription = setupDeepLinkHandler();
    // Cleanup on unmount
    return () => deepLinkSubscription.remove();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const firstSegment = segments[0] as string;
      const inAuthGroup = firstSegment === '(auth)';

      if (!user && !inAuthGroup) {
        (router as any).replace('/(auth)/login');
      } else if (user && inAuthGroup) {
        (router as any).replace('/(tabs)');
      }
    }
  }, [user, segments, isLoading]);

  // --- REWRITTEN Deep Link Handler ---
  function setupDeepLinkHandler() {
    // Also handle the initial URL for when the app is opened from a killed state
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleUrl(url);
      }
    });

    // Listen for incoming links
    const subscription = Linking.addEventListener('url', (event) => {
      handleUrl(event.url);
    });

    const handleUrl = async (url: string) => {
      console.log('Deep link received in AuthContext:', url);
      const authParams = getParamsFromUrl(url);

      if (authParams) {
        console.log('Successfully parsed auth tokens from deep link.');
        setIsLoading(true);
        try {
          const { access_token, refresh_token } = authParams;
          await AsyncStorage.setItem('userToken', access_token);
          await AsyncStorage.setItem('refreshToken', refresh_token);

          const decodedToken = jwt_decode(access_token);
          const userFromToken = decodedToken?.user_metadata;

          if (userFromToken) {
            await AsyncStorage.setItem(
              'userData',
              JSON.stringify(userFromToken),
            );
            setUser(userFromToken as User);
            console.log('Session updated successfully from OAuth deep link.');
          } else {
            setUser({
              id: decodedToken.sub,
              email: decodedToken.email,
            } as User);
          }
        } catch (error) {
          console.error('Error handling OAuth deep link:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        console.log(
          'Deep link received, but it was not a valid OAuth callback.',
        );
      }
    };

    return subscription;
  }

  // DELETED: The old `handleOAuthDeepLink` function was here and has been removed.

  async function checkUserSession() {
    try {
      const authStatus = await authService.getAuthStatus();
      if (authStatus.user && authStatus.token) {
        setUser(authStatus.user);
      }
    } catch (error) {
      console.error('Error checking user session:', error);
      await authService.logout();
    } finally {
      setIsLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    try {
      setIsLoading(true);
      const response = await authService.login(email, password);
      setUser(response.user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function signUp(username: string, email: string, password: string) {
    try {
      setIsLoading(true);
      const response = await authService.register(username, email, password);
      setUser(response.user);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  // --- SIMPLIFIED OAUTH FUNCTIONS ---
  // They now only *start* the flow. The deep link handler does the rest.

  async function signInWithGoogle() {
    try {
      await authService.signInWithGoogle();
    } catch (error) {
      console.error('google OAuth error:', error);
      throw error;
    }
  }

  async function signInWithApple() {
    try {
      await authService.signInWithApple();
    } catch (error) {
      console.error('apple OAuth error:', error);
      throw error;
    }
  }

  async function signInWithFacebook() {
    try {
      await authService.signInWithFacebook();
    } catch (error) {
      console.error('Facebook sign in error:', error);
      throw error;
    }
  }

  async function signOut() {
    try {
      setIsLoading(true);
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithApple,
        signInWithFacebook,
        signOut,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
