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
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';

// 🚀 UPDATED: Use new integrated auth hooks
import { useAuth, useTheme } from '../../stores/appStore';
import { useUserData } from '../../src/hooks/useAppData';

import { Button, Input, TextLink, Alert } from '../../components/ui';
import { PlayfulButton, GlassCard, PlayfulCard } from '../../components/ui';
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  FontFamilies,
} from '../../constants/theme';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
    register,
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
    const gradientColors = Colors.gradients?.tropical || [
      Colors.vibrant?.green || '#4caf50',
      Colors.vibrant?.mint || Colors.primary.DEFAULT,
    ];

    return Array.isArray(gradientColors) && gradientColors.length >= 2
      ? ([
          gradientColors[0],
          gradientColors[1],
          ...(gradientColors.slice(2) || []),
        ] as readonly [string, string, ...string[]])
      : (['#4caf50', Colors.primary.DEFAULT] as readonly [
          string,
          string,
          ...string[],
        ]);
  }, []);

  // 🚀 REMOVED: Don't initialize from register screen - should be done at app level
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
  }, [username, email, password, confirmPassword, clearError]);

  // 🚀 NEW: Form validation
  const validationError = useMemo(() => {
    if (!username || !email || !password || !confirmPassword) {
      return 'Lütfen tüm alanları doldurun';
    }
    if (password !== confirmPassword) {
      return 'Şifreler eşleşmiyor';
    }
    if (password.length < 6) {
      return 'Şifre en az 6 karakter olmalıdır';
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return 'Geçerli bir e-posta adresi girin';
    }
    return null;
  }, [username, email, password, confirmPassword]);

  // 🚀 UPDATED: Handle registration with enhanced error handling
  const handleRegister = useCallback(async () => {
    if (validationError) {
      return;
    }

    try {
      clearError();
      await register(username, email, password);

      console.log('Registration successful');
    } catch (error: any) {
      // Error is automatically handled by the store
      console.error('Registration error:', error);
    }
  }, [username, email, password, register, clearError, validationError]);

  // 🚀 UPDATED: OAuth registration handlers using integrated auth store
  const handleOAuthSignUp = useCallback(
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

        console.log(
          `${provider} OAuth registration flow initiated via auth store`,
        );
      } catch (error: any) {
        console.error(`${provider} OAuth error:`, error);

        // Only log error if it's not a user cancellation
        // Error handling is managed by the auth store
        if (!error.message?.includes('cancelled')) {
          console.warn(`${provider} OAuth registration failed:`, error.message);
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
    () => !validationError && !isDisabled,
    [validationError, isDisabled],
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
                variant='playful'
                style={styles.logoCard}
                contentContainerStyle={styles.logoCardContent}
                animated={true}
                floatingAnimation={true}
                pulseEffect={true}
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

              <Text style={styles.titleText}>
                DUSPORT ile Sınav Hazırlığına Katıl
              </Text>

              <Text style={styles.subtitleText}>
                Diş hekimliği sınav başarınıza giden yolculuğa başlayın
              </Text>
            </View>

            {/* OAuth Sign Up Options */}
            <GlassCard
              style={styles.oauthCard}
              tint='light'
              blurIntensity={15}
              borderGlow={true}
              glowColor={Colors.vibrant?.greenLight}
              shimmerEffect={true}
            >
              <Text style={styles.quickSignUpTitle}>Hızlı Kayıt</Text>

              <PlayfulButton
                title={
                  isOAuthLoading && oauthProvider === 'google'
                    ? 'Kayıt oluyor...'
                    : 'Google'
                }
                icon='google'
                onPress={() => handleOAuthSignUp('google')}
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
                    ? 'Kayıt oluyor...'
                    : 'Apple'
                }
                icon='apple'
                onPress={() => handleOAuthSignUp('apple')}
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
                    ? 'Kayıt oluyor...'
                    : 'Facebook'
                }
                icon='facebook'
                onPress={() => handleOAuthSignUp('facebook')}
                variant='vibrant'
                gradient='facebook'
                disabled={isDisabled}
                size='medium'
                animated={true}
                wiggleOnPress={true}
              />
            </GlassCard>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>
                veya e-posta ile hesap oluştur
              </Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Email/Password Registration Form */}
            <GlassCard
              tint='light'
              blurIntensity={15}
              borderGlow={true}
              glowColor={Colors.vibrant?.coral}
            >
              <View style={styles.inputContainer}>
                <Input
                  label='Kullanıcı Adı'
                  value={username}
                  onChangeText={setUsername}
                  placeholder='Kullanıcı adınızı girin'
                  disabled={isDisabled}
                  leftIcon='user'
                  containerStyle={styles.inputFieldContainer}
                  labelStyle={styles.inputLabel}
                  inputStyle={styles.inputField}
                />

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
                  placeholder='Şifre oluşturun (en az 6 karakter)'
                  secureTextEntry
                  disabled={isDisabled}
                  leftIcon='lock'
                  containerStyle={styles.inputFieldContainer}
                  labelStyle={styles.inputLabel}
                  inputStyle={styles.inputField}
                />

                <Input
                  label='Şifre Tekrarı'
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder='Şifrenizi tekrar girin'
                  secureTextEntry
                  disabled={isDisabled}
                  leftIcon='lock'
                  containerStyle={styles.inputFieldContainer}
                  labelStyle={styles.inputLabel}
                  inputStyle={styles.inputField}
                />
              </View>

              {/* 🚀 UPDATED: Display error message with enhanced formatting */}
              {(authError || validationError) && (
                <Alert
                  type='error'
                  message={authError || validationError || ''}
                  style={styles.errorAlert}
                  dismissible={!!authError}
                  onDismiss={authError ? clearError : undefined}
                />
              )}

              {/* 🚀 NEW: Show validation hint for incomplete forms */}
              {!canSubmit &&
                (username || email || password || confirmPassword) &&
                !validationError && (
                  <Text style={styles.validationHint}>
                    Lütfen tüm alanları doldurun
                  </Text>
                )}

              <PlayfulButton
                title={isLoading ? 'Hesap Oluşturuluyor...' : 'Hesap Oluştur'}
                onPress={handleRegister}
                disabled={!canSubmit}
                variant='vibrant'
                gradient='tropical'
                size='medium'
                fontFamily='SecondaryFont-Bold'
                loading={isLoading}
                style={[
                  styles.registerButton,
                  !canSubmit && styles.registerButtonDisabled,
                ]}
                animated={true}
                glowEffect={!!canSubmit}
                wiggleOnPress={true}
              />
            </GlassCard>

            {/* Sign In Link */}
            <View style={styles.signInContainer}>
              <Text style={styles.signInText}>Zaten hesabınız var mı?</Text>
              <TextLink
                href='/(auth)/login'
                label=' Giriş Yap'
                style={styles.signInLink}
                touchableProps={{
                  style: styles.signInTouchable,
                }}
              />
            </View>

            {/* 🚀 NEW: Debug info (remove in production) */}
            {__DEV__ && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugText}>
                  Auth: {isAuthenticated ? 'Yes' : 'No'} | Loading:{' '}
                  {isLoading ? 'Yes' : 'No'} | OAuth:{' '}
                  {isOAuthLoading ? oauthProvider || 'Yes' : 'No'} | User:{' '}
                  {userDataQuery.data?.username || user?.username || 'None'} |
                  CanSubmit: {canSubmit ? 'Yes' : 'No'}
                </Text>
              </View>
            )}
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
  quickSignUpTitle: {
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
      paddingBottom: -3,
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
  registerButton: {
    width: '100%',
    marginTop: Spacing[2],
  },
  // 🚀 NEW: Disabled button styling
  registerButtonDisabled: {
    opacity: 0.6,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    marginTop: Spacing[4],
    marginBottom: Spacing[4],
  },
  signInText: {
    ...Typography.bodyLarge,
    color: Colors.white,
    opacity: 0.9,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  signInLink: {
    ...Typography.bodyLarge,
    color: Colors.vibrant?.yellow || '#ffeb3b',
    fontFamily: FontFamilies.secondary.bold,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  signInTouchable: {
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
