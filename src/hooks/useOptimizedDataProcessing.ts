// hooks/useOptimizedDataProcessing.ts
import { useMemo, useCallback, useRef } from 'react';
import {
  Course,
  StudySession,
  UserCourseDetails,
  CourseWithProgress,
} from '../types/models';

// Memoized utility functions
export const useUtilityFunctions = () => {
  const ensureSafeNumber = useCallback(
    (value: number | undefined, fallback: number = 0): number => {
      if (value === undefined || isNaN(value) || !isFinite(value)) {
        return fallback;
      }
      return Math.round(value);
    },
    [],
  );

  const getIconForCourse = useCallback((title?: string): string => {
    const titleLower = title?.toLowerCase() || '';
    if (titleLower.includes('anatomi')) return 'tooth';
    if (titleLower.includes('patoloji')) return 'microscope';
    if (titleLower.includes('cerrahi')) return 'cut';
    if (titleLower.includes('protez') || titleLower.includes('protetik'))
      return 'cogs';
    if (titleLower.includes('periodon')) return 'heartbeat';
    if (titleLower.includes('pedodonti')) return 'child';
    if (titleLower.includes('endodonti')) return 'medkit';
    if (titleLower.includes('ortodonti')) return 'exchange';
    if (titleLower.includes('radyoloji')) return 'eye';
    if (titleLower.includes('restoratif')) return 'tooth';
    return 'book-medical';
  }, []);

  const getDifficultyColor = useCallback((rating: number): string => {
    const colorMap: Record<number, string> = {
      1: '#4ADE80', // Colors.vibrant.greenLight
      2: '#22C55E', // Colors.vibrant.green
      3: '#FDE047', // Colors.vibrant.yellowLight
      4: '#FACC15', // Colors.vibrant.yellow
      5: '#F472B6', // Colors.vibrant.pink
    };
    return colorMap[rating] || '#9CA3AF'; // Colors.gray[400]
  }, []);

  const getDifficultyText = useCallback((rating: number): string => {
    const textMap: Record<number, string> = {
      1: 'Çok Kolay',
      2: 'Kolay',
      3: 'Orta',
      4: 'Zor',
      5: 'Çok Zor',
    };
    return textMap[rating] || 'Belirlenmemiş';
  }, []);

  const formatTimeFromSeconds = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${Math.round(minutes)}dk`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return remainingMinutes > 0
      ? `${hours}sa ${remainingMinutes}dk`
      : `${hours}sa`;
  }, []);

  const formatTimeForDisplay = useCallback((minutes: number): string => {
    if (minutes < 60) return `${Math.round(minutes)}dk`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return remainingMinutes > 0
      ? `${hours}sa ${remainingMinutes}dk`
      : `${hours}sa`;
  }, []);

  return {
    ensureSafeNumber,
    getIconForCourse,
    getDifficultyColor,
    getDifficultyText,
    formatTimeFromSeconds,
    formatTimeForDisplay,
  };
};

// Optimized data mapping hook
export const useDataMapping = () => {
  const mapProgressDataCache = useRef(new Map<string, UserCourseDetails>());
  const mapSessionsDataCache = useRef(new Map<string, StudySession[]>());

  const mapProgressData = useCallback(
    (progressData: any): UserCourseDetails | null => {
      if (!progressData) return null;

      const cacheKey = JSON.stringify(progressData);
      if (mapProgressDataCache.current.has(cacheKey)) {
        return mapProgressDataCache.current.get(cacheKey)!;
      }

      const mapped: UserCourseDetails = {
        user_id: progressData.user_id || 0,
        course_id: progressData.course_id,
        tekrar_sayisi:
          progressData.tekrar_sayisi || progressData.tekrarSayisi || 0,
        konu_kaynaklari:
          progressData.konu_kaynaklari || progressData.konuKaynaklari || null,
        soru_bankasi_kaynaklari:
          progressData.soru_bankasi_kaynaklari ||
          progressData.soruBankasiKaynaklari ||
          null,
        total_study_time_seconds:
          progressData.total_study_time_seconds ||
          progressData.studyTimeSeconds ||
          0,
        total_break_time_seconds:
          progressData.total_break_time_seconds ||
          progressData.breakTimeSeconds ||
          0,
        total_session_count:
          progressData.total_session_count || progressData.sessionCount || 0,
        last_studied_at:
          progressData.last_studied_at || progressData.lastStudiedAt || null,
        difficulty_rating:
          progressData.difficulty_rating ||
          progressData.difficultyRating ||
          null,
        completion_percentage:
          progressData.completion_percentage ||
          progressData.completionPercentage ||
          0,
        is_completed:
          progressData.is_completed || progressData.isCompleted || false,
        notes: progressData.notes || null,
        created_at: progressData.created_at || new Date().toISOString(),
        updated_at: progressData.updated_at || new Date().toISOString(),
      };

      mapProgressDataCache.current.set(cacheKey, mapped);

      // Clear cache if it gets too large
      if (mapProgressDataCache.current.size > 100) {
        mapProgressDataCache.current.clear();
      }

      return mapped;
    },
    [],
  );

  const mapSessionsData = useCallback((sessions: any[]): StudySession[] => {
    if (!sessions) return [];

    const cacheKey = JSON.stringify(sessions);
    if (mapSessionsDataCache.current.has(cacheKey)) {
      return mapSessionsDataCache.current.get(cacheKey)!;
    }

    const mapped = sessions.map((session) => ({
      session_id: session.session_id || session.sessionId,
      user_id: session.user_id || session.userId || 0,
      course_id: session.course_id || session.courseId,
      start_time: session.start_time || session.startTime,
      end_time: session.end_time || session.endTime || null,
      study_duration_seconds:
        session.study_duration_seconds || session.studyDurationSeconds || 0,
      break_duration_seconds:
        session.break_duration_seconds || session.breakDurationSeconds || 0,
      total_duration_seconds:
        session.total_duration_seconds || session.totalDurationSeconds || 0,
      session_date: session.session_date || session.sessionDate,
      session_status: session.session_status || session.sessionStatus,
      notes: session.notes || null,
      created_at: session.created_at || new Date().toISOString(),
      updated_at: session.updated_at || new Date().toISOString(),
    }));

    mapSessionsDataCache.current.set(cacheKey, mapped);

    // Clear cache if it gets too large
    if (mapSessionsDataCache.current.size > 100) {
      mapSessionsDataCache.current.clear();
    }

    return mapped;
  }, []);

  const clearCache = useCallback(() => {
    mapProgressDataCache.current.clear();
    mapSessionsDataCache.current.clear();
  }, []);

  return { mapProgressData, mapSessionsData, clearCache };
};

// Optimized course processing hook
export const useCourseProcessing = () => {
  const { mapProgressData, mapSessionsData } = useDataMapping();
  const { getIconForCourse } = useUtilityFunctions();

  const processCourseData = useCallback(
    async (
      courses: Course[],
      getCourseCategory: (title: string) => any,
      courseService: any,
      studyService: any,
    ): Promise<CourseWithProgress[]> => {
      const klinikCourses = courses.filter(
        (course) => course.course_type === 'klinik_dersler',
      );

      // Process courses in smaller batches to avoid overwhelming the system
      const BATCH_SIZE = 3;
      const results: CourseWithProgress[] = [];

      for (let i = 0; i < klinikCourses.length; i += BATCH_SIZE) {
        const batch = klinikCourses.slice(i, i + BATCH_SIZE);

        const batchResults = await Promise.allSettled(
          batch.map(async (course): Promise<CourseWithProgress> => {
            try {
              const [progressResult, sessionsResult] = await Promise.allSettled(
                [
                  courseService.getCourseProgress(course.course_id),
                  studyService.getUserStudySessions(1, 5, course.course_id),
                ],
              );

              return {
                ...course,
                progress:
                  progressResult.status === 'fulfilled'
                    ? mapProgressData(progressResult.value)
                    : null,
                studySessions:
                  sessionsResult.status === 'fulfilled'
                    ? mapSessionsData(sessionsResult.value.sessions)
                    : [],
                iconName: getIconForCourse(course.title),
                isSessionsExpanded: false,
                category: getCourseCategory(course.title),
              };
            } catch (error) {
              console.error(
                `Error processing course ${course.course_id}:`,
                error,
              );
              return {
                ...course,
                progress: null,
                studySessions: [],
                iconName: getIconForCourse(course.title),
                isSessionsExpanded: false,
                category: getCourseCategory(course.title),
              };
            }
          }),
        );

        const successfulResults = batchResults
          .filter(
            (result): result is PromiseFulfilledResult<CourseWithProgress> =>
              result.status === 'fulfilled',
          )
          .map((result) => result.value);

        results.push(...successfulResults);
      }

      // Sort by study time
      return results.sort(
        (a, b) =>
          (b.progress?.total_study_time_seconds || 0) -
          (a.progress?.total_study_time_seconds || 0),
      );
    },
    [mapProgressData, mapSessionsData, getIconForCourse],
  );

  return { processCourseData };
};

// Optimized chart data processing
export const useChartDataProcessing = () => {
  const processChartData = useCallback((dailyProgress: any[]) => {
    if (!dailyProgress.length) return [];

    const maxValue = Math.max(
      ...dailyProgress.map((d) => d.daily_study_minutes),
      1,
    );

    return dailyProgress.map((day) => ({
      ...day,
      percentage: Math.round((day.daily_study_minutes / maxValue) * 100),
      date: new Date(day.study_date).toLocaleDateString('tr-TR', {
        weekday: 'short',
        day: 'numeric',
      }),
    }));
  }, []);

  return { processChartData };
};

// Debounced search and filtering for React Native
export const useOptimizedFiltering = () => {
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedFilter = useCallback(
    (
      items: any[],
      searchTerm: string,
      filterFn: (item: any, term: string) => boolean,
      delay: number = 300,
    ) => {
      return new Promise((resolve) => {
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
          const filtered = searchTerm
            ? items.filter((item) => filterFn(item, searchTerm))
            : items;
          resolve(filtered);
        }, delay);
      });
    },
    [],
  );

  const clearSearchTimeout = useCallback(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
  }, []);

  return { debouncedFilter, clearSearchTimeout };
};
