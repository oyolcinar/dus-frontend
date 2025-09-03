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

// 🚀 OPTIMIZED: Registration error message mapping
const getRegistrationErrorMessage = (error: string): string => {
  const errorLower = error.toLowerCase();

  if (
    errorLower.includes('already exists') ||
    errorLower.includes('already registered')
  ) {
    return 'Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin.';
  }

  if (errorLower.includes('weak password')) {
    return 'Şifre çok zayıf. Daha güçlü bir şifre oluşturun.';
  }

  if (errorLower.includes('invalid') && errorLower.includes('email')) {
    return 'Geçersiz e-posta adresi. Lütfen doğru formatta girin.';
  }

  if (errorLower.includes('too many requests')) {
    return 'Çok fazla kayıt denemesi. Lütfen biraz bekleyin ve tekrar deneyin.';
  }

  if (errorLower.includes('network') || errorLower.includes('connection')) {
    return 'İnternet bağlantısı sorunu. Bağlantınızı kontrol edip tekrar deneyin.';
  }

  if (errorLower.includes('username') && errorLower.includes('taken')) {
    return 'Bu kullanıcı adı alınmış. Farklı bir kullanıcı adı deneyin.';
  }

  if (errorLower.includes('email') && errorLower.includes('format')) {
    return 'E-posta adresi formatı hatalı. Örnek: ornek@email.com';
  }

  return error || 'Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.';
};

// Password strength calculation
const calculatePasswordStrength = (password: string) => {
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const criteriaCount = [
    hasUpperCase,
    hasLowerCase,
    hasNumbers,
    hasSpecialChars,
  ].filter(Boolean).length;

  return {
    hasUpperCase,
    hasLowerCase,
    hasNumbers,
    hasSpecialChars,
    criteriaCount,
    isStrong: criteriaCount >= 3 && password.length >= 8,
  };
};

// Password strength indicator component
const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  if (!password) return null;

  const strength = calculatePasswordStrength(password);
  const { criteriaCount } = strength;

  const getStrengthColor = () => {
    if (criteriaCount <= 1) return Colors.vibrant?.pink || '#e91e63';
    if (criteriaCount === 2) return Colors.vibrant?.orange || '#ff9800';
    if (criteriaCount === 3) return Colors.vibrant?.yellow || '#ffeb3b';
    return Colors.vibrant?.green || '#4caf50';
  };

  const getStrengthText = () => {
    if (criteriaCount <= 1) return 'Çok Zayıf';
    if (criteriaCount === 2) return 'Zayıf';
    if (criteriaCount === 3) return 'Orta';
    return 'Güçlü';
  };

  return (
    <View style={styles.strengthContainer}>
      <View style={styles.strengthBar}>
        {[1, 2, 3, 4].map((level) => (
          <View
            key={level}
            style={[
              styles.strengthSegment,
              {
                backgroundColor:
                  criteriaCount >= level
                    ? getStrengthColor()
                    : 'rgba(255, 255, 255, 0.3)',
              },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.strengthText, { color: getStrengthColor() }]}>
        {getStrengthText()}
      </Text>
    </View>
  );
};

// Password criteria checklist component
const PasswordCriteria = ({ password }: { password: string }) => {
  if (!password) return null;

  const strength = calculatePasswordStrength(password);

  const criteria = [
    {
      text: 'En az 8 karakter',
      met: password.length >= 8,
    },
    {
      text: 'Büyük harf (A-Z)',
      met: strength.hasUpperCase,
    },
    {
      text: 'Küçük harf (a-z)',
      met: strength.hasLowerCase,
    },
    {
      text: 'Rakam (0-9)',
      met: strength.hasNumbers,
    },
    {
      text: 'Özel karakter (!@#$...)',
      met: strength.hasSpecialChars,
    },
  ];

  return (
    <View style={styles.criteriaContainer}>
      <Text style={styles.criteriaTitle}>Şifre Gereksinimleri:</Text>
      {criteria.map((criterion, index) => (
        <View key={index} style={styles.criteriaItem}>
          <Text
            style={[
              styles.criteriaIcon,
              {
                color: criterion.met
                  ? Colors.vibrant?.green || '#4caf50'
                  : Colors.gray[400],
              },
            ]}
          >
            {criterion.met ? '✓' : '○'}
          </Text>
          <Text
            style={[
              styles.criteriaText,
              {
                color: criterion.met ? Colors.gray[700] : Colors.gray[500],
                textDecorationLine: criterion.met ? 'line-through' : 'none',
              },
            ]}
          >
            {criterion.text}
          </Text>
        </View>
      ))}
      <Text style={styles.criteriaNote}>* En az 3 kriter karşılanmalıdır</Text>
    </View>
  );
};

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordCriteria, setShowPasswordCriteria] = useState(false);
  const colorScheme = useColorScheme();
  const videoRef = useRef<Video>(null);

  // 🚀 NEW: Toast hook
  const { toast, showToast, hideToast } = useToast();

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
    signIn,
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

  // Video cleanup
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.pauseAsync();
      }
    };
  }, []);

  // 🚀 UPDATED: Show toast when auth error occurs
  useEffect(() => {
    if (authError) {
      const friendlyMessage = getRegistrationErrorMessage(authError);
      showToast(friendlyMessage, 'error');
      clearError(); // Clear the error from store immediately
    }
  }, [authError, showToast, clearError]);

  // 🚀 ENHANCED: Password validation matching backend requirements
  const passwordValidation = useMemo(() => {
    if (!password) return null;

    const strength = calculatePasswordStrength(password);
    const errors: string[] = [];

    // Length check
    if (password.length < 8) {
      errors.push('Şifre en az 8 karakter olmalıdır');
    }

    // Strength check - must have at least 3 of 4 criteria
    if (strength.criteriaCount < 3) {
      errors.push(
        'Şifre en az 3 farklı karakter türü içermelidir (büyük harf, küçük harf, rakam, özel karakter)',
      );
    }

    return errors.length > 0 ? errors : null;
  }, [password]);

  // 🚀 UPDATED: Enhanced form validation with toast integration
  const validationErrors = useMemo(() => {
    const errors: string[] = [];

    // Required field validation
    if (!username) errors.push('Kullanıcı adı gereklidir');
    if (!email) errors.push('E-posta gereklidir');
    if (!password) errors.push('Şifre gereklidir');
    if (!confirmPassword) errors.push('Şifre tekrarı gereklidir');

    // Email format validation
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      errors.push('Geçerli bir e-posta adresi girin');
    }

    // Username validation
    if (username && username.length < 3) {
      errors.push('Kullanıcı adı en az 3 karakter olmalıdır');
    }

    // Password validation
    if (password && passwordValidation) {
      errors.push(...passwordValidation);
    }

    // Password confirmation validation
    if (password && confirmPassword && password !== confirmPassword) {
      errors.push('Şifreler eşleşmiyor');
    }

    return errors;
  }, [username, email, password, confirmPassword, passwordValidation]);

  // 🚀 UPDATED: Handle registration with automatic login after success
  const handleRegister = useCallback(async () => {
    // Basic validation with toast feedback
    if (
      !username.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      showToast('Lütfen tüm alanları doldurun.', 'warning');
      return;
    }

    // Email validation
    if (!/\S+@\S+\.\S+/.test(email.trim())) {
      showToast('Lütfen geçerli bir e-posta adresi girin.', 'warning');
      return;
    }

    // Username validation
    if (username.trim().length < 3) {
      showToast('Kullanıcı adı en az 3 karakter olmalıdır.', 'warning');
      return;
    }

    // Password strength validation
    const strength = calculatePasswordStrength(password);
    if (!strength.isStrong) {
      showToast(
        'Şifre en az 8 karakter ve 3 farklı karakter türü içermelidir.',
        'warning',
      );
      return;
    }

    // Password confirmation
    if (password !== confirmPassword) {
      showToast('Şifreler eşleşmiyor. Lütfen kontrol edin.', 'warning');
      return;
    }

    try {
      // Step 1: Register the user
      console.log('Starting registration process...');
      await register(username.trim(), email.trim(), password);
      console.log('Registration successful, now signing in...');

      // Step 2: Automatically sign in the user after successful registration
      await signIn(email.trim(), password);
      console.log('Auto-login after registration successful');

      // Step 3: Show success message
      showToast('Hesabınız başarıyla oluşturuldu! Hoş geldiniz!', 'success');
    } catch (error: any) {
      console.error('Registration/Login error:', error);

      // If registration succeeded but login failed, show specific message
      if (error.message?.includes('login') || error.message?.includes('sign')) {
        showToast(
          'Hesabınız oluşturuldu ancak otomatik giriş yapılamadı. Lütfen manuel olarak giriş yapın.',
          'warning',
        );
      }
      // Error handling for registration failure is done via the useEffect above
    }
  }, [username, email, password, confirmPassword, register, signIn, showToast]);

  // 🚀 UPDATED: OAuth registration handlers with toast error handling
  const handleOAuthSignUp = useCallback(
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

        console.log(
          `${provider} OAuth registration flow initiated via auth store`,
        );
      } catch (error: any) {
        console.error(`${provider} OAuth error:`, error);

        // Show toast for OAuth errors (except user cancellation)
        if (
          !error.message?.includes('cancelled') &&
          !error.message?.includes('canceled')
        ) {
          const providerName =
            provider.charAt(0).toUpperCase() + provider.slice(1);
          showToast(
            `${providerName} ile kayıt oluşturulamadı. Lütfen tekrar deneyin.`,
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

  // 🚀 UPDATED: Enhanced can submit validation
  const canSubmit = useMemo(() => {
    const usernameValid = username.trim().length >= 3;
    const emailValid = /\S+@\S+\.\S+/.test(email.trim());
    const passwordValid = calculatePasswordStrength(password).isStrong;
    const confirmValid = password === confirmPassword;

    return (
      usernameValid &&
      emailValid &&
      passwordValid &&
      confirmValid &&
      !isDisabled
    );
  }, [username, email, password, confirmPassword, isDisabled]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* 🚀 NEW: Toast Overlay */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onDismiss={hideToast}
        duration={5000}
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
                  placeholder='Kullanıcı adınızı girin (en az 3 karakter)'
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

                <View>
                  <Input
                    label='Şifre'
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      // Show criteria when password is being typed and not yet strong
                      const strength = calculatePasswordStrength(text);
                      setShowPasswordCriteria(
                        text.length > 0 && !strength.isStrong,
                      );
                    }}
                    placeholder='Güçlü bir şifre oluşturun'
                    secureTextEntry
                    disabled={isDisabled}
                    leftIcon='lock'
                    containerStyle={styles.inputFieldContainer}
                    labelStyle={styles.inputLabel}
                    inputStyle={styles.inputField}
                  />

                  {/* Password Strength Indicator */}
                  {password.length > 0 && (
                    <PasswordStrengthIndicator password={password} />
                  )}

                  {/* Password Criteria (show when password exists but not strong enough) */}
                  {showPasswordCriteria && (
                    <PasswordCriteria password={password} />
                  )}
                </View>

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

              {/* 🚀 REMOVED: Inline error display - now using toast */}

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
    ...(Platform.OS === 'ios' && {
      fontFamily: FontFamilies.primary.regular,
      lineHeight: Typography.body.fontSize * 1.2,
      paddingTop: 2,
      paddingBottom: -3,
    }),
  },
  // Password strength indicator styles
  strengthContainer: {
    marginTop: Spacing[2],
    marginBottom: Spacing[3],
  },
  strengthBar: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: Spacing[2],
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthText: {
    ...Typography.caption,
    textAlign: 'center',
    fontWeight: '600',
  },
  // Password criteria styles
  criteriaContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    marginTop: Spacing[2],
    marginBottom: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  criteriaTitle: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.gray[700],
    marginBottom: Spacing[2],
  },
  criteriaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  criteriaIcon: {
    ...Typography.body,
    fontWeight: 'bold',
    marginRight: Spacing[2],
    width: 16,
  },
  criteriaText: {
    ...Typography.caption,
    flex: 1,
  },
  criteriaNote: {
    ...Typography.caption,
    fontStyle: 'italic',
    color: Colors.gray[600],
    marginTop: Spacing[2],
    textAlign: 'center',
  },
  registerButton: {
    width: '100%',
    marginTop: Spacing[2],
  },
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
