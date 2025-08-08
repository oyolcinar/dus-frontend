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
import {
  startStudySession,
  endStudySession,
  getActiveStudySession,
  addBreakTime,
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

// Course interface for the selected course prop
interface Course {
  course_id: number;
  title: string;
  description?: string;
  category?: keyof typeof CATEGORY_COLORS;
}

// Component props interface
export interface StudyChronometerProps {
  selectedCourse: Course | null; // This is ONLY for UI display, NOT for session management
  category?: keyof typeof CATEGORY_COLORS;
  variant?:
    | 'default'
    | 'outlined'
    | 'elevated'
    | 'playful'
    | 'glass'
    | 'floating'
    | 'gradient';
  onSessionStart?: (sessionId: number, courseId: number) => void;
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
  selectedCourse, // ONLY used for UI display
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
  const [pausedDuration, setPausedDuration] = useState(0);
  const [pauseStartTime, setPauseStartTime] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // FIXED: Separate active session state - this is INDEPENDENT of selectedCourse
  const [activeSession, setActiveSession] = useState<{
    sessionId: number;
    courseId: number;
    courseTitle: string;
    startTime: Date;
  } | null>(null);

  // Break time tracking
  const [currentBreakStartTime, setCurrentBreakStartTime] =
    useState<Date | null>(null);
  const [totalBreakTimeSeconds, setTotalBreakTimeSeconds] = useState(0);

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

  // Calculate current break time
  const calculateCurrentBreakTime = useCallback((): number => {
    if (timerState !== 'paused' || !currentBreakStartTime) return 0;
    const now = new Date();
    return Math.floor((now.getTime() - currentBreakStartTime.getTime()) / 1000);
  }, [timerState, currentBreakStartTime]);

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

  // FIXED: Check for existing session on mount ONLY - not when selectedCourse changes
  useEffect(() => {
    checkExistingSession();
  }, []); // Empty dependency array - only run on mount

  // Auto-start if requested
  useEffect(() => {
    if (autoStart && timerState === 'idle' && !sessionId && selectedCourse) {
      handleStartTimer();
    }
  }, [autoStart]); // Only depend on autoStart, not selectedCourse

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );
    return () => subscription?.remove();
  }, []);

  // FIXED: Check for existing active session - independent of selectedCourse
  const checkExistingSession = async () => {
    try {
      setTimerState('loading');
      console.log('Checking for any existing active session...');

      const activeSessionData = await getActiveStudySession();
      console.log('Active session response:', activeSessionData);

      if (activeSessionData?.sessionId) {
        console.log('Found active session:', activeSessionData);

        // Set up the chronometer state
        setSessionId(activeSessionData.sessionId);
        setSessionStartTime(new Date(activeSessionData.startTime));
        setPausedDuration(0);
        setPauseStartTime(null);
        setTotalBreakTimeSeconds(activeSessionData.breakDurationSeconds || 0);
        setTimerState('running');

        // Store active session info
        setActiveSession({
          sessionId: activeSessionData.sessionId,
          courseId: activeSessionData.courseId,
          courseTitle:
            activeSessionData.courseTitle ||
            `Course ${activeSessionData.courseId}`,
          startTime: new Date(activeSessionData.startTime),
        });

        console.log('Resumed existing session:', activeSessionData.sessionId);
      } else {
        console.log('No active session found');
        setTimerState('idle');
        resetSessionState();
      }
    } catch (error) {
      console.error('Error checking existing session:', error);
      setTimerState('idle');
      resetSessionState();
    }
  };

  // Reset session state
  const resetSessionState = () => {
    setSessionId(null);
    setSessionStartTime(null);
    setPausedDuration(0);
    setPauseStartTime(null);
    setCurrentBreakStartTime(null);
    setTotalBreakTimeSeconds(0);
    setActiveSession(null);
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

  // FIXED: Handle start timer - check for conflicts HERE, not in effects
  const handleStartTimer = async () => {
    if (disabled || timerState === 'loading' || !selectedCourse) return;

    // Check if there's an active session for a different course
    if (activeSession && activeSession.courseId !== selectedCourse.course_id) {
      Alert.alert(
        'Aktif Seans Var',
        `"${activeSession.courseTitle}" kursu için aktif bir çalışma seansınız var. Bu seansı sonlandırıp "${selectedCourse.title}" için yeni seans başlatmak istiyor musunuz?`,
        [
          {
            text: 'İptal',
            style: 'cancel',
          },
          {
            text: 'Seansı Sonlandır',
            style: 'destructive',
            onPress: () => {
              // End current session and start new one
              confirmStopTimer(() => {
                // After stopping, start new session
                startNewSession();
              });
            },
          },
        ],
      );
      return;
    }

    // No conflict or same course, start session
    await startNewSession();
  };

  // Start new session
  const startNewSession = async () => {
    if (!selectedCourse) return;

    try {
      setTimerState('loading');
      setError(null);
      console.log(
        'Starting study session for course:',
        selectedCourse.course_id,
      );

      const response = await startStudySession(
        selectedCourse.course_id,
        notes || undefined,
      );
      console.log('Study session started:', response);

      const startTime = new Date();
      setSessionId(response.session.sessionId);
      setSessionStartTime(startTime);
      setPausedDuration(0);
      setPauseStartTime(null);
      setCurrentBreakStartTime(null);
      setTotalBreakTimeSeconds(0);
      setTimerState('running');

      // Store active session info
      setActiveSession({
        sessionId: response.session.sessionId,
        courseId: selectedCourse.course_id,
        courseTitle: selectedCourse.title,
        startTime,
      });

      onSessionStart?.(response.session.sessionId, selectedCourse.course_id);
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
      setCurrentBreakStartTime(now);
      setTimerState('paused');
    } else if (
      timerState === 'paused' &&
      pauseStartTime &&
      currentBreakStartTime
    ) {
      console.log('Resuming timer');
      const pauseDuration = now.getTime() - pauseStartTime.getTime();
      const breakDuration = now.getTime() - currentBreakStartTime.getTime();

      setPausedDuration((prev) => prev + pauseDuration);
      setTotalBreakTimeSeconds(
        (prev) => prev + Math.floor(breakDuration / 1000),
      );
      setPauseStartTime(null);
      setCurrentBreakStartTime(null);
      setTimerState('running');
    }
  };

  // Handle stop timer
  const handleStopTimer = async () => {
    if (!sessionId || timerState === 'loading') return;

    const elapsed = calculateElapsedTime();
    const formattedTime = formatTime(elapsed);

    Alert.alert(
      'Çalışma Seansını Bitir',
      `${formattedTime} süre çalıştınız. Bu seansı sonlandırmak istiyor musunuz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Seansı Bitir',
          style: 'destructive',
          onPress: () => confirmStopTimer(),
        },
      ],
    );
  };

  // Confirm stop timer
  const confirmStopTimer = async (onComplete?: () => void) => {
    if (!sessionId) return;

    try {
      setTimerState('loading');
      setError(null);
      console.log('Ending study session:', sessionId);

      // If currently paused, add the current break time to total break time
      let finalBreakTimeSeconds = totalBreakTimeSeconds;
      if (timerState === 'paused' && currentBreakStartTime) {
        const currentBreakTime = calculateCurrentBreakTime();
        finalBreakTimeSeconds += currentBreakTime;

        // Add the break time to the session before ending
        try {
          await addBreakTime(sessionId, currentBreakTime);
          console.log('Added final break time:', currentBreakTime);
        } catch (breakError) {
          console.error('Error adding final break time:', breakError);
        }
      }

      const response = await endStudySession(sessionId, notes || undefined);
      console.log('Study session ended:', response);

      // Reset all state
      resetSessionState();
      setTimerState('idle');

      onSessionEnd?.(response.session);
      console.log('Timer stopped successfully');

      // Call completion callback if provided
      onComplete?.();
    } catch (error: any) {
      console.error('Error ending study session:', error);
      setError(error.message || 'Failed to end study session');
      setTimerState('running');
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
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get status display
  const getStatusDisplay = () => {
    // FIXED: Check if chronometer is tracking different course than what's selected for viewing
    const isTrackingDifferentCourse =
      activeSession !== null &&
      selectedCourse?.course_id !== activeSession.courseId;

    switch (timerState) {
      case 'idle':
        return {
          text: isTrackingDifferentCourse ? 'Başka kurs aktif' : 'Hazır',
          icon: 'play' as const,
          color: isTrackingDifferentCourse
            ? '#FF9800'
            : variantStyles.iconColor,
        };
      case 'running':
        return {
          text: isTrackingDifferentCourse
            ? 'Başka kurs çalışıyor'
            : 'Çalışıyor...',
          icon: 'pause' as const,
          color: '#4CAF50',
        };
      case 'paused':
        return {
          text: isTrackingDifferentCourse ? 'Başka kurs molada' : 'Mola',
          icon: 'play' as const,
          color: '#FF9800',
        };
      case 'loading':
        return {
          text: 'Yükleniyor...',
          icon: null,
          color: variantStyles.iconColor,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const statusDisplay = getStatusDisplay();
  const elapsedTime = calculateElapsedTime();
  const currentBreakTime = calculateCurrentBreakTime();
  const totalBreakDisplay = totalBreakTimeSeconds + currentBreakTime;

  // Check if tracking different course
  const isTrackingDifferentCourse =
    activeSession !== null &&
    selectedCourse?.course_id !== activeSession.courseId;

  // Main render function
  const renderContent = () => (
    <View style={[styles.container, { maxWidth: maxWidth as DimensionValue }]}>
      {/* Course Display Header */}
      <View style={styles.header}>
        <View style={styles.courseDisplay}>
          <View style={styles.courseDisplayContent}>
            <FontAwesome
              name='book'
              size={12}
              color={variantStyles.iconColor}
              style={styles.courseIcon}
            />
            <Text
              style={[
                styles.selectedCourseText,
                { color: variantStyles.textColor },
                isTrackingDifferentCourse ? { opacity: 0.7 } : undefined,
              ]}
              numberOfLines={2}
            >
              {selectedCourse ? selectedCourse.title : 'Kurs seçin'}
            </Text>
          </View>
          {isTrackingDifferentCourse && activeSession && (
            <Text style={[styles.warningText, { color: '#FF9800' }]}>
              ⚠️ Aktif seans: {activeSession.courseTitle}
            </Text>
          )}
        </View>
      </View>

      {/* Timer Display */}
      <View style={styles.timerSection}>
        <Text
          style={[
            styles.timeDisplay,
            { color: variantStyles.textColor },
            isTrackingDifferentCourse ? { opacity: 0.7 } : undefined,
          ]}
        >
          {formatTime(elapsedTime)}
        </Text>

        {/* Break Time Display */}
        {totalBreakDisplay > 0 && (
          <Text
            style={[
              styles.breakTimeDisplay,
              { color: variantStyles.textColor },
              isTrackingDifferentCourse ? { opacity: 0.7 } : undefined,
            ]}
          >
            ☕ Mola: {formatTime(totalBreakDisplay)}
          </Text>
        )}

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
        {!selectedCourse ? (
          <View style={styles.noCourseContainer}>
            <FontAwesome
              name='book'
              size={24}
              color={Colors.gray[600]}
              style={{ marginBottom: Spacing[2] }}
            />
            <Text style={[styles.noCourseText, { color: Colors.gray[600] }]}>
              Kronometre kullanmak için bir kurs seçin
            </Text>
          </View>
        ) : timerState === 'idle' ? (
          <TouchableOpacity
            style={[
              styles.primaryButton,
              {
                backgroundColor: variantStyles.iconColor,
                opacity: selectedCourse ? 1 : 0.5,
              },
            ]}
            onPress={handleStartTimer}
            disabled={disabled || timerState !== 'idle' || !selectedCourse}
            testID={`${testID}-start-button`}
          >
            <FontAwesome name='play' size={16} color={Colors.gray[900]} />
            <Text style={[styles.buttonText, { color: Colors.gray[900] }]}>
              {isTrackingDifferentCourse ? 'Farklı Kurs Başlat' : 'Başlat'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.activeControls}>
            <TouchableOpacity
              style={[
                styles.controlButton,
                {
                  borderColor: variantStyles.iconColor,
                  opacity: isTrackingDifferentCourse ? 0.5 : 1,
                },
              ]}
              onPress={handlePauseTimer}
              disabled={timerState === 'loading' || isTrackingDifferentCourse}
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
                {
                  borderColor: variantStyles.iconColor,
                  opacity: isTrackingDifferentCourse ? 0.5 : 1,
                },
              ]}
              onPress={handleStopTimer}
              disabled={timerState === 'loading' || isTrackingDifferentCourse}
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
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
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
    shadowColor: Colors.gray[900],
    shadowOffset: { width: 10, height: 20 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  container: {
    padding: Spacing[4],
    minHeight: 180,
  },
  header: {
    marginBottom: Spacing[3],
  },
  courseDisplay: {
    marginBottom: Spacing[1],
  },
  courseDisplayContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.md,
  },
  courseIcon: {
    marginRight: Spacing[2],
  },
  selectedCourseText: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontFamily: 'SecondaryFont-Regular',
  },
  warningText: {
    fontSize: FontSizes.xs,
    fontFamily: 'SecondaryFont-Regular',
    textAlign: 'center',
    marginTop: Spacing[1],
  },
  // Timer Section
  timerSection: {
    marginBottom: Spacing[4],
  },
  timeDisplay: {
    fontSize: FontSizes['4xl'],
    fontWeight: 'bold',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  breakTimeDisplay: {
    fontSize: FontSizes.sm,
    fontFamily: 'SecondaryFont-Regular',
    textAlign: 'center',
    opacity: 0.8,
    marginTop: Spacing[1],
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing[2],
  },
  statusIcon: {
    marginRight: Spacing[1],
  },
  statusText: {
    fontSize: FontSizes.sm,
    fontFamily: 'PrimaryFont',
  },
  // Controls
  controls: {},
  noCourseContainer: {
    alignItems: 'center',
    padding: Spacing[4],
  },
  noCourseText: {
    fontSize: FontSizes.sm,
    fontFamily: 'SecondaryFont-Regular',
    textAlign: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[3],
    borderRadius: BorderRadius.full,
    minWidth: 100,
    shadowColor: Colors.gray[900],
    shadowOffset: { width: 10, height: 20 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  buttonText: {
    marginLeft: Spacing[2],
    fontSize: FontSizes.base,
    fontFamily: 'SecondaryFont-Bold',
  },
  activeControls: {
    flexDirection: 'row',
    justifyContent: 'center',
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
  // Error Styles
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
