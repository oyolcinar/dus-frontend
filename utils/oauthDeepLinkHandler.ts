import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { useAppStore } from '../stores/appStore';
import { processOAuthCallback } from '../src/api/authService';

/**
 * FIXED: Enhanced URL parameter parser that handles both ? and # parameters
 */
function parseUrlParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};

  try {
    // Handle both query parameters and hash fragments
    const urlObj = new URL(url.replace(/^[^:]+:\/\//, 'https://'));

    // Parse query parameters
    urlObj.searchParams.forEach((value, key) => {
      params[key] = decodeURIComponent(value);
    });

    // Parse hash fragment if present
    if (urlObj.hash) {
      const hashParams = urlObj.hash.substring(1).split('&');
      for (const param of hashParams) {
        const [key, value] = param.split('=');
        if (key && value) {
          params[decodeURIComponent(key)] = decodeURIComponent(value);
        }
      }
    }
  } catch (error) {
    console.warn(
      'Failed to parse URL with URL constructor, using fallback:',
      error,
    );

    // Fallback: manual parsing
    const parts = url.split(/[?#]/);
    for (let i = 1; i < parts.length; i++) {
      const pairs = parts[i].split('&');
      for (const pair of pairs) {
        const [key, value] = pair.split('=');
        if (key && value) {
          params[decodeURIComponent(key)] = decodeURIComponent(value);
        }
      }
    }
  }

  return params;
}

/**
 * FIXED: Main deep link handler with proper error handling and state management
 */
export async function handleDeepLink(url: string) {
  console.log('🔗 Deep Link Handler received URL:', url);

  // Check if this is an OAuth callback URL
  if (!url || !url.includes('oauth-callback')) {
    console.log('Deep link is not an OAuth callback, ignoring.');
    return;
  }

  const { setUser, setAuthError, setAuthLoading, signOut } =
    useAppStore.getState();

  try {
    setAuthLoading(true);
    setAuthError(null);

    console.log('🔄 Processing OAuth callback...');

    const params = parseUrlParams(url);
    console.log('📋 Parsed parameters:', params);

    // Check for errors first
    if (params.error) {
      const errorMessage = params.error_description || params.error;
      console.error('❌ OAuth error from backend:', errorMessage);
      throw new Error(`OAuth failed: ${errorMessage}`);
    }

    // Validate required parameters
    if (!params.access_token) {
      console.error('❌ No access token in OAuth callback');
      throw new Error('OAuth process did not return an access token.');
    }

    console.log('✅ Access token found, processing callback...');

    // Process the OAuth callback using the auth service
    const authResponse = await processOAuthCallback(params);

    if (!authResponse.user) {
      throw new Error('Failed to get user data from OAuth callback.');
    }

    console.log(
      `✅ OAuth login successful for user: ${authResponse.user.email}`,
    );

    // Update global auth state
    setUser(authResponse.user);

    // Navigate to main app
    console.log('🔀 Navigating to main app...');
    router.replace('/(tabs)');
  } catch (error: any) {
    console.error('❌ OAuth callback error:', error);

    // Clear any partial auth state
    await signOut();

    // Set user-friendly error message
    const friendlyMessage = error.message?.includes('OAuth failed:')
      ? error.message
      : 'Authentication failed. Please try again.';

    setAuthError(friendlyMessage);

    // Navigate back to login
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)/login');
    }
  } finally {
    setAuthLoading(false);
  }
}

/**
 * FIXED: Alternative handler for Expo's Linking.parse method
 */
export function handleDeepLinkWithExpoLinking(url: string) {
  console.log('🔗 Handling deep link with Expo Linking:', url);

  try {
    const { hostname, path, queryParams } = Linking.parse(url);

    console.log('📋 Parsed with Expo Linking:', {
      hostname,
      path,
      queryParams,
    });

    // Check if this is an OAuth callback
    if (path === '/oauth-callback' || hostname === 'oauth-callback') {
      const params = queryParams || {};

      // Convert to string record for consistency
      const stringParams: Record<string, string> = {};
      Object.entries(params).forEach(([key, value]) => {
        stringParams[key] = String(value);
      });

      // Use the main handler with processed parameters
      const reconstructedUrl = `dus-app://oauth-callback?${new URLSearchParams(stringParams).toString()}`;
      return handleDeepLink(reconstructedUrl);
    }
  } catch (error) {
    console.error('❌ Error parsing deep link with Expo Linking:', error);
    // Fall back to main handler
    return handleDeepLink(url);
  }
}
