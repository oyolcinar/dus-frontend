// app/(tabs)/duels.tsx
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
import { duelService } from '../../src/api';
import { Duel } from '../../src/types/models';
import { Card, Button, EmptyState, Avatar, Badge } from '../../components/ui';

export default function DuelsScreen() {
  const router = useRouter();
  const [activeDuels, setActiveDuels] = useState<Duel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDuels() {
      try {
        setLoading(true);
        setError(null);

        // Using only getActiveDuels which we know exists
        const activeDuelsResponse = await duelService.getActiveDuels();
        setActiveDuels(activeDuelsResponse);
      } catch (error) {
        console.error('Error fetching duels:', error);
        setError(
          'Düellolar yüklenirken bir hata oluştu. Lütfen tekrar deneyin.',
        );
      } finally {
        setLoading(false);
      }
    }

    fetchDuels();
  }, []);

  // Render badge for duel status
  const renderDuelStatusBadge = (status?: string) => {
    // Use string comparison instead of enum comparison
    if (status === 'pending') {
      return <Badge text='Bekliyor' variant='info' size='sm' />;
    } else if (status === 'active') {
      return <Badge text='Senin Sıran' variant='warning' size='sm' />;
    } else if (status === 'completed') {
      return <Badge text='Tamamlandı' variant='success' size='sm' />;
    }
    return null;
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
      <View className='mb-6'>
        <Text className='text-2xl font-bold text-gray-900 dark:text-white'>
          Düellolar
        </Text>
        <Text className='text-gray-600 dark:text-gray-400'>
          Arkadaşlarınla yarışarak öğren
        </Text>
      </View>

      {/* Button to create new duel */}
      <Button
        title='Yeni Düello Başlat'
        onPress={() => router.push('/duels/new' as any)}
        variant='primary'
        className='mb-4'
      />

      {loading ? (
        <ActivityIndicator size='large' color='var(--color-primary)' />
      ) : (
        <>
          {activeDuels.length > 0 ? (
            <View>
              {activeDuels.map((duel) => (
                <TouchableOpacity
                  key={duel.duel_id}
                  className='flex-row items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg mb-3'
                  onPress={() => router.push(`/duel/${duel.duel_id}` as any)}
                >
                  <Avatar
                    name={duel.opponent_username?.[0] || 'U'}
                    size='md'
                    bgColor='var(--color-secondary)'
                  />
                  <View className='flex-1 ml-3'>
                    <Text className='font-semibold text-gray-800 dark:text-white'>
                      {duel.opponent_username || 'Rakip'}
                    </Text>
                    <View className='flex-row items-center mt-1'>
                      {renderDuelStatusBadge(duel.status)}
                    </View>
                  </View>
                  <Button
                    title={duel.status === 'active' ? 'Oyna' : 'Görüntüle'}
                    variant={duel.status === 'active' ? 'primary' : 'outline'}
                    onPress={() => router.push(`/duel/${duel.duel_id}` as any)}
                    className='px-3 py-1'
                  />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <EmptyState
              icon='users'
              title='Aktif düello yok'
              message='Arkadaşlarını düelloya davet et ve rekabeti başlat.'
              actionButton={{
                title: 'Düello Başlat',
                onPress: () => router.push('/duels/new' as any),
              }}
            />
          )}
        </>
      )}
    </ScrollView>
  );
}
