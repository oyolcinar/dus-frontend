// components/ui/Animation/PulseElement.tsx - PERFORMANCE OPTIMIZED
import React, { useRef, useEffect, useMemo } from 'react';
import { Animated, Easing } from 'react-native';
import { PulseElementProps } from '../types';

const PulseElement: React.FC<PulseElementProps> = ({
  children,
  scale = 1.1,
  duration = 1000,
  style,
  testID,
}) => {
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  // 🚀 PERFORMANCE FIX: Memoize animation configs to prevent recreation
  const scaleUpConfig = useMemo(
    () => ({
      toValue: scale,
      duration: duration,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }),
    [scale, duration],
  );

  const scaleDownConfig = useMemo(
    () => ({
      toValue: 1,
      duration: duration,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }),
    [duration],
  );

  useEffect(() => {
    const animate = () => {
      animationRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, scaleUpConfig),
          Animated.timing(pulseAnimation, scaleDownConfig),
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
  }, [pulseAnimation, scaleUpConfig, scaleDownConfig]);

  // 🚀 PERFORMANCE FIX: Memoize animated style to prevent recreation
  const animatedStyle = useMemo(
    () => ({
      transform: [{ scale: pulseAnimation }],
    }),
    [pulseAnimation],
  );

  return (
    <Animated.View style={[style, animatedStyle]} testID={testID}>
      {children}
    </Animated.View>
  );
};

// 🚀 PERFORMANCE FIX: Memoize to prevent unnecessary re-renders
export default React.memo(PulseElement);
