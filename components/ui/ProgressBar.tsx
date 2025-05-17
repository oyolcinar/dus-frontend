// components/ui/ProgressBar.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  DimensionValue,
} from 'react-native';
import { Colors, BorderRadius } from '../../constants/theme';

export interface ProgressBarProps {
  /**
   * Current progress value (0-100)
   */
  progress: number;

  /**
   * Whether to show the percentage text
   */
  showPercentage?: boolean;

  /**
   * Background color of the progress track
   */
  trackColor?: string;

  /**
   * Fill color of the progress bar
   */
  progressColor?: string;

  /**
   * Height of the progress bar
   */
  height?: number;

  /**
   * Width of the progress bar (can be percentage string or number)
   * Must be a valid React Native dimension value
   */
  width?: DimensionValue;

  /**
   * Custom style for the container
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Custom style for the percentage text
   */
  textStyle?: StyleProp<TextStyle>;

  /**
   * Whether the progress bar should be animated
   */
  animated?: boolean;

  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * ProgressBar component for displaying progress or completion status
 */
const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  showPercentage = false,
  trackColor,
  progressColor,
  height = 8,
  width = '100%',
  style,
  textStyle,
  animated = true,
  testID,
}) => {
  // Ensure progress is between 0 and 100
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  // Derive track and progress colors from theme or props
  const trackColorValue = trackColor || Colors.gray[200];
  const progressColorValue = progressColor || Colors.primary.DEFAULT;

  return (
    <View
      style={[
        styles.container,
        { width: width as DimensionValue }, // Cast width to DimensionValue
        style,
      ]}
      testID={testID}
      accessibilityRole='progressbar'
      accessibilityValue={{ min: 0, max: 100, now: clampedProgress }}
    >
      <View
        style={[
          styles.track,
          {
            backgroundColor: trackColorValue,
            height,
            borderRadius: height / 2,
          },
        ]}
      >
        <View
          style={[
            styles.progress,
            {
              width: `${clampedProgress}%`,
              backgroundColor: progressColorValue,
              height,
              borderRadius: height / 2,
            },
            animated && styles.animated,
          ]}
        />
      </View>

      {showPercentage && (
        <Text style={[styles.percentageText, textStyle]}>
          {`${Math.round(clampedProgress)}%`}
        </Text>
      )}
    </View>
  );
};

// Define specific types for the styles
type ProgressBarStyles = {
  container: ViewStyle;
  track: ViewStyle;
  progress: ViewStyle;
  animated: ViewStyle;
  percentageText: TextStyle;
};

const styles = StyleSheet.create<ProgressBarStyles>({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  track: {
    flex: 1,
    overflow: 'hidden',
  },
  progress: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  animated: {
    // React Native web only property - not supported in all platforms
    // @ts-ignore - Adding a type assertion to handle this platform-specific property
    transition: 'width 0.3s ease',
  },
  percentageText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '500',
    color: Colors.gray[700],
  },
});

export default ProgressBar;
