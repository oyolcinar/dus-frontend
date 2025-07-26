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

// Course category type based on your actual database courses
export type CourseCategory =
  | 'radyoloji'
  | 'restoratif'
  | 'endodonti'
  | 'pedodonti'
  | 'protetik'
  | 'peridontoloji'
  | 'cerrahi'
  | 'ortodonti';

// Course data interface
export interface PreferredCourse {
  course_id: number;
  title: string;
  description?: string;
  category?: CourseCategory;
}

// Context interface
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
}

// Course category mapping based on your database course titles
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

// Color mapping for each category (your provided colors)
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

// Create context
const PreferredCourseContext = createContext<
  PreferredCourseContextType | undefined
>(undefined);

// Provider component
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

  // Helper function to get category from course title
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

  // Helper function to get color for category
  const getCourseColor = (category: CourseCategory | undefined): string => {
    if (!category) return '#4285F4'; // Default blue
    return CATEGORY_COLORS[category];
  };

  // Load available courses
  const refreshCourses = async () => {
    try {
      const courses = await getKlinikCourses();

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
      // Fallback to predefined courses based on your database
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

  // Load preferred course on mount
  useEffect(() => {
    const loadPreferredCourse = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load both preferred course and available courses
        const [course] = await Promise.all([
          getUserPreferredCourse(),
          refreshCourses(),
        ]);

        if (course) {
          const category = getCourseCategory(course.title);
          setPreferredCourseState({
            ...course,
            category,
          });
        }
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
  }, []);

  // Set preferred course using your existing service
  const setPreferredCourse = async (
    courseId: number,
    courseData: PreferredCourse,
  ) => {
    try {
      setError(null);

      await setUserPreferredCourse(courseId);

      const category = getCourseCategory(courseData.title);
      setPreferredCourseState({
        ...courseData,
        category,
      });
    } catch (err) {
      console.error('Error setting preferred course:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to set preferred course',
      );
      throw err;
    }
  };

  // Clear preferred course
  const clearPreferredCourse = () => {
    setPreferredCourseState(null);
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
  };

  return (
    <PreferredCourseContext.Provider value={value}>
      {children}
    </PreferredCourseContext.Provider>
  );
};

// Hook to use the context
export const usePreferredCourse = (): PreferredCourseContextType => {
  const context = useContext(PreferredCourseContext);

  if (context === undefined) {
    throw new Error(
      'usePreferredCourse must be used within a PreferredCourseProvider',
    );
  }

  return context;
};
