// API Endpoints definition
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
  ],
  Topics: [
    { name: 'List Topics', method: 'GET', path: '/api/topics?courseId=1' },
    { name: 'Get Topic', method: 'GET', path: '/api/topics/1' },
    { name: 'Create Topic', method: 'POST', path: '/api/topics' },
    { name: 'Update Topic', method: 'PUT', path: '/api/topics/1' },
    { name: 'Delete Topic', method: 'DELETE', path: '/api/topics/1' },
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
    { name: 'List Tests', method: 'GET', path: 'api/tests?topicId=1' },
    { name: 'Get Test', method: 'GET', path: 'api/tests/1' },
    { name: 'Create Test', method: 'POST', path: 'api/tests' },
    { name: 'Update Test', method: 'PUT', path: 'api/tests/1' },
    { name: 'Delete Test', method: 'DELETE', path: 'api/tests/1' },
  ],
  Questions: [
    { name: 'List Questions', method: 'GET', path: 'api/questions?testId=1' },
    { name: 'Get Question', method: 'GET', path: 'api/questions/1' },
    { name: 'Create Question', method: 'POST', path: 'api/questions' },
    { name: 'Update Question', method: 'PUT', path: 'api/questions/1' },
    { name: 'Delete Question', method: 'DELETE', path: 'api/questions/1' },
  ],
  Answers: [
    { name: 'Submit Answer', method: 'POST', path: 'api/answers' },
    { name: 'Get Answers', method: 'GET', path: 'api/answers?resultId=1' },
  ],
  Results: [
    { name: 'List Results', method: 'GET', path: 'api/results' },
    { name: 'Get Result', method: 'GET', path: 'api/results/1' },
  ],
  Duels: [
    { name: 'List Duels', method: 'GET', path: 'api/duels' },
    { name: 'Get Duel', method: 'GET', path: 'api/duels/1' },
    { name: 'Create Duel', method: 'POST', path: 'api/duels' },
    { name: 'Accept Duel', method: 'POST', path: 'api/duels/1/accept' },
    { name: 'Reject Duel', method: 'POST', path: 'api/duels/1/reject' },
    { name: 'Complete Duel', method: 'POST', path: 'api/duels/1/complete' },
  ],
  'Duel Results': [
    { name: 'Get Duel Result', method: 'GET', path: 'api/duel-results/1' },
    { name: 'Create Duel Result', method: 'POST', path: 'api/duel-results' },
  ],
  Friends: [
    { name: 'List Friends', method: 'GET', path: 'api/friends' },
    { name: 'Send Request', method: 'POST', path: 'api/friends/request' },
    { name: 'Accept Request', method: 'POST', path: 'api/friends/accept/1' },
    { name: 'Reject Request', method: 'POST', path: 'api/friends/reject/1' },
    { name: 'Remove Friend', method: 'DELETE', path: 'api/friends/1' },
  ],
  Achievements: [
    { name: 'List Achievements', method: 'GET', path: 'api/achievements' },
    {
      name: 'Get User Achievements',
      method: 'GET',
      path: 'api/achievements/user',
    },
  ],
  Subscriptions: [
    { name: 'Get Subscription', method: 'GET', path: 'api/subscriptions' },
    { name: 'Create Subscription', method: 'POST', path: 'api/subscriptions' },
    { name: 'Update Subscription', method: 'PUT', path: 'api/subscriptions/1' },
    {
      name: 'Cancel Subscription',
      method: 'DELETE',
      path: 'api/subscriptions/1',
    },
  ],
  'Study Plans': [
    { name: 'List Plans', method: 'GET', path: 'api/studyPlans' },
    { name: 'Get Plan', method: 'GET', path: 'api/studyPlans/1' },
    { name: 'Create Plan', method: 'POST', path: 'api/studyPlans' },
    { name: 'Update Plan', method: 'PUT', path: 'api/studyPlans/1' },
    { name: 'Delete Plan', method: 'DELETE', path: 'api/studyPlans/1' },
  ],
  Analytics: [
    { name: 'Get User Analytics', method: 'GET', path: 'api/analytics/user' },
    {
      name: 'Get Error Analytics',
      method: 'GET',
      path: 'api/analytics/errors',
    },
    { name: 'Get Study Analytics', method: 'GET', path: 'api/analytics/study' },
    { name: 'Get Duel Analytics', method: 'GET', path: 'api/analytics/duels' },
  ],
  Admin: [
    { name: 'List All Users', method: 'GET', path: 'api/admin/users' },
    { name: 'Get User Details', method: 'GET', path: 'api/admin/users/1' },
    { name: 'Update User Role', method: 'PUT', path: 'api/admin/users/1/role' },
    { name: 'System Health', method: 'GET', path: 'api/admin/health' },
    { name: 'Usage Stats', method: 'GET', path: 'api/admin/stats' },
  ],
};

export default API_ENDPOINTS;
