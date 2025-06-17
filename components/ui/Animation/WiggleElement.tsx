// components/ui/Animation/WiggleElement.tsx
import React, { useRef } from 'react';
import { TouchableOpacity, Animated } from 'react-native';
import { WiggleElementProps } from '../types';

const WiggleElement: React.FC<WiggleElementProps> = ({
  children,
  intensity = 10,
  duration = 200,
  style,
  testID,
}) => {
  const wiggleAnimation = useRef(new Animated.Value(0)).current;

  const startWiggle = () => {
    Animated.sequence([
      Animated.timing(wiggleAnimation, {
        toValue: 1,
        duration: duration,
        useNativeDriver: true,
      }),
      Animated.timing(wiggleAnimation, {
        toValue: -1,
        duration: duration,
        useNativeDriver: true,
      }),
      Animated.timing(wiggleAnimation, {
        toValue: 1,
        duration: duration,
        useNativeDriver: true,
      }),
      Animated.timing(wiggleAnimation, {
        toValue: 0,
        duration: duration,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const rotation = wiggleAnimation.interpolate({
    inputRange: [-1, 1],
    outputRange: [`-${intensity}deg`, `${intensity}deg`],
  });

  return (
    <TouchableOpacity onPress={startWiggle} activeOpacity={1} testID={testID}>
      <Animated.View
        style={[
          style,
          {
            transform: [{ rotate: rotation }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

export default WiggleElement;
