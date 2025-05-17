// components/ui/StatCard.tsx

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
  BorderRadius,
  FontSizes,
} from '../../constants/theme';

export interface StatCardProps {
  /**
   * Icon to display for the stat (FontAwesome)
   */
  icon: React.ComponentProps<typeof FontAwesome>['name'];

  /**
   * Title or label for the stat
   */
  title: string;

  /**
   * Value to display (main stat)
   */
  value: string | number;

  /**
   * Optional change indicator (increase/decrease)
   */
  change?: {
    value: string | number;
    type: 'increase' | 'decrease' | 'neutral';
  };

  /**
   * Color for the icon and accent
   */
  color?: string;

  /**
   * Size of the card - affects padding and spacing
   */
  size?: 'small' | 'medium' | 'large';

  /**
   * Custom container style
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Custom title style
   */
  titleStyle?: StyleProp<TextStyle>;

  /**
   * Custom value style
   */
  valueStyle?: StyleProp<TextStyle>;

  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * StatCard component for displaying statistics, metrics or KPIs
 */
const StatCard: React.FC<StatCardProps> = ({
  icon,
  title,
  value,
  change,
  color = Colors.primary.DEFAULT,
  size = 'medium',
  style,
  titleStyle,
  valueStyle,
  testID,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Determine padding based on size
  const containerPadding =
    size === 'small'
      ? styles.containerSmall
      : size === 'large'
      ? styles.containerLarge
      : styles.containerMedium;

  // Determine icon size based on card size
  const iconSize = size === 'small' ? 16 : size === 'large' ? 24 : 20;

  // Determine text sizes based on card size
  const valueTextStyle =
    size === 'small'
      ? styles.valueSmall
      : size === 'large'
      ? styles.valueLarge
      : styles.valueMedium;

  // Determine change indicator icon - with proper typing
  let changeIcon: React.ComponentProps<typeof FontAwesome>['name'] = 'minus';
  // Initialize changeColor with a default value
  let changeColor: string = Colors.gray[500];

  if (change) {
    switch (change.type) {
      case 'increase':
        changeIcon = 'arrow-up';
        changeColor = Colors.success;
        break;
      case 'decrease':
        changeIcon = 'arrow-down';
        changeColor = Colors.error;
        break;
      default:
        changeIcon = 'minus';
        changeColor = Colors.gray[500];
    }
  }

  return (
    <View
      style={[
        styles.container,
        containerPadding,
        isDark ? styles.containerDark : styles.containerLight,
        style,
      ]}
      testID={testID}
    >
      <FontAwesome name={icon} size={iconSize} color={color} />

      <Text
        style={[
          styles.title,
          isDark ? styles.titleDark : styles.titleLight,
          titleStyle,
        ]}
        numberOfLines={1}
      >
        {title}
      </Text>

      <Text
        style={[
          styles.value,
          valueTextStyle,
          isDark ? styles.valueDark : styles.valueLight,
          valueStyle,
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>

      {change && (
        <View style={styles.changeContainer}>
          <FontAwesome
            name={changeIcon}
            size={10}
            color={changeColor}
            style={{ marginRight: 2 }}
          />
          <Text style={[styles.changeText, { color: changeColor }]}>
            {change.value}
          </Text>
        </View>
      )}
    </View>
  );
};

// Explicitly type the styles object
type StatCardStyles = {
  container: ViewStyle;
  containerSmall: ViewStyle;
  containerMedium: ViewStyle;
  containerLarge: ViewStyle;
  containerLight: ViewStyle;
  containerDark: ViewStyle;
  title: TextStyle;
  titleLight: TextStyle;
  titleDark: TextStyle;
  value: TextStyle;
  valueSmall: TextStyle;
  valueMedium: TextStyle;
  valueLarge: TextStyle;
  valueLight: TextStyle;
  valueDark: TextStyle;
  changeContainer: ViewStyle;
  // changeIcon removed as inline style used instead
  changeText: TextStyle;
};

const styles = StyleSheet.create<StatCardStyles>({
  container: {
    borderRadius: BorderRadius.lg,
  },
  containerSmall: {
    padding: Spacing[2],
  },
  containerMedium: {
    padding: Spacing[3],
  },
  containerLarge: {
    padding: Spacing[4],
  },
  containerLight: {
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  containerDark: {
    backgroundColor: Colors.gray[800],
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  title: {
    fontSize: FontSizes.xs,
    marginTop: Spacing[2],
  },
  titleLight: {
    color: Colors.gray[500],
  },
  titleDark: {
    color: Colors.gray[400],
  },
  value: {
    fontWeight: '600',
  },
  valueSmall: {
    fontSize: FontSizes.sm,
  },
  valueMedium: {
    fontSize: FontSizes.base,
  },
  valueLarge: {
    fontSize: FontSizes.xl,
  },
  valueLight: {
    color: Colors.gray[900],
  },
  valueDark: {
    color: Colors.white,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing[1],
  },
  // Removed changeIcon style to use inline style instead
  changeText: {
    fontSize: FontSizes.xs,
    fontWeight: '500',
  },
});

export default StatCard;
