// components/ui/Animation/PulseElement.tsx
import React, { useRef, useEffect } from 'react';
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

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: scale,
          duration: duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => animate());
    };

    animate();
  }, [scale, duration]);

  return (
    <Animated.View
      style={[
        style,
        {
          transform: [{ scale: pulseAnimation }],
        },
      ]}
      testID={testID}
    >
      {children}
    </Animated.View>
  );
};

export default PulseElement;
