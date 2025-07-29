// src/api/botService.ts
import apiRequest from './apiClient';

// Define interfaces for the actual data payloads returned by backend endpoints
export interface Bot {
  botId: number;
  userId: number;
  username: string;
  botName: string;
  difficultyLevel: number;
  accuracyRate: number;
  avgResponseTime: number;
  avatar: string;
}

interface BotDuelPayload {
  success: boolean;
  duel: {
    duel_id: number;
    opponent: {
      userId: number;
      username: string;
      botName: string;
      isBot: true;
      avatar: string;
      difficultyLevel: number;
    };
  };
  message: string;
}

interface BotsArrayPayload {
  success: boolean;
  data: Bot[];
  count: number;
}

interface BotPayload {
  success: boolean;
  data: Bot;
}

interface BotCheckPayload {
  success: boolean;
  isBot: boolean;
}

interface BotLeaderboardPayload {
  success: boolean;
  data: Bot[];
  count: number;
  sortBy: string;
}

interface RecommendedBotPayload {
  success: boolean;
  data: Bot;
  reason: string;
}

export const getAvailableBots = async (
  limit?: number,
  difficulty?: number,
): Promise<Bot[]> => {
  let url = '/bots/available';
  const params = new URLSearchParams();

  if (limit) params.append('limit', limit.toString());
  if (difficulty) params.append('difficulty', difficulty.toString());

  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const response = await apiRequest<BotsArrayPayload>(url);
  return response.data?.data || [];
};

export const getBotByDifficulty = async (
  difficultyLevel: number,
): Promise<Bot> => {
  const response = await apiRequest<BotPayload>(
    `/bots/difficulty/${difficultyLevel}`,
  );
  if (!response.data?.data) {
    throw new Error(`No bot found for difficulty level ${difficultyLevel}`);
  }
  return response.data.data;
};

export const challengeBotWithCourse = async (
  courseId: number,
  difficulty: number = 1,
): Promise<{
  success: boolean;
  duel?: any;
  message?: string;
}> => {
  try {
    const response = await apiRequest<{
      success: boolean;
      duel?: any;
      message?: string;
    }>('/bots/challenge-course', 'POST', {
      courseId,
      difficulty,
    });

    return response.data || { success: false, message: 'No response data' };
  } catch (error) {
    console.error('Error challenging bot with course:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Bot challenge failed',
    };
  }
};

// Keep the original challengeBot function for backward compatibility
export const challengeBot = async (
  testId: number,
  difficulty: number = 1,
): Promise<{
  success: boolean;
  duel?: any;
  message?: string;
}> => {
  try {
    const response = await apiRequest<{
      success: boolean;
      duel?: any;
      message?: string;
    }>('/bots/challenge', 'POST', {
      testId,
      difficulty,
    });

    return response.data || { success: false, message: 'No response data' };
  } catch (error) {
    console.error('Error challenging bot:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Bot challenge failed',
    };
  }
};

export const isBot = async (userId: number): Promise<boolean> => {
  try {
    const response = await apiRequest<BotCheckPayload>(`/bots/check/${userId}`);
    return response.data?.isBot || false;
  } catch (error) {
    console.error('Error checking if user is bot:', error);
    return false;
  }
};

export const getBotInfo = async (userId: number): Promise<Bot | null> => {
  try {
    const response = await apiRequest<BotPayload>(`/bots/info/${userId}`);
    return response.data?.data || null;
  } catch (error) {
    console.error('Error fetching bot info:', error);
    return null;
  }
};

export const getBotLeaderboard = async (
  limit: number = 10,
  sortBy: string = 'difficulty',
): Promise<Bot[]> => {
  const response = await apiRequest<BotLeaderboardPayload>(
    `/bots/leaderboard?limit=${limit}&sortBy=${sortBy}`,
  );
  return response.data?.data || [];
};

export const getRecommendedBot = async (): Promise<Bot | null> => {
  try {
    const response = await apiRequest<RecommendedBotPayload>(
      '/bots/recommended',
    );
    return response.data?.data || null;
  } catch (error) {
    console.error('Error fetching recommended bot:', error);
    return null;
  }
};
