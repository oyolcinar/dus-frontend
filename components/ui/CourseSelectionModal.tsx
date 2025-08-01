// components/modals/CourseSelectionModal.tsx
import React, { useState, useEffect } from 'react';
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
  Alert,
  StatusBar,
  Platform,
  BackHandler,
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
import { getKlinikCourses } from '../../src/api/studyService';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Import Updates if using Expo
import * as Updates from 'expo-updates';

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
  console.log('CourseSelectionModal rendering, visible:', visible);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { setPreferredCourse, getCourseCategory } = usePreferredCourse();

  const [selecting, setSelecting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<PreferredCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [restartRequired, setRestartRequired] = useState(false);

  // Fetch courses when the modal becomes visible
  useEffect(() => {
    if (visible) {
      fetchCourses();
    }
  }, [visible]);

  // Function to fetch courses directly
  const fetchCourses = async () => {
    try {
      console.log('Fetching courses...');
      setLoading(true);
      setError(null);

      const fetchedCourses = await getKlinikCourses();
      console.log('Fetched courses:', fetchedCourses.length);

      if (fetchedCourses.length === 0) {
        // If API returns empty, use fallback courses
        console.log('Using fallback courses...');
        useFallbackCourses();
      } else {
        // Map courses to include category
        const mappedCourses = fetchedCourses.map((course) => ({
          course_id: course.course_id,
          title: course.title,
          description: course.description,
          category: getCourseCategory(course.title),
        }));
        setCourses(mappedCourses);
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Dersleri yüklerken bir hata oluştu. Lütfen tekrar deneyin.');
      // Use fallback courses on error
      useFallbackCourses();
    } finally {
      setLoading(false);
    }
  };

  // Use hardcoded fallback courses if API fails
  const useFallbackCourses = () => {
    setCourses([
      {
        course_id: 29,
        title: 'Ağız, Diş ve Çene Radyolojisi',
        description: 'Ağız, diş ve çene radyolojisi dersleri',
        category: 'radyoloji',
      },
      {
        course_id: 24,
        title: 'Restoratif Diş Tedavisi',
        description: 'Restoratif diş tedavisi dersleri',
        category: 'restoratif',
      },
      {
        course_id: 25,
        title: 'Endodonti',
        description: 'Endodonti dersleri',
        category: 'endodonti',
      },
      {
        course_id: 26,
        title: 'Pedodonti',
        description: 'Pedodonti dersleri',
        category: 'pedodonti',
      },
      {
        course_id: 27,
        title: 'Protetik Diş Tedavisi',
        description: 'Protetik diş tedavisi dersleri',
        category: 'protetik',
      },
      {
        course_id: 28,
        title: 'Periodontoloji',
        description: 'Periodontoloji dersleri',
        category: 'peridontoloji',
      },
      {
        course_id: 23,
        title: 'Ağız, Diş ve Çene Cerrahisi',
        description: 'Ağız, diş ve çene cerrahisi dersleri',
        category: 'cerrahi',
      },
      {
        course_id: 30,
        title: 'Ortodonti',
        description: 'Ortodonti dersleri',
        category: 'ortodonti',
      },
    ]);
  };

  // Store the selected course in AsyncStorage for immediate access across app
  const storeSelectedCourse = async (course: PreferredCourse) => {
    try {
      const courseWithTimestamp = {
        ...course,
        selectedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(
        'selectedCourse',
        JSON.stringify(courseWithTimestamp),
      );
      console.log('Stored selected course in AsyncStorage');
    } catch (e) {
      console.error('Failed to store selected course in AsyncStorage:', e);
    }
  };

  // Handle app reload
  const reloadApp = async () => {
    console.log('Attempting to reload app...');

    try {
      // Try Expo Updates if available
      if (Updates && typeof Updates.reloadAsync === 'function') {
        console.log('Reloading with Expo Updates...');
        await Updates.reloadAsync();
        return;
      }
    } catch (error) {
      console.error('Error reloading with Expo Updates:', error);
    }

    // If Expo Updates not available or failed, show restart dialog
    setRestartRequired(true);
  };

  // Handle course selection
  const handleCourseSelect = async (course: PreferredCourse) => {
    try {
      console.log('Selecting course:', course.title);
      setSelecting(course.course_id);
      setError(null);

      // Store course in AsyncStorage first for immediate access
      await storeSelectedCourse(course);

      // Then set in the context
      await setPreferredCourse(course.course_id, course);
      console.log('Course selected successfully');

      if (onCourseSelected) {
        onCourseSelected(course);
      }
      if (onClose) {
        onClose();
      }

      // Show confirmation and offer to restart app
      Alert.alert(
        'Başarılı',
        `${course.title} dersini başarıyla seçtiniz. Değişikliklerin tüm ekranlarda görünmesi için uygulama yeniden başlatılacak.`,
        [
          {
            text: 'Tamam',
            onPress: () => reloadApp(),
          },
        ],
        { cancelable: false },
      );
    } catch (error) {
      console.error('Error selecting course:', error);
      setError('Ders seçimi başarısız oldu');
      Alert.alert(
        'Hata',
        'Ders seçimi başarısız oldu. Lütfen tekrar deneyin.',
        [{ text: 'Tamam' }],
      );
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

  // Function to handle manual close
  const handleClose = () => {
    console.log('Modal close button pressed');
    if (onClose) onClose();
  };

  console.log('Modal render complete - courses count:', courses.length);

  // Show restart required modal
  if (restartRequired) {
    return (
      <Modal
        visible={true}
        transparent={true}
        animationType='fade'
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.restartModalContent,
              { backgroundColor: isDark ? Colors.gray[900] : Colors.white },
            ]}
          >
            <FontAwesome
              name='refresh'
              size={48}
              color={Colors.primary.DEFAULT}
              style={styles.restartIcon}
            />
            <Text
              style={[
                styles.restartTitle,
                { color: isDark ? Colors.white : Colors.gray[900] },
              ]}
            >
              Yeniden Başlatma Gerekli
            </Text>
            <Text
              style={[
                styles.restartMessage,
                { color: isDark ? Colors.gray[300] : Colors.gray[600] },
              ]}
            >
              Ders değişikliklerinin tüm ekranlarda görünmesi için uygulamayı
              yeniden başlatmanız gerekiyor.
            </Text>
            <TouchableOpacity
              style={[
                styles.restartButton,
                { backgroundColor: Colors.primary.DEFAULT },
              ]}
              onPress={() => {
                // Attempt to exit app - this works on Android
                if (Platform.OS === 'android') {
                  BackHandler.exitApp();
                } else {
                  // On iOS, just tell the user to restart manually
                  Alert.alert(
                    'Yeniden Başlatma',
                    'Lütfen uygulamayı manuel olarak kapatıp tekrar açın.',
                    [{ text: 'Tamam' }],
                  );
                }
              }}
            >
              <Text style={styles.restartButtonText}>Uygulamayı Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType='slide'
      onRequestClose={handleClose}
      statusBarTranslucent={true}
      presentationStyle='overFullScreen'
      hardwareAccelerated={true}
    >
      <StatusBar
        backgroundColor='rgba(0,0,0,0.5)'
        barStyle='light-content'
        translucent={true}
      />

      {/* Full screen overlay with proper positioning */}
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: isDark ? Colors.gray[900] : Colors.white },
          ]}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.7}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <FontAwesome
              name='times'
              size={20}
              color={isDark ? Colors.white : Colors.gray[800]}
            />
          </TouchableOpacity>

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
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size='large' color={Colors.primary.DEFAULT} />
              <Text
                style={[
                  styles.loadingText,
                  { color: isDark ? Colors.gray[300] : Colors.gray[600] },
                ]}
              >
                Dersler yükleniyor...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <FontAwesome
                name='exclamation-triangle'
                size={24}
                color={Colors.error}
              />
              <Text style={[styles.errorText, { color: Colors.error }]}>
                {error}
              </Text>
              <TouchableOpacity
                style={[
                  styles.retryButton,
                  {
                    marginTop: Spacing[3],
                    backgroundColor: Colors.primary.DEFAULT,
                  },
                ]}
                onPress={fetchCourses}
              >
                <Text style={styles.retryButtonText}>Tekrar Dene</Text>
              </TouchableOpacity>
            </View>
          ) : courses.length === 0 ? (
            <View style={styles.emptyCourseContainer}>
              <FontAwesome
                name='info-circle'
                size={32}
                color={isDark ? Colors.gray[400] : Colors.gray[500]}
              />
              <Text
                style={[
                  styles.emptyCourseText,
                  { color: isDark ? Colors.gray[300] : Colors.gray[600] },
                ]}
              >
                Henüz ders bulunmamaktadır.
              </Text>
              <TouchableOpacity
                style={[
                  styles.retryButton,
                  { backgroundColor: Colors.primary.DEFAULT },
                ]}
                onPress={fetchCourses}
              >
                <Text style={styles.retryButtonText}>Tekrar Dene</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView style={styles.scrollContainer}>
              <View style={styles.coursesGrid}>
                {courses.map((course) => (
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
                          <ActivityIndicator
                            size='small'
                            color={Colors.white}
                          />
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

                        <View style={styles.courseTextContainer}>
                          <Text
                            style={styles.courseCardTitle}
                            numberOfLines={2}
                          >
                            {course.title}
                          </Text>

                          {course.description && (
                            <Text
                              style={styles.courseCardDescription}
                              numberOfLines={2}
                            >
                              {course.description}
                            </Text>
                          )}
                        </View>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}

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
  // Main modal overlay - covers entire screen
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: Math.min(screenWidth - 40, 400),
    maxHeight: screenHeight * 0.8,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    elevation: 10,
  },
  modalHeader: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  scrollContainer: {
    maxHeight: screenHeight * 0.6,
    paddingHorizontal: 15,
  },
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 14,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    margin: 15,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 8,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  emptyCourseContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCourseText: {
    marginTop: 12,
    marginBottom: 16,
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.white,
    fontWeight: '500',
  },
  coursesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: 15,
  },
  courseCard: {
    width: '48%',
    marginBottom: 12,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    aspectRatio: 0.9, // Fixed aspect ratio for consistent sizing
  },
  courseCardSelecting: {
    opacity: 0.7,
  },
  courseCardGradient: {
    padding: 15,
    height: '100%', // Fill the entire card
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
    height: '100%',
  },
  courseCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  courseTextContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  courseCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 6,
    minHeight: 36, // Ensure space for two lines
  },
  courseCardDescription: {
    fontSize: 12,
    color: Colors.white,
    opacity: 0.9,
    minHeight: 30, // Ensure space for description
  },
  modalFooter: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
  },
  // Restart modal styles
  restartModalContent: {
    width: Math.min(screenWidth - 80, 350),
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
    elevation: 10,
  },
  restartIcon: {
    marginBottom: 20,
  },
  restartTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  restartMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  restartButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  restartButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CourseSelectionModal;
