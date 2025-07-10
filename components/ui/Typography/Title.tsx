// components/ui/Typography/Title.tsx

import React from 'react';
import {
  Text,
  StyleSheet,
  useColorScheme,
  StyleProp,
  TextStyle,
} from 'react-native';
import { TitleProps } from '../types';
import { Colors, FontSizes } from '../../../constants/theme';

/**
 * Title component for headings with different levels (h1-h6)
 */
const Title: React.FC<TitleProps> = ({
  children,
  level = 1,
  style,
  align = 'left',
  color,
  numberOfLines,
  testID,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Determine font size based on heading level
  let fontSize: number;
  // Use a valid fontWeight type from React Native
  let fontWeight: '400' | '500' | '600' | '700' | 'bold' = 'bold';
  let marginBottom: number = 8;

  switch (level) {
    case 1:
      fontSize = FontSizes['3xl'];
      marginBottom = 16;
      break;
    case 2:
      fontSize = FontSizes['2xl'];
      marginBottom = 12;
      break;
    case 3:
      fontSize = FontSizes.xl;
      marginBottom = 10;
      break;
    case 4:
      fontSize = FontSizes.lg;
      break;
    case 5:
      fontSize = FontSizes.base;
      break;
    case 6:
      fontSize = FontSizes.sm;
      break;
    default:
      fontSize = FontSizes['3xl'];
      marginBottom = 16;
  }

  // Create accessibility label based on heading level
  const accessibilityLabel = `Heading level ${level}: ${
    typeof children === 'string' ? children : ''
  }`;

  // Combine styles
  const combinedStyle: StyleProp<TextStyle> = [
    {
      fontSize,
      fontWeight,
      marginBottom,
      textAlign: align,
      color: color || (isDark ? Colors.gray[900] : Colors.gray[900]),
    },
    style,
  ];

  return (
    <Text
      style={combinedStyle}
      numberOfLines={numberOfLines}
      testID={testID}
      accessibilityRole='header'
      // Use accessibilityLabel instead of accessibilityLevel which doesn't exist
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </Text>
  );
};

export default Title;
