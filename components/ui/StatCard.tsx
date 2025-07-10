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
  Dimensions,
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

  /**
   * Custom font family for title
   */
  titleFontFamily?: string;

  /**
   * Custom font family for value
   */
  valueFontFamily?: string;

  /**
   * Enable animated effects
   */
  animated?: boolean;

  /**
   * Enable count up animation for numbers
   */
  countUpAnimation?: boolean;
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
  titleFontFamily,
  valueFontFamily,
  animated = false,
  countUpAnimation = false,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const screenWidth = Dimensions.get('window').width;

  // Calculate card width to fit 2 cards per row with proper spacing
  // Account for screen padding and gap between cards
  const cardWidth = (screenWidth - Spacing[4] * 2 - Spacing[3]) / 3;

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

  // Create custom title style with font family support
  const customTitleStyle: TextStyle = {
    ...(titleFontFamily ? { fontFamily: titleFontFamily } : {}),
  };

  // Create custom value style with font family support
  const customValueStyle: TextStyle = {
    ...(valueFontFamily ? { fontFamily: valueFontFamily } : {}),
    // Remove fontWeight if custom font is provided
    ...(valueFontFamily ? {} : { fontWeight: '600' }),
  };

  return (
    <View
      style={[
        styles.container,
        containerPadding,
        isDark ? styles.containerLight : styles.containerLight,
        {
          width: cardWidth,
          minHeight: size === 'small' ? 80 : size === 'large' ? 120 : 100,
        },
        style,
      ]}
      testID={testID}
    >
      <FontAwesome name={icon} size={iconSize} color={color} />

      <Text
        style={[
          styles.title,
          isDark ? styles.titleLight : styles.titleLight,
          customTitleStyle,
          titleStyle,
        ]}
        numberOfLines={2}
        adjustsFontSizeToFit
      >
        {title}
      </Text>

      <Text
        style={[
          styles.value,
          valueTextStyle,
          isDark ? styles.valueLight : styles.valueLight,
          customValueStyle,
          valueStyle,
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
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
  changeText: TextStyle;
};

const styles = StyleSheet.create<StatCardStyles>({
  container: {
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: Colors.vibrant.purpleDark || Colors.primary.DEFAULT,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  containerDark: {
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  title: {
    fontSize: FontSizes.xs,
    marginTop: Spacing[2],
    textAlign: 'center',
  },
  titleLight: {
    color: Colors.white,
  },
  titleDark: {
    color: Colors.gray[600],
  },
  value: {
    marginTop: Spacing[1],
    textAlign: 'center',
  },
  valueSmall: {
    fontSize: FontSizes.sm,
  },
  valueMedium: {
    fontSize: FontSizes.lg,
  },
  valueLarge: {
    fontSize: FontSizes.xl,
  },
  valueLight: {
    color: Colors.white,
  },
  valueDark: {
    color: Colors.gray[900],
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing[1],
  },
  changeText: {
    fontSize: FontSizes.xs,
    fontWeight: '500',
  },
});

export default StatCard;
