// app/(tabs)/duels.tsx
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
import { duelService } from '../../src/api';
import { Duel } from '../../src/types/models';
import {
  Card,
  Button,
  EmptyState,
  Avatar,
  Badge,
  Container,
  Title,
  Paragraph,
  Alert,
  Row,
} from '../../components/ui';
import { Colors, Spacing } from '../../constants/theme';

export default function DuelsScreen() {
  const router = useRouter();
  const [activeDuels, setActiveDuels] = useState<Duel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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

  // Helper function to get opponent display name
  const getOpponentDisplayName = (duel: Duel): string => {
    // Try different possible properties
    if ((duel as any).opponent_username) {
      return (duel as any).opponent_username;
    }
    if ((duel as any).opponent_name) {
      return (duel as any).opponent_name;
    }
    if (duel.opponent_id) {
      return `Rakip ${duel.opponent_id}`;
    }
    return 'Rakip';
  };

  // Helper function to get opponent avatar initial
  const getOpponentAvatarInitial = (duel: Duel): string => {
    const displayName = getOpponentDisplayName(duel);
    return displayName.charAt(0).toUpperCase();
  };

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
        <View style={{ marginBottom: Spacing[6] }}>
          <Title level={2}>Düellolar</Title>
          <Paragraph color={isDark ? Colors.gray[400] : Colors.gray[600]}>
            Arkadaşlarınla yarışarak öğren
          </Paragraph>
        </View>

        {/* Button to create new duel */}
        <Button
          title='Yeni Düello Başlat'
          onPress={() => router.push('/duel/new' as any)}
          variant='primary'
          style={{ marginBottom: Spacing[4] }}
        />

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
            {activeDuels.length > 0 ? (
              <View>
                {activeDuels.map((duel) => (
                  <TouchableOpacity
                    key={duel.duel_id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: Spacing[3],
                      backgroundColor: isDark
                        ? Colors.gray[700]
                        : Colors.gray[50],
                      borderRadius: 8,
                      marginBottom: Spacing[3],
                    }}
                    onPress={() => router.push(`/duel/${duel.duel_id}` as any)}
                  >
                    <Avatar
                      name={getOpponentAvatarInitial(duel)}
                      size='md'
                      bgColor={Colors.secondary.DEFAULT}
                    />
                    <View style={{ flex: 1, marginLeft: Spacing[3] }}>
                      <Text
                        style={{
                          fontWeight: '600',
                          color: isDark ? Colors.white : Colors.gray[800],
                          marginBottom: Spacing[1],
                        }}
                      >
                        {getOpponentDisplayName(duel)}
                      </Text>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginTop: Spacing[1],
                        }}
                      >
                        {renderDuelStatusBadge(duel.status)}
                      </View>
                    </View>
                    <Button
                      title={duel.status === 'active' ? 'Oyna' : 'Görüntüle'}
                      variant={duel.status === 'active' ? 'primary' : 'outline'}
                      onPress={() =>
                        router.push(`/duel/${duel.duel_id}` as any)
                      }
                      style={{
                        paddingHorizontal: Spacing[3],
                        paddingVertical: Spacing[1],
                      }}
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
                  onPress: () => router.push('/duel/new' as any),
                }}
              />
            )}
          </>
        )}
      </ScrollView>
    </Container>
  );
}
