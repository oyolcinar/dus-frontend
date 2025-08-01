// utils/styleUtils.ts (FIXED VERSION)
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

// FIXED: Shadow utility with proper properties and platform handling
export const createPlayfulShadow = (
  color: string = '#000000',
  intensity: 'light' | 'medium' | 'heavy' = 'medium',
) => {
  const shadowConfigs = {
    light: {
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    heavy: {
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 8,
    },
  };

  const config = shadowConfigs[intensity];

  // Return platform-specific shadow styles
  if (Platform.OS === 'ios') {
    return {
      shadowColor: color,
      shadowOffset: config.shadowOffset,
      shadowOpacity: config.shadowOpacity,
      shadowRadius: config.shadowRadius,
    };
  } else {
    // Android
    return {
      elevation: config.elevation,
      shadowColor: color, // Android also supports shadowColor for colored shadows
    };
  }
};

// ENHANCED: More reliable shadow presets
export const shadowPresets = {
  none: {},
  light: createPlayfulShadow('#000000', 'light'),
  medium: createPlayfulShadow('#000000', 'medium'),
  heavy: createPlayfulShadow('#000000', 'heavy'),
  colored: {
    purple: createPlayfulShadow('#8B5CF6', 'medium'),
    blue: createPlayfulShadow('#3B82F6', 'medium'),
    green: createPlayfulShadow('#10B981', 'medium'),
    orange: createPlayfulShadow('#F59E0B', 'medium'),
    pink: createPlayfulShadow('#EC4899', 'medium'),
  },
};

// NEW: Utility functions for creating vibrant styles
export const createVibrantStyle = (colorKey: keyof typeof Colors.vibrant) => ({
  backgroundColor: Colors.vibrant[colorKey],
  ...createPlayfulShadow(Colors.vibrant[colorKey], 'medium'),
});

export const createGradientStyle = (
  gradientKey: keyof typeof Colors.gradients,
) => ({
  colors: Colors.gradients[gradientKey],
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
});

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

// Color utility functions
export const getRandomVibrantColor = () => {
  const colors = Object.values(Colors.vibrant || {});
  return colors[Math.floor(Math.random() * colors.length)] || '#8B5CF6';
};

export const getDifficultyColor = (difficulty: 'easy' | 'medium' | 'hard') => {
  switch (difficulty) {
    case 'easy':
      return Colors.vibrant?.green || '#10B981';
    case 'medium':
      return Colors.vibrant?.yellow || '#F59E0B';
    case 'hard':
      return Colors.vibrant?.orange || '#F97316';
    default:
      return Colors.vibrant?.purple || '#8B5CF6';
  }
};

export const getStatusColor = (
  status: 'active' | 'completed' | 'upcoming' | 'missed',
) => {
  switch (status) {
    case 'active':
      return Colors.vibrant?.blue || '#3B82F6';
    case 'completed':
      return Colors.vibrant?.green || '#10B981';
    case 'upcoming':
      return Colors.vibrant?.purple || '#8B5CF6';
    case 'missed':
      return Colors.vibrant?.orange || '#F97316';
    default:
      return Colors.neutral?.gray || '#6B7280';
  }
};

// Animation utility functions
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
    duration: AnimationConfig?.duration?.slow || 500,
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
    duration: AnimationConfig?.duration?.normal || 300,
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
    duration: AnimationConfig?.duration?.slow || 500,
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

// Enhanced global styles with fixed shadows
export const globalStyles = StyleSheet.create({
  // Layout styles
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

  // Cards with proper shadows
  card: {
    backgroundColor: Colors.white || '#FFFFFF',
    borderRadius: BorderRadius?.xl || 12,
    padding: Spacing?.[4] || 16,
    ...shadowPresets.medium,
  },
  playfulCard: {
    backgroundColor: Colors.white || '#FFFFFF',
    borderRadius: BorderRadius?.card || BorderRadius?.xl || 12,
    padding: Spacing?.[4] || 16,
    ...shadowPresets.heavy,
  },
  gameCard: {
    backgroundColor: Colors.vibrant?.purple || '#8B5CF6',
    borderRadius: BorderRadius?.button || BorderRadius?.xl || 12,
    padding: Spacing?.[6] || 24,
    ...createPlayfulShadow(Colors.vibrant?.purple || '#8B5CF6', 'heavy'),
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius?.card || BorderRadius?.xl || 12,
    padding: Spacing?.[4] || 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...shadowPresets.light,
  },

  // Button styles with shadows
  btnVibrant: {
    backgroundColor: Colors.vibrant?.purple || '#8B5CF6',
    paddingHorizontal: Spacing?.[6] || 24,
    paddingVertical: Spacing?.[4] || 16,
    borderRadius: BorderRadius?.button || 12,
    ...createPlayfulShadow(Colors.vibrant?.purple || '#8B5CF6', 'medium'),
  },
  btnPlayful: {
    backgroundColor: Colors.vibrant?.orange || '#F97316',
    paddingHorizontal: Spacing?.[6] || 24,
    paddingVertical: Spacing?.[4] || 16,
    borderRadius: BorderRadius?.bubble || 20,
    ...createPlayfulShadow(Colors.vibrant?.orange || '#F97316', 'heavy'),
  },
  btnFloating: {
    backgroundColor: Colors.vibrant?.blue || '#3B82F6',
    paddingHorizontal: Spacing?.[6] || 24,
    paddingVertical: Spacing?.[4] || 16,
    borderRadius: 50,
    ...shadowPresets.heavy,
  },

  // Animation preset styles with enhanced shadows
  floatingElement: {
    ...createPlayfulShadow('#000000', 'heavy'),
  },
  pulsingElement: {
    ...createPlayfulShadow(Colors.vibrant?.purple || '#8B5CF6', 'medium'),
  },
  glowingElement: {
    ...createPlayfulShadow(Colors.vibrant?.blue || '#3B82F6', 'heavy'),
  },

  // Text styles
  textXs: { fontSize: FontSizes?.xs || 12 },
  textSm: { fontSize: FontSizes?.sm || 14 },
  textBase: { fontSize: FontSizes?.base || 16 },
  textLg: { fontSize: FontSizes?.lg || 18 },
  textXl: { fontSize: FontSizes?.xl || 20 },
  text2xl: { fontSize: FontSizes?.['2xl'] || 24 },
  text3xl: { fontSize: FontSizes?.['3xl'] || 30 },
  text4xl: { fontSize: FontSizes?.['4xl'] || 36 },

  // Font weights
  fontLight: { fontWeight: '300' as const },
  fontNormal: { fontWeight: '400' as const },
  fontMedium: { fontWeight: '500' as const },
  fontSemibold: { fontWeight: '600' as const },
  fontBold: { fontWeight: '700' as const },
  fontExtrabold: { fontWeight: '800' as const },
  fontBlack: { fontWeight: '900' as const },

  // Colors - Background
  bgWhite: { backgroundColor: Colors.white || '#FFFFFF' },
  bgVibrantPurple: { backgroundColor: Colors.vibrant?.purple || '#8B5CF6' },
  bgVibrantOrange: { backgroundColor: Colors.vibrant?.orange || '#F97316' },
  bgVibrantGreen: { backgroundColor: Colors.vibrant?.green || '#10B981' },
  bgVibrantBlue: { backgroundColor: Colors.vibrant?.blue || '#3B82F6' },
  bgVibrantPink: { backgroundColor: Colors.vibrant?.pink || '#EC4899' },
  bgVibrantYellow: { backgroundColor: Colors.vibrant?.yellow || '#F59E0B' },

  // Spacing
  mb1: { marginBottom: Spacing?.[1] || 4 },
  mb2: { marginBottom: Spacing?.[2] || 8 },
  mb4: { marginBottom: Spacing?.[4] || 16 },
  mb6: { marginBottom: Spacing?.[6] || 24 },
  mb8: { marginBottom: Spacing?.[8] || 32 },
  p2: { padding: Spacing?.[2] || 8 },
  p4: { padding: Spacing?.[4] || 16 },
  p6: { padding: Spacing?.[6] || 24 },
  px4: { paddingHorizontal: Spacing?.[4] || 16 },
  py2: { paddingVertical: Spacing?.[2] || 8 },

  // Border radius
  roundedLg: { borderRadius: BorderRadius?.lg || 8 },
  roundedXl: { borderRadius: BorderRadius?.xl || 12 },
  rounded2xl: { borderRadius: BorderRadius?.['2xl'] || 16 },
  roundedFull: { borderRadius: BorderRadius?.full || 9999 },
});

// Apply dark mode styles
export function applyDarkMode<T extends object>(
  isDark: boolean,
  lightStyle: T,
  darkStyle: T,
): T {
  return isDark ? darkStyle : lightStyle;
}

// Apply playful styling conditionally
export function applyPlayfulMode<T extends object>(
  isPlayful: boolean,
  defaultStyle: T,
  playfulStyle: T,
): T {
  return isPlayful ? playfulStyle : defaultStyle;
}

// Create responsive styles based on screen size
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
