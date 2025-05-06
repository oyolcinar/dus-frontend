// API Endpoints definition
const API_ENDPOINTS = {
  Authentication: [
    { name: 'Register', method: 'POST', path: '/api/auth/register' },
    { name: 'Login', method: 'POST', path: '/api/auth/login' },
    { name: 'Sign Out', method: 'POST', path: '/api/auth/signout' },
    { name: 'Get Permissions', method: 'GET', path: '/api/auth/permissions' },
    { name: 'Reset Password', method: 'POST', path: '/api/auth/reset-password' },
    { name: 'Update Password', method: 'POST', path: '/api/auth/update-password' },
    { name: 'Refresh Token', method: 'POST', path: '/api/auth/refresh-token' },
    { name: 'Get Current User', method: 'GET', path: '/api/auth/me' },
  ],
  'User Management': [
    { name: 'Get Profile', method: 'GET', path: '/api/users/profile' },
    { name: 'Search Users', method: 'GET', path: '/api/users/search?query=test' },
    { name: 'Get Duel Stats', method: 'GET', path: '/api/users/duel-stats' },
    { name: 'Update Study Time', method: 'POST', path: '/api/users/study-time' },
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
  // You can add more categories as needed
};

export default API_ENDPOINTS;