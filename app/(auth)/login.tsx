import React, { useState } from 'react';
import {
  View,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import {
  Button,
  Input,
  TextLink,
  Title,
  Paragraph,
  Card,
  Container,
  Toast,
  Alert,
} from '../../components/ui';
import { Colors, Spacing } from '../../constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const colorScheme = useColorScheme();
  const { signIn } = useAuth();

  const handleLogin = async () => {
    // Clear previous errors
    setError(null);

    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }

    try {
      setIsLoading(true);
      await signIn(email, password);
      // No need to navigate, the AuthContext will handle redirection
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setShowToast(true);
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
              DUS Exam Prep
            </Title>
            <Paragraph align='center' size='medium'>
              Master your dental exams with confidence
            </Paragraph>
          </View>

          {/* Login Form */}
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

              <Input
                label='Password'
                value={password}
                onChangeText={setPassword}
                placeholder='Enter your password'
                secureTextEntry
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

            {/* Using TextLink for forgot password */}
            <View style={{ marginBottom: Spacing[4], alignItems: 'flex-end' }}>
              <TextLink
                href='/(auth)/forgot-password'
                label='Forgot password?'
                touchableProps={{
                  onPress: handleForgotPassword,
                }}
              />
            </View>

            <Button
              title={isLoading ? 'Signing in...' : 'Sign In'}
              onPress={handleLogin}
              disabled={isLoading}
              variant='primary'
              style={{ width: '100%' }}
            />
          </Card>

          {/* Sign Up Link */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: Spacing[4],
            }}
          >
            <Paragraph size='medium'>Don't have an account? </Paragraph>
            <TextLink href='/(auth)/register' label='Sign Up' />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Toast notification for "Forgot Password" feature */}
      {showToast && (
        <Toast
          type='info'
          message='Password reset functionality will be available soon.'
          duration={3000}
          onClose={() => setShowToast(false)}
        />
      )}
    </SafeAreaView>
  );
}
