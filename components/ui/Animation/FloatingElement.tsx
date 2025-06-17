// components/ui/Animation/FloatingElement.tsx
import React, { useRef, useEffect } from 'react';
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

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(floatAnimation, {
          toValue: 1,
          duration: duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnimation, {
          toValue: 0,
          duration: duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]).start(() => animate());
    };

    animate();
  }, [duration]);

  const translateY = floatAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -distance],
  });

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ translateY }],
        },
      ]}
      testID={testID}
    >
      {children}
    </Animated.View>
  );
};

export default FloatingElement;
