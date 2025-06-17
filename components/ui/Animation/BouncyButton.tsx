// components/ui/Animation/BouncyButton.tsx
import React, { useRef } from 'react';
import { TouchableOpacity, Animated } from 'react-native';
import { BouncyButtonProps } from '../types';

const BouncyButton: React.FC<BouncyButtonProps> = ({
  onPress,
  children,
  style,
  scaleValue = 0.95,
  testID,
  ...props
}) => {
  const scaleAnimation = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnimation, {
      toValue: scaleValue,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnimation, {
      toValue: 1,
      tension: 400,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      testID={testID}
      {...props}
    >
      <Animated.View
        style={[
          style,
          {
            transform: [{ scale: scaleAnimation }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

export default BouncyButton;
