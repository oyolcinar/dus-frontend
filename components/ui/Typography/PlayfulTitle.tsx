// components/ui/Typography/PlayfulTitle.tsx
import React, { useRef, useEffect } from 'react';
import { Text, StyleSheet, Animated, Easing } from 'react-native';
import { PlayfulTitleProps } from '../types';
import { Colors, FontSizes, FontWeights } from '../../../constants/theme';

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
  ...props
}) => {
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
    switch (level) {
      case 1:
        return {
          fontSize: FontSizes['4xl'] || 36,
          fontWeight: FontWeights.extrabold,
        };
      case 2:
        return {
          fontSize: FontSizes['3xl'] || 30,
          fontWeight: FontWeights.bold,
        };
      case 3:
        return {
          fontSize: FontSizes['2xl'] || 24,
          fontWeight: FontWeights.bold,
        };
      case 4:
        return {
          fontSize: FontSizes.xl,
          fontWeight: FontWeights.semibold,
        };
      case 5:
        return {
          fontSize: FontSizes.lg,
          fontWeight: FontWeights.semibold,
        };
      case 6:
        return {
          fontSize: FontSizes.base,
          fontWeight: FontWeights.medium,
        };
      default:
        return {
          fontSize: FontSizes['4xl'] || 36,
          fontWeight: FontWeights.extrabold,
        };
    }
  };

  const getVariantStyles = () => {
    const baseColor = color || Colors.gray[800];

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
          color: Colors.vibrant?.blue || Colors.primary.DEFAULT,
          textShadowColor: 'rgba(55, 66, 250, 0.3)',
          textShadowOffset: { width: 0, height: 2 },
          textShadowRadius: 6,
        };
      case 'shadow':
        return {
          color: baseColor,
          textShadowColor: shadowColor || 'rgba(0, 0, 0, 0.3)',
          textShadowOffset: { width: 2, height: 2 },
          textShadowRadius: 4,
        };
      case 'outlined':
        return {
          color: baseColor,
          textShadowColor: outlineColor || Colors.white,
          textShadowOffset: { width: 1, height: 1 },
          textShadowRadius: 0,
        };
      case 'playful':
        return {
          color: Colors.vibrant?.orange || Colors.secondary.DEFAULT,
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
      default:
        return {
          color: baseColor,
        };
    }
  };

  const levelStyles = getLevelStyles();
  const variantStyles = getVariantStyles();

  const rotation = wiggleAnimation.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-3deg', '3deg'],
  });

  const animatedStyle = {
    opacity: fadeAnimation,
    transform: [{ scale: bounceAnimation }, { rotate: rotation }],
  };

  return (
    <Animated.Text
      style={[
        styles.title,
        levelStyles,
        variantStyles,
        {
          textAlign: align,
          letterSpacing,
        },
        animatedStyle,
        style,
      ]}
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
