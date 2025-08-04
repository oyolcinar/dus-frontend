import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import * as Linking from 'expo-linking';
import { Buffer } from 'buffer';

import * as authService from '../src/api/authService';
import { User, AuthResponse } from '../src/types/models';

const getParamsFromUrl = (url: string): Record<string, string> | null => {
  console.log('🔍 Parsing URL:', url);

  // Try hash fragment first (for Android/web)
  const fragment = url.split('#')[1];
  if (fragment) {
    console.log('📱 Using hash fragment parsing (Android)');
    const params = new URLSearchParams(fragment);
    const data: Record<string, string> = {};
    params.forEach((value, key) => {
      data[key] = value;
    });

    if (data.access_token) {
      console.log('✅ Found tokens in hash fragment');
      return data;
    }
  }

  // Try query parameters (for iOS)
  const queryString = url.split('?')[1];
  if (queryString) {
    // Remove hash if present
    const cleanQuery = queryString.split('#')[0];
    console.log('🍎 Using query parameter parsing (iOS)');

    const params = new URLSearchParams(cleanQuery);
    const data: Record<string, string> = {};
    params.forEach((value, key) => {
      data[key] = value;
    });

    if (data.access_token) {
      console.log('✅ Found tokens in query parameters');
      return data;
    }
  }

  console.log('❌ No tokens found in URL');
  return null;
};

function jwt_decode(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to decode JWT:', e);
    return null;
  }
}

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
  refreshSession: () => Promise<void>;
  validateSession: () => Promise<boolean>;
  isSessionValid: boolean;
};

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
  refreshSession: async () => {},
  validateSession: async () => false,
  isSessionValid: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionValid, setIsSessionValid] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    checkUserSession();
    const deepLinkSubscription = setupDeepLinkHandler();
    return () => deepLinkSubscription.remove();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const firstSegment = segments[0] as string;
      const inAuthGroup = firstSegment === '(auth)';

      if (!user && !inAuthGroup) {
        console.log('No user, redirecting to login');
        (router as any).replace('/(auth)/login');
      } else if (user && inAuthGroup) {
        console.log('User authenticated, redirecting to tabs');
        (router as any).replace('/(tabs)');
      }
    }
  }, [user, segments, isLoading]);

  function setupDeepLinkHandler() {
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('Initial URL detected:', url);
        handleUrl(url);
      }
    });

    const subscription = Linking.addEventListener('url', (event) => {
      console.log('Deep link event received:', event.url);
      handleUrl(event.url);
    });

    const handleUrl = async (url: string) => {
      console.log('Processing deep link in AuthContext:', url);
      const authParams = getParamsFromUrl(url);

      if (authParams) {
        console.log('Successfully parsed auth tokens from deep link.');
        setIsLoading(true);
        try {
          const { access_token, refresh_token } = authParams;

          await AsyncStorage.setItem('userToken', access_token);
          await AsyncStorage.setItem('authToken', access_token);
          if (refresh_token) {
            await AsyncStorage.setItem('refreshToken', refresh_token);
          }

          const decodedToken = jwt_decode(access_token);
          const userFromToken = decodedToken?.user_metadata;

          if (userFromToken) {
            const normalizedUser = {
              id: userFromToken.id || userFromToken.sub,
              userId:
                userFromToken.userId || userFromToken.id || userFromToken.sub,
              username: userFromToken.username || userFromToken.name || '',
              email: userFromToken.email || '',
              dateRegistered:
                userFromToken.dateRegistered || new Date().toISOString(),
              role: userFromToken.role || 'student',
              subscriptionType: userFromToken.subscriptionType || 'free',
              totalDuels: userFromToken.totalDuels || 0,
              duelsWon: userFromToken.duelsWon || 0,
              duelsLost: userFromToken.duelsLost || 0,
              longestLosingStreak: userFromToken.longestLosingStreak || 0,
              currentLosingStreak: userFromToken.currentLosingStreak || 0,
              totalStudyTime: userFromToken.totalStudyTime || 0,
              permissions: userFromToken.permissions || [],
              oauthProvider: userFromToken.oauthProvider || null,
              isOAuthUser: true,
            };

            await AsyncStorage.setItem(
              'userData',
              JSON.stringify(normalizedUser),
            );
            setUser(normalizedUser as User);
            setIsSessionValid(true);
            console.log('OAuth session established successfully');
          } else {
            const fallbackUser = {
              id: decodedToken.sub,
              userId: decodedToken.sub,
              username: decodedToken.email?.split('@')[0] || 'User',
              email: decodedToken.email || '',
              dateRegistered: new Date().toISOString(),
              role: 'student',
              subscriptionType: 'free',
              totalDuels: 0,
              duelsWon: 0,
              duelsLost: 0,
              longestLosingStreak: 0,
              currentLosingStreak: 0,
              totalStudyTime: 0,
              permissions: [],
              oauthProvider: 'unknown',
              isOAuthUser: true,
            };

            await AsyncStorage.setItem(
              'userData',
              JSON.stringify(fallbackUser),
            );
            setUser(fallbackUser as User);
            setIsSessionValid(true);
            console.log('OAuth session established with fallback user data');
          }
        } catch (error) {
          console.error('Error handling OAuth deep link:', error);
          setIsSessionValid(false);
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

  // SIMPLIFIED: Session validation for existing tokens
  async function validateSession(): Promise<boolean> {
    try {
      const sessionStatus = await authService.validateSession();
      setIsSessionValid(sessionStatus.isValid);

      if (!sessionStatus.isValid) {
        console.log('Session validation failed:', sessionStatus.message);
        setUser(null);
        return false;
      }

      console.log('Session validation successful');
      return true;
    } catch (error) {
      console.error('Session validation error:', error);
      setIsSessionValid(false);
      setUser(null);
      return false;
    }
  }

  // SIMPLIFIED: Just check for existing session data
  async function refreshSession(): Promise<void> {
    try {
      setIsLoading(true);
      console.log('Refreshing session via AuthContext...');

      // Just check if we have valid stored data
      const authStatus = await authService.getAuthStatus();
      if (authStatus.user && authStatus.token) {
        setUser(authStatus.user);
        setIsSessionValid(true);
        console.log('Session refreshed from stored data');
      } else {
        throw new Error('Kullanıcı verisi bulunamadı.');
      }
    } catch (error) {
      console.error('Session refresh failed:', error);
      setIsSessionValid(false);
      await signOut();
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  // SIMPLIFIED: Session check - just load from storage
  async function checkUserSession() {
    try {
      console.log('Checking user session...');
      const authStatus = await authService.getAuthStatus();

      if (authStatus.user && authStatus.token) {
        // Don't validate token on startup - just load stored data
        // API calls will handle invalid tokens when they occur
        setUser(authStatus.user);
        setIsSessionValid(true);
        console.log(
          'Session loaded from storage for user:',
          authStatus.user.username,
        );
      } else {
        console.log('No stored session found');
        setUser(null);
        setIsSessionValid(false);
      }
    } catch (error) {
      console.error('Error checking user session:', error);
      setUser(null);
      setIsSessionValid(false);
    } finally {
      setIsLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    try {
      setIsLoading(true);
      console.log('Attempting login for:', email);
      const response = await authService.login(email, password);
      setUser(response.user);
      setIsSessionValid(true);
      console.log('Login successful for user:', response.user.username);
    } catch (error) {
      console.error('Login error:', error);
      setIsSessionValid(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function signUp(username: string, email: string, password: string) {
    try {
      setIsLoading(true);
      console.log('Attempting registration for:', email);
      const response = await authService.register(username, email, password);
      setUser(response.user);
      setIsSessionValid(true);
      console.log('Registration successful for user:', response.user.username);
    } catch (error) {
      console.error('Registration error:', error);
      setIsSessionValid(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function signInWithGoogle() {
    try {
      console.log('Starting Google OAuth flow...');
      await authService.signInWithGoogle();
    } catch (error) {
      console.error('Google OAuth error:', error);
      if (error instanceof Error && !error.message.includes('cancelled')) {
        throw new Error(
          'Google ile giriş başarısız oldu. Lütfen tekrar deneyin.',
        );
      }
    }
  }

  async function signInWithApple() {
    try {
      console.log('Starting Apple OAuth flow...');
      await authService.signInWithApple();
    } catch (error) {
      console.error('Apple OAuth error:', error);
      if (error instanceof Error && !error.message.includes('cancelled')) {
        throw new Error(
          'Apple ile giriş başarısız oldu. Lütfen tekrar deneyin.',
        );
      }
    }
  }

  async function signInWithFacebook() {
    try {
      console.log('Starting Facebook OAuth flow...');
      await authService.signInWithFacebook();
    } catch (error) {
      console.error('Facebook OAuth error:', error);
      if (error instanceof Error && !error.message.includes('cancelled')) {
        throw new Error(
          'Facebook ile giriş başarısız oldu. Lütfen tekrar deneyin.',
        );
      }
    }
  }

  async function signOut() {
    try {
      setIsLoading(true);
      console.log('Signing out user...');
      await authService.logout();
      setUser(null);
      setIsSessionValid(false);
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      setUser(null);
      setIsSessionValid(false);
    } finally {
      setIsLoading(false);
    }
  }

  if (__DEV__) {
    (global as any).debugAuth = async () => {
      await authService.debugAuthState();
      console.log('=== AUTH CONTEXT DEBUG ===');
      console.log('User:', user ? `${user.username} (${user.email})` : 'None');
      console.log('IsLoading:', isLoading);
      console.log('IsAuthenticated:', !!user);
      console.log('IsSessionValid:', isSessionValid);
      console.log('========================');
    };
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
        refreshSession,
        validateSession,
        isSessionValid,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// SIMPLIFIED: Session management hook
export function useSession() {
  const { user, isLoading, isSessionValid, validateSession } = useAuth();

  const checkSession = async (): Promise<boolean> => {
    if (!user) return false;
    return await validateSession();
  };

  const ensureValidSession = async (): Promise<boolean> => {
    if (!user) return false;
    // Just assume session is valid if user exists
    // API calls will handle invalid tokens
    return true;
  };

  useEffect(() => {
    const syncAuthToken = async () => {
      try {
        if (user && isSessionValid) {
          const userToken = await AsyncStorage.getItem('userToken');
          if (userToken) {
            await AsyncStorage.setItem('authToken', userToken);
            console.log('Auth token synced for socket service');
          }
        } else {
          await AsyncStorage.removeItem('authToken');
          console.log('Auth token cleared');
        }
      } catch (error) {
        console.error('Error syncing auth token:', error);
      }
    };

    syncAuthToken();
  }, [user, isSessionValid]);

  return {
    user,
    isLoading,
    isSessionValid,
    checkSession,
    ensureValidSession,
  };
}
