// components/ui/Feedback/PlayfulAlert.tsx
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  ColorValue,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import { AlertProps } from '../types';
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

const PlayfulAlert: React.FC<AlertProps> = ({
  message,
  type = 'info',
  title,
  dismissible = true,
  onDismiss,
  icon,
  style,
  testID,
  variant = 'default',
  gradient,
  animated = true,
}) => {
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const fadeAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (animated) {
      Animated.spring(slideAnimation, {
        toValue: 1,
        tension: 300,
        friction: 8,
        useNativeDriver: true,
      }).start();

      // Subtle pulse for important alerts
      if (type === 'error' || type === 'warning') {
        const pulse = Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnimation, {
              toValue: 1.02,
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
    } else {
      slideAnimation.setValue(1);
    }
  }, [animated, type]);

  const getTypeStyles = () => {
    // Helper function to ensure gradient colors are properly typed
    const createGradient = (colors: string[]): GradientColors => {
      if (colors.length < 2) {
        return [colors[0] || '#000000', colors[0] || '#000000'];
      }
      // Ensure we have at least 2 colors and properly type them
      return [colors[0], colors[1], ...colors.slice(2)] as GradientColors;
    };

    switch (type) {
      case 'success':
        return {
          backgroundColor: Colors.vibrant?.green || Colors.success,
          iconName: 'check-circle' as const,
          iconColor: Colors.white,
          textColor: Colors.white,
          gradient: createGradient(
            Colors.gradients?.success || [
              Colors.success,
              Colors.vibrant?.greenLight || Colors.success,
            ],
          ),
        };
      case 'warning':
        return {
          backgroundColor: Colors.vibrant?.yellow || Colors.warning,
          iconName: 'exclamation-triangle' as const,
          iconColor: Colors.gray[800],
          textColor: Colors.gray[800],
          gradient: createGradient(
            Colors.gradients?.warning || [
              Colors.warning,
              Colors.vibrant?.yellowLight || Colors.warning,
            ],
          ),
        };
      case 'error':
        return {
          backgroundColor: Colors.vibrant?.orange || Colors.error,
          iconName: 'times-circle' as const,
          iconColor: Colors.white,
          textColor: Colors.white,
          gradient: createGradient(
            Colors.gradients?.fire || [
              Colors.error,
              Colors.vibrant?.pink || Colors.error,
            ],
          ),
        };
      default:
        return {
          backgroundColor: Colors.vibrant?.blue || Colors.info,
          iconName: 'info-circle' as const,
          iconColor: Colors.white,
          textColor: Colors.white,
          gradient: createGradient(
            Colors.gradients?.ocean || [
              Colors.info,
              Colors.vibrant?.blueLight || Colors.info,
            ],
          ),
        };
    }
  };

  const getVariantStyles = () => {
    const typeStyles = getTypeStyles();

    switch (variant) {
      case 'playful':
        return {
          ...typeStyles,
          useGradient: false,
          borderRadius: BorderRadius.bubble || BorderRadius.xl,
          shadow:
            createPlayfulShadow?.(typeStyles.backgroundColor, 'medium') || {},
        };
      case 'gradient':
        return {
          ...typeStyles,
          useGradient: true,
          borderRadius: BorderRadius.card || BorderRadius.xl,
          shadow:
            createPlayfulShadow?.(typeStyles.backgroundColor, 'heavy') || {},
        };
      case 'floating':
        return {
          ...typeStyles,
          useGradient: false,
          borderRadius: BorderRadius.card || BorderRadius.xl,
          shadow:
            createPlayfulShadow?.(typeStyles.backgroundColor, 'heavy') || {},
          elevation: 8,
        };
      default:
        return {
          ...typeStyles,
          useGradient: false,
          borderRadius: BorderRadius.lg,
          shadow:
            createPlayfulShadow?.(typeStyles.backgroundColor, 'light') || {},
        };
    }
  };

  const handleDismiss = () => {
    if (onDismiss) {
      Animated.timing(fadeAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        onDismiss();
      });
    }
  };

  const variantStyles = getVariantStyles();

  const translateY = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 0],
  });

  // Separate complex animated styles into variables
  const animatedStyle = toAnimatedStyle({
    opacity: fadeAnimation,
    transform: [{ translateY }, { scale: pulseAnimation }],
  });

  const alertContent = (
    <View style={styles.content}>
      <View style={styles.iconContainer}>
        <FontAwesome
          name={variantStyles.iconName}
          size={24}
          color={variantStyles.iconColor}
        />
      </View>

      <View style={styles.textContainer}>
        {title && (
          <Text style={[styles.title, { color: variantStyles.textColor }]}>
            {title}
          </Text>
        )}
        <Text style={[styles.message, { color: variantStyles.textColor }]}>
          {message}
        </Text>
      </View>

      {dismissible && (
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <FontAwesome name='times' size={16} color={variantStyles.iconColor} />
        </TouchableOpacity>
      )}
    </View>
  );

  // Wrap complex style arrays with toAnimatedStyle
  const containerStyle = toAnimatedStyle([
    styles.alert,
    {
      borderRadius: variantStyles.borderRadius,
      backgroundColor: variantStyles.useGradient
        ? 'transparent'
        : variantStyles.backgroundColor,
    },
    variantStyles.shadow,
    animatedStyle,
    style,
  ]);

  if (variantStyles.useGradient) {
    return (
      <Animated.View style={containerStyle} testID={testID}>
        <LinearGradient
          colors={variantStyles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.gradientContainer,
            { borderRadius: variantStyles.borderRadius },
          ]}
        >
          {alertContent}
        </LinearGradient>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={containerStyle} testID={testID}>
      {alertContent}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  alert: {
    marginVertical: Spacing[2],
    marginHorizontal: Spacing[4],
    overflow: 'hidden',
  },
  gradientContainer: {
    padding: Spacing[4],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing[4],
  },
  iconContainer: {
    marginRight: Spacing[3],
    marginTop: Spacing[0.5],
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold as any,
    marginBottom: Spacing[1],
  },
  message: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.normal as any,
    lineHeight: 20,
  },
  dismissButton: {
    marginLeft: Spacing[3],
    marginTop: Spacing[0.5],
    padding: Spacing[1],
  },
});

export default PlayfulAlert;
