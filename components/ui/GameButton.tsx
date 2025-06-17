// components/ui/GameButton.tsx
import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Animated,
  Easing,
  ColorValue,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import { GameButtonProps } from './types';
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

const GameButton: React.FC<GameButtonProps> = ({
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
  gameAction,
  pulseWhenReady = false,
  confettiOnPress = false,
  ...props
}) => {
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const readyAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (pulseWhenReady && !disabled && !loading) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [pulseWhenReady, disabled, loading]);

  const getGameActionStyles = () => {
    // Helper function to ensure gradient colors are properly typed
    const createGradient = (colors: string[]): GradientColors => {
      if (colors.length < 2) {
        return [colors[0] || '#000000', colors[0] || '#000000'];
      }
      // Ensure we have at least 2 colors and properly type them
      return [colors[0], colors[1], ...colors.slice(2)] as GradientColors;
    };

    switch (gameAction) {
      case 'start':
        return {
          backgroundColor: Colors.vibrant?.green || Colors.success,
          textColor: Colors.white,
          gradient: createGradient(
            Colors.gradients?.success || [Colors.success, Colors.success],
          ),
          icon: 'play' as const,
        };
      case 'join':
        return {
          backgroundColor: Colors.vibrant?.blue || Colors.primary.DEFAULT,
          textColor: Colors.white,
          gradient: createGradient(
            Colors.gradients?.ocean || [
              Colors.primary.DEFAULT,
              Colors.primary.light,
            ],
          ),
          icon: 'users' as const,
        };
      case 'challenge':
        return {
          backgroundColor: Colors.vibrant?.orange || Colors.secondary.DEFAULT,
          textColor: Colors.white,
          gradient: createGradient(
            Colors.gradients?.sunset || [
              Colors.secondary.DEFAULT,
              Colors.secondary.light,
            ],
          ),
          icon: 'star' as const, // Changed from 'sword' to 'star'
        };
      case 'answer':
        return {
          backgroundColor: Colors.vibrant?.purple || Colors.primary.DEFAULT,
          textColor: Colors.white,
          gradient: createGradient(
            Colors.gradients?.primary || [
              Colors.primary.DEFAULT,
              Colors.primary.light,
            ],
          ),
          icon: 'check' as const,
        };
      default:
        return {
          backgroundColor: Colors.primary.DEFAULT,
          textColor: Colors.white,
          gradient: createGradient(
            Colors.gradients?.primary || [
              Colors.primary.DEFAULT,
              Colors.primary.light,
            ],
          ),
          icon: icon,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: Spacing[2],
          paddingHorizontal: Spacing[4],
          borderRadius: BorderRadius.button || BorderRadius.lg,
          minHeight: 40,
          fontSize: FontSizes.sm,
        };
      case 'medium':
        return {
          paddingVertical: Spacing[4],
          paddingHorizontal: Spacing[6],
          borderRadius: BorderRadius.button || BorderRadius.lg,
          minHeight: 50,
          fontSize: FontSizes.base,
        };
      case 'large':
        return {
          paddingVertical: Spacing[5],
          paddingHorizontal: Spacing[8],
          borderRadius: BorderRadius.bubble || BorderRadius.xl,
          minHeight: 60,
          fontSize: FontSizes.lg,
        };
      case 'xl':
        return {
          paddingVertical: Spacing[6],
          paddingHorizontal: Spacing[10],
          borderRadius: BorderRadius.bubble || BorderRadius.xl,
          minHeight: 70,
          fontSize: FontSizes.xl,
        };
      default:
        return {
          paddingVertical: Spacing[4],
          paddingHorizontal: Spacing[6],
          borderRadius: BorderRadius.button || BorderRadius.lg,
          minHeight: 50,
          fontSize: FontSizes.base,
        };
    }
  };

  const handlePressIn = () => {
    if (disabled || loading) return;

    Animated.spring(scaleAnimation, {
      toValue: 0.92,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled || loading) return;

    Animated.spring(scaleAnimation, {
      toValue: 1,
      tension: 400,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (disabled || loading) return;

    if (confettiOnPress) {
      // Trigger confetti animation
      Animated.sequence([
        Animated.timing(readyAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(readyAnimation, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    }

    onPress();
  };

  const gameActionStyles = getGameActionStyles();
  const sizeStyles = getSizeStyles();

  // Separate complex animated styles into variables
  const animatedStyle = toAnimatedStyle({
    transform: [{ scale: Animated.multiply(scaleAnimation, pulseAnimation) }],
  });

  const readyScale = readyAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  const confettiOverlayStyle = toAnimatedStyle([
    styles.confettiOverlay,
    {
      transform: [{ scale: readyScale }],
      opacity: readyAnimation,
    },
  ]);

  const buttonContent = (
    <View style={[styles.content, { opacity: disabled ? 0.6 : 1 }]}>
      {gameActionStyles.icon && (
        <FontAwesome
          name={gameActionStyles.icon}
          size={sizeStyles.fontSize * 1.2}
          color={gameActionStyles.textColor}
          style={styles.icon}
        />
      )}
      <Text
        style={[
          styles.text,
          {
            color: gameActionStyles.textColor,
            fontSize: sizeStyles.fontSize,
          },
          textStyle,
        ]}
      >
        {loading ? 'Loading...' : title}
      </Text>
    </View>
  );

  // Wrap complex style arrays with toAnimatedStyle
  const buttonStyle = toAnimatedStyle([
    styles.button,
    sizeStyles,
    createPlayfulShadow?.(
      gameActionStyles.gradient[0] as string,
      size === 'small'
        ? 'light'
        : size === 'large' || size === 'xl'
        ? 'heavy'
        : 'medium',
    ) || {},
    animatedStyle,
    style,
  ]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={disabled ? 1 : 0.8}
      testID={testID}
      {...props}
    >
      <Animated.View style={buttonStyle}>
        <LinearGradient
          colors={gameActionStyles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, sizeStyles]}
        >
          {confettiOnPress && <Animated.View style={confettiOverlayStyle} />}
          {buttonContent}
        </LinearGradient>
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
    fontWeight: FontWeights.extrabold as any,
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  confettiOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: BorderRadius.button || BorderRadius.lg,
  },
});

export default GameButton;
