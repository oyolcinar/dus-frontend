// nativewind-env.d.ts
/// <reference types="nativewind/types" />

// Extend the CSS module types
declare module '*.css' {
  const classes: { [key: string]: string };
  export default classes;
}

// Extend React to include className support
import 'react-native';

declare module 'react-native' {
  interface ViewProps {
    className?: string;
  }
  interface TextProps {
    className?: string;
  }
  interface ImageProps {
    className?: string;
  }
  interface TextInputProps {
    className?: string;
  }
  interface ScrollViewProps {
    className?: string;
  }
  interface TouchableOpacityProps {
    className?: string;
  }
  interface TouchableHighlightProps {
    className?: string;
  }
  interface FlatListProps<T> {
    className?: string;
  }
  interface SectionListProps<T, S> {
    className?: string;
  }
}

// Add support for importing SVG files
declare module '*.svg' {
  import React from 'react';
  import { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}

// Add support for importing PNG, JPG, JPEG files
declare module '*.png' {
  const value: any;
  export default value;
}
declare module '*.jpg' {
  const value: any;
  export default value;
}
declare module '*.jpeg' {
  const value: any;
  export default value;
}
