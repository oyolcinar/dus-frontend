import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';

// This component is specifically for the web-platform, as the dashboard relies on browser capabilities
// For native platforms (iOS/Android) we'll show a placeholder
export default function ApiTestingDashboard() {
  // Check if running on web
  if (Platform.OS !== 'web') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>API Testing Dashboard</Text>
        <Text style={styles.notice}>
          The API Testing Dashboard is only available on the web platform due to its reliance on web technologies.
          Please run this app in a web browser to use the dashboard.
        </Text>
      </View>
    );
  }

  // On web platform, we render the web-specific dashboard
  return (
    <View style={styles.container}>
      <WebView
        style={styles.webview}
        originWhitelist={['*']}
        source={{ html: getWebDashboardHtml() }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </View>
  );
}

// This function generates the HTML for the WebView
function getWebDashboardHtml() {
  // Importing the dashboard HTML & scripts
  const dashboardHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DUS API Testing Dashboard</title>
  <!-- For simplicity, we'll include Tailwind directly via CDN for the web view -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Include React and other dependencies -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <!-- For React tabs -->
  <script src="https://unpkg.com/react-tabs@6/dist/react-tabs.development.js"></script>
  <link rel="stylesheet" href="https://unpkg.com/react-tabs@6/style/react-tabs.css" />
  <!-- Lucide icons -->
  <script src="https://unpkg.com/lucide@latest"></script>
</head>
<body>
  <div id="root" class="h-screen"></div>
  
  <script>
    // Main dashboard implementation will be executed here
    // We'll use the window API to bridge between React Native and the web view
    const { useState, useEffect } = React;
    const { createRoot } = ReactDOM;
    const { Tab, Tabs, TabList, TabPanel } = ReactTabs;
    
    // Convert the full React dashboard component to work in this WebView context
    function ApiTestingDashboard() {
      // Dashboard implementation
      // Copy the full React implementation here (slightly modified for the WebView context)
      // ...dashboard code...
      
      // We'll create a simplified version for this demonstration
      return React.createElement(
        'div', 
        { className: 'flex flex-col h-screen bg-gray-100' },
        React.createElement(
          'div', 
          { className: 'bg-indigo-600 text-white p-4' },
          React.createElement(
            'h1', 
            { className: 'text-2xl font-bold' },
            'DUS API Testing Dashboard'
          )
        ),
        React.createElement(
          'div', 
          { className: 'flex-1 flex items-center justify-center' },
          React.createElement(
            'p', 
            { className: 'text-lg' },
            'Dashboard is being loaded...'
          )
        )
      );
    }
    
    // Render the dashboard
    const root = createRoot(document.getElementById('root'));
    root.render(React.createElement(ApiTestingDashboard));
  </script>
</body>
</html>
  `;

  return dashboardHtml;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    margin: 16,
    textAlign: 'center',
  },
  notice: {
    fontSize: 16,
    margin: 16,
    textAlign: 'center',
    color: '#666',
  },
});
