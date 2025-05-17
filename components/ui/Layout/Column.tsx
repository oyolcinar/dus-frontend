// components/ui/Layout/Column.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ColumnProps } from '../types';
import { Spacing } from '../../../constants/theme';

/**
 * Column component for vertical layouts
 */
const Column: React.FC<ColumnProps> = ({
  children,
  style,
  gap = 2,
  justifyContent = 'flex-start',
  alignItems = 'stretch',
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
        styles.column,
        {
          justifyContent,
          alignItems,
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
  column: {
    flexDirection: 'column',
  },
});

export default Column;
