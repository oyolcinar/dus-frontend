// components/ui/Typography/Paragraph.tsx

import React from 'react';
import {
  Text,
  StyleSheet,
  useColorScheme,
  StyleProp,
  TextStyle,
} from 'react-native';
import { ParagraphProps } from '../types';
import { Colors, FontSizes } from '../../../constants/theme';

/**
 * Paragraph component for text content
 */
const Paragraph: React.FC<ParagraphProps> = ({
  children,
  style,
  size = 'medium',
  color,
  align = 'left',
  numberOfLines,
  testID,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Determine font size based on size prop
  let fontSize: number;
  switch (size) {
    case 'small':
      fontSize = FontSizes.sm;
      break;
    case 'large':
      fontSize = FontSizes.lg;
      break;
    default:
      fontSize = FontSizes.base;
  }

  // Combine styles
  const combinedStyle: StyleProp<TextStyle> = [
    styles.paragraph,
    {
      fontSize,
      textAlign: align,
      color: color || (isDark ? Colors.gray[300] : Colors.gray[700]),
    },
    style,
  ];

  return (
    <Text style={combinedStyle} numberOfLines={numberOfLines} testID={testID}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  paragraph: {
    marginBottom: 8,
    lineHeight: 22, // Improved readability with slightly larger line height
  },
});

export default Paragraph;
