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
  Animated,
  Dimensions,
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

const { width: screenWidth } = Dimensions.get('window');

// 🚀 HIGH PERFORMANCE: Toast without state - only refs and callbacks
interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'error' | 'success' | 'warning' | 'info';
  onDismiss?: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = 'error',
  onDismiss,
  duration = 4000,
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const isVisible = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible && !isVisible.current) {
      isVisible.current = true;

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Show animation
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss
      timeoutRef.current = setTimeout(() => {
        hideToast();
      }, duration);
    } else if (!visible && isVisible.current) {
      hideToast();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible, duration]);

  const hideToast = useCallback(() => {
    if (!isVisible.current) return;

    isVisible.current = false;

    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onDismiss) onDismiss();
    });
  }, [translateY, opacity, onDismiss]);

  const getToastColors = () => {
    switch (type) {
      case 'error':
        return {
          background: Colors.vibrant?.pink || '#e91e63',
          border: Colors.vibrant?.pinkLight || '#f8bbd9',
          icon: '❌',
        };
      case 'success':
        return {
          background: Colors.vibrant?.green || '#4caf50',
          border: Colors.vibrant?.greenLight || '#c8e6c9',
          icon: '✅',
        };
      case 'warning':
        return {
          background: Colors.vibrant?.orange || '#ff9800',
          border: Colors.vibrant?.orangeLight || '#ffe0b3',
          icon: '⚠️',
        };
      case 'info':
        return {
          background: Colors.vibrant?.blue || '#2196f3',
          border: Colors.vibrant?.blueLight || '#bbdefb',
          icon: 'ℹ️',
        };
      default:
        return {
          background: Colors.vibrant?.pink || '#e91e63',
          border: Colors.vibrant?.pinkLight || '#f8bbd9',
          icon: '❌',
        };
    }
  };

  const colors = getToastColors();

  // Direct render - no state-based conditions
  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          transform: [{ translateY }],
          opacity,
          backgroundColor: colors.background,
          borderColor: colors.border,
        },
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <View style={styles.toastContent}>
        <Text style={styles.toastIcon}>{colors.icon}</Text>
        <Text style={styles.toastMessage} numberOfLines={2}>
          {message}
        </Text>
        <Text style={styles.toastDismiss} onPress={hideToast}>
          ✕
        </Text>
      </View>
    </Animated.View>
  );
};

// 🚀 EFFICIENT: Hook without complex state management
const useToast = () => {
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'error' | 'success' | 'warning' | 'info';
  }>({
    visible: false,
    message: '',
    type: 'error',
  });

  const showToast = useCallback(
    (
      message: string,
      type: 'error' | 'success' | 'warning' | 'info' = 'error',
    ) => {
      setToast({
        visible: true,
        message,
        type,
      });
    },
    [],
  );

  const hideToast = useCallback(() => {
    setToast((prev) => ({
      ...prev,
      visible: false,
    }));
  }, []);

  return {
    toast,
    showToast,
    hideToast,
  };
};

// 🚀 OPTIMIZED: Error message mapping
const getLoginErrorMessage = (error: string): string => {
  const errorLower = error.toLowerCase();

  if (errorLower.includes('invalid') && errorLower.includes('credential')) {
    return 'E-posta veya şifre hatalı. Lütfen kontrol edip tekrar deneyin.';
  }

  if (errorLower.includes('too many requests')) {
    return 'Çok fazla giriş denemesi yaptınız. Lütfen biraz bekleyin ve tekrar deneyin.';
  }

  if (errorLower.includes('network') || errorLower.includes('connection')) {
    return 'İnternet bağlantısı sorunu. Bağlantınızı kontrol edip tekrar deneyin.';
  }

  if (
    errorLower.includes('email') &&
    errorLower.includes('not') &&
    errorLower.includes('confirmed')
  ) {
    return 'E-posta adresinizi doğrulayın. Gelen kutunuzu kontrol edin.';
  }

  if (
    errorLower.includes('user') &&
    errorLower.includes('not') &&
    errorLower.includes('found')
  ) {
    return 'Bu e-posta adresi ile kayıtlı hesap bulunamadı.';
  }

  if (errorLower.includes('weak') && errorLower.includes('password')) {
    return 'Şifreniz çok zayıf. Daha güçlü bir şifre seçin.';
  }

  return error || 'Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.';
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const colorScheme = useColorScheme();
  const videoRef = useRef<Video>(null);

  const { toast, showToast, hideToast } = useToast();

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

  const { theme, isDark } = useTheme();
  const userDataQuery = useUserData();

  const logoVideo = require('../../assets/videos/heyecanli.mp4');

  const isDarkMode = useMemo(
    () => isDark || colorScheme === 'dark',
    [isDark, colorScheme],
  );

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

  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.pauseAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (authError) {
      const friendlyMessage = getLoginErrorMessage(authError);
      showToast(friendlyMessage, 'error');
      clearError();
    }
  }, [authError, showToast, clearError]);

  const handleLogin = useCallback(async () => {
    if (!email.trim() || !password.trim()) {
      showToast('Lütfen e-posta ve şifrenizi girin.', 'warning');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email.trim())) {
      showToast('Lütfen geçerli bir e-posta adresi girin.', 'warning');
      return;
    }

    try {
      await signIn(email.trim(), password);
      console.log('Login successful');
    } catch (error: any) {
      console.error('Login error:', error);
    }
  }, [email, password, signIn, showToast]);

  const handleOAuthLogin = useCallback(
    async (provider: 'google' | 'apple' | 'facebook') => {
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
          default:
            throw new Error(`Unsupported OAuth provider: ${provider}`);
        }

        console.log(`${provider} OAuth flow initiated via auth store`);
      } catch (error: any) {
        console.error(`${provider} OAuth error:`, error);

        if (
          !error.message?.includes('cancelled') &&
          !error.message?.includes('canceled')
        ) {
          const providerName =
            provider.charAt(0).toUpperCase() + provider.slice(1);
          showToast(
            `${providerName} ile giriş yapılamadı. Lütfen tekrar deneyin.`,
            'error',
          );
        }
      }
    },
    [signInWithGoogle, signInWithApple, signInWithFacebook, showToast],
  );

  const isDisabled = useMemo(
    () => isLoading || isOAuthLoading,
    [isLoading, isOAuthLoading],
  );

  const canSubmit = useMemo(() => {
    const emailTrimmed = email.trim();
    const passwordTrimmed = password.trim();

    return (
      emailTrimmed &&
      passwordTrimmed &&
      /\S+@\S+\.\S+/.test(emailTrimmed) &&
      !isDisabled
    );
  }, [email, password, isDisabled]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={hideToast}
        duration={5000}
      />

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

              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>
                  veya e-posta ile devam et
                </Text>
                <View style={styles.dividerLine} />
              </View>
            </GlassCard>

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
    ...(Platform.OS === 'ios' && {
      fontFamily: FontFamilies.primary.regular,
      lineHeight: Typography.body.fontSize * 1.2,
      paddingTop: 2,
      paddingBottom: -2,
    }),
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
  // HIGH PERFORMANCE Toast styles
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: Spacing[4],
    right: Spacing[4],
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    zIndex: 1000,
    elevation: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
  },
  toastIcon: {
    fontSize: 20,
    marginRight: Spacing[3],
  },
  toastMessage: {
    flex: 1,
    ...Typography.body,
    color: Colors.white,
    fontWeight: '500',
  },
  toastDismiss: {
    ...Typography.h4,
    color: Colors.white,
    marginLeft: Spacing[2],
    paddingHorizontal: Spacing[2],
    fontWeight: 'bold',
  },
});
