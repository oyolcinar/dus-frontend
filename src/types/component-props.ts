// src/types/component-props.ts

import { ReactNode } from 'react';
import { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

// Common prop types
export interface BaseProps {
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface WithChildrenProps {
  children?: ReactNode;
}

// Button component props
export interface ButtonProps extends BaseProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'error';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
  iconPosition?: 'left' | 'right';
}

// Card component props
export interface CardProps extends BaseProps, WithChildrenProps {
  title?: string;
  subtitle?: string;
  bordered?: boolean;
  className?: string;
  onPress?: () => void;
}

// Input component props
export interface InputProps extends BaseProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  error?: string;
  disabled?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  className?: string;
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
}

// Avatar component props
export interface AvatarProps extends BaseProps {
  source?: { uri: string };
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  bgColor?: string;
  textColor?: string;
  className?: string;
}

// Badge component props
export interface BadgeProps extends BaseProps {
  text: string;
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

// Empty state component props
export interface EmptyStateProps extends BaseProps {
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
  title: string;
  message?: string;
  actionButton?: {
    title: string;
    onPress: () => void;
  };
  className?: string;
}

// Stat card component props
export interface StatCardProps extends BaseProps {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  title: string;
  value: string;
  color?: string;
  // Note: If className is not supported by your StatCard implementation,
  // you should remove it from this interface
}

// Checkbox component props
export interface CheckboxProps extends BaseProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

// Radio button component props
export interface RadioProps extends BaseProps {
  selected: boolean;
  onChange: (selected: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

// Progress bar component props
export interface ProgressBarProps extends BaseProps {
  progress: number;
  color?: string;
  height?: number;
  className?: string;
}

// Tab component props
export interface TabProps extends BaseProps, WithChildrenProps {
  active?: boolean;
  onPress?: () => void;
  label: string;
  className?: string;
}

// Tab group component props
export interface TabGroupProps extends BaseProps, WithChildrenProps {
  activeTab: string;
  onChange: (tab: string) => void;
  tabs: { id: string; label: string }[];
  className?: string;
}

// Modal component props
export interface ModalProps extends BaseProps, WithChildrenProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  className?: string;
}

// List item component props
export interface ListItemProps extends BaseProps, WithChildrenProps {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  className?: string;
}

// Selector component props
export interface SelectorProps extends BaseProps {
  options: { label: string; value: string }[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// Toast component props
export interface ToastProps extends BaseProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose?: () => void;
  className?: string;
}
