// context/PreferredCourseContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
} from 'react';
import {
  getUserPreferredCourse,
  setUserPreferredCourse,
  getAllCourses, // ✅ FIXED: Use getAllCourses instead of getKlinikCourses
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

// 🚀 PERFORMANCE FIX: Add caching for course data
const COURSE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
let coursesCache: { courses: PreferredCourse[]; timestamp: number } | null =
  null;
let preferredCourseCache: {
  course: PreferredCourse | null;
  timestamp: number;
} | null = null;

// 🚀 PERFORMANCE FIX: Fallback courses as constant to prevent recreation
const FALLBACK_COURSES: PreferredCourse[] = [
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
];

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

  // 🚀 PERFORMANCE FIX: Use refs to prevent unnecessary API calls
  const hasInitialized = useRef(false);
  const lastCoursesFetch = useRef(0);

  const forceRefresh = () => {
    console.log('🔄 Force refreshing PreferredCourseContext');
    // 🚀 PERFORMANCE FIX: Clear caches on force refresh
    coursesCache = null;
    preferredCourseCache = null;
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

  // 🚀 PERFORMANCE FIX: Add cached course loading
  const loadCoursesFromAPI = async (): Promise<PreferredCourse[]> => {
    console.log('📚 Loading courses from API...');
    const courses = await getAllCourses('klinik_dersler');
    console.log(`✅ Fetched ${courses.length} courses from API`);

    const mappedCourses = courses.map((course) => {
      const category = getCourseCategory(course.title);
      return {
        course_id: course.course_id,
        title: course.title,
        description: course.description,
        category,
      };
    });

    return mappedCourses;
  };

  // 🚀 PERFORMANCE FIX: Cached course refresh
  const refreshCourses = async (): Promise<void> => {
    const now = Date.now();

    // Return cached courses if still valid
    if (coursesCache && now - coursesCache.timestamp < COURSE_CACHE_DURATION) {
      console.log('📚 Using cached courses');
      setAvailableCourses(coursesCache.courses);
      return;
    }

    // Prevent multiple simultaneous API calls
    if (now - lastCoursesFetch.current < 1000) {
      console.log('⏸️ Skipping courses fetch (too recent)');
      return;
    }

    lastCoursesFetch.current = now;

    try {
      console.log('🔄 Refreshing courses from API...');
      const courses = await loadCoursesFromAPI();

      // Cache the result
      coursesCache = {
        courses,
        timestamp: now,
      };

      setAvailableCourses(courses);
    } catch (err) {
      console.error('❌ Error loading courses, using fallback:', err);

      // Use fallback courses
      setAvailableCourses(FALLBACK_COURSES);

      // Cache fallback courses too (but with shorter duration)
      coursesCache = {
        courses: FALLBACK_COURSES,
        timestamp: now,
      };
    }
  };

  // 🚀 PERFORMANCE FIX: Cached preferred course loading
  const loadPreferredCourseFromAPI =
    async (): Promise<PreferredCourse | null> => {
      const now = Date.now();

      // Return cached preferred course if still valid
      if (
        preferredCourseCache &&
        now - preferredCourseCache.timestamp < COURSE_CACHE_DURATION
      ) {
        console.log('🎯 Using cached preferred course');
        return preferredCourseCache.course;
      }

      try {
        console.log('🎯 Loading preferred course from API...');
        const course = await getUserPreferredCourse();

        // Cache the result
        preferredCourseCache = {
          course,
          timestamp: now,
        };

        return course;
      } catch (apiError) {
        console.error('❌ Error loading preferred course from API:', apiError);

        // Cache null result too
        preferredCourseCache = {
          course: null,
          timestamp: now,
        };

        return null;
      }
    };

  // SIMPLIFIED: Check AsyncStorage first
  const checkAsyncStorage = async (): Promise<boolean> => {
    try {
      const storedCourse = await AsyncStorage.getItem('selectedCourse');
      if (storedCourse) {
        const parsedCourse = JSON.parse(storedCourse) as PreferredCourse;
        console.log('📱 Found course in AsyncStorage:', parsedCourse.title);

        const category = getCourseCategory(parsedCourse.title);
        setPreferredCourseState({
          ...parsedCourse,
          category,
        });

        return true;
      }
    } catch (err) {
      console.error('❌ Error reading from AsyncStorage:', err);
    }
    return false;
  };

  // 🚀 PERFORMANCE FIX: Optimized useEffect with better dependency management
  useEffect(() => {
    // Only run if not initialized or forced refresh
    if (hasInitialized.current && refreshTrigger === 0) {
      return;
    }

    const loadPreferredCourse = async () => {
      try {
        console.log(
          '🚀 Loading preferred course, refresh trigger:',
          refreshTrigger,
        );
        setIsLoading(true);
        setError(null);

        // First check AsyncStorage
        const foundInStorage = await checkAsyncStorage();

        if (!foundInStorage) {
          // If not in AsyncStorage, try to load from API (cached)
          const course = await loadPreferredCourseFromAPI();

          if (course) {
            console.log('✅ Preferred course loaded from API:', course.title);
            const category = getCourseCategory(course.title);
            setPreferredCourseState({
              ...course,
              category,
            });
          } else {
            console.log('ℹ️ No preferred course found');
          }
        }

        // Load available courses (cached)
        await refreshCourses();

        hasInitialized.current = true;
      } catch (err) {
        console.error('❌ Error loading preferred course:', err);
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
  }, [refreshTrigger]); // 🚀 PERFORMANCE FIX: Only depend on refreshTrigger

  // SIMPLIFIED: Set preferred course
  const setPreferredCourse = async (
    courseId: number,
    courseData: PreferredCourse,
  ) => {
    try {
      console.log('🎯 Setting preferred course:', courseData.title);
      setError(null);

      // Try to set via API, but don't fail if it doesn't work
      try {
        await setUserPreferredCourse(courseId);
        console.log('✅ Preferred course set via API');

        // Clear cache since we updated it
        preferredCourseCache = null;
      } catch (apiError) {
        console.error(
          '⚠️ API set failed, continuing with local storage:',
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

      console.log('✅ Preferred course set successfully');
    } catch (err) {
      console.error('❌ Error setting preferred course:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to set preferred course',
      );
      throw err;
    }
  };

  const clearPreferredCourse = () => {
    setPreferredCourseState(null);
    AsyncStorage.removeItem('selectedCourse');
    // 🚀 PERFORMANCE FIX: Clear cache when clearing course
    preferredCourseCache = null;
    hasInitialized.current = false;
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
