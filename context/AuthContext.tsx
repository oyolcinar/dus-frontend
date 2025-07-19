import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import * as Linking from 'expo-linking';
import { Buffer } from 'buffer'; // Import Buffer for robust atob

// Import authentication services
import * as authService from '../src/api/authService';
import { User, AuthResponse } from '../src/types/models';

// --- HELPER FUNCTIONS ---
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

// Enhanced AuthContext type with new methods
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
  // Enhanced methods
  refreshSession: () => Promise<void>;
  validateSession: () => Promise<boolean>;
  isSessionValid: boolean;
};

// Create context with enhanced default values
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

// Provider component that wraps the app
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionValid, setIsSessionValid] = useState(false);
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
        console.log('No user, redirecting to login');
        (router as any).replace('/(auth)/login');
      } else if (user && inAuthGroup) {
        console.log('User authenticated, redirecting to tabs');
        (router as any).replace('/(tabs)');
      }
    }
  }, [user, segments, isLoading]);

  // Enhanced Deep Link Handler
  function setupDeepLinkHandler() {
    // Handle the initial URL for when the app is opened from a killed state
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('Initial URL detected:', url);
        handleUrl(url);
      }
    });

    // Listen for incoming links
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

          // Store tokens
          await AsyncStorage.setItem('userToken', access_token);
          await AsyncStorage.setItem('refreshToken', refresh_token);

          // Decode and process user data
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
            // Fallback user creation from token
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
          // Don't throw error, just log it
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

  // Enhanced session validation
  async function validateSession(): Promise<boolean> {
    try {
      const sessionStatus = await authService.validateSession();
      setIsSessionValid(sessionStatus.isValid);

      if (!sessionStatus.isValid) {
        console.log('Session validation failed:', sessionStatus.message);
        setUser(null);
        return false;
      }

      console.log('Session validation successful:', sessionStatus.message);
      return true;
    } catch (error) {
      console.error('Session validation error:', error);
      setIsSessionValid(false);
      setUser(null);
      return false;
    }
  }

  // Enhanced session refresh
  async function refreshSession(): Promise<void> {
    try {
      setIsLoading(true);
      console.log('Refreshing session via AuthContext...');

      // Check if session can be refreshed
      const sessionValid = await authService.checkAndRefreshSession();
      if (!sessionValid) {
        console.log('Session refresh failed, logging out');
        await signOut();
        throw new Error('Oturum yenilenemedi. Lütfen tekrar giriş yapın.');
      }

      // Re-fetch user data after successful session refresh
      const authStatus = await authService.getAuthStatus();
      if (authStatus.user) {
        setUser(authStatus.user);
        setIsSessionValid(true);
        console.log('Session refreshed successfully, user data updated');
      } else {
        throw new Error('Kullanıcı verisi alınamadı.');
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

  // Enhanced session check
  async function checkUserSession() {
    try {
      console.log('Checking user session...');
      const authStatus = await authService.getAuthStatus();

      if (authStatus.user && authStatus.token) {
        // Validate the token
        const tokenValid = await authService.isTokenValid();
        if (tokenValid) {
          setUser(authStatus.user);
          setIsSessionValid(true);
          console.log(
            'Valid session found for user:',
            authStatus.user.username,
          );
        } else {
          // Try to refresh if token is invalid
          console.log('Token invalid, attempting refresh...');
          try {
            await authService.refreshAuthToken();
            // Re-fetch user data after successful refresh
            const newAuthStatus = await authService.getAuthStatus();
            if (newAuthStatus.user) {
              setUser(newAuthStatus.user);
              setIsSessionValid(true);
              console.log('Session refreshed successfully during check');
            }
          } catch (refreshError) {
            console.error(
              'Token refresh failed during session check:',
              refreshError,
            );
            await authService.logout();
            setUser(null);
            setIsSessionValid(false);
          }
        }
      } else {
        console.log('No valid session found');
        setUser(null);
        setIsSessionValid(false);
      }
    } catch (error) {
      console.error('Error checking user session:', error);
      await authService.logout();
      setUser(null);
      setIsSessionValid(false);
    } finally {
      setIsLoading(false);
    }
  }

  // Enhanced sign in
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

  // Enhanced sign up
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

  // Enhanced OAuth functions with better error handling
  async function signInWithGoogle() {
    try {
      console.log('Starting Google OAuth flow...');
      await authService.signInWithGoogle();
      // Note: The deep link handler will handle the rest
    } catch (error) {
      console.error('Google OAuth error:', error);
      if (error instanceof Error && !error.message.includes('cancelled')) {
        throw new Error(
          'Google ile giriş başarısız oldu. Lütfen tekrar deneyin.',
        );
      }
      // Don't throw for user cancellation
    }
  }

  async function signInWithApple() {
    try {
      console.log('Starting Apple OAuth flow...');
      await authService.signInWithApple();
      // Note: The deep link handler will handle the rest
    } catch (error) {
      console.error('Apple OAuth error:', error);
      if (error instanceof Error && !error.message.includes('cancelled')) {
        throw new Error(
          'Apple ile giriş başarısız oldu. Lütfen tekrar deneyin.',
        );
      }
      // Don't throw for user cancellation
    }
  }

  async function signInWithFacebook() {
    try {
      console.log('Starting Facebook OAuth flow...');
      await authService.signInWithFacebook();
      // Note: The deep link handler will handle the rest
    } catch (error) {
      console.error('Facebook OAuth error:', error);
      if (error instanceof Error && !error.message.includes('cancelled')) {
        throw new Error(
          'Facebook ile giriş başarısız oldu. Lütfen tekrar deneyin.',
        );
      }
      // Don't throw for user cancellation
    }
  }

  // Enhanced sign out
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
      // Always clear user state even if logout fails
      setUser(null);
      setIsSessionValid(false);
    } finally {
      setIsLoading(false);
    }
  }

  // Debug function for development
  if (__DEV__) {
    // Expose debug function globally in development
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

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Enhanced hook for session management
export function useSession() {
  const { user, isLoading, isSessionValid, validateSession, refreshSession } =
    useAuth();

  const checkSession = async (): Promise<boolean> => {
    if (!user) return false;
    return await validateSession();
  };

  const ensureValidSession = async (): Promise<boolean> => {
    if (!user) return false;

    if (isSessionValid) return true;

    try {
      await refreshSession();
      return true;
    } catch (error) {
      console.error('Failed to ensure valid session:', error);
      return false;
    }
  };

  useEffect(() => {
    // Sync authToken whenever user state changes
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
    refreshSession,
  };
}
