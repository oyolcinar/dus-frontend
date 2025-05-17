// components/ui/Checkbox.tsx

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { CheckboxProps } from './types';
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSizes,
} from '../../constants/theme';

/**
 * Checkbox component for boolean selection
 */
const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onPress,
  label,
  disabled = false,
  error,
  size = 'medium',
  style,
  labelStyle,
  testID,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Determine checkbox size
  let checkboxSize: number;
  let iconSize: number;

  switch (size) {
    case 'small':
      checkboxSize = 16;
      iconSize = 10;
      break;
    case 'large':
      checkboxSize = 24;
      iconSize = 16;
      break;
    default:
      checkboxSize = 20;
      iconSize = 12;
  }

  // Determine checkbox and border colors based on state and theme
  const getBorderColor = () => {
    if (error) return Colors.error;
    if (disabled) return isDark ? Colors.gray[600] : Colors.gray[300];
    if (checked) return Colors.primary.DEFAULT;
    return isDark ? Colors.gray[500] : Colors.gray[400];
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        style={styles.touchable}
        accessibilityRole='checkbox'
        accessibilityState={{ checked, disabled }}
        testID={testID}
      >
        <View
          style={[
            styles.checkbox,
            {
              width: checkboxSize,
              height: checkboxSize,
              borderColor: getBorderColor(),
              backgroundColor: checked
                ? disabled
                  ? isDark
                    ? Colors.gray[600]
                    : Colors.gray[300]
                  : Colors.primary.DEFAULT
                : 'transparent',
            },
          ]}
        >
          {checked && (
            <FontAwesome name='check' size={iconSize} color={Colors.white} />
          )}
        </View>

        {label && (
          <Text
            style={[
              styles.label,
              {
                color: disabled
                  ? isDark
                    ? Colors.gray[600]
                    : Colors.gray[400]
                  : isDark
                  ? Colors.gray[300]
                  : Colors.gray[700],
              },
              labelStyle,
            ]}
          >
            {label}
          </Text>
        )}
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing[2],
  },
  touchable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    borderWidth: 2,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    marginLeft: Spacing[2],
    fontSize: FontSizes.base,
  },
  errorText: {
    marginTop: Spacing[1],
    fontSize: FontSizes.xs,
    color: Colors.error,
  },
});

export default Checkbox;
