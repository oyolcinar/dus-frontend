// components/ui/AnimatedCounter.tsx
import React, { useRef, useEffect, useState } from 'react';
import {
  Text,
  StyleSheet,
  Animated,
  Easing,
  TextStyle,
  StyleProp,
} from 'react-native';
import { Colors, FontSizes, FontWeights } from '../../constants/theme';
import { toAnimatedStyle } from '../../utils/styleTypes';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  style?: StyleProp<TextStyle>;
  textStyle?: StyleProp<TextStyle>;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  separator?: string;
  animateOnMount?: boolean;
  bounceOnUpdate?: boolean;
  colorTransition?: boolean;
  size?: 'small' | 'medium' | 'large' | 'xl';
  variant?: 'default' | 'gradient' | 'vibrant';
  fontFamily?: string;
  testID?: string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1000,
  style,
  textStyle,
  prefix = '',
  suffix = '',
  decimals = 0,
  separator = ',',
  animateOnMount = true,
  bounceOnUpdate = true,
  colorTransition = false,
  size = 'medium',
  variant = 'default',
  fontFamily,
  testID,
}) => {
  const [displayValue, setDisplayValue] = useState(animateOnMount ? 0 : value);
  const countAnimation = useRef(
    new Animated.Value(animateOnMount ? 0 : value),
  ).current;
  const bounceAnimation = useRef(new Animated.Value(1)).current;
  const colorAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    countAnimation.addListener(({ value: animatedValue }) => {
      setDisplayValue(animatedValue);
    });

    return () => {
      countAnimation.removeAllListeners();
    };
  }, []);

  useEffect(() => {
    if (bounceOnUpdate) {
      Animated.sequence([
        Animated.timing(bounceAnimation, {
          toValue: 1.1,
          duration: 150,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(bounceAnimation, {
          toValue: 1,
          tension: 400,
          friction: 3,
          useNativeDriver: true,
        }),
      ]).start();
    }

    if (colorTransition) {
      Animated.timing(colorAnimation, {
        toValue: value > displayValue ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }

    Animated.timing(countAnimation, {
      toValue: value,
      duration: duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [value, duration, bounceOnUpdate, colorTransition]);

  const formatNumber = (num: number) => {
    const fixedNum = Number(num.toFixed(decimals));
    const parts = fixedNum.toString().split('.');

    // Add thousand separators
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);

    return parts.join('.');
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          fontSize: FontSizes.sm,
          fontWeight: FontWeights.medium as any,
        };
      case 'medium':
        return {
          fontSize: FontSizes.lg,
          fontWeight: FontWeights.semibold as any,
        };
      case 'large':
        return {
          fontSize: FontSizes['2xl'],
          fontWeight: FontWeights.bold as any,
        };
      case 'xl':
        return {
          fontSize: FontSizes['4xl'],
          fontWeight: FontWeights.extrabold as any,
        };
      default:
        return {
          fontSize: FontSizes.lg,
          fontWeight: FontWeights.semibold as any,
        };
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'vibrant':
        return {
          color: Colors.vibrant?.purple || Colors.primary.DEFAULT,
        };
      case 'gradient':
        return {
          // Note: True gradient text requires additional implementation
          // For now, we'll use a vibrant color
          color: Colors.vibrant?.blue || Colors.primary.DEFAULT,
        };
      default:
        return {
          color: Colors.gray[800],
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();

  // Create custom font style with font family support
  const customFontStyle = {
    ...(fontFamily ? { fontFamily } : {}),
    // Remove fontWeight if custom font is provided to avoid conflicts
    ...(fontFamily ? {} : { fontWeight: sizeStyles.fontWeight }),
  };

  const animatedTextColor = colorTransition
    ? colorAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [
          variantStyles.color,
          Colors.vibrant?.green || Colors.success,
        ],
      })
    : variantStyles.color;

  // Separate complex animated styles into variables
  const animatedStyle = toAnimatedStyle({
    transform: [{ scale: bounceAnimation }],
    color: colorTransition ? animatedTextColor : variantStyles.color,
  });

  // Wrap complex style arrays with toAnimatedStyle
  const counterStyle = toAnimatedStyle([
    styles.counter,
    sizeStyles,
    customFontStyle,
    animatedStyle,
    style,
    textStyle,
  ]);

  return (
    <Animated.Text style={counterStyle} testID={testID}>
      {prefix}
      {formatNumber(displayValue)}
      {suffix}
    </Animated.Text>
  );
};

const styles = StyleSheet.create({
  counter: {
    textAlign: 'center',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
});

export default AnimatedCounter;
