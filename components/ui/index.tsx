// components/ui/index.tsx
//
// This file serves as the main export point for all UI components
// Centralizing exports here allows for easier imports in other files
// and better organization of the component library.

// Button Components
export { default as Button } from './Button';

// Link Components
export { default as AppLink } from './AppLink';
export { default as TextLink } from './TextLink';

// Card Components
export { default as Card } from './Card';
export { default as StatCard } from './StatCard';

// Display Components
export { default as Badge } from './Badge';
export { default as Avatar } from './Avatar';
export { default as ProgressBar } from './ProgressBar';
export { default as Spinner } from './Spinner';
export { default as EmptyState } from './EmptyState';

// Form Components
export { default as Input } from './Input';
export { default as Checkbox } from './Checkbox';

// Typography Components
export { default as Title } from './Typography/Title';
export { default as Paragraph } from './Typography/Paragraph';

// Layout Components
export { default as Container } from './Layout/Container';
export { default as Row } from './Layout/Row';
export { default as Column } from './Layout/Column';
export { default as Divider } from './Layout/Divider';
export { default as Spacer } from './Layout/Spacer';

// Feedback Components
export { default as Alert } from './Feedback/Alert';
export { default as Toast } from './Feedback/Toast';
export { default as Modal } from './Feedback/Modal';

// List Components
export { default as List } from './List/List';
export { default as ListItem } from './List/ListItem';

// Tab Components
export { default as TabBar } from './Tabs/TabBar';
export { default as TabItem } from './Tabs/TabItem';

// Special Purpose Components
export { default as CourseCard } from './CourseCard';
export { default as QuizCard } from './QuizCard';
export { default as ExamCard } from './ExamCard';
export { default as ProfileHeader } from './ProfileHeader';
export { default as NotificationBadge } from './NotificationBadge';

// Theme Context
export { ThemeProvider, useTheme, ThemeContext } from './ThemeContext';

// Export theme utilities
export { Spacing } from '../../constants/theme';

// Type definitions for component props
export type {
  // Base component props
  ButtonProps,
  CardProps,
  BadgeProps,
  AvatarProps,
  EmptyStateProps,
  StatCardProps,
  ProgressBarProps,
  InputProps,
  CheckboxProps,
  SpinnerProps,

  // Typography props
  TitleProps,
  ParagraphProps,

  // Layout props
  ContainerProps,
  RowProps,
  ColumnProps,
  DividerProps,
  SpacerProps,

  // Link props
  TextLinkProps,

  // Feedback props
  AlertProps,
  ToastProps,
  ModalProps,

  // List props
  ListProps,
  ListItemProps,

  // Tab props
  TabBarProps,
  TabItemProps,

  // Special purpose props
  CourseCardProps,
  QuizCardProps,
  ExamCardProps,
  ProfileHeaderProps,
  NotificationBadgeProps,
} from './types';
