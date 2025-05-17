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
  Alert,
} from '../../components/ui';
import { Colors, Spacing } from '../../constants/theme';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const { signUp } = useAuth();

  const handleRegister = async () => {
    // Clear previous errors
    setError(null);

    // Basic form validation
    if (!username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      await signUp(username, email, password);
      // No need to navigate, the AuthContext will handle redirection
    } catch (error: any) {
      const errorMessage =
        error.message || 'Registration failed. Please try again.';
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
          <View style={{ alignItems: 'center', marginVertical: Spacing[6] }}>
            <View
              style={{
                width: 80,
                height: 80,
                backgroundColor: Colors.primary.DEFAULT,
                borderRadius: 40,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: Spacing[3],
              }}
            >
              <Title
                level={1}
                color='white'
                style={{ marginBottom: 0, fontSize: 30 }}
              >
                D
              </Title>
            </View>
            <Title level={2} style={{ marginBottom: 4 }}>
              Create Account
            </Title>
            <Paragraph align='center' size='small'>
              Join the community of dental students
            </Paragraph>
          </View>

          {/* Registration Form */}
          <Card style={{ marginBottom: Spacing[6] }}>
            <View style={{ marginBottom: Spacing[4] }}>
              <Input
                label='Username'
                value={username}
                onChangeText={setUsername}
                placeholder='Enter your username'
              />

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
                placeholder='Create a password'
                secureTextEntry
              />

              <Input
                label='Confirm Password'
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder='Confirm your password'
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

            <Button
              title={isLoading ? 'Creating Account...' : 'Create Account'}
              onPress={handleRegister}
              disabled={isLoading}
              variant='primary'
              style={{ width: '100%', marginTop: Spacing[2] }}
            />
          </Card>

          {/* Sign In Link */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Paragraph size='medium'>Already have an account? </Paragraph>
            <TextLink href='/(auth)/login' label='Sign In' />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
