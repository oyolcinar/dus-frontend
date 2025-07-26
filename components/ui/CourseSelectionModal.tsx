// components/modals/CourseSelectionModal.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  useColorScheme,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  usePreferredCourse,
  CourseCategory,
  CATEGORY_COLORS,
  PreferredCourse,
} from '../../context/PreferredCourseContext';
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
} from '../../constants/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CourseSelectionModalProps {
  visible: boolean;
  onClose?: () => void;
  onCourseSelected?: (course: PreferredCourse) => void;
}

const CourseSelectionModal: React.FC<CourseSelectionModalProps> = ({
  visible,
  onClose,
  onCourseSelected,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { setPreferredCourse, availableCourses } = usePreferredCourse();

  const [selecting, setSelecting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle course selection
  const handleCourseSelect = async (course: PreferredCourse) => {
    try {
      setSelecting(course.course_id);
      setError(null);

      await setPreferredCourse(course.course_id, course);

      onCourseSelected?.(course);
      onClose?.();
    } catch (error) {
      console.error('Error selecting course:', error);
      setError('Kurs seçimi başarısız oldu');
    } finally {
      setSelecting(null);
    }
  };

  // Get icon for course category
  const getCourseIcon = (
    category: CourseCategory | undefined,
  ): keyof typeof FontAwesome.glyphMap => {
    if (!category) return 'graduation-cap';

    const iconMap: Record<CourseCategory, keyof typeof FontAwesome.glyphMap> = {
      radyoloji: 'eye',
      restoratif: 'medkit',
      endodonti: 'medkit',
      pedodonti: 'child',
      protetik: 'cogs',
      peridontoloji: 'heartbeat',
      cerrahi: 'cut',
      ortodonti: 'exchange',
    };

    return iconMap[category] || 'graduation-cap';
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType='fade'
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: isDark ? Colors.gray[900] : Colors.white },
          ]}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text
              style={[
                styles.modalTitle,
                { color: isDark ? Colors.white : Colors.gray[900] },
              ]}
            >
              Hangi bölümü kazanmak istiyorsun?
            </Text>
            <Text
              style={[
                styles.modalSubtitle,
                { color: isDark ? Colors.gray[300] : Colors.gray[600] },
              ]}
            >
              Seçiminiz çalışma deneyiminizi kişiselleştirecek
            </Text>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            {error && (
              <View style={styles.errorContainer}>
                <FontAwesome
                  name='exclamation-triangle'
                  size={24}
                  color={Colors.error}
                />
                <Text style={[styles.errorText, { color: Colors.error }]}>
                  {error}
                </Text>
              </View>
            )}

            <View style={styles.coursesGrid}>
              {availableCourses.map((course) => (
                <TouchableOpacity
                  key={course.course_id}
                  style={[
                    styles.courseCard,
                    selecting === course.course_id &&
                      styles.courseCardSelecting,
                  ]}
                  onPress={() => handleCourseSelect(course)}
                  disabled={selecting !== null}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[
                      course.category
                        ? CATEGORY_COLORS[course.category]
                        : '#4285F4',
                      course.category
                        ? CATEGORY_COLORS[course.category] + 'DD'
                        : '#4285F4DD',
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.courseCardGradient}
                  >
                    {selecting === course.course_id && (
                      <View style={styles.courseCardOverlay}>
                        <ActivityIndicator size='small' color={Colors.white} />
                      </View>
                    )}

                    <View style={styles.courseCardContent}>
                      <View style={styles.courseCardIcon}>
                        <FontAwesome
                          name={getCourseIcon(course.category)}
                          size={24}
                          color={Colors.white}
                        />
                      </View>

                      <Text style={styles.courseCardTitle}>{course.title}</Text>

                      {course.description && (
                        <Text style={styles.courseCardDescription}>
                          {course.description}
                        </Text>
                      )}
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <Text
              style={[
                styles.footerText,
                { color: isDark ? Colors.gray[400] : Colors.gray[500] },
              ]}
            >
              Bu seçimi daha sonra profil ayarlarından değiştirebilirsiniz
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[4],
  },
  modalContainer: {
    width: Math.min(screenWidth - Spacing[8], 400),
    maxHeight: screenHeight * 0.8,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  modalHeader: {
    padding: Spacing[6],
    paddingBottom: Spacing[4],
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold as any,
    textAlign: 'center',
    marginBottom: Spacing[2],
  },
  modalSubtitle: {
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: Spacing[4],
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing[4],
    marginBottom: Spacing[4],
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: BorderRadius.md,
  },
  errorText: {
    marginLeft: Spacing[2],
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
  coursesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: Spacing[4],
  },
  courseCard: {
    width: '48%',
    marginBottom: Spacing[3],
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  courseCardSelecting: {
    opacity: 0.7,
  },
  courseCardGradient: {
    padding: Spacing[4],
    minHeight: 140,
    position: 'relative',
  },
  courseCardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseCardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  courseCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  courseCardTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold as any,
    color: Colors.white,
    marginBottom: Spacing[2],
  },
  courseCardDescription: {
    fontSize: FontSizes.xs,
    color: Colors.white,
    opacity: 0.9,
  },
  modalFooter: {
    padding: Spacing[4],
    paddingTop: Spacing[3],
    alignItems: 'center',
  },
  footerText: {
    fontSize: FontSizes.xs,
    textAlign: 'center',
  },
});

export default CourseSelectionModal;
