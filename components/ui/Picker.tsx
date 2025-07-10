// components/ui/Picker.tsx

import React from 'react';
import {
  View,
  StyleSheet,
  useColorScheme,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Colors, BorderRadius } from '../../constants/theme';

export interface PickerProps {
  /**
   * Array of items to display in the picker
   */
  items: Array<{ label: string; value: any }>;

  /**
   * Currently selected value
   */
  selectedValue: any;

  /**
   * Callback when selection changes
   */
  onValueChange: (itemValue: any, itemIndex: number) => void;

  /**
   * Placeholder text when no selection is made
   */
  placeholder?: string;

  /**
   * Whether the picker is enabled
   */
  enabled?: boolean;

  /**
   * Custom style for the container
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Font family for the picker items
   */
  fontFamily?: string;

  /**
   * Font family for the placeholder text
   */
  placeholderFontFamily?: string;

  /**
   * Custom style for the picker text
   */
  textStyle?: StyleProp<TextStyle>;

  /**
   * Custom style for the placeholder text
   */
  placeholderStyle?: StyleProp<TextStyle>;

  /**
   * Force light mode (useful for modals)
   */
  forceLight?: boolean;

  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * A custom Picker component for selecting from a list of options,
 * styled to match the application's theme with customizable font families.
 */
const CustomPicker: React.FC<PickerProps> = ({
  items,
  selectedValue,
  onValueChange,
  placeholder = 'Seçim yapınız...',
  enabled = true,
  style,
  fontFamily = 'SecondaryFont-Regular',
  placeholderFontFamily = 'SecondaryFont-Regular',
  textStyle,
  placeholderStyle,
  forceLight = false,
  testID,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark' && !forceLight;

  // The underlying Picker library requires 'undefined' for the empty/placeholder state, not 'null'.
  const pickerSelectedValue =
    selectedValue === null ? undefined : selectedValue;

  return (
    <View
      style={[
        styles.container,
        isDark ? styles.containerDark : styles.containerLight,
        !enabled && styles.disabled,
        style,
      ]}
      testID={testID}
    >
      <Picker
        selectedValue={pickerSelectedValue}
        onValueChange={onValueChange}
        enabled={enabled}
        style={[isDark ? styles.pickerDark : styles.pickerLight, textStyle]}
        dropdownIconColor={isDark ? Colors.gray[400] : Colors.gray[600]}
        itemStyle={{
          fontFamily: fontFamily,
        }}
      >
        <Picker.Item
          label={placeholder}
          value={undefined}
          style={[styles.placeholderItem, placeholderStyle]}
        />
        {items.map((item) => (
          <Picker.Item
            key={String(item.value)}
            label={item.label}
            value={item.value}
            style={[isDark ? styles.itemDark : styles.itemLight]}
          />
        ))}
      </Picker>
    </View>
  );
};

// Define specific types for the styles
type PickerComponentStyles = {
  container: ViewStyle;
  containerLight: ViewStyle;
  containerDark: ViewStyle;
  pickerLight: TextStyle;
  pickerDark: TextStyle;
  itemLight: TextStyle;
  itemDark: TextStyle;
  disabled: ViewStyle;
  placeholderItem: TextStyle;
};

const styles = StyleSheet.create<PickerComponentStyles>({
  container: {
    height: 50,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  containerLight: {
    backgroundColor: Colors.white,
    borderColor: Colors.gray[300],
  },
  containerDark: {
    backgroundColor: Colors.gray[700],
    borderColor: Colors.gray[600],
  },
  pickerLight: {
    color: Colors.gray[900],
    backgroundColor: Colors.white,
  },
  pickerDark: {
    color: Colors.white,
    backgroundColor: Colors.gray[700],
  },
  itemLight: {
    color: Colors.gray[900],
    backgroundColor: Colors.white,
  },
  itemDark: {
    color: Colors.white,
    backgroundColor: Colors.gray[700],
  },
  disabled: {
    opacity: 0.5,
  },
  placeholderItem: {
    color: Colors.gray[500],
    backgroundColor: Colors.white,
  },
});

export default CustomPicker;
