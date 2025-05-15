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

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password');
      return;
    }

    try {
      setIsLoading(true);
      await signIn(email, password);
      // No need to navigate, the AuthContext will handle redirection
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed. Please try again.';
      Alert.alert('Login Error', errorMessage);
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
          <View className='items-center my-8'>
            <View className='w-24 h-24 bg-primary rounded-full items-center justify-center mb-4'>
              <Text className='text-white text-4xl font-bold'>D</Text>
            </View>
            <Text className='text-3xl font-bold text-gray-800 dark:text-white mb-1'>
              DUS Exam Prep
            </Text>
            <Text className='text-base text-gray-600 dark:text-gray-300 text-center'>
              Master your dental exams with confidence
            </Text>
          </View>

          {/* Login Form */}
          <View className='card p-6 mb-6'>
            <View className='mb-4'>
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
                className='w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg px-4 py-3'
                placeholder='Enter your password'
                placeholderTextColor='#9CA3AF'
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {/* Using TextLink for forgot password */}
            <View className='mb-4 items-end'>
              <TextLink
                href='/(auth)/forgot-password'
                label='Forgot password?'
                touchableProps={{
                  onPress: () =>
                    Alert.alert(
                      'Feature Coming Soon',
                      'Password reset functionality will be available soon.',
                    ),
                }}
              />
            </View>

            <Button
              title={isLoading ? 'Signing in...' : 'Sign In'}
              onPress={handleLogin}
              disabled={isLoading}
              variant='primary'
              className='w-full'
            />
          </View>

          {/* Sign Up Link */}
          <View className='flex-row justify-center items-center'>
            <Text className='text-gray-600 dark:text-gray-400'>
              Don't have an account?{' '}
            </Text>
            {/* Using TextLink for register link */}
            <TextLink href='/(auth)/register' label='Sign Up' />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
