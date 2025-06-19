// constants/theme.ts - Updated with custom fonts and enhanced styling

export const Colors = {
  // Your existing primary colors (keeping for backward compatibility)
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

  // NEW: Vibrant playful colors inspired by the Dribbble design
  vibrant: {
    purple: '#6C5CE7',
    purpleLight: '#A29BFE',
    purpleDark: '#5F4FCF',
    orange: '#FF6B6B',
    orangeLight: '#FF8E8E',
    yellow: '#FFD93D',
    yellowLight: '#FFE66D',
    green: '#00D68F',
    greenLight: '#26DE81',
    blue: '#3742FA',
    blueLight: '#5352ED',
    pink: '#FF3838',
    pinkLight: '#FF6B9D',
    coral: '#FF7675',
    mint: '#00CEC9',
    lavender: '#A29BFE',
    peach: '#FDCB6E',
  },

  // NEW: Gradient combinations for playful effects
  gradients: {
    primary: ['#6C5CE7', '#A29BFE'],
    sunset: ['#FF6B6B', '#FFD93D'],
    ocean: ['#3742FA', '#00D68F'],
    candy: ['#FF3838', '#FF6B9D'],
    success: ['#00D68F', '#26DE81'],
    warning: ['#FFD93D', '#FFE66D'],
    purple: ['#5F4FCF', '#A29BFE'],
    tropical: ['#00CEC9', '#00D68F'],
    fire: ['#FF3838', '#FF6B6B'],
    sky: ['#5352ED', '#A29BFE'],
    facebook: ['#1877F2', '#4267B2'],
    appleDark: ['#ffffff', '#f0f0f0'],
    appleLight: ['#000000', '#333333'],
    google: ['#4285F4', '#34A853'],
  },

  // Your existing semantic colors
  success: '#21b958',
  error: '#ec1c24',
  info: '#00b7ef',
  warning: '#fbd000',

  // Enhanced semantic colors with playful variants
  semantic: {
    success: '#00D68F',
    successLight: '#26DE81',
    error: '#FF3838',
    errorLight: '#FF6B6B',
    info: '#3742FA',
    infoLight: '#5352ED',
    warning: '#FFD93D',
    warningLight: '#FFE66D',
  },

  // Your existing gray scales (keeping as-is)
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

  // NEW: Enhanced neutral colors for better contrast
  neutral: {
    white: '#FFFFFF',
    offWhite: '#F8F9FA',
    lightGray: '#E9ECEF',
    gray: '#6C757D',
    darkGray: '#495057',
    black: '#212529',
    transparent: 'transparent',
  },

  // NEW: Shadow colors for depth
  shadows: {
    light: 'rgba(108, 92, 231, 0.15)',
    medium: 'rgba(108, 92, 231, 0.25)',
    heavy: 'rgba(108, 92, 231, 0.35)',
    colorful: 'rgba(255, 107, 107, 0.2)',
  },

  // Base colors (keeping your existing)
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
  // NEW: Additional sizes for playful design
  '5xl': 42,
  '6xl': 48,
  '7xl': 60,
  '8xl': 72,
};

// NEW: Font weights for more expressive typography
export const FontWeights = {
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
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
  // NEW: Additional spacing for larger elements
  20: 80,
  24: 96,
  32: 128,
  40: 160,
  48: 192,
  56: 224,
  64: 256,
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
  // NEW: Playful border radius values
  bubble: 25,
  card: 20,
  button: 15,
  round: 50,
};

// NEW: Animation durations and easing
export const AnimationConfig = {
  duration: {
    fast: 200,
    normal: 300,
    slow: 500,
    slower: 700,
    slowest: 1000,
  },
  easing: {
    ease: [0.25, 0.1, 0.25, 1],
    easeIn: [0.42, 0, 1, 1],
    easeOut: [0, 0, 0.58, 1],
    easeInOut: [0.42, 0, 0.58, 1],
    bounce: [0.68, -0.55, 0.265, 1.55],
  },
};

// NEW: Font families for your custom fonts
export const FontFamilies = {
  // Your custom fonts
  primary: {
    regular: 'PrimaryFont', // Use WOFF first, fallback to WOFF2 if needed
    woff2: 'PrimaryFont-WOFF2', // Alternative format
  },

  secondary: {
    regular: 'SecondaryFont-Regular',
    bold: 'SecondaryFont-Bold',
  },

  // Fallbacks for system fonts
  system: {
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  },
};

// Updated Typography styles with your actual fonts
export const Typography = {
  // Headings (using secondary bold for impact)
  h1: {
    fontFamily: FontFamilies.secondary.bold,
    fontSize: FontSizes['4xl'],
    fontWeight: 'normal' as any, // Let the font handle weight
    lineHeight: 44,
    letterSpacing: -0.5,
  },

  h2: {
    fontFamily: FontFamilies.secondary.bold,
    fontSize: FontSizes['3xl'],
    fontWeight: 'normal' as any,
    lineHeight: 36,
    letterSpacing: -0.3,
  },

  h3: {
    fontFamily: FontFamilies.secondary.bold,
    fontSize: FontSizes['2xl'],
    fontWeight: 'normal' as any,
    lineHeight: 30,
  },

  h4: {
    fontFamily: FontFamilies.secondary.regular,
    fontSize: FontSizes.xl,
    fontWeight: 'normal' as any,
    lineHeight: 26,
  },

  // Body text (using primary font for readability)
  body: {
    fontFamily: FontFamilies.primary.regular,
    fontSize: FontSizes.base,
    fontWeight: 'normal' as any,
    lineHeight: 24,
  },

  bodyLarge: {
    fontFamily: FontFamilies.primary.regular,
    fontSize: FontSizes.lg,
    fontWeight: 'normal' as any,
    lineHeight: 26,
  },

  bodySmall: {
    fontFamily: FontFamilies.primary.regular,
    fontSize: FontSizes.sm,
    fontWeight: 'normal' as any,
    lineHeight: 20,
  },

  // Special styles
  caption: {
    fontFamily: FontFamilies.primary.regular,
    fontSize: FontSizes.xs,
    fontWeight: 'normal' as any,
    lineHeight: 16,
  },

  button: {
    fontFamily: FontFamilies.secondary.bold,
    fontSize: FontSizes.base,
    fontWeight: 'normal' as any,
    letterSpacing: 0.5,
  },

  buttonLarge: {
    fontFamily: FontFamilies.secondary.bold,
    fontSize: FontSizes.lg,
    fontWeight: 'normal' as any,
    letterSpacing: 0.5,
  },

  // Playful styles for game elements
  gameTitle: {
    fontFamily: FontFamilies.secondary.bold,
    fontSize: FontSizes['5xl'],
    fontWeight: 'normal' as any,
    lineHeight: 52,
    letterSpacing: -1,
  },

  score: {
    fontFamily: FontFamilies.secondary.bold,
    fontSize: FontSizes['3xl'],
    fontWeight: 'normal' as any,
    lineHeight: 36,
  },

  timer: {
    fontFamily: FontFamilies.secondary.bold,
    fontSize: FontSizes['2xl'],
    fontWeight: 'normal' as any,
    lineHeight: 28,
    letterSpacing: 1,
  },
};

// Helper function to get font family with fallback
export const getFontFamily = (
  family: 'primary' | 'secondary' = 'primary',
  variant: 'regular' | 'bold' = 'regular',
) => {
  if (family === 'primary') {
    return FontFamilies.primary.regular || FontFamilies.system.default;
  }

  if (family === 'secondary') {
    return (
      FontFamilies.secondary[variant] ||
      FontFamilies.secondary.regular ||
      FontFamilies.system.default
    );
  }

  return FontFamilies.system.default;
};

// Enhanced and expanded common styles with custom fonts
export const CommonStyles = {
  // Your existing card styles (enhanced)
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius['2xl'],
    shadowColor: Colors.shadows.light,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 5,
    padding: Spacing[4],
  },
  cardDark: {
    backgroundColor: Colors.gray[800],
    borderRadius: BorderRadius['2xl'],
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    padding: Spacing[4],
  },

  // NEW: Playful card variants
  playfulCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.card,
    shadowColor: Colors.shadows.medium,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
    padding: Spacing[5],
  },

  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: Colors.shadows.light,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 5,
    padding: Spacing[4],
  },

  gameCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.bubble,
    shadowColor: Colors.shadows.colorful,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
    padding: Spacing[6],
  },

  // NEW: Button styles with custom fonts
  primaryButton: {
    borderRadius: BorderRadius.button,
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[6],
    shadowColor: Colors.shadows.medium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },

  floatingButton: {
    borderRadius: BorderRadius.full,
    shadowColor: Colors.shadows.heavy,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },

  // NEW: Container styles
  screenContainer: {
    flex: 1,
    backgroundColor: Colors.neutral.offWhite,
    padding: Spacing[4],
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[4],
  },

  // NEW: Text styles with custom fonts
  headingText: {
    ...Typography.h2,
    color: Colors.gray[800],
    textAlign: 'center',
  },

  playfulHeading: {
    ...Typography.gameTitle,
    color: Colors.vibrant.purple,
    textAlign: 'center',
    textShadowColor: 'rgba(108, 92, 231, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  heroTitle: {
    ...Typography.h1,
    color: Colors.white,
    textAlign: 'center',
  },

  cardTitle: {
    ...Typography.h3,
    color: Colors.gray[800],
    marginBottom: Spacing[2],
  },

  bodyText: {
    ...Typography.body,
    color: Colors.gray[600],
  },

  bodyTextPrimary: {
    ...Typography.body,
    color: Colors.gray[700],
  },

  bodyTextSecondary: {
    ...Typography.bodySmall,
    color: Colors.gray[500],
  },

  buttonText: {
    ...Typography.button,
    color: Colors.white,
    textAlign: 'center',
  },

  buttonTextLarge: {
    ...Typography.buttonLarge,
    color: Colors.white,
    textAlign: 'center',
  },

  scoreText: {
    ...Typography.score,
    color: Colors.vibrant.yellow,
    textAlign: 'center',
  },

  timerText: {
    ...Typography.timer,
    color: Colors.vibrant.orange,
    textAlign: 'center',
  },

  // NEW: Input styles
  input: {
    ...Typography.body,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.gray[200],
    backgroundColor: Colors.white,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    color: Colors.gray[800],
  },

  inputFocused: {
    borderColor: Colors.vibrant.purple,
    shadowColor: Colors.shadows.light,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },

  // NEW: List styles
  listItem: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
    marginVertical: Spacing[1],
    shadowColor: Colors.shadows.light,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
};

// NEW: Helper functions for dynamic styling
export const StyleHelpers = {
  // Create gradient background style
  createGradient: (
    colors = Colors.gradients.primary,
    direction = { x: 0, y: 0, x2: 1, y2: 1 },
  ) => ({
    colors,
    start: { x: direction.x, y: direction.y },
    end: { x: direction.x2, y: direction.y2 },
  }),

  // Create shadow with custom color
  createShadow: (color = Colors.shadows.medium, elevation = 5) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: elevation / 2 },
    shadowOpacity: 1,
    shadowRadius: elevation * 2,
    elevation,
  }),

  // Create responsive padding based on screen size
  responsivePadding: (baseSize = Spacing[4]) => ({
    paddingHorizontal: baseSize,
    paddingVertical: baseSize * 0.75,
  }),

  // Create text style with custom font
  createTextStyle: (
    family: 'primary' | 'secondary' = 'primary',
    variant: 'regular' | 'bold' = 'regular',
    size: keyof typeof FontSizes = 'base',
    color: string = Colors.gray[800],
  ) => ({
    fontFamily: getFontFamily(family, variant),
    fontSize: FontSizes[size],
    fontWeight: 'normal' as any,
    color,
  }),

  // Create button style with gradient
  createButtonStyle: (
    gradient: keyof typeof Colors.gradients = 'primary',
    size: 'small' | 'medium' | 'large' = 'medium',
  ) => {
    const baseStyle = CommonStyles.primaryButton;
    const padding =
      size === 'small'
        ? Spacing[2]
        : size === 'large'
        ? Spacing[6]
        : Spacing[4];

    return {
      ...baseStyle,
      paddingVertical: padding,
      paddingHorizontal: padding * 1.5,
    };
  },
};
