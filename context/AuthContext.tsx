import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';

// Import authentication services
import * as authService from '../src/api/authService';
import { User, AuthResponse } from '../src/types/models';

// Define AuthContext type
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (username: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
};

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signIn: async () => {},
  signUp: async () => {},
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
  }, []);

  // Handle routing based on authentication state
  useEffect(() => {
    if (!isLoading) {
      // Get the first segment to check if we're in the auth group
      // Use type assertion to avoid type issues
      const firstSegment = segments[0] as string;
      const inAuthGroup = firstSegment === '(auth)';

      if (!user && !inAuthGroup) {
        // Redirect to the sign-in page if not authenticated
        // Use type assertion to bypass TypeScript's strict route checking
        (router as any).replace('/(auth)/login');
      } else if (user && inAuthGroup) {
        // Redirect to the home page if authenticated
        // Use type assertion to bypass TypeScript's strict route checking
        (router as any).replace('/(tabs)');
      }
    }
  }, [user, segments, isLoading]);

  // Check if the user has a valid session
  async function checkUserSession() {
    try {
      const userData = await AsyncStorage.getItem('userData');

      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error checking user session:', error);
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
