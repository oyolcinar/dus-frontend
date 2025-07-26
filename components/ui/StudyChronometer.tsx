// components/ui/StudyChronometer.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  AppState,
  AppStateStatus,
  Alert,
  Dimensions,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle,
  DimensionValue,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  startStudySession,
  endStudySession,
  getActiveStudySession,
  formatSessionDuration,
} from '../../src/api/studyService';
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
} from '../../constants/theme';
import { createPlayfulShadow } from '../../utils/styleUtils';

// Get screen dimensions
const { width: screenWidth } = Dimensions.get('window');

// Category color mapping (same as PlayfulCard)
const CATEGORY_COLORS = {
  radyoloji: {
    background: '#FF7675',
    text: '#FFFFFF',
    border: '#FFFFFF',
    iconColor: '#FFFFFF',
  },
  restoratif: {
    background: '#4285F4',
    text: '#FFFFFF',
    border: '#FFFFFF',
    iconColor: '#FFFFFF',
  },
  endodonti: {
    background: '#FFD93D',
    text: '#2D3436',
    border: '#2D3436',
    iconColor: '#2D3436',
  },
  pedodonti: {
    background: '#FF6B9D',
    text: '#FFFFFF',
    border: '#FFFFFF',
    iconColor: '#FFFFFF',
  },
  protetik: {
    background: '#21b958',
    text: '#FFFFFF',
    border: '#FFFFFF',
    iconColor: '#FFFFFF',
  },
  peridontoloji: {
    background: '#800000',
    text: '#FFFFFF',
    border: '#FFFFFF',
    iconColor: '#FFFFFF',
  },
  cerrahi: {
    background: '#ec1c24',
    text: '#FFFFFF',
    border: '#FFFFFF',
    iconColor: '#FFFFFF',
  },
  ortodonti: {
    background: '#702963',
    text: '#FFFFFF',
    border: '#FFFFFF',
    iconColor: '#FFFFFF',
  },
} as const;

// Timer states
type TimerState = 'idle' | 'running' | 'paused' | 'loading';

// Component props interface
export interface StudyChronometerProps {
  topicId: number;
  topicTitle: string;
  courseTitle: string;
  category?: keyof typeof CATEGORY_COLORS;
  variant?:
    | 'default'
    | 'outlined'
    | 'elevated'
    | 'playful'
    | 'glass'
    | 'floating'
    | 'gradient';
  onSessionStart?: (sessionId: number) => void;
  onSessionEnd?: (sessionData: any) => void;
  onTimeUpdate?: (timeInSeconds: number) => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  autoStart?: boolean;
  showNotes?: boolean;
  maxWidth?: DimensionValue;
  testID?: string;
}

const StudyChronometer: React.FC<StudyChronometerProps> = ({
  topicId,
  topicTitle,
  courseTitle,
  category,
  variant = 'default',
  onSessionStart,
  onSessionEnd,
  onTimeUpdate,
  style,
  disabled = false,
  autoStart = false,
  showNotes = false,
  maxWidth = screenWidth * 0.5, // Half screen width by default
  testID,
}) => {
  // State management
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [timeElapsed, setTimeElapsed] = useState(0); // in seconds
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [backgroundTime, setBackgroundTime] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Refs
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);

  // Check for existing active session on mount
  useEffect(() => {
    checkExistingSession();
  }, [topicId]);

  // Auto-start if requested
  useEffect(() => {
    if (autoStart && timerState === 'idle' && !sessionId) {
      handleStartTimer();
    }
  }, [autoStart, timerState, sessionId]);

  // Handle app state changes for background timing
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );
    return () => subscription?.remove();
  }, [timerState]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Check for existing active session
  const checkExistingSession = async () => {
    try {
      setTimerState('loading');
      const activeSession = await getActiveStudySession(topicId);

      if (activeSession?.session_id) {
        setSessionId(activeSession.session_id);
        setStartTime(new Date(activeSession.start_time || Date.now()));

        // Calculate elapsed time from start_time
        const elapsed = Math.floor(
          (Date.now() -
            new Date(activeSession.start_time || Date.now()).getTime()) /
            1000,
        );
        setTimeElapsed(elapsed);
        setTimerState('running');
        startTimerInterval();
      } else {
        setTimerState('idle');
      }
    } catch (error) {
      console.error('Error checking existing session:', error);
      setTimerState('idle');
    }
  };

  // Handle app state changes
  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (
      appStateRef.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      // App came to foreground
      if (timerState === 'running' && backgroundTime) {
        const backgroundDuration = Math.floor(
          (Date.now() - backgroundTime.getTime()) / 1000,
        );
        setTimeElapsed((prev) => prev + backgroundDuration);
        setBackgroundTime(null);
      }
    } else if (
      appStateRef.current === 'active' &&
      nextAppState.match(/inactive|background/)
    ) {
      // App went to background
      if (timerState === 'running') {
        setBackgroundTime(new Date());
      }
    }

    appStateRef.current = nextAppState;
  };

  // Start timer interval
  const startTimerInterval = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTimeElapsed((prev) => {
        const newTime = prev + 1;
        onTimeUpdate?.(newTime);
        return newTime;
      });
    }, 1000);
  }, [onTimeUpdate]);

  // Stop timer interval
  const stopTimerInterval = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Handle start timer
  const handleStartTimer = async () => {
    if (disabled || timerState === 'loading') return;

    try {
      setTimerState('loading');
      setError(null);

      const response = await startStudySession(topicId, notes || undefined);

      setSessionId(response.sessionId);
      setStartTime(new Date());
      setTimeElapsed(0);
      setTimerState('running');

      startTimerInterval();
      onSessionStart?.(response.sessionId);
    } catch (error: any) {
      console.error('Error starting study session:', error);
      setError(error.message || 'Failed to start study session');
      setTimerState('idle');
    }
  };

  // Handle pause timer
  const handlePauseTimer = () => {
    if (timerState === 'running') {
      setTimerState('paused');
      stopTimerInterval();
    } else if (timerState === 'paused') {
      setTimerState('running');
      startTimerInterval();
    }
  };

  // Handle stop timer
  const handleStopTimer = async () => {
    if (!sessionId || timerState === 'loading') return;

    Alert.alert(
      'End Study Session',
      `You've studied for ${
        formatSessionDuration(timeElapsed).formatted
      }. End this session?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Session',
          style: 'destructive',
          onPress: confirmStopTimer,
        },
      ],
    );
  };

  // Confirm stop timer
  const confirmStopTimer = async () => {
    if (!sessionId) return;

    try {
      setTimerState('loading');
      setError(null);

      const response = await endStudySession(sessionId, notes || undefined);

      stopTimerInterval();

      // Reset state
      setSessionId(null);
      setStartTime(null);
      setTimeElapsed(0);
      setTimerState('idle');
      setBackgroundTime(null);

      onSessionEnd?.(response.session);
    } catch (error: any) {
      console.error('Error ending study session:', error);
      setError(error.message || 'Failed to end study session');
      setTimerState('running'); // Keep running if failed to end
    }
  };

  // Get variant styles (similar to PlayfulCard)
  const getVariantStyles = () => {
    const categoryColors = category ? CATEGORY_COLORS[category] : null;

    const baseBackgroundColor =
      categoryColors?.background || Colors.primary.DEFAULT;
    const baseTextColor = categoryColors?.text || Colors.white;
    const baseBorderColor = categoryColors?.border || Colors.primary.light;
    const baseIconColor = categoryColors?.iconColor || Colors.white;

    const glassBg = 'rgba(255, 255, 255, 0.15)';
    const glassBorder = 'rgba(255, 255, 255, 0.3)';

    switch (variant) {
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderColor: baseBorderColor,
          borderWidth: 2,
          textColor: categoryColors ? baseTextColor : baseBorderColor,
          iconColor: categoryColors ? baseIconColor : baseBorderColor,
        };
      case 'elevated':
        return {
          backgroundColor: baseBackgroundColor,
          textColor: baseTextColor,
          iconColor: baseIconColor,
          shadow:
            createPlayfulShadow?.(
              Colors.shadows?.medium || Colors.gray[400],
              'heavy',
            ) || {},
        };
      case 'playful':
        return {
          backgroundColor: baseBackgroundColor,
          textColor: baseTextColor,
          iconColor: baseIconColor,
          shadow:
            createPlayfulShadow?.(
              Colors.vibrant?.purpleLight || Colors.gray[200],
              'medium',
            ) || {},
        };
      case 'glass':
        return {
          backgroundColor: categoryColors ? baseBackgroundColor : glassBg,
          borderColor: categoryColors ? baseBorderColor : glassBorder,
          borderWidth: 1,
          textColor: categoryColors ? baseTextColor : Colors.white,
          iconColor: categoryColors ? baseIconColor : Colors.white,
        };
      case 'floating':
        return {
          backgroundColor: baseBackgroundColor,
          textColor: baseTextColor,
          iconColor: baseIconColor,
          shadow:
            createPlayfulShadow?.(
              Colors.vibrant?.blue || Colors.primary.DEFAULT,
              'heavy',
            ) || {},
        };
      case 'gradient':
        return {
          backgroundColor: 'transparent',
          textColor: baseTextColor,
          iconColor: baseIconColor,
          gradient: [
            baseBackgroundColor,
            categoryColors?.background || Colors.primary.light,
          ] as [string, string],
        };
      default:
        return {
          backgroundColor: baseBackgroundColor,
          textColor: baseTextColor,
          iconColor: baseIconColor,
        };
    }
  };

  // Format time display
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  // Get status text and icon
  const getStatusDisplay = () => {
    switch (timerState) {
      case 'idle':
        return {
          text: 'Ready to Start',
          icon: 'play' as const,
          color: variantStyles.iconColor,
        };
      case 'running':
        return {
          text: 'Studying...',
          icon: 'pause' as const,
          color: '#4CAF50',
        };
      case 'paused':
        return { text: 'Paused', icon: 'play' as const, color: '#FF9800' };
      case 'loading':
        return {
          text: 'Loading...',
          icon: null,
          color: variantStyles.iconColor,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const statusDisplay = getStatusDisplay();

  // Main render function
  const renderContent = () => (
    <View style={[styles.container, { maxWidth: maxWidth as DimensionValue }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text
          style={[styles.courseTitle, { color: variantStyles.textColor }]}
          numberOfLines={1}
        >
          {courseTitle}
        </Text>
        <Text
          style={[styles.topicTitle, { color: variantStyles.textColor }]}
          numberOfLines={2}
        >
          {topicTitle}
        </Text>
      </View>

      {/* Timer Display */}
      <View style={styles.timerSection}>
        <Text style={[styles.timeDisplay, { color: variantStyles.textColor }]}>
          {formatTime(timeElapsed)}
        </Text>
        <View style={styles.statusRow}>
          {timerState === 'loading' ? (
            <ActivityIndicator size='small' color={variantStyles.iconColor} />
          ) : (
            statusDisplay.icon && (
              <FontAwesome
                name={statusDisplay.icon}
                size={16}
                color={statusDisplay.color}
                style={styles.statusIcon}
              />
            )
          )}
          <Text style={[styles.statusText, { color: variantStyles.textColor }]}>
            {statusDisplay.text}
          </Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {timerState === 'idle' ? (
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: variantStyles.iconColor },
            ]}
            onPress={handleStartTimer}
            disabled={
              disabled ||
              (timerState !== 'idle' &&
                timerState !== 'running' &&
                timerState !== 'paused')
            }
            testID={`${testID}-start-button`}
          >
            <FontAwesome
              name='play'
              size={16}
              color={variantStyles.backgroundColor}
            />
            <Text
              style={[
                styles.buttonText,
                { color: variantStyles.backgroundColor },
              ]}
            >
              Start
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.activeControls}>
            <TouchableOpacity
              style={[
                styles.controlButton,
                { borderColor: variantStyles.iconColor },
              ]}
              onPress={handlePauseTimer}
              disabled={timerState === 'loading'}
              testID={`${testID}-pause-button`}
            >
              <FontAwesome
                name={timerState === 'running' ? 'pause' : 'play'}
                size={14}
                color={variantStyles.iconColor}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.controlButton,
                { borderColor: variantStyles.iconColor },
              ]}
              onPress={handleStopTimer}
              disabled={timerState === 'loading'}
              testID={`${testID}-stop-button`}
            >
              <FontAwesome
                name='stop'
                size={14}
                color={variantStyles.iconColor}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );

  // Base style for the card
  const baseCardStyle: StyleProp<ViewStyle> = [
    styles.card,
    {
      backgroundColor: variantStyles.backgroundColor,
      borderColor: variantStyles.borderColor,
      borderWidth: variantStyles.borderWidth,
    },
    variantStyles.shadow,
    style,
  ];

  // Render with gradient if needed
  if (variantStyles.gradient) {
    return (
      <View style={baseCardStyle} testID={testID}>
        <LinearGradient
          colors={variantStyles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientContainer}
        >
          {renderContent()}
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={baseCardStyle} testID={testID}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.card || BorderRadius.xl,
    overflow: 'hidden',
  },
  gradientContainer: {
    borderRadius: BorderRadius.card || BorderRadius.xl,
  },
  container: {
    padding: Spacing[4],
    minHeight: 180,
  },
  header: {
    marginBottom: Spacing[3],
  },
  courseTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold as 'normal',
    opacity: 0.8,
  },
  topicTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold as 'bold',
    marginTop: Spacing[1],
  },
  timerSection: {
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  timeDisplay: {
    fontSize: FontSizes['4xl'],
    fontWeight: FontWeights.bold as 'bold',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing[2],
  },
  statusIcon: {
    marginRight: Spacing[1],
  },
  statusText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium as 'normal',
  },
  controls: {
    alignItems: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[3],
    borderRadius: BorderRadius.full,
    minWidth: 100,
  },
  buttonText: {
    marginLeft: Spacing[2],
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold as 'normal',
  },
  activeControls: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    marginTop: Spacing[2],
    padding: Spacing[2],
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: BorderRadius.md,
  },
  errorText: {
    color: '#F44336',
    fontSize: FontSizes.xs,
    textAlign: 'center',
  },
});

export default StudyChronometer;
