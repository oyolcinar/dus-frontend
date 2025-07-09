// components/ui/PlayfulCard.tsx
import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Animated,
  Easing,
  ColorValue,
  useColorScheme,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CardProps } from './types';
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
} from '../../constants/theme';
import { createPlayfulShadow } from '../../utils/styleUtils';
import { toAnimatedStyle } from '../../utils/styleTypes';

// Helper type to ensure gradient colors are properly typed
type GradientColors = readonly [ColorValue, ColorValue, ...ColorValue[]];

const PlayfulCard: React.FC<CardProps> = ({
  title,
  children,
  variant = 'default',
  style,
  titleStyle,
  padding = 'medium',
  testID,
  gradient,
  animated = false,
  floatingAnimation = false,
  pulseEffect = false,
  borderGlow = false,
  titleFontFamily,
  contentFontFamily,
  contentContainerStyle,
  ...props
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const floatAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const glowAnimation = useRef(new Animated.Value(0)).current;

  // Store animation references for proper cleanup
  const animationRefs = useRef<{
    float?: Animated.CompositeAnimation;
    pulse?: Animated.CompositeAnimation;
    glow?: Animated.CompositeAnimation;
  }>({});

  useEffect(() => {
    if (floatingAnimation) {
      const floatAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnimation, {
            toValue: 1,
            duration: 3000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(floatAnimation, {
            toValue: 0,
            duration: 3000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );

      animationRefs.current.float = floatAnim;
      floatAnim.start();

      return () => {
        if (animationRefs.current.float) {
          animationRefs.current.float.stop();
          animationRefs.current.float = undefined;
        }
        floatAnimation.setValue(0);
      };
    }
  }, [floatingAnimation, floatAnimation]);

  useEffect(() => {
    if (pulseEffect) {
      const pulseAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.05,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );

      animationRefs.current.pulse = pulseAnim;
      pulseAnim.start();

      return () => {
        if (animationRefs.current.pulse) {
          animationRefs.current.pulse.stop();
          animationRefs.current.pulse = undefined;
        }
        pulseAnimation.setValue(1);
      };
    }
  }, [pulseEffect, pulseAnimation]);

  useEffect(() => {
    if (borderGlow) {
      const glowAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnimation, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
          Animated.timing(glowAnimation, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
        ]),
      );

      animationRefs.current.glow = glowAnim;
      glowAnim.start();

      return () => {
        if (animationRefs.current.glow) {
          animationRefs.current.glow.stop();
          animationRefs.current.glow = undefined;
        }
        glowAnimation.setValue(0);
      };
    }
  }, [borderGlow, glowAnimation]);

  // Cleanup all animations when component unmounts
  useEffect(() => {
    return () => {
      Object.values(animationRefs.current).forEach((animation) => {
        if (animation) {
          animation.stop();
        }
      });

      floatAnimation.setValue(0);
      pulseAnimation.setValue(1);
      glowAnimation.setValue(0);

      animationRefs.current = {};
    };
  }, []);

  const getVariantStyles = () => {
    // Helper function to ensure gradient colors are properly typed
    const createGradient = (colors: string[]): GradientColors => {
      if (colors.length < 2) {
        return [colors[0] || '#000000', colors[0] || '#000000'];
      }
      return [colors[0], colors[1], ...colors.slice(2)] as GradientColors;
    };

    // Helper to resolve gradient from different sources
    const resolveGradient = (fallbackColors: string[]): GradientColors => {
      if (gradient && Array.isArray(gradient)) {
        return createGradient(gradient);
      }

      if (gradient && typeof gradient === 'object' && 'colors' in gradient) {
        return createGradient(gradient.colors);
      }

      if (
        gradient &&
        typeof gradient === 'string' &&
        Colors.gradients?.[gradient]
      ) {
        return createGradient(Colors.gradients[gradient]);
      }

      return createGradient(fallbackColors);
    };

    // Base colors based on theme
    const baseBackgroundColor = isDark
      ? Colors.white
      : Colors.vibrant?.purpleDark;
    const baseBorderColor = isDark ? Colors.gray[700] : Colors.gray[200];
    const glassBg = isDark
      ? 'rgba(255, 255, 255, 0.1)'
      : 'rgba(255, 255, 255, 0.15)';
    const glassBorder = isDark
      ? 'rgba(255, 255, 255, 0.2)'
      : 'rgba(255, 255, 255, 0.3)';

    switch (variant) {
      case 'default':
        return {
          backgroundColor: baseBackgroundColor,
          borderColor: baseBorderColor,
          gradient: null,
        };
      case 'outlined':
        return {
          backgroundColor: baseBackgroundColor,
          borderColor: isDark ? Colors.gray[600] : Colors.gray[300],
          borderWidth: 1,
          gradient: null,
        };
      case 'elevated':
        return {
          backgroundColor: baseBackgroundColor,
          gradient: null,
          shadow:
            createPlayfulShadow?.(
              Colors.shadows?.medium || Colors.gray[400],
              'heavy',
            ) || {},
        };
      case 'playful':
        return {
          backgroundColor: baseBackgroundColor,
          gradient: null,
          shadow:
            createPlayfulShadow?.(
              Colors.vibrant?.purpleLight || Colors.gray[200],
              'medium',
            ) || {},
        };
      case 'glass':
        return {
          backgroundColor: glassBg,
          borderColor: glassBorder,
          borderWidth: 1,
          gradient: null,
        };
      case 'game':
        return {
          backgroundColor: baseBackgroundColor,
          gradient: null,
          shadow:
            createPlayfulShadow?.(
              Colors.vibrant?.orange || Colors.secondary.DEFAULT,
              'heavy',
            ) || {},
        };
      case 'floating':
        return {
          backgroundColor: baseBackgroundColor,
          gradient: null,
          shadow:
            createPlayfulShadow?.(
              Colors.vibrant?.blue || Colors.primary.DEFAULT,
              'heavy',
            ) || {},
        };
      case 'gradient':
        return {
          backgroundColor: 'transparent',
          gradient: resolveGradient(
            Colors.gradients?.primary || [
              Colors.primary.DEFAULT,
              Colors.primary.light,
            ],
          ),
        };
      default:
        return {
          backgroundColor: baseBackgroundColor,
          borderColor: baseBorderColor,
          gradient: null,
        };
    }
  };

  const getPaddingStyles = () => {
    switch (padding) {
      case 'none':
        return { padding: 0 };
      case 'small':
        return { padding: Spacing[2] };
      case 'medium':
        return { padding: Spacing[4] };
      case 'large':
        return { padding: Spacing[6] };
      case 'xl':
        return { padding: Spacing[8] };
      default:
        return { padding: Spacing[4] };
    }
  };

  const variantStyles = getVariantStyles();
  const paddingStyles = getPaddingStyles();

  const translateY = floatAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const glowOpacity = glowAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.6],
  });

  // Create custom title style with font family support
  const customTitleStyle = {
    ...(titleFontFamily ? { fontFamily: titleFontFamily } : {}),
    // Remove fontWeight if custom font is provided
    ...(titleFontFamily ? {} : { fontWeight: FontWeights.bold as any }),
    // Theme-aware text color
    color: isDark ? Colors.primary.dark : Colors.white,
  };

  // Separate complex animated styles into variables
  const animatedStyle = toAnimatedStyle({
    transform: [{ translateY: translateY }, { scale: pulseAnimation }],
  });

  const glowBorderGradientStyle = toAnimatedStyle([
    styles.glowBorder,
    {
      opacity: glowOpacity,
      borderColor:
        variantStyles.gradient?.[1] ||
        variantStyles.gradient?.[0] ||
        Colors.primary.DEFAULT,
    },
  ]);

  const glowBorderStyle = toAnimatedStyle([
    styles.glowBorder,
    {
      opacity: glowOpacity,
      borderColor: Colors.white || Colors.vibrant?.purpleLight,
    },
  ]);

  const cardContent = (
    <View style={[paddingStyles]}>
      {title && (
        <View
          style={[
            styles.header,
            {
              borderBottomColor: isDark ? Colors.primary.dark : Colors.white,
            },
          ]}
        >
          <Text style={[styles.title, customTitleStyle, titleStyle]}>
            {title}
          </Text>
        </View>
      )}
      <View style={[styles.content, contentContainerStyle]}>{children}</View>
    </View>
  );

  // Wrap complex style arrays with toAnimatedStyle
  const baseCardStyle = toAnimatedStyle([
    styles.card,
    {
      backgroundColor: variantStyles.backgroundColor,
      borderColor: variantStyles.borderColor,
      borderWidth: variantStyles.borderWidth,
    },
    variantStyles.shadow,
    animatedStyle,
    style,
  ]);

  if (variantStyles.gradient) {
    return (
      <Animated.View style={baseCardStyle} testID={testID} {...props}>
        <LinearGradient
          colors={variantStyles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientContainer}
        >
          {borderGlow && <Animated.View style={glowBorderGradientStyle} />}
          {cardContent}
        </LinearGradient>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={baseCardStyle} testID={testID} {...props}>
      {borderGlow && <Animated.View style={glowBorderStyle} />}
      {cardContent}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.card || BorderRadius.xl,
    overflow: 'hidden',
  },
  gradientContainer: {
    borderRadius: BorderRadius.card || BorderRadius.xl,
  },
  header: {
    marginBottom: Spacing[3],
    paddingBottom: Spacing[2],
    borderBottomWidth: 1,
  },
  title: {
    fontSize: FontSizes.lg,
  },
  content: {
    flex: 1,
    // alignItems: 'center',
    // justifyContent: 'center',
  },
  glowBorder: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderWidth: 3,
    borderRadius: (BorderRadius.card || BorderRadius.xl) + 2,
    zIndex: -1,
  },
});

export default PlayfulCard;
