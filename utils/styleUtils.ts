// utils/styleUtils.ts
import {
  StyleSheet,
  Platform,
  StyleProp,
  ViewStyle,
  TextStyle,
  Animated,
} from 'react-native';
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
  AnimationConfig,
  CommonStyles,
} from '../constants/theme';

// Helper function to merge styles together with proper typing
export const mergeStyles = (
  ...styles: Array<StyleProp<ViewStyle | TextStyle>>
) => {
  return Object.assign({}, ...styles);
};

// NEW: Utility functions for creating playful styles
export const createVibrantStyle = (colorKey: keyof typeof Colors.vibrant) => ({
  backgroundColor: Colors.vibrant[colorKey],
  shadowColor: Colors.vibrant[colorKey],
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 5,
});

export const createGradientStyle = (
  gradientKey: keyof typeof Colors.gradients,
) => ({
  colors: Colors.gradients[gradientKey],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
});

export const createPlayfulShadow = (
  color: string = Colors.shadows.medium,
  intensity: 'light' | 'medium' | 'heavy' = 'medium',
) => {
  const shadowConfigs = {
    light: {
      offset: { width: 0, height: 2 },
      opacity: 0.15,
      radius: 4,
      elevation: 2,
    },
    medium: {
      offset: { width: 0, height: 4 },
      opacity: 0.25,
      radius: 8,
      elevation: 5,
    },
    heavy: {
      offset: { width: 0, height: 8 },
      opacity: 0.35,
      radius: 16,
      elevation: 10,
    },
  };

  const config = shadowConfigs[intensity];
  return {
    shadowColor: color,
    shadowOffset: config.offset,
    shadowOpacity: config.opacity,
    shadowRadius: config.radius,
    elevation: config.elevation,
  };
};

export const createAnimatedStyle = (
  animationType: 'bounce' | 'slide' | 'fade' | 'pulse',
  animatedValue: Animated.Value,
  config?: any,
) => {
  switch (animationType) {
    case 'bounce':
      return {
        transform: [
          {
            scale: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [1, config?.scale || 1.1],
            }),
          },
        ],
      };
    case 'slide':
      return {
        transform: [
          {
            translateX: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [config?.distance || -100, 0],
            }),
          },
        ],
      };
    case 'fade':
      return {
        opacity: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
        }),
      };
    case 'pulse':
      return {
        transform: [
          {
            scale: animatedValue.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [1, config?.scale || 1.05, 1],
            }),
          },
        ],
      };
    default:
      return {};
  }
};

// NEW: Color utility functions
export const getRandomVibrantColor = () => {
  const colors = Object.values(Colors.vibrant);
  return colors[Math.floor(Math.random() * colors.length)];
};

export const getDifficultyColor = (difficulty: 'easy' | 'medium' | 'hard') => {
  switch (difficulty) {
    case 'easy':
      return Colors.vibrant.green;
    case 'medium':
      return Colors.vibrant.yellow;
    case 'hard':
      return Colors.vibrant.orange;
    default:
      return Colors.vibrant.purple;
  }
};

export const getStatusColor = (
  status: 'active' | 'completed' | 'upcoming' | 'missed',
) => {
  switch (status) {
    case 'active':
      return Colors.vibrant.blue;
    case 'completed':
      return Colors.vibrant.green;
    case 'upcoming':
      return Colors.vibrant.purple;
    case 'missed':
      return Colors.vibrant.orange;
    default:
      return Colors.neutral.gray;
  }
};

// NEW: Animation utility functions
export const createBounceAnimation = (
  animatedValue: Animated.Value,
  options?: {
    toValue?: number;
    tension?: number;
    friction?: number;
    useNativeDriver?: boolean;
  },
) => {
  const config = {
    toValue: 1,
    tension: 400,
    friction: 3,
    useNativeDriver: true,
    ...options,
  };

  return Animated.spring(animatedValue, config);
};

export const createSlideAnimation = (
  animatedValue: Animated.Value,
  options?: {
    direction?: 'up' | 'down' | 'left' | 'right';
    duration?: number;
    toValue?: number;
    useNativeDriver?: boolean;
  },
) => {
  const config = {
    toValue: 1,
    duration: AnimationConfig.duration.slow,
    useNativeDriver: true,
    ...options,
  };

  return Animated.timing(animatedValue, {
    toValue: config.toValue,
    duration: config.duration,
    useNativeDriver: config.useNativeDriver,
  });
};

export const createFadeAnimation = (
  animatedValue: Animated.Value,
  options?: {
    duration?: number;
    toValue?: number;
    useNativeDriver?: boolean;
  },
) => {
  const config = {
    toValue: 1,
    duration: AnimationConfig.duration.normal,
    useNativeDriver: true,
    ...options,
  };

  return Animated.timing(animatedValue, config);
};

export const createPulseAnimation = (
  animatedValue: Animated.Value,
  options?: {
    duration?: number;
    minValue?: number;
    maxValue?: number;
    useNativeDriver?: boolean;
  },
) => {
  const config = {
    duration: AnimationConfig.duration.slow,
    minValue: 0,
    maxValue: 1,
    useNativeDriver: true,
    ...options,
  };

  return Animated.loop(
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: config.maxValue,
        duration: config.duration / 2,
        useNativeDriver: config.useNativeDriver,
      }),
      Animated.timing(animatedValue, {
        toValue: config.minValue,
        duration: config.duration / 2,
        useNativeDriver: config.useNativeDriver,
      }),
    ]),
  );
};

// Enhanced global styles with playful additions
export const globalStyles = StyleSheet.create({
  // Layout (your existing styles)
  flexRow: {
    flexDirection: 'row',
  },
  flexColumn: {
    flexDirection: 'column',
  },
  flexGrow: {
    flexGrow: 1,
  },
  flex1: {
    flex: 1,
  },
  itemsCenter: {
    alignItems: 'center',
  },
  justifyCenter: {
    justifyContent: 'center',
  },
  justifyBetween: {
    justifyContent: 'space-between',
  },
  justifyEnd: {
    justifyContent: 'flex-end',
  },

  // Text styles (enhanced with new sizes and weights)
  textXs: {
    fontSize: FontSizes.xs,
  },
  textSm: {
    fontSize: FontSizes.sm,
  },
  textBase: {
    fontSize: FontSizes.base,
  },
  textLg: {
    fontSize: FontSizes.lg,
  },
  textXl: {
    fontSize: FontSizes.xl,
  },
  text2xl: {
    fontSize: FontSizes['2xl'],
  },
  text3xl: {
    fontSize: FontSizes['3xl'],
  },
  text4xl: {
    fontSize: FontSizes['4xl'],
  },
  // NEW: Additional text sizes
  text5xl: {
    fontSize: FontSizes['5xl'],
  },
  text6xl: {
    fontSize: FontSizes['6xl'],
  },
  text7xl: {
    fontSize: FontSizes['7xl'],
  },
  text8xl: {
    fontSize: FontSizes['8xl'],
  },

  // Font weights (enhanced with proper React Native types)
  fontLight: {
    fontWeight: '300' as const,
  },
  fontNormal: {
    fontWeight: '400' as const,
  },
  fontMedium: {
    fontWeight: '500' as const,
  },
  fontSemibold: {
    fontWeight: '600' as const,
  },
  fontBold: {
    fontWeight: '700' as const,
  },
  fontExtrabold: {
    fontWeight: '800' as const,
  },
  fontBlack: {
    fontWeight: '900' as const,
  },

  // Colors - Text (your existing + new vibrant colors)
  textWhite: {
    color: Colors.white,
  },
  textPrimary: {
    color: Colors.primary.DEFAULT,
  },
  textGray500: {
    color: Colors.gray[500],
  },
  textGray600: {
    color: Colors.gray[600],
  },
  textGray700: {
    color: Colors.gray[700],
  },
  textGray800: {
    color: Colors.gray[800],
  },
  // NEW: Vibrant text colors
  textVibrantPurple: {
    color: Colors.vibrant.purple,
  },
  textVibrantOrange: {
    color: Colors.vibrant.orange,
  },
  textVibrantGreen: {
    color: Colors.vibrant.green,
  },
  textVibrantBlue: {
    color: Colors.vibrant.blue,
  },
  textVibrantPink: {
    color: Colors.vibrant.pink,
  },
  textVibrantYellow: {
    color: Colors.vibrant.yellow,
  },

  // Colors - Background (your existing + vibrant)
  bgWhite: {
    backgroundColor: Colors.white,
  },
  bgGray50: {
    backgroundColor: Colors.gray[50],
  },
  bgGray100: {
    backgroundColor: Colors.gray[100],
  },
  bgGray700: {
    backgroundColor: Colors.gray[700],
  },
  bgGray800: {
    backgroundColor: Colors.gray[800],
  },
  bgGray900: {
    backgroundColor: Colors.gray[900],
  },
  bgPrimary: {
    backgroundColor: Colors.primary.DEFAULT,
  },
  bgSecondary: {
    backgroundColor: Colors.secondary.DEFAULT,
  },
  bgSuccess: {
    backgroundColor: Colors.success,
  },
  bgError: {
    backgroundColor: Colors.error,
  },
  // NEW: Vibrant backgrounds
  bgVibrantPurple: {
    backgroundColor: Colors.vibrant.purple,
  },
  bgVibrantOrange: {
    backgroundColor: Colors.vibrant.orange,
  },
  bgVibrantGreen: {
    backgroundColor: Colors.vibrant.green,
  },
  bgVibrantBlue: {
    backgroundColor: Colors.vibrant.blue,
  },
  bgVibrantPink: {
    backgroundColor: Colors.vibrant.pink,
  },
  bgVibrantYellow: {
    backgroundColor: Colors.vibrant.yellow,
  },

  // Margins (your existing)
  mb1: {
    marginBottom: Spacing[1],
  },
  mb2: {
    marginBottom: Spacing[2],
  },
  mb4: {
    marginBottom: Spacing[4],
  },
  mb6: {
    marginBottom: Spacing[6],
  },
  mb8: {
    marginBottom: Spacing[8],
  },
  mt1: {
    marginTop: Spacing[1],
  },
  mt2: {
    marginTop: Spacing[2],
  },
  mt4: {
    marginTop: Spacing[4],
  },
  my2: {
    marginVertical: Spacing[2],
  },
  my4: {
    marginVertical: Spacing[4],
  },
  my8: {
    marginVertical: Spacing[8],
  },
  mx2: {
    marginHorizontal: Spacing[2],
  },
  mx4: {
    marginHorizontal: Spacing[4],
  },
  // NEW: Additional margins
  mb12: {
    marginBottom: Spacing[12],
  },
  mb16: {
    marginBottom: Spacing[16],
  },
  mt8: {
    marginTop: Spacing[8],
  },
  mt12: {
    marginTop: Spacing[12],
  },

  // Padding (your existing + new)
  p2: {
    padding: Spacing[2],
  },
  p3: {
    padding: Spacing[3],
  },
  p4: {
    padding: Spacing[4],
  },
  p6: {
    padding: Spacing[6],
  },
  px2: {
    paddingHorizontal: Spacing[2],
  },
  px4: {
    paddingHorizontal: Spacing[4],
  },
  py1: {
    paddingVertical: Spacing[1],
  },
  py2: {
    paddingVertical: Spacing[2],
  },
  py3: {
    paddingVertical: Spacing[3],
  },
  // NEW: Additional padding
  p8: {
    padding: Spacing[8],
  },
  px6: {
    paddingHorizontal: Spacing[6],
  },
  px8: {
    paddingHorizontal: Spacing[8],
  },
  py4: {
    paddingVertical: Spacing[4],
  },
  py6: {
    paddingVertical: Spacing[6],
  },

  // Border radius (enhanced with playful options)
  roundedLg: {
    borderRadius: BorderRadius.lg,
  },
  roundedXl: {
    borderRadius: BorderRadius.xl,
  },
  rounded2xl: {
    borderRadius: BorderRadius['2xl'],
  },
  rounded3xl: {
    borderRadius: BorderRadius['3xl'],
  },
  roundedFull: {
    borderRadius: BorderRadius.full,
  },
  // NEW: Playful border radius
  roundedBubble: {
    borderRadius: BorderRadius.bubble,
  },
  roundedCard: {
    borderRadius: BorderRadius.card,
  },
  roundedButton: {
    borderRadius: BorderRadius.button,
  },

  // Cards and common components (enhanced)
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  // NEW: Playful card variants
  playfulCard: {
    ...CommonStyles.playfulCard,
  },
  gameCard: {
    ...CommonStyles.gameCard,
  },
  glassCard: {
    ...CommonStyles.glassCard,
  },

  // Button styles (enhanced with vibrant options)
  btnPrimary: {
    backgroundColor: Colors.primary.DEFAULT,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.lg,
  },
  btnSecondary: {
    backgroundColor: Colors.secondary.DEFAULT,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.lg,
  },
  btnSuccess: {
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.lg,
  },
  btnError: {
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.lg,
  },
  // NEW: Vibrant button styles
  btnVibrant: {
    backgroundColor: Colors.vibrant.purple,
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[4],
    borderRadius: BorderRadius.button,
    ...createPlayfulShadow(Colors.vibrant.purple, 'medium'),
  },
  btnPlayful: {
    backgroundColor: Colors.vibrant.orange,
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[4],
    borderRadius: BorderRadius.bubble,
    ...createPlayfulShadow(Colors.vibrant.orange, 'heavy'),
  },
  btnFloating: {
    ...CommonStyles.floatingButton,
    backgroundColor: Colors.vibrant.blue,
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[4],
  },

  // Form elements (enhanced)
  input: {
    backgroundColor: Colors.gray[100],
    color: Colors.gray[900],
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    width: '100%',
  },
  inputDark: {
    backgroundColor: Colors.gray[700],
    color: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    width: '100%',
  },
  // NEW: Playful input styles
  inputPlayful: {
    backgroundColor: Colors.neutral.offWhite,
    color: Colors.neutral.darkGray,
    borderRadius: BorderRadius.button,
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    width: '100%',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputFocused: {
    borderColor: Colors.vibrant.purple,
    ...createPlayfulShadow(Colors.vibrant.purple, 'light'),
  },

  // Width and height (your existing)
  w100: {
    width: '100%',
  },
  w75: {
    width: '75%',
  },
  w50: {
    width: '50%',
  },
  w25: {
    width: '25%',
  },
  h100: {
    height: '100%',
  },

  // NEW: Game-specific styles
  gameScreen: {
    flex: 1,
    backgroundColor: Colors.neutral.offWhite,
    padding: Spacing[4],
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[6],
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.card,
    marginBottom: Spacing[6],
    ...createPlayfulShadow(Colors.shadows.light, 'medium'),
  },
  scoreDisplay: {
    alignItems: 'center',
    backgroundColor: Colors.vibrant.purple,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[6],
    borderRadius: BorderRadius.bubble,
    ...createPlayfulShadow(Colors.vibrant.purple, 'medium'),
  },
  questionCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.card,
    padding: Spacing[6],
    marginVertical: Spacing[4],
    ...createPlayfulShadow(Colors.shadows.medium, 'heavy'),
  },
  answerOption: {
    backgroundColor: Colors.neutral.offWhite,
    borderRadius: BorderRadius.button,
    padding: Spacing[4],
    marginVertical: Spacing[2],
    borderWidth: 2,
    borderColor: 'transparent',
  },
  answerOptionSelected: {
    backgroundColor: Colors.vibrant.purpleLight,
    borderColor: Colors.vibrant.purple,
  },
  answerOptionCorrect: {
    backgroundColor: Colors.vibrant.greenLight,
    borderColor: Colors.vibrant.green,
  },
  answerOptionIncorrect: {
    backgroundColor: Colors.vibrant.orangeLight,
    borderColor: Colors.vibrant.orange,
  },

  // NEW: Animation preset styles
  floatingElement: {
    shadowColor: Colors.shadows.heavy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 12,
  },
  pulsingElement: {
    shadowColor: Colors.vibrant.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  glowingElement: {
    shadowColor: Colors.vibrant.blue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
  },
});

// Apply dark mode styles (enhanced)
export function applyDarkMode<T extends object>(
  isDark: boolean,
  lightStyle: T,
  darkStyle: T,
): T {
  return isDark ? darkStyle : lightStyle;
}

// NEW: Apply playful styling conditionally
export function applyPlayfulMode<T extends object>(
  isPlayful: boolean,
  defaultStyle: T,
  playfulStyle: T,
): T {
  return isPlayful ? playfulStyle : defaultStyle;
}

// NEW: Create responsive styles based on screen size
export function createResponsiveStyle(
  baseStyle: ViewStyle | TextStyle,
  screenWidth: number,
  breakpoints = { sm: 600, md: 768, lg: 1024 },
) {
  if (screenWidth >= breakpoints.lg) {
    return { ...baseStyle, transform: [{ scale: 1.2 }] };
  } else if (screenWidth >= breakpoints.md) {
    return { ...baseStyle, transform: [{ scale: 1.1 }] };
  } else if (screenWidth >= breakpoints.sm) {
    return { ...baseStyle, transform: [{ scale: 1.05 }] };
  }
  return baseStyle;
}
