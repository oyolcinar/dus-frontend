import React, { createContext, useContext, useState } from 'react';
import { ColorSchemeName } from 'react-native';

// Define the theme context type
type ThemeContextType = {
  theme: 'light' | 'dark';
  isDark: boolean;
  setTheme: (theme: string) => void;
  toggleTheme: () => void;
};

// Create context with default values
export const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  isDark: false,
  setTheme: () => {},
  toggleTheme: () => {},
});

// Custom hook to use the theme context
export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}

// For use in the app/_layout.tsx file - Already implemented there
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Implementation in RootLayoutNav in app/_layout.tsx
  return <>{children}</>;
}
