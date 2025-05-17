// components/ui/Feedback/Toast.tsx

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSizes,
} from '../../../constants/theme';
import { globalStyles, applyDarkMode } from '../../../utils/styleUtils';

export interface ToastProps {
  /**
   * Toast message content
   */
  message: string;

  /**
   * Toast type/variant
   */
  type?: 'info' | 'success' | 'warning' | 'error';

  /**
   * Duration (in ms) before the toast auto-dismisses
   */
  duration?: number;

  /**
   * Callback when the toast is closed
   */
  onClose?: () => void;

  /**
   * Position of the toast on the screen
   */
  position?: 'top' | 'bottom';

  /**
   * Custom style for the toast container
   */
  style?: any;

  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * Toast component for showing brief notification messages
 */
const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 3000,
  onClose,
  position = 'bottom',
  style,
  testID,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [visible, setVisible] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(
    new Animated.Value(position === 'top' ? -20 : 20),
  ).current;

  // Get appropriate colors based on type
  let backgroundColor: string;
  let textColor: string;
  let borderColor: string;
  let iconName: React.ComponentProps<typeof FontAwesome>['name'] =
    'info-circle';

  switch (type) {
    case 'success':
      backgroundColor = isDark
        ? 'rgba(33, 185, 88, 0.9)'
        : 'rgba(33, 185, 88, 0.15)';
      borderColor = Colors.success;
      textColor = isDark ? Colors.white : Colors.gray[900];
      iconName = 'check-circle';
      break;
    case 'warning':
      backgroundColor = isDark
        ? 'rgba(251, 208, 0, 0.9)'
        : 'rgba(251, 208, 0, 0.15)';
      borderColor = Colors.warning;
      textColor = isDark ? Colors.white : Colors.gray[900];
      iconName = 'exclamation-triangle';
      break;
    case 'error':
      backgroundColor = isDark
        ? 'rgba(236, 28, 36, 0.9)'
        : 'rgba(236, 28, 36, 0.15)';
      borderColor = Colors.error;
      textColor = isDark ? Colors.white : Colors.gray[900];
      iconName = 'exclamation-circle';
      break;
    case 'info':
    default:
      backgroundColor = isDark
        ? 'rgba(0, 183, 239, 0.9)'
        : 'rgba(0, 183, 239, 0.15)';
      borderColor = Colors.info;
      textColor = isDark ? Colors.white : Colors.gray[900];
      iconName = 'info-circle';
  }

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss after duration
    const timer = setTimeout(() => {
      dismissToast();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const dismissToast = () => {
    // Animate out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: position === 'top' ? -20 : 20,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      if (onClose) {
        onClose();
      }
    });
  };

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        position === 'top' ? styles.topPosition : styles.bottomPosition,
        { backgroundColor, borderLeftColor: borderColor },
        { opacity: fadeAnim, transform: [{ translateY: translateYAnim }] },
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

        <Text style={[styles.message, { color: textColor }]}>{message}</Text>
      </View>

      <TouchableOpacity onPress={dismissToast} style={styles.dismissButton}>
        <FontAwesome
          name='times'
          size={16}
          color={isDark ? Colors.gray[400] : Colors.gray[600]}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    marginHorizontal: Spacing[4],
    borderLeftWidth: 4,
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 9999,
  },
  topPosition: {
    top: Spacing[12], // Add some space from the top of the screen
  },
  bottomPosition: {
    bottom: Spacing[12], // Add some space from the bottom of the screen
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: Spacing[3],
    marginTop: 2,
  },
  message: {
    fontSize: FontSizes.sm,
    flex: 1,
  },
  dismissButton: {
    marginLeft: Spacing[2],
    padding: Spacing[1],
  },
});

export default Toast;
