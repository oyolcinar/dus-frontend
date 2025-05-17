// components/ui/NotificationBadge.tsx

import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Colors, BorderRadius, FontSizes } from '../../constants/theme';

export interface NotificationBadgeProps {
  /**
   * Number to display in the badge
   */
  count?: number;

  /**
   * Maximum number to display before showing a '+'
   */
  maxCount?: number;

  /**
   * Whether to show zero count
   */
  showZero?: boolean;

  /**
   * Whether to show as a simple dot without number
   */
  dot?: boolean;

  /**
   * Custom style for the badge
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * NotificationBadge component for displaying notification counts
 */
const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count = 0,
  maxCount = 99,
  showZero = false,
  dot = false,
  style,
  testID,
}) => {
  // Don't render if count is 0 and showZero is false
  if (count === 0 && !showZero && !dot) {
    return null;
  }

  // Format count to display
  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  // Determine badge size based on count digits
  const isSingleDigit = count < 10;
  const isDouble = count >= 10 && count <= maxCount;
  const isOverflow = count > maxCount;

  // Use dot style if specified
  if (dot) {
    return (
      <View
        style={[styles.dotBadge, style]}
        testID={testID || 'notification-dot'}
      />
    );
  }

  return (
    <View
      style={[
        styles.badge,
        isSingleDigit && styles.singleDigitBadge,
        isDouble && styles.doubleDigitBadge,
        isOverflow && styles.overflowBadge,
        style,
      ]}
      testID={testID || 'notification-badge'}
    >
      <Text style={styles.badgeText}>{displayCount}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -4,
    right: -4,
    zIndex: 10,
  },
  singleDigitBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 3,
  },
  doubleDigitBadge: {
    minWidth: 22,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
  },
  overflowBadge: {
    minWidth: 26,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
  },
  badgeText: {
    color: Colors.white,
    fontSize: FontSizes.xs,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  dotBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 10,
  },
});

export default NotificationBadge;
