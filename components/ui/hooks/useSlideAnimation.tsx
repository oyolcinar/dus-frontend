// components/ui/hooks/useSlideAnimation.ts
import { useRef, useEffect } from 'react';
import { Animated, Easing, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type SlideDirection = 'left' | 'right' | 'up' | 'down';

interface UseSlideAnimationOptions {
  initialValue?: number;
  autoStart?: boolean;
  direction?: SlideDirection;
  distance?: number;
  duration?: number;
  delay?: number;
  useNativeDriver?: boolean;
  easing?: (value: number) => number;
  onComplete?: () => void;
}

export const useSlideAnimation = (options: UseSlideAnimationOptions = {}) => {
  const {
    initialValue = 0,
    autoStart = false,
    direction = 'left',
    distance,
    duration = 300,
    delay = 0,
    useNativeDriver = true,
    easing = Easing.out(Easing.ease),
    onComplete,
  } = options;

  const animatedValue = useRef(new Animated.Value(initialValue)).current;

  const getDistance = (dir: SlideDirection, customDistance?: number) => {
    if (customDistance !== undefined) return customDistance;

    switch (dir) {
      case 'left':
      case 'right':
        return screenWidth;
      case 'up':
      case 'down':
        return screenHeight * 0.5;
      default:
        return screenWidth;
    }
  };

  const getTransform = (
    dir: SlideDirection,
    progress: Animated.Value,
    dist: number,
  ) => {
    switch (dir) {
      case 'left':
        return {
          translateX: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [-dist, 0],
          }),
        };
      case 'right':
        return {
          translateX: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [dist, 0],
          }),
        };
      case 'up':
        return {
          translateY: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [-dist, 0],
          }),
        };
      case 'down':
        return {
          translateY: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [dist, 0],
          }),
        };
      default:
        return {
          translateX: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [-dist, 0],
          }),
        };
    }
  };

  useEffect(() => {
    if (autoStart) {
      const animation = Animated.timing(animatedValue, {
        toValue: 1,
        duration,
        delay,
        easing,
        useNativeDriver,
      });

      animation.start(onComplete);
    }
  }, [autoStart, duration, delay, easing, useNativeDriver, onComplete]);

  const slideIn = (config?: {
    direction?: SlideDirection;
    distance?: number;
    duration?: number;
    delay?: number;
    easing?: (value: number) => number;
    onComplete?: () => void;
  }) => {
    const slideConfig = {
      direction: config?.direction ?? direction,
      distance: config?.distance ?? distance,
      duration: config?.duration ?? duration,
      delay: config?.delay ?? delay,
      easing: config?.easing ?? easing,
    };

    animatedValue.setValue(0);

    const animation = Animated.timing(animatedValue, {
      toValue: 1,
      duration: slideConfig.duration,
      delay: slideConfig.delay,
      easing: slideConfig.easing,
      useNativeDriver,
    });

    animation.start(config?.onComplete);
    return animation;
  };

  const slideOut = (config?: {
    direction?: SlideDirection;
    distance?: number;
    duration?: number;
    easing?: (value: number) => number;
    onComplete?: () => void;
  }) => {
    const slideConfig = {
      direction: config?.direction ?? direction,
      distance: config?.distance ?? distance,
      duration: config?.duration ?? duration,
      easing: config?.easing ?? easing,
    };

    const animation = Animated.timing(animatedValue, {
      toValue: 0,
      duration: slideConfig.duration,
      easing: slideConfig.easing,
      useNativeDriver,
    });

    animation.start(config?.onComplete);
    return animation;
  };

  const slideInOut = (config?: {
    direction?: SlideDirection;
    distance?: number;
    inDuration?: number;
    outDuration?: number;
    pauseDuration?: number;
    easing?: (value: number) => number;
    onComplete?: () => void;
  }) => {
    const slideConfig = {
      direction: config?.direction ?? direction,
      distance: config?.distance ?? distance,
      inDuration: config?.inDuration ?? duration,
      outDuration: config?.outDuration ?? duration,
      pauseDuration: config?.pauseDuration ?? 1000,
      easing: config?.easing ?? easing,
    };

    animatedValue.setValue(0);

    const animation = Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: slideConfig.inDuration,
        easing: slideConfig.easing,
        useNativeDriver,
      }),
      Animated.delay(slideConfig.pauseDuration),
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: slideConfig.outDuration,
        easing: slideConfig.easing,
        useNativeDriver,
      }),
    ]);

    animation.start(config?.onComplete);
    return animation;
  };

  const bounce = (config?: {
    direction?: SlideDirection;
    distance?: number;
    duration?: number;
    onComplete?: () => void;
  }) => {
    const bounceConfig = {
      direction: config?.direction ?? direction,
      distance: config?.distance ?? distance,
      duration: config?.duration ?? duration,
    };

    animatedValue.setValue(0);

    const animation = Animated.timing(animatedValue, {
      toValue: 1,
      duration: bounceConfig.duration,
      easing: Easing.out(Easing.back(1.7)),
      useNativeDriver,
    });

    animation.start(config?.onComplete);
    return animation;
  };

  const reset = () => {
    animatedValue.setValue(initialValue);
  };

  const setValue = (value: number) => {
    animatedValue.setValue(value);
  };

  const getTransformStyle = (dir?: SlideDirection, dist?: number) => {
    const slideDirection = dir ?? direction;
    const slideDistance = dist ?? getDistance(slideDirection, distance);
    return getTransform(slideDirection, animatedValue, slideDistance);
  };

  const getOpacityStyle = () => {
    return {
      opacity: animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
      }),
    };
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
    slideIn,
    slideOut,
    slideInOut,
    bounce,
    reset,
    setValue,
    interpolate,
    getTransformStyle,
    getOpacityStyle,
  };
};
