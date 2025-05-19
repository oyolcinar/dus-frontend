// app/(auth)/forgot-password.tsx

import React, { useState } from 'react';
import {
  View,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { requestPasswordReset } from '../../src/api/authService';
import {
  Button,
  Input,
  TextLink,
  Title,
  Paragraph,
  Card,
  Alert,
} from '../../components/ui';
import { Colors, Spacing } from '../../constants/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const colorScheme = useColorScheme();
  const router = useRouter();

  const handleResetRequest = async () => {
    // Clear previous errors
    setError(null);

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setIsLoading(true);
      await requestPasswordReset(email);
      setSuccess(true);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to request password reset';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor:
          colorScheme === 'dark' ? Colors.gray[900] : Colors.gray[50],
      }}
    >
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={{ flex: 1, paddingHorizontal: Spacing[6] }}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps='handled'
        >
          {/* Logo and Title */}
          <View style={{ alignItems: 'center', marginVertical: Spacing[8] }}>
            <View
              style={{
                width: 96,
                height: 96,
                backgroundColor: Colors.primary.DEFAULT,
                borderRadius: 48,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: Spacing[4],
              }}
            >
              <Title level={1} color='white' style={{ marginBottom: 0 }}>
                D
              </Title>
            </View>
            <Title level={2} style={{ marginBottom: 4 }}>
              Reset Password
            </Title>
            <Paragraph align='center' size='medium'>
              Enter your email to receive a password reset link
            </Paragraph>
          </View>

          {!success ? (
            <Card>
              <View style={{ marginBottom: Spacing[4] }}>
                <Input
                  label='Email'
                  value={email}
                  onChangeText={setEmail}
                  placeholder='Enter your email'
                  inputMode='email'
                  autoCapitalize='none'
                />
              </View>

              {/* Display error message if exists */}
              {error && (
                <Alert
                  type='error'
                  message={error}
                  style={{ marginBottom: Spacing[4] }}
                />
              )}

              <Button
                title={isLoading ? 'Sending...' : 'Send Reset Link'}
                onPress={handleResetRequest}
                disabled={isLoading}
                variant='primary'
                style={{ width: '100%' }}
              />

              <View style={{ marginTop: Spacing[4], alignItems: 'center' }}>
                <TextLink href='/(auth)/login' label='Back to Sign In' />
              </View>
            </Card>
          ) : (
            <Card>
              <Alert
                type='success'
                message='If your email exists in our system, you will receive a password reset link soon. Please check your inbox.'
                style={{ marginBottom: Spacing[4] }}
              />
              <Button
                title='Back to Sign In'
                onPress={() => router.push('/(auth)/login')}
                variant='secondary'
                style={{ width: '100%', marginTop: Spacing[2] }}
              />
            </Card>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
