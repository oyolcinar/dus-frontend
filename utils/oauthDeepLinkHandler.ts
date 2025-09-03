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

export async function handleOAuthDeepLink(url: string): Promise<boolean> {
  try {
    console.log('🔗 Handling OAuth deep link:', url);

    const parsedUrl = parseDeepLinkUrl(url);
    const queryParams = parsedUrl.queryParams;

    if (!queryParams?.code && !queryParams?.error) {
      console.log('🔗 Not an OAuth callback URL, ignoring');
      return false;
    }

    if (queryParams.error) {
      const errorDescription =
        queryParams.error_description || queryParams.error;
      console.error('❌ OAuth error from deep link:', errorDescription);

      const store = useAppStore.getState();
      store.setAuthError(`OAuth authentication failed: ${errorDescription}`);

      router.replace('/(auth)/login');
      return true;
    }

    if (queryParams.code) {
      console.log('✅ OAuth authorization code received via deep link');

      try {
        const store = useAppStore.getState();
        await store.handleOAuthCallback(queryParams.code);

        console.log('✅ OAuth callback processed successfully');

        return true;
      } catch (callbackError) {
        console.error('❌ OAuth callback processing failed:', callbackError);

        const store = useAppStore.getState();
        const errorMessage =
          callbackError instanceof Error
            ? callbackError.message
            : 'OAuth authentication failed';
        store.setAuthError(errorMessage);

        router.replace('/(auth)/login');
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('❌ OAuth deep link handling failed:', error);

    const store = useAppStore.getState();
    store.setAuthError('OAuth authentication failed');

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

export async function handleDeepLink(url: string): Promise<boolean> {
  console.log('🔗 Processing deep link:', url);

  if (isOAuthDeepLink(url)) {
    return await handleOAuthDeepLink(url);
  }
  console.log('🔗 Non-OAuth deep link, handling normally');

  return false;
}

export function validateDeepLinkFormat(url: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  try {
    new URL(url);
  } catch (error) {
    errors.push('Invalid URL format');
  }

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
