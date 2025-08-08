// hooks/useHomeScreenState.ts
import { useReducer, useCallback, useMemo } from 'react';
import {
  User,
  AnalyticsData,
  StudyStatistics,
  CourseWithProgress,
  EditingCourseDetails,
  PerformanceData,
} from '../types/models';

// State interfaces
interface AppData {
  userData: User | null;
  analyticsData: AnalyticsData | null;
  studyStatistics: StudyStatistics | null;
}

interface CourseData {
  courses: CourseWithProgress[];
  selectedCourse: CourseWithProgress | null;
  activeCourseIndex: number;
  coursesLoading: boolean;
}

interface EditingState {
  editingCourseId: number | null;
  editingDetails: EditingCourseDetails;
  updatingCourse: number | null;
}

interface UIState {
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  showCourseModal: boolean;
  performanceLoading: boolean;
  performanceError: string | null;
}

interface HomeScreenState {
  appData: AppData;
  courseData: CourseData;
  editingState: EditingState;
  performanceData: PerformanceData;
  uiState: UIState;
}

// Action types
type HomeScreenAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_REFRESHING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SHOW_COURSE_MODAL'; payload: boolean }
  | { type: 'SET_USER_DATA'; payload: User | null }
  | { type: 'SET_ANALYTICS_DATA'; payload: AnalyticsData | null }
  | { type: 'SET_STUDY_STATISTICS'; payload: StudyStatistics | null }
  | { type: 'SET_COURSES'; payload: CourseWithProgress[] }
  | { type: 'SET_SELECTED_COURSE'; payload: CourseWithProgress | null }
  | { type: 'SET_ACTIVE_COURSE_INDEX'; payload: number }
  | { type: 'SET_COURSES_LOADING'; payload: boolean }
  | { type: 'TOGGLE_SESSION_EXPANSION'; payload: number }
  | {
      type: 'SET_EDITING_COURSE';
      payload: { courseId: number | null; details: EditingCourseDetails };
    }
  | { type: 'SET_UPDATING_COURSE'; payload: number | null }
  | { type: 'SET_PERFORMANCE_DATA'; payload: PerformanceData }
  | { type: 'SET_PERFORMANCE_LOADING'; payload: boolean }
  | { type: 'SET_PERFORMANCE_ERROR'; payload: string | null }
  | { type: 'UPDATE_APP_DATA'; payload: Partial<AppData> }
  | { type: 'UPDATE_COURSE_DATA'; payload: Partial<CourseData> }
  | { type: 'UPDATE_UI_STATE'; payload: Partial<UIState> }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: HomeScreenState = {
  appData: {
    userData: null,
    analyticsData: null,
    studyStatistics: null,
  },
  courseData: {
    courses: [],
    selectedCourse: null,
    activeCourseIndex: 0,
    coursesLoading: false,
  },
  editingState: {
    editingCourseId: null,
    editingDetails: {},
    updatingCourse: null,
  },
  performanceData: {
    longestStreaks: [],
    streaksSummary: null,
    dailyProgress: [],
    weeklyProgress: [],
    topCourses: [],
  },
  uiState: {
    loading: true,
    refreshing: false,
    error: null,
    showCourseModal: false,
    performanceLoading: false,
    performanceError: null,
  },
};

// Reducer function
function homeScreenReducer(
  state: HomeScreenState,
  action: HomeScreenAction,
): HomeScreenState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        uiState: { ...state.uiState, loading: action.payload },
      };

    case 'SET_REFRESHING':
      return {
        ...state,
        uiState: { ...state.uiState, refreshing: action.payload },
      };

    case 'SET_ERROR':
      return {
        ...state,
        uiState: { ...state.uiState, error: action.payload },
      };

    case 'SET_SHOW_COURSE_MODAL':
      return {
        ...state,
        uiState: { ...state.uiState, showCourseModal: action.payload },
      };

    case 'SET_USER_DATA':
      return {
        ...state,
        appData: { ...state.appData, userData: action.payload },
      };

    case 'SET_ANALYTICS_DATA':
      return {
        ...state,
        appData: { ...state.appData, analyticsData: action.payload },
      };

    case 'SET_STUDY_STATISTICS':
      return {
        ...state,
        appData: { ...state.appData, studyStatistics: action.payload },
      };

    case 'SET_COURSES':
      return {
        ...state,
        courseData: { ...state.courseData, courses: action.payload },
      };

    case 'SET_SELECTED_COURSE':
      return {
        ...state,
        courseData: { ...state.courseData, selectedCourse: action.payload },
      };

    case 'SET_ACTIVE_COURSE_INDEX':
      return {
        ...state,
        courseData: { ...state.courseData, activeCourseIndex: action.payload },
      };

    case 'SET_COURSES_LOADING':
      return {
        ...state,
        courseData: { ...state.courseData, coursesLoading: action.payload },
      };

    case 'TOGGLE_SESSION_EXPANSION':
      return {
        ...state,
        courseData: {
          ...state.courseData,
          courses: state.courseData.courses.map((course) =>
            course.course_id === action.payload
              ? { ...course, isSessionsExpanded: !course.isSessionsExpanded }
              : course,
          ),
        },
      };

    case 'SET_EDITING_COURSE':
      return {
        ...state,
        editingState: {
          ...state.editingState,
          editingCourseId: action.payload.courseId,
          editingDetails: action.payload.details,
        },
      };

    case 'SET_UPDATING_COURSE':
      return {
        ...state,
        editingState: { ...state.editingState, updatingCourse: action.payload },
      };

    case 'SET_PERFORMANCE_DATA':
      return {
        ...state,
        performanceData: action.payload,
      };

    case 'SET_PERFORMANCE_LOADING':
      return {
        ...state,
        uiState: { ...state.uiState, performanceLoading: action.payload },
      };

    case 'SET_PERFORMANCE_ERROR':
      return {
        ...state,
        uiState: { ...state.uiState, performanceError: action.payload },
      };

    case 'UPDATE_APP_DATA':
      return {
        ...state,
        appData: { ...state.appData, ...action.payload },
      };

    case 'UPDATE_COURSE_DATA':
      return {
        ...state,
        courseData: { ...state.courseData, ...action.payload },
      };

    case 'UPDATE_UI_STATE':
      return {
        ...state,
        uiState: { ...state.uiState, ...action.payload },
      };

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
}

// Custom hook
export function useHomeScreenState() {
  const [state, dispatch] = useReducer(homeScreenReducer, initialState);

  // Memoized action creators
  const actions = useMemo(
    () => ({
      setLoading: (loading: boolean) =>
        dispatch({ type: 'SET_LOADING', payload: loading }),
      setRefreshing: (refreshing: boolean) =>
        dispatch({ type: 'SET_REFRESHING', payload: refreshing }),
      setError: (error: string | null) =>
        dispatch({ type: 'SET_ERROR', payload: error }),
      setShowCourseModal: (show: boolean) =>
        dispatch({ type: 'SET_SHOW_COURSE_MODAL', payload: show }),
      setUserData: (userData: User | null) =>
        dispatch({ type: 'SET_USER_DATA', payload: userData }),
      setAnalyticsData: (analyticsData: AnalyticsData | null) =>
        dispatch({ type: 'SET_ANALYTICS_DATA', payload: analyticsData }),
      setStudyStatistics: (studyStatistics: StudyStatistics | null) =>
        dispatch({ type: 'SET_STUDY_STATISTICS', payload: studyStatistics }),
      setCourses: (courses: CourseWithProgress[]) =>
        dispatch({ type: 'SET_COURSES', payload: courses }),
      setSelectedCourse: (course: CourseWithProgress | null) =>
        dispatch({ type: 'SET_SELECTED_COURSE', payload: course }),
      setActiveCourseIndex: (index: number) =>
        dispatch({ type: 'SET_ACTIVE_COURSE_INDEX', payload: index }),
      setCoursesLoading: (loading: boolean) =>
        dispatch({ type: 'SET_COURSES_LOADING', payload: loading }),
      toggleSessionExpansion: (courseId: number) =>
        dispatch({ type: 'TOGGLE_SESSION_EXPANSION', payload: courseId }),
      setEditingCourse: (
        courseId: number | null,
        details: EditingCourseDetails,
      ) =>
        dispatch({
          type: 'SET_EDITING_COURSE',
          payload: { courseId, details },
        }),
      setUpdatingCourse: (courseId: number | null) =>
        dispatch({ type: 'SET_UPDATING_COURSE', payload: courseId }),
      setPerformanceData: (data: PerformanceData) =>
        dispatch({ type: 'SET_PERFORMANCE_DATA', payload: data }),
      setPerformanceLoading: (loading: boolean) =>
        dispatch({ type: 'SET_PERFORMANCE_LOADING', payload: loading }),
      setPerformanceError: (error: string | null) =>
        dispatch({ type: 'SET_PERFORMANCE_ERROR', payload: error }),
      updateAppData: (data: Partial<AppData>) =>
        dispatch({ type: 'UPDATE_APP_DATA', payload: data }),
      updateCourseData: (data: Partial<CourseData>) =>
        dispatch({ type: 'UPDATE_COURSE_DATA', payload: data }),
      updateUIState: (data: Partial<UIState>) =>
        dispatch({ type: 'UPDATE_UI_STATE', payload: data }),
      resetState: () => dispatch({ type: 'RESET_STATE' }),
    }),
    [],
  );

  return { state, actions };
}
