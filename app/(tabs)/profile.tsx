// app/(tabs)/profile.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { authService, achievementService } from '../../src/api';
import {
  Card,
  Button,
  StatCard,
  Avatar,
  Container,
  Title,
  Paragraph,
  Alert,
  Row,
  Divider,
} from '../../components/ui';
import { Colors, Spacing } from '../../constants/theme';

// Define interface for Achievement since it's not exported from models
interface Achievement {
  achievement_id: number;
  name: string;
  description?: string;
  requirements?: any;
  category?: string;
  icon?: string;
  points?: number;
  created_at: string;
  date_earned?: string;
}

// Define interface for DuelStats - corrected to match the actual API response
interface DuelStats {
  totalDuels: number;
  wins: number;
  losses: number;
  winRate: number;
  // Using the correct property names from the error message:
  longestLosingStreak: number;
  currentLosingStreak: number;
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [duelStats, setDuelStats] = useState<DuelStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfileData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch data in parallel
        const [userAchievements, duelStatsResponse] = await Promise.all([
          achievementService.getUserAchievements(),
          authService.getDuelStats(),
        ]);

        setAchievements(userAchievements);

        // Using the correct property names from the API response
        setDuelStats({
          totalDuels: duelStatsResponse.totalDuels,
          wins: duelStatsResponse.wins,
          losses: duelStatsResponse.losses,
          winRate: duelStatsResponse.winRate,
          // Using the correct property names:
          longestLosingStreak: duelStatsResponse.longestLosingStreak || 0,
          currentLosingStreak: duelStatsResponse.currentLosingStreak || 0,
        });
      } catch (error) {
        console.error('Error fetching profile data:', error);
        setError(
          'Profil verileri yüklenirken bir hata oluştu. Lütfen tekrar deneyin.',
        );
      } finally {
        setLoading(false);
      }
    }

    fetchProfileData();
  }, []);

  // Get icon for achievement - returns only valid FontAwesome icon names
  const getAchievementIcon = (achievement: Achievement): string => {
    // Use achievement.icon if available AND it's a valid FontAwesome icon
    if (achievement.icon) {
      // This is a simplification - in reality we would need to check if the icon is valid
      return achievement.icon;
    }

    const category = achievement.category?.toLowerCase() || '';

    // Only return valid FontAwesome icon names
    if (category.includes('course')) return 'book';
    if (category.includes('study')) return 'clock';
    if (category.includes('duel')) return 'trophy';
    if (category.includes('test')) return 'check-circle';
    if (category.includes('streak')) return 'fire';

    // Default icon
    return 'certificate';
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      // Navigation will be handled by the AuthContext
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (error) {
    return (
      <Container
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          padding: Spacing[4],
        }}
      >
        <Alert
          type='error'
          message={error}
          style={{ marginBottom: Spacing[4] }}
        />
        <Button
          title='Yenile'
          variant='primary'
          onPress={() => window.location.reload()}
        />
      </Container>
    );
  }

  return (
    <Container>
      <ScrollView style={{ flex: 1, padding: Spacing[4] }}>
        {/* Profile Header */}
        <View style={{ alignItems: 'center', marginBottom: Spacing[6] }}>
          <Avatar
            name={user?.username?.[0] || 'U'}
            size='lg' // Changed from 'xl' to 'lg' to match accepted values
            bgColor={Colors.primary.DEFAULT}
          />
          <Title level={2} style={{ marginTop: Spacing[3] }}>
            {user?.username || 'Kullanıcı'}
          </Title>
          <Paragraph color={isDark ? Colors.gray[400] : Colors.gray[600]}>
            {user?.email || 'email@example.com'}
          </Paragraph>
        </View>

        {loading ? (
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              padding: Spacing[4],
            }}
          >
            <ActivityIndicator size='large' color={Colors.primary.DEFAULT} />
          </View>
        ) : (
          <>
            {/* Duel Stats */}
            {duelStats && (
              <Card
                title='Düello İstatistikleri'
                style={{ marginBottom: Spacing[6] }}
              >
                <Row
                  style={{ flexWrap: 'wrap', justifyContent: 'space-between' }}
                >
                  <StatCard
                    icon='trophy'
                    title='Toplam Düello'
                    value={duelStats.totalDuels.toString()}
                    color={Colors.primary.DEFAULT}
                  />
                  <StatCard
                    icon='check-circle'
                    title='Kazanılan'
                    value={duelStats.wins.toString()}
                    color={Colors.success}
                  />
                  <StatCard
                    icon='times-circle'
                    title='Kaybedilen'
                    value={duelStats.losses.toString()}
                    color={Colors.error}
                  />
                  <StatCard
                    icon='percent' // Changed from 'percentage' to 'percent' (valid FontAwesome icon)
                    title='Kazanma Oranı'
                    value={`${Math.round(duelStats.winRate)}%`}
                    color={Colors.info}
                  />
                </Row>
              </Card>
            )}

            {/* Achievements */}
            <Card title='Başarılar' style={{ marginBottom: Spacing[6] }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {achievements.length > 0 ? (
                  achievements.map((achievement) => (
                    <View
                      key={achievement.achievement_id}
                      style={{
                        width: '33.33%',
                        alignItems: 'center',
                        padding: Spacing[2],
                      }}
                    >
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          backgroundColor: isDark
                            ? Colors.primary.dark
                            : Colors.primary.light,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: Spacing[2],
                        }}
                      >
                        <FontAwesome
                          name={getAchievementIcon(achievement) as any}
                          size={24}
                          color={Colors.primary.DEFAULT}
                        />
                      </View>
                      <Text
                        style={{
                          fontSize: 12,
                          textAlign: 'center',
                          color: isDark ? Colors.gray[300] : Colors.gray[700],
                        }}
                      >
                        {achievement.name}
                      </Text>
                    </View>
                  ))
                ) : (
                  <View
                    style={{
                      width: '100%',
                      alignItems: 'center',
                      paddingVertical: Spacing[4],
                    }}
                  >
                    <Paragraph
                      color={isDark ? Colors.gray[400] : Colors.gray[500]}
                    >
                      Henüz başarı kazanılmadı
                    </Paragraph>
                  </View>
                )}
              </View>

              {achievements.length > 0 && (
                <Button
                  title='Tüm Başarılar'
                  onPress={() => router.push('/achievements' as any)}
                  variant='outline'
                  style={{ marginTop: Spacing[3] }}
                />
              )}
            </Card>

            {/* Account Settings */}
            <Card title='Hesap Ayarları' style={{ marginBottom: Spacing[6] }}>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: Spacing[3],
                  borderBottomWidth: 1,
                  borderBottomColor: isDark
                    ? Colors.gray[700]
                    : Colors.gray[200],
                }}
                onPress={() => router.push('/edit-profile' as any)}
              >
                <FontAwesome
                  name='user'
                  size={18}
                  color={Colors.primary.DEFAULT}
                />
                <Text
                  style={{
                    marginLeft: Spacing[3],
                    color: isDark ? Colors.gray[200] : Colors.gray[800],
                  }}
                >
                  Profil Düzenle
                </Text>
                <FontAwesome
                  name='chevron-right'
                  size={16}
                  color={isDark ? Colors.gray[400] : Colors.gray[500]}
                  style={{ marginLeft: 'auto' }}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: Spacing[3],
                  borderBottomWidth: 1,
                  borderBottomColor: isDark
                    ? Colors.gray[700]
                    : Colors.gray[200],
                }}
                onPress={() => router.push('/change-password' as any)}
              >
                <FontAwesome
                  name='lock'
                  size={18}
                  color={Colors.primary.DEFAULT}
                />
                <Text
                  style={{
                    marginLeft: Spacing[3],
                    color: isDark ? Colors.gray[200] : Colors.gray[800],
                  }}
                >
                  Şifre Değiştir
                </Text>
                <FontAwesome
                  name='chevron-right'
                  size={16}
                  color={isDark ? Colors.gray[400] : Colors.gray[500]}
                  style={{ marginLeft: 'auto' }}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: Spacing[3],
                }}
                onPress={handleSignOut}
              >
                <FontAwesome name='sign-out' size={18} color={Colors.error} />
                <Text
                  style={{
                    marginLeft: Spacing[3],
                    color: Colors.error,
                  }}
                >
                  Çıkış Yap
                </Text>
              </TouchableOpacity>
            </Card>

            {/* App Info */}
            <Card title='Uygulama Bilgisi'>
              <View style={{ paddingVertical: Spacing[2] }}>
                <Paragraph color={isDark ? Colors.gray[400] : Colors.gray[600]}>
                  Versiyon: 1.0.0
                </Paragraph>
              </View>
            </Card>
          </>
        )}
      </ScrollView>
    </Container>
  );
}
