// components/ui/Timer.tsx
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  ColorValue,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { TimerProps } from './types';
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

const Timer: React.FC<TimerProps> = ({
  duration,
  onTimeUp,
  onTick,
  variant = 'default',
  warningThreshold = 10,
  size = 'medium',
  animated = true,
  pulseWhenUrgent = true,
  style,
  testID,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isRunning, setIsRunning] = useState(true);
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const urgentAnimation = useRef(new Animated.Value(0)).current;
  const circularProgress = useRef(new Animated.Value(duration)).current;

  useEffect(() => {
    let interval: number;

    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1;
          onTick?.(newTime);

          if (animated) {
            Animated.timing(circularProgress, {
              toValue: newTime,
              duration: 1000,
              useNativeDriver: false,
            }).start();
          }

          if (newTime === 0) {
            setIsRunning(false);
            onTimeUp?.();
          }

          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeRemaining, onTick, onTimeUp, animated]);

  useEffect(() => {
    const isUrgent = timeRemaining <= warningThreshold && timeRemaining > 0;

    if (isUrgent && pulseWhenUrgent) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.15,
            duration: 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 300,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );

      const urgent = Animated.loop(
        Animated.timing(urgentAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: false,
        }),
      );

      pulse.start();
      urgent.start();

      return () => {
        pulse.stop();
        urgent.stop();
      };
    } else {
      pulseAnimation.setValue(1);
      urgentAnimation.setValue(0);
    }
  }, [timeRemaining, warningThreshold, pulseWhenUrgent]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const getVariantStyles = () => {
    const isUrgent = timeRemaining <= warningThreshold;
    const isExpired = timeRemaining === 0;

    // Helper function to ensure gradient colors are properly typed
    const createGradient = (colors: string[]): GradientColors => {
      if (colors.length < 2) {
        return [colors[0] || '#000000', colors[0] || '#000000'];
      }
      // Ensure we have at least 2 colors and properly type them
      return [colors[0], colors[1], ...colors.slice(2)] as GradientColors;
    };

    if (isExpired) {
      return {
        backgroundColor: Colors.error,
        textColor: Colors.white,
        iconColor: Colors.white,
        borderColor: Colors.vibrant?.orange || Colors.error,
        gradient: null,
      };
    }

    if (isUrgent) {
      return {
        backgroundColor: Colors.vibrant?.orange || Colors.warning,
        textColor: Colors.white,
        iconColor: Colors.white,
        borderColor: Colors.vibrant?.orange || Colors.warning,
        gradient: null,
      };
    }

    switch (variant) {
      case 'default':
        return {
          backgroundColor: Colors.white,
          textColor: Colors.gray[800],
          iconColor: Colors.gray[600],
          borderColor: Colors.gray[300],
          gradient: null,
        };
      case 'urgent':
        return {
          backgroundColor: Colors.vibrant?.orange || Colors.warning,
          textColor: Colors.white,
          iconColor: Colors.white,
          borderColor: Colors.vibrant?.orange || Colors.warning,
          gradient: null,
        };
      case 'gradient':
        return {
          backgroundColor: 'transparent',
          textColor: Colors.white,
          iconColor: Colors.white,
          borderColor: 'transparent',
          gradient: createGradient(
            Colors.gradients?.ocean || [
              Colors.primary.DEFAULT,
              Colors.primary.light,
            ],
          ),
        };
      case 'circular':
        return {
          backgroundColor: Colors.white,
          textColor: Colors.gray[800],
          iconColor: Colors.gray[600],
          borderColor: Colors.gray[300],
          gradient: null,
          isCircular: true,
        };
      default:
        return {
          backgroundColor: Colors.white,
          textColor: Colors.gray[800],
          iconColor: Colors.gray[600],
          borderColor: Colors.gray[300],
          gradient: null,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          padding: Spacing[2],
          fontSize: FontSizes.sm,
          iconSize: 16,
          borderRadius: BorderRadius.md,
          circularSize: 60,
        };
      case 'medium':
        return {
          padding: Spacing[3],
          fontSize: FontSizes.lg,
          iconSize: 20,
          borderRadius: BorderRadius.lg,
          circularSize: 80,
        };
      case 'large':
        return {
          padding: Spacing[4],
          fontSize: FontSizes.xl,
          iconSize: 24,
          borderRadius: BorderRadius.xl,
          circularSize: 100,
        };
      default:
        return {
          padding: Spacing[3],
          fontSize: FontSizes.lg,
          iconSize: 20,
          borderRadius: BorderRadius.lg,
          circularSize: 80,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const progress = duration > 0 ? timeRemaining / duration : 0;
  const urgentBackgroundColor = urgentAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [
      variantStyles.backgroundColor,
      Colors.vibrant?.pink || Colors.error,
    ],
  });

  // Separate complex animated styles into variables
  const animatedStyle = toAnimatedStyle({
    transform: [{ scale: pulseAnimation }],
    backgroundColor:
      timeRemaining <= warningThreshold
        ? urgentBackgroundColor
        : variantStyles.backgroundColor,
  });

  if (variantStyles.isCircular) {
    const circumference = 2 * Math.PI * (sizeStyles.circularSize / 2 - 10);
    const strokeDashoffset = circumference * (1 - progress);

    // Wrap complex style arrays with toAnimatedStyle
    const circularContainerStyle = toAnimatedStyle([
      styles.circularContainer,
      {
        width: sizeStyles.circularSize,
        height: sizeStyles.circularSize,
      },
      animatedStyle,
      style,
    ]);

    return (
      <Animated.View style={circularContainerStyle} testID={testID}>
        <View style={styles.circularTimer}>
          <FontAwesome
            name={'clock-o' as const}
            size={sizeStyles.iconSize}
            color={variantStyles.iconColor}
            style={styles.icon}
          />
          <Text
            style={[
              styles.timeText,
              {
                color: variantStyles.textColor,
                fontSize: sizeStyles.fontSize,
              },
            ]}
          >
            {formatTime(timeRemaining)}
          </Text>
        </View>
      </Animated.View>
    );
  }

  // Wrap complex style arrays with toAnimatedStyle
  const timerStyle = toAnimatedStyle([
    styles.timer,
    {
      padding: sizeStyles.padding,
      borderRadius: sizeStyles.borderRadius,
      borderColor: variantStyles.borderColor,
      borderWidth: 2,
    },
    createPlayfulShadow?.(variantStyles.borderColor, 'medium') || {},
    animatedStyle,
    style,
  ]);

  return (
    <Animated.View style={timerStyle} testID={testID}>
      <View style={styles.content}>
        <FontAwesome
          name={'clock-o' as const}
          size={sizeStyles.iconSize}
          color={variantStyles.iconColor}
          style={styles.icon}
        />
        <Text
          style={[
            styles.timeText,
            {
              color: variantStyles.textColor,
              fontSize: sizeStyles.fontSize,
            },
          ]}
        >
          {formatTime(timeRemaining)}
        </Text>
      </View>

      {timeRemaining <= warningThreshold && (
        <View style={styles.warningBadge}>
          <FontAwesome
            name={'exclamation-triangle' as const}
            size={12}
            color={Colors.white}
          />
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  timer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  circularContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  circularTimer: {
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
  timeText: {
    fontWeight: FontWeights.bold as any,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  warningBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.full,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Timer;
