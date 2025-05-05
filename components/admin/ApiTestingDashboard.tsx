import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronUp,
  X,
  Play,
  Save,
  Clock,
  Trash2,
  Copy,
  Plus,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';

// Main component
export default function ApiTestingDashboard() {
  const [token, setToken] = useState(localStorage.getItem('authToken') || '');
  const [endpoints, setEndpoints] = useState(API_ENDPOINTS);
  const [expanded, setExpanded] = useState({});
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [requestMethod, setRequestMethod] = useState('GET');
  const [requestUrl, setRequestUrl] = useState('');
  const [requestBody, setRequestBody] = useState('{\n  \n}');
  const [requestHeaders, setRequestHeaders] = useState(
    '{\n  "Content-Type": "application/json"\n}',
  );
  const [responseData, setResponseData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState(
    JSON.parse(localStorage.getItem('requestHistory') || '[]'),
  );
  const [activeTab, setActiveTab] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [baseUrl, setBaseUrl] = useState(
    localStorage.getItem('baseUrl') || 'http://localhost:5000',
  );

  useEffect(() => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('baseUrl', baseUrl);
    setIsAuthenticated(!!token);
  }, [token, baseUrl]);

  useEffect(() => {
    localStorage.setItem('requestHistory', JSON.stringify(history));
  }, [history]);

  const toggleCategory = (category) => {
    setExpanded({ ...expanded, [category]: !expanded[category] });
  };

  const selectEndpoint = (endpoint) => {
    setSelectedEndpoint(endpoint);
    setRequestMethod(endpoint.method);
    setRequestUrl(endpoint.path);
    setRequestBody(endpoint.method === 'GET' ? '' : '{\n  \n}');
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      setToken(data.session.access_token);
      setResponseData(data);
      console.log('Login successful:', data);
    } catch (err) {
      setError(err.message);
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: registerUsername,
          email: registerEmail,
          password: registerPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setResponseData(data);
      console.log('Registration successful:', data);

      // Auto-login after successful registration
      if (data.session && data.session.access_token) {
        setToken(data.session.access_token);
      }
    } catch (err) {
      setError(err.message);
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${baseUrl}/api/auth/signout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      setToken('');
      setResponseData(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleSendRequest = async () => {
    setIsLoading(true);
    setError(null);
    setResponseData(null);

    try {
      let headers = {};
      try {
        headers = JSON.parse(requestHeaders);
      } catch (e) {
        throw new Error('Invalid headers JSON format');
      }

      // Add authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const fetchOptions = {
        method: requestMethod,
        headers: headers,
      };

      // Add body for non-GET requests
      if (requestMethod !== 'GET' && requestBody.trim()) {
        try {
          fetchOptions.body = requestBody;
        } catch (e) {
          throw new Error('Invalid body JSON format');
        }
      }

      const fullUrl = `${baseUrl}${
        requestUrl.startsWith('/') ? requestUrl : `/${requestUrl}`
      }`;
      const response = await fetch(fullUrl, fetchOptions);

      let responseBody;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseBody = await response.json();
      } else {
        responseBody = await response.text();
      }

      const responseInfo = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries([...response.headers.entries()]),
        body: responseBody,
      };

      setResponseData(responseInfo);

      // Add to history
      const historyItem = {
        id: Date.now(),
        method: requestMethod,
        url: fullUrl,
        headers: headers,
        body: requestMethod !== 'GET' ? requestBody : null,
        response: responseInfo,
        timestamp: new Date().toISOString(),
      };

      setHistory([historyItem, ...history.slice(0, 19)]);
    } catch (err) {
      setError(err.message);
      console.error('Request error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromHistory = (item) => {
    setRequestMethod(item.method);
    setRequestUrl(item.url.replace(baseUrl, ''));
    setRequestHeaders(JSON.stringify(item.headers, null, 2));
    if (item.body) {
      setRequestBody(item.body);
    }
    setResponseData(item.response);
  };

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear the request history?')) {
      setHistory([]);
      localStorage.removeItem('requestHistory');
    }
  };

  const formatJson = (jsonStr) => {
    try {
      if (typeof jsonStr === 'string') {
        return JSON.stringify(JSON.parse(jsonStr), null, 2);
      } else {
        return JSON.stringify(jsonStr, null, 2);
      }
    } catch (e) {
      return jsonStr;
    }
  };

  return (
    <div className='flex flex-col h-screen bg-gray-100'>
      {/* Header */}
      <div className='bg-indigo-600 text-white p-4'>
        <div className='flex justify-between items-center'>
          <h1 className='text-2xl font-bold'>DUS API Testing Dashboard</h1>
          <div className='flex items-center space-x-4'>
            <input
              type='text'
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder='Base URL'
              className='px-2 py-1 rounded text-black text-sm w-64'
            />
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className='bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded'
              >
                Logout
              </button>
            ) : (
              <span className='text-yellow-200'>Not authenticated</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='flex flex-1 overflow-hidden'>
        {/* Sidebar */}
        <div className='w-72 bg-gray-800 text-white flex flex-col'>
          {/* Auth Section */}
          {!isAuthenticated && (
            <div className='p-4 border-b border-gray-700'>
              <Tabs
                selectedIndex={activeTab}
                onSelect={(index) => setActiveTab(index)}
                className='auth-tabs'
              >
                <TabList className='flex mb-4 border-b border-gray-700'>
                  <Tab
                    className={`px-4 py-2 cursor-pointer ${
                      activeTab === 0 ? 'border-b-2 border-blue-400' : ''
                    }`}
                    selectedClassName='text-blue-400 font-medium'
                  >
                    Login
                  </Tab>
                  <Tab
                    className={`px-4 py-2 cursor-pointer ${
                      activeTab === 1 ? 'border-b-2 border-blue-400' : ''
                    }`}
                    selectedClassName='text-blue-400 font-medium'
                  >
                    Register
                  </Tab>
                </TabList>

                <TabPanel>
                  <div className='space-y-3'>
                    <input
                      type='email'
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder='Email'
                      className='w-full p-2 rounded text-black'
                    />
                    <input
                      type='password'
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder='Password'
                      className='w-full p-2 rounded text-black'
                    />
                    <button
                      onClick={handleLogin}
                      disabled={isLoading}
                      className='w-full bg-blue-500 hover:bg-blue-600 text-white p-2 rounded'
                    >
                      {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                  </div>
                </TabPanel>

                <TabPanel>
                  <div className='space-y-3'>
                    <input
                      type='text'
                      value={registerUsername}
                      onChange={(e) => setRegisterUsername(e.target.value)}
                      placeholder='Username'
                      className='w-full p-2 rounded text-black'
                    />
                    <input
                      type='email'
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      placeholder='Email'
                      className='w-full p-2 rounded text-black'
                    />
                    <input
                      type='password'
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      placeholder='Password'
                      className='w-full p-2 rounded text-black'
                    />
                    <button
                      onClick={handleRegister}
                      disabled={isLoading}
                      className='w-full bg-green-500 hover:bg-green-600 text-white p-2 rounded'
                    >
                      {isLoading ? 'Registering...' : 'Register'}
                    </button>
                  </div>
                </TabPanel>
              </Tabs>

              {error && (
                <div className='mt-4 p-2 bg-red-600 text-white rounded'>
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Endpoints List */}
          <div className='flex-1 overflow-y-auto'>
            {Object.entries(endpoints).map(([category, items]) => (
              <div key={category}>
                <div
                  className='flex items-center justify-between p-3 bg-gray-700 cursor-pointer hover:bg-gray-600'
                  onClick={() => toggleCategory(category)}
                >
                  <span className='font-medium'>{category}</span>
                  {expanded[category] ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </div>

                {expanded[category] && (
                  <div className='bg-gray-900'>
                    {items.map((endpoint, index) => (
                      <div
                        key={index}
                        className={`p-2 pl-4 border-l-4 cursor-pointer hover:bg-gray-800 ${
                          selectedEndpoint === endpoint
                            ? 'border-blue-500 bg-gray-800'
                            : 'border-transparent'
                        }`}
                        onClick={() => selectEndpoint(endpoint)}
                      >
                        <div className='flex items-center'>
                          <span
                            className={`w-16 font-mono text-xs px-2 py-1 rounded ${
                              endpoint.method === 'GET'
                                ? 'bg-green-600'
                                : endpoint.method === 'POST'
                                ? 'bg-blue-600'
                                : endpoint.method === 'PUT'
                                ? 'bg-yellow-600'
                                : endpoint.method === 'DELETE'
                                ? 'bg-red-600'
                                : 'bg-gray-600'
                            }`}
                          >
                            {endpoint.method}
                          </span>
                          <span className='ml-2 text-sm truncate'>
                            {endpoint.name}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Panel */}
        <div className='flex-1 flex flex-col overflow-hidden'>
          {/* Request Panel */}
          <div className='flex-1 p-4 overflow-y-auto'>
            <Tabs selectedIndex={0} className='h-full flex flex-col'>
              <TabList className='flex mb-4 border-b border-gray-300'>
                <Tab
                  className='px-4 py-2 mr-2 cursor-pointer hover:text-blue-600'
                  selectedClassName='border-b-2 border-blue-500 text-blue-600'
                >
                  Request Builder
                </Tab>
                <Tab
                  className='px-4 py-2 mr-2 cursor-pointer hover:text-blue-600'
                  selectedClassName='border-b-2 border-blue-500 text-blue-600'
                >
                  Request History
                </Tab>
              </TabList>

              <TabPanel className='flex-1 overflow-y-auto'>
                <div className='space-y-4'>
                  {/* Method & URL */}
                  <div className='flex items-center space-x-2'>
                    <select
                      value={requestMethod}
                      onChange={(e) => setRequestMethod(e.target.value)}
                      className='bg-gray-200 px-3 py-2 rounded'
                    >
                      <option>GET</option>
                      <option>POST</option>
                      <option>PUT</option>
                      <option>DELETE</option>
                      <option>PATCH</option>
                    </select>

                    <div className='flex-1 flex items-center bg-gray-200 rounded'>
                      <span className='px-3 text-gray-500 border-r'>
                        {baseUrl}/
                      </span>
                      <input
                        type='text'
                        value={requestUrl}
                        onChange={(e) => setRequestUrl(e.target.value)}
                        placeholder='api/endpoint'
                        className='flex-1 p-2 bg-transparent'
                      />
                    </div>

                    <button
                      onClick={handleSendRequest}
                      disabled={isLoading}
                      className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center'
                    >
                      {isLoading ? (
                        'Sending...'
                      ) : (
                        <>
                          Send <Play size={16} className='ml-1' />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Headers */}
                  <div>
                    <h3 className='font-medium mb-2'>Headers</h3>
                    <textarea
                      value={requestHeaders}
                      onChange={(e) => setRequestHeaders(e.target.value)}
                      className='w-full h-32 p-3 font-mono bg-gray-50 border rounded'
                    />
                  </div>

                  {/* Request Body (for non-GET requests) */}
                  {requestMethod !== 'GET' && (
                    <div>
                      <h3 className='font-medium mb-2'>Request Body</h3>
                      <textarea
                        value={requestBody}
                        onChange={(e) => setRequestBody(e.target.value)}
                        className='w-full h-48 p-3 font-mono bg-gray-50 border rounded'
                      />
                    </div>
                  )}
                </div>
              </TabPanel>

              <TabPanel className='flex-1 overflow-y-auto'>
                <div className='mb-4 flex justify-between items-center'>
                  <h2 className='text-lg font-medium'>Request History</h2>
                  {history.length > 0 && (
                    <button
                      onClick={clearHistory}
                      className='text-red-600 hover:text-red-800 flex items-center'
                    >
                      <Trash2 size={16} className='mr-1' /> Clear History
                    </button>
                  )}
                </div>

                {history.length === 0 ? (
                  <div className='text-center py-8 text-gray-500'>
                    No requests in history
                  </div>
                ) : (
                  <div className='space-y-3'>
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className='p-3 border rounded bg-white hover:shadow cursor-pointer'
                        onClick={() => loadFromHistory(item)}
                      >
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center'>
                            <span
                              className={`font-mono text-xs px-2 py-1 rounded ${
                                item.method === 'GET'
                                  ? 'bg-green-100 text-green-800'
                                  : item.method === 'POST'
                                  ? 'bg-blue-100 text-blue-800'
                                  : item.method === 'PUT'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : item.method === 'DELETE'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100'
                              }`}
                            >
                              {item.method}
                            </span>
                            <span className='ml-2 font-medium truncate max-w-md'>
                              {item.url}
                            </span>
                          </div>
                          <div className='flex items-center'>
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                item.response.status >= 200 &&
                                item.response.status < 300
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {item.response.status}
                            </span>
                            <span className='ml-2 text-gray-500 text-xs flex items-center'>
                              <Clock size={12} className='mr-1' />
                              {new Date(item.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabPanel>
            </Tabs>
          </div>

          {/* Response Panel */}
          <div className='h-1/2 bg-gray-50 border-t flex flex-col'>
            <div className='bg-gray-200 p-2 flex justify-between items-center'>
              <h3 className='font-medium'>Response</h3>
              {responseData && (
                <div className='flex items-center space-x-2'>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      responseData.status >= 200 && responseData.status < 300
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                    }`}
                  >
                    {responseData.status} {responseData.statusText}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        typeof responseData.body === 'string'
                          ? responseData.body
                          : JSON.stringify(responseData.body, null, 2),
                      );
                    }}
                    className='text-gray-600 hover:text-gray-800'
                    title='Copy response'
                  >
                    <Copy size={16} />
                  </button>
                </div>
              )}
            </div>

            <div className='flex-1 overflow-auto p-4'>
              {error ? (
                <div className='bg-red-100 border border-red-300 text-red-800 p-3 rounded'>
                  {error}
                </div>
              ) : responseData ? (
                <pre className='font-mono text-sm whitespace-pre-wrap'>
                  {typeof responseData.body === 'string'
                    ? responseData.body
                    : formatJson(responseData.body)}
                </pre>
              ) : (
                <div className='text-gray-500 italic'>
                  No response yet. Send a request to see the response here.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// API Endpoints definition
const API_ENDPOINTS = {
  Authentication: [
    { name: 'Register', method: 'POST', path: 'api/auth/register' },
    { name: 'Login', method: 'POST', path: 'api/auth/login' },
    { name: 'Sign Out', method: 'POST', path: 'api/auth/signout' },
    { name: 'Get Permissions', method: 'GET', path: 'api/auth/permissions' },
    { name: 'Reset Password', method: 'POST', path: 'api/auth/reset-password' },
    {
      name: 'Update Password',
      method: 'POST',
      path: 'api/auth/update-password',
    },
    { name: 'Refresh Token', method: 'POST', path: 'api/auth/refresh-token' },
    { name: 'Get Current User', method: 'GET', path: 'api/auth/me' },
  ],
  'User Management': [
    { name: 'Get Profile', method: 'GET', path: 'api/users/profile' },
    {
      name: 'Search Users',
      method: 'GET',
      path: 'api/users/search?query=test',
    },
    { name: 'Get Duel Stats', method: 'GET', path: 'api/users/duel-stats' },
    { name: 'Update Study Time', method: 'POST', path: 'api/users/study-time' },
  ],
  Courses: [
    { name: 'List Courses', method: 'GET', path: 'api/courses' },
    { name: 'Get Course', method: 'GET', path: 'api/courses/1' },
    { name: 'Create Course', method: 'POST', path: 'api/courses' },
    { name: 'Update Course', method: 'PUT', path: 'api/courses/1' },
    { name: 'Delete Course', method: 'DELETE', path: 'api/courses/1' },
  ],
  Topics: [
    { name: 'List Topics', method: 'GET', path: 'api/topics?courseId=1' },
    { name: 'Get Topic', method: 'GET', path: 'api/topics/1' },
    { name: 'Create Topic', method: 'POST', path: 'api/topics' },
    { name: 'Update Topic', method: 'PUT', path: 'api/topics/1' },
    { name: 'Delete Topic', method: 'DELETE', path: 'api/topics/1' },
  ],
  Subtopics: [
    { name: 'List Subtopics', method: 'GET', path: 'api/subtopics?topicId=1' },
    { name: 'Get Subtopic', method: 'GET', path: 'api/subtopics/1' },
    { name: 'Create Subtopic', method: 'POST', path: 'api/subtopics' },
    { name: 'Update Subtopic', method: 'PUT', path: 'api/subtopics/1' },
    { name: 'Delete Subtopic', method: 'DELETE', path: 'api/subtopics/1' },
  ],
  Study: [
    { name: 'Start Session', method: 'POST', path: 'api/study/session/start' },
    { name: 'End Session', method: 'POST', path: 'api/study/session/end' },
    { name: 'Get Progress', method: 'GET', path: 'api/study/progress' },
    { name: 'Update Progress', method: 'POST', path: 'api/study/progress' },
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
