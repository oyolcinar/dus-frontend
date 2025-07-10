// components/ui/Typography/PlayfulTitle.tsx
import React, { useRef, useEffect } from 'react';
import {
  Text,
  StyleSheet,
  Animated,
  Easing,
  useColorScheme,
} from 'react-native';
import { PlayfulTitleProps } from '../types';
import { Colors, FontSizes, FontWeights } from '../../../constants/theme';
import { toAnimatedStyle } from '../../../utils/styleTypes';

const PlayfulTitle: React.FC<PlayfulTitleProps> = ({
  children,
  level = 1,
  style,
  align = 'auto',
  color,
  numberOfLines,
  testID,
  variant = 'default',
  bounceOnMount = false,
  shadowColor,
  outlineColor,
  letterSpacing = 0,
  animated = false,
  wiggleOnMount = false,
  fontFamily,
  ...props
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const bounceAnimation = useRef(new Animated.Value(0)).current;
  const wiggleAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (bounceOnMount || animated) {
      Animated.sequence([
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(bounceAnimation, {
          toValue: 1,
          tension: 400,
          friction: 3,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnimation.setValue(1);
      bounceAnimation.setValue(1);
    }
  }, [bounceOnMount, animated]);

  useEffect(() => {
    if (wiggleOnMount) {
      const wiggle = () => {
        Animated.sequence([
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
        ]).start();
      };

      const timer = setTimeout(wiggle, 500);
      return () => clearTimeout(timer);
    }
  }, [wiggleOnMount]);

  const getLevelStyles = () => {
    // Check if a custom fontFamily is passed in style prop
    const hasCustomFont =
      style &&
      (Array.isArray(style)
        ? style.some((s) => s && typeof s === 'object' && 'fontFamily' in s)
        : typeof style === 'object' && style && 'fontFamily' in style);

    switch (level) {
      case 1:
        return {
          fontSize: FontSizes['4xl'] || 36,
          // Only apply fontWeight if no custom font is provided
          ...(hasCustomFont
            ? {}
            : { fontWeight: FontWeights.extrabold as any }),
        };
      case 2:
        return {
          fontSize: FontSizes['3xl'] || 30,
          ...(hasCustomFont ? {} : { fontWeight: FontWeights.bold as any }),
        };
      case 3:
        return {
          fontSize: FontSizes['2xl'] || 24,
          ...(hasCustomFont ? {} : { fontWeight: FontWeights.bold as any }),
        };
      case 4:
        return {
          fontSize: FontSizes.xl,
          ...(hasCustomFont ? {} : { fontWeight: FontWeights.semibold as any }),
        };
      case 5:
        return {
          fontSize: FontSizes.lg,
          ...(hasCustomFont ? {} : { fontWeight: FontWeights.semibold as any }),
        };
      case 6:
        return {
          fontSize: FontSizes.base,
          ...(hasCustomFont ? {} : { fontWeight: FontWeights.medium as any }),
        };
      default:
        return {
          fontSize: FontSizes['4xl'] || 36,
          ...(hasCustomFont
            ? {}
            : { fontWeight: FontWeights.extrabold as any }),
        };
    }
  };

  const getVariantStyles = () => {
    // Default color based on theme if not provided
    const defaultColor =
      color || (isDark ? Colors.gray[800] : Colors.gray[800]);

    switch (variant) {
      case 'bouncy':
        return {
          color: Colors.vibrant?.purple || Colors.primary.DEFAULT,
          textShadowColor: 'rgba(108, 92, 231, 0.3)',
          textShadowOffset: { width: 0, height: 2 },
          textShadowRadius: 4,
        };
      case 'gradient':
        return {
          color: isDark
            ? Colors.vibrant?.blue || Colors.primary.DEFAULT
            : Colors.vibrant?.blue || Colors.primary.DEFAULT,
          textShadowColor: isDark
            ? 'rgba(55, 66, 250, 0.3)'
            : 'rgba(55, 66, 250, 0.3)',
          textShadowOffset: { width: 0, height: 2 },
          textShadowRadius: 6,
        };
      case 'shadow':
        return {
          color: defaultColor,
          textShadowColor:
            shadowColor ||
            (isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.3)'),
          textShadowOffset: { width: 2, height: 2 },
          textShadowRadius: 4,
        };
      case 'outlined':
        return {
          color: defaultColor,
          textShadowColor:
            outlineColor || (isDark ? Colors.white : Colors.white),
          textShadowOffset: { width: 1, height: 1 },
          textShadowRadius: 0,
        };
      case 'playful':
        return {
          color: isDark
            ? Colors.vibrant?.orange || Colors.secondary.DEFAULT
            : Colors.vibrant?.orange || Colors.secondary.DEFAULT,
          textShadowColor: 'rgba(255, 107, 107, 0.4)',
          textShadowOffset: { width: 0, height: 3 },
          textShadowRadius: 8,
        };
      case 'glowing':
        return {
          color: Colors.vibrant?.green || Colors.success,
          textShadowColor: Colors.vibrant?.green || Colors.success,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 8,
        };
      case 'purple':
        return {
          color: isDark
            ? Colors.white || Colors.primary.DEFAULT
            : Colors.white || Colors.primary.DEFAULT,
          // textShadowColor: isDark
          //   ? 'rgba(168, 85, 247, 0.4)'
          //   : Colors.vibrant?.purpleDark || 'rgba(108, 92, 231, 0.4)',
          // textShadowOffset: { width: 0, height: 2 },
          // textShadowRadius: 8,
        };
      default:
        return {
          color: defaultColor,
        };
    }
  };

  const levelStyles = getLevelStyles();
  const variantStyles = getVariantStyles();

  const rotation = wiggleAnimation.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-3deg', '3deg'],
  });

  // Separate complex animated styles into variables
  const animatedStyle = toAnimatedStyle({
    opacity: fadeAnimation,
    transform: [{ scale: bounceAnimation }, { rotate: rotation }],
  });

  // Wrap complex style arrays with toAnimatedStyle
  // Custom style comes last to override internal styles
  const titleStyle = toAnimatedStyle([
    styles.title,
    levelStyles,
    variantStyles,
    {
      fontFamily,
      textAlign: align,
      letterSpacing,
    },
    animatedStyle,
    style, // Custom style should come last to override internal styles
  ]);

  return (
    <Animated.Text
      style={titleStyle}
      numberOfLines={numberOfLines}
      testID={testID}
      {...props}
    >
      {children}
    </Animated.Text>
  );
};

const styles = StyleSheet.create({
  title: {
    marginVertical: 8,
  },
});

export default PlayfulTitle;
