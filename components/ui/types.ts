// components/ui/types.ts

import {
  StyleProp,
  ViewStyle,
  TextStyle,
  ImageSourcePropType,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

// Button component props
export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'outline' | 'ghost';
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
  accessibilityLabel?: string;
}

// Card component props
export interface CardProps {
  title?: string;
  children: React.ReactNode;
  variant?: 'default' | 'outlined' | 'elevated';
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  padding?: 'none' | 'small' | 'medium' | 'large';
  testID?: string;
}

// Badge component props
export interface BadgeProps {
  text: string;
  variant?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'error'
    | 'warning'
    | 'info'
    | 'neutral';
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  pill?: boolean;
  testID?: string;
}

// Avatar component props
export interface AvatarProps {
  name?: string;
  imageSource?: ImageSourcePropType;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  bgColor?: string;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  testID?: string;
}

// TextLink component props
export interface TextLinkProps {
  href: string;
  label: string;
  style?: StyleProp<TextStyle>;
  textProps?: any;
  touchableProps?: any;
  isActive?: boolean;
  activeStyle?: StyleProp<TextStyle>;
}

// EmptyState component props
export interface EmptyStateProps {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  title: string;
  message: string;
  actionButton?: {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
  };
  secondaryButton?: {
    title: string;
    onPress: () => void;
    variant?: 'outline' | 'ghost';
  };
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  messageStyle?: StyleProp<TextStyle>;
  iconColor?: string;
  iconSize?: number;
  testID?: string;
}

// StatCard component props
export interface StatCardProps {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  title: string;
  value: string | number;
  change?: {
    value: string | number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  color?: string;
  size?: 'small' | 'medium' | 'large';
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  valueStyle?: StyleProp<TextStyle>;
  testID?: string;
}

// Input component props
export interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  helperText?: string;
  inputMode?:
    | 'none'
    | 'text'
    | 'decimal'
    | 'numeric'
    | 'tel'
    | 'search'
    | 'email'
    | 'url';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  secureTextEntry?: boolean;
  disabled?: boolean;
  leftIcon?: React.ComponentProps<typeof FontAwesome>['name'];
  rightIcon?: React.ComponentProps<typeof FontAwesome>['name'];
  onRightIconPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  labelStyle?: StyleProp<TextStyle>;
  numberOfLines?: number;
  multiline?: boolean;
  testID?: string;
  accessibilityLabel?: string;
}

// ProgressBar component props
export interface ProgressBarProps {
  progress: number;
  showPercentage?: boolean;
  trackColor?: string;
  progressColor?: string;
  height?: number;
  width?: string | number;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  animated?: boolean;
  testID?: string;
}

// Checkbox component props
export interface CheckboxProps {
  checked: boolean;
  onPress: () => void;
  label?: string;
  disabled?: boolean;
  error?: string;
  size?: 'small' | 'medium' | 'large';
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  testID?: string;
}

// Layout components props
export interface ContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: 'none' | 'small' | 'medium' | 'large';
  center?: boolean;
  testID?: string;
}

export interface RowProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  gap?: keyof typeof import('../../constants/theme').Spacing | number;
  justifyContent?:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-between'
    | 'space-around'
    | 'space-evenly';
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  wrap?: boolean;
  testID?: string;
}

export interface ColumnProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  gap?: keyof typeof import('../../constants/theme').Spacing | number;
  justifyContent?:
    | 'flex-start'
    | 'flex-end'
    | 'center'
    | 'space-between'
    | 'space-around'
    | 'space-evenly';
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  testID?: string;
}

export interface SpacerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  direction?: 'horizontal' | 'vertical';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// Typography components props
export interface TitleProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  style?: StyleProp<TextStyle>;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  color?: string;
  numberOfLines?: number;
  testID?: string;
}

export interface ParagraphProps {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  numberOfLines?: number;
  testID?: string;
}

// Divider props
export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  style?: StyleProp<ViewStyle>;
  color?: string;
  thickness?: number;
  marginVertical?: number;
  marginHorizontal?: number;
  testID?: string;
}

// Spinner props
export interface SpinnerProps {
  size?: 'small' | 'large' | number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// Feedback component props
export interface AlertProps {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
  style?: any;
  testID?: string;
}

export interface ToastProps {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  onClose?: () => void;
  position?: 'top' | 'bottom';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string | number;
  height?: string | number;
  closeOnBackdropPress?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// List props
export interface ListProps {
  data: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  keyExtractor?: (item: any, index: number) => string;
  ItemSeparatorComponent?: React.ComponentType<any> | null;
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface ListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: React.ComponentProps<typeof FontAwesome>['name'];
  rightIcon?:
    | React.ComponentProps<typeof FontAwesome>['name']
    | 'chevron-right';
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// Tab props
export interface TabBarProps {
  tabs: Array<{
    key: string;
    label: string;
    icon?: React.ComponentProps<typeof FontAwesome>['name'];
  }>;
  activeTab: string;
  onTabPress: (tabKey: string) => void;
  position?: 'top' | 'bottom';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface TabItemProps {
  label: string;
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
  isActive?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// Special purpose props
export interface CourseCardProps {
  title: string;
  description?: string;
  progress?: number;
  imageUrl?: string;
  lessonCount?: number;
  category?: string;
  duration?: string;
  instructor?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface QuizCardProps {
  title: string;
  description?: string;
  questionCount: number;
  estimatedTime?: number;
  progress?: number;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  testID?: string;
}

export interface ExamCardProps {
  title: string;
  date?: string | Date;
  timeRemaining?: string;
  totalQuestions?: number;
  timeLimit?: number;
  status?: 'upcoming' | 'active' | 'completed' | 'missed';
  score?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface ProfileHeaderProps {
  name: string;
  avatar?: string;
  stats?: Array<{ label: string; value: string | number }>;
  onAvatarPress?: () => void;
  onEditPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface NotificationBadgeProps {
  count?: number;
  maxCount?: number;
  showZero?: boolean;
  dot?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
