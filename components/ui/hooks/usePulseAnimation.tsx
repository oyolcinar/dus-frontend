// components/ui/hooks/usePulseAnimation.ts
import { useRef, useEffect } from 'react';
import { Animated, Easing } from 'react-native';

interface UsePulseAnimationOptions {
  initialValue?: number;
  autoStart?: boolean;
  minValue?: number;
  maxValue?: number;
  duration?: number;
  useNativeDriver?: boolean;
  iterations?: number; // -1 for infinite
  easing?: (value: number) => number;
}

export const usePulseAnimation = (options: UsePulseAnimationOptions = {}) => {
  const {
    initialValue = 1,
    autoStart = false,
    minValue = 0.8,
    maxValue = 1.2,
    duration = 1000,
    useNativeDriver = true,
    iterations = -1, // infinite by default
    easing = Easing.inOut(Easing.ease),
  } = options;

  const animatedValue = useRef(new Animated.Value(initialValue)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const createPulseAnimation = (config?: {
    minValue?: number;
    maxValue?: number;
    duration?: number;
    iterations?: number;
    easing?: (value: number) => number;
  }) => {
    const pulseConfig = {
      minValue: config?.minValue ?? minValue,
      maxValue: config?.maxValue ?? maxValue,
      duration: config?.duration ?? duration,
      iterations: config?.iterations ?? iterations,
      easing: config?.easing ?? easing,
    };

    const pulse = Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: pulseConfig.maxValue,
        duration: pulseConfig.duration / 2,
        easing: pulseConfig.easing,
        useNativeDriver,
      }),
      Animated.timing(animatedValue, {
        toValue: pulseConfig.minValue,
        duration: pulseConfig.duration / 2,
        easing: pulseConfig.easing,
        useNativeDriver,
      }),
    ]);

    if (pulseConfig.iterations === -1) {
      return Animated.loop(pulse);
    } else {
      return Animated.loop(pulse, { iterations: pulseConfig.iterations });
    }
  };

  useEffect(() => {
    if (autoStart) {
      animationRef.current = createPulseAnimation();
      animationRef.current.start();
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [autoStart]);

  const start = (config?: {
    minValue?: number;
    maxValue?: number;
    duration?: number;
    iterations?: number;
    easing?: (value: number) => number;
    onComplete?: () => void;
  }) => {
    if (animationRef.current) {
      animationRef.current.stop();
    }

    animationRef.current = createPulseAnimation(config);
    animationRef.current.start(config?.onComplete);
  };

  const stop = () => {
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }
  };

  const pause = () => {
    if (animationRef.current) {
      animationRef.current.stop();
    }
  };

  const resume = () => {
    if (!animationRef.current) {
      start();
    }
  };

  const reset = () => {
    stop();
    animatedValue.setValue(initialValue);
  };

  const setValue = (value: number) => {
    animatedValue.setValue(value);
  };

  const quickPulse = (onComplete?: () => void) => {
    const quick = Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: maxValue,
        duration: 150,
        easing: Easing.out(Easing.quad),
        useNativeDriver,
      }),
      Animated.timing(animatedValue, {
        toValue: initialValue,
        duration: 150,
        easing: Easing.out(Easing.quad),
        useNativeDriver,
      }),
    ]);

    quick.start(onComplete);
  };

  const heartbeat = (onComplete?: () => void) => {
    const beat = Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver,
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver,
      }),
      Animated.timing(animatedValue, {
        toValue: 1.15,
        duration: 100,
        useNativeDriver,
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver,
      }),
    ]);

    beat.start(onComplete);
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
    start,
    stop,
    pause,
    resume,
    reset,
    setValue,
    quickPulse,
    heartbeat,
    interpolate,
    isRunning: !!animationRef.current,
  };
};
