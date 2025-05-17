// components/ui/AppLink.tsx

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Link } from 'expo-router';
import { Colors, FontSizes } from '../../constants/theme';

export interface AppLinkProps {
  /**
   * Destination path to navigate to
   */
  href: string;

  /**
   * Text label for the link (used if no children are provided)
   */
  label?: string;

  /**
   * Custom styling for the label text
   */
  labelStyle?: StyleProp<TextStyle>;

  /**
   * Child components (alternative to using label property)
   */
  children?: React.ReactNode;

  /**
   * Additional props for the TouchableOpacity component
   */
  touchableProps?: React.ComponentProps<typeof TouchableOpacity>;

  /**
   * Additional props for the Text component (when using label)
   */
  textProps?: React.ComponentProps<typeof Text>;

  /**
   * Replace the current history entry instead of adding a new one
   */
  replace?: boolean;

  /**
   * Open the link in a new window (web only)
   */
  target?: '_blank' | '_self';

  /**
   * Additional style for the touchable container
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Is the link currently active
   */
  isActive?: boolean;

  /**
   * Custom styling for active state
   */
  activeStyle?: StyleProp<TextStyle>;
}

/**
 * AppLink component that provides consistent styling and behavior
 * for navigation links throughout the application.
 */
const AppLink: React.FC<AppLinkProps> = ({
  href,
  label,
  labelStyle,
  children,
  touchableProps,
  textProps,
  replace,
  target,
  style,
  isActive,
  activeStyle,
}) => {
  // TypeScript fix: Use the object pattern with type assertion
  const linkHref = { pathname: href as any };

  // If children are provided, use them, otherwise use the TouchableOpacity with label
  const linkContent = children ? (
    children
  ) : (
    <TouchableOpacity
      style={[styles.link, style]}
      {...touchableProps}
      accessibilityRole='link'
    >
      <Text
        style={[
          styles.linkText,
          isActive && styles.activeLink,
          labelStyle,
          isActive && activeStyle,
        ]}
        {...textProps}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Link href={linkHref} asChild replace={replace} target={target}>
      {linkContent}
    </Link>
  );
};

export interface TextLinkProps {
  /**
   * Destination path to navigate to
   */
  href: string;

  /**
   * Text label for the link
   */
  label: string;

  /**
   * Custom style for the link text
   */
  style?: StyleProp<TextStyle>;

  /**
   * Additional props for the Text component
   */
  textProps?: React.ComponentProps<typeof Text>;

  /**
   * Additional props for the TouchableOpacity component
   */
  touchableProps?: React.ComponentProps<typeof TouchableOpacity>;

  /**
   * Custom styling for active state
   */
  activeStyle?: StyleProp<TextStyle>;

  /**
   * Is the link currently active
   */
  isActive?: boolean;
}

/**
 * TextLink provides a simplified interface for text-only links
 */
export const TextLink: React.FC<TextLinkProps> = ({
  href,
  label,
  style,
  textProps,
  touchableProps,
  isActive,
  activeStyle,
}) => {
  return (
    <AppLink
      href={href}
      touchableProps={touchableProps}
      isActive={isActive}
      activeStyle={activeStyle}
    >
      <TouchableOpacity {...touchableProps} accessibilityRole='link'>
        <Text
          style={[styles.linkText, isActive && styles.activeLink, style]}
          {...textProps}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </AppLink>
  );
};

const styles = StyleSheet.create({
  link: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  linkText: {
    color: Colors.primary.DEFAULT,
    fontWeight: '500',
    fontSize: FontSizes.base,
  },
  activeLink: {
    color: Colors.primary.dark,
    fontWeight: '700',
  },
});

export default AppLink;
