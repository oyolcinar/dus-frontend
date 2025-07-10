// components/ui/Tabs/TabItem.tsx

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  useColorScheme,
  View,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
} from '../../../constants/theme';
import { globalStyles, applyDarkMode } from '../../../utils/styleUtils';

export interface TabItemProps {
  /**
   * Label text for the tab
   */
  label: string;

  /**
   * Optional icon (FontAwesome) for the tab
   */
  icon?: React.ComponentProps<typeof FontAwesome>['name'];

  /**
   * Whether the tab is currently active
   */
  isActive?: boolean;

  /**
   * Callback when the tab is pressed
   */
  onPress?: () => void;

  /**
   * Custom style for the tab item container
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * TabItem component for use within TabBar
 */
const TabItem: React.FC<TabItemProps> = ({
  label,
  icon,
  isActive = false,
  onPress,
  style,
  testID,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Determine the color scheme
  const activeColor = Colors.primary.DEFAULT;
  const inactiveColor = isDark ? Colors.gray[600] : Colors.gray[600];
  const activeTextColor = isDark ? Colors.gray[900] : Colors.gray[900];
  const inactiveTextColor = isDark ? Colors.gray[600] : Colors.gray[600];
  const activeIndicatorColor = activeColor;

  return (
    <TouchableOpacity
      style={[styles.container, isActive && styles.activeContainer, style]}
      onPress={onPress}
      testID={testID}
      accessibilityRole='tab'
      accessibilityState={{ selected: isActive }}
    >
      {icon && (
        <FontAwesome
          name={icon}
          size={20}
          color={isActive ? activeColor : inactiveColor}
          style={styles.icon}
        />
      )}

      <Text
        style={[
          styles.label,
          applyDarkMode(
            isDark,
            { color: isActive ? activeTextColor : inactiveTextColor },
            { color: isActive ? activeTextColor : inactiveTextColor },
          ),
          isActive && styles.activeLabel,
        ]}
      >
        {label}
      </Text>

      {isActive && (
        <View
          style={[styles.indicator, { backgroundColor: activeIndicatorColor }]}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minWidth: 80,
  },
  activeContainer: {
    // Additional styles for active state
  },
  icon: {
    marginRight: Spacing[2],
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  activeLabel: {
    fontWeight: '600',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: Spacing[2],
    right: Spacing[2],
    height: 2,
    borderRadius: 1,
  },
});

export default TabItem;
