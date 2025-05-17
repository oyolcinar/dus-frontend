// components/ui/Spinner.tsx

import React from 'react';
import {
  ActivityIndicator,
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  useColorScheme,
} from 'react-native';
import { Colors } from '../../constants/theme';

export interface SpinnerProps {
  /**
   * Size of the spinner
   */
  size?: 'small' | 'large';

  /**
   * Color of the spinner
   */
  color?: string;

  /**
   * Whether to show the spinner centered in a full container
   */
  fullScreen?: boolean;

  /**
   * Additional style for the spinner container
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * Spinner component for loading states
 */
const Spinner: React.FC<SpinnerProps> = ({
  size = 'small',
  color,
  fullScreen = false,
  style,
  testID,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Use provided color or theme default
  const spinnerColor =
    color || (isDark ? Colors.primary.light : Colors.primary.DEFAULT);

  // If fullScreen, render in a centered container
  if (fullScreen) {
    return (
      <View
        style={[
          styles.fullScreenContainer,
          isDark
            ? styles.fullScreenContainerDark
            : styles.fullScreenContainerLight,
          style,
        ]}
        testID={testID}
      >
        <ActivityIndicator size={size} color={spinnerColor} />
      </View>
    );
  }

  // Otherwise, render just the spinner
  return (
    <ActivityIndicator
      size={size}
      color={spinnerColor}
      style={style}
      testID={testID}
    />
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  fullScreenContainerLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  fullScreenContainerDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
});

export default Spinner;
