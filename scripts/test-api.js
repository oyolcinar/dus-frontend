// Node.js script for running API tests from the command line
const fetch = require('node-fetch');
const fs = require('fs');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:5000';
const TOKEN = process.env.API_TOKEN; // Set this in your environment or use a .env file

// Import endpoints or define them here
const endpoints = [
  { name: 'Get User Profile', method: 'GET', path: '/api/users/profile' },
  { name: 'List Courses', method: 'GET', path: '/api/courses' },
  { name: 'Get Study Progress', method: 'GET', path: '/api/study/progress' },
  // Add more endpoints as needed - you can copy from your apiEndpoints.ts file
];

/**
 * Test a single endpoint
 */
async function testEndpoint(endpoint) {
  try {
    console.log(`Testing ${endpoint.method} ${endpoint.path}...`);
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (TOKEN) {
      headers['Authorization'] = `Bearer ${TOKEN}`;
    }
    
    const options = {
      method: endpoint.method,
      headers,
    };
    
    // Add request body for non-GET requests
    if (endpoint.method !== 'GET' && endpoint.method !== 'DELETE') {
      options.body = JSON.stringify({}); // Empty object as default payload
    }
    
    const startTime = Date.now();
    const response = await fetch(`${API_URL}${endpoint.path}`, options);
    const duration = Date.now() - startTime;
    
    // Get response data to analyze structure
    let responseData;
    try {
      responseData = await response.json();
    } catch (error) {
      responseData = await response.text();
    }
    
    return {
      name: endpoint.name,
      path: endpoint.path,
      method: endpoint.method,
      status: response.status,
      success: response.ok,
      duration,
      dataKeys: typeof responseData === 'object' ? Object.keys(responseData) : null,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      name: endpoint.name,
      path: endpoint.path,
      method: endpoint.method,
      status: 'ERROR',
      success: false,
      error: error.message,
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
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    if (result.success) {
      successful++;
      console.log(`✅ ${result.method} ${result.path} - ${result.status} OK (${result.duration}ms)`);
    } else {
      failed++;
      console.log(`❌ ${result.method} ${result.path} - ${result.status} Failed: ${result.error || 'Unknown error'}`);
    }
  }
  
  console.log('----------------------------------');
  console.log(`Testing complete. ${successful}/${endpoints.length} successful (${failed} failed)`);
  
  // Save results to file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `api-test-results-${timestamp}.json`;
  
  const testReport = {
    timestamp: new Date().toISOString(),
    apiUrl: API_URL,
    total: endpoints.length,
    successful,
    failed,
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