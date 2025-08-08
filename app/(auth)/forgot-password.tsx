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
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';
import { FontAwesome } from '@expo/vector-icons';
import { requestPasswordReset } from '../../src/api/authService';
import {
  Button,
  Input,
  TextLink,
  Title,
  Paragraph,
  Card,
  Alert,
} from '../../components/ui';
import { PlayfulButton, GlassCard, PlayfulCard } from '../../components/ui';
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  FontFamilies,
} from '../../constants/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const colorScheme = useColorScheme();
  const router = useRouter();
  const videoRef = useRef<Video>(null);

  const logoWhite = require('../../assets/images/logoWhite.jpg');
  const logoVideo = require('../../assets/videos/heyecanli.mp4');

  // Memoize gradient colors calculation
  const linearGradientColors = useMemo(() => {
    const coralGradientColors = [
      Colors.vibrant?.coral || '#FF7675',
      Colors.vibrant?.peach || '#FDCB6E',
    ];

    return Array.isArray(coralGradientColors) && coralGradientColors.length >= 2
      ? ([coralGradientColors[0], coralGradientColors[1]] as readonly [
          string,
          string,
          ...string[],
        ])
      : ([
          Colors.vibrant?.coral || '#FF7675',
          Colors.vibrant?.peach || '#FDCB6E',
        ] as readonly [string, string, ...string[]]);
  }, []);

  // Video cleanup
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.pauseAsync();
      }
    };
  }, []);

  const handleResetRequest = useCallback(async () => {
    // Clear previous errors
    setError(null);

    if (!email) {
      setError('Lütfen e-posta adresinizi girin');
      return;
    }

    try {
      setIsLoading(true);
      await requestPasswordReset(email);
      setSuccess(true);
    } catch (error: any) {
      const errorMessage =
        error.message || 'Şifre sıfırlama talebi başarısız oldu';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [email]);

  const handleBackToLogin = useCallback(() => {
    router.push('/(auth)/login');
  }, [router]);

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
                gradient='warning'
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

              <Text style={styles.titleText}>Şifre Sıfırla</Text>

              <Text style={styles.subtitleText}>
                Şifre sıfırlama bağlantısı almak için e-posta adresinizi girin
              </Text>
            </View>

            {!success ? (
              <GlassCard
                tint='light'
                blurIntensity={15}
                borderGlow={true}
                glowColor={Colors.vibrant?.orangeLight}
                shimmerEffect={true}
              >
                <View style={styles.inputContainer}>
                  <Input
                    label='E-posta'
                    value={email}
                    onChangeText={setEmail}
                    placeholder='E-posta adresinizi girin'
                    inputMode='email'
                    autoCapitalize='none'
                    disabled={isLoading}
                    leftIcon='envelope'
                    containerStyle={styles.inputFieldContainer}
                    labelStyle={styles.inputLabel}
                    inputStyle={styles.inputField}
                  />
                </View>

                {/* Display error message if exists */}
                {error && (
                  <Alert
                    type='error'
                    message={error}
                    style={styles.errorAlert}
                  />
                )}

                <PlayfulButton
                  title={
                    isLoading
                      ? 'Gönderiliyor...'
                      : 'Sıfırlama Bağlantısı Gönder'
                  }
                  onPress={handleResetRequest}
                  disabled={isLoading}
                  variant='vibrant'
                  fontFamily='SecondaryFont-Bold'
                  gradient='warning'
                  textStyle={styles.resetButtonText}
                  size='medium'
                  loading={isLoading}
                  style={styles.resetButton}
                  animated={true}
                  glowEffect={true}
                  wiggleOnPress={true}
                />

                <View style={styles.backToLoginContainer}>
                  <TextLink
                    href='/(auth)/login'
                    label='Giriş Ekranına Dön'
                    style={styles.backToLoginLink}
                  />
                </View>
              </GlassCard>
            ) : (
              <GlassCard
                tint='light'
                blurIntensity={15}
                borderGlow={true}
                glowColor={Colors.vibrant?.greenLight}
                shimmerEffect={true}
                animated={true}
                pulseEffect={true}
              >
                <View style={styles.successContainer}>
                  <PlayfulCard
                    variant='gradient'
                    style={styles.successIconCard}
                    animated={true}
                    pulseEffect={true}
                    gradient='success'
                  >
                    <FontAwesome
                      name='check'
                      size={24}
                      color={Colors.white}
                      style={styles.checkIcon}
                    />
                  </PlayfulCard>

                  <Text style={styles.successTitle}>Başarılı!</Text>
                </View>

                <Alert
                  type='success'
                  message='E-posta adresiniz sistemimizde kayıtlıysa, kısa süre içinde şifre sıfırlama bağlantısı alacaksınız. Lütfen gelen kutunuzu kontrol edin.'
                  style={styles.successAlert}
                />

                <PlayfulButton
                  title='Giriş Ekranına Dön'
                  onPress={handleBackToLogin}
                  variant='vibrant'
                  gradient='success'
                  size='medium'
                  style={styles.successButton}
                  animated={true}
                  glowEffect={true}
                  wiggleOnPress={true}
                />
              </GlassCard>
            )}

            {/* Additional Help Section */}
            <View style={styles.helpContainer}>
              <Text style={styles.helpText}>Sorun mu yaşıyorsun? </Text>
              <TextLink
                href='/(auth)/login'
                label='Destek Al'
                style={styles.supportLink}
                touchableProps={{
                  style: styles.supportTouchable,
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
    paddingHorizontal: Spacing[4],
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
  resetButton: {
    width: '100%',
  },
  resetButtonText: {
    color: Colors.vibrant.purple,
  },
  backToLoginContainer: {
    marginTop: Spacing[4],
    alignItems: 'center',
  },
  backToLoginLink: {
    ...Typography.body,
    color: Colors.white,
    fontFamily: FontFamilies.secondary.bold,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  successIconCard: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[3],
  },
  checkIcon: {
    textAlign: 'center',
  },
  successTitle: {
    ...Typography.h3,
    color: Colors.neutral?.darkGray || Colors.gray[700],
    textAlign: 'center',
    marginBottom: Spacing[2],
  },
  successAlert: {
    marginBottom: Spacing[4],
  },
  successButton: {
    width: '100%',
    marginTop: Spacing[2],
  },
  helpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    marginTop: Spacing[6],
    marginBottom: Spacing[4],
  },
  helpText: {
    ...Typography.bodySmall,
    color: Colors.white,
    opacity: 0.8,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  supportLink: {
    ...Typography.bodySmall,
    color: Colors.vibrant.purple,
    fontFamily: FontFamilies.secondary.bold,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  supportTouchable: {
    paddingVertical: 0,
    marginVertical: 0,
  },
});
