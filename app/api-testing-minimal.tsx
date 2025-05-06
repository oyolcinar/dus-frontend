import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

import ApiTestingSummary from '@/components/admin/ApiTestingSummary';

export default function ApiTestingMinimalScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'API Testing (Minimal)',
          headerShown: true,
        }}
      />
      <ApiTestingSummary />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});