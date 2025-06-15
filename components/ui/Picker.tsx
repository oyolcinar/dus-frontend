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
import { PickerProps } from './types'; // Import props from your central types file

/**
 * A custom Picker component for selecting from a list of options,
 * styled to match the application's theme.
 */
const CustomPicker: React.FC<PickerProps> = ({
  items,
  selectedValue,
  onValueChange,
  placeholder = 'Seçim yapınız...',
  enabled = true,
  style,
  testID,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // The underlying Picker library requires 'undefined' for the empty/placeholder state, not 'null'.
  // This conversion makes our component flexible (accepting null) while satisfying the library.
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
        style={isDark ? styles.pickerDark : styles.pickerLight}
        dropdownIconColor={isDark ? Colors.gray[400] : Colors.gray[600]}
      >
        <Picker.Item
          label={placeholder}
          value={undefined} // The placeholder value MUST be 'undefined'
          style={styles.placeholderItem}
        />
        {items.map((item) => (
          <Picker.Item key={item.value} label={item.label} value={item.value} />
        ))}
      </Picker>
    </View>
  );
};

// Define specific types for the styles to ensure consistency
type PickerComponentStyles = {
  container: ViewStyle;
  containerLight: ViewStyle;
  containerDark: ViewStyle;
  pickerLight: TextStyle; // The picker's internal style is a TextStyle
  pickerDark: TextStyle;
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
    backgroundColor: Colors.gray[100],
    borderColor: Colors.gray[300],
  },
  containerDark: {
    backgroundColor: Colors.gray[700],
    borderColor: Colors.gray[600],
  },
  pickerLight: {
    color: Colors.gray[900],
  },
  pickerDark: {
    color: Colors.white,
  },
  disabled: {
    opacity: 0.5,
  },
  placeholderItem: {
    color: Colors.gray[500],
  },
});

export default CustomPicker;
