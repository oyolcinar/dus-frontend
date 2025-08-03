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
  ScrollView,
  Modal,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  startStudySession,
  endStudySession,
  getActiveStudySession,
  formatSessionDuration,
} from '../../src/api/studyService';
import { courseService } from '../../src/api';
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

// Topic interface
interface Topic {
  topic_id: number;
  title: string;
  description?: string;
  course_id: number;
}

// Component props interface
export interface StudyChronometerProps {
  courseId: number;
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
  onSessionStart?: (sessionId: number, topicId: number) => void;
  onSessionEnd?: (sessionData: any) => void;
  onTimeUpdate?: (timeInSeconds: number) => void;
  onTopicChange?: (topicId: number, topicTitle: string) => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  autoStart?: boolean;
  showNotes?: boolean;
  maxWidth?: DimensionValue;
  testID?: string;
  defaultTopicId?: number;
}

const StudyChronometer: React.FC<StudyChronometerProps> = ({
  courseId,
  courseTitle,
  category,
  variant = 'default',
  onSessionStart,
  onSessionEnd,
  onTimeUpdate,
  onTopicChange,
  style,
  disabled = false,
  autoStart = false,
  showNotes = false,
  maxWidth = screenWidth * 0.5,
  testID,
  defaultTopicId,
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

  // Topic selection state
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [showTopicSelector, setShowTopicSelector] = useState(false);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [topicsError, setTopicsError] = useState<string | null>(null);

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

  // Fetch topics for the course
  const fetchTopics = useCallback(async () => {
    try {
      setTopicsLoading(true);
      setTopicsError(null);
      console.log('Fetching topics for course:', courseId);

      const courseTopics = await courseService.getTopicsByCourse(courseId);
      console.log('Fetched topics:', courseTopics);

      setTopics(courseTopics);

      // Set default selected topic
      if (courseTopics.length > 0) {
        const defaultTopic = defaultTopicId
          ? courseTopics.find((t) => t.topic_id === defaultTopicId) ||
            courseTopics[0]
          : courseTopics[0];

        setSelectedTopic(defaultTopic);
        onTopicChange?.(defaultTopic.topic_id, defaultTopic.title);
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
      setTopicsError('Konular yüklenirken hata oluştu');
    } finally {
      setTopicsLoading(false);
    }
  }, [courseId, defaultTopicId, onTopicChange]);

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

  // Fetch topics on mount or when courseId changes
  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  // Check for existing active session when topic changes
  useEffect(() => {
    if (selectedTopic) {
      checkExistingSession();
    }
  }, [selectedTopic?.topic_id]);

  // Auto-start if requested
  useEffect(() => {
    if (autoStart && timerState === 'idle' && !sessionId && selectedTopic) {
      handleStartTimer();
    }
  }, [autoStart, timerState, sessionId, selectedTopic]);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );
    return () => subscription?.remove();
  }, []);

  // Close dropdown when timer state changes or component updates
  useEffect(() => {
    if (timerState === 'running' && showTopicSelector) {
      setShowTopicSelector(false);
    }
  }, [timerState, showTopicSelector]);

  // Check for existing active session
  const checkExistingSession = async () => {
    if (!selectedTopic) return;

    try {
      setTimerState('loading');
      console.log(
        'Checking for existing session for topic:',
        selectedTopic.topic_id,
      );

      const activeSessions = await getActiveStudySession(
        selectedTopic.topic_id,
      );
      console.log('Active sessions response:', activeSessions);

      // Handle both array and single object responses
      const activeSession = Array.isArray(activeSessions)
        ? activeSessions[0]
        : activeSessions;

      if (activeSession?.session_id) {
        console.log('Found active session:', activeSession);

        setSessionId(activeSession.session_id);
        setSessionStartTime(new Date(activeSession.start_time));
        setPausedDuration(0);
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

  // Handle topic selection
  const handleTopicSelect = (topic: Topic) => {
    // Don't allow topic change if timer is running
    if (timerState === 'running' || timerState === 'paused') {
      Alert.alert(
        'Kronometre Aktif',
        'Konu değiştirmek için önce çalışma seansını sonlandırın.',
        [{ text: 'Tamam', style: 'default' }],
      );
      setShowTopicSelector(false);
      return;
    }

    setSelectedTopic(topic);
    setShowTopicSelector(false);
    onTopicChange?.(topic.topic_id, topic.title);
    console.log('Topic selected:', topic);
  };

  // Handle start timer
  const handleStartTimer = async () => {
    if (disabled || timerState === 'loading' || !selectedTopic) return;

    try {
      setTimerState('loading');
      setError(null);
      console.log('Starting study session for topic:', selectedTopic.topic_id);

      const response = await startStudySession(
        selectedTopic.topic_id,
        notes || undefined,
      );
      console.log('Study session started:', response);

      const startTime = new Date();
      setSessionId(response.sessionId);
      setSessionStartTime(startTime);
      setPausedDuration(0);
      setPauseStartTime(null);
      setTimerState('running');

      onSessionStart?.(response.sessionId, selectedTopic.topic_id);
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
    return `${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  // Get status display
  const getStatusDisplay = () => {
    switch (timerState) {
      case 'idle':
        return {
          text: 'Hazır',
          icon: 'play' as const,
          color: variantStyles.iconColor,
        };
      case 'running':
        return {
          text: 'Çalışıyor...',
          icon: 'pause' as const,
          color: '#4CAF50',
        };
      case 'paused':
        return {
          text: 'Durduruldu',
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

  // Render topic selector
  const renderTopicSelector = () => (
    <View style={styles.topicSelectorContainer}>
      {/* Topic Selector Button */}
      <TouchableOpacity
        style={[
          styles.topicSelectorButton,
          { borderColor: variantStyles.iconColor },
        ]}
        onPress={() => setShowTopicSelector(true)}
        disabled={timerState === 'running' || timerState === 'paused'}
        testID={`${testID}-topic-selector`}
      >
        <View style={styles.topicSelectorContent}>
          <FontAwesome
            name='book'
            size={12}
            color={variantStyles.iconColor}
            style={styles.topicIcon}
          />
          <Text
            style={[
              styles.selectedTopicText,
              { color: variantStyles.textColor },
            ]}
            numberOfLines={1}
          >
            {selectedTopic ? selectedTopic.title : 'Konu seçin'}
          </Text>
          <FontAwesome
            name='chevron-down'
            size={10}
            color={variantStyles.iconColor}
          />
        </View>
      </TouchableOpacity>

      {/* Modal-based Topic Selection */}
      <Modal
        visible={showTopicSelector}
        transparent={true}
        animationType='fade'
        onRequestClose={() => setShowTopicSelector(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTopicSelector(false)}
        >
          <View style={styles.modalContainer}>
            <View
              style={[
                styles.modalDropdown,
                {
                  backgroundColor: variantStyles.backgroundColor,
                  borderColor: variantStyles.iconColor,
                },
              ]}
            >
              {topicsLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator
                    size='small'
                    color={variantStyles.iconColor}
                  />
                  <Text
                    style={[
                      styles.loadingText,
                      { color: variantStyles.textColor },
                    ]}
                  >
                    Konular yükleniyor...
                  </Text>
                </View>
              ) : topicsError ? (
                <View style={styles.errorContainer}>
                  <FontAwesome
                    name='exclamation-triangle'
                    size={16}
                    color='#F44336'
                  />
                  <Text style={styles.errorText}>{topicsError}</Text>
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={fetchTopics}
                  >
                    <Text style={styles.retryButtonText}>Tekrar Dene</Text>
                  </TouchableOpacity>
                </View>
              ) : topics.length > 0 ? (
                <>
                  <Text
                    style={[
                      styles.modalTitle,
                      { color: variantStyles.textColor },
                    ]}
                  >
                    Konu Seçin
                  </Text>
                  <ScrollView
                    style={styles.modalTopicsList}
                    showsVerticalScrollIndicator={true}
                    keyboardShouldPersistTaps='handled'
                  >
                    {topics.map((topic, index) => (
                      <TouchableOpacity
                        key={topic.topic_id}
                        style={[
                          styles.modalTopicItem,
                          {
                            borderBottomColor: `${variantStyles.iconColor}30`,
                            backgroundColor:
                              selectedTopic?.topic_id === topic.topic_id
                                ? `${variantStyles.iconColor}20`
                                : 'transparent',
                          },
                        ]}
                        onPress={() => handleTopicSelect(topic)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.topicItemContent}>
                          <Text
                            style={[
                              styles.topicTitle,
                              { color: variantStyles.textColor },
                            ]}
                          >
                            {topic.title}
                          </Text>
                          {topic.description && (
                            <Text
                              style={[
                                styles.topicDescription,
                                { color: variantStyles.textColor },
                              ]}
                            >
                              {topic.description}
                            </Text>
                          )}
                        </View>
                        {selectedTopic?.topic_id === topic.topic_id && (
                          <FontAwesome
                            name='check'
                            size={12}
                            color={variantStyles.iconColor}
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              ) : (
                <View style={styles.emptyContainer}>
                  <FontAwesome
                    name='book'
                    size={20}
                    color={variantStyles.iconColor}
                  />
                  <Text
                    style={[
                      styles.emptyText,
                      { color: variantStyles.textColor },
                    ]}
                  >
                    Bu kurs için henüz konu bulunmuyor.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );

  // Main render function
  const renderContent = () => (
    <View style={[styles.container, { maxWidth: maxWidth as DimensionValue }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text
          style={[styles.courseTitle, { color: Colors.gray[700] }]}
          numberOfLines={1}
        >
          {courseTitle}
        </Text>

        {/* Topic Selector */}
        {renderTopicSelector()}
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
              {
                backgroundColor: variantStyles.iconColor,
                opacity: selectedTopic ? 1 : 0.5,
              },
            ]}
            onPress={handleStartTimer}
            disabled={disabled || timerState !== 'idle' || !selectedTopic}
            testID={`${testID}-start-button`}
          >
            <FontAwesome name='play' size={16} color={Colors.gray[900]} />
            <Text style={[styles.buttonText, { color: Colors.gray[900] }]}>
              Başlat
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
  courseTitle: {
    fontSize: FontSizes.sm,
    fontFamily: 'SecondaryFont-Bold',
    marginBottom: Spacing[2],
  },
  topicSelectorContainer: {
    marginBottom: Spacing[1],
  },
  topicSelectorButton: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
  },
  topicSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topicIcon: {
    marginRight: Spacing[2],
  },
  selectedTopicText: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontFamily: 'SecondaryFont-Regular',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 350,
  },
  modalDropdown: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    maxHeight: 400,
    shadowColor: Colors.gray[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'SecondaryFont-Bold',
    textAlign: 'center',
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalTopicsList: {
    maxHeight: 300,
  },
  modalTopicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[3],
    borderBottomWidth: 0.5,
    minHeight: 50,
  },
  // Loading and Error States
  loadingContainer: {
    padding: Spacing[4],
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing[2],
    fontSize: FontSizes.xs,
    fontFamily: 'SecondaryFont-Regular',
  },
  topicItemContent: {
    flex: 1,
  },
  topicTitle: {
    fontSize: FontSizes.sm,
    fontFamily: 'SecondaryFont-Regular',
  },
  topicDescription: {
    fontSize: FontSizes.xs,
    fontFamily: 'SecondaryFont-Regular',
    opacity: 0.7,
    marginTop: Spacing[1],
  },
  emptyContainer: {
    padding: Spacing[4],
    alignItems: 'center',
  },
  emptyText: {
    marginTop: Spacing[2],
    fontSize: FontSizes.xs,
    fontFamily: 'SecondaryFont-Regular',
    textAlign: 'center',
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
