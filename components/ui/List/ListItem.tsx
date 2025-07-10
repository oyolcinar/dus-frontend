// components/ui/List/ListItem.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  useColorScheme,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes } from '../../../constants/theme';
import { globalStyles, applyDarkMode } from '../../../utils/styleUtils';

export interface ListItemProps {
  /**
   * Primary text to display
   */
  title: string;

  /**
   * Optional secondary text
   */
  subtitle?: string;

  /**
   * Optional icon for the left side
   */
  leftIcon?: React.ComponentProps<typeof FontAwesome>['name'];

  /**
   * Optional icon for the right side
   */
  rightIcon?:
    | React.ComponentProps<typeof FontAwesome>['name']
    | 'chevron-right';

  /**
   * Callback when the item is pressed
   */
  onPress?: () => void;

  /**
   * Custom style for the item container
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * ListItem component for use within List
 */
const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  leftIcon,
  rightIcon = 'chevron-right',
  onPress,
  style,
  testID,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Determine text and icon colors based on color scheme
  const titleColor = isDark ? Colors.gray[900] : Colors.gray[900];
  const subtitleColor = isDark ? Colors.gray[600] : Colors.gray[600];
  const iconColor = isDark ? Colors.gray[600] : Colors.gray[600];

  // Wrapper component - TouchableOpacity if onPress is provided, View otherwise
  const Wrapper: any = onPress ? TouchableOpacity : View;
  const wrapperProps = onPress ? { onPress, activeOpacity: 0.7 } : {};

  // Calculate subtitle margin bottom dynamically
  const subtitleMarginBottom = subtitle ? Spacing[1] : 0;

  return (
    <Wrapper
      style={[
        styles.container,
        applyDarkMode(
          isDark,
          { borderBottomColor: Colors.gray[700] },
          { borderBottomColor: Colors.gray[700] },
        ),
        style,
      ]}
      {...wrapperProps}
      testID={testID}
    >
      {/* Left Icon */}
      {leftIcon && (
        <View style={styles.leftIconContainer}>
          <FontAwesome name={leftIcon} size={20} color={iconColor} />
        </View>
      )}

      {/* Content */}
      <View style={styles.contentContainer}>
        <Text
          style={[
            styles.title,
            { color: titleColor, marginBottom: subtitleMarginBottom },
          ]}
        >
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: subtitleColor }]}>
            {subtitle}
          </Text>
        )}
      </View>

      {/* Right Icon */}
      {rightIcon && (
        <View style={styles.rightIconContainer}>
          <FontAwesome name={rightIcon} size={16} color={iconColor} />
        </View>
      )}
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    borderBottomWidth: 1,
  },
  leftIconContainer: {
    marginRight: Spacing[3],
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: FontSizes.base,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: FontSizes.sm,
  },
  rightIconContainer: {
    marginLeft: Spacing[2],
  },
});

export default ListItem;
