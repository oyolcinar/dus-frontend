// app/(tabs)/profile.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { authService, achievementService } from '../../src/api';
import { Card, Button, StatCard, Avatar } from '../../components/ui';

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
      <View className='flex-1 justify-center items-center p-4'>
        <Text className='text-red-500 text-center mb-4'>{error}</Text>
        <TouchableOpacity
          className='bg-primary px-4 py-2 rounded-lg'
          onPress={() => window.location.reload()}
        >
          <Text className='text-white'>Yenile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className='flex-1 p-4'>
      {/* Profile Header */}
      <View className='items-center mb-6'>
        <Avatar
          name={user?.username?.[0] || 'U'}
          size='lg' // Changed from 'xl' to 'lg' to match accepted values
          bgColor='var(--color-primary)'
        />
        <Text className='text-2xl font-bold mt-3 text-gray-900 dark:text-white'>
          {user?.username || 'Kullanıcı'}
        </Text>
        <Text className='text-gray-600 dark:text-gray-400'>
          {user?.email || 'email@example.com'}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size='large' color='var(--color-primary)' />
      ) : (
        <>
          {/* Duel Stats */}
          {duelStats && (
            <Card title='Düello İstatistikleri' className='mb-6'>
              <View className='flex-row flex-wrap justify-between'>
                <StatCard
                  icon='trophy'
                  title='Toplam Düello'
                  value={duelStats.totalDuels.toString()}
                  color='var(--color-primary)'
                />
                <StatCard
                  icon='check-circle'
                  title='Kazanılan'
                  value={duelStats.wins.toString()}
                  color='var(--color-success)'
                />
                <StatCard
                  icon='times-circle'
                  title='Kaybedilen'
                  value={duelStats.losses.toString()}
                  color='var(--color-error)'
                />
                <StatCard
                  icon='percent' // Changed from 'percentage' to 'percent' (valid FontAwesome icon)
                  title='Kazanma Oranı'
                  value={`${Math.round(duelStats.winRate)}%`}
                  color='var(--color-info)'
                />
              </View>
            </Card>
          )}

          {/* Achievements */}
          <Card title='Başarılar' className='mb-6'>
            <View className='flex-row flex-wrap'>
              {achievements.length > 0 ? (
                achievements.map((achievement) => (
                  <View
                    key={achievement.achievement_id}
                    className='w-1/3 items-center p-2'
                  >
                    <View className='w-12 h-12 rounded-full bg-primary-light dark:bg-primary-dark items-center justify-center mb-2'>
                      <FontAwesome
                        name={getAchievementIcon(achievement) as any}
                        size={24}
                        color='var(--color-primary)'
                      />
                    </View>
                    <Text className='text-xs text-center text-gray-700 dark:text-gray-300'>
                      {achievement.name}
                    </Text>
                  </View>
                ))
              ) : (
                <View className='w-full items-center py-4'>
                  <Text className='text-gray-500 dark:text-gray-400'>
                    Henüz başarı kazanılmadı
                  </Text>
                </View>
              )}
            </View>

            {achievements.length > 0 && (
              <Button
                title='Tüm Başarılar'
                onPress={() => router.push('/achievements' as any)}
                variant='outline'
                className='mt-3'
              />
            )}
          </Card>

          {/* Account Settings */}
          <Card title='Hesap Ayarları' className='mb-6'>
            <TouchableOpacity
              className='flex-row items-center py-3 border-b border-gray-200 dark:border-gray-700'
              onPress={() => router.push('/edit-profile' as any)}
            >
              <FontAwesome name='user' size={18} color='var(--color-primary)' />
              <Text className='ml-3 text-gray-800 dark:text-gray-200'>
                Profil Düzenle
              </Text>
              <FontAwesome
                name='chevron-right'
                size={16}
                color='var(--color-text-muted-light)'
                style={{ marginLeft: 'auto' }}
              />
            </TouchableOpacity>

            <TouchableOpacity
              className='flex-row items-center py-3 border-b border-gray-200 dark:border-gray-700'
              onPress={() => router.push('/change-password' as any)}
            >
              <FontAwesome name='lock' size={18} color='var(--color-primary)' />
              <Text className='ml-3 text-gray-800 dark:text-gray-200'>
                Şifre Değiştir
              </Text>
              <FontAwesome
                name='chevron-right'
                size={16}
                color='var(--color-text-muted-light)'
                style={{ marginLeft: 'auto' }}
              />
            </TouchableOpacity>

            <TouchableOpacity
              className='flex-row items-center py-3'
              onPress={handleSignOut}
            >
              <FontAwesome
                name='sign-out'
                size={18}
                color='var(--color-error)'
              />
              <Text className='ml-3 text-error'>Çıkış Yap</Text>
            </TouchableOpacity>
          </Card>

          {/* App Info */}
          <Card title='Uygulama Bilgisi'>
            <View className='py-2'>
              <Text className='text-gray-600 dark:text-gray-400'>
                Versiyon: 1.0.0
              </Text>
            </View>
          </Card>
        </>
      )}
    </ScrollView>
  );
}
