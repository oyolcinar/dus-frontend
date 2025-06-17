// utils/styleTypes.ts
import { ViewStyle, TextStyle, ImageStyle, StyleProp } from 'react-native';

// Flexible style types that work with Animated components
export type FlexibleViewStyle = StyleProp<ViewStyle> | any;
export type FlexibleTextStyle = StyleProp<TextStyle> | any;
export type FlexibleImageStyle = StyleProp<ImageStyle> | any;

// Style merger that handles all cases
export const mergeStyles = (...styles: any[]): any => {
  return styles.filter(Boolean).reduce((acc, style) => {
    if (Array.isArray(style)) {
      return { ...acc, ...mergeStyles(...style) };
    }
    return { ...acc, ...style };
  }, {});
};

// Safe style creator for different component types
export const createViewStyle = (style: any): FlexibleViewStyle => style;
export const createTextStyle = (style: any): FlexibleTextStyle => style;
export const createImageStyle = (style: any): FlexibleImageStyle => style;

// Helper to ensure style compatibility with Animated components
export const toAnimatedStyle = (style: any) => {
  if (!style) return undefined;
  if (Array.isArray(style)) {
    return style.map((s) => s || {});
  }
  return style || {};
};
