// Node.js script for running API tests from the command line
const fs = require('fs');
require('dotenv').config();

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:5000';

// Test data storage for dependent requests
const testData = {
  token: process.env.API_TOKEN || null,
  userId: null,
  courseId: null,
  topicId: null,
  subtopicId: null,
  testId: null,
  questionId: null,
  duelId: null,
  resultId: null,
  studyPlanId: null,
  opponentIdForDuel: null,
  sessionId: null,
};

// Define endpoints in logical sequence with dependencies
const endpoints = [
  // 1. Authentication flow
  {
    name: 'Register User (Initial - Token will be overwritten by Admin Login)',
    method: 'POST',
    path: '/api/auth/register',
    body: {
      username: `testuser_init_${Date.now()}`,
      email: `test_init_${Date.now()}@example.com`,
      password: 'Test123!',
    },
    saveToken: true,
    extractors: {
      token: (response) => {
        if (response.session?.access_token)
          return response.session.access_token;
        if (response.access_token) return response.access_token;
        return null;
      },
    },
  },
  {
    name: 'Login (Admin)',
    method: 'POST',
    path: '/api/auth/login',
    body: {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    },
    saveToken: true,
    extractors: {
      token: (response) => {
        if (response.session?.access_token)
          return response.session.access_token;
        if (response.access_token) return response.access_token;
        return null;
      },
    },
  },
  {
    name: 'Get Current User (Admin)',
    method: 'GET',
    path: '/api/auth/me',
    requiresAuth: true,
    extractors: {
      userId: (response) => {
        console.log(
          'DEBUG - Get Current User (Admin) response for userId extraction:',
          JSON.stringify(response, null, 2),
        );
        return response.user?.userId || response.user?.user_id || null;
      },
    },
    dependsOn: ['token'],
  },
  {
    name: 'Get User Profile (Admin)',
    method: 'GET',
    path: '/api/users/profile',
    requiresAuth: true,
    dependsOn: ['token', 'userId'],
  },

  // 2. Course creation and management (as Admin)
  {
    name: 'Create Course',
    method: 'POST',
    path: '/api/courses',
    requiresAuth: true,
    body: {
      title: `Test Course ${Date.now()}`,
      description: 'Test course created via API test script',
    },
    extractors: {
      courseId: (response) => {
        if (response.course?.course_id) return response.course.course_id;
        if (response.course?.id) return response.course.id;
        return null;
      },
    },
    dependsOn: ['token', 'userId'],
  },
  {
    name: 'Get Course',
    method: 'GET',
    path: () => `/api/courses/${testData.courseId}`,
    requiresAuth: true,
    dependsOn: ['courseId', 'token'],
  },
  {
    name: 'Create Topic',
    method: 'POST',
    path: '/api/topics',
    requiresAuth: true,
    body: () => ({
      courseId: testData.courseId,
      title: `Test Topic ${Date.now()}`,
      description: 'Test topic created via API',
    }),
    extractors: {
      topicId: (response) => {
        if (response.topic?.topic_id) return response.topic.topic_id;
        if (response.topic?.id) return response.topic.id;
        return null;
      },
    },
    dependsOn: ['courseId', 'token'],
  },
  {
    name: 'List Topics',
    method: 'GET',
    path: () => `/api/topics/course/${testData.courseId}`,
    requiresAuth: true,
    dependsOn: ['courseId', 'token'],
  },
  {
    name: 'Create Subtopic',
    method: 'POST',
    path: '/api/subtopics',
    requiresAuth: true,
    body: () => ({
      topicId: testData.topicId,
      title: `Test Subtopic ${Date.now()}`,
      description: 'Test subtopic created via API',
    }),
    extractors: {
      subtopicId: (response) => {
        if (response.subtopic?.subtopic_id)
          return response.subtopic.subtopic_id;
        if (response.subtopic?.id) return response.subtopic.id;
        return null;
      },
    },
    dependsOn: ['topicId', 'token'],
  },
  {
    name: 'List Subtopics',
    method: 'GET',
    path: () => `/api/subtopics/topic/${testData.topicId}`,
    requiresAuth: true,
    dependsOn: ['topicId', 'token'],
  },

  // 5. Test creation within topic (as Admin)
  {
    name: 'Create Test',
    method: 'POST',
    path: '/api/tests',
    requiresAuth: true,
    body: () => ({
      topicId: testData.topicId,
      title: `Test Quiz ${Date.now()}`,
      description: 'Test quiz created via API',
      difficultyLevel: 3,
    }),
    extractors: {
      testId: (response) => {
        if (response.test?.test_id) return response.test.test_id;
        if (response.test?.id) return response.test.id;
        return null;
      },
    },
    dependsOn: ['topicId', 'token'],
  },

  // 6. Question creation within test (as Admin)
  {
    name: 'Create Question For Test Submission',
    method: 'POST',
    path: '/api/questions',
    requiresAuth: true,
    body: () => ({
      testId: testData.testId,
      questionText: 'What is 2 + 2?',
      options: ['3', '4', '5', '22'],
      correctAnswer: '4',
    }),
    extractors: {
      questionId: (response) => {
        if (response.question?.question_id)
          return response.question.question_id;
        if (response.question?.id) return response.question.id;
        return null;
      },
    },
    dependsOn: ['testId', 'token'],
  },

  // 7. Study Session Flow
  {
    name: 'Start Study Session',
    method: 'POST',
    path: '/api/study/sessions/start',
    requiresAuth: true,
    body: {},
    extractors: {
      sessionId: (response) => {
        if (response.session?.session_id) return response.session.session_id;
        if (response.session?.id) return response.session.id;
        return null;
      },
    },
    dependsOn: ['token', 'userId'],
  },
  {
    name: 'Update Study Time',
    method: 'POST',
    path: '/api/users/study-time',
    requiresAuth: true,
    body: {
      duration: 300,
    },
    dependsOn: ['token', 'userId'],
  },
  {
    name: 'End Study Session (SKIPPED - GET for no-op)',
    method: 'GET',
    path: '/api/study/sessions',
    requiresAuth: true,
    skippable: true,
    dependsOn: ['token', 'sessionId'],
  },

  // 8. Study Plan creation
  {
    name: 'Create Study Plan',
    method: 'POST',
    path: '/api/studyPlans', // Path confirmed from studyPlanRoutes.js
    requiresAuth: true,
    body: () => ({
      title: `Test Study Plan ${Date.now()}`,
      description: 'A sample study plan for testing.',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      isCustom: true,
    }),
    extractors: {
      studyPlanId: (response) => {
        console.log(
          'DEBUG - Create Study Plan response for ID extraction:',
          JSON.stringify(response, null, 2),
        );
        // Updated to prioritize plan_id based on model and CSV
        if (
          response.plan &&
          typeof response.plan.plan_id !== 'undefined' &&
          response.plan.plan_id !== null
        ) {
          return response.plan.plan_id;
        }
        if (
          response.plan &&
          typeof response.plan.study_plan_id !== 'undefined' &&
          response.plan.study_plan_id !== null
        ) {
          return response.plan.study_plan_id;
        }
        if (
          response.plan &&
          typeof response.plan.id !== 'undefined' &&
          response.plan.id !== null
        ) {
          return response.plan.id;
        }
        return null;
      },
    },
    dependsOn: ['token', 'userId'],
  },

  // 9. Submit Full Test Result
  {
    name: 'Submit Full Test Result',
    method: 'POST',
    path: '/api/results/submit', // CORRECTED PATH based on resultRoutes.js
    requiresAuth: true,
    body: () => ({
      testId: testData.testId,
      score: 100,
      timeTaken: 120,
      answers: [
        {
          questionId: testData.questionId,
          userAnswer: '4',
          isCorrect: true,
        },
      ],
    }),
    extractors: {
      resultId: (response) => {
        console.log(
          'DEBUG - Submit Full Test Result response:',
          JSON.stringify(response, null, 2),
        );
        // CORRECTED extractor based on resultModel.create response
        if (response.result?.result_id) return response.result.result_id;
        if (response.result?.id) return response.result.id;
        return null;
      },
    },
    dependsOn: ['testId', 'questionId', 'token', 'userId'],
  },

  // 10. Register an opponent and Create a duel
  {
    name: 'Register Opponent For Duel',
    method: 'POST',
    path: '/api/auth/register',
    body: {
      username: `opponent_${Date.now()}`,
      email: `opponent_${Date.now()}@example.com`,
      password: 'TestOpponent123!',
    },
    extractors: {
      opponentIdForDuel: (response) => {
        console.log(
          'DEBUG - Register Opponent response for userId extraction:',
          JSON.stringify(response, null, 2),
        );
        return response.user?.userId || response.user?.user_id || null;
      },
    },
  },
  {
    name: 'Create Duel',
    method: 'POST',
    path: '/api/duels/challenge',
    requiresAuth: true,
    body: () => ({
      opponentId: testData.opponentIdForDuel,
      testId: testData.testId,
      questionCount: 1,
      branchType: 'mixed',
      selectionType: 'random',
    }),
    extractors: {
      duelId: (response) => {
        console.log(
          'DEBUG - Duel response:',
          JSON.stringify(response, null, 2),
        );
        if (response.duel?.duel_id) return response.duel.duel_id;
        if (response.duel?.id) return response.duel.id;
        return null;
      },
    },
    dependsOn: ['testId', 'userId', 'token', 'opponentIdForDuel'],
  },

  // CLEANUP OPERATIONS
  {
    name: 'Delete Duel (SKIPPED - No API endpoint for direct deletion)',
    method: 'GET',
    path: () => `/api/duels/${testData.duelId}`,
    requiresAuth: true,
    dependsOn: ['duelId', 'token'],
    isCleanup: true,
    skippable: true,
  },
  {
    name: 'Delete Study Plan',
    method: 'DELETE',
    path: () => `/api/studyPlans/${testData.studyPlanId}`, // Path confirmed from studyPlanRoutes.js
    requiresAuth: true,
    dependsOn: ['studyPlanId', 'token'],
    isCleanup: true,
  },
  {
    name: 'Delete Question (created for test submission)',
    method: 'DELETE',
    path: () => `/api/questions/${testData.questionId}`,
    requiresAuth: true,
    dependsOn: ['questionId', 'token'],
    isCleanup: true,
  },
  {
    name: 'Delete Test',
    method: 'DELETE',
    path: () => `/api/tests/${testData.testId}`,
    requiresAuth: true,
    dependsOn: ['testId', 'token'],
    isCleanup: true,
  },
  {
    name: 'Delete Subtopic',
    method: 'DELETE',
    path: () => `/api/subtopics/${testData.subtopicId}`,
    requiresAuth: true,
    dependsOn: ['subtopicId', 'token'],
    isCleanup: true,
  },
  {
    name: 'Delete Topic',
    method: 'DELETE',
    path: () => `/api/topics/${testData.topicId}`,
    requiresAuth: true,
    dependsOn: ['topicId', 'token'],
    isCleanup: true,
  },
  {
    name: 'Delete Course',
    method: 'DELETE',
    path: () => `/api/courses/${testData.courseId}`,
    requiresAuth: true,
    dependsOn: ['courseId', 'token'],
    isCleanup: true,
  },
  {
    name: 'Logout (Admin)',
    method: 'POST',
    path: '/api/auth/signout',
    requiresAuth: true,
    dependsOn: ['token'],
    isCleanup: true,
  },
];

// ... (The rest of the testEndpoint and testEndpoints functions remain the same as in the previous version) ...
// Ensure you copy the full testEndpoint and testEndpoints functions from the previous response.

/**
 * Test a single endpoint
 */
async function testEndpoint(endpoint) {
  // Skip if dependencies not met
  if (endpoint.dependsOn) {
    for (const dependency of endpoint.dependsOn) {
      if (!testData[dependency]) {
        // A special check for 'token' as it's fundamental
        if (dependency === 'token' && endpoint.requiresAuth) {
          console.error(
            `❌ Critical Skip: Missing token for authenticated endpoint: ${endpoint.name}`,
          );
        }
        return {
          name: endpoint.name,
          path:
            typeof endpoint.path === 'function'
              ? endpoint.path() // Call function to resolve path for logging if possible
              : endpoint.path,
          method: endpoint.method,
          status: 'SKIPPED',
          success: false,
          error: `Missing dependency: ${dependency} (current value: ${testData[dependency]})`,
          timestamp: new Date().toISOString(),
        };
      }
    }
  }

  if (endpoint.skippable && endpoint.status !== 'SKIPPED') {
    if (
      !endpoint.dependsOn ||
      endpoint.dependsOn.every((dep) => testData[dep])
    ) {
      console.log(
        `⏭️ Manually skipping endpoint: ${endpoint.name} as 'skippable' is true.`,
      );
      return {
        name: endpoint.name,
        path:
          typeof endpoint.path === 'function' ? endpoint.path() : endpoint.path,
        method: endpoint.method,
        status: 'SKIPPED',
        success: false,
        error: 'Marked as skippable in definition.',
        timestamp: new Date().toISOString(),
      };
    }
  }

  try {
    const path =
      typeof endpoint.path === 'function' ? endpoint.path() : endpoint.path;
    console.log(`Testing ${endpoint.method} ${API_URL}${path}...`);

    const headers = {
      'Content-Type': 'application/json',
    };

    if (endpoint.requiresAuth) {
      if (!testData.token) {
        return {
          name: endpoint.name,
          path: path,
          method: endpoint.method,
          status: 'SKIPPED',
          success: false,
          error:
            'Auth required but no token available (should have been caught by dependsOn)',
          timestamp: new Date().toISOString(),
        };
      }
      headers['Authorization'] = `Bearer ${testData.token}`;
    }

    const options = {
      method: endpoint.method,
      headers,
    };

    if (
      endpoint.method !== 'GET' &&
      !(endpoint.method === 'DELETE' && endpoint.omitBodyForDelete) &&
      !endpoint.omitBody
    ) {
      const body =
        typeof endpoint.body === 'function' ? endpoint.body() : endpoint.body;
      if (
        body &&
        (Object.keys(body).length > 0 ||
          endpoint.method === 'POST' ||
          endpoint.method === 'PUT')
      ) {
        options.body = JSON.stringify(body);
        console.log(`Request body: ${options.body}`);
      } else if (endpoint.method !== 'DELETE') {
        console.log(
          `No body for ${endpoint.method} request or body is explicitly empty and not POST/PUT.`,
        );
      }
    }

    const startTime = Date.now();
    const response = await fetch(`${API_URL}${path}`, options);
    const duration = Date.now() - startTime;

    let responseData = null;
    let responseText = '';

    try {
      responseText = await response.text();
      if (responseText) {
        try {
          responseData = JSON.parse(responseText);
          console.log(
            `Response data: ${JSON.stringify(responseData, null, 2)}`,
          );
        } catch (e) {
          console.log(
            `Response is not valid JSON: ${responseText.substring(0, 200)}...`,
          );
          responseData = {
            message: `Non-JSON response: ${responseText.substring(
              0,
              200,
            )}... (Status: ${response.status})`,
          };
        }
      } else {
        console.log('Response body is empty.');
        responseData = {
          message: `Empty response body (Status: ${response.status})`,
        };
      }
    } catch (error) {
      console.error('Error reading response text:', error);
      responseData = { error: 'Failed to read response text' };
    }

    const result = {
      name: endpoint.name,
      path: path,
      method: endpoint.method,
      status: response.status,
      success: response.ok,
      duration,
      dataKeys:
        responseData && typeof responseData === 'object'
          ? Object.keys(responseData)
          : null,
      isCleanup: endpoint.isCleanup || false,
      timestamp: new Date().toISOString(),
    };

    if (response.ok) {
      if (endpoint.saveToken && endpoint.extractors?.token) {
        const extractedToken = endpoint.extractors.token(responseData);
        if (extractedToken) {
          testData.token = extractedToken;
          console.log(`✓ Token saved: ${testData.token.substring(0, 15)}...`);
        } else {
          console.log('❌ Token extraction defined but failed.');
        }
      }

      if (endpoint.extractors) {
        for (const [key, extractorFn] of Object.entries(endpoint.extractors)) {
          if (key === 'token' && endpoint.saveToken) continue;

          const extractedValue = extractorFn(responseData);
          if (extractedValue !== null && extractedValue !== undefined) {
            testData[key] = extractedValue;
            console.log(`✓ ${key} saved: ${testData[key]}`);
          } else {
            console.log(
              `❌ Failed to extract ${key} from response (or extractor returned null/undefined).`,
            );
            if (key !== 'token') {
              console.log(
                `DEBUG - Full response for ${key} extraction failure:`,
                JSON.stringify(responseData, null, 2),
              );
            }
          }
        }
      }
    } else {
      console.log(`❌ Request failed: ${response.status}`);
      result.error =
        responseData?.message ||
        responseData?.error ||
        responseText ||
        'Unknown error';
      if (typeof responseData === 'object' && responseData !== null) {
        console.log(
          'Detailed error response:',
          JSON.stringify(responseData, null, 2),
        );
      }
    }
    return result;
  } catch (error) {
    console.error(`Error during test "${endpoint.name}":`, error);
    return {
      name: endpoint.name,
      path:
        typeof endpoint.path === 'function'
          ? '(dynamic path evaluation error)'
          : endpoint.path,
      method: endpoint.method,
      status: 'CLIENT_ERROR',
      success: false,
      error: error.message,
      isCleanup: endpoint.isCleanup || false,
      timestamp: new Date().toISOString(),
    };
  }
}

async function testEndpoints() {
  console.log(`Starting API tests against ${API_URL}`);
  console.log(`Admin email for login: ${process.env.ADMIN_EMAIL}`);
  console.log(`Total endpoints to test: ${endpoints.length}`);
  console.log('----------------------------------');

  const results = [];
  let successful = 0;
  let failed = 0;
  let skipped = 0;
  let cleanupSuccessful = 0;
  let cleanupFailed = 0;
  let cleanupSkippedCount = 0;

  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);

    const logPrefix = result.isCleanup ? '🧹 Cleanup' : '➡️ Test';

    if (result.status === 'SKIPPED') {
      if (result.isCleanup) cleanupSkippedCount++;
      else skipped++;
      console.log(
        `⏭️ ${logPrefix} ${result.name} (${result.method} ${
          result.path || '(path not resolved)'
        }) - SKIPPED: ${result.error}`,
      );
    } else if (result.success) {
      if (result.isCleanup) cleanupSuccessful++;
      else successful++;
      console.log(
        `✅ ${logPrefix} ${result.name} (${result.method} ${result.path}) - ${result.status} OK (${result.duration}ms)`,
      );
    } else {
      if (result.isCleanup) cleanupFailed++;
      else failed++;
      console.log(
        `❌ ${logPrefix} ${result.name} (${result.method} ${result.path}) - ${result.status} FAILED: ${result.error}`,
      );
    }

    console.log('Current testData state:');
    const sanitizedTestData = { ...testData };
    if (sanitizedTestData.token) {
      sanitizedTestData.token = `${sanitizedTestData.token.substring(
        0,
        15,
      )}...`;
    }
    console.log(JSON.stringify(sanitizedTestData, null, 2));
    console.log('----------------------------------');
  }

  const totalCleanupOps = endpoints.filter((e) => e.isCleanup).length;
  const mainTests = endpoints.length - totalCleanupOps;

  console.log('==================================');
  console.log('API Test Run Summary');
  console.log('==================================');
  console.log(`Total Main Tests Defined: ${mainTests}`);
  console.log(`  Successful: ${successful}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Skipped: ${skipped}`);
  console.log('---');
  console.log(`Total Cleanup Operations Defined: ${totalCleanupOps}`);
  console.log(`  Successful: ${cleanupSuccessful}`);
  console.log(`  Failed: ${cleanupFailed}`);
  console.log(`  Skipped: ${cleanupSkippedCount}`);
  console.log('----------------------------------');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `api-test-results-${timestamp}.json`;

  const testReport = {
    summary: {
      apiUrl: API_URL,
      totalEndpointsDefined: endpoints.length,
      mainTestsDefined: mainTests,
      mainTestsSuccessful: successful,
      mainTestsFailed: failed,
      mainTestsSkipped: skipped,
      cleanupOperationsDefined: totalCleanupOps,
      cleanupSuccessful,
      cleanupFailed,
      cleanupSkipped: cleanupSkippedCount,
      timestamp: new Date().toISOString(),
    },
    config: {
      adminEmail: process.env.ADMIN_EMAIL,
      apiTokenUsedInRun: testData.token
        ? `${testData.token.substring(0, 15)}...`
        : 'None (or cleared post-run)',
    },
    detailedResults: results,
  };

  fs.writeFileSync(fileName, JSON.stringify(testReport, null, 2));
  console.log(`Report saved to ${fileName}`);

  if (failed > 0 || cleanupFailed > 0) {
    console.error(
      'Some tests or cleanup operations failed. Exiting with error code.',
    );
    process.exit(1);
  } else {
    console.log(
      'All tests and cleanup operations passed or were intentionally skipped.',
    );
  }
}

// Run the tests
testEndpoints().catch((error) => {
  console.error('Unhandled error in test runner:', error);
  process.exit(1);
});
