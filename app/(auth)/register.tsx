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
import { FontAwesome } from '@expo/vector-icons';
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
  const { signUp, signInWithGoogle, signInWithApple, signInWithFacebook } =
    useAuth();

  const handleRegister = async () => {
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
        error.message || `${provider} kaydı başarısız. Lütfen tekrar deneyin.`;
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
                  style={[
                    Typography.gameTitle,
                    {
                      fontSize: 36,
                      color: Colors.white,
                      textAlign: 'center',
                    },
                  ]}
                >
                  D
                </Text>
              </PlayfulCard>

              <Text
                style={[
                  Typography.h1,
                  {
                    color: Colors.white,
                    textAlign: 'center',
                    marginBottom: 4,
                    textShadowColor: 'rgba(0, 0, 0, 0.3)',
                    textShadowOffset: { width: 0, height: 2 },
                    textShadowRadius: 4,
                  },
                ]}
              >
                DUS Sınav Hazırlığına Katıl
              </Text>

              <Text
                style={[
                  Typography.bodyLarge,
                  {
                    color: Colors.white,
                    textAlign: 'center',
                    opacity: 0.9,
                    textShadowColor: 'rgba(0, 0, 0, 0.2)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 2,
                  },
                ]}
              >
                Diş hekimliği sınav başarınıza giden yolculuğa başlayın
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
                style={[
                  Typography.h4,
                  {
                    textAlign: 'center',
                    marginBottom: Spacing[4],
                    color: Colors.neutral?.darkGray || Colors.gray[700],
                  },
                ]}
              >
                Hızlı Kayıt
              </Text>

              <PlayfulButton
                title={
                  isOAuthLoading === 'google' ? 'Kayıt oluyor...' : 'Google'
                }
                icon='google'
                onPress={() => handleOAuthSignUp('google')}
                variant='vibrant'
                gradient='google'
                disabled={isOAuthLoading !== null || isLoading}
                size='medium'
                style={{ marginBottom: 12 }}
                animated={true}
                wiggleOnPress={true}
              />

              <PlayfulButton
                title={isOAuthLoading === 'apple' ? 'Kayıt oluyor...' : 'Apple'}
                icon='apple'
                onPress={() => handleOAuthSignUp('apple')}
                variant='vibrant'
                gradient={isDarkMode ? 'appleLight' : 'appleDark'}
                disabled={isOAuthLoading !== null || isLoading}
                size='medium'
                style={{ marginBottom: 12 }}
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
                style={[
                  Typography.bodySmall,
                  {
                    marginHorizontal: Spacing[3],
                    color: Colors.white,
                    opacity: 0.8,
                  },
                ]}
              >
                veya e-posta ile hesap oluştur
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
                  label='Kullanıcı Adı'
                  value={username}
                  onChangeText={setUsername}
                  placeholder='Kullanıcı adınızı girin'
                  disabled={isLoading || isOAuthLoading !== null}
                  leftIcon='user'
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
                  labelStyle={[
                    Typography.caption,
                    {
                      color: Colors.gray[700],
                      fontFamily: FontFamilies.secondary.bold,
                      marginBottom: Spacing[2],
                    },
                  ]}
                  inputStyle={[
                    Typography.body,
                    {
                      color: Colors.gray[800],
                      // Custom font fixes for iOS
                      ...(Platform.OS === 'ios' && {
                        fontFamily: FontFamilies.primary.regular, // Use a more reliable font variant
                        lineHeight: Typography.body.fontSize * 1.2, // Explicit line height
                        paddingTop: 2, // Fine-tune vertical position
                        paddingBottom: -3,
                      }),
                    },
                  ]}
                />

                <Input
                  label='E-posta'
                  value={email}
                  onChangeText={setEmail}
                  placeholder='E-posta adresinizi girin'
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
                  labelStyle={[
                    Typography.caption,
                    {
                      color: Colors.gray[700],
                      fontFamily: FontFamilies.secondary.bold,
                      marginBottom: Spacing[2],
                    },
                  ]}
                  inputStyle={[
                    Typography.body,
                    {
                      color: Colors.gray[800],
                      // Custom font fixes for iOS
                      ...(Platform.OS === 'ios' && {
                        fontFamily: FontFamilies.primary.regular, // Use a more reliable font variant
                        lineHeight: Typography.body.fontSize * 1.2, // Explicit line height
                        paddingTop: 2, // Fine-tune vertical position
                        paddingBottom: -3,
                      }),
                    },
                  ]}
                />

                <Input
                  label='Şifre'
                  value={password}
                  onChangeText={setPassword}
                  placeholder='Şifre oluşturun'
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
                  labelStyle={[
                    Typography.caption,
                    {
                      color: Colors.gray[700],
                      fontFamily: FontFamilies.secondary.bold,
                      marginBottom: Spacing[2],
                    },
                  ]}
                  inputStyle={[
                    Typography.body,
                    {
                      color: Colors.gray[800],
                      // Custom font fixes for iOS
                      ...(Platform.OS === 'ios' && {
                        fontFamily: FontFamilies.primary.regular, // Use a more reliable font variant
                        lineHeight: Typography.body.fontSize * 1.2, // Explicit line height
                        paddingTop: 2, // Fine-tune vertical position
                        paddingBottom: -3,
                      }),
                    },
                  ]}
                />

                <Input
                  label='Şifre Tekrarı'
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder='Şifrenizi tekrar girin'
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
                  labelStyle={[
                    Typography.caption,
                    {
                      color: Colors.gray[700],
                      fontFamily: FontFamilies.secondary.bold,
                      marginBottom: Spacing[2],
                    },
                  ]}
                  inputStyle={[
                    Typography.body,
                    {
                      color: Colors.gray[800],
                      // Custom font fixes for iOS
                      ...(Platform.OS === 'ios' && {
                        fontFamily: FontFamilies.primary.regular, // Use a more reliable font variant
                        lineHeight: Typography.body.fontSize * 1.2, // Explicit line height
                        paddingTop: 2, // Fine-tune vertical position
                        paddingBottom: -3,
                      }),
                    },
                  ]}
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
                title={isLoading ? 'Hesap Oluşturuluyor...' : 'Hesap Oluştur'}
                onPress={handleRegister}
                disabled={isLoading || isOAuthLoading !== null}
                variant='vibrant'
                gradient='tropical'
                size='medium'
                fontFamily='SecondaryFont-Bold'
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
                alignItems: 'baseline',
                marginTop: Spacing[4],
                marginBottom: Spacing[4],
              }}
            >
              <Text
                style={[
                  Typography.bodyLarge,
                  {
                    color: Colors.white,
                    opacity: 0.9,
                    includeFontPadding: false,
                    textAlignVertical: 'center',
                  },
                ]}
              >
                Zaten hesabınız var mı?
              </Text>
              <TextLink
                href='/(auth)/login'
                label=' Giriş Yap'
                style={[
                  Typography.bodyLarge,
                  {
                    color: Colors.vibrant?.yellow || Colors.secondary.light,
                    fontFamily: FontFamilies.secondary.bold,
                    textShadowColor: 'rgba(0, 0, 0, 0.3)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 2,
                    includeFontPadding: false,
                    textAlignVertical: 'center',
                  },
                ]}
                touchableProps={{
                  style: {
                    paddingVertical: 0,
                    marginVertical: 0,
                  },
                }}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
