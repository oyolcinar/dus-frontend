// components/ui/ThemeContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/theme';

type ThemeType = 'light' | 'dark';

interface ThemeContextType {
  /**
   * Current theme value ('light' or 'dark')
   */
  theme: ThemeType;

  /**
   * Function to change the theme
   */
  setTheme: (theme: ThemeType) => void;

  /**
   * Boolean flag indicating if the current theme is dark
   */
  isDark: boolean;

  /**
   * Function to toggle between light and dark themes
   */
  toggleTheme: () => void;

  /**
   * Object containing theme colors based on current theme
   */
  colors: {
    background: string;
    text: string;
    primary: string;
    secondary: string;
    border: string;
    card: string;
    error: string;
    success: string;
    warning: string;
    info: string;
  };
}

// Create context with default values
export const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  setTheme: () => {},
  isDark: false,
  toggleTheme: () => {},
  colors: {
    background: Colors.white,
    text: Colors.gray[900],
    primary: Colors.primary.DEFAULT,
    secondary: Colors.secondary.DEFAULT,
    border: Colors.gray[200],
    card: Colors.white,
    error: Colors.error,
    success: Colors.success,
    warning: Colors.warning,
    info: Colors.info,
  },
});

interface ThemeProviderProps {
  /**
   * Initial theme override (optional)
   */
  initialTheme?: ThemeType;

  /**
   * Whether to follow system theme by default
   */
  followSystem?: boolean;

  /**
   * Children components
   */
  children: React.ReactNode;
}

/**
 * ThemeProvider component to wrap your app with to provide theme context
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  initialTheme,
  followSystem = true,
  children,
}) => {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeType>(
    initialTheme ||
      (followSystem && systemColorScheme === 'dark' ? 'dark' : 'light'),
  );

  // Update theme when system theme changes if followSystem is true
  useEffect(() => {
    if (followSystem && systemColorScheme) {
      setTheme(systemColorScheme === 'dark' ? 'dark' : 'light');
    }
  }, [systemColorScheme, followSystem]);

  // Determine if current theme is dark
  const isDark = theme === 'dark';

  // Toggle between light and dark themes
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  // Define colors based on current theme
  const colors = {
    background: isDark ? Colors.gray[900] : Colors.white,
    text: isDark ? Colors.white : Colors.gray[900],
    primary: Colors.primary.DEFAULT,
    secondary: Colors.secondary.DEFAULT,
    border: isDark ? Colors.gray[700] : Colors.gray[200],
    card: isDark ? Colors.gray[800] : Colors.white,
    error: Colors.error,
    success: Colors.success,
    warning: Colors.warning,
    info: Colors.info,
  };

  // Create context value
  const contextValue: ThemeContextType = {
    theme,
    setTheme,
    isDark,
    toggleTheme,
    colors,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Custom hook to use theme context
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};

export default ThemeContext;
