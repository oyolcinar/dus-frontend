// components/ui/CourseCard.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
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

export interface CourseCardProps {
  /**
   * Title of the course
   */
  title: string;

  /**
   * Optional description of the course
   */
  description?: string;

  /**
   * Optional completion progress (0-100)
   */
  progress?: number;

  /**
   * Optional URL for the course image
   */
  imageUrl?: string;

  /**
   * Optional number of lessons in the course
   */
  lessonCount?: number;

  /**
   * Optional category for the course
   */
  category?: string;

  /**
   * Optional duration of the course
   */
  duration?: string;

  /**
   * Optional instructor name
   */
  instructor?: string;

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
 * CourseCard component for displaying course information
 */
const CourseCard: React.FC<CourseCardProps> = ({
  title,
  description,
  progress,
  imageUrl,
  lessonCount,
  category,
  duration,
  instructor,
  onPress,
  style,
  testID,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Placeholder image when no imageUrl is provided
  const placeholderImage = { uri: 'https://via.placeholder.com/300x150' };

  const cardStyle = applyDarkMode(
    isDark,
    CommonStyles.card,
    CommonStyles.cardDark,
  );

  return (
    <TouchableOpacity
      style={[styles.container, cardStyle, style]}
      onPress={onPress}
      activeOpacity={0.8}
      testID={testID}
    >
      {/* Course Image */}
      <View style={styles.imageContainer}>
        <Image
          source={imageUrl ? { uri: imageUrl } : placeholderImage}
          style={styles.image}
          resizeMode='cover'
        />
        {category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{category}</Text>
          </View>
        )}
      </View>

      {/* Course Content */}
      <View style={styles.contentContainer}>
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

        {description && (
          <Text
            style={[
              styles.description,
              applyDarkMode(
                isDark,
                { color: Colors.gray[600] },
                { color: Colors.gray[400] },
              ),
            ]}
            numberOfLines={2}
          >
            {description}
          </Text>
        )}

        {/* Course Meta Info */}
        <View style={styles.metaContainer}>
          {lessonCount !== undefined && (
            <View style={styles.metaItem}>
              <FontAwesome
                name='book'
                size={12}
                color={isDark ? Colors.gray[600] : Colors.gray[600]}
              />
              <Text
                style={[
                  styles.metaText,
                  applyDarkMode(
                    isDark,
                    { color: Colors.gray[600] },
                    { color: Colors.gray[400] },
                  ),
                ]}
              >
                {lessonCount} {lessonCount === 1 ? 'Ders' : 'Ders'}
              </Text>
            </View>
          )}

          {duration && (
            <View style={styles.metaItem}>
              <FontAwesome
                name='clock-o'
                size={12}
                color={isDark ? Colors.gray[600] : Colors.gray[600]}
              />
              <Text
                style={[
                  styles.metaText,
                  applyDarkMode(
                    isDark,
                    { color: Colors.gray[600] },
                    { color: Colors.gray[400] },
                  ),
                ]}
              >
                {duration}
              </Text>
            </View>
          )}

          {instructor && (
            <View style={styles.metaItem}>
              <FontAwesome
                name='user'
                size={12}
                color={isDark ? Colors.gray[600] : Colors.gray[600]}
              />
              <Text
                style={[
                  styles.metaText,
                  applyDarkMode(
                    isDark,
                    { color: Colors.gray[600] },
                    { color: Colors.gray[400] },
                  ),
                ]}
              >
                {instructor}
              </Text>
            </View>
          )}
        </View>

        {/* Progress Bar */}
        {progress !== undefined && (
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(Math.max(progress, 0), 100)}%` },
                  { backgroundColor: Colors.primary.DEFAULT },
                ]}
              />
            </View>
            <Text
              style={[
                styles.progressText,
                applyDarkMode(
                  isDark,
                  { color: Colors.gray[600] },
                  { color: Colors.gray[400] },
                ),
              ]}
            >
              {progress}% tamamlandı
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing[4],
    width: '100%',
  },
  imageContainer: {
    position: 'relative',
    height: 150,
    width: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    position: 'absolute',
    top: Spacing[2],
    left: Spacing[2],
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.md,
  },
  categoryText: {
    color: Colors.white,
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  contentContainer: {
    padding: Spacing[3],
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginBottom: Spacing[1],
  },
  description: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing[2],
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing[2],
    gap: Spacing[2],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing[3],
  },
  metaText: {
    fontSize: FontSizes.xs,
    marginLeft: Spacing[1],
  },
  progressContainer: {
    marginTop: Spacing[2],
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.gray[200],
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginBottom: Spacing[1],
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  progressText: {
    fontSize: FontSizes.xs,
    textAlign: 'right',
  },
});

export default CourseCard;
