// components/ui/EmptyState.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  useColorScheme,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
} from '../../constants/theme';
import Button from './Button';

export interface EmptyStateProps {
  /**
   * Icon to display (FontAwesome)
   */
  icon: React.ComponentProps<typeof FontAwesome>['name'];

  /**
   * Title text for the empty state
   */
  title: string;

  /**
   * Message describing the empty state
   */
  message: string;

  /**
   * Optional action button configuration
   */
  actionButton?: {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
  };

  /**
   * Optional secondary action button configuration
   */
  secondaryButton?: {
    title: string;
    onPress: () => void;
    variant?: 'outline' | 'ghost';
  };

  /**
   * Custom style for the container
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Custom style for the title
   */
  titleStyle?: StyleProp<TextStyle>;

  /**
   * Custom style for the message
   */
  messageStyle?: StyleProp<TextStyle>;

  /**
   * Icon color
   */
  iconColor?: string;

  /**
   * Icon size
   */
  iconSize?: number;

  /**
   * Font family for the title text
   */
  titleFontFamily?: string;

  /**
   * Font family for the message text
   */
  messageFontFamily?: string;

  /**
   * Font family for both title and message (will be overridden by specific font family props)
   */
  fontFamily?: string;

  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * EmptyState component displays when there is no content to show
 * with options for guidance text and action buttons
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  actionButton,
  secondaryButton,
  style,
  titleStyle,
  messageStyle,
  iconColor,
  iconSize = 40,
  titleFontFamily,
  messageFontFamily,
  fontFamily,
  testID,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Determine icon color based on theme if not explicitly provided
  const iconColorValue =
    iconColor || (isDark ? Colors.white : Colors.gray[400]);

  // Calculate the bottom margin for primary button based on whether secondary button exists
  const primaryButtonStyle = [
    styles.primaryButton,
    secondaryButton ? { marginBottom: Spacing[3] } : undefined,
  ];

  // Determine font families with fallback logic
  const titleFont = titleFontFamily || fontFamily;
  const messageFont = messageFontFamily || fontFamily;

  return (
    <View
      style={[
        styles.container,
        isDark ? styles.containerDark : styles.containerLight,
        style,
      ]}
      testID={testID}
    >
      <FontAwesome
        name={icon}
        size={iconSize}
        color={iconColorValue}
        style={{ marginBottom: Spacing[4] }}
      />

      <Text
        style={[
          styles.title,
          isDark ? styles.titleDark : styles.titleLight,
          titleFont && { fontFamily: titleFont },
          titleStyle,
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          styles.message,
          isDark ? styles.messageDark : styles.messageLight,
          messageFont && { fontFamily: messageFont },
          messageStyle,
        ]}
      >
        {message}
      </Text>

      {actionButton && (
        <Button
          title={actionButton.title}
          onPress={actionButton.onPress}
          variant={actionButton.variant || 'primary'}
          style={primaryButtonStyle}
        />
      )}

      {secondaryButton && (
        <Button
          title={secondaryButton.title}
          onPress={secondaryButton.onPress}
          variant={secondaryButton.variant || 'outline'}
          style={styles.secondaryButton}
        />
      )}
    </View>
  );
};

// Define the styles type to help TypeScript understand our style object
type EmptyStateStyles = {
  container: ViewStyle;
  containerLight: ViewStyle;
  containerDark: ViewStyle;
  title: TextStyle;
  titleLight: TextStyle;
  titleDark: TextStyle;
  message: TextStyle;
  messageLight: TextStyle;
  messageDark: TextStyle;
  primaryButton: ViewStyle;
  secondaryButton: ViewStyle;
};

const styles = StyleSheet.create<EmptyStateStyles>({
  container: {
    padding: Spacing[6],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.xl,
  },
  containerLight: {
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  containerDark: {
    backgroundColor: Colors.gray[800],
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing[2],
  },
  titleLight: {
    color: Colors.gray[800],
  },
  titleDark: {
    color: Colors.white,
  },
  message: {
    fontSize: FontSizes.base,
    textAlign: 'center',
    marginBottom: Spacing[4],
  },
  messageLight: {
    color: Colors.gray[600],
  },
  messageDark: {
    color: Colors.gray[200],
  },
  primaryButton: {
    minWidth: 200,
  },
  secondaryButton: {
    minWidth: 200,
  },
});

export default EmptyState;
