// app/(tabs)/duels.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
  RefreshControl,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { duelService } from '../../src/api';
import { Duel } from '../../src/types/models';
import {
  PlayfulCard,
  GameCard,
  PlayfulButton,
  EmptyState,
  Avatar,
  Badge,
  Container,
  Title,
  Paragraph,
  Alert,
  Row,
  Column,
  StatCard,
  AnimatedCounter,
  ScoreDisplay,
  SlideInElement,
  PlayfulTitle,
} from '../../components/ui';
import { Colors, Spacing, FontSizes } from '../../constants/theme';

export default function DuelsScreen() {
  const router = useRouter();
  const [activeDuels, setActiveDuels] = useState<Duel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const fetchDuels = useCallback(async () => {
    try {
      setError(null);
      const activeDuelsResponse = await duelService.getActiveDuels();
      setActiveDuels(activeDuelsResponse);
    } catch (error) {
      console.error('Error fetching duels:', error);
      setError('Düellolar yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDuels();
    setRefreshing(false);
  }, [fetchDuels]);

  const handleRetry = useCallback(async () => {
    setLoading(true);
    await fetchDuels();
    setLoading(false);
  }, [fetchDuels]);

  useEffect(() => {
    async function initialFetch() {
      setLoading(true);
      await fetchDuels();
      setLoading(false);
    }

    initialFetch();
  }, [fetchDuels]);

  // Helper function to get opponent display name
  const getOpponentDisplayName = (duel: Duel): string => {
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
    if (status === 'pending') {
      return <Badge text='Bekliyor' variant='info' size='sm' />;
    } else if (status === 'active') {
      return <Badge text='Senin Sıran' variant='warning' size='sm' />;
    } else if (status === 'completed') {
      return <Badge text='Tamamlandı' variant='success' size='sm' />;
    }
    return null;
  };

  // Get status-specific properties for GameCard
  const getDuelCardProps = (duel: Duel) => {
    const status = duel.status;

    if (status === 'active') {
      return {
        status: 'active' as const,
        animated: true,
        pulseEffect: true,
        icon: 'sword' as any, // This will fallback to 'gamepad' in GameCard
        onPlay: () => router.push(`/duel/${duel.duel_id}` as any),
      };
    } else if (status === 'completed') {
      return {
        status: 'completed' as const,
        animated: false,
        icon: 'check-circle' as any,
        onPlay: () => router.push(`/duel/${duel.duel_id}` as any),
      };
    } else if (status === 'pending') {
      return {
        status: 'waiting' as const,
        animated: false,
        icon: 'clock' as any,
        onPlay: () => router.push(`/duel/${duel.duel_id}` as any),
      };
    }

    return {
      status: 'waiting' as const,
      animated: false,
      icon: 'gamepad' as any,
      onPlay: () => router.push(`/duel/${duel.duel_id}` as any),
    };
  };

  if (error && !loading) {
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
        <PlayfulButton
          title='Yenile'
          variant='primary'
          onPress={handleRetry}
          icon='refresh'
          animated
        />
      </Container>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: Spacing[4] }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary.DEFAULT}
            colors={[Colors.primary.DEFAULT]}
          />
        }
      >
        {/* Header with animated title */}
        <SlideInElement delay={0}>
          <PlayfulCard
            style={{ marginBottom: Spacing[6], backgroundColor: 'transparent' }}
          >
            <Row
              style={{ justifyContent: 'space-between', alignItems: 'center' }}
            >
              <Column style={{ flex: 1 }}>
                <PlayfulTitle
                  level={1}
                  gradient='primary'
                  style={{ fontFamily: 'PrimaryFont', color: 'white' }}
                >
                  Düellolar ⚔️
                </PlayfulTitle>
                <Paragraph
                  color={isDark ? Colors.gray[400] : Colors.gray[100]}
                  style={{
                    fontFamily: 'SecondaryFont-Regular',
                  }}
                >
                  Arkadaşlarınla yarışarak öğren
                </Paragraph>
              </Column>
              {/* <AnimatedCounter
                value={activeDuels.length}
                size='large'
                variant='vibrant'
              /> */}
            </Row>
          </PlayfulCard>
        </SlideInElement>

        {/* Stats Cards */}
        <Row
          style={{
            justifyContent: 'space-between',
            flexWrap: 'nowrap',
            marginBottom: Spacing[6],
          }}
        >
          <StatCard
            icon='trophy'
            title='Aktif Düellolar'
            value={activeDuels.length.toString()}
            color={Colors.vibrant?.orange || Colors.secondary.DEFAULT}
            titleFontFamily='SecondaryFont-Bold'
          />
          <StatCard
            icon='fire'
            title='Kazanılan'
            value={activeDuels
              .filter((d) => d.status === 'completed')
              .length.toString()}
            color={isDark ? Colors.vibrant.purple : Colors.vibrant.yellow}
            titleFontFamily='SecondaryFont-Bold'
          />
          <StatCard
            icon='hourglass'
            title='Bekleyen'
            value={activeDuels
              .filter((d) => d.status === 'pending')
              .length.toString()}
            color={Colors.vibrant?.mint || Colors.info}
            titleFontFamily='SecondaryFont-Bold'
          />
        </Row>

        {/* Create New Duel Button */}
        <PlayfulButton
          title='Yeni Düello Başlat'
          onPress={() => router.push('/duel/new' as any)}
          variant='secondary'
          gradient='fire'
          animated
          style={{ marginBottom: Spacing[6] }}
          icon='plus'
          wiggleOnPress
        />

        {loading ? (
          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              padding: Spacing[4],
            }}
          >
            <ActivityIndicator
              size='large'
              color={isDark ? Colors.primary.DEFAULT : Colors.vibrant.coral}
            />
            <Text
              style={{
                marginTop: Spacing[3],
                color: isDark ? Colors.gray[400] : Colors.white,
                fontFamily: 'SecondaryFont-Regular',
              }}
            >
              Düellolar yükleniyor...
            </Text>
          </View>
        ) : (
          <>
            {activeDuels.length > 0 ? (
              <View>
                {activeDuels.map((duel) => {
                  const cardProps = getDuelCardProps(duel);

                  return (
                    <GameCard
                      key={duel.duel_id}
                      title={getOpponentDisplayName(duel)}
                      playerName={`vs ${getOpponentDisplayName(duel)}`}
                      gameType='Tıp Bilgisi Düellosu'
                      style={{ marginBottom: Spacing[4] }}
                      {...cardProps}
                    >
                      <Row
                        style={{
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Row style={{ alignItems: 'center', flex: 1 }}>
                          <Avatar
                            name={getOpponentAvatarInitial(duel)}
                            size='lg'
                            bgColor={
                              Colors.vibrant?.purple || Colors.primary.DEFAULT
                            }
                            style={{ marginRight: Spacing[3] }}
                            borderGlow
                            animated
                          />
                          <Column style={{ flex: 1 }}>
                            <Title
                              level={3}
                              style={{
                                color: Colors.white,
                                marginBottom: Spacing[1],
                              }}
                            >
                              {getOpponentDisplayName(duel)}
                            </Title>
                            {renderDuelStatusBadge(duel.status)}
                          </Column>
                        </Row>

                        {/* Score Display if available */}
                        {(duel as any).your_score !== undefined && (
                          <ScoreDisplay
                            score={(duel as any).your_score || 0}
                            maxScore={(duel as any).max_score || 100}
                            variant='gradient'
                            size='small'
                            animated
                          />
                        )}
                      </Row>
                    </GameCard>
                  );
                })}
              </View>
            ) : (
              <PlayfulCard
                variant='glass'
                animated
                floatingAnimation
                style={{ marginTop: Spacing[4] }}
              >
                <EmptyState
                  icon='users'
                  fontFamily='PrimaryFont'
                  title='Aktif düello yok'
                  buttonFontFamily='PrimaryFont'
                  message='Arkadaşlarını düelloya davet et ve rekabeti başlat.'
                  actionButton={{
                    title: 'Düello Başlat',
                    onPress: () => router.push('/duel/new' as any),
                    variant: 'secondary',
                  }}
                />
              </PlayfulCard>
            )}
          </>
        )}

        {/* Quick Actions */}
        <PlayfulCard
          title='Hızlı İşlemler'
          variant='playful'
          titleFontFamily='PrimaryFont'
          style={{ marginTop: Spacing[6] }}
          animated
        >
          <Row style={{ justifyContent: 'space-between' }}>
            <PlayfulButton
              title='Tüm Düellolar'
              onPress={() => router.push('/duels/all' as any)}
              variant='outline'
              style={{ flex: 1 }}
              icon='list'
              animated
              size='xs'
              fontFamily='PrimaryFont'
            />
            <PlayfulButton
              title='Düello Geçmişi'
              onPress={() => router.push('/duels/history' as any)}
              variant='outline'
              style={{ flex: 1 }}
              icon='history'
              animated
              size='xs'
              fontFamily='PrimaryFont'
            />
          </Row>
        </PlayfulCard>

        {/* Error display at bottom if there's an error but data is loaded */}
        {error && !loading && activeDuels.length > 0 && (
          <Alert
            type='warning'
            message='Veriler yenilenirken sorun yaşandı. Çekmek için aşağı kaydırın.'
            style={{ marginTop: Spacing[4] }}
          />
        )}
      </ScrollView>
    </View>
  );
}
