export const Colors = {
  primary: {
    light: '#d9c5e9',
    DEFAULT: '#722ea5',
    dark: '#5e2587',
  },
  secondary: {
    light: '#ffd580',
    DEFAULT: '#f8a100',
    dark: '#cc8400',
  },
  success: '#21b958',
  error: '#ec1c24',
  info: '#00b7ef',
  warning: '#fbd000',

  // Add gray scales
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // Base colors
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
};

export const FontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
};

export const Spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
};

export const BorderRadius = {
  none: 0,
  sm: 2,
  DEFAULT: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  '3xl': 24,
  full: 9999,
};

// Re-usable styles
export const CommonStyles = {
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    padding: Spacing[4],
  },
  cardDark: {
    backgroundColor: Colors.gray[800],
    borderRadius: BorderRadius.xl,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    padding: Spacing[4],
  },
};
