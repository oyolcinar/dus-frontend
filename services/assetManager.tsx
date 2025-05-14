import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Asset } from 'expo-asset';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

// Define the assets that need to be preloaded for the app
const ASSET_IMAGES = [
  require('../assets/images/icon.png'),
  require('../assets/images/adaptive-icon.png'),
  require('../assets/images/splash-icon.png'),
  // Add more app-wide images here
];

// Fonts to preload
const FONTS = {
  'PlusJakartaSans-Regular': require('../assets/fonts/PlusJakartaSans-Regular.ttf'),
  'PlusJakartaSans-Medium': require('../assets/fonts/PlusJakartaSans-Medium.ttf'),
  'PlusJakartaSans-Bold': require('../assets/fonts/PlusJakartaSans-Bold.ttf'),
  // Add more fonts here
};

// Function to preload all app assets
export async function preloadAssets() {
  try {
    // Keep splash screen visible while we preload assets
    await SplashScreen.preventAutoHideAsync();

    // Preload images
    const imageAssets = ASSET_IMAGES.map((image) =>
      typeof image === 'string'
        ? image
        : Asset.fromModule(image).downloadAsync(),
    );

    // Load fonts
    const fontAssets = Font.loadAsync(FONTS);

    // Wait for everything to load
    await Promise.all([...imageAssets, fontAssets]);
  } catch (error) {
    console.error('Error preloading assets:', error);
  }
}

// Define asset manager context type
type AssetContextType = {
  loadScreenAssets: (assets: any[]) => Promise<void>;
  isLoading: boolean;
  preloadAsset: (asset: any) => Promise<void>;
};

// Create context with default values
const AssetContext = createContext<AssetContextType>({
  loadScreenAssets: async () => {},
  isLoading: false,
  preloadAsset: async () => {},
});

// Provider component
export function AssetProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);

  // Function to load assets for a specific screen
  const loadScreenAssets = async (assets: any[]) => {
    if (!assets || assets.length === 0) return;

    setIsLoading(true);
    try {
      const assetPromises = assets.map((asset) => {
        if (typeof asset === 'string') {
          return Asset.fromURI(asset).downloadAsync();
        } else {
          return Asset.fromModule(asset).downloadAsync();
        }
      });

      await Promise.all(assetPromises);
    } catch (error) {
      console.error('Error loading screen assets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to preload a single asset (for lazy loading)
  const preloadAsset = async (asset: any) => {
    try {
      if (typeof asset === 'string') {
        await Asset.fromURI(asset).downloadAsync();
      } else {
        await Asset.fromModule(asset).downloadAsync();
      }
    } catch (error) {
      console.error('Error preloading asset:', error);
    }
  };

  return (
    <AssetContext.Provider
      value={{
        loadScreenAssets,
        isLoading,
        preloadAsset,
      }}
    >
      {children}
    </AssetContext.Provider>
  );
}

// Custom hook to use the asset manager context
export function useAssets() {
  const context = useContext(AssetContext);

  if (!context) {
    throw new Error('useAssets must be used within an AssetProvider');
  }

  return context;
}
