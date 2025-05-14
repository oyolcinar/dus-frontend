import * as SplashScreen from 'expo-splash-screen';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Queue to store logs when offline
let offlineErrorQueue: Array<{
  type: 'error' | 'event';
  data: any;
  timestamp: number;
}> = [];

// Maximum size of the queue
const MAX_QUEUE_SIZE = 100;

// Initialize error reporting service
export async function initialize() {
  try {
    // Load any cached error logs from storage
    const storedLogs = await AsyncStorage.getItem('offline_error_logs');
    if (storedLogs) {
      offlineErrorQueue = JSON.parse(storedLogs);

      // Prune if the queue is too large
      if (offlineErrorQueue.length > MAX_QUEUE_SIZE) {
        offlineErrorQueue = offlineErrorQueue.slice(-MAX_QUEUE_SIZE);
      }
    }
  } catch (e) {
    console.error('Failed to initialize error reporting:', e);
  }
}

// Save the error queue to AsyncStorage
async function persistErrorQueue() {
  try {
    await AsyncStorage.setItem(
      'offline_error_logs',
      JSON.stringify(offlineErrorQueue),
    );
  } catch (e) {
    console.error('Failed to persist error queue:', e);
  }
}

// Log errors with additional context
export function logError(error: Error, context: Record<string, any> = {}) {
  const errorData = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    context: {
      ...context,
      // Add any global context here
      appVersion: Constants.expoConfig?.version,
      timestamp: new Date().toISOString(),
    },
  };

  console.error('Error:', errorData);

  // In development, we might just want to see the error in the console
  if (__DEV__) {
    return;
  }

  // Add to the error queue for potential sending later
  offlineErrorQueue.push({
    type: 'error',
    data: errorData,
    timestamp: Date.now(),
  });

  // Keep the queue at a reasonable size
  if (offlineErrorQueue.length > MAX_QUEUE_SIZE) {
    offlineErrorQueue.shift();
  }

  // Try to persist the queue
  persistErrorQueue();

  // Here you would normally send to a server
  // You can implement this when you have your own backend ready
  // sendToServer(errorData);
}

// For non-error events that should still be tracked
export function logEvent(name: string, data: Record<string, any> = {}) {
  const eventData = {
    name,
    data: {
      ...data,
      appVersion: Constants.expoConfig?.version,
      timestamp: new Date().toISOString(),
    },
  };

  console.info(`Event: ${name}`, eventData);

  // In development, we just log to the console
  if (__DEV__) {
    return;
  }

  // Add to the error queue for potential sending later
  offlineErrorQueue.push({
    type: 'event',
    data: eventData,
    timestamp: Date.now(),
  });

  // Keep the queue at a reasonable size
  if (offlineErrorQueue.length > MAX_QUEUE_SIZE) {
    offlineErrorQueue.shift();
  }

  // Try to persist the queue
  persistErrorQueue();

  // You can implement server sending here when ready
  // sendToServer(eventData);
}

// Handle fatal errors that crash the app
export function handleFatalError(error: Error, isFatal?: boolean) {
  if (isFatal) {
    logError(error, { fatal: true });

    // For fatal errors, you might want to show a custom error screen
    // or restart the app after logging
    SplashScreen.hideAsync().catch(() => {});
  } else {
    logError(error);
  }
}

// Set user information for error reporting
export function setUserContext(
  userId: string | null,
  userData: Record<string, any> = {},
) {
  // Store user information to include with future error reports
  if (userId) {
    AsyncStorage.setItem(
      'error_reporting_user',
      JSON.stringify({
        id: userId,
        ...userData,
      }),
    ).catch((err) => console.error('Failed to store user context:', err));
  } else {
    AsyncStorage.removeItem('error_reporting_user').catch((err) =>
      console.error('Failed to remove user context:', err),
    );
  }
}

// Function to manually send all stored logs to your server
export async function sendStoredLogsToServer() {
  if (offlineErrorQueue.length === 0) {
    return { sent: 0 };
  }

  try {
    // Here you would implement the actual sending logic
    // For example:
    // const response = await fetch('https://your-api.com/logs', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ logs: offlineErrorQueue })
    // });

    // if (response.ok) {
    //   const oldCount = offlineErrorQueue.length;
    //   offlineErrorQueue = [];
    //   await persistErrorQueue();
    //   return { sent: oldCount };
    // }

    console.log(`Would send ${offlineErrorQueue.length} logs to server`);

    // For now, just simulate successful sending
    const oldCount = offlineErrorQueue.length;
    offlineErrorQueue = [];
    await persistErrorQueue();
    return { sent: oldCount };
  } catch (e) {
    console.error('Failed to send logs to server:', e);
    return { sent: 0, error: e };
  }
}
