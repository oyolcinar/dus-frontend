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
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSizes,
} from '../../constants/theme';

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

  // Placeholder text color based on theme
  const placeholderTextColor = isDark ? Colors.gray[500] : Colors.gray[400];

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          style={[
            styles.label,
            isDark ? styles.labelDark : styles.labelLight,
            labelStyle,
          ]}
        >
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputContainer,
          isDark ? styles.inputContainerDark : styles.inputContainerLight,
          error ? styles.inputError : null,
          disabled ? styles.inputDisabled : null,
          multiline ? styles.inputMultiline : null,
        ]}
      >
        {leftIcon && (
          <FontAwesome
            name={leftIcon}
            size={16}
            color={isDark ? Colors.gray[400] : Colors.gray[500]}
            style={styles.leftIcon}
          />
        )}

        <TextInput
          style={[
            styles.input,
            isDark ? styles.inputDark : styles.inputLight,
            leftIcon ? styles.inputWithLeftIcon : null,
            displayRightIcon ? styles.inputWithRightIcon : null,
            multiline ? styles.textMultiline : null,
            inputStyle,
          ]}
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
              color={isDark ? Colors.gray[400] : Colors.gray[500]}
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
    marginBottom: Spacing[4],
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
    borderWidth: 1,
  },
  inputContainerLight: {
    backgroundColor: Colors.gray[100],
    borderColor: Colors.gray[300],
  },
  inputContainerDark: {
    backgroundColor: Colors.gray[700],
    borderColor: Colors.gray[600],
  },
  inputError: {
    borderColor: Colors.error,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  inputMultiline: {
    minHeight: 80,
    alignItems: 'flex-start',
  },
  input: {
    flex: 1,
    paddingVertical: Spacing[2],
    fontSize: FontSizes.base,
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
    paddingTop: Spacing[2],
  },
  leftIcon: {
    paddingHorizontal: Spacing[3],
  },
  rightIconContainer: {
    padding: Spacing[3],
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
