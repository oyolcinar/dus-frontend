// services/optimizedAPIService.ts
import { useBatchedAPI } from '../src/hooks/useBatchedAPI';
import { useDebounce } from '../src/hooks/useDebounce';
import { useCallback, useRef, useMemo } from 'react';

// Cache implementation
class APICache {
  private cache = new Map<
    string,
    { data: any; timestamp: number; ttl: number }
  >();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const isExpired = Date.now() - item.timestamp > item.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    const isExpired = Date.now() - item.timestamp > item.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  size(): number {
    return this.cache.size;
  }
}

// Optimized API service hook
export const useOptimizedAPIService = (services: {
  courseService: any;
  analyticsService: any;
  studyService: any;
}) => {
  const cache = useRef(new APICache());
  const { addToQueue, processBatch } = useBatchedAPI(3, 500); // Smaller batches, faster processing
  const pendingRequests = useRef(new Map<string, Promise<any>>());

  // Debounced functions for frequently called APIs
  const debouncedCourseProgress = useDebounce(
    services.courseService.getCourseProgress,
    300,
  );
  const debouncedStudySessions = useDebounce(
    services.studyService.getUserStudySessions,
    300,
  );

  // Create cache key
  const createCacheKey = useCallback(
    (endpoint: string, params: any = {}): string => {
      return `${endpoint}_${JSON.stringify(params)}`;
    },
    [],
  );

  // Generic cached API call
  const cachedAPICall = useCallback(
    async (
      key: string,
      apiCall: () => Promise<any>,
      ttl?: number,
    ): Promise<any> => {
      // Check cache first
      const cached = cache.current.get(key);
      if (cached) {
        return cached;
      }

      // Check if request is already pending
      if (pendingRequests.current.has(key)) {
        return pendingRequests.current.get(key);
      }

      // Make the API call
      const promise = apiCall();
      pendingRequests.current.set(key, promise);

      try {
        const result = await promise;
        cache.current.set(key, result, ttl);
        return result;
      } catch (error) {
        console.error(`API call failed for key ${key}:`, error);
        throw error;
      } finally {
        pendingRequests.current.delete(key);
      }
    },
    [],
  );

  // Optimized data fetching functions
  const fetchCourseProgress = useCallback(
    async (courseId: number) => {
      const key = createCacheKey('courseProgress', { courseId });
      return cachedAPICall(
        key,
        () => debouncedCourseProgress(courseId),
        2 * 60 * 1000, // 2 minutes cache
      );
    },
    [createCacheKey, cachedAPICall, debouncedCourseProgress],
  );

  const fetchStudySessions = useCallback(
    async (page: number, limit: number, courseId?: number) => {
      const key = createCacheKey('studySessions', { page, limit, courseId });
      return cachedAPICall(
        key,
        () => debouncedStudySessions(page, limit, courseId),
        1 * 60 * 1000, // 1 minute cache
      );
    },
    [createCacheKey, cachedAPICall, debouncedStudySessions],
  );

  const fetchAllCourses = useCallback(async () => {
    const key = createCacheKey('allCourses');
    return cachedAPICall(
      key,
      () => services.courseService.getAllCourses(),
      10 * 60 * 1000, // 10 minutes cache
    );
  }, [createCacheKey, cachedAPICall, services.courseService]);

  const fetchAnalyticsData = useCallback(async () => {
    const key = createCacheKey('analyticsData');
    return cachedAPICall(
      key,
      () => services.analyticsService.getUserPerformanceAnalytics(),
      3 * 60 * 1000, // 3 minutes cache
    );
  }, [createCacheKey, cachedAPICall, services.analyticsService]);

  const fetchStudyStatistics = useCallback(async () => {
    const key = createCacheKey('studyStatistics');
    return cachedAPICall(
      key,
      () => services.studyService.getUserStudyStatistics(),
      3 * 60 * 1000, // 3 minutes cache
    );
  }, [createCacheKey, cachedAPICall, services.studyService]);

  // Batched course data fetching
  const fetchCoursesWithDataBatched = useCallback(
    async (
      courses: any[],
      mapProgressData: (data: any) => any,
      mapSessionsData: (data: any) => any,
      getIconForCourse: (title: string) => string,
      getCourseCategory: (title: string) => any,
    ) => {
      const klinikCourses = courses.filter(
        (course) => course.course_type === 'klinik_dersler',
      );

      // Create batched requests
      const courseDataPromises = klinikCourses.map(async (course) => {
        try {
          const [progressData, sessionsData] = await Promise.allSettled([
            fetchCourseProgress(course.course_id),
            fetchStudySessions(1, 5, course.course_id),
          ]);

          return {
            ...course,
            progress:
              progressData.status === 'fulfilled'
                ? mapProgressData(progressData.value)
                : null,
            studySessions:
              sessionsData.status === 'fulfilled'
                ? mapSessionsData(sessionsData.value.sessions)
                : [],
            iconName: getIconForCourse(course.title),
            isSessionsExpanded: false,
            category: getCourseCategory(course.title),
          };
        } catch (error) {
          console.error(
            `Error fetching data for course ${course.course_id}:`,
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
      });

      const results = await Promise.allSettled(courseDataPromises);
      const successfulResults = results
        .filter(
          (result): result is PromiseFulfilledResult<any> =>
            result.status === 'fulfilled',
        )
        .map((result) => result.value);

      return successfulResults.sort(
        (a, b) =>
          (b.progress?.total_study_time_seconds || 0) -
          (a.progress?.total_study_time_seconds || 0),
      );
    },
    [fetchCourseProgress, fetchStudySessions],
  );

  // Performance data fetching with reduced API calls
  const fetchPerformanceDataOptimized = useCallback(async () => {
    const performanceAPIs = [
      {
        key: 'longestStreaks',
        fn: () => services.analyticsService.getUserLongestStreaks(),
      },
      {
        key: 'streaksSummary',
        fn: () => services.analyticsService.getUserStreaksSummary(),
      },
      {
        key: 'dailyProgress',
        fn: () =>
          services.analyticsService.getUserDailyProgress(
            undefined,
            undefined,
            7,
          ),
      },
      {
        key: 'topCourses',
        fn: () => services.analyticsService.getUserTopCourses(1),
      },
    ];

    const results = await Promise.allSettled(
      performanceAPIs.map(async (api) => {
        const key = createCacheKey(api.key);
        return {
          key: api.key,
          data: await cachedAPICall(key, api.fn, 5 * 60 * 1000), // 5 minutes cache
        };
      }),
    );

    const performanceData = {
      longestStreaks: [],
      streaksSummary: null,
      dailyProgress: [],
      weeklyProgress: [],
      topCourses: [],
    };

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const { key, data } = result.value;
        switch (key) {
          case 'longestStreaks':
            performanceData.longestStreaks = data?.streaks || [];
            break;
          case 'streaksSummary':
            performanceData.streaksSummary = data;
            break;
          case 'dailyProgress':
            performanceData.dailyProgress = data?.dailyProgress || [];
            break;
          case 'topCourses':
            performanceData.topCourses = data || [];
            break;
        }
      }
    });

    return performanceData;
  }, [createCacheKey, cachedAPICall, services.analyticsService]);

  // Cache management
  const clearCache = useCallback(() => {
    cache.current.clear();
    pendingRequests.current.clear();
    console.log('API cache cleared');
  }, []);

  const getCacheStats = useCallback(() => {
    return {
      size: cache.current.size(),
      pendingRequests: pendingRequests.current.size,
    };
  }, []);

  // Invalidate specific cache entries
  const invalidateCache = useCallback(
    (pattern?: string) => {
      if (!pattern) {
        clearCache();
        return;
      }

      // Implementation for pattern-based cache invalidation could go here
      console.log(`Cache invalidation for pattern: ${pattern}`);
    },
    [clearCache],
  );

  return {
    fetchCourseProgress,
    fetchStudySessions,
    fetchAllCourses,
    fetchAnalyticsData,
    fetchStudyStatistics,
    fetchCoursesWithDataBatched,
    fetchPerformanceDataOptimized,
    clearCache,
    getCacheStats,
    invalidateCache,
    addToQueue,
    processBatch,
  };
};
