import React, { useState } from 'react';
import {
  View,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  useColorScheme,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, TextLink, Alert } from '../../components/ui';
import { PlayfulButton, GlassCard, PlayfulCard } from '../../components/ui';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';

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
    } catch (error: any) {
      console.error(`${provider} OAuth error:`, error);
      const errorMessage =
        error.message || `${provider} sign up failed. Please try again.`;
      setError(errorMessage);
    } finally {
      setIsOAuthLoading(null);
    }
  };

  const isDarkMode = colorScheme === 'dark';

  // Fix: Ensure gradient colors are properly typed for LinearGradient
  const gradientColors = Colors.gradients?.tropical || [
    Colors.vibrant?.green || Colors.success,
    Colors.vibrant?.mint || Colors.primary.DEFAULT,
  ];

  // Safely convert to the required tuple type
  const linearGradientColors =
    Array.isArray(gradientColors) && gradientColors.length >= 2
      ? ([
          gradientColors[0],
          gradientColors[1],
          ...(gradientColors.slice(2) || []),
        ] as readonly [string, string, ...string[]])
      : ([Colors.success, Colors.primary.DEFAULT] as readonly [
          string,
          string,
          ...string[],
        ]);

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* Animated Background Gradient */}
      <LinearGradient
        colors={linearGradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            style={{ flex: 1, paddingHorizontal: Spacing[6] }}
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
            keyboardShouldPersistTaps='handled'
            showsVerticalScrollIndicator={false}
          >
            {/* Logo and Title */}
            <View style={{ alignItems: 'center', marginVertical: Spacing[8] }}>
              <PlayfulCard
                variant='playful'
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: Spacing[4],
                }}
                animated={true}
                floatingAnimation={true}
                pulseEffect={true}
              >
                <Text
                  style={{
                    fontSize: 36,
                    fontWeight: '900',
                    color: Colors.white,
                    textAlign: 'center',
                  }}
                >
                  D
                </Text>
              </PlayfulCard>

              <Text
                style={{
                  fontSize: 28,
                  fontWeight: '800',
                  color: Colors.white,
                  textAlign: 'center',
                  marginBottom: 4,
                  textShadowColor: 'rgba(0, 0, 0, 0.3)',
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 4,
                }}
              >
                Join DUS Exam Prep
              </Text>

              <Text
                style={{
                  fontSize: 16,
                  color: Colors.white,
                  textAlign: 'center',
                  opacity: 0.9,
                  textShadowColor: 'rgba(0, 0, 0, 0.2)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 2,
                }}
              >
                Start your journey to dental exam success
              </Text>
            </View>

            {/* OAuth Sign Up Options */}
            <GlassCard
              style={{ marginBottom: Spacing[4] }}
              tint='light'
              blurIntensity={15}
              borderGlow={true}
              glowColor={Colors.vibrant?.greenLight}
              shimmerEffect={true}
            >
              <Text
                style={{
                  textAlign: 'center',
                  marginBottom: Spacing[4],
                  fontWeight: '600',
                  fontSize: 16,
                  color: Colors.neutral?.darkGray || Colors.gray[700],
                }}
              >
                Quick Sign Up
              </Text>

              <PlayfulButton
                title={
                  isOAuthLoading === 'google'
                    ? 'Signing up...'
                    : 'Continue with Google'
                }
                onPress={() => handleOAuthSignUp('google')}
                variant='gradient'
                gradient='google'
                disabled={isOAuthLoading !== null || isLoading}
                size='medium'
                style={{ marginBottom: 12 }}
                animated={true}
                wiggleOnPress={true}
              />

              <PlayfulButton
                title={
                  isOAuthLoading === 'apple'
                    ? 'Signing up...'
                    : 'Continue with Apple'
                }
                onPress={() => handleOAuthSignUp('apple')}
                variant='gradient'
                gradient={isDarkMode ? 'appleLight' : 'appleDark'}
                disabled={isOAuthLoading !== null || isLoading}
                size='medium'
                style={{ marginBottom: 12 }}
                animated={true}
                wiggleOnPress={true}
              />

              <PlayfulButton
                title={
                  isOAuthLoading === 'facebook'
                    ? 'Signing up...'
                    : 'Continue with Facebook'
                }
                onPress={() => handleOAuthSignUp('facebook')}
                variant='gradient'
                gradient='facebook'
                disabled={isOAuthLoading !== null || isLoading}
                size='medium'
                animated={true}
                wiggleOnPress={true}
              />
            </GlassCard>

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
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                }}
              />
              <Text
                style={{
                  marginHorizontal: Spacing[3],
                  color: Colors.white,
                  fontSize: 14,
                  opacity: 0.8,
                }}
              >
                or create account with email
              </Text>
              <View
                style={{
                  flex: 1,
                  height: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                }}
              />
            </View>

            {/* Email/Password Registration Form */}
            <GlassCard
              tint='light'
              blurIntensity={15}
              borderGlow={true}
              glowColor={Colors.vibrant?.coral}
            >
              <View style={{ marginBottom: Spacing[4] }}>
                <Input
                  label='Username'
                  value={username}
                  onChangeText={setUsername}
                  placeholder='Enter your username'
                  disabled={isLoading || isOAuthLoading !== null}
                  leftIcon='user'
                  containerStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: BorderRadius.lg,
                  }}
                />

                <Input
                  label='Email'
                  value={email}
                  onChangeText={setEmail}
                  placeholder='Enter your email'
                  inputMode='email'
                  autoCapitalize='none'
                  disabled={isLoading || isOAuthLoading !== null}
                  leftIcon='envelope'
                  containerStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: BorderRadius.lg,
                  }}
                />

                <Input
                  label='Password'
                  value={password}
                  onChangeText={setPassword}
                  placeholder='Create a password'
                  secureTextEntry
                  disabled={isLoading || isOAuthLoading !== null}
                  leftIcon='lock'
                  containerStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: BorderRadius.lg,
                  }}
                />

                <Input
                  label='Confirm Password'
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder='Confirm your password'
                  secureTextEntry
                  disabled={isLoading || isOAuthLoading !== null}
                  leftIcon='lock'
                  containerStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: BorderRadius.lg,
                  }}
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

              <PlayfulButton
                title={isLoading ? 'Creating Account...' : 'Create Account'}
                onPress={handleRegister}
                disabled={isLoading || isOAuthLoading !== null}
                variant='vibrant'
                gradient='tropical'
                size='medium'
                loading={isLoading}
                style={{
                  width: '100%',
                  marginTop: Spacing[2],
                }}
                animated={true}
                glowEffect={true}
                wiggleOnPress={true}
              />
            </GlassCard>

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
              <Text
                style={{
                  fontSize: 16,
                  color: Colors.white,
                  opacity: 0.9,
                }}
              >
                Already have an account?
              </Text>
              <TextLink
                href='/(auth)/login'
                label=' Sign In'
                style={{
                  color: Colors.vibrant?.yellow || Colors.secondary.light,
                  fontWeight: '700',
                  fontSize: 16,
                  textShadowColor: 'rgba(0, 0, 0, 0.3)',
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 2,
                }}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
