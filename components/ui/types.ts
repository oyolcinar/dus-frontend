// components/ui/types.ts

import {
  StyleProp,
  ViewStyle,
  TextStyle,
  ImageSourcePropType,
} from 'react-native';
import { FlexibleViewStyle, FlexibleTextStyle } from '../../utils/styleTypes';
import { FontAwesome } from '@expo/vector-icons';
import { Notification } from '../../src/types/models';
// NEW: Enhanced gradient type
export interface GradientStyle {
  colors: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}

// Enhanced Button component props with playful options
export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'error'
    | 'outline'
    | 'ghost'
    // NEW: Playful variants
    | 'vibrant'
    | 'gradient'
    | 'playful'
    | 'bouncy'
    | 'floating';
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
  size?: 'xs' | 'small' | 'medium' | 'large' | 'xl'; // NEW: xl size
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
  accessibilityLabel?: string;
  // NEW: Playful options
  gradient?:
    | GradientStyle
    | keyof typeof import('../../constants/theme').Colors.gradients;
  animated?: boolean;
  wiggleOnPress?: boolean;
  glowEffect?: boolean;
  // NEW: Font option
  fontFamily?: string;
}

// Enhanced Card component props with collapsible and category variants
export interface CardProps {
  title?: string;
  children: React.ReactNode;
  variant?:
    | 'default'
    | 'outlined'
    | 'elevated'
    // Playful variants
    | 'playful'
    | 'glass'
    | 'game'
    | 'floating'
    | 'gradient';
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  padding?: 'none' | 'small' | 'medium' | 'large' | 'xl';
  testID?: string;
  // Playful options
  gradient?:
    | GradientStyle
    | keyof typeof import('../../constants/theme').Colors.gradients;
  animated?: boolean;
  floatingAnimation?: boolean;
  pulseEffect?: boolean;
  borderGlow?: boolean;
  bounceOnPress?: boolean;
  // Font options
  titleFontFamily?: string;
  contentFontFamily?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;

  // NEW: Collapsible functionality
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  onCollapseToggle?: (isCollapsed: boolean) => void;

  // NEW: Medical category color variants
  category?:
    | 'radyoloji'
    | 'restoratif'
    | 'endodonti'
    | 'pedodonti'
    | 'protetik'
    | 'peridontoloji'
    | 'cerrahi'
    | 'ortodonti';

  // NEW: Custom collapse icon
  collapseIcon?: React.ComponentProps<typeof FontAwesome>['name'];
  expandIcon?: React.ComponentProps<typeof FontAwesome>['name'];
}

// Enhanced Badge component props
export interface BadgeProps {
  text: string;
  variant?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'error'
    | 'warning'
    | 'info'
    | 'neutral'
    // NEW: Playful variants
    | 'vibrant'
    | 'gradient'
    | 'glowing';
  size?: 'xs' | 'sm' | 'md' | 'lg'; // NEW: xs and lg sizes
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  pill?: boolean;
  testID?: string;
  // NEW: Playful options
  gradient?:
    | GradientStyle
    | keyof typeof import('../../constants/theme').Colors.gradients;
  animated?: boolean;
  pulseEffect?: boolean;
}

// Enhanced Avatar component props
export interface AvatarProps {
  name?: string;
  imageSource?: ImageSourcePropType;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'; // NEW: 2xl size
  bgColor?: string;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  testID?: string;
  // NEW: Playful options
  gradient?:
    | GradientStyle
    | keyof typeof import('../../constants/theme').Colors.gradients;
  borderGlow?: boolean;
  animated?: boolean;
  floatingEffect?: boolean;
}

// TextLink component props (unchanged)
export interface TextLinkProps {
  href: string;
  label: string;
  style?: StyleProp<TextStyle>;
  textProps?: any;
  touchableProps?: any;
  isActive?: boolean;
  activeStyle?: StyleProp<TextStyle>;
}

// Enhanced EmptyState component props
export interface EmptyStateProps {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  title: string;
  message: string;
  actionButton?: {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'vibrant' | 'gradient'; // NEW: playful variants
  };
  secondaryButton?: {
    title: string;
    onPress: () => void;
    variant?: 'outline' | 'ghost' | 'vibrant'; // NEW: vibrant variant
  };
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  messageStyle?: StyleProp<TextStyle>;
  iconColor?: string;
  iconSize?: number;
  buttonFontFamily?: string;
  testID?: string;
  // NEW: Playful options
  animated?: boolean;
  colorful?: boolean;
  gradient?:
    | GradientStyle
    | keyof typeof import('../../constants/theme').Colors.gradients;
}

// Enhanced StatCard component props
export interface StatCardProps {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  title: string | React.ReactNode;
  value: string | number;
  change?: {
    value: string | number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  color?: string;
  size?: 'small' | 'medium' | 'large' | 'xl'; // NEW: xl size
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  valueStyle?: StyleProp<TextStyle>;
  testID?: string;
  // NEW: Playful options
  variant?: 'default' | 'gradient' | 'vibrant' | 'glowing';
  gradient?:
    | GradientStyle
    | keyof typeof import('../../constants/theme').Colors.gradients;
  animated?: boolean;
  countUpAnimation?: boolean;
  glowEffect?: boolean;
  // NEW: Font options
  titleFontFamily?: string;
  valueFontFamily?: string;
}

// Enhanced Input component props
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
  // NEW: Playful options
  variant?: 'default' | 'playful' | 'rounded' | 'floating';
  glowOnFocus?: boolean;
  animated?: boolean;
}

// Enhanced ProgressBar component props
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
  // NEW: Playful options
  variant?: 'default' | 'gradient' | 'rainbow' | 'glowing';
  gradient?:
    | GradientStyle
    | keyof typeof import('../../constants/theme').Colors.gradients;
  pulseEffect?: boolean;
  strokeAnimation?: boolean;
}

// Enhanced Checkbox component props
export interface CheckboxProps {
  checked: boolean;
  onPress: () => void;
  label?: string;
  disabled?: boolean;
  error?: string;
  size?: 'small' | 'medium' | 'large' | 'xl'; // NEW: xl size
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  testID?: string;
  // NEW: Playful options
  variant?: 'default' | 'playful' | 'rounded' | 'gradient';
  color?: string;
  animated?: boolean;
}

// Layout components props (enhanced)
export interface ContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: 'none' | 'small' | 'medium' | 'large' | 'xl' | '2xl'; // NEW: xl, 2xl
  center?: boolean;
  testID?: string;
  // NEW: Playful options
  gradient?:
    | GradientStyle
    | keyof typeof import('../../constants/theme').Colors.gradients;
  animated?: boolean;
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
  // NEW: Animation option
  animated?: boolean;
  staggerChildren?: boolean;
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
  // NEW: Animation options
  animated?: boolean;
  staggerChildren?: boolean;
}

export interface SpacerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'; // NEW: 2xl
  direction?: 'horizontal' | 'vertical';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// Enhanced Typography components props
export interface TitleProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  style?: StyleProp<TextStyle>;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  color?: string;
  numberOfLines?: number;
  testID?: string;
  // NEW: Playful options
  variant?: 'default' | 'playful' | 'gradient' | 'glowing';
  gradient?:
    | GradientStyle
    | keyof typeof import('../../constants/theme').Colors.gradients;
  animated?: boolean;
  wiggleOnMount?: boolean;
}

export interface ParagraphProps {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  size?: 'small' | 'medium' | 'large' | 'xl'; // NEW: xl size
  color?: string;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  numberOfLines?: number;
  testID?: string;
  // NEW: Playful options
  animated?: boolean;
  fadeInDelay?: number;
}

// Enhanced Divider props
export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  style?: StyleProp<ViewStyle>;
  color?: string;
  thickness?: number;
  marginVertical?: number;
  marginHorizontal?: number;
  testID?: string;
  // NEW: Playful options
  variant?: 'default' | 'gradient' | 'dotted' | 'wavy';
  gradient?:
    | GradientStyle
    | keyof typeof import('../../constants/theme').Colors.gradients;
  animated?: boolean;
}

// Enhanced Spinner props
export interface SpinnerProps {
  size?: 'small' | 'large' | number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  // NEW: Playful options
  variant?: 'default' | 'bouncing' | 'pulsing' | 'colorful';
  colors?: string[];
}

// Enhanced Feedback component props
export interface AlertProps {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
  style?: any;
  testID?: string;
  // NEW: Playful options
  variant?: 'default' | 'playful' | 'gradient' | 'floating';
  gradient?:
    | GradientStyle
    | keyof typeof import('../../constants/theme').Colors.gradients;
  animated?: boolean;
}

export interface ToastProps {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  onClose?: () => void;
  position?: 'top' | 'bottom';
  style?: StyleProp<ViewStyle>;
  testID?: string;
  // NEW: Playful options
  variant?: 'default' | 'playful' | 'gradient';
  animated?: boolean;
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
  // NEW: Playful options
  variant?: 'default' | 'playful' | 'glass' | 'floating';
  animated?: boolean;
  backdropBlur?: boolean;
}

// List props (unchanged for compatibility)
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
  // NEW: Playful options
  variant?: 'default' | 'playful' | 'card';
  animated?: boolean;
}

// Enhanced Tab props
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
  // NEW: Playful options
  variant?: 'default' | 'playful' | 'floating' | 'gradient';
  animated?: boolean;
}

export interface TabItemProps {
  label: string;
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
  isActive?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  // NEW: Playful options
  animated?: boolean;
}

// Enhanced special purpose props for your app
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
  // NEW: Playful options
  variant?: 'default' | 'playful' | 'gradient' | 'glass';
  animated?: boolean;
  glowOnHover?: boolean;
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
  // NEW: Playful options
  variant?: 'default' | 'playful' | 'vibrant' | 'gradient';
  difficultyColors?: boolean; // Auto-color based on difficulty
  animated?: boolean;
  pulseEffect?: boolean;
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
  // NEW: Playful options
  variant?: 'default' | 'playful' | 'status-colored';
  statusGradients?: boolean; // Different gradients for each status
  animated?: boolean;
  urgencyPulse?: boolean; // Pulse for urgent exams
}

export interface ProfileHeaderProps {
  name: string;
  avatar?: string;
  stats?: Array<{ label: string; value: string | number }>;
  onAvatarPress?: () => void;
  onEditPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  // NEW: Playful options
  variant?: 'default' | 'playful' | 'gradient';
  animated?: boolean;
  statsCardsVariant?: 'default' | 'gradient' | 'vibrant';
}

export interface NotificationBadgeProps {
  count?: number;
  maxCount?: number;
  showZero?: boolean;
  dot?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  // NEW: Playful options
  variant?: 'default' | 'gradient' | 'pulsing';
  animated?: boolean;
}

export interface PickerProps {
  items: Array<{ label: string; value: string | number }>;
  selectedValue: string | number | null;
  onValueChange: (itemValue: string | number, itemIndex: number) => void;
  placeholder?: string;
  enabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  // NEW: Playful options
  variant?: 'default' | 'playful' | 'rounded';
}

export interface Opponent {
  id: number;
  username: string;
  avatar_url?: string;
  // Optional stats for display
  wins?: number;
  losses?: number;
  winRate?: number;
}

// Enhanced OpponentListItem component props
export interface OpponentListItemProps {
  user: Opponent;
  onChallenge: (user: Opponent) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  // NEW: Playful options
  variant?: 'default' | 'card' | 'vibrant';
  showStats?: boolean;
  animated?: boolean;
  challengeButtonVariant?: 'primary' | 'vibrant' | 'gradient';
  fontFamily?: string;
  userFontFamily?: string;
  buttonFontFamily?: string;
  winrateFontFamily?: string;
}

// NEW: Additional playful component types for your trivia app
export interface GameButtonProps extends ButtonProps {
  gameAction?: 'start' | 'join' | 'challenge' | 'answer';
  pulseWhenReady?: boolean;
  confettiOnPress?: boolean;
}

export interface ScoreDisplayProps {
  score: number;
  maxScore?: number;
  label?: string;
  animated?: boolean;
  variant?: 'default' | 'celebration' | 'gradient' | 'horizontal';
  size?: 'small' | 'medium' | 'large' | 'hero';
  showProgress?: boolean;
  celebrationThreshold?: number; // Score threshold for celebration effects
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface TimerProps {
  duration: number; // in seconds
  onTimeUp?: () => void;
  onTick?: (remainingTime: number) => void;
  variant?: 'default' | 'urgent' | 'gradient' | 'circular';
  warningThreshold?: number; // seconds when timer becomes urgent
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
  pulseWhenUrgent?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface QuestionDisplayProps {
  question: string;
  options: string[];
  selectedOption?: number;
  correctOption?: number;
  onSelectOption?: (index: number) => void;
  showResult?: boolean;
  variant?: 'default' | 'playful' | 'card' | 'bubble';
  animated?: boolean;
  shuffleAnimation?: boolean;
  resultAnimation?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// NEW: Missing Animation Component Types
export interface FloatingElementProps {
  children: React.ReactNode;
  duration?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface BouncyButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleValue?: number;
  testID?: string;
}

export interface PulseElementProps {
  children: React.ReactNode;
  scale?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface SlideInElementProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  duration?: number;
  delay?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface WiggleElementProps {
  children: React.ReactNode;
  intensity?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// NEW: Game Component Types
export interface AnswerOptionProps {
  option: string;
  index: number;
  isSelected?: boolean;
  isCorrect?: boolean;
  isIncorrect?: boolean;
  showResult?: boolean;
  onPress?: (index: number) => void;
  variant?: 'default' | 'playful' | 'bubble';
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
}

export interface GameStatsProps {
  stats: Array<{
    label: string;
    value: string | number;
    icon?: React.ComponentProps<typeof FontAwesome>['name'];
    color?: string;
  }>;
  variant?: 'default' | 'cards' | 'compact' | 'gradient';
  animated?: boolean;
  countUpAnimation?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface LeaderboardCardProps {
  rank: number;
  name: string;
  score: number;
  avatar?: string;
  isCurrentUser?: boolean;
  variant?: 'default' | 'podium' | 'compact';
  showTrend?: boolean;
  trend?: 'up' | 'down' | 'same';
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface DuelCardProps {
  opponent: {
    name: string;
    avatar?: string;
    stats?: {
      wins?: number;
      losses?: number;
      winRate?: number;
    };
  };
  status?: 'pending' | 'active' | 'completed' | 'declined';
  gameType?: string;
  category?: string;
  stakes?: string;
  timeRemaining?: string;
  onAccept?: () => void;
  onDecline?: () => void;
  onView?: () => void;
  variant?: 'default' | 'compact' | 'detailed';
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// NEW: Power-up button props (using intersection type to avoid variant conflicts)
export interface PowerUpButtonProps extends Omit<ButtonProps, 'variant'> {
  powerUpType: 'hint' | 'skip' | 'freeze' | 'double' | 'extra-time';
  count?: number;
  cost?: number;
  available?: boolean;
  cooldown?: number;
  description?: string;
  variant?:
    | 'default'
    | 'glowing'
    | 'pulsing'
    | 'primary'
    | 'vibrant'
    | 'gradient';
  glowColor?: string;
  testID?: string;
}

// NEW: Typography Enhancement Types (using intersection type to avoid variant conflicts)
export interface PlayfulTitleProps extends Omit<TitleProps, 'variant'> {
  variant?:
    | 'default'
    | 'bouncy'
    | 'gradient'
    | 'shadow'
    | 'outlined'
    | 'playful'
    | 'purple'
    | 'glowing';
  bounceOnMount?: boolean;
  shadowColor?: string;
  outlineColor?: string;
  letterSpacing?: number;
  fontFamily?: string;
}

export interface GradientTextProps {
  children: React.ReactNode;
  gradient?:
    | GradientStyle
    | keyof typeof import('../../constants/theme').Colors.gradients;
  style?: StyleProp<TextStyle>;
  animated?: boolean;
  shimmerEffect?: boolean;
  testID?: string;
}

export interface SpinningWheelProps {
  items: string[];
  onSpinEnd: (item: string, index: number) => void;
  size?: number;
  spinTrigger?: React.RefObject<() => void>;
  spinDuration?: number;
  sliceColors?: string[];
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  spinButtonText?: string;
  spinButtonStyle?: StyleProp<ViewStyle>;
  spinButtonTextStyle?: StyleProp<TextStyle>;
  pointerColor?: string;
  testID?: string;
  fontFamily?: string;
  sliceFontFamily?: string;
  winnerFontFamily?: string;
}

export interface NotificationItemProps {
  notification: Notification;
  onPress?: (notification: Notification) => void;
  onMarkAsRead?: (notificationId: number) => void;
  onDelete?: (notificationId: number) => void;
  style?: ViewStyle;
}
