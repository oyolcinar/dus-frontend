import React, { useState } from 'react';
import {
  View,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  useColorScheme,
  TouchableOpacity,
  Text,
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
  const [isOAuthLoading, setIsOAuthLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const { signUp, signInWithGoogle, signInWithApple, signInWithFacebook } =
    useAuth();

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

  const handleOAuthSignUp = async (
    provider: 'google' | 'apple' | 'facebook',
  ) => {
    setError(null);
    setIsOAuthLoading(provider);

    try {
      switch (provider) {
        case 'google':
          await signInWithGoogle();
          break;
        case 'apple':
          await signInWithApple();
          break;
        case 'facebook':
          await signInWithFacebook();
          break;
      }
      // No need to navigate, the AuthContext will handle redirection
    } catch (error: any) {
      console.error(`${provider} OAuth error:`, error);
      const errorMessage =
        error.message || `${provider} sign up failed. Please try again.`;
      setError(errorMessage);
    } finally {
      setIsOAuthLoading(null);
    }
  };

  const OAuthButton = ({
    provider,
    title,
    backgroundColor,
    textColor = 'white',
    icon,
  }: {
    provider: 'google' | 'apple' | 'facebook';
    title: string;
    backgroundColor: string;
    textColor?: string;
    icon?: string;
  }) => (
    <TouchableOpacity
      style={{
        backgroundColor,
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        opacity: isOAuthLoading === provider ? 0.7 : 1,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
      }}
      onPress={() => handleOAuthSignUp(provider)}
      disabled={isOAuthLoading !== null || isLoading}
    >
      <Text
        style={{
          color: textColor,
          fontSize: 16,
          fontWeight: '600',
          textAlign: 'center',
        }}
      >
        {isOAuthLoading === provider ? `Signing up...` : title}
      </Text>
    </TouchableOpacity>
  );

  const isDarkMode = colorScheme === 'dark';

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: isDarkMode ? Colors.gray[900] : Colors.gray[50],
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
                shadowColor: '#000',
                shadowOffset: {
                  width: 0,
                  height: 4,
                },
                shadowOpacity: 0.3,
                shadowRadius: 4.65,
                elevation: 8,
              }}
            >
              <Title level={1} color='white' style={{ marginBottom: 0 }}>
                D
              </Title>
            </View>
            <Title level={2} style={{ marginBottom: 4 }}>
              Join DUS Exam Prep
            </Title>
            <Paragraph align='center' size='medium'>
              Start your journey to dental exam success
            </Paragraph>
          </View>

          {/* OAuth Sign Up Options */}
          <Card style={{ marginBottom: Spacing[4] }}>
            <View style={{ marginBottom: Spacing[2] }}>
              <Paragraph
                style={{
                  textAlign: 'center',
                  marginBottom: Spacing[4],
                  fontWeight: '600',
                  color: isDarkMode ? Colors.gray[200] : Colors.gray[700],
                }}
              >
                Quick Sign Up
              </Paragraph>

              <OAuthButton
                provider='google'
                title='Continue with Google'
                backgroundColor='#4285F4'
                textColor='white'
              />

              <OAuthButton
                provider='apple'
                title='Continue with Apple'
                backgroundColor={isDarkMode ? '#ffffff' : '#000000'}
                textColor={isDarkMode ? '#000000' : '#ffffff'}
              />

              <OAuthButton
                provider='facebook'
                title='Continue with Facebook'
                backgroundColor='#1877F2'
                textColor='white'
              />
            </View>

            {/* Divider */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginVertical: Spacing[4],
              }}
            >
              <View
                style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: isDarkMode
                    ? Colors.gray[600]
                    : Colors.gray[300],
                }}
              />
              <Paragraph
                style={{
                  marginHorizontal: Spacing[3],
                  color: isDarkMode ? Colors.gray[400] : Colors.gray[500],
                  fontSize: 14,
                }}
              >
                or create account with email
              </Paragraph>
              <View
                style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: isDarkMode
                    ? Colors.gray[600]
                    : Colors.gray[300],
                }}
              />
            </View>
          </Card>

          {/* Email/Password Registration Form */}
          <Card>
            <View style={{ marginBottom: Spacing[4] }}>
              <Input
                label='Username'
                value={username}
                onChangeText={setUsername}
                placeholder='Enter your username'
                disabled={isLoading || isOAuthLoading !== null}
              />

              <Input
                label='Email'
                value={email}
                onChangeText={setEmail}
                placeholder='Enter your email'
                inputMode='email'
                autoCapitalize='none'
                disabled={isLoading || isOAuthLoading !== null}
              />

              <Input
                label='Password'
                value={password}
                onChangeText={setPassword}
                placeholder='Create a password'
                secureTextEntry
                disabled={isLoading || isOAuthLoading !== null}
              />

              <Input
                label='Confirm Password'
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder='Confirm your password'
                secureTextEntry
                disabled={isLoading || isOAuthLoading !== null}
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
              disabled={isLoading || isOAuthLoading !== null}
              variant='primary'
              style={{
                width: '100%',
                marginTop: Spacing[2],
                opacity: isLoading || isOAuthLoading !== null ? 0.7 : 1,
              }}
            />
          </Card>

          {/* Sign In Link */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: Spacing[4],
              marginBottom: Spacing[4],
            }}
          >
            <Paragraph size='medium'>Already have an account? </Paragraph>
            <TextLink href='/(auth)/login' label='Sign In' />
          </View>

          {/* Loading indicator for OAuth */}
          {isOAuthLoading && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.3)',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000,
              }}
            >
              <View
                style={{
                  backgroundColor: isDarkMode ? Colors.gray[800] : 'white',
                  padding: Spacing[6],
                  borderRadius: 12,
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: {
                    width: 0,
                    height: 2,
                  },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                  elevation: 5,
                }}
              >
                <Paragraph style={{ marginBottom: Spacing[2] }}>
                  Signing up with {isOAuthLoading}...
                </Paragraph>
                <Paragraph
                  size='small'
                  style={{
                    color: isDarkMode ? Colors.gray[400] : Colors.gray[600],
                    textAlign: 'center',
                  }}
                >
                  You may be redirected to your browser
                </Paragraph>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
