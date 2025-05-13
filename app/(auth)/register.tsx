import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui';
import { TextLink } from '../../components/ui/AppLink';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();

  const handleRegister = async () => {
    // Basic form validation
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      await signUp(username, email, password);
      // No need to navigate, the AuthContext will handle redirection
    } catch (error: any) {
      const errorMessage =
        error.message || 'Registration failed. Please try again.';
      Alert.alert('Registration Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className='flex-1 bg-gray-50 dark:bg-gray-900'>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <KeyboardAvoidingView
        className='flex-1'
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          className='flex-1 px-6'
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps='handled'
        >
          {/* Logo and Title */}
          <View className='items-center my-6'>
            <View className='w-20 h-20 bg-primary rounded-full items-center justify-center mb-3'>
              <Text className='text-white text-3xl font-bold'>D</Text>
            </View>
            <Text className='text-2xl font-bold text-gray-800 dark:text-white mb-1'>
              Create Account
            </Text>
            <Text className='text-sm text-gray-600 dark:text-gray-300 text-center'>
              Join the community of dental students
            </Text>
          </View>

          {/* Registration Form */}
          <View className='card p-6 mb-6'>
            <View className='mb-4'>
              <Text className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                Username
              </Text>
              <TextInput
                className='w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-3 mb-4'
                placeholder='Enter your username'
                placeholderTextColor='#9CA3AF'
                value={username}
                onChangeText={setUsername}
              />

              <Text className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                Email
              </Text>
              <TextInput
                className='w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-3 mb-4'
                placeholder='Enter your email'
                placeholderTextColor='#9CA3AF'
                value={email}
                onChangeText={setEmail}
                autoCapitalize='none'
                keyboardType='email-address'
              />

              <Text className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                Password
              </Text>
              <TextInput
                className='w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-3 mb-4'
                placeholder='Create a password'
                placeholderTextColor='#9CA3AF'
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <Text className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                Confirm Password
              </Text>
              <TextInput
                className='w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-3'
                placeholder='Confirm your password'
                placeholderTextColor='#9CA3AF'
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            <Button
              title={isLoading ? 'Creating Account...' : 'Create Account'}
              onPress={handleRegister}
              disabled={isLoading}
              variant='primary'
              className='w-full mt-2'
            />
          </View>

          {/* Sign In Link */}
          <View className='flex-row justify-center items-center'>
            <Text className='text-gray-600 dark:text-gray-400'>
              Already have an account?{' '}
            </Text>
            <TextLink
              href='/(auth)/login'
              label='Sign In'
              style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
