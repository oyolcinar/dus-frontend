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
   * Whether to show percentage inside the progress bar
   */
  showPercentageInside?: boolean;

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
  showPercentageInside = false,
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
  const trackColorValue = trackColor || Colors.gray?.[200] || '#e5e7eb';
  const progressColorValue =
    progressColor || Colors.primary?.DEFAULT || '#3b82f6';

  // Calculate if we should show text inside based on progress and height
  const shouldShowInside =
    showPercentageInside && height >= 18 && clampedProgress > 8;

  return (
    <View
      style={[styles.container, { width: width as DimensionValue }, style]}
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

        {/* Percentage text inside the progress bar */}
        {shouldShowInside && (
          <View style={[styles.insideTextContainer, { height }]}>
            <Text
              style={[
                styles.insidePercentageText,
                {
                  fontSize: Math.max(height * 0.55, 10),
                  lineHeight: height,
                },
                textStyle,
              ]}
              numberOfLines={1}
            >
              {`%${Math.round(clampedProgress)}`}
            </Text>
          </View>
        )}
      </View>

      {/* Percentage text outside the progress bar */}
      {showPercentage && !showPercentageInside && (
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
  insideTextContainer: ViewStyle;
  insidePercentageText: TextStyle;
};

const styles = StyleSheet.create<ProgressBarStyles>({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  track: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
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
    color: Colors.gray?.[700] || '#374151',
  },
  insideTextContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    paddingHorizontal: 4,
  },
  insidePercentageText: {
    fontWeight: '700',
    color: Colors.white || '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

export default ProgressBar;
