// components/ui/PlayfulButton.tsx
import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Animated,
  Easing,
  ColorValue,
  useColorScheme,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import { ButtonProps } from './types';
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
  AnimationConfig,
} from '../../constants/theme';
import {
  createPlayfulShadow,
  createVibrantStyle,
} from '../../utils/styleUtils';
import { toAnimatedStyle } from '../../utils/styleTypes';

// Helper type to ensure gradient colors are properly typed
type GradientColors = readonly [ColorValue, ColorValue, ...ColorValue[]];

// Extended ButtonProps with font family support
interface EnhancedButtonProps extends ButtonProps {
  /**
   * Custom font family for button text
   */
  fontFamily?: string;
}

const PlayfulButton: React.FC<EnhancedButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  icon,
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  testID,
  accessibilityLabel,
  gradient,
  animated = true,
  wiggleOnPress = false,
  glowEffect = false,
  fontFamily,
  ...props
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const wiggleAnimation = useRef(new Animated.Value(0)).current;
  const glowAnimation = useRef(new Animated.Value(0)).current;

  // Store animation references for proper cleanup
  const animationRefs = useRef<{
    glow?: Animated.CompositeAnimation;
    wiggle?: Animated.CompositeAnimation;
    scale?: Animated.CompositeAnimation;
  }>({});

  useEffect(() => {
    if (glowEffect) {
      const glowSequence = Animated.loop(
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

      animationRefs.current.glow = glowSequence;
      glowSequence.start();

      return () => {
        if (animationRefs.current.glow) {
          animationRefs.current.glow.stop();
          animationRefs.current.glow = undefined;
        }
        // Reset animation value to prevent lingering effects
        glowAnimation.setValue(0);
      };
    }
  }, [glowEffect, glowAnimation]);

  // Cleanup all animations when component unmounts
  useEffect(() => {
    return () => {
      // Stop all running animations
      Object.values(animationRefs.current).forEach((animation) => {
        if (animation) {
          animation.stop();
        }
      });

      // Reset all animation values
      scaleAnimation.setValue(1);
      wiggleAnimation.setValue(0);
      glowAnimation.setValue(0);

      // Clear references
      animationRefs.current = {};
    };
  }, []);

  // Safe onPress handler with error boundary
  const handlePress = () => {
    if (disabled || loading || !onPress) return;

    try {
      onPress();
    } catch (error) {
      console.error('PlayfulButton onPress error:', error);
      // Optionally show user-friendly error message
    }
  };

  const getVariantStyles = () => {
    // Helper function to ensure gradient colors are properly typed
    const createGradient = (colors: string[]): GradientColors => {
      if (colors.length < 2) {
        return [colors[0] || '#000000', colors[0] || '#000000'];
      }
      // Ensure we have at least 2 colors and properly type them
      return [colors[0], colors[1], ...colors.slice(2)] as GradientColors;
    };

    // Helper to resolve gradient from different sources
    const resolveGradient = (fallbackColors: string[]): GradientColors => {
      // If gradient prop is provided and is an array
      if (gradient && Array.isArray(gradient)) {
        return createGradient(gradient);
      }

      // If gradient prop is a GradientStyle object
      if (gradient && typeof gradient === 'object' && 'colors' in gradient) {
        return createGradient(gradient.colors);
      }

      // If gradient prop is a string key, try to resolve it
      if (
        gradient &&
        typeof gradient === 'string' &&
        Colors.gradients?.[gradient]
      ) {
        return createGradient(Colors.gradients[gradient]);
      }

      // Use fallback colors
      return createGradient(fallbackColors);
    };

    switch (variant) {
      case 'primary':
        return {
          backgroundColor: Colors.primary.DEFAULT,
          textColor: Colors.white,
          gradient: resolveGradient(
            Colors.gradients?.primary || [
              Colors.primary.DEFAULT,
              Colors.primary.light,
            ],
          ),
        };
      case 'secondary':
        return {
          backgroundColor: Colors.secondary.DEFAULT,
          textColor: Colors.white,
          gradient: resolveGradient(
            Colors.gradients?.sunset || [
              Colors.secondary.DEFAULT,
              Colors.secondary.light,
            ],
          ),
        };
      case 'success':
        return {
          backgroundColor: Colors.success,
          textColor: Colors.white,
          gradient: resolveGradient(
            Colors.gradients?.success || [Colors.success, Colors.success],
          ),
        };
      case 'error':
        return {
          backgroundColor: Colors.error,
          textColor: Colors.white,
          gradient: resolveGradient([
            Colors.vibrant?.orange || Colors.error,
            Colors.vibrant?.pink || Colors.error,
          ]),
        };
      case 'vibrant':
        return {
          backgroundColor: Colors.vibrant?.purple || Colors.primary.DEFAULT,
          textColor: Colors.white,
          gradient: resolveGradient(
            Colors.gradients?.purple || [
              Colors.vibrant?.purple || Colors.primary.DEFAULT,
              Colors.vibrant?.purpleLight || Colors.primary.light,
            ],
          ),
        };
      case 'gradient':
        return {
          backgroundColor: 'transparent',
          textColor: Colors.white,
          gradient: resolveGradient(
            Colors.gradients?.primary || [
              Colors.primary.DEFAULT,
              Colors.primary.light,
            ],
          ),
        };
      case 'playful':
        return {
          backgroundColor: Colors.vibrant?.orange || Colors.secondary.DEFAULT,
          textColor: Colors.white,
          gradient: resolveGradient(
            Colors.gradients?.candy || [
              Colors.vibrant?.orange || Colors.secondary.DEFAULT,
              Colors.vibrant?.pink || Colors.secondary.light,
            ],
          ),
        };
      case 'bouncy':
        return {
          backgroundColor: Colors.vibrant?.green || Colors.success,
          textColor: Colors.white,
          gradient: resolveGradient(
            Colors.gradients?.tropical || [
              Colors.vibrant?.green || Colors.success,
              Colors.vibrant?.greenLight || Colors.success,
            ],
          ),
        };
      case 'floating':
        return {
          backgroundColor: Colors.vibrant?.blue || Colors.primary.DEFAULT,
          textColor: Colors.white,
          gradient: resolveGradient(
            Colors.gradients?.sky || [
              Colors.vibrant?.blue || Colors.primary.DEFAULT,
              Colors.vibrant?.blueLight || Colors.primary.light,
            ],
          ),
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          textColor: isDark ? Colors.primary.dark : Colors.white,
          borderColor: isDark ? Colors.primary.dark : Colors.white,
          borderWidth: 2,
        };
      case 'ghost':
        return {
          backgroundColor: isDark
            ? 'rgba(255, 255, 255, 0.1)'
            : Colors.neutral?.offWhite || Colors.gray[100],
          textColor: isDark ? Colors.white : Colors.primary.DEFAULT,
        };
      default:
        return {
          backgroundColor: Colors.primary.DEFAULT,
          textColor: Colors.white,
          gradient: resolveGradient(
            Colors.gradients?.primary || [
              Colors.primary.DEFAULT,
              Colors.primary.light,
            ],
          ),
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: Spacing[2],
          paddingHorizontal: Spacing[4],
          borderRadius: BorderRadius.md,
          minHeight: 36,
          fontSize: FontSizes.sm,
        };
      case 'medium':
        return {
          paddingVertical: Spacing[3],
          paddingHorizontal: Spacing[6],
          borderRadius: BorderRadius.lg,
          minHeight: 44,
          fontSize: FontSizes.base,
        };
      case 'large':
        return {
          paddingVertical: Spacing[4],
          paddingHorizontal: Spacing[8],
          borderRadius: BorderRadius.xl,
          minHeight: 52,
          fontSize: FontSizes.lg,
        };
      case 'xl':
        return {
          paddingVertical: Spacing[5],
          paddingHorizontal: Spacing[10],
          borderRadius: BorderRadius['2xl'],
          minHeight: 60,
          fontSize: FontSizes.xl,
        };
      default:
        return {
          paddingVertical: Spacing[3],
          paddingHorizontal: Spacing[6],
          borderRadius: BorderRadius.lg,
          minHeight: 44,
          fontSize: FontSizes.base,
        };
    }
  };

  const handlePressIn = () => {
    if (disabled || loading) return;

    if (animated) {
      const scaleAnim = Animated.spring(scaleAnimation, {
        toValue: 0.95,
        useNativeDriver: true,
      });
      animationRefs.current.scale = scaleAnim;
      scaleAnim.start();
    }

    if (wiggleOnPress) {
      const wiggleAnim = Animated.sequence([
        Animated.timing(wiggleAnimation, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(wiggleAnimation, {
          toValue: -1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(wiggleAnimation, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(wiggleAnimation, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]);
      animationRefs.current.wiggle = wiggleAnim;
      wiggleAnim.start(() => {
        animationRefs.current.wiggle = undefined;
      });
    }
  };

  const handlePressOut = () => {
    if (disabled || loading) return;

    if (animated) {
      const scaleAnim = Animated.spring(scaleAnimation, {
        toValue: 1,
        tension: 400,
        friction: 3,
        useNativeDriver: true,
      });
      animationRefs.current.scale = scaleAnim;
      scaleAnim.start(() => {
        animationRefs.current.scale = undefined;
      });
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const rotation = wiggleAnimation.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-5deg', '5deg'],
  });

  const glowOpacity = glowAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  // Create custom text style with font family support
  const customTextStyle = {
    ...(fontFamily ? { fontFamily } : {}),
    // Remove fontWeight if custom font is provided
    ...(fontFamily ? {} : { fontWeight: FontWeights.bold as any }),
  };

  const buttonContent = (
    <View style={[styles.content, { opacity: disabled ? 0.6 : 1 }]}>
      {icon && (
        <FontAwesome
          name={icon}
          size={sizeStyles.fontSize}
          color={variantStyles.textColor}
          style={styles.icon}
        />
      )}
      <Text
        style={[
          styles.text,
          customTextStyle,
          {
            color: variantStyles.textColor,
            fontSize: sizeStyles.fontSize,
          },
          textStyle,
        ]}
      >
        {loading ? 'Loading...' : title}
      </Text>
    </View>
  );

  // Separate complex animated styles into variables
  const animatedStyle = toAnimatedStyle({
    transform: [{ scale: scaleAnimation }, { rotate: rotation }],
  });

  const glowOverlayGradientStyle = toAnimatedStyle([
    styles.glowOverlay,
    {
      opacity: glowOpacity,
      backgroundColor:
        variantStyles.gradient?.[1] ||
        variantStyles.gradient?.[0] ||
        variantStyles.backgroundColor,
    },
  ]);

  const glowOverlayStyle = toAnimatedStyle([
    styles.glowOverlay,
    {
      opacity: glowOpacity,
      backgroundColor: variantStyles.backgroundColor,
    },
  ]);

  // Updated shadow styles using modern shadow approach
  const createModernShadow = (
    color: string,
    intensity: 'light' | 'medium' | 'heavy',
  ) => {
    const shadows = {
      light: {
        shadowColor: color,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        // For React Native Web
        boxShadow: `0 2px 4px ${color}20`,
      },
      medium: {
        shadowColor: color,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
        // For React Native Web
        boxShadow: `0 4px 8px ${color}30`,
      },
      heavy: {
        shadowColor: color,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
        // For React Native Web
        boxShadow: `0 8px 16px ${color}40`,
      },
    };
    return shadows[intensity];
  };

  // Wrap complex style arrays with toAnimatedStyle
  const buttonStyle = toAnimatedStyle([
    styles.button,
    sizeStyles,
    {
      backgroundColor: variantStyles.backgroundColor,
      borderColor: variantStyles.borderColor,
      borderWidth: variantStyles.borderWidth,
    },
    createModernShadow(
      (variantStyles.gradient?.[0] as string) || variantStyles.backgroundColor,
      size === 'small'
        ? 'light'
        : size === 'large' || size === 'xl'
        ? 'heavy'
        : 'medium',
    ),
    animatedStyle,
    style,
  ]);

  if (variantStyles.gradient && variant !== 'outline' && variant !== 'ghost') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={disabled ? 1 : 0.8}
        testID={testID}
        accessibilityLabel={accessibilityLabel}
        {...props}
      >
        <Animated.View style={buttonStyle}>
          <LinearGradient
            colors={variantStyles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradient, sizeStyles]}
          >
            {glowEffect && <Animated.View style={glowOverlayGradientStyle} />}
            {buttonContent}
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={disabled ? 1 : 0.8}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      {...props}
    >
      <Animated.View style={buttonStyle}>
        {glowEffect && <Animated.View style={glowOverlayStyle} />}
        {buttonContent}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: Spacing[2],
  },
  text: {
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  glowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: BorderRadius.lg,
  },
});

export default PlayfulButton;
