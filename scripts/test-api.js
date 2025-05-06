// Node.js script for running API tests from the command line
const fetch = require('node-fetch');
const fs = require('fs');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:5000';
const TOKEN = process.env.API_TOKEN; // Set this in your environment or use a .env file

// Test data storage for dependent requests
const testData = {
  token: null,
  userId: null,
  courseId: null,
  topicId: null,
  subtopicId: null,
  testId: null,
  questionId: null,
  duelId: null,
  resultId: null,
  studyPlanId: null,
  friendId: null
};

// Define endpoints in logical sequence with dependencies
const endpoints = [
  // 1. Authentication flow
  { 
    name: 'Register User', 
    method: 'POST', 
    path: '/api/auth/register',
    body: {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'Test123!'
    },
    saveToken: true
  },
  { 
    name: 'Login', 
    method: 'POST', 
    path: '/api/auth/login',
    body: {
      email: `test_${Date.now()}@example.com`,
      password: 'Test123!'
    },
    saveToken: true
  },
  { 
    name: 'Get Current User', 
    method: 'GET', 
    path: '/api/auth/me',
    requiresAuth: true,
    saveUserId: true
  },
  { 
    name: 'Get User Profile', 
    method: 'GET', 
    path: '/api/users/profile',
    requiresAuth: true
  },
  
  // 2. Course creation and management
  {
    name: 'Create Course',
    method: 'POST',
    path: '/api/courses',
    requiresAuth: true,
    body: {
      title: `Test Course ${Date.now()}`,
      description: 'Test course created via API test script'
    },
    saveCourseId: true
  },
  {
    name: 'Get Course',
    method: 'GET',
    path: endpoint => `/api/courses/${testData.courseId}`,
    requiresAuth: true,
    dependsOn: ['courseId']
  },
  
  // 3. Topic creation within course
  {
    name: 'Create Topic',
    method: 'POST',
    path: '/api/topics',
    requiresAuth: true,
    body: endpoint => ({
      courseId: testData.courseId,
      name: `Test Topic ${Date.now()}`,
      description: 'Test topic created via API'
    }),
    saveTopicId: true,
    dependsOn: ['courseId']
  },
  {
    name: 'List Topics',
    method: 'GET',
    path: endpoint => `/api/topics?courseId=${testData.courseId}`,
    requiresAuth: true,
    dependsOn: ['courseId']
  },
  
  // 4. Subtopic creation within topic
  {
    name: 'Create Subtopic',
    method: 'POST',
    path: '/api/subtopics',
    requiresAuth: true,
    body: endpoint => ({
      topicId: testData.topicId,
      name: `Test Subtopic ${Date.now()}`,
      description: 'Test subtopic created via API'
    }),
    saveSubtopicId: true,
    dependsOn: ['topicId']
  },
  {
    name: 'List Subtopics',
    method: 'GET',
    path: endpoint => `/api/subtopics?topicId=${testData.topicId}`,
    requiresAuth: true,
    dependsOn: ['topicId']
  },
  
  // 5. Test creation within topic
  {
    name: 'Create Test',
    method: 'POST',
    path: '/api/tests',
    requiresAuth: true,
    body: endpoint => ({
      topicId: testData.topicId,
      title: `Test Quiz ${Date.now()}`,
      description: 'Test quiz created via API',
      difficulty: 'medium'
    }),
    saveTestId: true,
    dependsOn: ['topicId']
  },
  
  // 6. Question creation within test
  {
    name: 'Create Question',
    method: 'POST',
    path: '/api/questions',
    requiresAuth: true,
    body: endpoint => ({
      testId: testData.testId,
      text: 'What is the capital of France?',
      options: [
        { text: 'Paris', isCorrect: true },
        { text: 'London', isCorrect: false },
        { text: 'Berlin', isCorrect: false },
        { text: 'Madrid', isCorrect: false }
      ],
      explanation: 'Paris is the capital of France'
    }),
    saveQuestionId: true,
    dependsOn: ['testId']
  },
  
  // 7. Study tracking
  {
    name: 'Start Study Session',
    method: 'POST',
    path: '/api/study/session/start',
    requiresAuth: true,
    body: endpoint => ({
      topicId: testData.topicId
    }),
    dependsOn: ['topicId']
  },
  {
    name: 'Update Study Time',
    method: 'POST',
    path: '/api/users/study-time',
    requiresAuth: true,
    body: {
      duration: 300 // 5 minutes in seconds
    }
  },
  {
    name: 'End Study Session',
    method: 'POST',
    path: '/api/study/session/end',
    requiresAuth: true
  },
  
  // 8. Study Plan creation
  {
    name: 'Create Study Plan',
    method: 'POST',
    path: '/api/studyPlans',
    requiresAuth: true,
    body: {
      name: `Test Study Plan ${Date.now()}`,
      goals: ['Prepare for exam', 'Master key concepts'],
      duration: 30 // days
    },
    saveStudyPlanId: true
  },
  
  // 9. Run a complete test (answer questions)
  {
    name: 'Submit Answer',
    method: 'POST',
    path: '/api/answers',
    requiresAuth: true,
    body: endpoint => ({
      questionId: testData.questionId,
      selectedOptions: [0], // Index of the correct option
      timeSpent: 15 // seconds
    }),
    dependsOn: ['questionId']
  },
  
  // 10. Create a duel
  {
    name: 'Create Duel',
    method: 'POST',
    path: '/api/duels',
    requiresAuth: true,
    body: endpoint => ({
      opponentId: 2, // Assuming user ID 2 exists in the system
      topicId: testData.topicId
    }),
    saveDuelId: true,
    dependsOn: ['topicId']
  },
  
  // CLEANUP OPERATIONS - DELETE TEST DATA
  
  // 11. Delete created resources in reverse order
  {
    name: 'Delete Duel',
    method: 'DELETE',
    path: endpoint => `/api/duels/${testData.duelId}`,
    requiresAuth: true,
    dependsOn: ['duelId'],
    isCleanup: true
  },
  {
    name: 'Delete Study Plan',
    method: 'DELETE',
    path: endpoint => `/api/studyPlans/${testData.studyPlanId}`,
    requiresAuth: true,
    dependsOn: ['studyPlanId'],
    isCleanup: true
  },
  {
    name: 'Delete Question',
    method: 'DELETE',
    path: endpoint => `/api/questions/${testData.questionId}`,
    requiresAuth: true,
    dependsOn: ['questionId'],
    isCleanup: true
  },
  {
    name: 'Delete Test',
    method: 'DELETE',
    path: endpoint => `/api/tests/${testData.testId}`,
    requiresAuth: true,
    dependsOn: ['testId'],
    isCleanup: true
  },
  {
    name: 'Delete Subtopic',
    method: 'DELETE',
    path: endpoint => `/api/subtopics/${testData.subtopicId}`,
    requiresAuth: true,
    dependsOn: ['subtopicId'],
    isCleanup: true
  },
  {
    name: 'Delete Topic',
    method: 'DELETE',
    path: endpoint => `/api/topics/${testData.topicId}`,
    requiresAuth: true,
    dependsOn: ['topicId'],
    isCleanup: true
  },
  {
    name: 'Delete Course',
    method: 'DELETE',
    path: endpoint => `/api/courses/${testData.courseId}`,
    requiresAuth: true,
    dependsOn: ['courseId'],
    isCleanup: true
  },
  {
    name: 'Logout',
    method: 'POST',
    path: '/api/auth/signout',
    requiresAuth: true,
    isCleanup: true
  }
];

/**
 * Test a single endpoint
 */
async function testEndpoint(endpoint) {
  // Skip if dependencies not met
  if (endpoint.dependsOn) {
    for (const dependency of endpoint.dependsOn) {
      if (!testData[dependency]) {
        return {
          name: endpoint.name,
          path: typeof endpoint.path === 'function' ? '(dynamic path)' : endpoint.path,
          method: endpoint.method,
          status: 'SKIPPED',
          success: false,
          error: `Missing dependency: ${dependency}`,
          timestamp: new Date().toISOString()
        };
      }
    }
  }

  try {
    // Resolve dynamic path if it's a function
    const path = typeof endpoint.path === 'function' ? endpoint.path(endpoint) : endpoint.path;
    console.log(`Testing ${endpoint.method} ${path}...`);
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Add auth token if required
    if (endpoint.requiresAuth) {
      if (testData.token) {
        headers['Authorization'] = `Bearer ${testData.token}`;
      } else if (TOKEN) {
        headers['Authorization'] = `Bearer ${TOKEN}`;
      } else {
        return {
          name: endpoint.name,
          path: path,
          method: endpoint.method,
          status: 'SKIPPED',
          success: false,
          error: 'Auth required but no token available',
          timestamp: new Date().toISOString()
        };
      }
    }
    
    const options = {
      method: endpoint.method,
      headers,
    };
    
    // Add request body for non-GET requests
    if (endpoint.method !== 'GET' && endpoint.method !== 'DELETE' && endpoint.body) {
      const body = typeof endpoint.body === 'function' ? endpoint.body(endpoint) : endpoint.body;
      options.body = JSON.stringify(body);
    }
    
    const startTime = Date.now();
    const response = await fetch(`${API_URL}${path}`, options);
    const duration = Date.now() - startTime;
    
    // Get response data to analyze structure
    let responseData;
    try {
      responseData = await response.json();
    } catch (error) {
      responseData = await response.text();
    }
    
    // Save specific response data for future requests
    if (response.ok) {
      if (endpoint.saveToken && responseData.token) {
        testData.token = responseData.token;
        console.log('✓ Token saved for future requests');
      }
      
      if (endpoint.saveUserId && responseData.id) {
        testData.userId = responseData.id;
        console.log(`✓ User ID saved: ${testData.userId}`);
      }
      
      if (endpoint.saveCourseId && responseData.id) {
        testData.courseId = responseData.id;
        console.log(`✓ Course ID saved: ${testData.courseId}`);
      }
      
      if (endpoint.saveTopicId && responseData.id) {
        testData.topicId = responseData.id;
        console.log(`✓ Topic ID saved: ${testData.topicId}`);
      }
      
      if (endpoint.saveSubtopicId && responseData.id) {
        testData.subtopicId = responseData.id;
        console.log(`✓ Subtopic ID saved: ${testData.subtopicId}`);
      }
      
      if (endpoint.saveTestId && responseData.id) {
        testData.testId = responseData.id;
        console.log(`✓ Test ID saved: ${testData.testId}`);
      }
      
      if (endpoint.saveQuestionId && responseData.id) {
        testData.questionId = responseData.id;
        console.log(`✓ Question ID saved: ${testData.questionId}`);
      }
      
      if (endpoint.saveDuelId && responseData.id) {
        testData.duelId = responseData.id;
        console.log(`✓ Duel ID saved: ${testData.duelId}`);
      }
      
      if (endpoint.saveStudyPlanId && responseData.id) {
        testData.studyPlanId = responseData.id;
        console.log(`✓ Study Plan ID saved: ${testData.studyPlanId}`);
      }
    }
    
    return {
      name: endpoint.name,
      path: path,
      method: endpoint.method,
      status: response.status,
      success: response.ok,
      duration,
      dataKeys: typeof responseData === 'object' ? Object.keys(responseData) : null,
      isCleanup: endpoint.isCleanup || false,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      name: endpoint.name,
      path: typeof endpoint.path === 'function' ? '(dynamic path)' : endpoint.path,
      method: endpoint.method,
      status: 'ERROR',
      success: false,
      error: error.message,
      isCleanup: endpoint.isCleanup || false,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Test all endpoints and save results
 */
async function testEndpoints() {
  console.log(`Starting API tests against ${API_URL}`);
  console.log(`Total endpoints to test: ${endpoints.length}`);
  console.log('----------------------------------');
  
  const results = [];
  let successful = 0;
  let failed = 0;
  let skipped = 0;
  let cleanupSuccessful = 0;
  let cleanupFailed = 0;
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    if (result.isCleanup) {
      if (result.success) {
        cleanupSuccessful++;
        console.log(`🧹 ${result.method} ${result.path} - ${result.status} Cleanup OK (${result.duration}ms)`);
      } else if (result.status === 'SKIPPED') {
        skipped++;
        console.log(`⏭️ ${result.method} ${result.path} - Skipped: ${result.error}`);
      } else {
        cleanupFailed++;
        console.log(`❌ ${result.method} ${result.path} - ${result.status} Cleanup Failed: ${result.error || 'Unknown error'}`);
      }
    } else {
      if (result.success) {
        successful++;
        console.log(`✅ ${result.method} ${result.path} - ${result.status} OK (${result.duration}ms)`);
      } else if (result.status === 'SKIPPED') {
        skipped++;
        console.log(`⏭️ ${result.method} ${result.path} - Skipped: ${result.error}`);
      } else {
        failed++;
        console.log(`❌ ${result.method} ${result.path} - ${result.status} Failed: ${result.error || 'Unknown error'}`);
      }
    }
  }
  
  console.log('----------------------------------');
  console.log(`Testing complete. ${successful}/${endpoints.length - skipped} successful (${failed} failed)`);
  console.log(`Cleanup: ${cleanupSuccessful}/${cleanupFailed + cleanupSuccessful} successful`);
  
  // Save results to file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `api-test-results-${timestamp}.json`;
  
  const testReport = {
    timestamp: new Date().toISOString(),
    apiUrl: API_URL,
    total: endpoints.length,
    successful,
    failed,
    skipped,
    cleanupSuccessful,
    cleanupFailed,
    results
  };
  
  fs.writeFileSync(fileName, JSON.stringify(testReport, null, 2));
  console.log(`Report saved to ${fileName}`);
}

// Run the tests
testEndpoints().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});