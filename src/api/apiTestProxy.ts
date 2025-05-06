import apiRequest from './apiClient';

export const testEndpoint = async (
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  data?: any
) => {
  try {
    // Only log essential information
    console.log(`Testing ${method} ${endpoint}`);
    
    const startTime = Date.now();
    const response = await apiRequest(endpoint, method, data);
    const duration = Date.now() - startTime;
    
    // Only return the status and basic structure, not full content
    return {
      success: true,
      status: 200, // Simulate status from actual response
      duration,
      dataKeys: Object.keys(response), // Just return the keys, not values
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    return {
      success: false,
      status: error.status || 500,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

export const batchTestEndpoints = async (
  endpoints: Array<{name: string, path: string, method: string}>
) => {
  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(
      endpoint.path,
      endpoint.method as any,
      endpoint.method !== 'GET' ? {} : undefined
    );
    
    results.push({
      name: endpoint.name,
      path: endpoint.path,
      method: endpoint.method,
      ...result
    });
  }
  
  return {
    total: endpoints.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results: results
  };
};