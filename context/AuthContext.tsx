import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import * as Linking from 'expo-linking';

// Import authentication services
import * as authService from '../src/api/authService';
import { User, AuthResponse } from '../src/types/models';

// Define AuthContext type
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (username: string, email: string, password: string) => Promise<void>;
  signInWithOAuth: (authResponse: AuthResponse) => Promise<void>;
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
  signInWithOAuth: async () => {},
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

  // Check for stored credentials on initial load
  useEffect(() => {
    checkUserSession();
    setupDeepLinkHandler();
  }, []);

  // Handle routing based on authentication state
  useEffect(() => {
    if (!isLoading) {
      // Get the first segment to check if we're in the auth group
      const firstSegment = segments[0] as string;
      const inAuthGroup = firstSegment === '(auth)';

      if (!user && !inAuthGroup) {
        // Redirect to the sign-in page if not authenticated
        (router as any).replace('/(auth)/login');
      } else if (user && inAuthGroup) {
        // Redirect to the home page if authenticated
        (router as any).replace('/(tabs)');
      }
    }
  }, [user, segments, isLoading]);

  // Set up deep link handler for OAuth callbacks
  function setupDeepLinkHandler() {
    const subscription = Linking.addEventListener('url', async (event) => {
      const url = event.url;
      console.log('Deep link received in AuthContext:', url);

      // Check if it's an OAuth callback
      if (url.includes('/auth/success') || url.includes('/auth/error')) {
        try {
          await handleOAuthDeepLink(url);
        } catch (error) {
          console.error('OAuth deep link error in AuthContext:', error);
          // Could show a toast or alert here
        }
      }
    });

    return () => subscription?.remove();
  }

  // Handle OAuth deep link
  async function handleOAuthDeepLink(url: string) {
    try {
      setIsLoading(true);
      const authResponse = await authService.handleOAuthDeepLink(url);
      setUser(authResponse.user);
      console.log(
        'OAuth sign in successful via deep link:',
        authResponse.user.email,
      );
    } catch (error) {
      console.error('OAuth deep link handling error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  // Check if the user has a valid session
  async function checkUserSession() {
    try {
      const authStatus = await authService.getAuthStatus();

      if (authStatus.user && authStatus.token) {
        setUser(authStatus.user);
      }
    } catch (error) {
      console.error('Error checking user session:', error);
      // Clear potentially corrupted data
      await authService.logout();
    } finally {
      setIsLoading(false);
    }
  }

  // Sign in function using authService
  async function signIn(email: string, password: string) {
    try {
      setIsLoading(true);

      // Call the login API endpoint through authService
      const response = await authService.login(email, password);

      // API call saves token and user data to AsyncStorage, so we just need to update state
      setUser(response.user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  // Sign up function using authService
  async function signUp(username: string, email: string, password: string) {
    try {
      setIsLoading(true);

      // Call the register API endpoint through authService
      const response = await authService.register(username, email, password);

      // API call saves token and user data to AsyncStorage, so we just need to update state
      setUser(response.user);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  // Sign in with OAuth response (used by OAuth methods)
  async function signInWithOAuth(authResponse: AuthResponse) {
    try {
      setIsLoading(true);
      setUser(authResponse.user);
      console.log('OAuth sign in successful:', authResponse.user.email);
    } catch (error) {
      console.error('OAuth sign in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  // Google OAuth sign in
  async function signInWithGoogle() {
    try {
      setIsLoading(true);
      const authResponse = await authService.signInWithGoogle();
      setUser(authResponse.user);
      console.log('Google sign in successful:', authResponse.user.email);
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  // Apple OAuth sign in
  async function signInWithApple() {
    try {
      setIsLoading(true);
      const authResponse = await authService.signInWithApple();
      setUser(authResponse.user);
      console.log('Apple sign in successful:', authResponse.user.email);
    } catch (error) {
      console.error('Apple sign in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  // Facebook OAuth sign in
  async function signInWithFacebook() {
    try {
      setIsLoading(true);
      const authResponse = await authService.signInWithFacebook();
      setUser(authResponse.user);
      console.log('Facebook sign in successful:', authResponse.user.email);
    } catch (error) {
      console.error('Facebook sign in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  // Sign out function using authService
  async function signOut() {
    try {
      setIsLoading(true);

      // Call the logout API endpoint through authService
      await authService.logout();

      // authService.logout() already clears AsyncStorage
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      // Clear local state even if API call fails
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
        signInWithOAuth,
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
