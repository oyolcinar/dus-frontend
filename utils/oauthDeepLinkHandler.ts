// src/utils/oauthDeepLinkHandler.ts
import { router } from 'expo-router';
import { useAppStore } from '../stores/appStore';

interface DeepLinkUrl {
  url: string;
  host?: string;
  hostname?: string;
  path?: string;
  queryParams: Record<string, string>;
}

// Parse deep link URL and extract query parameters
function parseDeepLinkUrl(url: string): DeepLinkUrl {
  const queryParams: Record<string, string> = {};

  try {
    const urlObj = new URL(url);

    urlObj.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    return {
      url,
      host: urlObj.host || undefined,
      hostname: urlObj.hostname || undefined,
      path: urlObj.pathname || undefined,
      queryParams,
    };
  } catch (error) {
    console.warn('Failed to parse deep link URL:', error);
    return {
      url,
      queryParams: {},
      host: undefined,
      hostname: undefined,
      path: undefined,
    };
  }
}

// Handle OAuth callback from deep link
export async function handleOAuthDeepLink(url: string): Promise<boolean> {
  try {
    console.log('🔗 Handling OAuth deep link:', url);

    const parsedUrl = parseDeepLinkUrl(url);
    const queryParams = parsedUrl.queryParams;

    // Check if this is an OAuth callback
    if (!queryParams?.code && !queryParams?.error) {
      console.log('🔗 Not an OAuth callback URL, ignoring');
      return false;
    }

    // Handle OAuth error
    if (queryParams.error) {
      const errorDescription =
        queryParams.error_description || queryParams.error;
      console.error('❌ OAuth error from deep link:', errorDescription);

      // Update auth store with error
      const store = useAppStore.getState();
      store.setAuthError(`OAuth authentication failed: ${errorDescription}`);

      // Navigate to login screen
      router.replace('/(auth)/login');
      return true;
    }

    // Handle OAuth success
    if (queryParams.code) {
      console.log('✅ OAuth authorization code received via deep link');

      try {
        // Use authService to handle the OAuth callback
        const store = useAppStore.getState();
        await store.handleOAuthCallback(queryParams.code);

        console.log('✅ OAuth callback processed successfully');

        // Navigate to main app (this will be handled by auth state change)
        // The auth store will automatically redirect based on authentication state
        return true;
      } catch (callbackError) {
        console.error('❌ OAuth callback processing failed:', callbackError);

        const store = useAppStore.getState();
        const errorMessage =
          callbackError instanceof Error
            ? callbackError.message
            : 'OAuth authentication failed';
        store.setAuthError(errorMessage);

        // Navigate to login screen
        router.replace('/(auth)/login');
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('❌ OAuth deep link handling failed:', error);

    const store = useAppStore.getState();
    store.setAuthError('OAuth authentication failed');

    // Navigate to login screen
    router.replace('/(auth)/login');
    return true;
  }
}

// Check if URL is an OAuth deep link
export function isOAuthDeepLink(url: string): boolean {
  try {
    const parsedUrl = parseDeepLinkUrl(url);
    const queryParams = parsedUrl.queryParams;
    const path = parsedUrl.path;

    // Check for OAuth callback indicators
    return !!(
      queryParams?.code ||
      queryParams?.error ||
      path?.includes('/oauth/') ||
      path?.includes('/auth/callback')
    );
  } catch (error) {
    console.warn('Failed to check if URL is OAuth deep link:', error);
    return false;
  }
}

// Extract OAuth provider from deep link
export function getOAuthProviderFromDeepLink(
  url: string,
): 'google' | 'apple' | 'facebook' | null {
  try {
    const parsedUrl = parseDeepLinkUrl(url);
    const queryParams = parsedUrl.queryParams;
    const path = parsedUrl.path;

    // Check query params first
    if (queryParams?.provider) {
      const provider = queryParams.provider.toLowerCase();
      if (['google', 'apple', 'facebook'].includes(provider)) {
        return provider as 'google' | 'apple' | 'facebook';
      }
    }

    // Check path
    if (path) {
      if (path.includes('google')) return 'google';
      if (path.includes('apple')) return 'apple';
      if (path.includes('facebook')) return 'facebook';
    }

    return null;
  } catch (error) {
    console.warn('Failed to extract OAuth provider from deep link:', error);
    return null;
  }
}

// Handle general deep links (use in your main deep link handler)
export async function handleDeepLink(url: string): Promise<boolean> {
  console.log('🔗 Processing deep link:', url);

  // Check if it's an OAuth deep link
  if (isOAuthDeepLink(url)) {
    return await handleOAuthDeepLink(url);
  }

  // Handle other deep links here
  console.log('🔗 Non-OAuth deep link, handling normally');

  // Return false to indicate this handler didn't process the link
  return false;
}

// Helper to validate deep link format
export function validateDeepLinkFormat(url: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  try {
    // Check if URL is valid
    new URL(url);
  } catch (error) {
    errors.push('Invalid URL format');
  }

  // Check scheme
  const expectedSchemes = ['com.dortac.dusfrontend', 'dus-app', 'https'];
  const hasValidScheme = expectedSchemes.some((scheme) =>
    url.startsWith(scheme),
  );

  if (!hasValidScheme) {
    errors.push(
      `Invalid URL scheme. Expected one of: ${expectedSchemes.join(', ')}`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Debug helper for development
export function debugDeepLink(url: string): void {
  if (__DEV__) {
    console.log('=== DEEP LINK DEBUG ===');
    console.log('URL:', url);

    const validation = validateDeepLinkFormat(url);
    console.log('Valid:', validation.isValid);
    if (!validation.isValid) {
      console.log('Errors:', validation.errors);
    }

    const isOAuth = isOAuthDeepLink(url);
    console.log('Is OAuth:', isOAuth);

    if (isOAuth) {
      const provider = getOAuthProviderFromDeepLink(url);
      console.log('OAuth Provider:', provider);

      const parsed = parseDeepLinkUrl(url);
      console.log('Query Params:', parsed.queryParams);
    }

    console.log('=====================');
  }
}

export default {
  handleDeepLink,
  handleOAuthDeepLink,
  isOAuthDeepLink,
  getOAuthProviderFromDeepLink,
  validateDeepLinkFormat,
  debugDeepLink,
};
