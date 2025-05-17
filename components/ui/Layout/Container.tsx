// components/ui/Layout/Container.tsx

import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { ContainerProps } from '../types';
import { Colors, Spacing } from '../../../constants/theme';

/**
 * Container component for wrapping content with consistent padding and styling
 */
const Container: React.FC<ContainerProps> = ({
  children,
  style,
  padding = 'medium',
  center = false,
  testID,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Determine padding based on the prop
  let paddingStyle;
  switch (padding) {
    case 'none':
      paddingStyle = styles.paddingNone;
      break;
    case 'small':
      paddingStyle = styles.paddingSmall;
      break;
    case 'large':
      paddingStyle = styles.paddingLarge;
      break;
    default:
      paddingStyle = styles.paddingMedium;
  }

  return (
    <View
      style={[
        styles.container,
        isDark ? styles.containerDark : styles.containerLight,
        paddingStyle,
        center && styles.center,
        style,
      ]}
      testID={testID}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerLight: {
    backgroundColor: Colors.gray[50],
  },
  containerDark: {
    backgroundColor: Colors.gray[900],
  },
  paddingNone: {
    padding: 0,
  },
  paddingSmall: {
    padding: Spacing[2],
  },
  paddingMedium: {
    padding: Spacing[4],
  },
  paddingLarge: {
    padding: Spacing[6],
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Container;
