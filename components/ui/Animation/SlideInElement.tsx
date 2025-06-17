// components/ui/Animation/SlideInElement.tsx
import React, { useRef, useEffect } from 'react';
import { Animated, Easing, Dimensions } from 'react-native';
import { SlideInElementProps } from '../types';

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

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(slideAnimation, {
        toValue: 1,
        duration: duration,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [duration, delay]);

  const getTransform = () => {
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
  };

  const opacity = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [getTransform()],
        },
      ]}
      testID={testID}
    >
      {children}
    </Animated.View>
  );
};

export default SlideInElement;
