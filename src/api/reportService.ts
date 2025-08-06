import apiRequest from './apiClient';

// Define interfaces for the data payloads

// For GET /reports/reasons
type ReportReasonsPayload = Array<{
  reason_id: number;
  reason_text: string;
  description: string;
}>;

// For POST /reports/question
interface CreateReportPayload {
  message: string;
  report: {
    report_id: number;
    user_id: number;
    test_question_id: number;
    report_reason_id: number;
    additional_comments: string | null;
    reported_at: string;
    status: string;
    report_reasons: {
      reason_id: number;
      reason_text: string;
      description: string;
    };
  };
}

// For GET /reports/my-reports and /reports/all
interface ReportsListPayload {
  data: Array<{
    report_id: number;
    user_id?: number;
    test_question_id: number;
    additional_comments: string | null;
    reported_at: string;
    status: string;
    admin_response: string | null;
    reviewed_by: number | null;
    reviewed_at: string | null;
    report_reasons: {
      reason_id: number;
      reason_text: string;
      description: string;
    };
    test_questions?: {
      question_id: number;
      test_id: number;
      question_text: string;
      options: Record<string, string>;
      correct_answer: string;
    };
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// For GET /reports/:id
type ReportDetailsPayload = {
  report_id: number;
  user_id: number;
  test_question_id: number;
  additional_comments: string | null;
  reported_at: string;
  status: string;
  admin_response: string | null;
  reviewed_by: number | null;
  reviewed_at: string | null;
  report_reasons: {
    reason_id: number;
    reason_text: string;
    description: string;
  };
  test_questions: {
    question_id: number;
    test_id: number;
    question_text: string;
    options: Record<string, string>;
    correct_answer: string;
    explanation: string | null;
  };
};

// For GET /reports/question/:questionId/check
interface CheckReportPayload {
  hasReported: boolean;
  userId: number;
  testQuestionId: number;
  reportReasonId: number;
}

// For GET /reports/stats
interface ReportStatsPayload {
  totalReports: number;
  statusBreakdown: Record<string, number>;
  reasonBreakdown: Record<string, number>;
}

// Service Input DTOs
export interface CreateReportRequest {
  testQuestionId: number;
  reportReasonId: number;
  additionalComments?: string;
}

export interface UpdateReportStatusRequest {
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  adminResponse?: string;
}

// Service Functions

export const getReportReasons = async (): Promise<ReportReasonsPayload> => {
  const response = await apiRequest<ReportReasonsPayload>('/reports/reasons');
  return response.data || [];
};

export const createQuestionReport = async (
  data: CreateReportRequest,
): Promise<CreateReportPayload> => {
  const response = await apiRequest<CreateReportPayload>(
    '/reports/question',
    'POST',
    data,
  );
  if (!response.data) {
    throw new Error('Failed to create question report: No data returned.');
  }
  return response.data;
};

export const getUserReports = async (
  page: number = 1,
  limit: number = 10,
): Promise<ReportsListPayload> => {
  const response = await apiRequest<ReportsListPayload>(
    `/reports/my-reports?page=${page}&limit=${limit}`,
  );
  return (
    response.data || {
      data: [],
      pagination: { page, limit, total: 0, totalPages: 0 },
    }
  );
};

export const getAllReports = async (
  page: number = 1,
  limit: number = 20,
  status?: string,
): Promise<ReportsListPayload> => {
  let url = `/reports/all?page=${page}&limit=${limit}`;
  if (status) {
    url += `&status=${status}`;
  }

  const response = await apiRequest<ReportsListPayload>(url);
  return (
    response.data || {
      data: [],
      pagination: { page, limit, total: 0, totalPages: 0 },
    }
  );
};

export const getReportById = async (
  reportId: number,
): Promise<ReportDetailsPayload | null> => {
  try {
    const response = await apiRequest<ReportDetailsPayload>(
      `/reports/${reportId}`,
    );
    return response.data || null;
  } catch (error: any) {
    if (error.status === 404) {
      console.warn(`Report with ID ${reportId} not found (404).`);
      return null;
    }
    console.error(`Error fetching report ID ${reportId}:`, error);
    throw error;
  }
};

export const getQuestionReports = async (
  testQuestionId: number,
): Promise<Array<ReportDetailsPayload>> => {
  const response = await apiRequest<Array<ReportDetailsPayload>>(
    `/reports/question/${testQuestionId}`,
  );
  return response.data || [];
};

export const checkUserReport = async (
  testQuestionId: number,
  reportReasonId: number,
): Promise<CheckReportPayload> => {
  const response = await apiRequest<CheckReportPayload>(
    `/reports/question/${testQuestionId}/check?reasonId=${reportReasonId}`,
  );
  if (!response.data) {
    throw new Error('Failed to check user report: No data returned.');
  }
  return response.data;
};

export const updateReportStatus = async (
  reportId: number,
  data: UpdateReportStatusRequest,
): Promise<{ message: string; report: ReportDetailsPayload }> => {
  const response = await apiRequest<{
    message: string;
    report: ReportDetailsPayload;
  }>(`/reports/${reportId}/status`, 'PUT', data);
  if (!response.data) {
    throw new Error(`Failed to update report ${reportId}: No data returned.`);
  }
  return response.data;
};

export const deleteReport = async (
  reportId: number,
): Promise<{ message: string }> => {
  const response = await apiRequest<{ message: string }>(
    `/reports/${reportId}`,
    'DELETE',
  );
  return response.data || { message: 'Report deleted successfully.' };
};

export const getReportStats = async (): Promise<ReportStatsPayload> => {
  const response = await apiRequest<ReportStatsPayload>('/reports/stats');
  if (!response.data) {
    throw new Error('Failed to fetch report statistics: No data returned.');
  }
  return response.data;
};

// Utility functions

export const getReportStatusColor = (status: string): string => {
  switch (status) {
    case 'pending':
      return '#f59e0b'; // yellow
    case 'reviewed':
      return '#3b82f6'; // blue
    case 'resolved':
      return '#10b981'; // green
    case 'dismissed':
      return '#ef4444'; // red
    default:
      return '#6b7280'; // gray
  }
};

export const getReportStatusText = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'Beklemede';
    case 'reviewed':
      return 'İncelendi';
    case 'resolved':
      return 'Çözüldü';
    case 'dismissed':
      return 'Reddedildi';
    default:
      return 'Bilinmeyen';
  }
};

export const formatReportDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Question reporting helper specifically for duel results
export const reportQuestionFromDuel = async (
  questionId: number,
  reasonId: number,
  comments?: string,
): Promise<boolean> => {
  try {
    await createQuestionReport({
      testQuestionId: questionId,
      reportReasonId: reasonId,
      additionalComments: comments,
    });
    return true;
  } catch (error: any) {
    console.error('Error reporting question from duel:', error);
    // Handle specific error cases
    if (error.status === 409) {
      throw new Error('Bu soruyu aynı sebeple zaten rapor ettiniz.');
    }
    if (error.status === 404) {
      throw new Error('Soru bulunamadı.');
    }
    throw new Error('Soru rapor edilirken bir hata oluştu.');
  }
};
