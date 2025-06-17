// components/ui/GlassCard.tsx
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { BlurView } from 'expo-blur';
import { CardProps } from './types';
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
} from '../../constants/theme';
import { toAnimatedStyle } from '../../utils/styleTypes';

interface GlassCardProps extends CardProps {
  blurIntensity?: number;
  tint?: 'light' | 'dark' | 'default';
  shimmerEffect?: boolean;
  borderGlow?: boolean;
  glowColor?: string;
}

const GlassCard: React.FC<GlassCardProps> = ({
  title,
  children,
  style,
  titleStyle,
  padding = 'medium',
  testID,
  blurIntensity = 20,
  tint = 'light',
  shimmerEffect = false,
  borderGlow = false,
  glowColor,
  animated = false,
  floatingAnimation = false,
  ...props
}) => {
  const floatAnimation = useRef(new Animated.Value(0)).current;
  const shimmerAnimation = useRef(new Animated.Value(0)).current;
  const glowAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (floatingAnimation) {
      const float = Animated.loop(
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
      float.start();
      return () => float.stop();
    }
  }, [floatingAnimation]);

  useEffect(() => {
    if (shimmerEffect) {
      const shimmer = Animated.loop(
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      shimmer.start();
      return () => shimmer.stop();
    }
  }, [shimmerEffect]);

  useEffect(() => {
    if (borderGlow) {
      const glow = Animated.loop(
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
      glow.start();
      return () => glow.stop();
    }
  }, [borderGlow]);

  const getPaddingStyles = () => {
    switch (padding) {
      case 'none':
        return { padding: 0 };
      case 'small':
        return { padding: Spacing[3] };
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

  const getTintStyles = () => {
    switch (tint) {
      case 'light':
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          borderColor: 'rgba(255, 255, 255, 0.3)',
          textColor: Colors.gray[800],
          titleColor: Colors.gray[900],
        };
      case 'dark':
        return {
          backgroundColor: 'rgba(0, 0, 0, 0.15)',
          borderColor: 'rgba(255, 255, 255, 0.2)',
          textColor: Colors.white,
          titleColor: Colors.white,
        };
      default:
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderColor: 'rgba(255, 255, 255, 0.25)',
          textColor: Colors.gray[700],
          titleColor: Colors.gray[800],
        };
    }
  };

  const paddingStyles = getPaddingStyles();
  const tintStyles = getTintStyles();

  const translateY = floatAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const shimmerTranslateX = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  const glowOpacity = glowAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  // Separate complex animated styles into variables
  const animatedStyle = toAnimatedStyle({
    transform: [{ translateY }],
  });

  const glowBorderStyle = toAnimatedStyle([
    styles.glowBorder,
    {
      borderColor:
        glowColor || Colors.vibrant?.purple || Colors.primary.DEFAULT,
      opacity: glowOpacity,
    },
  ]);

  const shimmerStyle = toAnimatedStyle([
    styles.shimmer,
    {
      transform: [{ translateX: shimmerTranslateX }],
    },
  ]);

  // Wrap complex style arrays with toAnimatedStyle
  const containerStyle = toAnimatedStyle([
    styles.container,
    animatedStyle,
    style,
  ]);

  return (
    <Animated.View style={containerStyle} testID={testID} {...props}>
      {/* Glow Border */}
      {borderGlow && <Animated.View style={glowBorderStyle} />}

      {/* Glass Background with Blur */}
      <BlurView
        intensity={blurIntensity}
        tint={tint}
        style={styles.blurContainer}
      >
        <View
          style={[
            styles.glass,
            {
              backgroundColor: tintStyles.backgroundColor,
              borderColor: tintStyles.borderColor,
            },
          ]}
        >
          {/* Shimmer Effect */}
          {shimmerEffect && <Animated.View style={shimmerStyle} />}

          {/* Content */}
          <View style={paddingStyles}>
            {title && (
              <View style={styles.header}>
                <Text
                  style={[
                    styles.title,
                    {
                      color: tintStyles.titleColor,
                    },
                    titleStyle,
                  ]}
                >
                  {title}
                </Text>
              </View>
            )}

            <View style={[styles.content]}>{children}</View>
          </View>
        </View>
      </BlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.card || BorderRadius.xl,
    overflow: 'hidden',
  },
  blurContainer: {
    borderRadius: BorderRadius.card || BorderRadius.xl,
    overflow: 'hidden',
  },
  glass: {
    borderWidth: 1,
    borderRadius: BorderRadius.card || BorderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  glowBorder: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderWidth: 2,
    borderRadius: (BorderRadius.card || BorderRadius.xl) + 2,
    zIndex: -1,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ skewX: '-20deg' }],
  },
  header: {
    marginBottom: Spacing[3],
    paddingBottom: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold as any,
  },
  content: {
    flex: 1,
  },
});

export default GlassCard;
