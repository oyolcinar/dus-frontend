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
import {
  Button,
  Input,
  TextLink,
  Title,
  Paragraph,
  Card,
  Alert,
  GlassCard,
} from '../../components/ui';
import { PlayfulButton, PlayfulCard } from '../../components/ui';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const { signIn, signInWithGoogle, signInWithApple, signInWithFacebook } =
    useAuth();

  const handleLogin = async () => {
    setError(null);

    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }

    try {
      setIsLoading(true);
      await signIn(email, password);
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = async (
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
        error.message || `${provider} login failed. Please try again.`;
      setError(errorMessage);
    } finally {
      setIsOAuthLoading(null);
    }
  };

  const isDarkMode = colorScheme === 'dark';

  // Fix: Ensure gradient colors are properly typed for LinearGradient
  const gradientColors = Colors.gradients?.sky || [
    Colors.primary.DEFAULT,
    Colors.primary.light,
  ];

  // Safely convert to the required tuple type
  const linearGradientColors =
    Array.isArray(gradientColors) && gradientColors.length >= 2
      ? ([
          gradientColors[0],
          gradientColors[1],
          ...(gradientColors.slice(2) || []),
        ] as readonly [string, string, ...string[]])
      : ([Colors.primary.DEFAULT, Colors.primary.light] as readonly [
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
                variant='gradient'
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
                gradient='purple'
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
                DUS Exam Prep
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
                Master your dental exams with confidence
              </Text>
            </View>

            {/* OAuth Login Options */}
            <GlassCard
              style={{ marginBottom: Spacing[4] }}
              tint='light'
              blurIntensity={15}
              borderGlow={true}
              glowColor={Colors.vibrant?.purpleLight}
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
                Quick Sign In
              </Text>

              <PlayfulButton
                title={
                  isOAuthLoading === 'google'
                    ? 'Signing in...'
                    : 'Continue with Google'
                }
                onPress={() => handleOAuthLogin('google')}
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
                    ? 'Signing in...'
                    : 'Continue with Apple'
                }
                onPress={() => handleOAuthLogin('apple')}
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
                    ? 'Signing in...'
                    : 'Continue with Facebook'
                }
                onPress={() => handleOAuthLogin('facebook')}
                variant='gradient'
                gradient='facebook'
                disabled={isOAuthLoading !== null || isLoading}
                size='medium'
                animated={true}
                wiggleOnPress={true}
              />

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
                  or continue with email
                </Text>
                <View
                  style={{
                    flex: 1,
                    height: 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  }}
                />
              </View>
            </GlassCard>

            {/* Email/Password Login Form */}
            <GlassCard
              tint='light'
              blurIntensity={15}
              borderGlow={true}
              glowColor={Colors.vibrant?.orange}
            >
              <View style={{ marginBottom: Spacing[4] }}>
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
                    backgroundColor: Colors.white,
                    borderRadius: BorderRadius.lg,
                    borderWidth: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.1)',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 1,
                    shadowRadius: 4,
                    elevation: 3,
                    minHeight: 50,
                  }}
                  labelStyle={{
                    color: Colors.gray[700],
                    fontWeight: '600',
                    marginBottom: Spacing[2],
                  }}
                  inputStyle={{
                    color: Colors.gray[800],
                    fontSize: 16,
                  }}
                />

                <Input
                  label='Password'
                  value={password}
                  onChangeText={setPassword}
                  placeholder='Enter your password'
                  secureTextEntry
                  disabled={isLoading || isOAuthLoading !== null}
                  leftIcon='lock'
                  containerStyle={{
                    backgroundColor: Colors.white,
                    borderRadius: BorderRadius.lg,
                    borderWidth: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.1)',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 1,
                    shadowRadius: 4,
                    elevation: 3,
                    minHeight: 50,
                  }}
                  labelStyle={{
                    color: Colors.gray[700],
                    fontWeight: '600',
                    marginBottom: Spacing[2],
                  }}
                  inputStyle={{
                    color: Colors.gray[800],
                    fontSize: 16,
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

              {/* Forgot password link */}
              <View
                style={{ marginBottom: Spacing[4], alignItems: 'flex-end' }}
              >
                <TextLink
                  href='/(auth)/forgot-password'
                  label='Forgot password?'
                  style={{
                    color: Colors.vibrant?.purple || Colors.primary.DEFAULT,
                    fontWeight: '600',
                  }}
                />
              </View>

              <PlayfulButton
                title={isLoading ? 'Signing in...' : 'Sign In with Email'}
                onPress={handleLogin}
                disabled={isLoading || isOAuthLoading !== null}
                variant='vibrant'
                gradient='purple'
                size='medium'
                loading={isLoading}
                style={{ width: '100%' }}
                animated={true}
                glowEffect={true}
                wiggleOnPress={true}
              />
            </GlassCard>

            {/* Sign Up Link */}
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
                Don't have an account?
              </Text>
              <TextLink
                href='/(auth)/register'
                label=' Sign Up'
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
