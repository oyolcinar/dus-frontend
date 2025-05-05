import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
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
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Type definitions
type Endpoint = {
  name: string;
  method: string;
  path: string;
};

type EndpointCategory = {
  [key: string]: Endpoint[];
};

type ExpandedState = {
  [key: string]: boolean;
};

type ResponseData = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
};

type HistoryItem = {
  id: number;
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string | null;
  response: ResponseData;
  timestamp: string;
};

type TabRoute = {
  key: string;
  title: string;
};

// Main component
export default function ApiTestingDashboard() {
  const [token, setToken] = useState<string>('');
  const [endpoints, setEndpoints] = useState<EndpointCategory>(API_ENDPOINTS);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(
    null,
  );
  const [requestMethod, setRequestMethod] = useState<string>('GET');
  const [requestUrl, setRequestUrl] = useState<string>('');
  const [requestBody, setRequestBody] = useState<string>('{\n  \n}');
  const [requestHeaders, setRequestHeaders] = useState<string>(
    '{\n  "Content-Type": "application/json"\n}',
  );
  const [responseData, setResponseData] = useState<ResponseData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [registerUsername, setRegisterUsername] = useState<string>('');
  const [registerEmail, setRegisterEmail] = useState<string>('');
  const [registerPassword, setRegisterPassword] = useState<string>('');
  const [baseUrl, setBaseUrl] = useState<string>('http://localhost:5000');

  // Tab view state
  const [authTabIndex, setAuthTabIndex] = useState(0);
  const [authTabRoutes] = useState<TabRoute[]>([
    { key: 'login', title: 'Login' },
    { key: 'register', title: 'Register' },
  ]);

  const [mainTabIndex, setMainTabIndex] = useState(0);
  const [mainTabRoutes] = useState<TabRoute[]>([
    { key: 'builder', title: 'Request Builder' },
    { key: 'history', title: 'Request History' },
  ]);

  const handleError = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    return 'An unknown error occurred';
  };

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [storedToken, storedBaseUrl, storedHistory] = await Promise.all([
          AsyncStorage.getItem('authToken'),
          AsyncStorage.getItem('baseUrl'),
          AsyncStorage.getItem('requestHistory'),
        ]);

        if (storedToken) setToken(storedToken);
        if (storedBaseUrl) setBaseUrl(storedBaseUrl);
        if (storedHistory) setHistory(JSON.parse(storedHistory));
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    loadInitialData();
  }, []);

  // Update storage when state changes
  useEffect(() => {
    const updateStorage = async () => {
      try {
        await AsyncStorage.setItem('authToken', token);
        await AsyncStorage.setItem('baseUrl', baseUrl);
        setIsAuthenticated(!!token);
      } catch (error) {
        console.error('Error updating storage:', error);
      }
    };

    updateStorage();
  }, [token, baseUrl]);

  useEffect(() => {
    const updateHistory = async () => {
      try {
        await AsyncStorage.setItem('requestHistory', JSON.stringify(history));
      } catch (error) {
        console.error('Error updating history:', error);
      }
    };

    updateHistory();
  }, [history]);

  const toggleCategory = (category: string) => {
    setExpanded({ ...expanded, [category]: !expanded[category] });
  };

  const selectEndpoint = (endpoint: Endpoint) => {
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
    } catch (err) {
      setError(handleError(err));
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

      if (data.session?.access_token) {
        setToken(data.session.access_token);
      }
    } catch (err) {
      setError(handleError(err));
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
      let headers: Record<string, string> = {};
      try {
        headers = JSON.parse(requestHeaders);
      } catch (e) {
        throw new Error('Invalid headers JSON format');
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const fetchOptions: RequestInit = {
        method: requestMethod,
        headers: headers,
      };

      if (requestMethod !== 'GET' && requestBody.trim()) {
        fetchOptions.body = requestBody;
      }

      const fullUrl = `${baseUrl}${
        requestUrl.startsWith('/') ? requestUrl : `/${requestUrl}`
      }`;
      const response = await fetch(fullUrl, fetchOptions);

      let responseBody;
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        responseBody = await response.json();
      } else {
        responseBody = await response.text();
      }

      const responseInfo: ResponseData = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries([...response.headers.entries()]),
        body: responseBody,
      };

      setResponseData(responseInfo);

      const historyItem: HistoryItem = {
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
      setError(handleError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setRequestMethod(item.method);
    setRequestUrl(item.url.replace(baseUrl, ''));
    setRequestHeaders(JSON.stringify(item.headers, null, 2));
    if (item.body) {
      setRequestBody(item.body);
    }
    setResponseData(item.response);
  };

  const clearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear the request history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setHistory([]);
            AsyncStorage.removeItem('requestHistory');
          },
        },
      ],
    );
  };

  const formatJson = (jsonStr: any) => {
    try {
      if (typeof jsonStr === 'string') {
        return JSON.stringify(JSON.parse(jsonStr), null, 2);
      }
      return JSON.stringify(jsonStr, null, 2);
    } catch (e) {
      return jsonStr;
    }
  };

  // Auth Tab Views
  const renderAuthLogin = () => (
    <View className='p-4 space-y-3'>
      <TextInput
        className='w-full p-2 rounded bg-white text-black'
        value={loginEmail}
        onChangeText={setLoginEmail}
        placeholder='Email'
        keyboardType='email-address'
        autoCapitalize='none'
      />
      <TextInput
        className='w-full p-2 rounded bg-white text-black'
        value={loginPassword}
        onChangeText={setLoginPassword}
        placeholder='Password'
        secureTextEntry
      />
      <TouchableOpacity
        className={`w-full bg-blue-500 p-2 rounded flex items-center justify-center ${
          isLoading ? 'opacity-70' : ''
        }`}
        onPress={handleLogin}
        disabled={isLoading}
      >
        <Text className='text-white'>
          {isLoading ? 'Logging in...' : 'Login'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderAuthRegister = () => (
    <View className='p-4 space-y-3'>
      <TextInput
        className='w-full p-2 rounded bg-white text-black'
        value={registerUsername}
        onChangeText={setRegisterUsername}
        placeholder='Username'
        autoCapitalize='none'
      />
      <TextInput
        className='w-full p-2 rounded bg-white text-black'
        value={registerEmail}
        onChangeText={setRegisterEmail}
        placeholder='Email'
        keyboardType='email-address'
        autoCapitalize='none'
      />
      <TextInput
        className='w-full p-2 rounded bg-white text-black'
        value={registerPassword}
        onChangeText={setRegisterPassword}
        placeholder='Password'
        secureTextEntry
      />
      <TouchableOpacity
        className={`w-full bg-green-500 p-2 rounded flex items-center justify-center ${
          isLoading ? 'opacity-70' : ''
        }`}
        onPress={handleRegister}
        disabled={isLoading}
      >
        <Text className='text-white'>
          {isLoading ? 'Registering...' : 'Register'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Main Tab Views
  const renderRequestBuilder = () => (
    <ScrollView className='flex-1 p-4'>
      <View className='flex-row items-center space-x-2 mb-4'>
        <View className='bg-gray-200 px-3 py-2 rounded'>
          <Text className='font-mono text-black'>{requestMethod}</Text>
        </View>

        <View className='flex-1 flex-row items-center bg-gray-200 rounded'>
          <Text className='px-3 text-gray-500'>{baseUrl}/</Text>
          <TextInput
            className='flex-1 p-2 text-black'
            value={requestUrl}
            onChangeText={setRequestUrl}
            placeholder='api/endpoint'
          />
        </View>

        <TouchableOpacity
          className={`bg-blue-600 px-4 py-2 rounded flex-row items-center ${
            isLoading ? 'opacity-70' : ''
          }`}
          onPress={handleSendRequest}
          disabled={isLoading}
        >
          <Text className='text-white mr-1'>
            {isLoading ? 'Sending...' : 'Send'}
          </Text>
          <Play size={16} color='#fff' />
        </TouchableOpacity>
      </View>

      <View className='mb-4'>
        <Text className='font-medium mb-2 text-black'>Headers</Text>
        <TextInput
          className='w-full h-32 p-3 bg-gray-50 border rounded font-mono text-black'
          value={requestHeaders}
          onChangeText={setRequestHeaders}
          multiline
        />
      </View>

      {requestMethod !== 'GET' && (
        <View className='mb-4'>
          <Text className='font-medium mb-2 text-black'>Request Body</Text>
          <TextInput
            className='w-full h-48 p-3 bg-gray-50 border rounded font-mono text-black'
            value={requestBody}
            onChangeText={setRequestBody}
            multiline
          />
        </View>
      )}
    </ScrollView>
  );

  const renderRequestHistory = () => (
    <View className='flex-1'>
      <View className='flex-row justify-between items-center p-4'>
        <Text className='text-lg font-medium text-black'>Request History</Text>
        {history.length > 0 && (
          <TouchableOpacity
            className='flex-row items-center'
            onPress={clearHistory}
          >
            <Trash2 size={16} color='#dc2626' />
            <Text className='text-red-600 ml-1'>Clear History</Text>
          </TouchableOpacity>
        )}
      </View>

      {history.length === 0 ? (
        <View className='flex-1 justify-center items-center'>
          <Text className='text-gray-500'>No requests in history</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              className='p-3 border rounded bg-white mb-2 mx-4'
              onPress={() => loadFromHistory(item)}
            >
              <View className='flex-row justify-between items-center'>
                <View className='flex-row items-center'>
                  <View
                    className={`px-2 py-1 rounded ${
                      item.method === 'GET'
                        ? 'bg-green-100'
                        : item.method === 'POST'
                        ? 'bg-blue-100'
                        : item.method === 'PUT'
                        ? 'bg-yellow-100'
                        : item.method === 'DELETE'
                        ? 'bg-red-100'
                        : 'bg-gray-100'
                    }`}
                  >
                    <Text
                      className={`text-xs ${
                        item.method === 'GET'
                          ? 'text-green-800'
                          : item.method === 'POST'
                          ? 'text-blue-800'
                          : item.method === 'PUT'
                          ? 'text-yellow-800'
                          : item.method === 'DELETE'
                          ? 'text-red-800'
                          : 'text-gray-800'
                      }`}
                    >
                      {item.method}
                    </Text>
                  </View>
                  <Text className='ml-2 font-medium text-black truncate max-w-[200px]'>
                    {item.url}
                  </Text>
                </View>
                <View className='flex-row items-center'>
                  <View
                    className={`px-2 py-1 rounded ${
                      item.response.status >= 200 && item.response.status < 300
                        ? 'bg-green-100'
                        : 'bg-red-100'
                    }`}
                  >
                    <Text
                      className={`text-xs ${
                        item.response.status >= 200 &&
                        item.response.status < 300
                          ? 'text-green-800'
                          : 'text-red-800'
                      }`}
                    >
                      {item.response.status}
                    </Text>
                  </View>
                  <View className='ml-2 flex-row items-center'>
                    <Clock size={12} color='#6b7280' />
                    <Text className='text-gray-500 text-xs ml-1'>
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );

  // Scene maps
  const renderAuthScene = SceneMap({
    login: renderAuthLogin,
    register: renderAuthRegister,
  });

  const renderScene = SceneMap({
    builder: renderRequestBuilder,
    history: renderRequestHistory,
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className='flex-1 bg-gray-100'
    >
      {/* Header */}
      <View className='bg-indigo-600 p-4'>
        <View className='flex-row justify-between items-center'>
          <Text className='text-2xl font-bold text-white'>
            DUS API Testing Dashboard
          </Text>
          <View className='flex-row items-center space-x-4'>
            <TextInput
              className='px-2 py-1 rounded bg-white text-black text-sm w-64'
              value={baseUrl}
              onChangeText={setBaseUrl}
              placeholder='Base URL'
            />
            {isAuthenticated ? (
              <TouchableOpacity
                className='bg-red-500 px-4 py-2 rounded'
                onPress={handleLogout}
              >
                <Text className='text-white'>Logout</Text>
              </TouchableOpacity>
            ) : (
              <Text className='text-yellow-200'>Not authenticated</Text>
            )}
          </View>
        </View>
      </View>

      {/* Main Content */}
      <View className='flex-1 flex-row'>
        {/* Sidebar */}
        <View className='w-72 bg-gray-800'>
          {/* Auth Section */}
          {!isAuthenticated && (
            <View className='p-4 border-b border-gray-700'>
              <TabView
                navigationState={{ index: authTabIndex, routes: authTabRoutes }}
                renderScene={renderAuthScene}
                onIndexChange={setAuthTabIndex}
                renderTabBar={(props) => (
                  <TabBar
                    {...props}
                    indicatorStyle={{ backgroundColor: '#60a5fa' }}
                    style={{ backgroundColor: '#1f2937' }}
                    // label={{ color: 'white' }}
                  />
                )}
                initialLayout={{ width: 288 }}
              />
              {error && (
                <View className='mt-4 p-2 bg-red-600 rounded'>
                  <Text className='text-white'>{error}</Text>
                </View>
              )}
            </View>
          )}

          {/* Endpoints List */}
          <ScrollView className='flex-1'>
            {Object.entries(endpoints).map(([category, items]) => (
              <View key={category}>
                <TouchableOpacity
                  className='flex-row items-center justify-between p-3 bg-gray-700'
                  onPress={() => toggleCategory(category)}
                >
                  <Text className='font-medium text-white'>{category}</Text>
                  {expanded[category] ? (
                    <ChevronUp size={18} color='white' />
                  ) : (
                    <ChevronDown size={18} color='white' />
                  )}
                </TouchableOpacity>

                {expanded[category] && (
                  <View className='bg-gray-900'>
                    {items.map((endpoint, index) => (
                      <TouchableOpacity
                        key={index}
                        className={`p-2 pl-4 border-l-4 ${
                          selectedEndpoint === endpoint
                            ? 'border-blue-500 bg-gray-800'
                            : 'border-transparent'
                        }`}
                        onPress={() => selectEndpoint(endpoint)}
                      >
                        <View className='flex-row items-center'>
                          <View
                            className={`w-16 px-2 py-1 rounded ${
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
                            <Text className='text-xs text-white text-center'>
                              {endpoint.method}
                            </Text>
                          </View>
                          <Text className='ml-2 text-sm text-white truncate'>
                            {endpoint.name}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Main Panel */}
        <View className='flex-1'>
          <TabView
            navigationState={{ index: mainTabIndex, routes: mainTabRoutes }}
            renderScene={renderScene}
            onIndexChange={setMainTabIndex}
            renderTabBar={(props) => (
              <TabBar
                {...props}
                indicatorStyle={{ backgroundColor: '#3b82f6' }}
                style={{ backgroundColor: '#f3f4f6' }}
                // labelStyle={{ color: '#1f2937' }}
              />
            )}
            initialLayout={{ width: 100 }}
          />

          {/* Response Panel */}
          <View className='h-1/2 border-t bg-gray-50'>
            <View className='flex-row justify-between items-center p-2 bg-gray-200'>
              <Text className='font-medium text-black'>Response</Text>
              {responseData && (
                <View className='flex-row items-center space-x-2'>
                  <View
                    className={`px-2 py-1 rounded ${
                      responseData.status >= 200 && responseData.status < 300
                        ? 'bg-green-500'
                        : 'bg-red-500'
                    }`}
                  >
                    <Text className='text-xs text-white'>
                      {responseData.status} {responseData.statusText}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      const text =
                        typeof responseData.body === 'string'
                          ? responseData.body
                          : JSON.stringify(responseData.body, null, 2);
                      // You'll need to add a clipboard library for React Native
                      // Clipboard.setString(text);
                    }}
                  >
                    <Copy size={16} color='#4b5563' />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <ScrollView className='flex-1 p-4'>
              {error ? (
                <View className='bg-red-100 border border-red-300 p-3 rounded'>
                  <Text className='text-red-800'>{error}</Text>
                </View>
              ) : responseData ? (
                <Text className='font-mono text-sm text-black'>
                  {formatJson(responseData.body)}
                </Text>
              ) : (
                <Text className='text-gray-500 italic'>
                  No response yet. Send a request to see the response here.
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// API Endpoints definition
const API_ENDPOINTS: EndpointCategory = {
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
