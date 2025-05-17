// components/ui/TextLink.tsx
import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { Colors } from '../../constants/theme';

interface TextLinkProps {
  href: string;
  label: string;
  style?: any;
  textProps?: React.ComponentProps<typeof Text>;
  touchableProps?: React.ComponentProps<typeof TouchableOpacity>;
}

export const TextLink: React.FC<TextLinkProps> = ({
  href,
  label,
  style,
  textProps,
  touchableProps,
}) => {
  // TypeScript fix: Use the object pattern with type assertion
  const linkHref = { pathname: href as any };

  return (
    <Link href={linkHref} asChild>
      <TouchableOpacity {...touchableProps}>
        <Text style={[styles.text, style]} {...textProps}>
          {label}
        </Text>
      </TouchableOpacity>
    </Link>
  );
};

const styles = StyleSheet.create({
  text: {
    color: Colors.primary.DEFAULT,
    fontWeight: '500',
  },
});

export default TextLink;
