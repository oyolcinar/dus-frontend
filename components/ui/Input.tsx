// components/ui/Input.tsx

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  useColorScheme,
  Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSizes,
} from '../../constants/theme';
import { mergeStyles } from '../../utils/styleTypes';

export interface InputProps {
  /**
   * Input value
   */
  value: string;

  /**
   * Callback when input text changes
   */
  onChangeText: (text: string) => void;

  /**
   * Placeholder text when input is empty
   */
  placeholder?: string;

  /**
   * Label text displayed above the input
   */
  label?: string;

  /**
   * Error message displayed below the input
   */
  error?: string;

  /**
   * Helper text displayed below the input (when no error)
   */
  helperText?: string;

  /**
   * Input type/mode configuration
   */
  inputMode?:
    | 'none'
    | 'text'
    | 'decimal'
    | 'numeric'
    | 'tel'
    | 'search'
    | 'email'
    | 'url';

  /**
   * Auto-capitalization behavior
   */
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';

  /**
   * Whether the input should hide the text (for passwords)
   */
  secureTextEntry?: boolean;

  /**
   * Whether the input is disabled
   */
  disabled?: boolean;

  /**
   * Left icon name (FontAwesome)
   */
  leftIcon?: React.ComponentProps<typeof FontAwesome>['name'];

  /**
   * Right icon name (FontAwesome)
   */
  rightIcon?: React.ComponentProps<typeof FontAwesome>['name'];

  /**
   * Custom handler for right icon press
   */
  onRightIconPress?: () => void;

  /**
   * Custom container style
   */
  containerStyle?: StyleProp<ViewStyle>;

  /**
   * Custom input style
   */
  inputStyle?: StyleProp<TextStyle>;

  /**
   * Custom label style
   */
  labelStyle?: StyleProp<TextStyle>;

  /**
   * Number of lines (for multiline input)
   */
  numberOfLines?: number;

  /**
   * Whether the input is multiline
   */
  multiline?: boolean;

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
 * Input component for text entry with support for labels, icons, and error states
 */
const Input: React.FC<InputProps> = ({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  helperText,
  inputMode,
  autoCapitalize = 'none',
  secureTextEntry = false,
  disabled = false,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  labelStyle,
  numberOfLines,
  multiline = false,
  testID,
  accessibilityLabel,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // State for password visibility toggle
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // Toggle password visibility when using secureTextEntry
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  // Handle right icon (either custom or password toggle)
  const handleRightIconPress = () => {
    if (secureTextEntry) {
      togglePasswordVisibility();
    } else if (onRightIconPress) {
      onRightIconPress();
    }
  };

  // Determine the right icon based on secureTextEntry
  const displayRightIcon = secureTextEntry
    ? isPasswordVisible
      ? 'eye-slash'
      : 'eye'
    : rightIcon;

  // Check if custom containerStyle overrides are provided
  const hasCustomContainer =
    containerStyle && typeof containerStyle === 'object';

  // Create base styles conditionally
  const baseInputContainerStyle = hasCustomContainer
    ? {} // Don't apply default styles if custom container is provided
    : isDark
    ? styles.inputContainerDark
    : styles.inputContainerLight;

  const baseLabelStyle = hasCustomContainer
    ? {} // Don't apply default label styles if custom styling is used
    : isDark
    ? styles.labelDark
    : styles.labelLight;

  // Merge styles safely
  const finalInputContainerStyle = mergeStyles(
    styles.inputContainer,
    baseInputContainerStyle,
    error ? styles.inputError : null,
    disabled ? styles.inputDisabled : null,
    multiline ? styles.inputMultiline : null,
    containerStyle,
  );

  const finalLabelStyle = mergeStyles(styles.label, baseLabelStyle, labelStyle);

  // Determine input padding based on icons and custom styles
  const getInputPadding = () => {
    // If custom inputStyle is provided, let it handle padding
    if (
      inputStyle &&
      typeof inputStyle === 'object' &&
      'paddingLeft' in inputStyle
    ) {
      return {};
    }

    return {
      paddingLeft: leftIcon ? Spacing[1] : Spacing[3],
      paddingRight: displayRightIcon ? Spacing[1] : Spacing[3],
    };
  };

  const finalInputStyle = mergeStyles(
    styles.input,
    hasCustomContainer ? {} : isDark ? styles.inputDark : styles.inputLight,
    getInputPadding(),
    leftIcon ? styles.inputWithLeftIcon : null,
    displayRightIcon ? styles.inputWithRightIcon : null,
    multiline ? styles.textMultiline : null,
    // Apply iOS-specific fixes
    Platform.OS === 'ios' ? styles.inputIOS : null,
    inputStyle,
  );

  // Placeholder text color
  const placeholderTextColor = hasCustomContainer
    ? Colors.gray[400]
    : isDark
    ? Colors.gray[500]
    : Colors.gray[400];

  return (
    <View style={[styles.container]}>
      {label && <Text style={finalLabelStyle}>{label}</Text>}

      <View style={finalInputContainerStyle}>
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            <FontAwesome
              name={leftIcon}
              size={16}
              color={
                hasCustomContainer
                  ? Colors.gray[500]
                  : isDark
                  ? Colors.gray[400]
                  : Colors.gray[500]
              }
            />
          </View>
        )}

        <TextInput
          style={finalInputStyle}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          inputMode={inputMode}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines || 3 : 1}
          testID={testID}
          accessibilityLabel={accessibilityLabel || label}
          accessibilityState={{ disabled }}
          // iOS-specific props to fix text alignment
          {...(Platform.OS === 'ios' && {
            textContentType: inputMode === 'email' ? 'emailAddress' : 'none',
            autoCorrect: false,
          })}
        />

        {displayRightIcon && (
          <TouchableOpacity
            onPress={handleRightIconPress}
            disabled={disabled}
            style={styles.rightIconContainer}
            accessibilityRole='button'
            accessibilityLabel={
              secureTextEntry ? 'Toggle password visibility' : 'Clear input'
            }
          >
            <FontAwesome
              name={displayRightIcon}
              size={16}
              color={
                hasCustomContainer
                  ? Colors.gray[500]
                  : isDark
                  ? Colors.gray[400]
                  : Colors.gray[500]
              }
            />
          </TouchableOpacity>
        )}
      </View>

      {(error || helperText) && (
        <Text
          style={[
            styles.helperText,
            error
              ? styles.errorText
              : isDark
              ? styles.helperTextDark
              : styles.helperTextLight,
          ]}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing[3],
    width: '100%',
  },
  label: {
    marginBottom: Spacing[1],
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  labelLight: {
    color: Colors.gray[700],
  },
  labelDark: {
    color: Colors.gray[300],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    minHeight: 48,
  },
  inputContainerLight: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray[300],
  },
  inputContainerDark: {
    backgroundColor: Colors.gray[700],
    borderWidth: 1,
    borderColor: Colors.gray[600],
  },
  inputError: {
    borderColor: Colors.error,
    borderWidth: 1.5,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  inputMultiline: {
    minHeight: 80,
    alignItems: 'flex-start',
    paddingTop: Spacing[2],
  },
  input: {
    flex: 1,
    fontSize: FontSizes.base,
    paddingVertical: Spacing[3],
    // Remove default margins and padding to prevent misalignment
    margin: 0,
    textAlignVertical: 'center',
  },
  // iOS-specific fixes for text alignment
  inputIOS: {
    paddingTop: Platform.OS === 'ios' ? Spacing[3] + 2 : Spacing[3], // Extra adjustment for custom fonts
    paddingBottom: Platform.OS === 'ios' ? Spacing[3] - 2 : Spacing[3], // Compensate bottom padding
    height: Platform.OS === 'ios' ? 48 : undefined, // Fixed height for iOS
    textAlignVertical: Platform.OS === 'ios' ? 'center' : 'center',
    includeFontPadding: false, // Remove extra font padding
    lineHeight: Platform.OS === 'ios' ? FontSizes.base * 1.1 : undefined, // Custom font line height fix
  },
  inputLight: {
    color: Colors.gray[900],
  },
  inputDark: {
    color: Colors.white,
  },
  inputWithLeftIcon: {
    paddingLeft: 0,
  },
  inputWithRightIcon: {
    paddingRight: 0,
  },
  textMultiline: {
    textAlignVertical: 'top',
    paddingTop: Spacing[3],
    // Override iOS height for multiline
    height: Platform.OS === 'ios' ? undefined : undefined,
  },
  leftIconContainer: {
    paddingLeft: Spacing[3],
    paddingRight: Spacing[2],
    justifyContent: 'center',
    alignItems: 'center',
    height: 48, // Fixed height to match input container
  },
  rightIconContainer: {
    paddingRight: Spacing[3],
    paddingLeft: Spacing[2],
    justifyContent: 'center',
    alignItems: 'center',
    height: 48, // Fixed height to match input container
  },
  helperText: {
    marginTop: Spacing[1],
    fontSize: FontSizes.xs,
  },
  helperTextLight: {
    color: Colors.gray[600],
  },
  helperTextDark: {
    color: Colors.gray[400],
  },
  errorText: {
    color: Colors.error,
  },
});

export default Input;
