// components/ui/Button.tsx

import React from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';

export interface ButtonProps {
  /**
   * Text displayed on the button
   */
  title: string;

  /**
   * Function to call when button is pressed
   */
  onPress: () => void;

  /**
   * Button style variant
   */
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'outline' | 'ghost';

  /**
   * Optional icon to display before the title
   */
  icon?: React.ComponentProps<typeof FontAwesome>['name'];

  /**
   * Size variant of the button
   */
  size?: 'small' | 'medium' | 'large';

  /**
   * Whether the button is in a disabled state
   */
  disabled?: boolean;

  /**
   * Whether the button is in a loading state
   */
  loading?: boolean;

  /**
   * Additional styles to apply to the button container
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Additional styles to apply to the button text
   */
  textStyle?: StyleProp<TextStyle>;

  /**
   * Test ID for testing
   */
  testID?: string;

  /**
   * Accessibility label
   */
  accessibilityLabel?: string;
}

/**
 * Button component that supports various styles, sizes, loading states,
 * and accessibility features.
 */
const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  icon,
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  testID,
  accessibilityLabel,
}) => {
  let buttonStyle;
  let labelStyle;

  // Select button style based on variant
  switch (variant) {
    case 'primary':
      buttonStyle = styles.btnPrimary;
      labelStyle = styles.btnTextPrimary;
      break;
    case 'secondary':
      buttonStyle = styles.btnSecondary;
      labelStyle = styles.btnTextSecondary;
      break;
    case 'success':
      buttonStyle = styles.btnSuccess;
      labelStyle = styles.btnTextSuccess;
      break;
    case 'error':
      buttonStyle = styles.btnError;
      labelStyle = styles.btnTextError;
      break;
    case 'outline':
      buttonStyle = styles.btnOutline;
      labelStyle = styles.btnTextOutline;
      break;
    case 'ghost':
      buttonStyle = styles.btnGhost;
      labelStyle = styles.btnTextGhost;
      break;
    default:
      buttonStyle = styles.btnPrimary;
      labelStyle = styles.btnTextPrimary;
  }

  // Select size styles
  let sizeStyle;
  let iconSize = 16;

  switch (size) {
    case 'small':
      sizeStyle = styles.btnSmall;
      iconSize = 14;
      break;
    case 'large':
      sizeStyle = styles.btnLarge;
      iconSize = 18;
      break;
    default:
      sizeStyle = styles.btnMedium;
      iconSize = 16;
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        buttonStyle,
        sizeStyle,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      testID={testID}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityRole='button'
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator
          size='small'
          color={
            variant === 'outline' || variant === 'ghost'
              ? Colors.primary.DEFAULT
              : Colors.white
          }
          style={styles.loadingIndicator}
        />
      ) : (
        <>
          {icon && (
            <FontAwesome
              name={icon}
              size={iconSize}
              color={
                variant === 'outline' || variant === 'ghost'
                  ? Colors.primary.DEFAULT
                  : Colors.white
              }
              style={styles.icon}
            />
          )}
          <Text
            style={[
              labelStyle,
              size === 'small'
                ? styles.textSmall
                : size === 'large'
                ? styles.textLarge
                : styles.textMedium,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
  },
  btnSmall: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
  },
  btnMedium: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
  },
  btnLarge: {
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[3],
  },
  textSmall: {
    fontSize: 12,
  },
  textMedium: {
    fontSize: 14,
  },
  textLarge: {
    fontSize: 16,
  },
  btnPrimary: {
    backgroundColor: Colors.primary.DEFAULT,
  },
  btnTextPrimary: {
    color: Colors.white,
    fontWeight: '500',
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.white,
  },
  btnTextSecondary: {
    color: Colors.white,
    fontFamily: 'SecondaryFont-Bold',
  },
  btnSuccess: {
    backgroundColor: Colors.success,
  },
  btnTextSuccess: {
    color: Colors.white,
    fontWeight: '500',
  },
  btnError: {
    backgroundColor: Colors.error,
  },
  btnTextError: {
    color: Colors.white,
    fontWeight: '500',
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary.DEFAULT,
  },
  btnTextOutline: {
    color: Colors.primary.DEFAULT,
    fontWeight: '500',
  },
  btnGhost: {
    backgroundColor: Colors.vibrant.orangeLight,
  },
  btnTextGhost: {
    color: Colors.white,
    fontFamily: 'SecondaryFont-Bold',
  },
  disabled: {
    opacity: 0.5,
  },
  icon: {
    marginRight: Spacing[2],
  },
  loadingIndicator: {
    marginRight: 0,
  },
});

export default Button;
