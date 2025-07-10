import React from 'react';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/theme';

export default function AuthLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: isDark ? Colors.gray[50] : Colors.gray[50],
        },
        headerTintColor: isDark ? Colors.gray[900] : Colors.gray[900],
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: isDark ? Colors.gray[50] : Colors.gray[50],
        },
      }}
    />
  );
}
