// components/ui/Layout/Row.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { RowProps } from '../types';
import { Spacing } from '../../../constants/theme';

/**
 * Row component for horizontal layouts
 */
const Row: React.FC<RowProps> = ({
  children,
  style,
  gap = 2,
  justifyContent = 'flex-start',
  alignItems = 'center',
  wrap = false,
  testID,
}) => {
  // Convert gap value to corresponding spacing
  // Use proper type checking to safely access Spacing values
  const getGapValue = (gap: number | string): number => {
    if (typeof gap === 'string') {
      return parseInt(gap, 10);
    }

    // Check if the gap is a valid key in Spacing
    const spacingKey = gap as keyof typeof Spacing;
    return spacingKey in Spacing ? Spacing[spacingKey] : gap;
  };

  const gapValue = getGapValue(gap);

  return (
    <View
      style={[
        styles.row,
        {
          justifyContent,
          alignItems,
          flexWrap: wrap ? 'wrap' : 'nowrap',
          gap: gapValue,
        },
        style,
      ]}
      testID={testID}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
});

export default Row;
