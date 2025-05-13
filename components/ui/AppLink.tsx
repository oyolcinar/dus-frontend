import React from 'react';
import { Link, LinkProps } from 'expo-router';
import {
  TouchableOpacity,
  Text,
  TouchableOpacityProps,
  TextStyle,
} from 'react-native';

/**
 * Props for the AppLink component
 */
interface AppLinkProps {
  // The path to navigate to
  href: string;
  // Optional label text to display in the link
  label?: string;
  // Optional styling for the label text
  labelStyle?: TextStyle;
  // Optional children elements
  children?: React.ReactNode;
  // Optional props to pass to the TouchableOpacity component
  touchableProps?: TouchableOpacityProps;
  // Optional props to pass to Text component (when using label)
  textProps?: React.ComponentProps<typeof Text>;
}

/**
 * A custom link component that wraps Expo Router's Link component
 * to handle TypeScript type issues with route paths.
 */
export const AppLink: React.FC<AppLinkProps> = ({
  href,
  label,
  labelStyle,
  children,
  touchableProps,
  textProps,
}) => {
  // TypeScript fix: Use the object pattern with type assertion
  const linkHref = { pathname: href as any };

  // If children are provided, use them, otherwise use the TouchableOpacity with label
  const linkContent = children ? (
    children
  ) : (
    <TouchableOpacity {...touchableProps}>
      <Text style={labelStyle} {...textProps}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Link href={linkHref} asChild>
      {linkContent}
    </Link>
  );
};

/**
 * A simpler version of AppLink specifically for text links
 */
interface TextLinkProps {
  href: string;
  label: string;
  style?: TextStyle;
  textProps?: React.ComponentProps<typeof Text>;
  touchableProps?: TouchableOpacityProps;
}

export const TextLink: React.FC<TextLinkProps> = ({
  href,
  label,
  style,
  textProps,
  touchableProps,
}) => {
  return (
    <AppLink href={href} touchableProps={touchableProps}>
      <TouchableOpacity {...touchableProps}>
        <Text
          style={[
            {
              color: 'var(--color-primary)',
              fontWeight: '500',
            },
            style,
          ]}
          {...textProps}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </AppLink>
  );
};
