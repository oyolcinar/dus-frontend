// components/ui/PlayfulCard.tsx
import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Text, Animated, Easing } from 'react-native';
import LinearGradient from 'expo-linear-gradient';
import { CardProps } from './types';
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
} from '../../constants/theme';
import { createPlayfulShadow } from '../../utils/styleUtils';

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
  ...props
}) => {
  const floatAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const glowAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (floatingAnimation) {
      const float = Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnimation, {
            toValue: 1,
            duration: 3000,
            easing: Easing.inOut(Easing.sine),
            useNativeDriver: true,
          }),
          Animated.timing(floatAnimation, {
            toValue: 0,
            duration: 3000,
            easing: Easing.inOut(Easing.sine),
            useNativeDriver: true,
          }),
        ]),
      );
      float.start();
      return () => float.stop();
    }
  }, [floatingAnimation]);

  useEffect(() => {
    if (pulseEffect) {
      const pulse = Animated.loop(
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
      pulse.start();
      return () => pulse.stop();
    }
  }, [pulseEffect]);

  useEffect(() => {
    if (borderGlow) {
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnimation, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.sine),
            useNativeDriver: false,
          }),
          Animated.timing(glowAnimation, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.sine),
            useNativeDriver: false,
          }),
        ]),
      );
      glow.start();
      return () => glow.stop();
    }
  }, [borderGlow]);

  const getVariantStyles = () => {
    switch (variant) {
      case 'default':
        return {
          backgroundColor: Colors.white,
          borderColor: Colors.gray[200],
          gradient: null,
        };
      case 'outlined':
        return {
          backgroundColor: Colors.white,
          borderColor: Colors.gray[300],
          borderWidth: 1,
          gradient: null,
        };
      case 'elevated':
        return {
          backgroundColor: Colors.white,
          gradient: null,
          shadow: createPlayfulShadow(
            Colors.shadows?.medium || Colors.gray[400],
            'heavy',
          ),
        };
      case 'playful':
        return {
          backgroundColor: Colors.white,
          gradient: null,
          shadow: createPlayfulShadow(
            Colors.vibrant?.purple || Colors.primary.DEFAULT,
            'medium',
          ),
        };
      case 'glass':
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          borderColor: 'rgba(255, 255, 255, 0.3)',
          borderWidth: 1,
          gradient: null,
        };
      case 'game':
        return {
          backgroundColor: Colors.white,
          gradient: null,
          shadow: createPlayfulShadow(
            Colors.vibrant?.orange || Colors.secondary.DEFAULT,
            'heavy',
          ),
        };
      case 'floating':
        return {
          backgroundColor: Colors.white,
          gradient: null,
          shadow: createPlayfulShadow(
            Colors.vibrant?.blue || Colors.primary.DEFAULT,
            'heavy',
          ),
        };
      case 'gradient':
        return {
          backgroundColor: 'transparent',
          gradient: gradient ||
            Colors.gradients?.primary || [
              Colors.primary.DEFAULT,
              Colors.primary.light,
            ],
        };
      default:
        return {
          backgroundColor: Colors.white,
          borderColor: Colors.gray[200],
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

  const animatedStyle = {
    transform: [{ translateY: translateY }, { scale: pulseAnimation }],
  };

  const cardContent = (
    <View style={[paddingStyles]}>
      {title && (
        <View style={styles.header}>
          <Text style={[styles.title, titleStyle]}>{title}</Text>
        </View>
      )}
      <View style={styles.content}>{children}</View>
    </View>
  );

  const baseCardStyle = [
    styles.card,
    {
      backgroundColor: variantStyles.backgroundColor,
      borderColor: variantStyles.borderColor,
      borderWidth: variantStyles.borderWidth,
    },
    variantStyles.shadow,
    animatedStyle,
    style,
  ];

  if (variantStyles.gradient) {
    return (
      <Animated.View style={baseCardStyle} testID={testID} {...props}>
        <LinearGradient
          colors={
            typeof variantStyles.gradient === 'string'
              ? Colors.gradients?.[
                  variantStyles.gradient as keyof typeof Colors.gradients
                ] || Colors.gradients?.primary
              : variantStyles.gradient
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientContainer}
        >
          {borderGlow && (
            <Animated.View
              style={[
                styles.glowBorder,
                {
                  opacity: glowOpacity,
                  borderColor:
                    variantStyles.gradient[1] || variantStyles.gradient[0],
                },
              ]}
            />
          )}
          {cardContent}
        </LinearGradient>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={baseCardStyle} testID={testID} {...props}>
      {borderGlow && (
        <Animated.View
          style={[
            styles.glowBorder,
            {
              opacity: glowOpacity,
              borderColor: Colors.vibrant?.purple || Colors.primary.DEFAULT,
            },
          ]}
        />
      )}
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
    borderBottomColor: Colors.gray[200],
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.gray[800],
  },
  content: {
    flex: 1,
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
