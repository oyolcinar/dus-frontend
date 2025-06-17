// components/ui/index.tsx
//
// This file serves as the main export point for all UI components
// Centralizing exports here allows for easier imports in other files
// and better organization of the component library.

import {
  AnimationConfig,
  BorderRadius,
  Colors,
  CommonStyles,
} from '../../constants/theme';

// Button Components
export { default as Button } from './Button';

// NEW: Enhanced Button Components for Playful Design
export { default as PlayfulButton } from './PlayfulButton';
export { default as GameButton } from './GameButton';

// Link Components
export { default as AppLink } from './AppLink';
export { default as TextLink } from './TextLink';

// Card Components
export { default as Card } from './Card';
export { default as StatCard } from './StatCard';

// NEW: Enhanced Card Components
export { default as PlayfulCard } from './PlayfulCard';
export { default as GameCard } from './GameCard';
export { default as GlassCard } from './GlassCard';

// Display Components
export { default as Badge } from './Badge';
export { default as Avatar } from './Avatar';
export { default as ProgressBar } from './ProgressBar';
export { default as Spinner } from './Spinner';
export { default as EmptyState } from './EmptyState';

// NEW: Enhanced Display Components
export { default as ScoreDisplay } from './ScoreDisplay';
export { default as Timer } from './Timer';
export { default as AnimatedCounter } from './AnimatedCounter';

// Form Components
export { default as Input } from './Input';
export { default as Checkbox } from './Checkbox';
export { default as Picker } from './Picker';

// Typography Components
export { default as Title } from './Typography/Title';
export { default as Paragraph } from './Typography/Paragraph';

// NEW: Enhanced Typography Components
export { default as PlayfulTitle } from './Typography/PlayfulTitle';
export { default as GradientText } from './Typography/GradientText';

// Layout Components
export { default as Container } from './Layout/Container';
export { default as Row } from './Layout/Row';
export { default as Column } from './Layout/Column';
export { default as Divider } from './Layout/Divider';
export { default as Spacer } from './Layout/Spacer';

// NEW: Animation Components
export { default as FloatingElement } from './Animation/FloatingElement';
export { default as BouncyButton } from './Animation/BouncyButton';
export { default as PulseElement } from './Animation/PulseElement';
export { default as SlideInElement } from './Animation/SlideInElement';
export { default as WiggleElement } from './Animation/WiggleElement';

// Feedback Components
export { default as Alert } from './Feedback/Alert';
export { default as Toast } from './Feedback/Toast';
export { default as Modal } from './Feedback/Modal';

// NEW: Enhanced Feedback Components
export { default as PlayfulAlert } from './Feedback/PlayfulAlert';
export { default as CelebrationModal } from './Feedback/CelebrationModal';

// List Components
export { default as List } from './List/List';
export { default as ListItem } from './List/ListItem';
export { default as OpponentListItem } from './OpponentListItem';

// Tab Components
export { default as TabBar } from './Tabs/TabBar';
export { default as TabItem } from './Tabs/TabItem';

// Special Purpose Components
export { default as CourseCard } from './CourseCard';
export { default as QuizCard } from './QuizCard';
export { default as ExamCard } from './ExamCard';
export { default as ProfileHeader } from './ProfileHeader';
export { default as NotificationBadge } from './NotificationBadge';

// NEW: Game-Specific Components
export { default as QuestionDisplay } from './Game/QuestionDisplay';
export { default as AnswerOption } from './Game/AnswerOption';
export { default as GameStats } from './Game/GameStats';
export { default as LeaderboardCard } from './Game/LeaderboardCard';
export { default as DuelCard } from './Game/DuelCard';
export { default as PowerUpButton } from './Game/PowerUpButton';

// Theme Context
export { ThemeProvider, useTheme, ThemeContext } from './ThemeContext';

// NEW: Enhanced Theme Utilities
export {
  Spacing,
  Colors,
  FontSizes,
  FontWeights,
  BorderRadius,
  AnimationConfig,
  CommonStyles,
  StyleHelpers,
} from '../../constants/theme';

// NEW: Gradient Component Wrapper
export { default as LinearGradient } from 'expo-linear-gradient';

// NEW: Animation Hooks
export { useAnimatedValue } from './hooks/useAnimatedValue';
export { useSpringAnimation } from './hooks/useSpringAnimation';
export { usePulseAnimation } from './hooks/usePulseAnimation';
export { useSlideAnimation } from './hooks/useSlideAnimation';

// Type definitions for component props
export type {
  // Base component props (enhanced)
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
  PickerProps,

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
  OpponentListItemProps,

  // Tab props
  TabBarProps,
  TabItemProps,
  Opponent,

  // Special purpose props
  CourseCardProps,
  QuizCardProps,
  ExamCardProps,
  ProfileHeaderProps,
  NotificationBadgeProps,

  // NEW: Enhanced component types
  GradientStyle,
  GameButtonProps,
  ScoreDisplayProps,
  TimerProps,
  QuestionDisplayProps,

  // NEW: Animation component types
  FloatingElementProps,
  BouncyButtonProps,
  PulseElementProps,
  SlideInElementProps,
  WiggleElementProps,

  // NEW: Game component types
  AnswerOptionProps,
  GameStatsProps,
  LeaderboardCardProps,
  DuelCardProps,
  PowerUpButtonProps,

  // NEW: Typography enhancement types
  PlayfulTitleProps,
  GradientTextProps,
} from './types';

// NEW: Utility function exports
export {
  // Style utilities
  createVibrantStyle,
  createGradientStyle,
  createAnimatedStyle,
  createPlayfulShadow,

  // Color utilities
  getRandomVibrantColor,
  getDifficultyColor,
  getStatusColor,

  // Animation utilities
  createBounceAnimation,
  createSlideAnimation,
  createFadeAnimation,
  createPulseAnimation,
} from '../../utils/styleUtils';

// NEW: Constants for easy access
export const VIBRANT_COLORS = Colors.vibrant;
export const GRADIENTS = Colors.gradients;
export const ANIMATION_DURATIONS = AnimationConfig.duration;
export const PLAYFUL_BORDER_RADIUS = {
  button: BorderRadius.button,
  card: BorderRadius.card,
  bubble: BorderRadius.bubble,
  round: BorderRadius.round,
};

// NEW: Default configurations for components
export const DEFAULT_CONFIGS = {
  button: {
    animationDuration: AnimationConfig.duration.normal,
    defaultGradient: Colors.gradients.primary,
  },
  card: {
    defaultShadow: CommonStyles.playfulCard.shadowColor,
    animationDuration: AnimationConfig.duration.slow,
  },
  timer: {
    warningThreshold: 10, // seconds
    urgentThreshold: 5, // seconds
  },
  game: {
    celebrationThreshold: 80, // score percentage
    animationDelay: 100, // ms between staggered animations
  },
};
