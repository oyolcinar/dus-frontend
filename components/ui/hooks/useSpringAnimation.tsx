// components/ui/hooks/useSpringAnimation.ts
import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

interface UseSpringAnimationOptions {
  initialValue?: number;
  autoStart?: boolean;
  toValue?: number;
  tension?: number;
  friction?: number;
  useNativeDriver?: boolean;
  onComplete?: () => void;
}

// Simplified interpolation config that matches React Native's expectations
interface InterpolationConfig {
  inputRange: number[];
  outputRange: number[] | string[];
  extrapolate?: 'extend' | 'clamp' | 'identity';
}

export const useSpringAnimation = (options: UseSpringAnimationOptions = {}) => {
  const {
    initialValue = 0,
    autoStart = false,
    toValue = 1,
    tension = 400,
    friction = 3,
    useNativeDriver = true,
    onComplete,
  } = options;

  const animatedValue = useRef(new Animated.Value(initialValue)).current;

  useEffect(() => {
    if (autoStart) {
      Animated.spring(animatedValue, {
        toValue,
        tension,
        friction,
        useNativeDriver,
      }).start(onComplete);
    }
  }, [autoStart, toValue, tension, friction, useNativeDriver, onComplete]);

  const animate = (config?: {
    toValue?: number;
    tension?: number;
    friction?: number;
    useNativeDriver?: boolean;
    onComplete?: () => void;
  }) => {
    const springConfig = {
      toValue: config?.toValue ?? toValue,
      tension: config?.tension ?? tension,
      friction: config?.friction ?? friction,
      useNativeDriver: config?.useNativeDriver ?? useNativeDriver,
    };

    return Animated.spring(animatedValue, springConfig).start(
      config?.onComplete ?? onComplete,
    );
  };

  const bounce = (config?: {
    scale?: number;
    tension?: number;
    friction?: number;
    onComplete?: () => void;
  }) => {
    const bounceScale = config?.scale ?? 1.1;
    const bounceTension = config?.tension ?? 400;
    const bounceFriction = config?.friction ?? 3;

    return Animated.sequence([
      Animated.spring(animatedValue, {
        toValue: bounceScale,
        tension: bounceTension,
        friction: bounceFriction,
        useNativeDriver,
      }),
      Animated.spring(animatedValue, {
        toValue: 1,
        tension: bounceTension,
        friction: bounceFriction,
        useNativeDriver,
      }),
    ]).start(config?.onComplete);
  };

  const wobble = (config?: { intensity?: number; onComplete?: () => void }) => {
    const intensity = config?.intensity ?? 0.1;

    return Animated.sequence([
      Animated.spring(animatedValue, {
        toValue: 1 + intensity,
        tension: 300,
        friction: 2,
        useNativeDriver,
      }),
      Animated.spring(animatedValue, {
        toValue: 1 - intensity,
        tension: 300,
        friction: 2,
        useNativeDriver,
      }),
      Animated.spring(animatedValue, {
        toValue: 1 + intensity / 2,
        tension: 300,
        friction: 2,
        useNativeDriver,
      }),
      Animated.spring(animatedValue, {
        toValue: 1,
        tension: 400,
        friction: 3,
        useNativeDriver,
      }),
    ]).start(config?.onComplete);
  };

  const reset = () => {
    animatedValue.setValue(initialValue);
  };

  const setValue = (value: number) => {
    animatedValue.setValue(value);
  };

  const interpolate = (config: InterpolationConfig) => {
    return animatedValue.interpolate(config);
  };

  return {
    animatedValue,
    animate,
    bounce,
    wobble,
    reset,
    setValue,
    interpolate,
  };
};
