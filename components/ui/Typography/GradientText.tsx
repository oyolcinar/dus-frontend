// components/ui/Typography/GradientText.tsx
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  ColorValue,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { GradientTextProps } from '../types';
import { Colors, FontSizes, FontWeights } from '../../../constants/theme';
import { toAnimatedStyle } from '../../../utils/styleTypes';

// Helper type to ensure gradient colors are properly typed
type GradientColors = readonly [ColorValue, ColorValue, ...ColorValue[]];

const GradientText: React.FC<GradientTextProps> = ({
  children,
  gradient,
  style,
  animated = false,
  shimmerEffect = false,
  testID,
}) => {
  const shimmerAnimation = useRef(new Animated.Value(0)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnimation.setValue(1);
    }
  }, [animated]);

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

  const getGradientColors = (): GradientColors => {
    // Helper function to ensure gradient colors are properly typed
    const createGradient = (colors: string[]): GradientColors => {
      if (colors.length < 2) {
        return [colors[0] || '#000000', colors[0] || '#000000'];
      }
      // Ensure we have at least 2 colors and properly type them
      return [colors[0], colors[1], ...colors.slice(2)] as GradientColors;
    };

    if (typeof gradient === 'string') {
      const gradientColors = Colors.gradients?.[
        gradient as keyof typeof Colors.gradients
      ] ||
        Colors.gradients?.primary || [
          Colors.primary.DEFAULT,
          Colors.primary.light,
        ];
      return createGradient(gradientColors);
    }

    if (gradient?.colors) {
      return createGradient(gradient.colors);
    }

    const defaultColors = Colors.gradients?.primary || [
      Colors.primary.DEFAULT,
      Colors.primary.light,
    ];
    return createGradient(defaultColors);
  };

  const getGradientDirection = () => {
    if (typeof gradient === 'object' && gradient?.start && gradient?.end) {
      return {
        start: gradient.start,
        end: gradient.end,
      };
    }

    return {
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0 },
    };
  };

  const gradientColors = getGradientColors();
  const gradientDirection = getGradientDirection();

  const shimmerTranslateX = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  // Create shimmer colors with proper typing
  const shimmerColors: GradientColors = [
    'transparent',
    'rgba(255, 255, 255, 0.8)',
    'transparent',
  ];

  // Separate complex animated styles into variables
  const containerStyle = toAnimatedStyle([
    styles.container,
    {
      opacity: fadeAnimation,
    },
  ]);

  const fallbackTextStyle = toAnimatedStyle([
    styles.fallbackText,
    {
      color: gradientColors[0],
      opacity: fadeAnimation,
    },
    style,
  ]);

  const shimmerStyle = toAnimatedStyle([
    styles.shimmer,
    {
      transform: [{ translateX: shimmerTranslateX }],
    },
  ]);

  // Fallback for platforms that don't support MaskedView
  const renderFallback = () => (
    <Animated.Text style={fallbackTextStyle} testID={testID}>
      {children}
    </Animated.Text>
  );

  // Try to render with MaskedView for gradient effect
  try {
    return (
      <Animated.View style={containerStyle} testID={testID}>
        <MaskedView
          style={styles.maskedView}
          maskElement={
            <View style={styles.maskContainer}>
              <Text style={[styles.maskText, style]}>{children}</Text>
            </View>
          }
        >
          <LinearGradient
            colors={gradientColors}
            start={gradientDirection.start}
            end={gradientDirection.end}
            style={styles.gradient}
          >
            <Text style={[styles.gradientText, style]}>{children}</Text>
          </LinearGradient>

          {shimmerEffect && (
            <Animated.View style={shimmerStyle}>
              <LinearGradient
                colors={shimmerColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.shimmerGradient}
              />
            </Animated.View>
          )}
        </MaskedView>
      </Animated.View>
    );
  } catch (error) {
    // Fallback if MaskedView is not available
    return renderFallback();
  }
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
  },
  maskedView: {
    flex: 1,
    flexDirection: 'row',
    height: 'auto',
  },
  maskContainer: {
    backgroundColor: 'transparent',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  maskText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold as any,
    textAlign: 'center',
    backgroundColor: 'transparent',
    color: 'black', // This will be masked
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold as any,
    textAlign: 'center',
    backgroundColor: 'transparent',
    color: 'transparent', // This will show the gradient
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 100,
  },
  shimmerGradient: {
    flex: 1,
    transform: [{ skewX: '-20deg' }],
  },
  fallbackText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold as any,
    textAlign: 'center',
  },
});

export default GradientText;
