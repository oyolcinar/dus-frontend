// app/(tabs)/duels/[id].tsx - PERFORMANCE OPTIMIZED VERSION

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  memo,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  BackHandler,
  useColorScheme,
  Animated,
  Dimensions,
  ViewStyle,
  TextStyle,
  ScrollView,
  Platform,
  StyleProp,
  StyleSheet,
  FlatList,
  ListRenderItem,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

import {
  useDuelRoomManagement,
  useDuelTimer,
  duelHelpers,
  FinalResults,
} from '../../../src/hooks/useDuelsData';
import { useAuth, usePreferredCourse } from '../../../stores/appStore';
import {
  analyticsService,
  userQuestionHistoryService,
  duelResultService,
} from '../../../src/api';
import { CreateDuelResultInput } from '../../../src/api/duelResultService';

import QuestionReportModal from '../../../components/ui/QuestionReportModal';

import {
  Container,
  PlayfulCard,
  PlayfulTitle,
  Paragraph,
  Row,
  Column,
  Avatar,
  Badge,
  Button,
  EmptyState,
  Modal,
  Alert as UIAlert,
  AnimatedCounter,
  ScoreDisplay,
  ProgressBar,
  SlideInElement,
  FloatingElement,
  GlassCard,
  LinearGradient,
} from '../../../components/ui';
import { Colors, Spacing, BorderRadius } from '../../../constants/theme';

const { width, height } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';

interface Question {
  id: number;
  text: string;
  options: Record<string, string>;
  correctAnswer?: string;
  explanation?: string;
}

interface AnsweredQuestion {
  questionId: number;
  selectedAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  timeTaken: number;
  questionText: string;
  options: Record<string, string>;
}

type DuelPhase =
  | 'connecting'
  | 'lobby'
  | 'countdown'
  | 'question'
  | 'results'
  | 'final'
  | 'error';

interface OptionItem {
  key: string;
  value: string;
}

// 📍 EXTRACTED STYLES - CREATED ONCE AT MODULE LOAD
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.primary.dark,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[4],
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: Colors.vibrant.purple,
  },
  scrollContent: {
    paddingTop: Spacing[4],
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[8],
    minHeight: height - 100,
  },
  duelInfoHeader: {
    backgroundColor: Colors.vibrant.orangeLight,
    borderRadius: BorderRadius['3xl'],
    padding: Spacing[3],
    marginTop: 40,
    marginBottom: Spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    width: '100%',
    elevation: 10,
  },
  whiteText: {
    color: Colors.white,
    fontFamily: 'SecondaryFont-Bold',
  },
  lightText: {
    color: Colors.gray?.[300] || '#d1d5db',
    textAlign: 'center',
    fontFamily: 'SecondaryFont-Regular',
  },
  duelInfoLoading: {
    fontSize: 12,
    color: Colors.gray?.[200] || '#e5e5e5',
    textAlign: 'center',
    fontFamily: 'SecondaryFont-Regular',
    marginLeft: Spacing[2],
  },
  duelInfoCourse: {
    fontSize: 14,
    color: Colors.white,
    textAlign: 'center',
    fontFamily: 'SecondaryFont-Bold',
    marginBottom: 4,
  },
  duelInfoTest: {
    fontSize: 12,
    color: Colors.gray?.[200] || '#e5e5e5',
    textAlign: 'center',
    fontFamily: 'SecondaryFont-Regular',
  },
  duelInfoBot: {
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'SecondaryFont-Bold',
    marginTop: 4,
  },
  logoVideo: {
    width: 247,
    height: 247,
    borderRadius: 20,
  },
  lobbyCard: {
    padding: Spacing[4],
    width: Math.floor(width * 0.9),
    maxWidth: 400,
  },
  vsText: {
    fontSize: 24,
    color: Colors.white,
    marginHorizontal: Spacing[4],
    fontFamily: 'PrimaryFont',
  },
  botInfoCard: {
    padding: Spacing[3],
    marginTop: Spacing[4],
    alignSelf: 'stretch',
  },
  botInfoTitle: {
    fontSize: 14,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing[2],
    fontFamily: 'SecondaryFont-Bold',
  },
  botInfoText: {
    fontSize: 12,
    color: Colors.gray?.[300] || '#d1d5db',
    textAlign: 'center',
    fontFamily: 'SecondaryFont-Regular',
    marginBottom: 2,
  },
  countdownText: {
    fontSize: 120,
    color: Colors.white,
    fontFamily: 'PrimaryFont',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  questionHeaderContainer: {
    backgroundColor: Colors.vibrant.orangeLight,
    borderRadius: BorderRadius['3xl'],
    padding: Spacing[4],
    marginBottom: Spacing[4],
    minHeight: 80,
  },
  questionHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionCounter: {
    fontSize: 16,
    color: Colors.white,
    fontFamily: 'SecondaryFont-Bold',
  },
  timer: {
    fontSize: 24,
    color: Colors.white,
    fontFamily: 'PrimaryFont',
  },
  timerDanger: {
    color: Colors.vibrant?.pink,
  },
  timerUnsynced: {
    opacity: 0.7,
    fontStyle: 'italic',
  },
  opponentStatus: {
    fontSize: 12,
    color: Colors.gray?.[200] || '#d1d5db',
    fontFamily: 'SecondaryFont-Regular',
  },
  scoreContainer: {
    backgroundColor: Colors.vibrant.orangeLight,
    borderRadius: BorderRadius['3xl'],
    padding: Spacing[4],
    marginBottom: Spacing[6],
    minHeight: 100,
  },
  scoreRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreDisplayWrapper: {
    flex: 1,
    alignItems: 'center',
    minHeight: 60,
    justifyContent: 'center',
    maxWidth: '50%',
  },
  questionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius['3xl'],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: Spacing[6],
    minHeight: 400,
  },
  questionContent: {
    padding: Spacing[6],
    minHeight: 350,
    justifyContent: 'center',
    fontFamily: 'SecondaryFont-Regular',
  },
  questionText: {
    fontSize: 16,
    color: Colors.white,
    textAlign: 'left',
    marginBottom: Spacing[6],
    fontFamily: 'SecondaryFont-Regular',
    lineHeight: 28,
    minHeight: 60,
  },
  optionsContainer: {
    minHeight: 240,
  },
  optionButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  selectedOption: {
    backgroundColor: Colors.vibrant?.purple || '#8b5cf6',
    borderColor: Colors.white,
    borderWidth: 3,
    fontFamily: 'SecondaryFont-Bold',
  },
  disabledOption: {
    opacity: 0.6,
  },
  optionText: {
    fontSize: 16,
    color: Colors.white,
    fontFamily: 'SecondaryFont-Regular',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
  },
  selectedOptionText: {
    fontFamily: 'SecondaryFont-Bold',
  },
  correctOption: {
    backgroundColor: Colors.vibrant.mint || '#10b981',
    borderColor: '#059669',
    borderWidth: 3,
  },
  correctOptionText: {
    color: Colors.white,
    fontFamily: 'SecondaryFont-Bold',
    fontWeight: '700',
  },
  wrongSelectedOption: {
    backgroundColor: Colors.vibrant.coral || '#f87171',
    borderColor: '#dc2626',
    borderWidth: 3,
  },
  wrongSelectedOptionText: {
    color: Colors.white,
    fontFamily: 'SecondaryFont-Bold',
    fontWeight: '700',
  },
  answerStatusContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius['3xl'],
    padding: Spacing[4],
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
  },
  answerStatusBadge: {
    marginBottom: Spacing[2],
    fontFamily: 'SecondaryFont-Bold',
  },
  answerStatusText: {
    color: Colors.gray?.[300] || '#d1d5db',
    textAlign: 'center',
    fontFamily: 'SecondaryFont-Regular',
  },
  questionResultsContainer: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius['3xl'],
    padding: Spacing[4],
    marginBottom: Spacing[4],
  },
  correctAnswerContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: BorderRadius['3xl'],
    padding: Spacing[3],
    marginBottom: Spacing[4],
    minHeight: 50,
    justifyContent: 'center',
  },
  correctAnswer: {
    fontSize: 16,
    color: Colors.vibrant?.mint || '#10b981',
    textAlign: 'center',
    fontFamily: 'SecondaryFont-Bold',
  },
  explanationContainer: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderRadius: BorderRadius['3xl'],
    padding: Spacing[4],
    marginTop: Spacing[3],
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    width: '100%',
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.vibrant.blue || '#3b82f6',
    textAlign: 'center',
    marginBottom: Spacing[3],
    fontFamily: 'SecondaryFont-Bold',
  },
  explanationText: {
    fontSize: 14,
    color: Colors.white,
    textAlign: 'left',
    lineHeight: 22,
    fontFamily: 'SecondaryFont-Regular',
  },
  bottomSpacing: {
    height: Spacing[8],
  },
  resultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: height - 200,
  },
  resultsCard: {
    padding: Spacing[6],
    width: Math.floor(width * 0.95),
    maxWidth: 500,
    minHeight: 400,
    borderRadius: BorderRadius['3xl'],
  },
  questionResultsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
    textAlign: 'left',
    marginBottom: Spacing[4],
    fontFamily: 'SecondaryFont-Bold',
    lineHeight: 24,
  },
  resultsOptionsContainer: {
    width: '100%',
    marginBottom: Spacing[3],
  },
  resultOptionButton: {
    borderRadius: BorderRadius.lg,
    padding: Spacing[3],
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: Spacing[2],
  },
  correctResultOption: {
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    borderColor: Colors.vibrant.mint || '#10b981',
    borderWidth: 3,
  },
  wrongResultOption: {
    backgroundColor: 'rgba(248, 113, 113, 0.3)',
    borderColor: Colors.vibrant.coral || '#f87171',
    borderWidth: 3,
  },
  resultOptionText: {
    fontSize: 14,
    color: Colors.white,
    fontFamily: 'SecondaryFont-Regular',
    textAlign: 'left',
    lineHeight: 20,
  },
  correctResultOptionText: {
    color: Colors.white,
    fontFamily: 'SecondaryFont-Bold',
    fontWeight: '700',
  },
  wrongResultOptionText: {
    color: Colors.white,
    fontFamily: 'SecondaryFont-Bold',
    fontWeight: '700',
  },
  resultRowContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius['3xl'],
    padding: Spacing[4],
    marginVertical: Spacing[4],
    minHeight: 120,
  },
  resultRow: {
    justifyContent: 'space-around',
    width: '100%',
  },
  playerResultContainer: {
    flex: 1,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  playerResult: {
    alignItems: 'center',
    gap: Spacing[2],
  },
  playerName: {
    fontSize: 14,
    color: Colors.white,
    fontFamily: 'SecondaryFont-Bold',
  },
  resultBadge: {
    marginVertical: Spacing[1],
  },
  timeText: {
    fontSize: 12,
    color: Colors.gray?.[300] || '#d1d5db',
    fontFamily: 'SecondaryFont-Regular',
  },
  selectedAnswerText: {
    fontSize: 11,
    color: Colors.gray?.[400] || '#9ca3af',
    fontFamily: 'SecondaryFont-Regular',
    marginTop: 4,
    textAlign: 'center',
  },
  currentScoreContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius['3xl'],
    padding: Spacing[4],
    marginTop: Spacing[4],
    minHeight: 80,
    justifyContent: 'center',
  },
  currentScore: {
    alignItems: 'center',
    gap: Spacing[4],
    justifyContent: 'center',
  },
  scoreVs: {
    fontSize: 24,
    color: Colors.white,
    fontFamily: 'PrimaryFont',
  },
  scoreLabel: {
    fontSize: 12,
    color: Colors.gray?.[300] || '#d1d5db',
    fontFamily: 'SecondaryFont-Regular',
    marginTop: 4,
  },
  reportQuestionContainer: {
    backgroundColor: 'rgba(255, 183, 3, 0.1)',
    borderRadius: BorderRadius['3xl'],
    padding: Spacing[4],
    marginVertical: Spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(255, 183, 3, 0.3)',
    alignItems: 'center',
  },
  reportQuestionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.vibrant?.yellow || '#fbbf24',
    textAlign: 'center',
    marginBottom: Spacing[2],
    fontFamily: 'SecondaryFont-Bold',
  },
  reportQuestionDescription: {
    fontSize: 12,
    color: Colors.gray?.[300] || '#d1d5db',
    textAlign: 'center',
    marginBottom: Spacing[3],
    fontFamily: 'SecondaryFont-Regular',
    lineHeight: 16,
  },
  reportButton: {
    backgroundColor: Colors.vibrant?.coral || '#f87171',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportButtonText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'SecondaryFont-Bold',
  },
  nextQuestionContainer: {
    marginTop: Spacing[4],
    minHeight: 40,
    justifyContent: 'center',
  },
  finalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: height - 200,
  },
  finalCard: {
    padding: Spacing[6],
    width: Math.floor(width * 0.95),
    maxWidth: 500,
    minHeight: 600,
    borderRadius: BorderRadius['3xl'],
  },
  winnerSectionContainer: {
    width: '100%',
    marginBottom: Spacing[6],
  },
  winnerSection: {
    alignItems: 'center',
    minHeight: 150,
    justifyContent: 'center',
  },
  winnerEmoji: {
    fontSize: 64,
    marginBottom: Spacing[2],
  },
  winnerText: {
    color: Colors.vibrant?.mint || '#10b981',
    fontFamily: 'SecondaryFont-Bold',
  },
  loserText: {
    color: Colors.vibrant?.coral || '#f87171',
  },
  drawText: {
    color: Colors.vibrant?.yellow || '#fbbf24',
  },
  botVictoryText: {
    fontSize: 16,
    color: Colors.vibrant?.mint || '#10b981',
    textAlign: 'center',
    fontFamily: 'SecondaryFont-Bold',
    marginTop: Spacing[2],
  },
  botDefeatText: {
    fontSize: 16,
    color: Colors.vibrant?.coral || '#f87171',
    textAlign: 'center',
    fontFamily: 'SecondaryFont-Bold',
    marginTop: Spacing[2],
  },
  finalScoreContainer: {
    width: '100%',
    marginBottom: Spacing[6],
  },
  finalScore: {
    justifyContent: 'space-between',
    width: '100%',
    minHeight: 100,
    alignItems: 'center',
  },
  finalScoreWrapper: {
    flex: 1,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
    width: '50%',
    maxWidth: '50%',
    paddingHorizontal: Spacing[2],
  },
  duelSummaryContainer: {
    width: '100%',
    marginBottom: Spacing[6],
    borderRadius: BorderRadius['3xl'],
  },
  duelSummary: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius['3xl'],
    padding: Spacing[4],
    minHeight: 120,
    justifyContent: 'center',
  },
  duelSummaryTitle: {
    fontSize: 16,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing[2],
    fontFamily: 'SecondaryFont-Bold',
  },
  duelSummaryText: {
    fontSize: 12,
    color: Colors.gray?.[300] || '#d1d5db',
    textAlign: 'center',
    fontFamily: 'SecondaryFont-Regular',
    marginBottom: 2,
  },
  resultCreatedContainer: {
    marginTop: Spacing[3],
    alignItems: 'center',
  },
  resultCreatedBadge: {
    alignSelf: 'center',
  },
  statsSectionContainer: {
    width: '100%',
    marginBottom: Spacing[6],
  },
  statsSection: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius['3xl'],
    padding: Spacing[4],
    minHeight: 80,
  },
  statsRow: {
    justifyContent: 'space-between',
    marginBottom: Spacing[2],
  },
  additionalStatsRow: {
    justifyContent: 'space-between',
    marginTop: Spacing[2],
  },
  statText: {
    fontSize: 14,
    color: Colors.gray?.[300] || '#d1d5db',
    fontFamily: 'SecondaryFont-Regular',
  },
  actionButtonsContainer: {
    width: '100%',
    minHeight: 60,
  },
  actionButtons: {
    gap: Spacing[4],
    width: '100%',
    justifyContent: 'space-between',
  },
  actionButton: {
    fontFamily: 'SecondaryFont-Bold',
    flex: 1,
    minHeight: 50,
  },
});

// 📍 MEMOIZED SUB-COMPONENTS

// Helper function to safely access question options
const getOptionValue = (
  options: Record<string, string>,
  key: string,
): string => {
  return options[key] || 'N/A';
};

// Memoized Duel Info Header
const DuelInfoHeader = memo<{
  isLoading: boolean;
  duelInfo: any;
  opponentInfo: any;
  botInfo: any;
  isCreatingDuelResult: boolean;
}>(({ isLoading, duelInfo, opponentInfo, botInfo, isCreatingDuelResult }) => {
  const getBotDisplayInfo = useCallback(() => {
    if (!opponentInfo?.isBot || !botInfo?.botInfo) return null;
    return duelHelpers.getBotDisplayInfo(botInfo.botInfo);
  }, [opponentInfo?.isBot, botInfo?.botInfo]);

  if (isLoading) {
    return (
      <View style={styles.duelInfoHeader}>
        <Row style={{ alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size='small' color={Colors.white} />
          <Text style={styles.duelInfoLoading}>
            Düello bilgileri yükleniyor...
          </Text>
        </Row>
      </View>
    );
  }

  if (!duelInfo) return null;

  const botDisplayInfo = getBotDisplayInfo();

  return (
    <View style={styles.duelInfoHeader}>
      <Row style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Column style={{ alignItems: 'center', flex: 1 }}>
          {duelInfo.course?.title && (
            <Text style={styles.duelInfoCourse}>
              📚 {duelInfo.course.title}
            </Text>
          )}
          {duelInfo.test?.title && (
            <Text style={styles.duelInfoTest}>📝 {duelInfo.test.title}</Text>
          )}
          {botDisplayInfo && (
            <Text style={[styles.duelInfoBot, { color: botDisplayInfo.color }]}>
              🤖 {botDisplayInfo.name} (Seviye {botDisplayInfo.difficulty})
            </Text>
          )}
          {isCreatingDuelResult && (
            <Text style={styles.duelInfoLoading}>Sonuçlar kaydediliyor...</Text>
          )}
        </Column>
      </Row>
    </View>
  );
});

// Memoized Question Header
const QuestionHeader = memo<{
  questionIndex: number;
  totalQuestions: number;
  displayTimeLeft: number;
  serverSynced: boolean;
  opponentAnswered: boolean;
  opponentInfo: any;
}>(
  ({
    questionIndex,
    totalQuestions,
    displayTimeLeft,
    serverSynced,
    opponentAnswered,
    opponentInfo,
  }) => (
    <View style={styles.questionHeaderContainer}>
      <Row style={styles.questionHeader}>
        <Column>
          <Text style={styles.questionCounter}>
            Soru {questionIndex + 1} / {totalQuestions}
          </Text>
          <ProgressBar
            progress={Number(
              (((questionIndex + 1) / totalQuestions) * 100).toFixed(0),
            )}
            progressColor={Colors.vibrant.mint}
            style={{ width: 120, marginTop: Spacing[1] }}
          />
        </Column>
        <Column style={{ alignItems: 'flex-end' }}>
          <Text
            style={[
              styles.timer,
              displayTimeLeft <= 10 && styles.timerDanger,
              !serverSynced && styles.timerUnsynced,
            ]}
          >
            {displayTimeLeft}s {serverSynced ? '🟢' : '🔄'}
          </Text>
          <Text style={styles.opponentStatus}>
            {opponentAnswered
              ? `${opponentInfo?.isBot ? 'Bot' : 'Rakip'}: Tamamladı ✓`
              : `${opponentInfo?.isBot ? 'Bot' : 'Rakip'}: ${
                  opponentInfo?.isBot ? 'Hesaplıyor...' : 'Düşünüyor...'
                }`}
          </Text>
        </Column>
      </Row>
    </View>
  ),
);

// Memoized Score Section
const ScoreSection = memo<{
  userScore: number;
  opponentScore: number;
  totalQuestions: number;
  user: any;
  opponentInfo: any;
}>(({ userScore, opponentScore, totalQuestions, user, opponentInfo }) => (
  <View style={styles.scoreContainer}>
    <Row style={styles.scoreRow}>
      <View style={styles.scoreDisplayWrapper}>
        <ScoreDisplay
          score={userScore}
          maxScore={totalQuestions}
          label={user?.username || 'Sen'}
          variant='gradient'
          size='small'
        />
      </View>
      <View style={styles.scoreDisplayWrapper}>
        <ScoreDisplay
          score={opponentScore}
          maxScore={totalQuestions}
          label={opponentInfo?.username || 'Rakip'}
          variant='gradient'
          size='small'
        />
      </View>
    </Row>
  </View>
));

// Memoized Option Item for FlatList
const OptionItem = memo<{
  item: OptionItem;
  selectedAnswer: string | null;
  hasAnswered: boolean;
  correctAnswer?: string;
  onPress: (key: string) => void;
}>(({ item, selectedAnswer, hasAnswered, correctAnswer, onPress }) => {
  const { key, value } = item;

  const isSelected = selectedAnswer === key;
  const isCorrect = correctAnswer === key;
  const showResultsInQuestion = hasAnswered && correctAnswer;

  const optionStyle = useMemo(() => {
    let style: StyleProp<ViewStyle> = styles.optionButton;

    if (showResultsInQuestion) {
      if (isCorrect) {
        style = [styles.optionButton, styles.correctOption];
      } else if (isSelected) {
        style = [styles.optionButton, styles.wrongSelectedOption];
      }
    } else if (isSelected) {
      style = [styles.optionButton, styles.selectedOption];
    }

    if (hasAnswered) {
      style = Array.isArray(style)
        ? [...style, styles.disabledOption]
        : [style, styles.disabledOption];
    }

    return style;
  }, [showResultsInQuestion, isCorrect, isSelected, hasAnswered]);

  const optionTextStyle = useMemo(() => {
    let style: StyleProp<TextStyle> = styles.optionText;

    if (showResultsInQuestion) {
      if (isCorrect) {
        style = [styles.optionText, styles.correctOptionText];
      } else if (isSelected) {
        style = [styles.optionText, styles.wrongSelectedOptionText];
      }
    } else if (isSelected) {
      style = [styles.optionText, styles.selectedOptionText];
    }

    return style;
  }, [showResultsInQuestion, isCorrect, isSelected]);

  const handlePress = useCallback(() => {
    onPress(key);
  }, [key, onPress]);

  return (
    <TouchableOpacity
      style={optionStyle}
      onPress={handlePress}
      disabled={hasAnswered}
      activeOpacity={0.8}
    >
      <Text style={optionTextStyle}>
        {key}) {value}
        {showResultsInQuestion && isCorrect && ' ✓'}
        {showResultsInQuestion && isSelected && !isCorrect && ' ✗'}
        {showResultsInQuestion && isSelected && ' (Seçiminiz)'}
      </Text>
    </TouchableOpacity>
  );
});

// 📍 MAIN SCREEN COMPONENTS - MEMOIZED

// Memoized Connecting Screen
const ConnectingScreen = memo<{
  logoVideo: any;
  pulseAnim: Animated.Value;
  renderDuelInfoHeader: () => React.ReactNode;
}>(({ logoVideo, pulseAnim, renderDuelInfoHeader }) => (
  <View style={styles.mainContainer}>
    <View style={{ marginHorizontal: Spacing[4] }}>
      {renderDuelInfoHeader()}
    </View>
    <View style={styles.contentWrapper}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <PlayfulCard
          variant='gradient'
          style={{
            width: 128,
            height: 128,
            borderRadius: 64,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: Spacing[4],
            alignContent: 'center',
          }}
          contentContainerStyle={{
            alignItems: 'center',
            justifyContent: 'center',
            alignContent: 'center',
          }}
          animated={true}
          floatingAnimation={true}
          gradient='purple'
        >
          <Video
            source={logoVideo}
            style={styles.logoVideo}
            shouldPlay={true}
            isLooping={true}
            isMuted={true}
            resizeMode={ResizeMode.COVER}
            useNativeControls={false}
            usePoster={false}
          />
        </PlayfulCard>
      </Animated.View>
      <PlayfulTitle level={2} style={styles.whiteText}>
        Düelloya Bağlanıyor...
      </PlayfulTitle>
      <ActivityIndicator
        size='large'
        color={Colors.white}
        style={{ marginTop: Spacing[4] }}
      />
    </View>
  </View>
));

// Memoized Lobby Screen
const LobbyScreen = memo<{
  renderDuelInfoHeader: () => React.ReactNode;
  user: any;
  opponentInfo: any;
  botInfo: any;
}>(({ renderDuelInfoHeader, user, opponentInfo, botInfo }) => {
  const getBotDisplayInfo = useCallback(() => {
    if (!opponentInfo?.isBot || !botInfo?.botInfo) return null;
    return duelHelpers.getBotDisplayInfo(botInfo.botInfo);
  }, [opponentInfo?.isBot, botInfo?.botInfo]);

  const botDisplayInfo = getBotDisplayInfo();

  return (
    <ScrollView style={styles.mainContainer}>
      <View style={{ marginHorizontal: Spacing[4] }}>
        {renderDuelInfoHeader()}
      </View>
      <View style={styles.contentWrapper}>
        <PlayfulCard variant='glass' style={styles.lobbyCard}>
          <Column style={{ alignItems: 'center' }}>
            <Row
              style={{
                alignItems: 'center',
                marginBottom: Spacing[6],
              }}
            >
              <Avatar
                size='lg'
                name={user?.username?.charAt(0) || 'K'}
                bgColor={Colors.vibrant.purple}
                style={{}}
              />
              <Text style={styles.vsText}>KARŞI</Text>
              <Avatar
                size='lg'
                name={
                  botDisplayInfo
                    ? botDisplayInfo.avatar
                    : opponentInfo?.username?.charAt(0) || '?'
                }
                bgColor={
                  botDisplayInfo ? botDisplayInfo.color : Colors.vibrant.orange
                }
                style={{}}
              />
            </Row>

            <PlayfulTitle level={3} style={styles.whiteText}>
              Düello Lobisi
            </PlayfulTitle>

            <Paragraph style={styles.lightText}>
              {opponentInfo?.isBot
                ? `${opponentInfo.username} ile düello başlıyor...`
                : opponentInfo?.username
                  ? `${opponentInfo.username} ile düello başlıyor...`
                  : 'Her iki oyuncunun hazır olması bekleniyor...'}
            </Paragraph>

            {botDisplayInfo && (
              <View style={styles.botInfoCard}>
                <Text style={styles.botInfoTitle}>Bot Bilgileri</Text>
                <Text style={styles.botInfoText}>
                  Zorluk: Seviye {botDisplayInfo.difficulty} • Doğruluk:{' '}
                  {botDisplayInfo.accuracy}%
                </Text>
                <Text style={styles.botInfoText}>
                  Ortalama Yanıt Süresi: {botDisplayInfo.avgTime}s
                </Text>
              </View>
            )}

            <Row style={{ marginTop: Spacing[4] }}>
              <Badge
                text='Hazır ✓'
                variant='success'
                fontFamily='SecondaryFont-Bold'
              />
              <Badge
                text={opponentInfo?.isBot ? 'Bot Hazır ✓' : 'Bekliyor...'}
                variant={opponentInfo?.isBot ? 'success' : 'warning'}
                fontFamily='SecondaryFont-Bold'
              />
            </Row>
          </Column>
        </PlayfulCard>
      </View>
    </ScrollView>
  );
});

// Memoized Countdown Screen
const CountdownScreen = memo<{
  countdown: number;
  pulseAnim: Animated.Value;
  renderDuelInfoHeader: () => React.ReactNode;
}>(({ countdown, pulseAnim, renderDuelInfoHeader }) => (
  <View style={styles.mainContainer}>
    <View style={{ marginHorizontal: Spacing[4] }}>
      {renderDuelInfoHeader()}
    </View>
    <View style={styles.contentWrapper}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Text style={styles.countdownText}>{countdown}</Text>
      </Animated.View>
      <PlayfulTitle level={2} style={styles.whiteText}>
        Hazır Olun!
      </PlayfulTitle>
    </View>
  </View>
));

// Memoized Question Screen
const QuestionScreen = memo<{
  currentQuestion: Question | null;
  questionIndex: number;
  totalQuestions: number;
  displayTimeLeft: number;
  serverSynced: boolean;
  opponentAnswered: boolean;
  opponentInfo: any;
  userScore: number;
  opponentScore: number;
  user: any;
  selectedAnswer: string | null;
  hasAnswered: boolean;
  onAnswerSelect: (answer: string) => void;
  renderDuelInfoHeader: () => React.ReactNode;
}>(
  ({
    currentQuestion,
    questionIndex,
    totalQuestions,
    displayTimeLeft,
    serverSynced,
    opponentAnswered,
    opponentInfo,
    userScore,
    opponentScore,
    user,
    selectedAnswer,
    hasAnswered,
    onAnswerSelect,
    renderDuelInfoHeader,
  }) => {
    // Convert options to FlatList data
    const optionsData = useMemo(() => {
      if (!currentQuestion?.options) return [];
      return Object.entries(currentQuestion.options).map(([key, value]) => ({
        key,
        value,
      }));
    }, [currentQuestion?.options]);

    // FlatList render item
    const renderOptionItem: ListRenderItem<OptionItem> = useCallback(
      ({ item }) => (
        <OptionItem
          item={item}
          selectedAnswer={selectedAnswer}
          hasAnswered={hasAnswered}
          correctAnswer={currentQuestion?.correctAnswer}
          onPress={onAnswerSelect}
        />
      ),
      [
        selectedAnswer,
        hasAnswered,
        currentQuestion?.correctAnswer,
        onAnswerSelect,
      ],
    );

    // FlatList key extractor
    const keyExtractor = useCallback((item: OptionItem) => item.key, []);

    if (!currentQuestion || !currentQuestion.options) {
      return (
        <View style={styles.mainContainer}>
          <View style={{ marginHorizontal: Spacing[4] }}>
            {renderDuelInfoHeader()}
          </View>
          <View style={styles.contentWrapper}>
            <ActivityIndicator size='large' color={Colors.white} />
            <Text style={[styles.lightText, { marginTop: Spacing[3] }]}>
              Soru yükleniyor...
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.mainContainer}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {renderDuelInfoHeader()}

          {/* Question Header with timer */}
          <QuestionHeader
            questionIndex={questionIndex}
            totalQuestions={totalQuestions}
            displayTimeLeft={displayTimeLeft}
            serverSynced={serverSynced}
            opponentAnswered={opponentAnswered}
            opponentInfo={opponentInfo}
          />

          {/* Score Display */}
          <ScoreSection
            userScore={userScore}
            opponentScore={opponentScore}
            totalQuestions={totalQuestions}
            user={user}
            opponentInfo={opponentInfo}
          />

          {/* Question Content */}
          <View style={styles.questionCard}>
            <View style={styles.questionContent}>
              <Text style={styles.questionText}>{currentQuestion.text}</Text>

              <View style={styles.optionsContainer}>
                <FlatList
                  data={optionsData}
                  renderItem={renderOptionItem}
                  keyExtractor={keyExtractor}
                  scrollEnabled={false}
                  nestedScrollEnabled={true}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={4}
                  windowSize={5}
                  initialNumToRender={4}
                  getItemLayout={(data, index) => ({
                    length: 63, // optionButton height + margin
                    offset: 63 * index,
                    index,
                  })}
                />
              </View>
            </View>
          </View>

          {/* Answer Status */}
          {hasAnswered && (
            <View style={styles.answerStatusContainer}>
              <Badge
                text='Cevap Gönderildi ✓'
                variant='success'
                size='md'
                fontFamily='SecondaryFont-Bold'
                style={styles.answerStatusBadge}
              />
              <Paragraph style={styles.answerStatusText}>
                {opponentInfo?.isBot
                  ? 'Bot hesaplıyor...'
                  : 'Rakip bekleniyor...'}
              </Paragraph>
            </View>
          )}

          {hasAnswered && currentQuestion.correctAnswer && (
            <View style={styles.questionResultsContainer}>
              <View style={styles.correctAnswerContainer}>
                <Text style={styles.correctAnswer}>
                  Doğru Cevap: {currentQuestion.correctAnswer}){' '}
                  {getOptionValue(
                    currentQuestion.options,
                    currentQuestion.correctAnswer,
                  )}
                </Text>
              </View>

              {currentQuestion.explanation && (
                <View style={styles.explanationContainer}>
                  <Text style={styles.explanationTitle}>💡 Açıklama</Text>
                  <Text style={styles.explanationText}>
                    {currentQuestion.explanation}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
    );
  },
);

// Memoized Results Screen
const ResultsScreen = memo<{
  roundResult: any;
  questionIndex: number;
  user: any;
  opponentInfo: any;
  userScore: number;
  opponentScore: number;
  totalQuestions: number;
  currentQuestion: Question | null;
  showReportModal: boolean;
  onShowReportModal: (show: boolean) => void;
  renderDuelInfoHeader: () => React.ReactNode;
}>(
  ({
    roundResult,
    questionIndex,
    user,
    opponentInfo,
    userScore,
    opponentScore,
    totalQuestions,
    currentQuestion,
    showReportModal,
    onShowReportModal,
    renderDuelInfoHeader,
  }) => {
    if (!roundResult || !roundResult.question) {
      return null;
    }

    const userAnswer = roundResult.answers?.find(
      (a: any) => a.userId === user?.userId,
    );
    const isUserCorrect = userAnswer?.isCorrect || false;

    return (
      <View style={styles.mainContainer}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderDuelInfoHeader()}
          <View style={styles.resultsContainer}>
            <PlayfulCard variant='glass' style={styles.resultsCard}>
              <Column style={{ alignItems: 'center' }}>
                <PlayfulTitle level={2} style={styles.whiteText}>
                  {questionIndex + 1}. Tur Sonuçları
                </PlayfulTitle>

                {/* Question Display with Answer Highlighting */}
                <View style={styles.questionResultsContainer}>
                  <Text style={styles.questionResultsText}>
                    {roundResult.question.text}
                  </Text>

                  {/* Options with correct/wrong highlighting */}
                  <View style={styles.resultsOptionsContainer}>
                    {Object.entries(roundResult.question.options).map(
                      ([key, value]) => {
                        const isCorrect =
                          roundResult.question.correctAnswer === key;
                        const isUserSelected =
                          userAnswer?.selectedAnswer === key;

                        let optionStyle: StyleProp<ViewStyle> =
                          styles.resultOptionButton;
                        let optionTextStyle: StyleProp<TextStyle> =
                          styles.resultOptionText;

                        if (isCorrect) {
                          optionStyle = [
                            styles.resultOptionButton,
                            styles.correctResultOption,
                          ];
                          optionTextStyle = [
                            styles.resultOptionText,
                            styles.correctResultOptionText,
                          ];
                        } else if (isUserSelected) {
                          optionStyle = [
                            styles.resultOptionButton,
                            styles.wrongResultOption,
                          ];
                          optionTextStyle = [
                            styles.resultOptionText,
                            styles.wrongResultOptionText,
                          ];
                        }

                        return (
                          <View key={key} style={optionStyle}>
                            <Text style={optionTextStyle}>
                              {key}) {value as string}
                              {isCorrect && ' ✓'}
                              {isUserSelected && !isCorrect && ' ✗'}
                              {isUserSelected && ' (Seçiminiz)'}
                            </Text>
                          </View>
                        );
                      },
                    )}
                  </View>

                  {/* Correct Answer Display */}
                  <View style={styles.correctAnswerContainer}>
                    <Text style={styles.correctAnswer}>
                      Doğru Cevap: {roundResult.question.correctAnswer}){' '}
                      {getOptionValue(
                        roundResult.question.options,
                        roundResult.question.correctAnswer,
                      )}
                    </Text>
                  </View>

                  {/* Explanation if available */}
                  {roundResult.question.explanation && (
                    <View style={styles.explanationContainer}>
                      <Text style={styles.explanationTitle}>💡 Açıklama</Text>
                      <Text style={styles.explanationText}>
                        {roundResult.question.explanation}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Player Results */}
                <View style={styles.resultRowContainer}>
                  <Row style={styles.resultRow}>
                    {roundResult.answers?.map((answer: any, idx: number) => {
                      if (!answer) return null;

                      const isUser = answer.userId === user?.userId;
                      const displayName = isUser
                        ? user?.username || 'Sen'
                        : opponentInfo?.username || 'Rakip';

                      return (
                        <View key={idx} style={styles.playerResultContainer}>
                          <Column style={styles.playerResult}>
                            <Text style={styles.playerName}>
                              {displayName}
                              {!isUser && opponentInfo?.isBot && ' 🤖'}
                            </Text>
                            <Badge
                              text={answer.isCorrect ? 'Doğru ✓' : 'Yanlış ✗'}
                              variant={answer.isCorrect ? 'success' : 'error'}
                              style={styles.resultBadge}
                              fontFamily='SecondaryFont-Bold'
                            />
                            <Text style={styles.timeText}>
                              {Math.floor((answer.timeTaken / 1000) * 10) / 10}s
                            </Text>
                            {answer.selectedAnswer && (
                              <Text style={styles.selectedAnswerText}>
                                Seçim: {answer.selectedAnswer}
                              </Text>
                            )}
                          </Column>
                        </View>
                      );
                    })}
                  </Row>
                </View>

                {/* Current Score */}
                <View style={styles.currentScoreContainer}>
                  <Row style={styles.currentScore}>
                    <Column style={{ alignItems: 'center', minWidth: 80 }}>
                      <AnimatedCounter
                        value={userScore}
                        style={{ color: Colors.vibrant.mint }}
                      />
                      <Text style={styles.scoreLabel}>Puanınız</Text>
                    </Column>
                    <Text style={styles.scoreVs}>-</Text>
                    <Column style={{ alignItems: 'center', minWidth: 80 }}>
                      <AnimatedCounter
                        value={opponentScore}
                        style={{ color: Colors.vibrant.coral }}
                      />
                      <Text style={styles.scoreLabel}>
                        {opponentInfo?.isBot ? 'Bot' : 'Rakip'}
                      </Text>
                    </Column>
                  </Row>
                </View>

                {/* Question Report Section */}
                <View style={styles.reportQuestionContainer}>
                  <Text style={styles.reportQuestionTitle}>
                    Soruyla ilgili bir sorun mu var?
                  </Text>
                  <Text style={styles.reportQuestionDescription}>
                    Yanlış cevap, yazım hatası veya belirsizlik varsa bize
                    bildirin
                  </Text>
                  <TouchableOpacity
                    style={styles.reportButton}
                    onPress={() => onShowReportModal(true)}
                    activeOpacity={0.8}
                  >
                    <FontAwesome
                      name='flag'
                      size={16}
                      color={Colors.white}
                      style={{ marginRight: Spacing[2] }}
                    />
                    <Text style={styles.reportButtonText}>Soruyu Bildir</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.nextQuestionContainer}>
                  <Paragraph style={styles.lightText}>
                    Sonraki soru 30 saniye içinde...
                  </Paragraph>
                </View>
              </Column>
            </PlayfulCard>
          </View>

          {/* Question Report Modal */}
          {currentQuestion && (
            <QuestionReportModal
              isVisible={showReportModal}
              onClose={() => onShowReportModal(false)}
              questionId={currentQuestion?.id || 0}
              questionText={roundResult.question.text}
              questionOptions={roundResult.question.options}
              correctAnswer={roundResult.question.correctAnswer}
              userAnswer={userAnswer?.selectedAnswer || null}
              isCorrect={isUserCorrect}
            />
          )}
        </ScrollView>
      </View>
    );
  },
);

// Memoized Final Screen
const FinalScreen = memo<{
  finalResults: FinalResults;
  duelInfo: any;
  opponentInfo: any;
  botInfo: any;
  user: any;
  totalQuestions: number;
  answeredQuestions: AnsweredQuestion[];
  duelResultCreated: boolean;
  onCleanupAndNavigate: (route: string) => void;
  renderDuelInfoHeader: () => React.ReactNode;
}>(
  ({
    finalResults,
    duelInfo,
    opponentInfo,
    botInfo,
    user,
    totalQuestions,
    answeredQuestions,
    duelResultCreated,
    onCleanupAndNavigate,
    renderDuelInfoHeader,
  }) => {
    const getBotDisplayInfo = useCallback(() => {
      if (!opponentInfo?.isBot || !botInfo?.botInfo) return null;
      return duelHelpers.getBotDisplayInfo(botInfo.botInfo);
    }, [opponentInfo?.isBot, botInfo?.botInfo]);

    const botDisplayInfo = getBotDisplayInfo();

    return (
      <View style={styles.mainContainer}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderDuelInfoHeader()}
          <View style={styles.finalContainer}>
            <PlayfulCard variant='glass' style={styles.finalCard}>
              <Column style={{ alignItems: 'center' }}>
                {/* Winner Display */}
                <View style={styles.winnerSectionContainer}>
                  <View style={styles.winnerSection}>
                    {finalResults.winnerId === user?.userId ? (
                      <>
                        <Text style={styles.winnerEmoji}>🏆</Text>
                        <PlayfulTitle
                          level={1}
                          gradient='primary'
                          style={styles.winnerText}
                          fontFamily='SecondaryFont-Bold'
                        >
                          ZAFER!
                        </PlayfulTitle>
                        {opponentInfo?.isBot && (
                          <Text style={styles.botVictoryText}>
                            {opponentInfo.username} botu yendiniz!
                          </Text>
                        )}
                      </>
                    ) : finalResults.winnerId ? (
                      <>
                        <Text style={styles.winnerEmoji}>😔</Text>
                        <PlayfulTitle level={1} style={styles.loserText}>
                          Yenilgi
                        </PlayfulTitle>
                        {opponentInfo?.isBot && (
                          <Text style={styles.botDefeatText}>
                            {opponentInfo.username} botu sizi yendi!
                          </Text>
                        )}
                      </>
                    ) : (
                      <>
                        <Text style={styles.winnerEmoji}>🤝</Text>
                        <PlayfulTitle level={1} style={styles.drawText}>
                          Beraberlik!
                        </PlayfulTitle>
                      </>
                    )}
                  </View>
                </View>

                {/* Final Score */}
                <View style={styles.finalScoreContainer}>
                  <Row style={styles.finalScore}>
                    <View style={styles.finalScoreWrapper}>
                      <ScoreDisplay
                        score={
                          finalResults.user1.userId === user?.userId
                            ? finalResults.user1.score
                            : finalResults.user2.score
                        }
                        maxScore={totalQuestions}
                        label={user?.username || 'Sen'}
                        variant='default'
                        size='medium'
                        style={{ width: '100%', maxWidth: '100%' }}
                        scoreFontFamily='PrimaryFont'
                        labelFontFamily='SecondaryFont-Bold'
                        maxScoreFontFamily='PrimaryFont'
                      />
                    </View>
                    <View style={styles.finalScoreWrapper}>
                      <ScoreDisplay
                        score={
                          finalResults.user1.userId === user?.userId
                            ? finalResults.user2.score
                            : finalResults.user1.score
                        }
                        maxScore={totalQuestions}
                        label={opponentInfo?.username || 'Rakip'}
                        variant='default'
                        size='medium'
                        style={{ width: '100%', maxWidth: '100%' }}
                        scoreFontFamily='PrimaryFont'
                        labelFontFamily='SecondaryFont-Bold'
                        maxScoreFontFamily='PrimaryFont'
                      />
                    </View>
                  </Row>
                </View>

                {/* Duel Summary */}
                {duelInfo && (
                  <View style={styles.duelSummaryContainer}>
                    <View style={styles.duelSummary}>
                      <Text style={styles.duelSummaryTitle}>Düello Özeti</Text>
                      <Text style={styles.duelSummaryText}>
                        📚 {duelInfo.course?.title || 'Bilinmeyen Ders'}
                      </Text>
                      <Text style={styles.duelSummaryText}>
                        📝 {duelInfo.test?.title || 'Bilinmeyen Test'}
                      </Text>
                      <Text style={styles.duelSummaryText}>
                        👥 {user?.username} vs {opponentInfo?.username}
                        {opponentInfo?.isBot && ' 🤖'}
                      </Text>
                      {botDisplayInfo && (
                        <Text
                          style={[
                            styles.duelSummaryText,
                            { color: botDisplayInfo.color },
                          ]}
                        >
                          🎯 Zorluk Seviye {botDisplayInfo.difficulty} •{' '}
                          {botDisplayInfo.accuracy}% Doğruluk
                        </Text>
                      )}
                      <Text style={styles.duelSummaryText}>
                        📊 {answeredQuestions.length} soru yanıtlandı
                      </Text>
                      {duelResultCreated && (
                        <View style={styles.resultCreatedContainer}>
                          <Badge
                            text='Sonuçlar Kaydedildi ✓'
                            variant='success'
                            style={styles.resultCreatedBadge}
                          />
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* Enhanced Stats */}
                <View style={styles.statsSectionContainer}>
                  <View style={styles.statsSection}>
                    <Row style={styles.statsRow}>
                      <Text style={styles.statText}>
                        Doğruluk:{' '}
                        {Math.floor(
                          (finalResults.user1.userId === user?.userId
                            ? finalResults.user1.accuracy
                            : finalResults.user2.accuracy) * 100,
                        )}
                        %
                      </Text>
                      <Text style={styles.statText}>
                        Ort. Süre:{' '}
                        {Math.floor(
                          ((finalResults.user1.userId === user?.userId
                            ? finalResults.user1.totalTime
                            : finalResults.user2.totalTime) /
                            1000 /
                            totalQuestions) *
                            10,
                        ) / 10}
                        s
                      </Text>
                    </Row>

                    {answeredQuestions.length > 0 && (
                      <Row style={styles.additionalStatsRow}>
                        <Text style={styles.statText}>
                          Doğru:{' '}
                          {answeredQuestions.filter((q) => q.isCorrect).length}
                        </Text>
                        <Text style={styles.statText}>
                          Yanlış:{' '}
                          {answeredQuestions.filter((q) => !q.isCorrect).length}
                        </Text>
                      </Row>
                    )}
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtonsContainer}>
                  <Row style={styles.actionButtons}>
                    <Button
                      title='Yeni Düello'
                      variant='ghost'
                      onPress={() => onCleanupAndNavigate('/(tabs)/duels/new')}
                      style={styles.actionButton}
                    />
                    <Button
                      title='Çık'
                      variant='secondary'
                      onPress={() => onCleanupAndNavigate('/(tabs)/duels')}
                      style={styles.actionButton}
                    />
                  </Row>
                </View>
              </Column>
            </PlayfulCard>
          </View>
        </ScrollView>
      </View>
    );
  },
);

// Memoized Error Screen
const ErrorScreen = memo<{
  gameError?: string;
  connectionError?: string;
  roomError?: string;
  onRetry: () => void;
}>(({ gameError, connectionError, roomError, onRetry }) => (
  <View style={styles.mainContainer}>
    <View style={styles.contentWrapper}>
      <UIAlert
        type='error'
        title='Bağlantı Hatası'
        message={
          gameError || connectionError || roomError || 'Bir şeyler ters gitti'
        }
        style={{ marginBottom: Spacing[4] }}
      />
      <Button title='Tekrar Dene' variant='primary' onPress={onRetry} />
    </View>
  </View>
));

// 📍 MAIN COMPONENT
export default function DuelRoomScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const duelId = parseInt(id as string);

  // Store hooks
  const { user, isAuthenticated } = useAuth();
  const { preferredCourse, getCourseColor } = usePreferredCourse();

  // Refs for stable initialization
  const initializationRef = useRef({
    hasInitialized: false,
    hasCleanedUp: false,
    isInitializing: false,
  });

  // Duel room management hook
  const duelRoomHook = useDuelRoomManagement(duelId);

  // Destructure with stable references
  const {
    isConnected,
    connectionError,
    roomState,
    roomError,
    duelInfo,
    opponentInfo,
    botInfo,
    gamePhase,
    currentQuestion,
    questionIndex,
    totalQuestions,
    timeLeft,
    userScore,
    opponentScore,
    hasAnswered,
    opponentAnswered,
    gameError,
    initializeConnection,
    submitAnswer,
    signalReady,
    cleanup,
    isLoading,
    hasError,
    roundResult,
    finalResults,
  } = duelRoomHook;

  // Enhanced duel timer
  const {
    timeLeft: timerTimeLeft,
    isActive: timerActive,
    serverSynced,
  } = useDuelTimer(60);

  // 📍 CONSOLIDATED STATE - Reduced from multiple useState
  const [uiState, setUIState] = useState({
    selectedAnswer: null as string | null,
    countdown: 3,
    showReportModal: false,
    answeredQuestions: [] as AnsweredQuestion[],
    duelStartTime: null as number | null,
    duelEndTime: null as number | null,
    isCreatingDuelResult: false,
    duelResultCreated: false,
    isModalStable: false,
  });

  // Refs
  const answerStartTime = useRef<number>(0);
  const hasSignaledReady = useRef(false);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const logoVideo = require('../../../assets/videos/okey.mp4');

  // Memoized context color
  const contextColor = useMemo(() => {
    return (
      ((preferredCourse as any)?.category &&
        getCourseColor((preferredCourse as any).category)) ||
      '#4285F4'
    );
  }, [preferredCourse, getCourseColor]);

  // 📍 MEMOIZED CALLBACKS
  const handleAnswerSelect = useCallback(
    (answer: string) => {
      if (hasAnswered || gamePhase !== 'question') {
        console.log('⚠️ Cannot submit answer:', { hasAnswered, gamePhase });
        return;
      }

      console.log('📝 Selecting answer:', answer);
      setUIState((prev) => ({ ...prev, selectedAnswer: answer }));

      const timeTaken = Date.now() - answerStartTime.current;

      submitAnswer(answer, timeTaken)
        .then(() => {
          console.log('✅ Answer submitted successfully');
        })
        .catch((error) => {
          console.error('❌ Failed to submit answer:', error);
        });
    },
    [hasAnswered, gamePhase, submitAnswer],
  );

  const handleExitDuel = useCallback(() => {
    Alert.alert(
      'Düellodan Çık',
      'Ayrılmak istediğinizden emin misiniz? Bu yenilgi sayılacak.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çık',
          style: 'destructive',
          onPress: () => {
            const initRef = initializationRef.current;
            if (!initRef.hasCleanedUp) {
              initRef.hasCleanedUp = true;
              cleanup();
            }
            router.replace('/(tabs)/duels/new');
          },
        },
      ],
    );
  }, [cleanup, router]);

  const handleCleanupAndNavigate = useCallback(
    (route: string) => {
      if (gamePhase !== 'final' && gamePhase !== 'error') {
        console.warn('Preventing navigation during active duel');
        return;
      }
      const initRef = initializationRef.current;
      if (!initRef.hasCleanedUp) {
        initRef.hasCleanedUp = true;
        cleanup();
      }
      router.replace(route as any);
    },
    [cleanup, router, gamePhase],
  );

  const handleRetry = useCallback(() => {
    const initRef = initializationRef.current;
    if (!initRef.hasCleanedUp) {
      initRef.isInitializing = true;
      initializeConnection()
        .then(() => {
          initRef.hasInitialized = true;
          initRef.isInitializing = false;
        })
        .catch((error) => {
          console.error('❌ Retry connection failed:', error);
          initRef.isInitializing = false;
        });
    }
  }, [initializeConnection]);

  const handleShowReportModal = useCallback((show: boolean) => {
    setUIState((prev) => ({ ...prev, showReportModal: show }));
  }, []);

  // Memoized render header function
  const renderDuelInfoHeader = useCallback(
    () => (
      <DuelInfoHeader
        isLoading={isLoading}
        duelInfo={duelInfo}
        opponentInfo={opponentInfo}
        botInfo={botInfo}
        isCreatingDuelResult={uiState.isCreatingDuelResult}
      />
    ),
    [isLoading, duelInfo, opponentInfo, botInfo, uiState.isCreatingDuelResult],
  );

  // 📍 CONSOLIDATED EFFECTS - Reduced from 8+ to 4

  // Effect 1: Component initialization and cleanup
  useEffect(() => {
    const initRef = initializationRef.current;
    if (
      !initRef.hasInitialized &&
      !initRef.isInitializing &&
      !initRef.hasCleanedUp &&
      isAuthenticated &&
      user &&
      duelId
    ) {
      initRef.isInitializing = true;
      initializeConnection().then(() => {
        initRef.hasInitialized = true;
        initRef.isInitializing = false;
      });
    }
  }, [isAuthenticated, user?.userId, duelId]);

  // Cleanup only on unmount
  useEffect(() => {
    return () => {
      const initRef = initializationRef.current;
      if (!initRef.hasCleanedUp) {
        initRef.hasCleanedUp = true;
        cleanup();
      }
    };
  }, []);

  // Effect 2: Game phase and answer timing
  useEffect(() => {
    if (gamePhase === 'question') {
      answerStartTime.current = Date.now();
      console.log('⏰ Answer timer started:', answerStartTime.current);
      setUIState((prev) => ({ ...prev, selectedAnswer: null }));
    }

    // Auto-signal ready for lobby
    if (
      gamePhase === 'lobby' &&
      isConnected &&
      !hasError &&
      !hasSignaledReady.current
    ) {
      console.log('🚀 Auto-signaling ready for duel start...');
      hasSignaledReady.current = true;
      try {
        signalReady();
      } catch (error) {
        console.error('❌ Failed to signal ready:', error);
        hasSignaledReady.current = false;
      }
    }

    // Reset ready signal for final/error phases
    if (gamePhase === 'final' || gamePhase === 'error') {
      hasSignaledReady.current = false;
    }
  }, [gamePhase, isConnected, hasError, signalReady]);

  // Effect 3: Animations and UI stability
  useEffect(() => {
    // Pulse animation for waiting states
    if (gamePhase === 'connecting' || gamePhase === 'lobby') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    }

    // iOS modal stability
    const timer = setTimeout(
      () => {
        setUIState((prev) => ({ ...prev, isModalStable: true }));
      },
      isIOS ? 200 : 50,
    );

    return () => clearTimeout(timer);
  }, [gamePhase, pulseAnim]);

  // Effect 4: Back handler
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        handleExitDuel();
        return true;
      },
    );

    return () => backHandler.remove();
  }, [handleExitDuel]);

  // 📍 MEMOIZED COMPUTED VALUES
  const displayTimeLeft = useMemo(() => {
    return serverSynced ? timerTimeLeft : timeLeft;
  }, [serverSynced, timerTimeLeft, timeLeft]);

  // Don't render modal until stable on iOS
  if (!uiState.isModalStable && isIOS) {
    return (
      <View style={styles.mainContainer}>
        <View style={styles.contentWrapper}>
          <ActivityIndicator size='large' color={Colors.white} />
          <Text style={[styles.lightText, { marginTop: Spacing[3] }]}>
            Hazırlanıyor...
          </Text>
        </View>
      </View>
    );
  }

  // Main render logic with memoized components
  switch (gamePhase) {
    case 'connecting':
      return (
        <ConnectingScreen
          logoVideo={logoVideo}
          pulseAnim={pulseAnim}
          renderDuelInfoHeader={renderDuelInfoHeader}
        />
      );
    case 'lobby':
      return (
        <LobbyScreen
          renderDuelInfoHeader={renderDuelInfoHeader}
          user={user}
          opponentInfo={opponentInfo}
          botInfo={botInfo}
        />
      );
    case 'countdown':
      return (
        <CountdownScreen
          countdown={uiState.countdown}
          pulseAnim={pulseAnim}
          renderDuelInfoHeader={renderDuelInfoHeader}
        />
      );
    case 'question':
      return (
        <QuestionScreen
          currentQuestion={currentQuestion}
          questionIndex={questionIndex}
          totalQuestions={totalQuestions}
          displayTimeLeft={displayTimeLeft}
          serverSynced={serverSynced}
          opponentAnswered={opponentAnswered}
          opponentInfo={opponentInfo}
          userScore={userScore}
          opponentScore={opponentScore}
          user={user}
          selectedAnswer={uiState.selectedAnswer}
          hasAnswered={hasAnswered}
          onAnswerSelect={handleAnswerSelect}
          renderDuelInfoHeader={renderDuelInfoHeader}
        />
      );
    case 'results':
      return (
        <ResultsScreen
          roundResult={roundResult}
          questionIndex={questionIndex}
          user={user}
          opponentInfo={opponentInfo}
          userScore={userScore}
          opponentScore={opponentScore}
          totalQuestions={totalQuestions}
          currentQuestion={currentQuestion}
          showReportModal={uiState.showReportModal}
          onShowReportModal={handleShowReportModal}
          renderDuelInfoHeader={renderDuelInfoHeader}
        />
      );
    case 'final':
      return finalResults ? (
        <FinalScreen
          finalResults={finalResults}
          duelInfo={duelInfo}
          opponentInfo={opponentInfo}
          botInfo={botInfo}
          user={user}
          totalQuestions={totalQuestions}
          answeredQuestions={uiState.answeredQuestions}
          duelResultCreated={uiState.duelResultCreated}
          onCleanupAndNavigate={handleCleanupAndNavigate}
          renderDuelInfoHeader={renderDuelInfoHeader}
        />
      ) : null;
    case 'error':
      return (
        <ErrorScreen
          gameError={gameError || undefined}
          connectionError={connectionError || undefined}
          roomError={roomError || undefined}
          onRetry={handleRetry}
        />
      );
    default:
      return (
        <ConnectingScreen
          logoVideo={logoVideo}
          pulseAnim={pulseAnim}
          renderDuelInfoHeader={renderDuelInfoHeader}
        />
      );
  }
}
