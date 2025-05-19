import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SubtopicDetailScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Stack.Screen
        options={{
          title: `Lesson ${id}`,
          headerTintColor: colors.text,
        }}
      />
      <ScrollView>
        <Text style={[styles.text, { color: colors.text }]}>
          Lesson Details for ID: {id}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  text: {
    fontSize: 16,
    padding: 16,
  },
});
