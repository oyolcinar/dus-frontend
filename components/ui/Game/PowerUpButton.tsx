// components/ui/Game/PowerUpButton.tsx
import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Animated,
  Easing,
  ViewStyle,
  ColorValue,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import { PowerUpButtonProps } from '../types';
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
} from '../../../constants/theme';
import { createPlayfulShadow } from '../../../utils/styleUtils';
import { toAnimatedStyle } from '../../../utils/styleTypes';

// Helper type to ensure gradient colors are properly typed
type GradientColors = readonly [ColorValue, ColorValue, ...ColorValue[]];

const PowerUpButton: React.FC<PowerUpButtonProps> = ({
  title,
  onPress,
  powerUpType,
  count = 0,
  cost,
  available = true,
  cooldown,
  description,
  variant = 'default',
  glowColor,
  size = 'medium',
  disabled = false,
  style,
  testID,
  ...props
}) => {
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const glowAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const cooldownAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (variant === 'glowing' && available && !cooldown) {
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnimation, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
          Animated.timing(glowAnimation, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
        ]),
      );
      glow.start();
      return () => glow.stop();
    }
  }, [variant, available, cooldown]);

  useEffect(() => {
    if (variant === 'pulsing' && available && !cooldown) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.05,
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
  }, [variant, available, cooldown]);

  useEffect(() => {
    if (cooldown) {
      Animated.timing(cooldownAnimation, {
        toValue: 1,
        duration: cooldown * 1000,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start(() => {
        cooldownAnimation.setValue(0);
      });
    }
  }, [cooldown]);

  const getPowerUpStyles = () => {
    // Helper function to ensure gradient colors are properly typed
    const createGradient = (colors: string[]): GradientColors => {
      if (colors.length < 2) {
        return [colors[0] || '#000000', colors[0] || '#000000'];
      }
      // Ensure we have at least 2 colors and properly type them
      return [colors[0], colors[1], ...colors.slice(2)] as GradientColors;
    };

    const baseStyles = {
      icon: 'star' as const,
      gradient: createGradient([
        Colors.vibrant?.purple || Colors.primary.DEFAULT,
        Colors.vibrant?.purpleLight || Colors.primary.light,
      ]),
      iconColor: Colors.white,
      description: description || 'Use a power-up',
    };

    switch (powerUpType) {
      case 'hint':
        return {
          ...baseStyles,
          icon: 'lightbulb-o' as const,
          gradient: createGradient([
            Colors.vibrant?.yellow || '#FFD93D',
            Colors.vibrant?.yellowLight || '#FFE66D',
          ]),
          iconColor: Colors.gray[800],
          description: description || 'Get a helpful hint',
        };
      case 'skip':
        return {
          ...baseStyles,
          icon: 'forward' as const,
          gradient: createGradient([
            Colors.vibrant?.blue || Colors.info,
            Colors.vibrant?.blueLight || Colors.info,
          ]),
          description: description || 'Skip this question',
        };
      case 'freeze':
        return {
          ...baseStyles,
          icon: 'pause' as const,
          gradient: createGradient([
            Colors.vibrant?.mint || '#00CEC9',
            Colors.vibrant?.blue || Colors.info,
          ]),
          description: description || 'Freeze the timer',
        };
      case 'double':
        return {
          ...baseStyles,
          icon: 'diamond' as const,
          gradient: createGradient([
            Colors.vibrant?.orange || Colors.warning,
            Colors.vibrant?.orangeLight || Colors.warning,
          ]),
          description: description || 'Double your points',
        };
      case 'extra-time':
        return {
          ...baseStyles,
          icon: 'clock-o' as const,
          gradient: createGradient([
            Colors.vibrant?.green || Colors.success,
            Colors.vibrant?.greenLight || Colors.success,
          ]),
          description: description || 'Add extra time',
        };
      default:
        return baseStyles;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          width: 60,
          height: 60,
          iconSize: 20,
          fontSize: FontSizes.xs,
          borderRadius: BorderRadius.lg,
        };
      case 'medium':
        return {
          width: 80,
          height: 80,
          iconSize: 28,
          fontSize: FontSizes.sm,
          borderRadius: BorderRadius.xl,
        };
      case 'large':
        return {
          width: 100,
          height: 100,
          iconSize: 36,
          fontSize: FontSizes.base,
          borderRadius: BorderRadius['2xl'],
        };
      default:
        return {
          width: 80,
          height: 80,
          iconSize: 28,
          fontSize: FontSizes.sm,
          borderRadius: BorderRadius.xl,
        };
    }
  };

  const handlePressIn = () => {
    if (!disabled && available && !cooldown) {
      Animated.spring(scaleAnimation, {
        toValue: 0.9,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (!disabled && available && !cooldown) {
      Animated.spring(scaleAnimation, {
        toValue: 1,
        tension: 400,
        friction: 3,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePress = () => {
    if (!disabled && available && !cooldown && onPress) {
      onPress();
    }
  };

  const powerUpStyles = getPowerUpStyles();
  const sizeStyles = getSizeStyles();
  const isDisabled = disabled || !available || !!cooldown;

  const glowOpacity = glowAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.8],
  });

  const cooldownProgress = cooldownAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 100],
  });

  // Separate complex animated styles into variables
  const animatedStyle = toAnimatedStyle({
    transform: [{ scale: Animated.multiply(scaleAnimation, pulseAnimation) }],
    opacity: isDisabled ? 0.5 : 1,
  });

  const cooldownHeightStyle = toAnimatedStyle({
    height: cooldownProgress.interpolate({
      inputRange: [0, 100],
      outputRange: ['100%', '0%'],
      extrapolate: 'clamp',
    }),
  });

  const glowOverlayStyle = toAnimatedStyle([
    styles.glowOverlay,
    {
      borderRadius: sizeStyles.borderRadius,
      backgroundColor: glowColor || powerUpStyles.gradient[1],
      opacity: glowOpacity,
    },
  ]);

  // Wrap complex style arrays with toAnimatedStyle
  const containerStyle = toAnimatedStyle([
    styles.container,
    {
      width: sizeStyles.width,
      height: sizeStyles.height,
      borderRadius: sizeStyles.borderRadius,
    },
    createPlayfulShadow?.(
      glowColor || (powerUpStyles.gradient[0] as string),
      size === 'small' ? 'light' : size === 'large' ? 'heavy' : 'medium',
    ) || {},
    animatedStyle,
    style,
  ]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={isDisabled ? 1 : 0.8}
      disabled={isDisabled}
      testID={testID}
      {...props}
    >
      <Animated.View style={containerStyle}>
        {/* Glow Effect */}
        {variant === 'glowing' && <Animated.View style={glowOverlayStyle} />}

        {/* Main Button */}
        <LinearGradient
          colors={powerUpStyles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, { borderRadius: sizeStyles.borderRadius }]}
        >
          {/* Cooldown Overlay */}
          {cooldown && (
            <Animated.View
              style={[
                styles.cooldownOverlay,
                {
                  borderRadius: sizeStyles.borderRadius,
                },
                cooldownHeightStyle,
              ]}
            />
          )}

          {/* Content */}
          <View style={styles.content}>
            {/* Icon */}
            <FontAwesome
              name={powerUpStyles.icon}
              size={sizeStyles.iconSize}
              color={powerUpStyles.iconColor}
              style={styles.icon}
            />

            {/* Count Badge */}
            {count > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{count}</Text>
              </View>
            )}

            {/* Cost Badge */}
            {cost && (
              <View style={styles.costBadge}>
                <FontAwesome
                  name='diamond'
                  size={10}
                  color={Colors.vibrant?.yellow || '#FFD93D'}
                />
                <Text style={styles.costText}>{cost}</Text>
              </View>
            )}

            {/* Cooldown Timer */}
            {cooldown && (
              <View style={styles.cooldownTimer}>
                <Text style={styles.cooldownText}>{Math.ceil(cooldown)}s</Text>
              </View>
            )}
          </View>

          {/* Title */}
          {title && (
            <Text
              style={[
                styles.title,
                {
                  fontSize: sizeStyles.fontSize,
                  color: powerUpStyles.iconColor,
                },
              ]}
            >
              {title}
            </Text>
          )}
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  glowOverlay: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    zIndex: -1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cooldownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 1,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 2,
  },
  icon: {
    marginBottom: Spacing[1],
  },
  countBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.vibrant?.green || Colors.success,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  countText: {
    color: Colors.white,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold as any,
  },
  costBadge: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: Colors.gray[800],
    borderRadius: 12,
    paddingHorizontal: Spacing[1],
    paddingVertical: Spacing[0.5],
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  costText: {
    color: Colors.white,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold as any,
    marginLeft: 2,
  },
  cooldownTimer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cooldownText: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold as any,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  title: {
    fontWeight: FontWeights.semibold as any,
    textAlign: 'center',
    marginTop: Spacing[1],
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});

export default PowerUpButton;
