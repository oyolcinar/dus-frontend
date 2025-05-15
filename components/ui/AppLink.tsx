import React from 'react';
import { Link } from 'expo-router'; // Removed unused LinkProps
import {
  TouchableOpacity,
  Text,
  TouchableOpacityProps,
  TextStyle,
  TextProps as ReactNativeTextProps, // Renamed to avoid conflict if needed
} from 'react-native';
import { styled } from 'nativewind'; // Import styled HOC for NativeWind v2

// For NativeWind v2, if you want to pass className to custom components
// and have them apply styles, you often need to wrap them with `styled`.
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

/**
 * Props for the AppLink component
 */
interface AppLinkProps {
  href: string;
  label?: string;
  labelStyle?: TextStyle;
  children?: React.ReactNode;
  touchableProps?: TouchableOpacityProps;
  textProps?: ReactNativeTextProps; // Using the renamed import
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
  const linkHref = { pathname: href as any };

  const linkContent = children ? (
    children
  ) : (
    // If using AppLink with label directly, ensure this TouchableOpacity/Text
    // can be styled if needed, possibly by also making them `StyledTouchableOpacity`
    // and `StyledText` if they were to accept `className`.
    // For now, it uses traditional `style` props.
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
 * A simpler version of AppLink specifically for text links, styled with NativeWind
 */
interface TextLinkProps {
  href: string;
  label: string;
  className?: string; // To pass additional Tailwind classes for the Text
  // style?: TextStyle; // Removed as we're prioritizing className for NativeWind
  textProps?: ReactNativeTextProps;
  touchableProps?: TouchableOpacityProps;
}

export const TextLink: React.FC<TextLinkProps> = ({
  href,
  label,
  className, // Use this for Tailwind styling
  // style, // Removed
  textProps,
  touchableProps,
}) => {
  // Default classes for the link text + any additional classes passed via props
  // Ensure `text-primary` is defined in your tailwind.config.js (e.g., theme.extend.colors.primary)
  // `font-medium` is Tailwind's class for fontWeight: '500'
  const combinedTextClasses = `text-primary font-medium ${
    className || ''
  }`.trim();

  return (
    <AppLink href={href} touchableProps={touchableProps}>
      {/*
        The TouchableOpacity here is mostly for the press effect.
        If it needed background styling from NativeWind, it would also become <StyledTouchableOpacity>.
        For a simple text link, often the Text styling is primary.
      */}
      <StyledTouchableOpacity {...touchableProps}>
        <StyledText className={combinedTextClasses} {...textProps}>
          {label}
        </StyledText>
      </StyledTouchableOpacity>
    </AppLink>
  );
};
