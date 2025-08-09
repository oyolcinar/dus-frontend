// components/ui/Animation/SlideInElement.tsx - PERFORMANCE OPTIMIZED
import React, { useRef, useEffect, useMemo } from 'react';
import { Animated, Easing, Dimensions } from 'react-native';
import { SlideInElementProps } from '../types';

// 🚀 PERFORMANCE FIX: Memoize screen dimensions to prevent repeated calculations
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const SlideInElement: React.FC<SlideInElementProps> = ({
  children,
  direction = 'left',
  duration = 800,
  delay = 0,
  style,
  testID,
}) => {
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  // 🚀 PERFORMANCE FIX: Memoize animation config
  const animationConfig = useMemo(
    () => ({
      toValue: 1,
      duration: duration,
      easing: Easing.out(Easing.back(1.2)),
      useNativeDriver: true,
    }),
    [duration],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      animationRef.current = Animated.timing(slideAnimation, animationConfig);
      animationRef.current.start();
    }, delay);

    // 🚀 PERFORMANCE FIX: Proper cleanup
    return () => {
      clearTimeout(timer);
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
    };
  }, [slideAnimation, animationConfig, delay]);

  // 🚀 PERFORMANCE FIX: Memoize transform interpolation based on direction
  const transform = useMemo(() => {
    switch (direction) {
      case 'left':
        return {
          translateX: slideAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [-screenWidth, 0],
          }),
        };
      case 'right':
        return {
          translateX: slideAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [screenWidth, 0],
          }),
        };
      case 'up':
        return {
          translateY: slideAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [-screenHeight * 0.5, 0],
          }),
        };
      case 'down':
        return {
          translateY: slideAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [screenHeight * 0.5, 0],
          }),
        };
      default:
        return {
          translateX: slideAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [-screenWidth, 0],
          }),
        };
    }
  }, [slideAnimation, direction]);

  // 🚀 PERFORMANCE FIX: Memoize opacity interpolation
  const opacity = useMemo(
    () =>
      slideAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
      }),
    [slideAnimation],
  );

  // 🚀 PERFORMANCE FIX: Memoize animated style to prevent recreation
  const animatedStyle = useMemo(
    () => ({
      opacity,
      transform: [transform],
    }),
    [opacity, transform],
  );

  return (
    <Animated.View style={[style, animatedStyle]} testID={testID}>
      {children}
    </Animated.View>
  );
};

// 🚀 PERFORMANCE FIX: Memoize to prevent unnecessary re-renders
export default React.memo(SlideInElement);
