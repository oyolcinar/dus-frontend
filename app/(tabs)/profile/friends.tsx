import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  useColorScheme,
  Alert as RNAlert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Container,
  SlideInElement,
  PlayfulCard,
  PlayfulTitle,
  Paragraph,
  Row,
  Column,
  Badge,
  Button,
  Input,
  Card,
  Alert,
  Modal,
  EmptyState,
  FloatingElement,
  GlassCard,
  Colors,
  Spacing,
  BorderRadius,
  VIBRANT_COLORS,
} from '../../../components/ui';
import { friendService, userService } from '../../../src/api';
import { ApiError } from '../../../src/api/apiClient';
import { Friend, FriendRequest, User } from '../../../src/types/models';

// Import auth context
import { useAuth } from '../../../context/AuthContext';

// Import preferred course context for styling
import {
  usePreferredCourse,
  PreferredCourseProvider,
} from '../../../context/PreferredCourseContext';

// User search result interface
interface UserSearchResult {
  id: number;
  username: string;
  email?: string;
  winRate?: number;
}

type FriendTab = 'find' | 'friends' | 'pending';

// Main Friends Screen Component (wrapped with context)
function FriendsScreenContent() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Auth context integration
  const {
    user: contextUser,
    isLoading: authLoading,
    isSessionValid,
  } = useAuth();

  // Use the preferred course context for consistent styling
  const {
    preferredCourse,
    isLoading: courseLoading,
    getCourseColor,
  } = usePreferredCourse();

  // Get the current context color
  const contextColor =
    ((preferredCourse as any)?.category &&
      getCourseColor((preferredCourse as any).category)) ||
    VIBRANT_COLORS.purple;

  // Main state
  const [activeTab, setActiveTab] = useState<FriendTab>('find');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data state
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loadingActions, setLoadingActions] = useState<{
    [key: number]: boolean;
  }>({});

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Enhanced auth initialization (same pattern as duels/new)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsCheckingAuth(true);

        if (authLoading) {
          return;
        }

        if (!contextUser || !isSessionValid) {
          setIsAuthenticated(false);
          setIsCheckingAuth(false);
          return;
        }

        const authToken = await AsyncStorage.getItem('authToken');
        if (!authToken) {
          setIsAuthenticated(false);
          setIsCheckingAuth(false);
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error checking auth:', error);
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [contextUser, isSessionValid, authLoading]);

  // Fetch friends data
  const fetchFriendsData = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setError(null);

      const [friendsData, pendingData] = await Promise.all([
        friendService.getUserFriends(),
        friendService.getPendingRequests(),
      ]);

      setFriends(friendsData || []);
      setPendingRequests(pendingData || []);
    } catch (e) {
      setError('Arkadaş verileri yüklenirken bir hata oluştu.');
      console.error('Error fetching friends data:', e);
    }
  }, [isAuthenticated]);

  // Initial data fetch
  useEffect(() => {
    const initialFetch = async () => {
      setIsLoading(true);
      await fetchFriendsData();
      setIsLoading(false);
    };

    if (isAuthenticated) {
      initialFetch();
    }
  }, [fetchFriendsData, isAuthenticated]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFriendsData();
    setRefreshing(false);
  }, [fetchFriendsData]);

  // Search users function
  const handleSearch = async () => {
    if (!searchQuery.trim() || !isAuthenticated) return;

    setIsSearching(true);
    setSearchError(null);
    setSuccessMessage(null);
    setError(null);
    setSearchResults([]);

    try {
      // Use the userService to search by username
      const user = await userService.searchUserByUsername(searchQuery.trim());

      if (user) {
        setSearchResults([
          {
            id: user.id,
            username: user.username,
            email: user.email,
            winRate: 0, // User type doesn't have winRate, so default to 0
          },
        ]);
      } else {
        setSearchError(`'${searchQuery}' kullanıcısı bulunamadı.`);
      }
    } catch (err) {
      setSearchError('Arama sırasında hata oluştu.');
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Send friend request
  const handleSendFriendRequest = async (userId: number, username: string) => {
    if (!isAuthenticated) return;

    setLoadingActions((prev) => ({ ...prev, [userId]: true }));
    setSearchError(null);
    setSuccessMessage(null);
    setError(null);

    try {
      await friendService.sendFriendRequest(userId);

      // Remove from search results after sending request
      setSearchResults((prev) => prev.filter((user) => user.id !== userId));

      // Show success message
      setSearchError(null);
      setSuccessMessage(
        `${username} kullanıcısına arkadaşlık isteği gönderildi.`,
      );

      // Refresh data to update any counts
      await fetchFriendsData();
    } catch (err) {
      if (err instanceof ApiError) {
        setSearchError(err.message);
      } else {
        setSearchError('Arkadaşlık isteği gönderilemedi.');
      }
    } finally {
      setLoadingActions((prev) => ({ ...prev, [userId]: false }));
    }
  };

  // Accept friend request
  const handleAcceptRequest = async (friendId: number, username: string) => {
    if (!isAuthenticated) return;

    setLoadingActions((prev) => ({ ...prev, [friendId]: true }));
    setError(null);
    setSuccessMessage(null);

    try {
      await friendService.acceptRequest(friendId);

      // Refresh data to update lists
      await fetchFriendsData();

      setSuccessMessage(`${username} ile artık arkadaşsınız!`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('İstek kabul edilemedi.');
      }
    } finally {
      setLoadingActions((prev) => ({ ...prev, [friendId]: false }));
    }
  };

  // Reject friend request
  const handleRejectRequest = async (friendId: number, username: string) => {
    if (!isAuthenticated) return;

    setLoadingActions((prev) => ({ ...prev, [friendId]: true }));
    setError(null);
    setSuccessMessage(null);

    try {
      await friendService.rejectRequest(friendId);

      // Refresh data to update lists
      await fetchFriendsData();

      setSuccessMessage(`${username} kullanıcısının isteği reddedildi.`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('İstek reddedilemedi.');
      }
    } finally {
      setLoadingActions((prev) => ({ ...prev, [friendId]: false }));
    }
  };

  // Remove friend
  const handleRemoveFriend = async (friendId: number, username: string) => {
    if (!isAuthenticated) return;

    // Show confirmation dialog
    RNAlert.alert(
      'Arkadaşlığı Sonlandır',
      `${username} ile arkadaşlığınızı sonlandırmak istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sonlandır',
          style: 'destructive',
          onPress: async () => {
            setLoadingActions((prev) => ({ ...prev, [friendId]: true }));

            try {
              await friendService.removeFriend(friendId);

              // Refresh data to update lists
              await fetchFriendsData();

              setSuccessMessage(
                `${username} ile arkadaşlığınız sonlandırıldı.`,
              );
            } catch (err) {
              if (err instanceof ApiError) {
                setError(err.message);
              } else {
                setError('Arkadaşlık sonlandırılamadı.');
              }
            } finally {
              setLoadingActions((prev) => ({ ...prev, [friendId]: false }));
            }
          },
        },
      ],
    );
  };

  // Filter buttons with context color
  const FilterButton = ({
    filter,
    title,
    count,
  }: {
    filter: FriendTab;
    title: string;
    count?: number;
  }) => (
    <TouchableOpacity
      style={{
        flex: 1,
        marginHorizontal: Spacing[1],
        paddingVertical: Spacing[2],
        paddingHorizontal: Spacing[2],
        borderRadius: BorderRadius.button,
        backgroundColor:
          activeTab === filter
            ? contextColor
            : isDark
            ? Colors.white
            : Colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 36,
        shadowColor: Colors.gray[900],
        shadowOffset: { width: 10, height: 20 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 10,
      }}
      onPress={() => setActiveTab(filter)}
    >
      <Row style={{ alignItems: 'center' }}>
        <Text
          style={{
            fontSize: 12,
            fontWeight: activeTab === filter ? '600' : '500',
            color:
              activeTab === filter
                ? Colors.white
                : isDark
                ? Colors.gray[700]
                : Colors.gray[700],
            textAlign: 'center',
            fontFamily: 'SecondaryFont-Regular',
          }}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {title}
        </Text>
        {count !== undefined && count > 0 && (
          <Badge
            text={count.toString()}
            variant='primary'
            style={{
              backgroundColor:
                activeTab === filter ? Colors.white : contextColor,
              marginLeft: Spacing[1],
            }}
            textStyle={{
              color: activeTab === filter ? contextColor : Colors.white,
              fontSize: 10,
              fontFamily: 'SecondaryFont-Bold',
            }}
          />
        )}
      </Row>
    </TouchableOpacity>
  );

  // Search result item
  const SearchResultItem = ({ user }: { user: UserSearchResult }) => (
    <PlayfulCard
      style={{
        marginBottom: Spacing[3],
        backgroundColor: 'rgba(255,255,255,0.95)',
        shadowColor: Colors.gray[900],
        shadowOffset: { width: 10, height: 20 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 10,
      }}
    >
      <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Row style={{ alignItems: 'center', flex: 1 }}>
          <Column style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: 'bold',
                color: Colors.gray[800],
                fontFamily: 'SecondaryFont-Bold',
              }}
            >
              {user.username}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: Colors.gray[600],
                fontFamily: 'SecondaryFont-Regular',
              }}
            >
              Kazanma Oranı: {((user.winRate || 0) * 100).toFixed(0)}%
            </Text>
          </Column>
        </Row>
        <Button
          title={loadingActions[user.id] ? 'Gönderiliyor...' : 'İstek Gönder'}
          variant='primary'
          size='small'
          onPress={() => handleSendFriendRequest(user.id, user.username)}
          disabled={loadingActions[user.id]}
          loading={loadingActions[user.id]}
          style={{
            backgroundColor: contextColor,
          }}
          textStyle={{ fontFamily: 'SecondaryFont-Bold' }}
        />
      </Row>
    </PlayfulCard>
  );

  // Friend item
  const FriendItem = ({ friend }: { friend: Friend }) => (
    <PlayfulCard
      style={{
        marginBottom: Spacing[3],
        backgroundColor: 'rgba(255,255,255,0.95)',
        shadowColor: Colors.gray[900],
        shadowOffset: { width: 10, height: 20 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 10,
      }}
    >
      <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Row style={{ alignItems: 'center', flex: 1 }}>
          <Column style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: 'bold',
                color: Colors.gray[800],
                fontFamily: 'SecondaryFont-Bold',
              }}
            >
              {friend.friend_username || `Kullanıcı #${friend.friend_id}`}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: Colors.gray[600],
                fontFamily: 'SecondaryFont-Regular',
              }}
            >
              Arkadaş olundu:{' '}
              {new Date(friend.created_at).toLocaleDateString('tr-TR')}
            </Text>
          </Column>
        </Row>
        <Row style={{ alignItems: 'center' }}>
          <Button
            title='Düello'
            variant='primary'
            size='small'
            onPress={() => {
              // Navigate to duel creation with pre-selected friend
              router.push({
                pathname: '/(tabs)/duels/new' as any,
                params: { preselectedFriend: friend.friend_id.toString() },
              });
            }}
            style={{
              backgroundColor: Colors.vibrant.coral,
              marginRight: Spacing[2],
            }}
            textStyle={{ fontFamily: 'SecondaryFont-Bold' }}
          />
          <Button
            title={loadingActions[friend.friend_id] ? '...' : 'Kaldır'}
            variant='outline'
            size='small'
            onPress={() =>
              handleRemoveFriend(
                friend.friend_id,
                friend.friend_username || `Kullanıcı #${friend.friend_id}`,
              )
            }
            disabled={loadingActions[friend.friend_id]}
            style={{
              borderColor: Colors.error,
              paddingHorizontal: Spacing[2],
            }}
            textStyle={{
              color: Colors.error,
              fontFamily: 'SecondaryFont-Regular',
              fontSize: 12,
            }}
          />
        </Row>
      </Row>
    </PlayfulCard>
  );

  // Pending request item
  const PendingRequestItem = ({ request }: { request: FriendRequest }) => (
    <PlayfulCard
      style={{
        marginBottom: Spacing[3],
        backgroundColor: 'rgba(255,255,255,0.95)',
        shadowColor: Colors.gray[900],
        shadowOffset: { width: 10, height: 20 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 10,
      }}
    >
      <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Row style={{ alignItems: 'center', flex: 1 }}>
          <Column style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: 'bold',
                color: Colors.gray[800],
                fontFamily: 'SecondaryFont-Bold',
              }}
            >
              Kullanıcı #{request.user_id}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: Colors.gray[600],
                fontFamily: 'SecondaryFont-Regular',
              }}
            >
              İstek tarihi:{' '}
              {new Date(request.created_at).toLocaleDateString('tr-TR')}
            </Text>
          </Column>
        </Row>
        <Row style={{ alignItems: 'center' }}>
          <Button
            title={loadingActions[request.user_id] ? '...' : 'Kabul Et'}
            variant='primary'
            size='small'
            onPress={() =>
              handleAcceptRequest(
                request.user_id,
                `Kullanıcı #${request.user_id}`,
              )
            }
            disabled={loadingActions[request.user_id]}
            style={{
              backgroundColor: Colors.vibrant.mint,
              marginRight: Spacing[2],
            }}
            textStyle={{ fontFamily: 'SecondaryFont-Bold' }}
          />
          <Button
            title={loadingActions[request.user_id] ? '...' : 'Reddet'}
            variant='outline'
            size='small'
            onPress={() =>
              handleRejectRequest(
                request.user_id,
                `Kullanıcı #${request.user_id}`,
              )
            }
            disabled={loadingActions[request.user_id]}
            style={{
              borderColor: Colors.error,
              paddingHorizontal: Spacing[2],
            }}
            textStyle={{
              color: Colors.error,
              fontFamily: 'SecondaryFont-Regular',
              fontSize: 12,
            }}
          />
        </Row>
      </Row>
    </PlayfulCard>
  );

  // Search section
  const SearchSection = () => (
    <SlideInElement delay={0}>
      <Card style={{ marginBottom: Spacing[4] }}>
        <Input
          placeholder='Kullanıcı adı ile ara'
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize='none'
          disabled={isSearching}
          inputStyle={{ fontFamily: 'PrimaryFont' }}
        />
        <Button
          title={isSearching ? 'Aranıyor...' : 'Ara'}
          onPress={handleSearch}
          loading={isSearching}
          disabled={!searchQuery.trim() || isSearching}
          style={{
            marginTop: Spacing[2],
            backgroundColor: contextColor,
          }}
          textStyle={{
            fontFamily: 'SecondaryFont-Bold',
            color: Colors.white,
          }}
        />
        {searchError && (
          <Alert
            type='error'
            message={searchError}
            style={{ marginTop: Spacing[2] }}
            dismissible={true}
            onDismiss={() => setSearchError(null)}
          />
        )}
      </Card>
    </SlideInElement>
  );

  // Render tab content
  const renderTabContent = () => {
    if (isLoading) {
      return (
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            padding: Spacing[8],
          }}
        >
          <ActivityIndicator size='large' color={contextColor} />
          <Text
            style={{
              marginTop: Spacing[3],
              color: Colors.white,
              fontFamily: 'SecondaryFont-Regular',
            }}
          >
            Arkadaş verileri yükleniyor...
          </Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'find':
        return (
          <>
            <SearchSection />
            {searchResults.length > 0 && (
              <>
                <SlideInElement delay={100}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: 'bold',
                      color: Colors.white,
                      marginBottom: Spacing[3],
                      fontFamily: 'SecondaryFont-Bold',
                    }}
                  >
                    Arama Sonuçları
                  </Text>
                </SlideInElement>
                {searchResults.map((user, index) => (
                  <SlideInElement key={user.id} delay={200 + index * 100}>
                    <SearchResultItem user={user} />
                  </SlideInElement>
                ))}
              </>
            )}
          </>
        );
      case 'friends':
        return friends.length > 0 ? (
          friends.map((friend, index) => (
            <SlideInElement key={friend.friendship_id} delay={index * 100}>
              <FriendItem friend={friend} />
            </SlideInElement>
          ))
        ) : (
          <SlideInElement delay={0}>
            <EmptyState
              icon='users'
              title='Arkadaş Yok'
              message='Henüz arkadaşınız bulunmuyor. Arkadaş eklemek için "Arkadaş Bul" sekmesini kullanın.'
              fontFamily='SecondaryFont-Regular'
              titleFontFamily='PrimaryFont'
            />
          </SlideInElement>
        );
      case 'pending':
        return pendingRequests.length > 0 ? (
          pendingRequests.map((request, index) => (
            <SlideInElement key={request.friendship_id} delay={index * 100}>
              <PendingRequestItem request={request} />
            </SlideInElement>
          ))
        ) : (
          <SlideInElement delay={0}>
            <EmptyState
              icon='hourglass'
              title='Bekleyen İstek Yok'
              message='Şu an bekleyen arkadaşlık isteği bulunmuyor.'
              fontFamily='SecondaryFont-Regular'
              titleFontFamily='PrimaryFont'
            />
          </SlideInElement>
        );
      default:
        return null;
    }
  };

  // Show loading while checking auth
  if (isCheckingAuth || authLoading) {
    return (
      <Container
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: Spacing[4],
          backgroundColor: contextColor,
        }}
      >
        <ActivityIndicator size='large' color={Colors.white} />
        <Text
          style={{
            marginTop: Spacing[3],
            color: Colors.white,
            fontFamily: 'SecondaryFont-Regular',
            textAlign: 'center',
          }}
        >
          Kimlik doğrulanıyor...
        </Text>
      </Container>
    );
  }

  // Show auth required message
  if (!isAuthenticated) {
    return (
      <Container
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: Spacing[4],
          backgroundColor: contextColor,
        }}
      >
        <EmptyState
          icon='lock'
          title='Giriş Gerekli'
          message='Arkadaş özelliklerini kullanmak için giriş yapmanız gerekiyor.'
          fontFamily='SecondaryFont-Regular'
          titleFontFamily='PrimaryFont'
        />
        <Button
          title='Giriş Yap'
          onPress={() => router.push('/auth/login' as any)}
          style={{ marginTop: Spacing[4] }}
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
            tintColor={contextColor}
            colors={[contextColor]}
          />
        }
      >
        {/* Header Section */}
        <SlideInElement delay={0}>
          <PlayfulCard
            style={{ marginBottom: Spacing[6], backgroundColor: 'transparent' }}
          >
            <Row
              style={{ alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Column style={{ flex: 1 }}>
                <PlayfulTitle
                  level={1}
                  gradient='primary'
                  style={{ fontFamily: 'PrimaryFont', color: Colors.gray[900] }}
                >
                  Arkadaşlar 👥
                </PlayfulTitle>
                <Paragraph
                  color={Colors.gray[700]}
                  style={{
                    fontFamily: 'SecondaryFont-Regular',
                  }}
                >
                  Arkadaş ekleyin, istekleri yönetin ve düello yapın
                </Paragraph>
              </Column>
            </Row>
          </PlayfulCard>
        </SlideInElement>

        {/* Filter Buttons */}
        <SlideInElement delay={100}>
          <View style={{ marginBottom: Spacing[6] }}>
            <Row
              style={{
                marginBottom: Spacing[3],
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <FilterButton filter='find' title='Arkadaş Bul' />
              <FilterButton
                filter='friends'
                title='Arkadaşlarım'
                count={friends.length}
              />
              <FilterButton
                filter='pending'
                title='Bekleyen'
                count={pendingRequests.length}
              />
            </Row>
          </View>
        </SlideInElement>

        {/* Tab Content */}
        <View>
          <FloatingElement>
            <GlassCard
              style={[
                {
                  backgroundColor: contextColor,
                  marginBottom: Spacing[4],
                  overflow: 'hidden',
                  shadowColor: Colors.gray[900],
                  shadowOffset: { width: 10, height: 20 },
                  shadowOpacity: 0.8,
                  shadowRadius: 10,
                  elevation: 10,
                },
              ]}
              animated
            >
              {renderTabContent()}
            </GlassCard>
          </FloatingElement>
        </View>

        {/* Success display */}
        {successMessage && (
          <Alert
            type='success'
            message={successMessage}
            style={{ marginTop: Spacing[4] }}
            dismissible={true}
            onDismiss={() => setSuccessMessage(null)}
          />
        )}

        {/* Error display */}
        {error && (
          <Alert
            type='error'
            message={error}
            style={{ marginTop: Spacing[4] }}
            dismissible={true}
            onDismiss={() => setError(null)}
          />
        )}

        {/* Bottom spacing */}
        <View style={{ height: Spacing[8] }} />
      </ScrollView>
    </View>
  );
}

// Main component with context provider
export default function FriendsScreen() {
  return (
    <PreferredCourseProvider>
      <FriendsScreenContent />
    </PreferredCourseProvider>
  );
}
