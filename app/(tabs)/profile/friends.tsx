import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  useColorScheme,
  Alert as RNAlert,
  StyleSheet,
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

// Optimized shadow style
const OPTIMIZED_SHADOW = {
  shadowColor: Colors.gray[900],
  shadowOffset: { width: 2, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 4,
};

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

  // Memoize the context color to prevent unnecessary re-renders
  const contextColor = useMemo(
    () =>
      ((preferredCourse as any)?.category &&
        getCourseColor((preferredCourse as any).category)) ||
      VIBRANT_COLORS.purple,
    [preferredCourse, getCourseColor],
  );

  // Create dynamic styles based on context color - memoized
  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        contextBackground: {
          backgroundColor: contextColor,
        },
        activeTabButton: {
          backgroundColor: contextColor,
        },
        inactiveTabButton: {
          backgroundColor: isDark ? Colors.white : Colors.white,
        },
        activeTabText: {
          color: Colors.white,
        },
        inactiveTabText: {
          color: isDark ? Colors.gray[700] : Colors.gray[700],
        },
        activeBadgeBackground: {
          backgroundColor: Colors.white,
        },
        activeBadgeText: {
          color: contextColor,
        },
        inactiveBadgeBackground: {
          backgroundColor: contextColor,
        },
        inactiveBadgeText: {
          color: Colors.white,
        },
        glassCardBackground: {
          backgroundColor: contextColor,
        },
        searchButtonBackground: {
          backgroundColor: contextColor,
        },
      }),
    [contextColor, isDark],
  );

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

  // Enhanced auth initialization with cleanup
  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        if (!isMounted) return;
        setIsCheckingAuth(true);

        if (authLoading) {
          return;
        }

        if (!contextUser || !isSessionValid) {
          if (isMounted) {
            setIsAuthenticated(false);
            setIsCheckingAuth(false);
          }
          return;
        }

        const authToken = await AsyncStorage.getItem('authToken');
        if (!authToken) {
          if (isMounted) {
            setIsAuthenticated(false);
            setIsCheckingAuth(false);
          }
          return;
        }

        if (isMounted) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        if (isMounted) {
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setIsCheckingAuth(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [contextUser, isSessionValid, authLoading]);

  // Fetch friends data with cleanup
  const fetchFriendsData = useCallback(async () => {
    let isMounted = true;

    if (!isAuthenticated) return;

    try {
      if (!isMounted) return;
      setError(null);

      const [friendsData, pendingData] = await Promise.all([
        friendService.getUserFriends(),
        friendService.getPendingRequests(),
      ]);

      if (isMounted) {
        setFriends(friendsData || []);
        setPendingRequests(pendingData || []);
      }
    } catch (e) {
      if (isMounted) {
        setError('Arkadaş verileri yüklenirken bir hata oluştu.');
      }
      console.error('Error fetching friends data:', e);
    }

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  // Initial data fetch with cleanup
  useEffect(() => {
    let isMounted = true;

    const initialFetch = async () => {
      if (!isMounted) return;
      setIsLoading(true);
      await fetchFriendsData();
      if (isMounted) {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      initialFetch();
    }

    return () => {
      isMounted = false;
    };
  }, [fetchFriendsData, isAuthenticated]);

  // Handle refresh with cleanup
  const handleRefresh = useCallback(async () => {
    let isMounted = true;

    if (!isMounted) return;
    setRefreshing(true);
    await fetchFriendsData();
    if (isMounted) {
      setRefreshing(false);
    }

    return () => {
      isMounted = false;
    };
  }, [fetchFriendsData]);

  // Simple search function with cleanup
  const handleSearch = useCallback(async () => {
    let isMounted = true;

    if (!searchQuery.trim() || !isAuthenticated) {
      return;
    }

    if (!isMounted) return;
    setIsSearching(true);
    setSearchError(null);
    setSuccessMessage(null);
    setError(null);
    setSearchResults([]);

    try {
      const user = await userService.searchUserByUsername(searchQuery.trim());

      if (!isMounted) return;

      if (user) {
        setSearchResults([
          {
            id: user.id,
            username: user.username,
            email: user.email,
            winRate: 0,
          },
        ]);
      } else {
        setSearchError(`'${searchQuery}' kullanıcısı bulunamadı.`);
      }
    } catch (err) {
      if (isMounted) {
        setSearchError('Arama sırasında hata oluştu.');
      }
      console.error('Search error:', err);
    } finally {
      if (isMounted) {
        setIsSearching(false);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [searchQuery, isAuthenticated]);

  // Send friend request with cleanup
  const handleSendFriendRequest = useCallback(
    async (userId: number, username: string) => {
      let isMounted = true;

      if (!isAuthenticated) return;

      if (!isMounted) return;
      setLoadingActions((prev) => ({ ...prev, [userId]: true }));
      setSearchError(null);
      setSuccessMessage(null);
      setError(null);

      try {
        await friendService.sendFriendRequest(userId);

        if (isMounted) {
          setSearchResults((prev) => prev.filter((user) => user.id !== userId));
          setSearchError(null);
          setSuccessMessage(
            `${username} kullanıcısına arkadaşlık isteği gönderildi.`,
          );
        }
        await fetchFriendsData();
      } catch (err) {
        if (isMounted) {
          if (err instanceof ApiError) {
            setSearchError(err.message);
          } else {
            setSearchError('Arkadaşlık isteği gönderilemedi.');
          }
        }
      } finally {
        if (isMounted) {
          setLoadingActions((prev) => ({ ...prev, [userId]: false }));
        }
      }

      return () => {
        isMounted = false;
      };
    },
    [isAuthenticated, fetchFriendsData],
  );

  // Accept friend request with cleanup
  const handleAcceptRequest = useCallback(
    async (friendId: number, username: string) => {
      let isMounted = true;

      if (!isAuthenticated) return;

      if (!isMounted) return;
      setLoadingActions((prev) => ({ ...prev, [friendId]: true }));
      setError(null);
      setSuccessMessage(null);

      try {
        await friendService.acceptRequest(friendId);
        await fetchFriendsData();

        if (isMounted) {
          setSuccessMessage(`${username} ile artık arkadaşsınız!`);
        }
      } catch (err) {
        if (isMounted) {
          if (err instanceof ApiError) {
            setError(err.message);
          } else {
            setError('İstek kabul edilemedi.');
          }
        }
      } finally {
        if (isMounted) {
          setLoadingActions((prev) => ({ ...prev, [friendId]: false }));
        }
      }

      return () => {
        isMounted = false;
      };
    },
    [isAuthenticated, fetchFriendsData],
  );

  // Reject friend request with cleanup
  const handleRejectRequest = useCallback(
    async (friendId: number, username: string) => {
      let isMounted = true;

      if (!isAuthenticated) return;

      if (!isMounted) return;
      setLoadingActions((prev) => ({ ...prev, [friendId]: true }));
      setError(null);
      setSuccessMessage(null);

      try {
        await friendService.rejectRequest(friendId);
        await fetchFriendsData();

        if (isMounted) {
          setSuccessMessage(`${username} kullanıcısının isteği reddedildi.`);
        }
      } catch (err) {
        if (isMounted) {
          if (err instanceof ApiError) {
            setError(err.message);
          } else {
            setError('İstek reddedilemedi.');
          }
        }
      } finally {
        if (isMounted) {
          setLoadingActions((prev) => ({ ...prev, [friendId]: false }));
        }
      }

      return () => {
        isMounted = false;
      };
    },
    [isAuthenticated, fetchFriendsData],
  );

  // Remove friend with cleanup
  const handleRemoveFriend = useCallback(
    async (friendId: number, username: string) => {
      if (!isAuthenticated) return;

      RNAlert.alert(
        'Arkadaşlığı Sonlandır',
        `${username} ile arkadaşlığınızı sonlandırmak istediğinizden emin misiniz?`,
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'Sonlandır',
            style: 'destructive',
            onPress: async () => {
              let isMounted = true;

              if (!isMounted) return;
              setLoadingActions((prev) => ({ ...prev, [friendId]: true }));

              try {
                await friendService.removeFriend(friendId);
                await fetchFriendsData();

                if (isMounted) {
                  setSuccessMessage(
                    `${username} ile arkadaşlığınız sonlandırıldı.`,
                  );
                }
              } catch (err) {
                if (isMounted) {
                  if (err instanceof ApiError) {
                    setError(err.message);
                  } else {
                    setError('Arkadaşlık sonlandırılamadı.');
                  }
                }
              } finally {
                if (isMounted) {
                  setLoadingActions((prev) => ({ ...prev, [friendId]: false }));
                }
              }

              return () => {
                isMounted = false;
              };
            },
          },
        ],
      );
    },
    [isAuthenticated, fetchFriendsData],
  );

  // Filter buttons with context color - memoized component
  const FilterButton = React.memo(
    ({
      filter,
      title,
      count,
    }: {
      filter: FriendTab;
      title: string;
      count?: number;
    }) => (
      <TouchableOpacity
        style={[
          styles.filterButton,
          activeTab === filter
            ? dynamicStyles.activeTabButton
            : dynamicStyles.inactiveTabButton,
          OPTIMIZED_SHADOW,
        ]}
        onPress={() => setActiveTab(filter)}
      >
        <Row style={styles.filterButtonRow}>
          <Text
            style={[
              styles.filterButtonText,
              activeTab === filter
                ? dynamicStyles.activeTabText
                : dynamicStyles.inactiveTabText,
              { fontWeight: activeTab === filter ? '600' : '500' },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {title}
          </Text>
          {count !== undefined && count > 0 && (
            <Badge
              text={count.toString()}
              variant='primary'
              style={[
                styles.filterBadge,
                activeTab === filter
                  ? dynamicStyles.activeBadgeBackground
                  : dynamicStyles.inactiveBadgeBackground,
              ]}
              textStyle={[
                styles.filterBadgeText,
                activeTab === filter
                  ? dynamicStyles.activeBadgeText
                  : dynamicStyles.inactiveBadgeText,
              ]}
            />
          )}
        </Row>
      </TouchableOpacity>
    ),
  );

  // Search result item - memoized component
  const SearchResultItem = React.memo(
    ({ user }: { user: UserSearchResult }) => (
      <PlayfulCard style={[styles.searchResultCard, OPTIMIZED_SHADOW]}>
        <Row style={styles.searchResultRow}>
          <Row style={styles.searchResultInfo}>
            <Column style={styles.searchResultColumn}>
              <Text style={styles.searchResultUsername}>{user.username}</Text>
              <Text style={styles.searchResultWinRate}>
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
            style={dynamicStyles.contextBackground}
            textStyle={styles.buttonText}
          />
        </Row>
      </PlayfulCard>
    ),
  );

  // Friend item - memoized component
  const FriendItem = React.memo(({ friend }: { friend: Friend }) => (
    <PlayfulCard style={[styles.friendCard, OPTIMIZED_SHADOW]}>
      <Row style={styles.friendRow}>
        <Row style={styles.friendInfo}>
          <Column style={styles.friendColumn}>
            <Text style={styles.friendUsername}>
              {friend.friend_username || `Kullanıcı #${friend.friend_id}`}
            </Text>
            <Text style={styles.friendDate}>
              Arkadaş olundu:{' '}
              {new Date(friend.created_at).toLocaleDateString('tr-TR')}
            </Text>
          </Column>
        </Row>
        <Row style={styles.friendActions}>
          <Button
            title='Düello'
            variant='primary'
            size='small'
            onPress={() => {
              router.push({
                pathname: '/(tabs)/duels/new' as any,
                params: { preselectedFriend: friend.friend_id.toString() },
              });
            }}
            style={styles.duelButton}
            textStyle={styles.buttonText}
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
            style={styles.removeButton}
            textStyle={styles.removeButtonText}
          />
        </Row>
      </Row>
    </PlayfulCard>
  ));

  // Pending request item - memoized component
  const PendingRequestItem = React.memo(
    ({ request }: { request: FriendRequest }) => (
      <PlayfulCard style={[styles.pendingCard, OPTIMIZED_SHADOW]}>
        <Row style={styles.pendingRow}>
          <Row style={styles.pendingInfo}>
            <Column style={styles.pendingColumn}>
              <Text style={styles.pendingUsername}>
                Kullanıcı #{request.user_id}
              </Text>
              <Text style={styles.pendingDate}>
                İstek tarihi:{' '}
                {new Date(request.created_at).toLocaleDateString('tr-TR')}
              </Text>
            </Column>
          </Row>
          <Row style={styles.pendingActions}>
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
              style={styles.acceptButton}
              textStyle={styles.buttonText}
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
              style={styles.rejectButton}
              textStyle={styles.rejectButtonText}
            />
          </Row>
        </Row>
      </PlayfulCard>
    ),
  );

  // Render tab content - memoized
  const renderTabContent = useMemo(() => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={contextColor} />
          <Text style={styles.loadingText}>Arkadaş verileri yükleniyor...</Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'find':
        return (
          <>
            {/* CLEAN SIMPLE SEARCH INPUT */}
            <SlideInElement delay={0}>
              <Card style={styles.searchCard}>
                <Input
                  placeholder='Kullanıcı adı ile ara'
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize='none'
                  disabled={isSearching}
                  inputStyle={styles.searchInput}
                />
                <Button
                  title={isSearching ? 'Aranıyor...' : 'Ara'}
                  onPress={handleSearch}
                  loading={isSearching}
                  disabled={!searchQuery.trim() || isSearching}
                  style={[
                    styles.searchButton,
                    dynamicStyles.searchButtonBackground,
                  ]}
                  textStyle={styles.searchButtonText}
                />
                {searchError && (
                  <Alert
                    type='error'
                    message={searchError}
                    style={styles.searchAlert}
                    dismissible={true}
                    onDismiss={() => setSearchError(null)}
                  />
                )}
              </Card>
            </SlideInElement>

            {searchResults.length > 0 && (
              <>
                <SlideInElement delay={100}>
                  <Text style={styles.searchResultsTitle}>Arama Sonuçları</Text>
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
  }, [
    activeTab,
    isLoading,
    searchResults,
    friends,
    pendingRequests,
    contextColor,
    searchQuery,
    isSearching,
    searchError,
    dynamicStyles,
  ]);

  // Show loading while checking auth
  if (isCheckingAuth || authLoading) {
    return (
      <Container
        style={[styles.authLoadingContainer, dynamicStyles.contextBackground]}
      >
        <ActivityIndicator size='large' color={Colors.white} />
        <Text style={styles.authLoadingText}>Kimlik doğrulanıyor...</Text>
      </Container>
    );
  }

  // Show auth required message
  if (!isAuthenticated) {
    return (
      <Container
        style={[styles.authRequiredContainer, dynamicStyles.contextBackground]}
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
          style={styles.loginButton}
        />
      </Container>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
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
          <PlayfulCard style={styles.headerCard}>
            <Row style={styles.headerRow}>
              <Column style={styles.headerColumn}>
                <PlayfulTitle
                  level={1}
                  gradient='primary'
                  style={styles.headerTitle}
                >
                  Arkadaşlar 👥
                </PlayfulTitle>
                <Paragraph
                  color={Colors.gray[700]}
                  style={styles.headerSubtitle}
                >
                  Arkadaş ekleyin, istekleri yönetin ve düello yapın
                </Paragraph>
              </Column>
            </Row>
          </PlayfulCard>
        </SlideInElement>

        {/* Filter Buttons */}
        <SlideInElement delay={100}>
          <View style={styles.filtersContainer}>
            <Row style={styles.filtersRow}>
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
                styles.contentCard,
                dynamicStyles.glassCardBackground,
                OPTIMIZED_SHADOW,
              ]}
              animated
            >
              {renderTabContent}
            </GlassCard>
          </FloatingElement>
        </View>

        {/* Success display */}
        {successMessage && (
          <Alert
            type='success'
            message={successMessage}
            style={styles.successAlert}
            dismissible={true}
            onDismiss={() => setSuccessMessage(null)}
          />
        )}

        {/* Error display */}
        {error && (
          <Alert
            type='error'
            message={error}
            style={styles.errorAlert}
            dismissible={true}
            onDismiss={() => setError(null)}
          />
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

// StyleSheet for all static styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing[4],
  },
  authLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[4],
  },
  authLoadingText: {
    marginTop: Spacing[3],
    color: Colors.white,
    fontFamily: 'SecondaryFont-Regular',
    textAlign: 'center',
  },
  authRequiredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[4],
  },
  loginButton: {
    marginTop: Spacing[4],
  },
  headerCard: {
    marginBottom: Spacing[6],
    backgroundColor: 'transparent',
  },
  headerRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerColumn: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: 'PrimaryFont',
    color: Colors.gray[900],
  },
  headerSubtitle: {
    fontFamily: 'SecondaryFont-Regular',
  },
  filtersContainer: {
    marginBottom: Spacing[6],
  },
  filtersRow: {
    marginBottom: Spacing[3],
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterButton: {
    flex: 1,
    marginHorizontal: Spacing[1],
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[2],
    borderRadius: BorderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  filterButtonRow: {
    alignItems: 'center',
  },
  filterButtonText: {
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'SecondaryFont-Regular',
  },
  filterBadge: {
    marginLeft: Spacing[1],
  },
  filterBadgeText: {
    fontSize: 10,
    fontFamily: 'SecondaryFont-Bold',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing[8],
  },
  loadingText: {
    marginTop: Spacing[3],
    color: Colors.white,
    fontFamily: 'SecondaryFont-Regular',
  },
  searchCard: {
    marginBottom: Spacing[4],
  },
  searchInput: {
    fontFamily: 'PrimaryFont',
  },
  searchButton: {
    marginTop: Spacing[2],
  },
  searchButtonText: {
    fontFamily: 'SecondaryFont-Bold',
    color: Colors.white,
  },
  searchAlert: {
    marginTop: Spacing[2],
  },
  searchResultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: Spacing[3],
    fontFamily: 'SecondaryFont-Bold',
  },
  searchResultCard: {
    marginBottom: Spacing[3],
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  searchResultRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchResultInfo: {
    alignItems: 'center',
    flex: 1,
  },
  searchResultColumn: {
    flex: 1,
  },
  searchResultUsername: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.gray[800],
    fontFamily: 'SecondaryFont-Bold',
  },
  searchResultWinRate: {
    fontSize: 12,
    color: Colors.gray[600],
    fontFamily: 'SecondaryFont-Regular',
  },
  friendCard: {
    marginBottom: Spacing[3],
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  friendRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  friendInfo: {
    alignItems: 'center',
    flex: 1,
  },
  friendColumn: {
    flex: 1,
  },
  friendUsername: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.gray[800],
    fontFamily: 'SecondaryFont-Bold',
  },
  friendDate: {
    fontSize: 12,
    color: Colors.gray[600],
    fontFamily: 'SecondaryFont-Regular',
  },
  friendActions: {
    alignItems: 'center',
  },
  duelButton: {
    backgroundColor: Colors.vibrant.coral,
    marginRight: Spacing[2],
  },
  removeButton: {
    borderColor: Colors.error,
    paddingHorizontal: Spacing[2],
  },
  removeButtonText: {
    color: Colors.error,
    fontFamily: 'SecondaryFont-Regular',
    fontSize: 12,
  },
  pendingCard: {
    marginBottom: Spacing[3],
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  pendingRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pendingInfo: {
    alignItems: 'center',
    flex: 1,
  },
  pendingColumn: {
    flex: 1,
  },
  pendingUsername: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.gray[800],
    fontFamily: 'SecondaryFont-Bold',
  },
  pendingDate: {
    fontSize: 12,
    color: Colors.gray[600],
    fontFamily: 'SecondaryFont-Regular',
  },
  pendingActions: {
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: Colors.vibrant.mint,
    marginRight: Spacing[2],
  },
  rejectButton: {
    borderColor: Colors.error,
    paddingHorizontal: Spacing[2],
  },
  rejectButtonText: {
    color: Colors.error,
    fontFamily: 'SecondaryFont-Regular',
    fontSize: 12,
  },
  buttonText: {
    fontFamily: 'SecondaryFont-Bold',
  },
  contentCard: {
    marginBottom: Spacing[4],
    overflow: 'hidden',
  },
  successAlert: {
    marginTop: Spacing[4],
  },
  errorAlert: {
    marginTop: Spacing[4],
  },
  bottomSpacing: {
    height: Spacing[8],
  },
});

// Main component with context provider
export default function FriendsScreen() {
  return (
    <PreferredCourseProvider>
      <FriendsScreenContent />
    </PreferredCourseProvider>
  );
}
