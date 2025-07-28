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

// Category color mapping
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
  maxWidth = screenWidth * 0.5,
  testID,
}) => {
  // State management
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [pausedDuration, setPausedDuration] = useState(0); // Total paused time in ms
  const [pauseStartTime, setPauseStartTime] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Refs
  const updateTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const isActiveRef = useRef(true);

  // Calculate elapsed time based on start time, current time, and paused duration
  const calculateElapsedTime = useCallback((): number => {
    if (!sessionStartTime || timerState === 'idle') return 0;

    const now = new Date();
    const totalElapsed = now.getTime() - sessionStartTime.getTime();

    // Subtract paused duration
    let totalPausedTime = pausedDuration;

    // If currently paused, add current pause duration
    if (timerState === 'paused' && pauseStartTime) {
      totalPausedTime += now.getTime() - pauseStartTime.getTime();
    }

    return Math.max(0, Math.floor((totalElapsed - totalPausedTime) / 1000));
  }, [sessionStartTime, pausedDuration, pauseStartTime, timerState]);

  // Update current time every second for real-time calculation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Call onTimeUpdate when time changes
  useEffect(() => {
    if (timerState === 'running') {
      const elapsed = calculateElapsedTime();
      onTimeUpdate?.(elapsed);
    }
  }, [currentTime, timerState, calculateElapsedTime, onTimeUpdate]);

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

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );
    return () => subscription?.remove();
  }, []);

  // Check for existing active session
  const checkExistingSession = async () => {
    try {
      setTimerState('loading');
      console.log('Checking for existing session for topic:', topicId);

      const activeSessions = await getActiveStudySession(topicId);
      console.log('Active sessions response:', activeSessions);

      // Handle both array and single object responses
      const activeSession = Array.isArray(activeSessions)
        ? activeSessions[0]
        : activeSessions;

      if (activeSession?.session_id) {
        console.log('Found active session:', activeSession);

        setSessionId(activeSession.session_id);
        setSessionStartTime(new Date(activeSession.start_time));
        setPausedDuration(0); // Reset paused duration for existing session
        setPauseStartTime(null);
        setTimerState('running');

        console.log('Resumed existing session:', activeSession.session_id);
      } else {
        console.log('No active session found');
        setTimerState('idle');
      }
    } catch (error) {
      console.error('Error checking existing session:', error);
      setTimerState('idle');
    }
  };

  // Handle app state changes - improved logic
  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    console.log(
      'App state changed from',
      appStateRef.current,
      'to',
      nextAppState,
    );

    if (nextAppState === 'active' && !isActiveRef.current) {
      // App came to foreground
      console.log('App came to foreground, timer state:', timerState);
      isActiveRef.current = true;

      // Update current time to trigger recalculation
      setCurrentTime(new Date());
    } else if (
      nextAppState.match(/inactive|background/) &&
      isActiveRef.current
    ) {
      // App went to background
      console.log('App went to background, timer state:', timerState);
      isActiveRef.current = false;
    }

    appStateRef.current = nextAppState;
  };

  // Handle start timer
  const handleStartTimer = async () => {
    if (disabled || timerState === 'loading') return;

    try {
      setTimerState('loading');
      setError(null);
      console.log('Starting study session for topic:', topicId);

      const response = await startStudySession(topicId, notes || undefined);
      console.log('Study session started:', response);

      const startTime = new Date();
      setSessionId(response.sessionId);
      setSessionStartTime(startTime);
      setPausedDuration(0);
      setPauseStartTime(null);
      setTimerState('running');

      onSessionStart?.(response.sessionId);
      console.log('Timer started successfully');
    } catch (error: any) {
      console.error('Error starting study session:', error);
      setError(error.message || 'Failed to start study session');
      setTimerState('idle');
    }
  };

  // Handle pause/resume timer
  const handlePauseTimer = () => {
    const now = new Date();

    if (timerState === 'running') {
      console.log('Pausing timer');
      setPauseStartTime(now);
      setTimerState('paused');
    } else if (timerState === 'paused' && pauseStartTime) {
      console.log('Resuming timer');
      // Add the pause duration to total paused time
      const pauseDuration = now.getTime() - pauseStartTime.getTime();
      setPausedDuration((prev) => prev + pauseDuration);
      setPauseStartTime(null);
      setTimerState('running');
    }
  };

  // Handle stop timer
  const handleStopTimer = async () => {
    if (!sessionId || timerState === 'loading') return;

    const elapsed = calculateElapsedTime();
    const formattedTime = formatTime(elapsed);

    Alert.alert(
      'End Study Session',
      `You've studied for ${formattedTime}. End this session?`,
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
      console.log('Ending study session:', sessionId);

      const response = await endStudySession(sessionId, notes || undefined);
      console.log('Study session ended:', response);

      // Reset all state
      setSessionId(null);
      setSessionStartTime(null);
      setPausedDuration(0);
      setPauseStartTime(null);
      setTimerState('idle');

      onSessionEnd?.(response.session);
      console.log('Timer stopped successfully');
    } catch (error: any) {
      console.error('Error ending study session:', error);
      setError(error.message || 'Failed to end study session');
      setTimerState('running'); // Keep running if failed to end
    }
  };

  // Get variant styles
  const getVariantStyles = () => {
    const categoryColors = category ? CATEGORY_COLORS[category] : null;
    const baseBackgroundColor =
      categoryColors?.background || Colors.primary.DEFAULT;
    const baseTextColor = categoryColors?.text || Colors.white;
    const baseBorderColor = categoryColors?.border || Colors.primary.light;
    const baseIconColor = categoryColors?.iconColor || Colors.white;

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

  // Get status display
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
        return {
          text: 'Paused',
          icon: 'play' as const,
          color: '#FF9800',
        };
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
  const elapsedTime = calculateElapsedTime();

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
          {formatTime(elapsedTime)}
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
            disabled={disabled || timerState !== 'idle'}
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
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              if (timerState === 'idle') {
                handleStartTimer();
              }
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
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
  retryButton: {
    marginTop: Spacing[1],
    padding: Spacing[1],
    backgroundColor: '#F44336',
    borderRadius: BorderRadius.sm,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontSize: FontSizes.xs,
    paddingHorizontal: Spacing[2],
  },
});

export default StudyChronometer;
