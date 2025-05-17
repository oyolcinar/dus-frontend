// components/ui/Layout/Divider.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DividerProps } from '../types';
import { Colors } from '../../../constants/theme';

/**
 * Divider component for visual separation
 */
const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  style,
  color,
  thickness = 1,
  testID,
}) => {
  const dividerColor = color || Colors.gray[200];

  return (
    <View
      style={[
        orientation === 'horizontal' ? styles.horizontal : styles.vertical,
        {
          backgroundColor: dividerColor,
          ...(orientation === 'horizontal'
            ? { height: thickness }
            : { width: thickness }),
        },
        style,
      ]}
      testID={testID}
      accessibilityRole='none'
    />
  );
};

const styles = StyleSheet.create({
  horizontal: {
    width: '100%',
    marginVertical: 8,
  },
  vertical: {
    height: '100%',
    marginHorizontal: 8,
  },
});

export default Divider;
