// context/PreferredCourseContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import {
  getUserPreferredCourse,
  setUserPreferredCourse,
  getKlinikCourses,
} from '../src/api/studyService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CourseCategory =
  | 'radyoloji'
  | 'restoratif'
  | 'endodonti'
  | 'pedodonti'
  | 'protetik'
  | 'peridontoloji'
  | 'cerrahi'
  | 'ortodonti';

export interface PreferredCourse {
  course_id: number;
  title: string;
  description?: string;
  category?: CourseCategory;
  selectedAt?: string;
}

interface PreferredCourseContextType {
  preferredCourse: PreferredCourse | null;
  isLoading: boolean;
  error: string | null;
  setPreferredCourse: (
    courseId: number,
    courseData: PreferredCourse,
  ) => Promise<void>;
  clearPreferredCourse: () => void;
  getCourseCategory: (courseTitle: string) => CourseCategory | undefined;
  getCourseColor: (category: CourseCategory | undefined) => string;
  availableCourses: PreferredCourse[];
  refreshCourses: () => Promise<void>;
  forceRefresh: () => void;
}

const COURSE_CATEGORY_MAPPING: Record<string, CourseCategory> = {
  radyoloji: 'radyoloji',
  restoratif: 'restoratif',
  endodonti: 'endodonti',
  pedodonti: 'pedodonti',
  protetik: 'protetik',
  periodontoloji: 'peridontoloji',
  cerrahi: 'cerrahi',
  ortodonti: 'ortodonti',
};

export const CATEGORY_COLORS: Record<CourseCategory, string> = {
  radyoloji: '#FF7675',
  restoratif: '#4285F4',
  endodonti: '#FFD93D',
  pedodonti: '#FF6B9D',
  protetik: '#21b958',
  peridontoloji: '#800000',
  cerrahi: '#ec1c24',
  ortodonti: '#702963',
};

const PreferredCourseContext = createContext<
  PreferredCourseContextType | undefined
>(undefined);

interface PreferredCourseProviderProps {
  children: ReactNode;
}

export const PreferredCourseProvider: React.FC<
  PreferredCourseProviderProps
> = ({ children }) => {
  const [preferredCourse, setPreferredCourseState] =
    useState<PreferredCourse | null>(null);
  const [availableCourses, setAvailableCourses] = useState<PreferredCourse[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const forceRefresh = () => {
    console.log('Force refreshing PreferredCourseContext');
    setRefreshTrigger((prev) => prev + 1);
  };

  const getCourseCategory = (
    courseTitle: string,
  ): CourseCategory | undefined => {
    const titleLower = courseTitle.toLowerCase();

    for (const [keyword, category] of Object.entries(COURSE_CATEGORY_MAPPING)) {
      if (titleLower.includes(keyword)) {
        return category;
      }
    }

    return undefined;
  };

  const getCourseColor = (category: CourseCategory | undefined): string => {
    if (!category) return '#4285F4';
    return CATEGORY_COLORS[category];
  };

  // SIMPLIFIED: Load courses with basic error handling
  const refreshCourses = async () => {
    try {
      console.log('Refreshing courses...');
      const courses = await getKlinikCourses();
      console.log('Fetched courses:', courses.length);

      const mappedCourses = courses.map((course) => {
        const category = getCourseCategory(course.title);
        return {
          course_id: course.course_id,
          title: course.title,
          description: course.description,
          category,
        };
      });

      setAvailableCourses(mappedCourses);
    } catch (err) {
      console.error('Error loading available courses:', err);

      // SIMPLIFIED: Just use fallback courses on any error
      // Don't check for session expiry here - let the API client handle it
      setAvailableCourses([
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
    }
  };

  // SIMPLIFIED: Check AsyncStorage first
  const checkAsyncStorage = async () => {
    try {
      const storedCourse = await AsyncStorage.getItem('selectedCourse');
      if (storedCourse) {
        const parsedCourse = JSON.parse(storedCourse) as PreferredCourse;
        console.log('Found course in AsyncStorage:', parsedCourse.title);

        const category = getCourseCategory(parsedCourse.title);
        setPreferredCourseState({
          ...parsedCourse,
          category,
        });

        return true;
      }
    } catch (err) {
      console.error('Error reading from AsyncStorage:', err);
    }
    return false;
  };

  // SIMPLIFIED: Load preferred course
  useEffect(() => {
    const loadPreferredCourse = async () => {
      try {
        console.log(
          'Loading preferred course, refresh trigger:',
          refreshTrigger,
        );
        setIsLoading(true);
        setError(null);

        // First check AsyncStorage
        const foundInStorage = await checkAsyncStorage();

        if (!foundInStorage) {
          // If not in AsyncStorage, try to load from API
          try {
            const course = await getUserPreferredCourse();

            if (course) {
              console.log('Preferred course loaded from API:', course.title);
              const category = getCourseCategory(course.title);
              setPreferredCourseState({
                ...course,
                category,
              });
            } else {
              console.log('No preferred course found');
            }
          } catch (apiError) {
            console.error('Error loading from API:', apiError);
            // Don't show error for this - just continue without preferred course
          }
        }

        // Load available courses
        await refreshCourses();
      } catch (err) {
        console.error('Error loading preferred course:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load preferred course',
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferredCourse();
  }, [refreshTrigger]);

  // SIMPLIFIED: Set preferred course
  const setPreferredCourse = async (
    courseId: number,
    courseData: PreferredCourse,
  ) => {
    try {
      console.log('Setting preferred course:', courseData.title);
      setError(null);

      // Try to set via API, but don't fail if it doesn't work
      try {
        await setUserPreferredCourse(courseId);
        console.log('Preferred course set via API');
      } catch (apiError) {
        console.error(
          'API set failed, continuing with local storage:',
          apiError,
        );
        // Continue anyway - at least save locally
      }

      const category = getCourseCategory(courseData.title);
      const updatedCourse = {
        ...courseData,
        category,
        selectedAt: new Date().toISOString(),
      };

      setPreferredCourseState(updatedCourse);

      // Always save to AsyncStorage
      await AsyncStorage.setItem(
        'selectedCourse',
        JSON.stringify(updatedCourse),
      );

      console.log('Preferred course set successfully');
    } catch (err) {
      console.error('Error setting preferred course:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to set preferred course',
      );
      throw err;
    }
  };

  const clearPreferredCourse = () => {
    setPreferredCourseState(null);
    AsyncStorage.removeItem('selectedCourse');
  };

  const value: PreferredCourseContextType = {
    preferredCourse,
    isLoading,
    error,
    setPreferredCourse,
    clearPreferredCourse,
    getCourseCategory,
    getCourseColor,
    availableCourses,
    refreshCourses,
    forceRefresh,
  };

  return (
    <PreferredCourseContext.Provider value={value}>
      {children}
    </PreferredCourseContext.Provider>
  );
};

export const usePreferredCourse = (): PreferredCourseContextType => {
  const context = useContext(PreferredCourseContext);

  if (context === undefined) {
    throw new Error(
      'usePreferredCourse must be used within a PreferredCourseProvider',
    );
  }

  return context;
};
