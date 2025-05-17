// components/ui/QuizCard.tsx

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSizes,
} from '../../constants/theme';
import ProgressBar from './ProgressBar';

export interface QuizCardProps {
  /**
   * Title of the quiz
   */
  title: string;

  /**
   * Description or subtitle of the quiz
   */
  description?: string;

  /**
   * Number of questions in the quiz
   */
  questionCount: number;

  /**
   * Estimated time to complete in minutes
   */
  estimatedTime?: number;

  /**
   * Progress percentage (0-100)
   */
  progress?: number;

  /**
   * Category or subject of the quiz
   */
  category?: string;

  /**
   * Difficulty level
   */
  difficulty?: 'easy' | 'medium' | 'hard';

  /**
   * Handler for when the card is pressed
   */
  onPress?: () => void;

  /**
   * Custom style for the card container
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Custom style for the title
   */
  titleStyle?: StyleProp<TextStyle>;

  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * QuizCard component displays quiz information with optional progress
 */
const QuizCard: React.FC<QuizCardProps> = ({
  title,
  description,
  questionCount,
  estimatedTime,
  progress,
  category,
  difficulty = 'medium',
  onPress,
  style,
  titleStyle,
  testID,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Get difficulty color
  let difficultyColor: string;
  let difficultyLabel: string;

  switch (difficulty) {
    case 'easy':
      difficultyColor = Colors.success;
      difficultyLabel = 'Easy';
      break;
    case 'hard':
      difficultyColor = Colors.error;
      difficultyLabel = 'Hard';
      break;
    case 'medium':
    default:
      difficultyColor = Colors.secondary.DEFAULT;
      difficultyLabel = 'Medium';
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isDark ? styles.containerDark : styles.containerLight,
        style,
      ]}
      onPress={onPress}
      disabled={!onPress}
      testID={testID}
      activeOpacity={0.7}
    >
      {/* Header section with title and metadata */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text
            style={[
              styles.title,
              isDark ? styles.titleDark : styles.titleLight,
              titleStyle,
            ]}
            numberOfLines={2}
          >
            {title}
          </Text>

          {description && (
            <Text
              style={[
                styles.description,
                isDark ? styles.descriptionDark : styles.descriptionLight,
              ]}
              numberOfLines={2}
            >
              {description}
            </Text>
          )}
        </View>
      </View>

      {/* Metadata section */}
      <View style={styles.metadataContainer}>
        <View style={styles.metadataItem}>
          <FontAwesome
            name='question-circle'
            size={14}
            color={isDark ? Colors.gray[400] : Colors.gray[600]}
            style={styles.metadataIcon}
          />
          <Text
            style={[
              styles.metadataText,
              isDark ? styles.metadataTextDark : styles.metadataTextLight,
            ]}
          >
            {questionCount} Questions
          </Text>
        </View>

        {estimatedTime && (
          <View style={styles.metadataItem}>
            <FontAwesome
              name='clock-o'
              size={14}
              color={isDark ? Colors.gray[400] : Colors.gray[600]}
              style={styles.metadataIcon}
            />
            <Text
              style={[
                styles.metadataText,
                isDark ? styles.metadataTextDark : styles.metadataTextLight,
              ]}
            >
              {estimatedTime} min
            </Text>
          </View>
        )}

        <View style={styles.difficultyContainer}>
          <View
            style={[
              styles.difficultyBadge,
              {
                backgroundColor: `${difficultyColor}20`,
                borderColor: difficultyColor,
              },
            ]}
          >
            <Text style={[styles.difficultyText, { color: difficultyColor }]}>
              {difficultyLabel}
            </Text>
          </View>
        </View>
      </View>

      {/* Progress bar */}
      {typeof progress === 'number' && (
        <View style={styles.progressContainer}>
          <ProgressBar
            progress={progress}
            height={6}
            progressColor={Colors.primary.DEFAULT}
          />
          <Text
            style={[
              styles.progressText,
              isDark ? styles.progressTextDark : styles.progressTextLight,
            ]}
          >
            {Math.round(progress)}% Complete
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    padding: Spacing[4],
    marginBottom: Spacing[3],
  },
  containerLight: {
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  containerDark: {
    backgroundColor: Colors.gray[800],
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing[3],
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginBottom: Spacing[1],
  },
  titleLight: {
    color: Colors.gray[900],
  },
  titleDark: {
    color: Colors.white,
  },
  description: {
    fontSize: FontSizes.sm,
  },
  descriptionLight: {
    color: Colors.gray[600],
  },
  descriptionDark: {
    color: Colors.gray[400],
  },
  metadataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: Spacing[3],
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing[3],
    marginBottom: Spacing[1],
  },
  metadataIcon: {
    marginRight: Spacing[1],
  },
  metadataText: {
    fontSize: FontSizes.xs,
  },
  metadataTextLight: {
    color: Colors.gray[600],
  },
  metadataTextDark: {
    color: Colors.gray[400],
  },
  difficultyContainer: {
    flexGrow: 1,
    alignItems: 'flex-end',
  },
  difficultyBadge: {
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[0.5],
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  difficultyText: {
    fontSize: FontSizes.xs,
    fontWeight: '500',
  },
  progressContainer: {
    marginTop: Spacing[1],
  },
  progressText: {
    fontSize: FontSizes.xs,
    marginTop: Spacing[1],
    textAlign: 'right',
  },
  progressTextLight: {
    color: Colors.gray[600],
  },
  progressTextDark: {
    color: Colors.gray[400],
  },
});

export default QuizCard;
