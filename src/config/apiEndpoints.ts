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
    // Course type and statistics endpoints
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
    // NEW: Topic statistics endpoints
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
  Study: [
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
    // Basic test operations
    { name: 'List Tests', method: 'GET', path: '/api/tests' },
    { name: 'Get Test', method: 'GET', path: '/api/tests/1' },
    { name: 'Create Test', method: 'POST', path: '/api/tests' },
    { name: 'Update Test', method: 'PUT', path: '/api/tests/1' },
    { name: 'Delete Test', method: 'DELETE', path: '/api/tests/1' },

    // Course and topic relationship endpoints
    { name: 'Get Tests by Course', method: 'GET', path: '/api/tests/course/1' },
    { name: 'Get Tests by Topic', method: 'GET', path: '/api/tests/topic/1' }, // NEW
    {
      name: 'Get Tests by Course Type',
      method: 'GET',
      path: '/api/tests/course-type/temel_dersler',
    },

    // Test with filtering
    {
      name: 'Get Tests with Course Filter',
      method: 'GET',
      path: '/api/tests?courseId=1',
    },
    {
      name: 'Get Tests with Topic Filter',
      method: 'GET',
      path: '/api/tests?topicId=1',
    }, // NEW
    {
      name: 'Get Tests with Multiple Filters',
      method: 'GET',
      path: '/api/tests?courseId=1&topicId=1',
    }, // NEW

    // Test details and statistics
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
    // NEW: Question filtering by topic
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
    // Answer explanation endpoints
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
    // User analytics
    {
      name: 'Get User Dashboard Analytics',
      method: 'GET',
      path: '/api/analytics/dashboard',
    },
    {
      name: 'Get Weekly Progress',
      method: 'GET',
      path: '/api/analytics/weekly-progress',
    },
    {
      name: 'Get Topic Analytics',
      method: 'GET',
      path: '/api/analytics/topics',
    },
    {
      name: 'Get Test Topic Analytics', // NEW
      method: 'GET',
      path: '/api/analytics/test-topics',
    },
    {
      name: 'Get User Performance',
      method: 'GET',
      path: '/api/analytics/user-performance',
    },
    {
      name: 'Get Activity Timeline',
      method: 'GET',
      path: '/api/analytics/activity?days=7',
    },
    {
      name: 'Get Weakest Topics',
      method: 'GET',
      path: '/api/analytics/weakest-topics?limit=5',
    },
    {
      name: 'Get Improvement Metrics',
      method: 'GET',
      path: '/api/analytics/improvement',
    },
    {
      name: 'Get Study Time Distribution',
      method: 'GET',
      path: '/api/analytics/study-time-distribution',
    },
    // Answer explanations endpoint (enhanced with topic data)
    {
      name: 'Get Answer Explanations',
      method: 'GET',
      path: '/api/analytics/answer-explanations?limit=10',
    },
    // Admin analytics
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
  // User Question History endpoints
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
      name: 'Get User Topic History', // NEW
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
      name: 'Get User Topic Statistics', // NEW
      method: 'GET',
      path: '/api/user-history/topic-stats',
    },
    {
      name: 'Get Incorrect Answers',
      method: 'GET',
      path: '/api/user-history/incorrect-answers',
    },
    {
      name: 'Get Incorrect Answers by Topic', // NEW
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
      name: 'Get Review Questions by Topic', // NEW
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
    // NEW: Admin topic management
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
  // NEW: Topic Management section
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
  // NEW: Enhanced Test Management section
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
