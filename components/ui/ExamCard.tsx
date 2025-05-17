// components/ui/ExamCard.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSizes,
  CommonStyles,
} from '../../constants/theme';
import { globalStyles, applyDarkMode } from '../../utils/styleUtils';

export interface ExamCardProps {
  /**
   * Title of the exam
   */
  title: string;

  /**
   * Optional date for the exam (string or Date object)
   */
  date?: string | Date;

  /**
   * Optional time remaining string
   */
  timeRemaining?: string;

  /**
   * Optional number of total questions
   */
  totalQuestions?: number;

  /**
   * Optional time limit in minutes
   */
  timeLimit?: number;

  /**
   * Optional status of the exam
   */
  status?: 'upcoming' | 'active' | 'completed' | 'missed';

  /**
   * Optional score (0-100) for completed exams
   */
  score?: number;

  /**
   * Callback when the card is pressed
   */
  onPress?: () => void;

  /**
   * Custom style for the card container
   */
  style?: any;

  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * ExamCard component for displaying exam information
 */
const ExamCard: React.FC<ExamCardProps> = ({
  title,
  date,
  timeRemaining,
  totalQuestions,
  timeLimit,
  status = 'upcoming',
  score,
  onPress,
  style,
  testID,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const cardStyle = applyDarkMode(
    isDark,
    CommonStyles.card,
    CommonStyles.cardDark,
  );

  // Format date if it's a Date object
  const formattedDate =
    date instanceof Date
      ? date.toLocaleDateString('tr-TR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : date;

  // Get status color and icon
  const getStatusInfo = () => {
    switch (status) {
      case 'active':
        return {
          color: Colors.primary.DEFAULT,
          icon: 'play-circle-o' as const,
          text: 'Aktif',
        };
      case 'completed':
        return {
          color: Colors.success,
          icon: 'check-circle-o' as const,
          text: 'Tamamlandı',
        };
      case 'missed':
        return {
          color: Colors.error,
          icon: 'times-circle-o' as const,
          text: 'Kaçırıldı',
        };
      case 'upcoming':
      default:
        return {
          color: Colors.info,
          icon: 'clock-o' as const,
          text: 'Yaklaşan',
        };
    }
  };

  const statusInfo = getStatusInfo();
  const isMissed = status === 'missed';

  return (
    <TouchableOpacity
      style={[styles.container, cardStyle, style]}
      onPress={onPress}
      activeOpacity={0.8}
      testID={testID}
      disabled={isMissed}
    >
      {/* Status Badge */}
      <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
        <FontAwesome name={statusInfo.icon} size={12} color={Colors.white} />
        <Text style={styles.statusText}>{statusInfo.text}</Text>
      </View>

      {/* Exam Title */}
      <Text
        style={[
          styles.title,
          applyDarkMode(
            isDark,
            { color: Colors.gray[900] },
            { color: Colors.white },
          ),
        ]}
        numberOfLines={2}
      >
        {title}
      </Text>

      {/* Exam Details */}
      <View style={styles.detailsContainer}>
        {/* Date */}
        {formattedDate && (
          <View style={styles.detailItem}>
            <FontAwesome
              name='calendar'
              size={14}
              color={isDark ? Colors.gray[400] : Colors.gray[600]}
            />
            <Text
              style={[
                styles.detailText,
                applyDarkMode(
                  isDark,
                  { color: Colors.gray[600] },
                  { color: Colors.gray[400] },
                ),
              ]}
            >
              {formattedDate}
            </Text>
          </View>
        )}

        {/* Time Remaining */}
        {timeRemaining && status !== 'completed' && !isMissed && (
          <View style={styles.detailItem}>
            <FontAwesome
              name='hourglass-o'
              size={14}
              color={isDark ? Colors.gray[400] : Colors.gray[600]}
            />
            <Text
              style={[
                styles.detailText,
                applyDarkMode(
                  isDark,
                  { color: Colors.gray[600] },
                  { color: Colors.gray[400] },
                ),
              ]}
            >
              {timeRemaining}
            </Text>
          </View>
        )}

        {/* Questions */}
        {totalQuestions !== undefined && (
          <View style={styles.detailItem}>
            <FontAwesome
              name='list'
              size={14}
              color={isDark ? Colors.gray[400] : Colors.gray[600]}
            />
            <Text
              style={[
                styles.detailText,
                applyDarkMode(
                  isDark,
                  { color: Colors.gray[600] },
                  { color: Colors.gray[400] },
                ),
              ]}
            >
              {totalQuestions} {totalQuestions === 1 ? 'Soru' : 'Soru'}
            </Text>
          </View>
        )}

        {/* Time Limit */}
        {timeLimit !== undefined && (
          <View style={styles.detailItem}>
            <FontAwesome
              name='clock-o'
              size={14}
              color={isDark ? Colors.gray[400] : Colors.gray[600]}
            />
            <Text
              style={[
                styles.detailText,
                applyDarkMode(
                  isDark,
                  { color: Colors.gray[600] },
                  { color: Colors.gray[400] },
                ),
              ]}
            >
              {timeLimit} {timeLimit === 1 ? 'Dakika' : 'Dakika'}
            </Text>
          </View>
        )}
      </View>

      {/* Score (for completed exams) */}
      {status === 'completed' && score !== undefined && (
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Sonuç:</Text>
          <Text style={[styles.scoreValue, { color: getScoreColor(score) }]}>
            {score}%
          </Text>
        </View>
      )}

      {/* Action Button */}
      {!isMissed && (
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor:
                  status === 'active'
                    ? Colors.primary.DEFAULT
                    : status === 'completed'
                    ? Colors.gray[300]
                    : Colors.secondary.DEFAULT,
              },
            ]}
            onPress={onPress}
          >
            <Text style={styles.actionButtonText}>
              {status === 'active'
                ? 'Devam Et'
                : status === 'completed'
                ? 'Sonuçları Gör'
                : 'Başla'}
            </Text>
            <FontAwesome
              name={
                status === 'active'
                  ? 'arrow-right'
                  : status === 'completed'
                  ? 'bar-chart'
                  : 'play'
              }
              size={14}
              color={Colors.white}
            />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Helper function to determine score color
const getScoreColor = (score: number) => {
  if (score >= 80) return Colors.success;
  if (score >= 60) return Colors.secondary.DEFAULT;
  if (score >= 40) return Colors.warning;
  return Colors.error;
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing[4],
    padding: Spacing[4],
    position: 'relative',
    width: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: Spacing[3],
    right: Spacing[3],
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    color: Colors.white,
    fontSize: FontSizes.xs,
    fontWeight: '600',
    marginLeft: Spacing[1],
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginBottom: Spacing[3],
    maxWidth: '80%',
  },
  detailsContainer: {
    marginBottom: Spacing[3],
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  detailText: {
    fontSize: FontSizes.sm,
    marginLeft: Spacing[2],
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: Spacing[3],
  },
  scoreLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginRight: Spacing[2],
  },
  scoreValue: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  actionContainer: {
    alignItems: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.lg,
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginRight: Spacing[2],
  },
});

export default ExamCard;
