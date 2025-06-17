// components/ui/hooks/useAnimatedValue.ts
import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

interface UseAnimatedValueOptions {
  initialValue?: number;
  autoStart?: boolean;
  duration?: number;
  toValue?: number;
  useNativeDriver?: boolean;
  onComplete?: () => void;
}

export const useAnimatedValue = (options: UseAnimatedValueOptions = {}) => {
  const {
    initialValue = 0,
    autoStart = false,
    duration = 300,
    toValue = 1,
    useNativeDriver = true,
    onComplete,
  } = options;

  const animatedValue = useRef(new Animated.Value(initialValue)).current;

  useEffect(() => {
    if (autoStart) {
      Animated.timing(animatedValue, {
        toValue,
        duration,
        useNativeDriver,
      }).start(onComplete);
    }
  }, [autoStart, toValue, duration, useNativeDriver, onComplete]);

  const animate = (config?: {
    toValue?: number;
    duration?: number;
    useNativeDriver?: boolean;
    onComplete?: () => void;
  }) => {
    const animationConfig = {
      toValue: config?.toValue ?? toValue,
      duration: config?.duration ?? duration,
      useNativeDriver: config?.useNativeDriver ?? useNativeDriver,
    };

    return Animated.timing(animatedValue, animationConfig).start(
      config?.onComplete ?? onComplete,
    );
  };

  const reset = () => {
    animatedValue.setValue(initialValue);
  };

  const setValue = (value: number) => {
    animatedValue.setValue(value);
  };

  const interpolate = (config: {
    inputRange: number[];
    outputRange: (number | string)[];
    extrapolate?: 'extend' | 'clamp' | 'identity';
  }) => {
    return animatedValue.interpolate(config);
  };

  return {
    animatedValue,
    animate,
    reset,
    setValue,
    interpolate,
  };
};
