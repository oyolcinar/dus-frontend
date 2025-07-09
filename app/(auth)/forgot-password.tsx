// app/(auth)/forgot-password.tsx

import React, { useState } from 'react';
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

  const logoWhite = require('../../assets/images/logoWhite.jpg');

  const handleResetRequest = async () => {
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
  };

  // Create coral gradient using vibrant coral colors
  const coralGradientColors = [
    Colors.vibrant?.coral || '#FF7675',
    Colors.vibrant?.peach || '#FDCB6E',
  ];

  // Safely convert to the required tuple type
  const linearGradientColors =
    Array.isArray(coralGradientColors) && coralGradientColors.length >= 2
      ? ([coralGradientColors[0], coralGradientColors[1]] as readonly [
          string,
          string,
          ...string[],
        ])
      : ([
          Colors.vibrant?.coral || '#FF7675',
          Colors.vibrant?.peach || '#FDCB6E',
        ] as readonly [string, string, ...string[]]);

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
                contentContainerStyle={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  alignContent: 'center',
                }}
                animated={true}
                floatingAnimation={true}
                gradient='warning'
              >
                <Image
                  source={logoWhite}
                  style={styles.logoImage}
                  resizeMode='cover'
                />
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
                Şifre Sıfırla
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
                    paddingHorizontal: Spacing[4],
                  },
                ]}
              >
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
                <View style={{ marginBottom: Spacing[4] }}>
                  <Input
                    label='E-posta'
                    value={email}
                    onChangeText={setEmail}
                    placeholder='E-posta adresinizi girin'
                    inputMode='email'
                    autoCapitalize='none'
                    disabled={isLoading}
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
                  textStyle={{ color: Colors.vibrant.purple }}
                  size='medium'
                  loading={isLoading}
                  style={{ width: '100%' }}
                  animated={true}
                  glowEffect={true}
                  wiggleOnPress={true}
                />

                <View style={{ marginTop: Spacing[4], alignItems: 'center' }}>
                  <TextLink
                    href='/(auth)/login'
                    label='Giriş Ekranına Dön'
                    style={[
                      Typography.body,
                      {
                        color: Colors.white,
                        fontFamily: FontFamilies.secondary.bold,
                        textShadowColor: 'rgba(0, 0, 0, 0.3)',
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 2,
                      },
                    ]}
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
                <View
                  style={{ alignItems: 'center', marginBottom: Spacing[4] }}
                >
                  <PlayfulCard
                    variant='gradient'
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: Spacing[3],
                    }}
                    animated={true}
                    pulseEffect={true}
                    gradient='success'
                  >
                    <FontAwesome
                      name='check'
                      size={24}
                      color={Colors.white}
                      style={{ textAlign: 'center' }}
                    />
                  </PlayfulCard>

                  <Text
                    style={[
                      Typography.h3,
                      {
                        color: Colors.neutral?.darkGray || Colors.gray[700],
                        textAlign: 'center',
                        marginBottom: Spacing[2],
                      },
                    ]}
                  >
                    Başarılı!
                  </Text>
                </View>

                <Alert
                  type='success'
                  message='E-posta adresiniz sistemimizde kayıtlıysa, kısa süre içinde şifre sıfırlama bağlantısı alacaksınız. Lütfen gelen kutunuzu kontrol edin.'
                  style={{ marginBottom: Spacing[4] }}
                />

                <PlayfulButton
                  title='Giriş Ekranına Dön'
                  onPress={() => router.push('/(auth)/login')}
                  variant='vibrant'
                  gradient='success'
                  size='medium'
                  style={{ width: '100%', marginTop: Spacing[2] }}
                  animated={true}
                  glowEffect={true}
                  wiggleOnPress={true}
                />
              </GlassCard>
            )}

            {/* Additional Help Section */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'baseline',
                marginTop: Spacing[6],
                marginBottom: Spacing[4],
              }}
            >
              <Text
                style={[
                  Typography.bodySmall,
                  {
                    color: Colors.white,
                    opacity: 0.8,
                    textAlign: 'center',
                    includeFontPadding: false,
                    textAlignVertical: 'center',
                  },
                ]}
              >
                Sorun mu yaşıyorsun?{' '}
              </Text>
              <TextLink
                href='/(auth)/login'
                label='Destek Al'
                style={[
                  Typography.bodySmall,
                  {
                    color: Colors.vibrant.purple,
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

const styles = StyleSheet.create({
  logoImage: {
    borderRadius: 48,
    width: 96,
    height: 96,
  },
});
