import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import {
  View,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  useColorScheme,
  Text,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';

// 🚀 UPDATED: Use new integrated auth hooks
import { useAuth, useTheme } from '../../stores/appStore';
import { useUserData } from '../../src/hooks/useAppData';

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
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  FontFamilies,
} from '../../constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const colorScheme = useColorScheme();
  const videoRef = useRef<Video>(null);

  // 🚀 UPDATED: Use integrated auth store with authService
  const {
    user,
    isAuthenticated,
    isLoading,
    error: authError,
    isOAuthLoading,
    oauthProvider,
    signIn,
    signInWithGoogle,
    signInWithApple,
    signInWithFacebook,
    clearError,
  } = useAuth();

  // 🚀 NEW: Use theme hook
  const { theme, isDark } = useTheme();

  // 🚀 NEW: User data hook (React Query result)
  const userDataQuery = useUserData();

  const logoVideo = require('../../assets/videos/heyecanli.mp4');

  const isDarkMode = useMemo(
    () => isDark || colorScheme === 'dark',
    [isDark, colorScheme],
  );

  // Memoize gradient colors calculation
  const linearGradientColors = useMemo(() => {
    const gradientColors = Colors.gradients?.sky || [
      Colors.primary.DEFAULT,
      Colors.primary.light,
    ];

    return Array.isArray(gradientColors) && gradientColors.length >= 2
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
  }, []);

  // 🚀 REMOVED: Don't initialize from login screen - should be done at app level
  // The app initialization should happen in the root layout, not individual screens

  // Video cleanup
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.pauseAsync();
      }
    };
  }, []);

  // 🚀 UPDATED: Clear error when inputs change
  useEffect(() => {
    if (authError) {
      clearError();
    }
  }, [email, password, clearError]);

  // 🚀 UPDATED: Handle login with enhanced error handling
  const handleLogin = useCallback(async () => {
    if (!email || !password) {
      return;
    }

    try {
      clearError();
      await signIn(email, password);

      console.log('Login successful');
    } catch (error: any) {
      // Error is automatically handled by the store
      console.error('Login error:', error);
    }
  }, [email, password, signIn, clearError]);

  // 🚀 UPDATED: OAuth login handlers using integrated auth store
  const handleOAuthLogin = useCallback(
    async (provider: 'google' | 'apple' | 'facebook') => {
      try {
        // 🚀 UPDATED: Use auth store methods that integrate with authService
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
          default:
            throw new Error(`Unsupported OAuth provider: ${provider}`);
        }

        console.log(`${provider} OAuth flow initiated via auth store`);
      } catch (error: any) {
        console.error(`${provider} OAuth error:`, error);

        // Only log error if it's not a user cancellation
        // Error handling is managed by the auth store
        if (!error.message?.includes('cancelled')) {
          console.warn(`${provider} OAuth failed:`, error.message);
        }
      }
    },
    [signInWithGoogle, signInWithApple, signInWithFacebook],
  );

  const isDisabled = useMemo(
    () => isLoading || isOAuthLoading,
    [isLoading, isOAuthLoading],
  );

  // 🚀 NEW: Validation helper
  const canSubmit = useMemo(
    () => email.trim() && password.trim() && !isDisabled,
    [email, password, isDisabled],
  );

  return (
    <View style={styles.container}>
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
        style={styles.gradient}
      />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps='handled'
            showsVerticalScrollIndicator={false}
          >
            {/* Logo and Title */}
            <View style={styles.logoContainer}>
              <PlayfulCard
                variant='gradient'
                style={styles.logoCard}
                contentContainerStyle={styles.logoCardContent}
                animated={true}
                floatingAnimation={true}
                gradient='purple'
              >
                <Video
                  ref={videoRef}
                  source={logoVideo}
                  style={styles.logoVideo}
                  shouldPlay={true}
                  isLooping={true}
                  isMuted={true}
                  resizeMode={ResizeMode.COVER}
                  useNativeControls={false}
                  usePoster={false}
                />
              </PlayfulCard>

              <Text style={styles.titleText}>DUSPORT</Text>

              <Text style={styles.subtitleText}>
                Diş hekimliği sınavlarınızda güvenle başarılı olun
              </Text>
            </View>

            {/* OAuth Login Options */}
            <GlassCard
              style={styles.oauthCard}
              tint='light'
              blurIntensity={15}
              borderGlow={true}
              glowColor={Colors.vibrant?.purpleLight}
              shimmerEffect={true}
            >
              <Text style={styles.quickLoginTitle}>Hızlı Giriş</Text>

              <PlayfulButton
                title={
                  isOAuthLoading && oauthProvider === 'google'
                    ? 'Giriş yapılıyor...'
                    : 'Google'
                }
                icon='google'
                onPress={() => handleOAuthLogin('google')}
                variant='vibrant'
                gradient='google'
                disabled={isDisabled}
                size='medium'
                style={styles.oauthButton}
                animated={true}
                wiggleOnPress={true}
              />

              <PlayfulButton
                title={
                  isOAuthLoading && oauthProvider === 'apple'
                    ? 'Giriş yapılıyor...'
                    : 'Apple'
                }
                icon='apple'
                onPress={() => handleOAuthLogin('apple')}
                variant='vibrant'
                gradient={isDarkMode ? 'appleDark' : 'appleDark'}
                disabled={isDisabled}
                size='medium'
                style={styles.oauthButton}
                animated={true}
                wiggleOnPress={true}
              />

              <PlayfulButton
                title={
                  isOAuthLoading && oauthProvider === 'facebook'
                    ? 'Giriş yapılıyor...'
                    : 'Facebook'
                }
                icon='facebook'
                onPress={() => handleOAuthLogin('facebook')}
                variant='vibrant'
                gradient='facebook'
                disabled={isDisabled}
                size='medium'
                animated={true}
                wiggleOnPress={true}
              />

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>
                  veya e-posta ile devam et
                </Text>
                <View style={styles.dividerLine} />
              </View>
            </GlassCard>

            {/* Email/Password Login Form */}
            <GlassCard
              tint='light'
              blurIntensity={15}
              borderGlow={true}
              glowColor={Colors.vibrant?.orange}
            >
              <View style={styles.inputContainer}>
                <Input
                  label='E-posta'
                  value={email}
                  onChangeText={setEmail}
                  placeholder='E-posta adresinizi girin'
                  inputMode='email'
                  autoCapitalize='none'
                  disabled={isDisabled}
                  leftIcon='envelope'
                  containerStyle={styles.inputFieldContainer}
                  labelStyle={styles.inputLabel}
                  inputStyle={styles.inputField}
                />

                <Input
                  label='Şifre'
                  value={password}
                  onChangeText={setPassword}
                  placeholder='Şifrenizi girin'
                  secureTextEntry
                  disabled={isDisabled}
                  leftIcon='lock'
                  containerStyle={styles.inputFieldContainer}
                  labelStyle={styles.inputLabel}
                  inputStyle={styles.inputField}
                />
              </View>

              {/* 🚀 UPDATED: Display error message with enhanced formatting */}
              {authError && (
                <Alert
                  type='error'
                  message={authError}
                  style={styles.errorAlert}
                  dismissible={true}
                  onDismiss={clearError}
                />
              )}

              {/* 🚀 NEW: Show validation hint */}
              {!canSubmit && (email || password) && (
                <Text style={styles.validationHint}>
                  Lütfen e-posta ve şifrenizi girin
                </Text>
              )}

              {/* Forgot password link */}
              <View style={styles.forgotPasswordContainer}>
                <TextLink
                  href='/(auth)/forgot-password'
                  label='Şifremi unuttum?'
                  style={styles.forgotPasswordLink}
                />
              </View>

              <PlayfulButton
                title={
                  isLoading ? 'Giriş yapılıyor...' : 'E-posta ile Giriş Yap'
                }
                onPress={handleLogin}
                disabled={!canSubmit}
                variant='vibrant'
                gradient='purple'
                size='medium'
                loading={isLoading}
                style={[
                  styles.loginButton,
                  !canSubmit && styles.loginButtonDisabled,
                ]}
                animated={true}
                glowEffect={!!canSubmit}
                fontFamily='SecondaryFont-Bold'
                wiggleOnPress={true}
              />
            </GlassCard>

            {/* Sign Up Link */}
            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Hesabınız yok mu?</Text>
              <TextLink
                href='/(auth)/register'
                label=' Kayıt Ol'
                style={styles.signUpLink}
                touchableProps={{
                  style: styles.signUpTouchable,
                }}
              />
            </View>

            {/* 🚀 NEW: Debug info (remove in production) */}
            {/* {__DEV__ && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugText}>
                  Auth: {isAuthenticated ? 'Yes' : 'No'} | Loading:{' '}
                  {isLoading ? 'Yes' : 'No'} | OAuth:{' '}
                  {isOAuthLoading ? oauthProvider || 'Yes' : 'No'} | User:{' '}
                  {userDataQuery.data?.username || user?.username || 'None'}
                </Text>
              </View>
            )} */}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: Spacing[6],
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: Spacing[8],
  },
  logoCard: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[4],
    alignContent: 'center',
  },
  logoCardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    alignContent: 'center',
  },
  logoVideo: {
    width: 247,
    height: 247,
    borderRadius: 20,
  },
  titleText: {
    ...Typography.h1,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitleText: {
    ...Typography.bodyLarge,
    color: Colors.white,
    textAlign: 'center',
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  oauthCard: {
    marginBottom: Spacing[4],
  },
  quickLoginTitle: {
    ...Typography.h4,
    textAlign: 'center',
    marginBottom: Spacing[4],
    color: Colors.neutral?.darkGray || Colors.gray[700],
  },
  oauthButton: {
    marginBottom: 12,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing[4],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dividerText: {
    ...Typography.bodySmall,
    marginHorizontal: Spacing[3],
    color: Colors.white,
    opacity: 0.8,
  },
  inputContainer: {
    marginBottom: Spacing[4],
  },
  inputFieldContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 0,
    shadowColor: Colors.gray[900],
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    minHeight: 50,
  },
  inputLabel: {
    ...Typography.caption,
    color: Colors.gray[700],
    fontFamily: FontFamilies.secondary.bold,
    marginBottom: Spacing[2],
  },
  inputField: {
    ...Typography.body,
    color: Colors.gray[800],
    // Custom font fixes for iOS
    ...(Platform.OS === 'ios' && {
      fontFamily: FontFamilies.primary.regular,
      lineHeight: Typography.body.fontSize * 1.2,
      paddingTop: 2,
      paddingBottom: -2,
    }),
  },
  errorAlert: {
    marginBottom: Spacing[4],
  },
  // 🚀 NEW: Validation hint styling
  validationHint: {
    ...Typography.caption,
    color: Colors.vibrant?.orange || '#ff9500',
    textAlign: 'center',
    marginBottom: Spacing[3],
    fontStyle: 'italic',
  },
  forgotPasswordContainer: {
    marginBottom: Spacing[4],
    alignItems: 'flex-end',
  },
  forgotPasswordLink: {
    ...Typography.bodySmall,
    color: Colors.vibrant?.purple || Colors.primary.DEFAULT,
    fontFamily: FontFamilies.secondary.bold,
  },
  loginButton: {
    width: '100%',
  },
  // 🚀 NEW: Disabled button styling
  loginButtonDisabled: {
    opacity: 0.6,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    marginTop: Spacing[4],
    marginBottom: Spacing[4],
  },
  signUpText: {
    ...Typography.bodyLarge,
    color: Colors.white,
    opacity: 0.9,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  signUpLink: {
    ...Typography.bodyLarge,
    color: Colors.vibrant?.yellow || '#ffeb3b',
    fontFamily: FontFamilies.secondary.bold,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  signUpTouchable: {
    paddingVertical: 0,
    marginVertical: 0,
  },
  // 🚀 NEW: Debug styles (remove in production)
  debugContainer: {
    marginTop: Spacing[4],
    padding: Spacing[3],
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: BorderRadius.md,
  },
  debugText: {
    ...Typography.caption,
    color: Colors.white,
    textAlign: 'center',
  },
});
