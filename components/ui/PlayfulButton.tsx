// components/ui/PlayfulButton.tsx
import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Animated,
  Easing,
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

const PlayfulButton: React.FC<ButtonProps> = ({
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
  ...props
}) => {
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const wiggleAnimation = useRef(new Animated.Value(0)).current;
  const glowAnimation = useRef(new Animated.Value(0)).current;

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
      glowSequence.start();
      return () => glowSequence.stop();
    }
  }, [glowEffect]);

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: Colors.primary.DEFAULT,
          textColor: Colors.white,
          gradient: gradient || Colors.gradients.primary,
        };
      case 'secondary':
        return {
          backgroundColor: Colors.secondary.DEFAULT,
          textColor: Colors.white,
          gradient: gradient || Colors.gradients.sunset,
        };
      case 'success':
        return {
          backgroundColor: Colors.success,
          textColor: Colors.white,
          gradient: gradient || Colors.gradients.success,
        };
      case 'error':
        return {
          backgroundColor: Colors.error,
          textColor: Colors.white,
          gradient: gradient || [Colors.vibrant.orange, Colors.vibrant.pink],
        };
      case 'vibrant':
        return {
          backgroundColor: Colors.vibrant.purple,
          textColor: Colors.white,
          gradient: gradient || Colors.gradients.purple,
        };
      case 'gradient':
        return {
          backgroundColor: 'transparent',
          textColor: Colors.white,
          gradient: gradient || Colors.gradients.primary,
        };
      case 'playful':
        return {
          backgroundColor: Colors.vibrant.orange,
          textColor: Colors.white,
          gradient: gradient || Colors.gradients.candy,
        };
      case 'bouncy':
        return {
          backgroundColor: Colors.vibrant.green,
          textColor: Colors.white,
          gradient: gradient || Colors.gradients.tropical,
        };
      case 'floating':
        return {
          backgroundColor: Colors.vibrant.blue,
          textColor: Colors.white,
          gradient: gradient || Colors.gradients.sky,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          textColor: Colors.primary.DEFAULT,
          borderColor: Colors.primary.DEFAULT,
          borderWidth: 2,
        };
      case 'ghost':
        return {
          backgroundColor: Colors.neutral?.offWhite || Colors.gray[100],
          textColor: Colors.primary.DEFAULT,
        };
      default:
        return {
          backgroundColor: Colors.primary.DEFAULT,
          textColor: Colors.white,
          gradient: gradient || Colors.gradients.primary,
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
      Animated.spring(scaleAnimation, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    }

    if (wiggleOnPress) {
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
    }
  };

  const handlePressOut = () => {
    if (disabled || loading) return;

    if (animated) {
      Animated.spring(scaleAnimation, {
        toValue: 1,
        tension: 400,
        friction: 3,
        useNativeDriver: true,
      }).start();
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

  const animatedStyle = {
    transform: [{ scale: scaleAnimation }, { rotate: rotation }],
  };

  const buttonStyle = [
    styles.button,
    sizeStyles,
    {
      backgroundColor: variantStyles.backgroundColor,
      borderColor: variantStyles.borderColor,
      borderWidth: variantStyles.borderWidth,
    },
    createPlayfulShadow(
      variantStyles.gradient?.[0] || variantStyles.backgroundColor,
      size === 'small'
        ? 'light'
        : size === 'large' || size === 'xl'
        ? 'heavy'
        : 'medium',
    ),
    animatedStyle,
    style,
  ];

  if (variantStyles.gradient && variant !== 'outline' && variant !== 'ghost') {
    return (
      <TouchableOpacity
        onPress={disabled || loading ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={disabled ? 1 : 0.8}
        testID={testID}
        accessibilityLabel={accessibilityLabel}
        {...props}
      >
        <Animated.View style={buttonStyle}>
          <LinearGradient
            colors={
              typeof variantStyles.gradient === 'string'
                ? Colors.gradients[
                    variantStyles.gradient as keyof typeof Colors.gradients
                  ] || Colors.gradients.primary
                : variantStyles.gradient
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradient, sizeStyles]}
          >
            {glowEffect && (
              <Animated.View
                style={[
                  styles.glowOverlay,
                  {
                    opacity: glowOpacity,
                    backgroundColor:
                      variantStyles.gradient[1] || variantStyles.gradient[0],
                  },
                ]}
              />
            )}
            {buttonContent}
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={disabled || loading ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={disabled ? 1 : 0.8}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      {...props}
    >
      <Animated.View style={buttonStyle}>
        {glowEffect && (
          <Animated.View
            style={[
              styles.glowOverlay,
              {
                opacity: glowOpacity,
                backgroundColor: variantStyles.backgroundColor,
              },
            ]}
          />
        )}
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
    fontWeight: FontWeights.bold,
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
