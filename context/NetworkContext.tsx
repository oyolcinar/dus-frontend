import React, { createContext, useContext, useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

// Define Network Context type
type NetworkContextType = {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  connectionType: string | null;
  connectionQuality: 'unknown' | 'poor' | 'good' | 'excellent';
  checkConnection: () => Promise<boolean>;
};

// Create context with default values
export const NetworkContext = createContext<NetworkContextType>({
  isConnected: null,
  isInternetReachable: null,
  connectionType: null,
  connectionQuality: 'unknown',
  checkConnection: async () => false,
});

// Provider component
export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [networkState, setNetworkState] = useState<{
    isConnected: boolean | null;
    isInternetReachable: boolean | null;
    connectionType: string | null;
    connectionQuality: 'unknown' | 'poor' | 'good' | 'excellent';
  }>({
    isConnected: null,
    isInternetReachable: null,
    connectionType: null,
    connectionQuality: 'unknown',
  });

  // Determine connection quality based on connectionType
  const getConnectionQuality = (
    state: NetInfoState,
  ): 'unknown' | 'poor' | 'good' | 'excellent' => {
    if (!state.isConnected) return 'poor';
    if (!state.isInternetReachable) return 'poor';

    if (state.type === 'wifi' || state.type === 'ethernet') {
      return 'excellent';
    } else if (state.type === 'cellular') {
      switch (state.details?.cellularGeneration) {
        case '4g':
        case '5g':
          return 'good';
        case '3g':
          return 'poor';
        case '2g':
        default:
          return 'poor';
      }
    }

    return 'unknown';
  };

  // Check connection on demand
  const checkConnection = async (): Promise<boolean> => {
    try {
      const state = await NetInfo.fetch();

      setNetworkState({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        connectionType: state.type,
        connectionQuality: getConnectionQuality(state),
      });

      return !!state.isConnected && !!state.isInternetReachable;
    } catch (error) {
      console.error('Failed to check network connection:', error);
      return false;
    }
  };

  // Set up network event listeners
  useEffect(() => {
    // Initial check
    checkConnection();

    // Subscribe to network changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      setNetworkState({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        connectionType: state.type,
        connectionQuality: getConnectionQuality(state),
      });
    });

    // Clean up listener on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <NetworkContext.Provider
      value={{
        ...networkState,
        checkConnection,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

// Custom hook to use the network context
export function useNetwork() {
  const context = useContext(NetworkContext);

  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }

  return context;
}
