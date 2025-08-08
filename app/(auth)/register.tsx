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
  Image,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { useAuth } from '../../context/AuthContext';
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
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const videoRef = useRef<Video>(null);

  const { signUp, signInWithGoogle, signInWithApple, signInWithFacebook } =
    useAuth();

  const logoWhite = require('../../assets/images/logoWhite.jpg');
  const logoVideo = require('../../assets/videos/heyecanli.mp4');

  const isDarkMode = useMemo(() => colorScheme === 'dark', [colorScheme]);

  // Memoize gradient colors calculation
  const linearGradientColors = useMemo(() => {
    const gradientColors = Colors.gradients?.tropical || [
      Colors.vibrant?.green || Colors.success,
      Colors.vibrant?.mint || Colors.primary.DEFAULT,
    ];

    return Array.isArray(gradientColors) && gradientColors.length >= 2
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
  }, []);

  // Video cleanup
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.pauseAsync();
      }
    };
  }, []);

  const handleRegister = useCallback(async () => {
    setError(null);

    // Basic form validation
    if (!username || !email || !password || !confirmPassword) {
      setError('Lütfen tüm alanları doldurun');
      return;
    }

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return;
    }

    try {
      setIsLoading(true);
      await signUp(username, email, password);
    } catch (error: any) {
      const errorMessage =
        error.message || 'Kayıt başarısız. Lütfen tekrar deneyin.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [username, email, password, confirmPassword, signUp]);

  const handleOAuthSignUp = useCallback(
    async (provider: 'google' | 'apple' | 'facebook') => {
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
          error.message ||
          `${provider} kaydı başarısız. Lütfen tekrar deneyin.`;
        setError(errorMessage);
      } finally {
        setIsOAuthLoading(null);
      }
    },
    [signInWithGoogle, signInWithApple, signInWithFacebook],
  );

  const isDisabled = useMemo(
    () => isLoading || isOAuthLoading !== null,
    [isLoading, isOAuthLoading],
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
                  isOAuthLoading === 'google' ? 'Kayıt oluyor...' : 'Google'
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
                title={isOAuthLoading === 'apple' ? 'Kayıt oluyor...' : 'Apple'}
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
                  isOAuthLoading === 'facebook' ? 'Kayıt oluyor...' : 'Facebook'
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
                  placeholder='Şifre oluşturun'
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

              {/* Display error message if exists */}
              {error && (
                <Alert type='error' message={error} style={styles.errorAlert} />
              )}

              <PlayfulButton
                title={isLoading ? 'Hesap Oluşturuluyor...' : 'Hesap Oluştur'}
                onPress={handleRegister}
                disabled={isDisabled}
                variant='vibrant'
                gradient='tropical'
                size='medium'
                fontFamily='SecondaryFont-Bold'
                loading={isLoading}
                style={styles.registerButton}
                animated={true}
                glowEffect={true}
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
  registerButton: {
    width: '100%',
    marginTop: Spacing[2],
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
    color: Colors.vibrant?.yellow || Colors.secondary.light,
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
});
