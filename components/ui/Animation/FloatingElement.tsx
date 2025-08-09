// components/ui/Animation/FloatingElement.tsx - SIMPLE PERFORMANCE FIXES
import React, { useRef, useEffect, useMemo } from 'react';
import { Animated, Easing } from 'react-native';
import { FloatingElementProps } from '../types';

const FloatingElement: React.FC<FloatingElementProps> = ({
  children,
  duration = 3000,
  distance = 10,
  style,
  testID,
}) => {
  const floatAnimation = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  // 🚀 PERFORMANCE FIX: Memoize animation config
  const animationConfig = useMemo(
    () => ({
      toValue: 1,
      duration: duration,
      easing: Easing.inOut(Easing.sin),
      useNativeDriver: true, // This was already good!
    }),
    [duration],
  );

  const reverseAnimationConfig = useMemo(
    () => ({
      toValue: 0,
      duration: duration,
      easing: Easing.inOut(Easing.sin),
      useNativeDriver: true,
    }),
    [duration],
  );

  useEffect(() => {
    const animate = () => {
      animationRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnimation, animationConfig),
          Animated.timing(floatAnimation, reverseAnimationConfig),
        ]),
      );

      animationRef.current.start();
    };

    animate();

    // 🚀 PERFORMANCE FIX: Proper cleanup to stop animation
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
    };
  }, [floatAnimation, animationConfig, reverseAnimationConfig]);

  // 🚀 PERFORMANCE FIX: Memoize transform to prevent recreation
  const animatedStyle = useMemo(() => {
    const translateY = floatAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -distance],
    });

    return {
      transform: [{ translateY }],
    };
  }, [floatAnimation, distance]);

  return (
    <Animated.View style={[style, animatedStyle]} testID={testID}>
      {children}
    </Animated.View>
  );
};

// 🚀 PERFORMANCE FIX: Memoize to prevent unnecessary re-renders
export default React.memo(FloatingElement);
