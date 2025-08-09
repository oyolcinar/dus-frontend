import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import * as Linking from 'expo-linking';

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

// 🚀 PERFORMANCE FIX: Add caching for session validation
const SESSION_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes cache
let sessionValidationCache: { isValid: boolean; timestamp: number } | null =
  null;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionValid, setIsSessionValid] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  // 🚀 PERFORMANCE FIX: Use ref to prevent unnecessary effect triggers
  const lastValidationTime = useRef(0);

  useEffect(() => {
    checkUserSession();
    const deepLinkSubscription = setupDeepLinkHandler();

    // 🚀 PERFORMANCE FIX: Reduce session check frequency and make it less aggressive
    const sessionCheckInterval = setInterval(
      () => {
        // Only check if we haven't validated recently AND user is authenticated
        const now = Date.now();
        const timeSinceLastValidation = now - lastValidationTime.current;

        if (
          user &&
          isSessionValid &&
          timeSinceLastValidation > SESSION_CACHE_DURATION
        ) {
          console.log('🕐 Periodic session check (cached)');
          validateSessionCached().catch((error) => {
            console.warn('Periodic session validation failed:', error);
          });
        }
      },
      10 * 60 * 1000, // 🚀 PERFORMANCE FIX: Increased to 10 minutes instead of 5
    );

    return () => {
      deepLinkSubscription.remove();
      clearInterval(sessionCheckInterval);
    };
  }, []); // 🚀 PERFORMANCE FIX: Removed dependencies to prevent unnecessary reruns

  // 🚀 PERFORMANCE FIX: Navigation effect - runs on user/loading changes
  useEffect(() => {
    console.log('🔄 Navigation effect triggered:', {
      isLoading,
      user: user?.username || 'null',
      segments: segments.join('/') || 'root',
      isAuthenticated: !!user,
    });

    if (!isLoading) {
      const firstSegment = segments[0] as string;
      const inAuthGroup = firstSegment === '(auth)';

      console.log('🎯 Navigation decision:', {
        firstSegment,
        inAuthGroup,
        hasUser: !!user,
        shouldRedirectToTabs: user && inAuthGroup,
        shouldRedirectToLogin: !user && !inAuthGroup,
      });

      // Only redirect if we're in the wrong place
      if (!user && !inAuthGroup) {
        console.log('🔀 No user, redirecting to login');
        router.replace('/(auth)/login');
      } else if (user && inAuthGroup) {
        console.log('🔀 User authenticated, redirecting to tabs');
        router.replace('/(tabs)');
      } else {
        console.log('✅ User is in correct location, no redirect needed');
      }
    }
  }, [user, isLoading, segments, router]); // 🚀 FIXED: Include router dependency

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

      if (authParams && authParams.code) {
        console.log('OAuth callback detected, exchanging code');
        setIsLoading(true);
        try {
          // Call your backend to handle the OAuth callback
          const response = await authService.handleOAuthCallback(
            authParams.code,
          );
          setUser(response.user);
          setIsSessionValid(true);
          console.log('OAuth login successful via backend');
        } catch (error) {
          console.error('OAuth callback error:', error);
          setIsSessionValid(false);
        } finally {
          setIsLoading(false);
        }
      }
    };

    return subscription;
  }

  // 🚀 PERFORMANCE FIX: Add cached session validation
  async function validateSessionCached(): Promise<boolean> {
    const now = Date.now();

    // Return cached result if it's still valid
    if (
      sessionValidationCache &&
      now - sessionValidationCache.timestamp < SESSION_CACHE_DURATION
    ) {
      console.log('✅ Using cached session validation result');
      return sessionValidationCache.isValid;
    }

    // Make fresh validation call
    const isValid = await validateSession();

    // Cache the result
    sessionValidationCache = {
      isValid,
      timestamp: now,
    };

    lastValidationTime.current = now;
    return isValid;
  }

  // Enhanced session validation with backend
  async function validateSession(): Promise<boolean> {
    try {
      console.log('🔐 Validating session with backend...');
      const sessionStatus = await authService.validateSession();
      setIsSessionValid(sessionStatus.isValid);

      if (!sessionStatus.isValid) {
        console.log('Session validation failed:', sessionStatus.message);
        setUser(null);
        // 🚀 PERFORMANCE FIX: Clear cache on invalid session
        sessionValidationCache = null;
        return false;
      }

      console.log('✅ Session validation successful');
      return true;
    } catch (error) {
      console.error('Session validation error:', error);
      setIsSessionValid(false);
      setUser(null);
      // 🚀 PERFORMANCE FIX: Clear cache on error
      sessionValidationCache = null;
      return false;
    }
  }

  // Enhanced session refresh via backend
  async function refreshSession(): Promise<void> {
    try {
      setIsLoading(true);
      console.log('Refreshing session via backend...');

      const refreshedSession = await authService.refreshAuthToken();

      // Get updated user data after refresh
      const authStatus = await authService.getAuthStatus();
      if (authStatus.user && authStatus.token) {
        setUser(authStatus.user);
        setIsSessionValid(true);
        // 🚀 PERFORMANCE FIX: Clear cache after refresh
        sessionValidationCache = null;
        console.log('Session refreshed successfully via backend');
      } else {
        throw new Error('No user data after refresh');
      }
    } catch (error) {
      console.error('Session refresh failed:', error);
      setIsSessionValid(false);
      // 🚀 PERFORMANCE FIX: Clear cache on error
      sessionValidationCache = null;
      await signOut();
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  // Enhanced session check with backend validation
  async function checkUserSession() {
    try {
      console.log('🔍 Checking user session...');
      const authStatus = await authService.getAuthStatus();

      if (authStatus.user && authStatus.token) {
        // 🚀 PERFORMANCE FIX: Use cached validation for initial check
        try {
          const isValid = await validateSessionCached();
          if (isValid) {
            setUser(authStatus.user);
            setIsSessionValid(true);
            console.log(
              '✅ Session loaded and validated for user:',
              authStatus.user.username,
            );
          } else {
            // Token exists but is invalid, try to refresh
            console.log('🔄 Token invalid, attempting refresh...');
            await refreshSession();
          }
        } catch (validationError) {
          console.warn(
            'Session validation failed, clearing session:',
            validationError,
          );
          setUser(null);
          setIsSessionValid(false);
          await authService.logout();
        }
      } else {
        console.log('❌ No stored session found');
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
      console.log('🔑 Attempting login via backend for:', email);

      const response = await authService.login(email, password);
      console.log('🎉 Login API response received:', {
        hasUser: !!response.user,
        username: response.user?.username,
        hasToken: !!response.token,
      });

      setUser(response.user);
      setIsSessionValid(true);
      // 🚀 PERFORMANCE FIX: Clear cache on new login
      sessionValidationCache = null;

      console.log('✅ Login successful - state updated:', {
        user: response.user.username,
        isSessionValid: true,
      });

      // 🔀 Force redirect after successful login (backup)
      setTimeout(() => {
        console.log('🔀 Forcing redirect to tabs after login');
        router.replace('/(tabs)');
      }, 100);
    } catch (error) {
      console.error('❌ Login error:', error);
      setIsSessionValid(false);
      throw error;
    } finally {
      setIsLoading(false);
      console.log('🏁 Login process complete, isLoading set to false');
    }
  }

  async function signUp(username: string, email: string, password: string) {
    try {
      setIsLoading(true);
      console.log('Attempting registration via backend for:', email);
      const response = await authService.register(username, email, password);
      setUser(response.user);
      setIsSessionValid(true);
      // 🚀 PERFORMANCE FIX: Clear cache on new signup
      sessionValidationCache = null;
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
      console.log('Starting Google OAuth flow via backend...');
      await authService.signInWithGoogle();
      // OAuth flow will continue via deep link handling
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
      console.log('Starting Apple OAuth flow via backend...');
      await authService.signInWithApple();
      // OAuth flow will continue via deep link handling
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
      console.log('Starting Facebook OAuth flow via backend...');
      await authService.signInWithFacebook();
      // OAuth flow will continue via deep link handling
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
      console.log('Signing out user via backend...');
      await authService.logout();
      setUser(null);
      setIsSessionValid(false);
      // 🚀 PERFORMANCE FIX: Clear cache on logout
      sessionValidationCache = null;
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      // Still clear local state even if backend logout fails
      setUser(null);
      setIsSessionValid(false);
      sessionValidationCache = null;
    } finally {
      setIsLoading(false);
    }
  }

  // Debug function for development
  if (__DEV__) {
    (global as any).debugAuth = async () => {
      await authService.debugAuthState();
      console.log('=== AUTH CONTEXT DEBUG ===');
      console.log('User:', user ? `${user.username} (${user.email})` : 'None');
      console.log('IsLoading:', isLoading);
      console.log('IsAuthenticated:', !!user);
      console.log('IsSessionValid:', isSessionValid);
      console.log('Cache:', sessionValidationCache);
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
        validateSession: validateSessionCached, // 🚀 PERFORMANCE FIX: Use cached version
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

// Enhanced session management hook with backend integration
export function useSession() {
  const { user, isLoading, isSessionValid, validateSession, refreshSession } =
    useAuth();

  const checkSession = async (): Promise<boolean> => {
    if (!user) return false;
    return await validateSession();
  };

  const ensureValidSession = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      // First check if current session is valid (now cached!)
      const isValid = await validateSession();
      if (isValid) return true;

      // If not valid, try to refresh
      await refreshSession();
      return true;
    } catch (error) {
      console.error('Failed to ensure valid session:', error);
      return false;
    }
  };

  return {
    user,
    isLoading,
    isSessionValid,
    checkSession,
    ensureValidSession,
  };
}
