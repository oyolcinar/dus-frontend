// components/ui/Feedback/Alert.tsx

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSizes,
} from '../../../constants/theme';

export interface AlertProps {
  /**
   * Alert message content
   */
  message: string;

  /**
   * Alert type/variant
   */
  type?: 'info' | 'success' | 'warning' | 'error';

  /**
   * Optional title for the alert
   */
  title?: string;

  /**
   * Whether the alert is dismissible
   */
  dismissible?: boolean;

  /**
   * Callback when the alert is dismissed
   */
  onDismiss?: () => void;

  /**
   * Icon to display (FontAwesome)
   */
  icon?: React.ComponentProps<typeof FontAwesome>['name'];

  /**
   * Custom style for the alert container
   */
  style?: any;

  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * Alert component for providing feedback or notification messages
 */
const Alert: React.FC<AlertProps> = ({
  message,
  type = 'info',
  title,
  dismissible = false,
  onDismiss,
  icon,
  style,
  testID,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Get appropriate colors based on type
  let backgroundColor: string;
  let textColor: string;
  let borderColor: string;
  let iconName: React.ComponentProps<typeof FontAwesome>['name'] =
    icon || 'info-circle';

  switch (type) {
    case 'success':
      backgroundColor = isDark
        ? 'rgba(33, 185, 88, 0.1)'
        : 'rgba(33, 185, 88, 0.1)';
      borderColor = Colors.success;
      textColor = isDark ? Colors.white : Colors.gray[900];
      iconName = icon || 'check-circle';
      break;
    case 'warning':
      backgroundColor = isDark
        ? 'rgba(251, 208, 0, 0.1)'
        : 'rgba(251, 208, 0, 0.1)';
      borderColor = Colors.warning;
      textColor = isDark ? Colors.white : Colors.gray[900];
      iconName = icon || 'exclamation-triangle';
      break;
    case 'error':
      backgroundColor = isDark
        ? 'rgba(236, 28, 36, 0.1)'
        : 'rgba(236, 28, 36, 0.1)';
      borderColor = Colors.error;
      textColor = isDark ? Colors.white : Colors.gray[900];
      iconName = icon || 'exclamation-circle';
      break;
    case 'info':
    default:
      backgroundColor = isDark
        ? 'rgba(0, 183, 239, 0.1)'
        : 'rgba(0, 183, 239, 0.1)';
      borderColor = Colors.info;
      textColor = isDark ? Colors.white : Colors.gray[900];
      iconName = icon || 'info-circle';
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor, borderLeftColor: borderColor },
        style,
      ]}
      testID={testID}
      accessibilityRole='alert'
    >
      <View style={styles.contentContainer}>
        <FontAwesome
          name={iconName}
          size={20}
          color={borderColor}
          style={styles.icon}
        />

        <View style={styles.textContainer}>
          {title && (
            <Text style={[styles.title, { color: textColor }]}>{title}</Text>
          )}

          <Text style={[styles.message, { color: textColor }]}>{message}</Text>
        </View>
      </View>

      {dismissible && onDismiss && (
        <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
          <FontAwesome
            name='times'
            size={16}
            color={isDark ? Colors.gray[400] : Colors.gray[600]}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderLeftWidth: 4,
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    marginVertical: Spacing[2],
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  icon: {
    marginRight: Spacing[3],
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontWeight: '600',
    fontSize: FontSizes.base,
    marginBottom: Spacing[1],
  },
  message: {
    fontSize: FontSizes.sm,
  },
  dismissButton: {
    marginLeft: Spacing[2],
    padding: Spacing[1],
  },
});

export default Alert;
