// components/ui/Layout/Spacer.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SpacerProps } from '../types';
import { Spacing } from '../../../constants/theme';

/**
 * Spacer component for adding space between elements
 */
const Spacer: React.FC<SpacerProps> = ({
  size = 'md',
  direction = 'vertical',
  style,
  testID,
}) => {
  // Convert size to pixel value
  let space: number;
  switch (size) {
    case 'xs':
      space = Spacing[1];
      break;
    case 'sm':
      space = Spacing[2];
      break;
    case 'lg':
      space = Spacing[6];
      break;
    case 'xl':
      space = Spacing[8];
      break;
    case 'md':
    default:
      space = Spacing[4];
  }

  // Apply the appropriate dimension based on direction
  const spacerStyle = {
    ...(direction === 'vertical' ? { height: space } : { width: space }),
  };

  return (
    <View
      style={[spacerStyle, style]}
      testID={testID}
      accessibilityRole='none'
    />
  );
};

export default Spacer;
