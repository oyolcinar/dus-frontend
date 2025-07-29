import apiRequest from './apiClient';
import { User } from '../types/models';
import {
  triggerAchievementCheck,
  getUserAchievementProgress,
  getUserStats,
} from './achievementService';

// Define interfaces for API responses
interface UserSearchResponse {
  users: User[];
  total: number;
}

interface UserProfileResponse {
  user: User;
}

interface UpdateProfilePayload {
  message: string;
  user: User;
}

interface DuelStatsPayload {
  userId: number;
  wins: number;
  losses: number;
  totalDuels: number;
  winRate: number;
  averageScore: number;
  longestLosingStreak: number;
  currentLosingStreak: number;
}

interface UpdateStudyTimePayload {
  message: string;
  totalStudyTime: number;
}

interface SetPreferredCoursePayload {
  message: string;
  preferredCourse: {
    course_id: number;
    title: string;
  };
}

/**
 * Searches for a user by their exact username.
 * This will use the backend's GET /users/search?query=... endpoint.
 *
 * @param username The username to search for.
 * @returns A promise that resolves to the User object if an exact match is found, otherwise null.
 */
export const searchUserByUsername = async (
  username: string,
): Promise<User | null> => {
  // We need to handle the case where the username might contain special characters
  const encodedUsername = encodeURIComponent(username);

  try {
    // Make the API call to the search endpoint provided by your backend
    const response = await apiRequest<User[]>(
      `/users/search?query=${encodedUsername}`,
    );

    // The backend returns an array of users. We need to find the exact match.
    const users = response.data;
    if (users && users.length > 0) {
      // Find the user whose username is an exact case-insensitive match
      const exactMatch = users.find(
        (user) => user.username.toLowerCase() === username.toLowerCase(),
      );
      return exactMatch || null;
    }

    // If no users are returned, there's no match
    return null;
  } catch (error) {
    // apiRequest will throw for 4xx/5xx errors. We can safely assume "not found".
    console.error(`Error searching for user '${username}':`, error);
    return null;
  }
};

// NEW: Enhanced user search with pagination and filters
export const searchUsers = async (
  query: string,
  limit: number = 10,
  offset: number = 0,
): Promise<UserSearchResponse> => {
  const encodedQuery = encodeURIComponent(query);

  try {
    const response = await apiRequest<UserSearchResponse>(
      `/users/search?query=${encodedQuery}&limit=${limit}&offset=${offset}`,
    );

    return response.data || { users: [], total: 0 };
  } catch (error) {
    console.error(`Error searching users with query '${query}':`, error);
    return { users: [], total: 0 };
  }
};

// NEW: Get user profile
export const getUserProfile = async (): Promise<User | null> => {
  try {
    const response = await apiRequest<UserProfileResponse>('/users/profile');
    return response.data?.user || null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

// NEW: Update user profile with achievement integration
export const updateUserProfile = async (
  profileData: Partial<User>,
): Promise<UpdateProfilePayload & { achievementCheck?: any }> => {
  try {
    const response = await apiRequest<UpdateProfilePayload>(
      '/users/profile',
      'PUT',
      profileData,
    );

    if (!response.data) {
      throw new Error('Failed to update user profile: No data received');
    }

    // Check for achievements after profile update if significant changes were made
    let achievementCheck = null;
    try {
      const significantFields = ['username', 'email', 'preferred_course_id'];
      const hasSignificantChange = significantFields.some((field) =>
        profileData.hasOwnProperty(field),
      );

      if (hasSignificantChange) {
        console.log('Checking achievements after profile update');
        achievementCheck = await triggerAchievementCheck(
          'profile_updated' as any,
        );
      }
    } catch (error) {
      console.error('Achievement check failed after profile update:', error);
    }

    return {
      ...response.data,
      achievementCheck,
    };
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// NEW: Get user duel statistics
export const getUserDuelStats = async (): Promise<DuelStatsPayload> => {
  try {
    const response = await apiRequest<DuelStatsPayload>('/users/duel-stats');

    if (!response.data) {
      console.warn('No duel stats data received, returning defaults.');
      return {
        userId: 0,
        wins: 0,
        losses: 0,
        totalDuels: 0,
        winRate: 0,
        averageScore: 0,
        longestLosingStreak: 0,
        currentLosingStreak: 0,
      };
    }

    return response.data;
  } catch (error) {
    console.error('Error fetching user duel stats:', error);
    throw error;
  }
};

// NEW: Update user study time with achievement integration
export const updateUserStudyTime = async (
  additionalMinutes: number,
): Promise<UpdateStudyTimePayload & { achievementCheck?: any }> => {
  try {
    const response = await apiRequest<UpdateStudyTimePayload>(
      '/users/study-time',
      'POST',
      { additionalMinutes },
    );

    if (!response.data) {
      throw new Error('Failed to update study time: No data received');
    }

    // Check for achievements after study time update
    let achievementCheck = null;
    try {
      console.log('Checking achievements after study time update');
      achievementCheck = await triggerAchievementCheck(
        'study_session_completed',
      );
    } catch (error) {
      console.error('Achievement check failed after study time update:', error);
    }

    return {
      ...response.data,
      achievementCheck,
    };
  } catch (error) {
    console.error('Error updating user study time:', error);
    throw error;
  }
};

// NEW: Set user preferred course with achievement integration
export const setUserPreferredCourse = async (
  courseId: number,
): Promise<SetPreferredCoursePayload & { achievementCheck?: any }> => {
  try {
    const response = await apiRequest<SetPreferredCoursePayload>(
      '/users/preferred-course',
      'POST',
      { courseId },
    );

    if (!response.data) {
      throw new Error('Failed to set preferred course: No data received');
    }

    // Check for achievements after setting preferred course
    let achievementCheck = null;
    try {
      console.log('Checking achievements after setting preferred course');
      achievementCheck = await triggerAchievementCheck(
        'course_preference_set' as any,
      );
    } catch (error) {
      console.error(
        'Achievement check failed after setting preferred course:',
        error,
      );
    }

    return {
      ...response.data,
      achievementCheck,
    };
  } catch (error) {
    console.error('Error setting user preferred course:', error);
    throw error;
  }
};

// NEW: Get comprehensive user statistics with achievements
export const getUserStatsWithAchievements = async (): Promise<{
  user: User | null;
  studyStats: any;
  duelStats: DuelStatsPayload;
  achievements: any[];
  achievementProgress: any[];
  nextMilestone?: any;
}> => {
  try {
    const [userProfile, duelStats] = await Promise.all([
      getUserProfile(),
      getUserDuelStats(),
    ]);

    // Get achievement data
    const [userAchievements, achievementProgress, userStudyStats] =
      await Promise.all([
        import('./achievementService').then((service) =>
          service.getUserAchievements(),
        ),
        getUserAchievementProgress(),
        getUserStats(),
      ]);

    // Find the next milestone
    const nextMilestone = achievementProgress
      .filter((progress) => progress.overall_progress < 100)
      .sort((a, b) => b.overall_progress - a.overall_progress)[0];

    return {
      user: userProfile,
      studyStats: userStudyStats,
      duelStats,
      achievements: userAchievements,
      achievementProgress,
      nextMilestone,
    };
  } catch (error) {
    console.error('Error getting user stats with achievements:', error);
    throw error;
  }
};

// NEW: Get user achievement summary for profile display
export const getUserAchievementSummary = async (): Promise<{
  totalAchievements: number;
  earnedAchievements: number;
  completionPercentage: number;
  recentAchievements: any[];
  nextMilestone?: any;
}> => {
  try {
    const achievementService = await import('./achievementService');

    const [allAchievements, userAchievements, achievementProgress] =
      await Promise.all([
        achievementService.getAllAchievements(),
        achievementService.getUserAchievements(),
        achievementService.getUserAchievementProgress(),
      ]);

    const totalAchievements = allAchievements.length;
    const earnedAchievements = userAchievements.length;
    const completionPercentage =
      totalAchievements > 0
        ? Math.round((earnedAchievements / totalAchievements) * 100)
        : 0;

    // Get recent achievements (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentAchievements = userAchievements.filter(
      (achievement) => new Date(achievement.date_earned) >= sevenDaysAgo,
    );

    // Find the closest achievement to completion
    const nextMilestone = achievementProgress
      .filter((progress) => progress.overall_progress < 100)
      .sort((a, b) => b.overall_progress - a.overall_progress)[0];

    return {
      totalAchievements,
      earnedAchievements,
      completionPercentage,
      recentAchievements,
      nextMilestone,
    };
  } catch (error) {
    console.error('Error getting user achievement summary:', error);
    return {
      totalAchievements: 0,
      earnedAchievements: 0,
      completionPercentage: 0,
      recentAchievements: [],
    };
  }
};

// NEW: Get user progress insights with achievements
export const getUserProgressInsights = async (): Promise<{
  studyStreak: number;
  weeklyGoalProgress: number;
  strongSubjects: string[];
  improvementAreas: string[];
  achievementMilestones: any[];
  motivationalMessage?: string;
}> => {
  try {
    const [userStats, duelStats, achievementProgress] = await Promise.all([
      getUserStats(),
      getUserDuelStats(),
      getUserAchievementProgress(),
    ]);

    // Calculate insights
    const studyStreak = userStats?.current_study_streak || 0;
    const weeklyGoalProgress = Math.min(
      ((userStats?.distinct_study_days || 0) / 7) * 100,
      100,
    );

    // Identify strong subjects based on duel performance
    const strongSubjects = duelStats.winRate > 70 ? ['Düello'] : [];

    // Identify improvement areas
    const improvementAreas = [];
    if (studyStreak < 3) improvementAreas.push('Çalışma Tutarlılığı');
    if (duelStats.winRate < 50) improvementAreas.push('Düello Performansı');

    // Get upcoming achievement milestones
    const achievementMilestones = achievementProgress
      .filter(
        (progress) =>
          progress.overall_progress >= 50 && progress.overall_progress < 100,
      )
      .sort((a, b) => b.overall_progress - a.overall_progress)
      .slice(0, 3);

    // Generate motivational message
    let motivationalMessage;
    if (studyStreak >= 7) {
      motivationalMessage = `🔥 Harika! ${studyStreak} günlük çalışma serindesin!`;
    } else if (achievementMilestones.length > 0) {
      const nextAchievement = achievementMilestones[0];
      motivationalMessage = `🎯 "${nextAchievement.name}" başarımına %${nextAchievement.overall_progress} yakınsın!`;
    } else {
      motivationalMessage =
        '💪 Yeni başarımları açmak için çalışmaya devam et!';
    }

    return {
      studyStreak,
      weeklyGoalProgress,
      strongSubjects,
      improvementAreas,
      achievementMilestones,
      motivationalMessage,
    };
  } catch (error) {
    console.error('Error getting user progress insights:', error);
    return {
      studyStreak: 0,
      weeklyGoalProgress: 0,
      strongSubjects: [],
      improvementAreas: [],
      achievementMilestones: [],
    };
  }
};

// NEW: Check if user profile is complete for achievement purposes
export const checkProfileCompleteness = async (): Promise<{
  isComplete: boolean;
  missingFields: string[];
  completionPercentage: number;
  suggestions: string[];
}> => {
  try {
    const userProfile = await getUserProfile();

    if (!userProfile) {
      return {
        isComplete: false,
        missingFields: ['profile'],
        completionPercentage: 0,
        suggestions: ['Profil bilgilerinizi tamamlayın'],
      };
    }

    const requiredFields = ['username', 'email', 'preferred_course_id'];

    const optionalFields = ['totalStudyTime', 'totalDuels'];

    const allFields = [...requiredFields, ...optionalFields];

    const missingRequired = requiredFields.filter(
      (field) => !userProfile[field as keyof User],
    );

    const missingOptional = optionalFields.filter(
      (field) => !userProfile[field as keyof User],
    );

    const completedFields =
      allFields.length - missingRequired.length - missingOptional.length;
    const completionPercentage = Math.round(
      (completedFields / allFields.length) * 100,
    );

    const suggestions = [];
    if (missingRequired.includes('preferred_course_id')) {
      suggestions.push(
        'Kişiselleştirilmiş öneriler almak için tercih ettiğin dersi belirle',
      );
    }
    if (!userProfile.totalStudyTime || userProfile.totalStudyTime < 60) {
      suggestions.push(
        'İlerleme takibini başlatmak için ilk çalışma seansını tamamla',
      );
    }
    if (!userProfile.totalDuels || userProfile.totalDuels === 0) {
      suggestions.push('İlk düellona çık!');
    }

    return {
      isComplete: missingRequired.length === 0,
      missingFields: [...missingRequired, ...missingOptional],
      completionPercentage,
      suggestions,
    };
  } catch (error) {
    console.error('Error checking profile completeness:', error);
    return {
      isComplete: false,
      missingFields: [],
      completionPercentage: 0,
      suggestions: [],
    };
  }
};

// NEW: Batch update user data with achievement checking
export const batchUpdateUserData = async (updates: {
  profile?: Partial<User>;
  studyTime?: number;
  preferredCourse?: number;
}): Promise<{
  success: boolean;
  updatedFields: string[];
  achievementCheck?: any;
  message: string;
}> => {
  try {
    const updatedFields: string[] = [];
    let totalAchievementCheck = null;

    // Update profile if provided
    if (updates.profile) {
      await updateUserProfile(updates.profile);
      updatedFields.push('profil');
    }

    // Update study time if provided
    if (updates.studyTime) {
      const studyTimeResult = await updateUserStudyTime(updates.studyTime);
      totalAchievementCheck = studyTimeResult.achievementCheck;
      updatedFields.push('çalışma süresi');
    }

    // Update preferred course if provided
    if (updates.preferredCourse) {
      const courseResult = await setUserPreferredCourse(
        updates.preferredCourse,
      );
      if (courseResult.achievementCheck && !totalAchievementCheck) {
        totalAchievementCheck = courseResult.achievementCheck;
      }
      updatedFields.push('tercih edilen ders');
    }

    let message = `Başarıyla güncellendi: ${updatedFields.join(', ')}`;
    if (totalAchievementCheck?.newAchievements > 0) {
      message += ` 🎉 ${totalAchievementCheck.newAchievements} yeni başarım kazandın!`;
    }

    return {
      success: true,
      updatedFields,
      achievementCheck: totalAchievementCheck,
      message,
    };
  } catch (error) {
    console.error('Error in batch update user data:', error);
    throw error;
  }
};

// NEW: Get users for leaderboard/social features
export const getLeaderboardUsers = async (
  type: 'study_time' | 'achievements' | 'duels' = 'study_time',
  limit: number = 10,
): Promise<{
  users: Array<{
    user: User;
    score: number;
    rank: number;
  }>;
  userRank?: number;
}> => {
  try {
    // This would require a backend endpoint for leaderboards
    // For now, return mock data - implement based on your backend capabilities
    console.log(`Getting ${type} leaderboard with limit ${limit}`);

    return {
      users: [],
      userRank: 0,
    };
  } catch (error) {
    console.error('Error getting leaderboard users:', error);
    return {
      users: [],
    };
  }
};

// Utility Functions

// Format user's study time for display
export const formatStudyTime = (totalMinutes: number): string => {
  if (totalMinutes < 60) {
    return `${totalMinutes}dk`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours < 24) {
    return minutes > 0 ? `${hours}sa ${minutes}dk` : `${hours}sa`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  return remainingHours > 0 ? `${days}gün ${remainingHours}sa` : `${days}gün`;
};

// Calculate user level based on study time and achievements
export const calculateUserLevel = (
  studyTime: number,
  achievements: number,
): { level: number; progress: number; nextLevelRequirement: string } => {
  // Simple leveling system based on study time (in minutes) and achievements
  const studyPoints = Math.floor(studyTime / 60); // 1 point per hour
  const achievementPoints = achievements * 50; // 50 points per achievement
  const totalPoints = studyPoints + achievementPoints;

  // Level calculation: Level = sqrt(totalPoints / 100)
  const level = Math.floor(Math.sqrt(totalPoints / 100)) + 1;
  const currentLevelPoints = Math.pow(level - 1, 2) * 100;
  const nextLevelPoints = Math.pow(level, 2) * 100;
  const progress = Math.round(
    ((totalPoints - currentLevelPoints) /
      (nextLevelPoints - currentLevelPoints)) *
      100,
  );

  const pointsNeeded = nextLevelPoints - totalPoints;
  const hoursNeeded = Math.max(
    0,
    Math.ceil((pointsNeeded - achievements * 50) / 1),
  );

  let nextLevelRequirement;
  if (hoursNeeded > 0) {
    nextLevelRequirement = `${hoursNeeded} saat daha çalışma`;
  } else {
    const achievementsNeeded = Math.ceil(pointsNeeded / 50);
    nextLevelRequirement = `${achievementsNeeded} başarım daha`;
  }

  return {
    level,
    progress,
    nextLevelRequirement,
  };
};

// Get display name for user (username or email fallback)
export const getUserDisplayName = (user: User): string => {
  return user.username || user.email.split('@')[0] || 'Kullanıcı';
};

// Check if user is premium/subscribed
export const isPremiumUser = (user: User): boolean => {
  return user.subscriptionType !== 'free';
};

// Get user's join duration in a readable format
export const getUserJoinDuration = (dateRegistered: string): string => {
  const joinDate = new Date(dateRegistered);
  const now = new Date();
  const diffInDays = Math.floor(
    (now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffInDays < 1) {
    return 'Bugün katıldı';
  } else if (diffInDays < 7) {
    return `${diffInDays} gün önce katıldı`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks} hafta önce katıldı`;
  } else if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return `${months} ay önce katıldı`;
  } else {
    const years = Math.floor(diffInDays / 365);
    return `${years} yıl önce katıldı`;
  }
};

// Check if user has completed initial setup
export const hasCompletedInitialSetup = async (): Promise<boolean> => {
  try {
    const completeness = await checkProfileCompleteness();
    return completeness.isComplete;
  } catch (error) {
    console.error('Error checking initial setup completion:', error);
    return false;
  }
};
