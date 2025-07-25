const API_ENDPOINTS = {
  Authentication: [
    { name: 'Register', method: 'POST', path: '/api/auth/register' },
    { name: 'Login', method: 'POST', path: '/api/auth/login' },
    { name: 'Sign Out', method: 'POST', path: '/api/auth/signout' },
    { name: 'Get Permissions', method: 'GET', path: '/api/auth/permissions' },
    {
      name: 'Reset Password',
      method: 'POST',
      path: '/api/auth/reset-password',
    },
    {
      name: 'Update Password',
      method: 'POST',
      path: '/api/auth/update-password',
    },
    { name: 'Refresh Token', method: 'POST', path: '/api/auth/refresh-token' },
    { name: 'Get Current User', method: 'GET', path: '/api/auth/me' },
  ],
  'User Management': [
    { name: 'Get Profile', method: 'GET', path: '/api/users/profile' },
    {
      name: 'Search Users',
      method: 'GET',
      path: '/api/users/search?query=test',
    },
    { name: 'Get Duel Stats', method: 'GET', path: '/api/users/duel-stats' },
    {
      name: 'Update Study Time',
      method: 'POST',
      path: '/api/users/study-time',
    },
  ],
  Courses: [
    { name: 'List Courses', method: 'GET', path: '/api/courses' },
    { name: 'Get Course', method: 'GET', path: '/api/courses/1' },
    { name: 'Create Course', method: 'POST', path: '/api/courses' },
    { name: 'Update Course', method: 'PUT', path: '/api/courses/1' },
    { name: 'Delete Course', method: 'DELETE', path: '/api/courses/1' },
    {
      name: 'Get Courses by Type',
      method: 'GET',
      path: '/api/courses/type/temel_dersler',
    },
    {
      name: 'Get Course Statistics',
      method: 'GET',
      path: '/api/courses/1/stats',
    },
  ],
  Topics: [
    { name: 'List Topics', method: 'GET', path: '/api/topics?courseId=1' },
    { name: 'Get Topic', method: 'GET', path: '/api/topics/1' },
    { name: 'Create Topic', method: 'POST', path: '/api/topics' },
    { name: 'Update Topic', method: 'PUT', path: '/api/topics/1' },
    { name: 'Delete Topic', method: 'DELETE', path: '/api/topics/1' },
    {
      name: 'Get Topic Statistics',
      method: 'GET',
      path: '/api/topics/1/stats',
    },
    {
      name: 'Get Topics by Course',
      method: 'GET',
      path: '/api/topics/course/1',
    },
  ],
  Subtopics: [
    { name: 'List Subtopics', method: 'GET', path: '/api/subtopics?topicId=1' },
    { name: 'Get Subtopic', method: 'GET', path: '/api/subtopics/1' },
    { name: 'Create Subtopic', method: 'POST', path: '/api/subtopics' },
    { name: 'Update Subtopic', method: 'PUT', path: '/api/subtopics/1' },
    { name: 'Delete Subtopic', method: 'DELETE', path: '/api/subtopics/1' },
  ],
  'Study Tracking': [
    // NEW: Chronometer functionality
    {
      name: 'Start Study Session',
      method: 'POST',
      path: '/api/study/sessions/start',
    },
    {
      name: 'End Study Session',
      method: 'POST',
      path: '/api/study/sessions/1/end',
    },
    {
      name: 'Get Active Session',
      method: 'GET',
      path: '/api/study/sessions/active/1',
    },
    { name: 'Get User Sessions', method: 'GET', path: '/api/study/sessions' },
    {
      name: 'Get User Sessions Paginated',
      method: 'GET',
      path: '/api/study/sessions?page=1&limit=20',
    },
    {
      name: 'Get Sessions by Topic',
      method: 'GET',
      path: '/api/study/sessions?topicId=1',
    },
    {
      name: 'Get Sessions by Course',
      method: 'GET',
      path: '/api/study/sessions?courseId=1',
    },

    // NEW: Topic details management
    {
      name: 'Update Topic Details',
      method: 'POST',
      path: '/api/study/topic-details',
    },
    {
      name: 'Get Topic Details',
      method: 'GET',
      path: '/api/study/topic-details/1',
    },

    // NEW: Course and overview endpoints
    {
      name: 'Get Klinik Courses',
      method: 'GET',
      path: '/api/study/courses/klinik',
    },
    {
      name: 'Get Course Study Overview',
      method: 'GET',
      path: '/api/study/overview/course/1',
    },
    {
      name: 'Get All Courses Statistics',
      method: 'GET',
      path: '/api/study/overview/all-courses',
    },
    {
      name: 'Get Study Statistics',
      method: 'GET',
      path: '/api/study/statistics',
    },

    // NEW: Preferred course management
    {
      name: 'Set Preferred Course',
      method: 'POST',
      path: '/api/study/preferred-course',
    },
    {
      name: 'Get Preferred Course',
      method: 'GET',
      path: '/api/study/preferred-course',
    },

    // Legacy study endpoints
    { name: 'Start Session', method: 'POST', path: '/api/study/session/start' },
    { name: 'End Session', method: 'POST', path: '/api/study/session/end' },
    { name: 'Get Progress', method: 'GET', path: '/api/study/progress' },
    { name: 'Update Progress', method: 'POST', path: '/api/study/progress' },
  ],
  Coaching: [
    { name: 'List Notes', method: 'GET', path: 'api/coaching/notes' },
    { name: 'Get Note', method: 'GET', path: 'api/coaching/notes/1' },
    { name: 'List Videos', method: 'GET', path: 'api/coaching/videos' },
    { name: 'Get Video', method: 'GET', path: 'api/coaching/videos/1' },
  ],
  Tests: [
    { name: 'List Tests', method: 'GET', path: '/api/tests' },
    { name: 'Get Test', method: 'GET', path: '/api/tests/1' },
    { name: 'Create Test', method: 'POST', path: '/api/tests' },
    { name: 'Update Test', method: 'PUT', path: '/api/tests/1' },
    { name: 'Delete Test', method: 'DELETE', path: '/api/tests/1' },
    { name: 'Get Tests by Course', method: 'GET', path: '/api/tests/course/1' },
    { name: 'Get Tests by Topic', method: 'GET', path: '/api/tests/topic/1' },
    {
      name: 'Get Tests by Course Type',
      method: 'GET',
      path: '/api/tests/course-type/temel_dersler',
    },
    {
      name: 'Get Tests with Course Filter',
      method: 'GET',
      path: '/api/tests?courseId=1',
    },
    {
      name: 'Get Tests with Topic Filter',
      method: 'GET',
      path: '/api/tests?topicId=1',
    },
    {
      name: 'Get Tests with Multiple Filters',
      method: 'GET',
      path: '/api/tests?courseId=1&topicId=1',
    },
    {
      name: 'Get Test with Questions',
      method: 'GET',
      path: '/api/tests/1/with-questions',
    },
    { name: 'Get Test Statistics', method: 'GET', path: '/api/tests/1/stats' },
    {
      name: 'Check User Test History',
      method: 'GET',
      path: '/api/tests/1/user-history',
    },
  ],
  Questions: [
    { name: 'List Questions', method: 'GET', path: '/api/questions?testId=1' },
    { name: 'Get Question', method: 'GET', path: '/api/questions/1' },
    { name: 'Create Question', method: 'POST', path: '/api/questions' },
    { name: 'Update Question', method: 'PUT', path: '/api/questions/1' },
    { name: 'Delete Question', method: 'DELETE', path: '/api/questions/1' },
    {
      name: 'Get Questions by Topic',
      method: 'GET',
      path: '/api/questions?topicId=1',
    },
  ],
  Answers: [
    { name: 'Submit Answer', method: 'POST', path: '/api/answers' },
    {
      name: 'Submit Batch Answers',
      method: 'POST',
      path: '/api/answers/batch',
    },
    {
      name: 'Get Answers by Result',
      method: 'GET',
      path: '/api/answers/result/1',
    },
    {
      name: 'Get Incorrect Answers with Explanations',
      method: 'GET',
      path: '/api/answers/incorrect-with-explanations?limit=10',
    },
    {
      name: 'Update Answer Definition',
      method: 'PUT',
      path: '/api/answers/1/definition',
    },
    {
      name: 'Get Answer Explanation Stats',
      method: 'GET',
      path: '/api/answers/explanation-stats',
    },
  ],
  Results: [
    { name: 'List Results', method: 'GET', path: '/api/results' },
    { name: 'Get Result', method: 'GET', path: '/api/results/1' },
    { name: 'Submit Test Result', method: 'POST', path: '/api/results/submit' },
  ],
  Duels: [
    { name: 'List Duels', method: 'GET', path: '/api/duels' },
    { name: 'Get Duel', method: 'GET', path: '/api/duels/1' },
    { name: 'Create Duel', method: 'POST', path: '/api/duels' },
    { name: 'Accept Duel', method: 'POST', path: '/api/duels/1/accept' },
    { name: 'Reject Duel', method: 'POST', path: '/api/duels/1/reject' },
    { name: 'Complete Duel', method: 'POST', path: '/api/duels/1/complete' },
  ],
  'Duel Results': [
    { name: 'Get Duel Result', method: 'GET', path: '/api/duel-results/1' },
    { name: 'Create Duel Result', method: 'POST', path: '/api/duel-results' },
  ],
  Friends: [
    { name: 'List Friends', method: 'GET', path: '/api/friends' },
    { name: 'Send Request', method: 'POST', path: '/api/friends/request' },
    { name: 'Accept Request', method: 'POST', path: '/api/friends/accept/1' },
    { name: 'Reject Request', method: 'POST', path: '/api/friends/reject/1' },
    { name: 'Remove Friend', method: 'DELETE', path: '/api/friends/1' },
  ],
  Achievements: [
    { name: 'List Achievements', method: 'GET', path: '/api/achievements' },
    {
      name: 'Get User Achievements',
      method: 'GET',
      path: '/api/achievements/user',
    },
  ],
  Subscriptions: [
    { name: 'Get Subscription', method: 'GET', path: '/api/subscriptions' },
    { name: 'Create Subscription', method: 'POST', path: '/api/subscriptions' },
    {
      name: 'Update Subscription',
      method: 'PUT',
      path: '/api/subscriptions/1',
    },
    {
      name: 'Cancel Subscription',
      method: 'DELETE',
      path: '/api/subscriptions/1',
    },
  ],
  'Study Plans': [
    { name: 'List Plans', method: 'GET', path: '/api/studyPlans' },
    { name: 'Get Plan', method: 'GET', path: '/api/studyPlans/1' },
    { name: 'Create Plan', method: 'POST', path: '/api/studyPlans' },
    { name: 'Update Plan', method: 'PUT', path: '/api/studyPlans/1' },
    { name: 'Delete Plan', method: 'DELETE', path: '/api/studyPlans/1' },
  ],
  Analytics: [
    // NEW: Streak Analytics
    {
      name: 'Get Longest Streaks',
      method: 'GET',
      path: '/api/analytics/streaks/longest',
    },
    {
      name: 'Get Streaks Summary',
      method: 'GET',
      path: '/api/analytics/streaks/summary',
    },
    {
      name: 'Get Streaks Analytics',
      method: 'GET',
      path: '/api/analytics/streaks/analytics',
    },

    // NEW: Progress Analytics
    {
      name: 'Get Daily Progress',
      method: 'GET',
      path: '/api/analytics/progress/daily',
    },
    {
      name: 'Get Daily Progress with Params',
      method: 'GET',
      path: '/api/analytics/progress/daily?days=30',
    },
    {
      name: 'Get Daily Progress Date Range',
      method: 'GET',
      path: '/api/analytics/progress/daily?startDate=2024-01-01&endDate=2024-01-31',
    },
    {
      name: 'Get Weekly Progress',
      method: 'GET',
      path: '/api/analytics/progress/weekly',
    },
    {
      name: 'Get Weekly Progress with Params',
      method: 'GET',
      path: '/api/analytics/progress/weekly?weeksBack=12',
    },
    {
      name: 'Get Daily Progress Analytics',
      method: 'GET',
      path: '/api/analytics/progress/daily-analytics',
    },
    {
      name: 'Get Weekly Progress Analytics',
      method: 'GET',
      path: '/api/analytics/progress/weekly-analytics',
    },

    // NEW: Course Analytics
    {
      name: 'Get Top Courses',
      method: 'GET',
      path: '/api/analytics/courses/top',
    },
    {
      name: 'Get Top Courses Limited',
      method: 'GET',
      path: '/api/analytics/courses/top?limit=5',
    },
    {
      name: 'Get Most Studied Course',
      method: 'GET',
      path: '/api/analytics/courses/most-studied',
    },
    {
      name: 'Get Course Analytics',
      method: 'GET',
      path: '/api/analytics/courses/analytics',
    },

    // NEW: Comparative Analytics
    {
      name: 'Get Comparative Analytics',
      method: 'GET',
      path: '/api/analytics/comparative',
    },
    {
      name: 'Get Recent Activity',
      method: 'GET',
      path: '/api/analytics/recent-activity',
    },
    {
      name: 'Get Recent Activity with Days',
      method: 'GET',
      path: '/api/analytics/recent-activity?daysBack=7',
    },

    // NEW: Dashboard Analytics
    {
      name: 'Get Dashboard Analytics',
      method: 'GET',
      path: '/api/analytics/dashboard',
    },
    {
      name: 'Get Analytics Summary',
      method: 'GET',
      path: '/api/analytics/summary',
    },
    { name: 'Get All Analytics', method: 'GET', path: '/api/analytics/all' },
    {
      name: 'Get All Analytics with Params',
      method: 'GET',
      path: '/api/analytics/all?daysBack=30&weeksBack=12',
    },

    // Legacy Analytics (for backward compatibility)
    {
      name: 'Get Dashboard Analytics Legacy',
      method: 'GET',
      path: '/api/analytics/dashboard-legacy',
    },
    {
      name: 'Get Weekly Progress Legacy',
      method: 'GET',
      path: '/api/analytics/weekly-progress',
    },
    {
      name: 'Get Topic Analytics Legacy',
      method: 'GET',
      path: '/api/analytics/topics',
    },
    {
      name: 'Get Test Topic Analytics Legacy',
      method: 'GET',
      path: '/api/analytics/test-topics',
    },
    {
      name: 'Get User Performance Legacy',
      method: 'GET',
      path: '/api/analytics/user-performance',
    },
    {
      name: 'Get Activity Timeline Legacy',
      method: 'GET',
      path: '/api/analytics/activity?days=7',
    },
    {
      name: 'Get Weakest Topics Legacy',
      method: 'GET',
      path: '/api/analytics/weakest-topics?limit=5',
    },
    {
      name: 'Get Improvement Metrics Legacy',
      method: 'GET',
      path: '/api/analytics/improvement',
    },
    {
      name: 'Get Study Time Distribution Legacy',
      method: 'GET',
      path: '/api/analytics/study-time-distribution',
    },
    {
      name: 'Get Answer Explanations Legacy',
      method: 'GET',
      path: '/api/analytics/answer-explanations?limit=10',
    },
    {
      name: 'Get Admin Overview',
      method: 'GET',
      path: '/api/analytics/admin/overview',
    },
    {
      name: 'Get Admin User Performance',
      method: 'GET',
      path: '/api/analytics/admin/user-performance',
    },
  ],
  'User History': [
    {
      name: 'Check Question Answered',
      method: 'GET',
      path: '/api/user-history/question/1',
    },
    {
      name: 'Get User Test History',
      method: 'GET',
      path: '/api/user-history/test/1',
    },
    {
      name: 'Get User Course History',
      method: 'GET',
      path: '/api/user-history/course/1',
    },
    {
      name: 'Get User Topic History',
      method: 'GET',
      path: '/api/user-history/topic/1',
    },
    {
      name: 'Get Complete Question History',
      method: 'GET',
      path: '/api/user-history/questions',
    },
    {
      name: 'Get User Course Statistics',
      method: 'GET',
      path: '/api/user-history/course-stats',
    },
    {
      name: 'Get User Topic Statistics',
      method: 'GET',
      path: '/api/user-history/topic-stats',
    },
    {
      name: 'Get Incorrect Answers',
      method: 'GET',
      path: '/api/user-history/incorrect-answers',
    },
    {
      name: 'Get Incorrect Answers by Topic',
      method: 'GET',
      path: '/api/user-history/incorrect-answers?topicId=1',
    },
    {
      name: 'Get Performance Trends',
      method: 'GET',
      path: '/api/user-history/trends',
    },
    {
      name: 'Get Review Questions',
      method: 'GET',
      path: '/api/user-history/review-questions',
    },
    {
      name: 'Get Review Questions by Topic',
      method: 'GET',
      path: '/api/user-history/review-questions?topicId=1',
    },
    {
      name: 'Get Performance Summary',
      method: 'GET',
      path: '/api/user-history/performance-summary',
    },
  ],
  Admin: [
    { name: 'List All Users', method: 'GET', path: '/api/admin/users' },
    { name: 'Get User Details', method: 'GET', path: '/api/admin/users/1' },
    {
      name: 'Update User Role',
      method: 'PUT',
      path: '/api/admin/users/1/role',
    },
    { name: 'System Health', method: 'GET', path: '/api/admin/health' },
    { name: 'Usage Stats', method: 'GET', path: '/api/admin/stats' },
    {
      name: 'Get Topic Usage Stats',
      method: 'GET',
      path: '/api/admin/topics/usage-stats',
    },
    {
      name: 'Get Test Distribution by Topics',
      method: 'GET',
      path: '/api/admin/tests/topic-distribution',
    },
  ],
  'Topic Management': [
    {
      name: 'Get Topic with Tests',
      method: 'GET',
      path: '/api/topics/1/with-tests',
    },
    {
      name: 'Get Topic Performance Summary',
      method: 'GET',
      path: '/api/topics/1/performance-summary',
    },
    {
      name: 'Get Topics with Test Counts',
      method: 'GET',
      path: '/api/topics/with-test-counts',
    },
    {
      name: 'Get Topic Difficulty Analysis',
      method: 'GET',
      path: '/api/topics/1/difficulty-analysis',
    },
  ],
  'Test Management': [
    {
      name: 'Bulk Update Test Topics',
      method: 'PUT',
      path: '/api/tests/bulk-update-topics',
    },
    {
      name: 'Get Tests without Topics',
      method: 'GET',
      path: '/api/tests/without-topics',
    },
    {
      name: 'Validate Test Topic Assignments',
      method: 'GET',
      path: '/api/tests/validate-topic-assignments',
    },
    {
      name: 'Get Test Topic Coverage',
      method: 'GET',
      path: '/api/tests/topic-coverage',
    },
  ],
};

export default API_ENDPOINTS;
