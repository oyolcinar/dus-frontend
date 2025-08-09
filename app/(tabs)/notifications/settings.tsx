import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  useColorScheme,
  Platform,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import {
  NotificationType,
  NotificationPreferences,
  TestNotificationRequest,
} from '../../../src/types/models';
import {
  getPreferences,
  updatePreferences,
  sendTestNotification,
  registerDeviceToken,
  setupPushNotifications,
  isNotificationTypeEnabled,
  getNotificationIcon,
  getNotificationColor,
} from '../../../src/api/notificationService';
import {
  PlayfulCard,
  PlayfulButton,
  Container,
  PlayfulTitle,
  Paragraph,
  Row,
  Column,
  SlideInElement,
  FloatingElement,
} from '../../../components/ui';
import { Colors, Spacing, BorderRadius } from '../../../constants/theme';

type FilterType = 'all' | 'study' | 'social' | 'system';

// Optimized shadow configuration
const OPTIMIZED_SHADOW = {
  // shadowColor: Colors.gray[900],
  // shadowOffset: { width: 2, height: 4 },
  // shadowOpacity: 0.3,
  // shadowRadius: 4,
  // elevation: 4,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing[4],
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[4],
  },
  loadingText: {
    marginTop: Spacing[3],
    color: Colors.white,
    fontFamily: 'SecondaryFont-Regular',
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    marginTop: Spacing[3],
    color: Colors.white,
    fontFamily: 'SecondaryFont-Regular',
    fontSize: 16,
    textAlign: 'center',
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
  deviceTokenText: {
    marginTop: Spacing[2],
    color: Colors.gray[700],
    fontSize: 12,
    fontFamily: 'SecondaryFont-Regular',
    opacity: 0.8,
  },
  filterContainer: {
    marginBottom: Spacing[6],
  },
  filterRow: {
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
    ...OPTIMIZED_SHADOW,
  },
  filterButtonActive: {
    backgroundColor: Colors.vibrant.purple,
  },
  filterButtonInactive: {
    backgroundColor: Colors.white,
  },
  filterText: {
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'SecondaryFont-Regular',
  },
  filterTextActive: {
    fontWeight: '600',
    color: Colors.white,
  },
  filterTextInactive: {
    fontWeight: '500',
    color: Colors.gray[700],
  },
  quickActionsCard: {
    marginBottom: Spacing[4],
    ...OPTIMIZED_SHADOW,
  },
  quickActions: {
    justifyContent: 'space-between',
  },
  quickActionsRow: {
    justifyContent: 'space-between',
    marginTop: Spacing[3],
  },
  quickActionButton: {
    flex: 1,
  },
  retryButton: {
    marginTop: Spacing[4],
    ...OPTIMIZED_SHADOW,
  },
  settingCard: {
    marginBottom: Spacing[4],
    ...OPTIMIZED_SHADOW,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing[4],
  },
  settingHeaderContent: {
    flex: 1,
    alignItems: 'flex-start',
  },
  typeIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing[3],
  },
  settingColumn: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[100],
    marginBottom: Spacing[1],
    fontFamily: 'SecondaryFont-Bold',
  },
  settingDescription: {
    fontSize: 13,
    color: Colors.gray[300],
    lineHeight: 18,
    fontFamily: 'SecondaryFont-Regular',
  },
  settingOptions: {
    gap: Spacing[3],
  },
  settingRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[100],
  },
  settingInfo: {
    alignItems: 'center',
    gap: Spacing[3],
    flexDirection: 'row',
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.gray[100],
    fontFamily: 'SecondaryFont-Regular',
  },
  frequencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[3],
    backgroundColor: Colors.vibrant.coral,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing[2],
    ...OPTIMIZED_SHADOW,
  },
  frequencyInfo: {
    alignItems: 'center',
    gap: Spacing[2],
    flexDirection: 'row',
  },
  frequencyText: {
    fontSize: 14,
    color: Colors.gray[700],
    fontWeight: '500',
    fontFamily: 'SecondaryFont-Regular',
  },
  bottomSpacing: {
    height: Spacing[8],
  },
});

const NotificationSettingsScreen: React.FC = React.memo(() => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Refs for cleanup
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // State
  const [preferences, setPreferences] = useState<NotificationPreferences[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');

  // Memoized constants
  const notificationTypeNames: Record<NotificationType, string> = useMemo(
    () => ({
      study_reminder: 'Çalışma Hatırlatıcıları',
      achievement_unlock: 'Başarı Bildirimleri',
      duel_invitation: 'Düello Davetleri',
      duel_result: 'Düello Sonuçları',
      friend_request: 'Arkadaşlık İstekleri',
      friend_activity: 'Arkadaş Aktiviteleri',
      content_update: 'İçerik Güncellemeleri',
      streak_reminder: 'Seri Hatırlatıcıları',
      plan_reminder: 'Plan Hatırlatıcıları',
      coaching_note: 'Koçluk Notları',
      motivational_message: 'Motivasyon Mesajları',
      system_announcement: 'Sistem Duyuruları',
      course_reminder: 'Ders Hatırlatmaları',
      course_completed: 'Ders Tamamlama Bildirimleri',
      course_progress: 'Ders İlerleme Bildirimleri',
      course_milestone: 'Ders Kilometre Taşı Bildirimleri',
      course_study_session: 'Ders Çalışma Seansı Bildirimleri',
    }),
    [],
  );

  const notificationTypeDescriptions: Record<NotificationType, string> =
    useMemo(
      () => ({
        study_reminder: 'Günlük çalışma hedefleriniz için hatırlatıcılar',
        achievement_unlock: 'Yeni başarılar kazandığınızda bildirimler',
        duel_invitation: 'Size düello daveti geldiğinde bildirimler',
        duel_result: 'Düello sonuçları hakkında bildirimler',
        friend_request: 'Yeni arkadaşlık istekleri',
        friend_activity: 'Arkadaşlarınızın aktiviteleri hakkında bildirimler',
        content_update: 'Yeni içerik ve özellikler hakkında bildirimler',
        streak_reminder: 'Çalışma serinizi sürdürmeniz için hatırlatıcılar',
        plan_reminder: 'Çalışma planınızdaki görevler için hatırlatıcılar',
        coaching_note: 'Kişiselleştirilmiş koçluk önerileri',
        motivational_message: 'Motivasyon artırıcı mesajlar',
        system_announcement: 'Önemli sistem duyuruları',
        course_reminder: 'Ders çalışma zamanları için hatırlatıcılar',
        course_completed: 'Derslerinizi tamamladığınızda bildirimler',
        course_progress: 'Ders ilerleme durumunuz hakkında güncellemeler',
        course_milestone: 'Önemli ders aşamalarını geçtiğinizde bildirimler',
        course_study_session: 'Çalışma seanslarınız hakkında bildirimler',
      }),
      [],
    );

  // Categorize notification types
  const notificationCategories: Record<FilterType, NotificationType[]> =
    useMemo(
      () => ({
        all: Object.keys(notificationTypeNames) as NotificationType[],
        study: [
          'study_reminder',
          'streak_reminder',
          'plan_reminder',
          'coaching_note',
          'course_reminder',
          'course_completed',
          'course_progress',
          'course_milestone',
          'course_study_session',
        ],
        social: [
          'duel_invitation',
          'duel_result',
          'friend_request',
          'friend_activity',
        ],
        system: [
          'achievement_unlock',
          'content_update',
          'motivational_message',
          'system_announcement',
        ],
      }),
      [notificationTypeNames],
    );

  // Memoized color calculations
  const colors = useMemo(
    () => ({
      loading: Colors.vibrant?.coral || Colors.primary.DEFAULT,
      headerText: isDark ? Colors.gray[700] : Colors.gray[700],
    }),
    [isDark],
  );

  // Load user preferences and setup push notifications with cleanup
  const loadPreferences = useCallback(async () => {
    if (!isMountedRef.current) return;

    // Create new abort controller for this request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      console.log('🔄 Starting loadPreferences...');
      setError(null);

      // Load preferences from API
      console.log('📡 Calling getPreferences...');
      const userPreferences = await getPreferences();

      if (!isMountedRef.current) return;

      console.log('✅ getPreferences completed:', userPreferences);
      setPreferences(userPreferences);

      // Setup push notifications using the service function
      console.log('📱 Calling setupPushNotifications from service...');
      const pushResult = await setupPushNotifications();

      if (!isMountedRef.current) return;

      console.log('📱 setupPushNotifications result:', pushResult);

      if (pushResult.success && pushResult.token && !pushResult.isDevelopment) {
        setDeviceToken(pushResult.token);
        console.log('✅ Real device token set:', pushResult.token);
      } else if (pushResult.isDevelopment) {
        setDeviceToken('EXPO_GO_MOCK_TOKEN');
        console.log('🚀 Development mode - mock token used');
      }

      console.log('✅ loadPreferences completed successfully');
    } catch (err: any) {
      if (!isMountedRef.current) return;
      console.error('❌ loadPreferences error:', err);
      setError(`Ayarlar yüklenirken bir hata oluştu: ${err.message}`);
    }
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    if (!isMountedRef.current) return;
    setRefreshing(true);
    await loadPreferences();
    if (isMountedRef.current) {
      setRefreshing(false);
    }
  }, [loadPreferences]);

  // Handle retry
  const handleRetry = useCallback(async () => {
    if (!isMountedRef.current) return;
    setIsLoading(true);
    await loadPreferences();
    if (isMountedRef.current) {
      setIsLoading(false);
    }
  }, [loadPreferences]);

  // Get preference for specific notification type
  const getPreferenceForType = useCallback(
    (type: NotificationType): NotificationPreferences | null => {
      return preferences.find((p) => p.notification_type === type) || null;
    },
    [preferences],
  );

  // Handle toggle switches
  const handleToggle = useCallback(
    async (
      type: NotificationType,
      setting: 'in_app_enabled' | 'push_enabled' | 'email_enabled',
      value: boolean,
    ) => {
      if (!isMountedRef.current) return;

      try {
        setSaving(`${type}-${setting}`);

        // Update preference via API
        const updatedPreference = await updatePreferences(type, {
          [setting]: value,
        });

        if (!isMountedRef.current) return;

        // Update local state
        setPreferences((prev) => {
          const existingIndex = prev.findIndex(
            (p) => p.notification_type === type,
          );
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = updatedPreference;
            return updated;
          } else {
            return [...prev, updatedPreference];
          }
        });

        // Show success message for important changes
        if (setting === 'push_enabled' && value) {
          Alert.alert(
            'Push Bildirimleri Açıldı',
            'Push bildirimleri için cihazınızın bildirim ayarlarını da kontrol edin.',
            [{ text: 'Tamam' }],
          );
        }
      } catch (err: any) {
        if (!isMountedRef.current) return;
        console.error('Error updating preference:', err);
        Alert.alert(
          'Hata',
          'Ayar güncellenirken bir hata oluştu. Lütfen tekrar deneyin.',
        );
      } finally {
        if (isMountedRef.current) {
          setSaving(null);
        }
      }
    },
    [preferences],
  );

  // Handle frequency updates
  const handleFrequencyUpdate = useCallback(
    async (type: NotificationType, frequency: number) => {
      if (!isMountedRef.current) return;

      try {
        setSaving(`${type}-frequency`);

        const updatedPreference = await updatePreferences(type, {
          frequency_hours: frequency,
        });

        if (!isMountedRef.current) return;

        // Update local state
        setPreferences((prev) => {
          const existingIndex = prev.findIndex(
            (p) => p.notification_type === type,
          );
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = updatedPreference;
            return updated;
          } else {
            return [...prev, updatedPreference];
          }
        });
      } catch (err: any) {
        if (!isMountedRef.current) return;
        console.error('Error updating frequency:', err);
        Alert.alert('Hata', 'Sıklık ayarı güncellenirken bir hata oluştu.');
      } finally {
        if (isMountedRef.current) {
          setSaving(null);
        }
      }
    },
    [],
  );

  // Handle frequency change dialog
  const handleFrequencyChange = useCallback(
    async (type: NotificationType) => {
      const currentPref = getPreferenceForType(type);
      const currentFrequency = currentPref?.frequency_hours || 24;

      Alert.alert('Bildirim Sıklığı', 'Bu bildirim türü için sıklık seçin:', [
        {
          text: 'Saatte bir (1 saat)',
          onPress: () => handleFrequencyUpdate(type, 1),
        },
        {
          text: 'Günde bir (24 saat)',
          onPress: () => handleFrequencyUpdate(type, 24),
        },
        {
          text: 'Haftada bir (168 saat)',
          onPress: () => handleFrequencyUpdate(type, 168),
        },
        {
          text: 'İptal',
          style: 'cancel',
        },
      ]);
    },
    [getPreferenceForType, handleFrequencyUpdate],
  );

  // Handle test notification
  const handleTestNotification = useCallback(async () => {
    try {
      const testRequest: TestNotificationRequest = {
        template_name: 'test_notification',
        notification_type: 'system_announcement',
        variables: {
          message: 'Bu bir test bildirimidir! 🎉',
          title: 'Test Bildirimi',
        },
      };

      await sendTestNotification(testRequest);

      Alert.alert(
        'Test Bildirimi Gönderildi',
        'Test bildirimi başarıyla gönderildi. Birkaç saniye içinde almanız gerekiyor.',
        [{ text: 'Tamam' }],
      );
    } catch (error: any) {
      console.error('Error sending test notification:', error);
      Alert.alert(
        'Hata',
        'Test bildirimi gönderilemedi. İnternet bağlantınızı kontrol edin.',
      );
    }
  }, []);

  // Handle bulk actions (enable/disable all)
  const handleBulkAction = useCallback(
    async (enabled: boolean) => {
      if (!isMountedRef.current) return;

      try {
        setSaving('bulk-action');

        const types =
          selectedFilter === 'all'
            ? Object.keys(notificationTypeNames)
            : notificationCategories[selectedFilter];

        const promises = types.map(async (type) => {
          const notificationType = type as NotificationType;

          // Update each preference type
          await Promise.all([
            updatePreferences(notificationType, { in_app_enabled: enabled }),
            updatePreferences(notificationType, { push_enabled: enabled }),
            updatePreferences(notificationType, {
              email_enabled: enabled && false,
            }),
          ]);
        });

        await Promise.all(promises);

        if (!isMountedRef.current) return;

        // Reload preferences to get updated state
        await loadPreferences();

        Alert.alert(
          'Ayarlar Güncellendi',
          `${selectedFilter === 'all' ? 'Tüm' : 'Seçili'} bildirimler ${
            enabled ? 'açıldı' : 'kapatıldı'
          }.`,
          [{ text: 'Tamam' }],
        );
      } catch (error: any) {
        if (!isMountedRef.current) return;
        console.error('Error updating bulk preferences:', error);
        Alert.alert('Hata', 'Toplu işlem sırasında bir hata oluştu.');
      } finally {
        if (isMountedRef.current) {
          setSaving(null);
        }
      }
    },
    [
      selectedFilter,
      notificationCategories,
      notificationTypeNames,
      loadPreferences,
    ],
  );

  // Get filtered notification types
  const getFilteredNotificationTypes = useCallback(() => {
    return notificationCategories[selectedFilter];
  }, [notificationCategories, selectedFilter]);

  // Memoized Filter Button Component
  const FilterButton = React.memo(
    ({ filter, title }: { filter: FilterType; title: string }) => {
      const isActive = selectedFilter === filter;

      return (
        <TouchableOpacity
          style={[
            styles.filterButton,
            isActive ? styles.filterButtonActive : styles.filterButtonInactive,
          ]}
          onPress={() => setSelectedFilter(filter)}
        >
          <Text
            style={[
              styles.filterText,
              isActive ? styles.filterTextActive : styles.filterTextInactive,
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {title}
          </Text>
        </TouchableOpacity>
      );
    },
  );

  // Memoized Switch Track Colors
  const switchTrackColors = useMemo(
    () => ({
      false: Colors.gray[300],
      true: Colors.primary.light,
    }),
    [],
  );

  // Memoized icon background colors
  const iconBackgroundColors = useMemo(
    () => ({
      smartphone: Colors.vibrant?.blue || Colors.primary.DEFAULT,
      bell: Colors.vibrant?.orange || Colors.secondary.DEFAULT,
      mail: Colors.vibrant?.green || Colors.success,
      clock: Colors.vibrant?.purple || Colors.primary.dark,
    }),
    [],
  );

  // Render notification type settings
  const renderNotificationTypeSettings = useCallback(
    (type: NotificationType, index: number) => {
      const pref = getPreferenceForType(type);
      const isLoadingThis = saving?.startsWith(type);
      const icon = getNotificationIcon(type);
      const color = getNotificationColor(type);

      const frequencyText = useMemo(() => {
        if (pref?.frequency_hours === 1) return 'Saatte bir';
        if (pref?.frequency_hours === 24) return 'Günde bir';
        if (pref?.frequency_hours === 168) return 'Haftada bir';
        return `${pref?.frequency_hours || 24} saatte bir`;
      }, [pref?.frequency_hours]);

      const showFrequencyButton =
        pref?.in_app_enabled || pref?.push_enabled || pref?.email_enabled;

      return (
        <SlideInElement key={type} delay={400 + index * 100}>
          <PlayfulCard
            style={styles.settingCard}
            variant='elevated'
            animated
            floatingAnimation={index % 2 === 0}
          >
            <View style={styles.settingHeader}>
              <Row style={styles.settingHeaderContent}>
                <View
                  style={[styles.typeIconWrapper, { backgroundColor: color }]}
                >
                  <Feather name={icon as any} size={20} color={Colors.white} />
                </View>
                <Column style={styles.settingColumn}>
                  <Text style={styles.settingTitle}>
                    {notificationTypeNames[type]}
                  </Text>
                  <Text style={styles.settingDescription}>
                    {notificationTypeDescriptions[type]}
                  </Text>
                </Column>
              </Row>
              {isLoadingThis && (
                <ActivityIndicator
                  size='small'
                  color={Colors.primary.DEFAULT}
                />
              )}
            </View>

            <View style={styles.settingOptions}>
              {/* In-App Notifications */}
              <Row style={styles.settingRow}>
                <Row style={styles.settingInfo}>
                  <View
                    style={[
                      styles.iconWrapper,
                      { backgroundColor: iconBackgroundColors.smartphone },
                    ]}
                  >
                    <Feather name='smartphone' size={16} color={Colors.white} />
                  </View>
                  <Text style={styles.settingLabel}>Uygulama İçi</Text>
                </Row>
                <Switch
                  value={pref?.in_app_enabled ?? true}
                  onValueChange={(value) =>
                    handleToggle(type, 'in_app_enabled', value)
                  }
                  trackColor={switchTrackColors}
                  thumbColor={
                    pref?.in_app_enabled
                      ? Colors.primary.DEFAULT
                      : Colors.gray[100]
                  }
                  disabled={isLoadingThis}
                />
              </Row>

              {/* Push Notifications */}
              <Row style={styles.settingRow}>
                <Row style={styles.settingInfo}>
                  <View
                    style={[
                      styles.iconWrapper,
                      { backgroundColor: iconBackgroundColors.bell },
                    ]}
                  >
                    <Feather name='bell' size={16} color={Colors.white} />
                  </View>
                  <Text style={styles.settingLabel}>Push Bildirimi</Text>
                </Row>
                <Switch
                  value={pref?.push_enabled ?? true}
                  onValueChange={(value) =>
                    handleToggle(type, 'push_enabled', value)
                  }
                  trackColor={switchTrackColors}
                  thumbColor={
                    pref?.push_enabled
                      ? Colors.primary.DEFAULT
                      : Colors.gray[100]
                  }
                  disabled={isLoadingThis}
                />
              </Row>

              {/* Email Notifications */}
              <Row style={styles.settingRow}>
                <Row style={styles.settingInfo}>
                  <View
                    style={[
                      styles.iconWrapper,
                      { backgroundColor: iconBackgroundColors.mail },
                    ]}
                  >
                    <Feather name='mail' size={16} color={Colors.white} />
                  </View>
                  <Text style={styles.settingLabel}>E-posta</Text>
                </Row>
                <Switch
                  value={pref?.email_enabled ?? false}
                  onValueChange={(value) =>
                    handleToggle(type, 'email_enabled', value)
                  }
                  trackColor={switchTrackColors}
                  thumbColor={
                    pref?.email_enabled
                      ? Colors.primary.DEFAULT
                      : Colors.gray[100]
                  }
                  disabled={isLoadingThis}
                />
              </Row>

              {/* Frequency Setting */}
              {showFrequencyButton && (
                <TouchableOpacity
                  style={styles.frequencyButton}
                  onPress={() => handleFrequencyChange(type)}
                  disabled={isLoadingThis}
                >
                  <Row style={styles.settingInfo}>
                    <View
                      style={[
                        styles.iconWrapper,
                        { backgroundColor: iconBackgroundColors.clock },
                      ]}
                    >
                      <Feather name='clock' size={16} color={Colors.white} />
                    </View>
                    <Text style={styles.frequencyText}>Sıklık</Text>
                  </Row>
                  <Row style={styles.frequencyInfo}>
                    <Text style={styles.frequencyText}>{frequencyText}</Text>
                    <Feather
                      name='chevron-right'
                      size={16}
                      color={Colors.gray[700]}
                    />
                  </Row>
                </TouchableOpacity>
              )}
            </View>
          </PlayfulCard>
        </SlideInElement>
      );
    },
    [
      getPreferenceForType,
      saving,
      notificationTypeNames,
      notificationTypeDescriptions,
      iconBackgroundColors,
      switchTrackColors,
      handleToggle,
      handleFrequencyChange,
    ],
  );

  // Load preferences on component mount with cleanup
  useEffect(() => {
    let isCancelled = false;

    async function initialLoad() {
      if (!isCancelled && isMountedRef.current) {
        setIsLoading(true);
        await loadPreferences();
        if (!isCancelled && isMountedRef.current) {
          setIsLoading(false);
        }
      }
    }

    initialLoad();

    return () => {
      isCancelled = true;
    };
  }, [loadPreferences]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Memoized filtered notification types
  const filteredNotificationTypes = useMemo(() => {
    return getFilteredNotificationTypes();
  }, [getFilteredNotificationTypes]);

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size='large' color={colors.loading} />
        <Text style={styles.loadingText}>Bildirim ayarları yükleniyor...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Feather
          name='alert-triangle'
          size={48}
          color={Colors.vibrant?.orange}
        />
        <Text style={styles.errorText}>{error}</Text>
        <PlayfulButton
          title='Tekrar Dene'
          onPress={handleRetry}
          variant='primary'
          size='medium'
          style={styles.retryButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary.DEFAULT}
            colors={[Colors.primary.DEFAULT]}
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
                  Bildirim Ayarları
                </PlayfulTitle>
                <Paragraph
                  color={colors.headerText}
                  style={styles.headerSubtitle}
                >
                  Hangi bildirimleri almak istediğinizi seçin
                </Paragraph>
                {deviceToken && (
                  <Text style={styles.deviceTokenText}>
                    Push bildirimleri etkin ✓
                  </Text>
                )}
              </Column>
            </Row>
          </PlayfulCard>
        </SlideInElement>

        {/* Filter Buttons */}
        <SlideInElement delay={100}>
          <View style={styles.filterContainer}>
            <Row style={styles.filterRow}>
              <FilterButton filter='all' title='Tümü' />
              <FilterButton filter='study' title='Çalışma' />
              <FilterButton filter='social' title='Sosyal' />
              <FilterButton filter='system' title='Sistem' />
            </Row>
          </View>
        </SlideInElement>

        {/* Quick Actions */}
        <SlideInElement delay={200}>
          <PlayfulCard
            title='Hızlı İşlemler'
            titleFontFamily='PrimaryFont'
            style={styles.quickActionsCard}
            variant='playful'
            animated
          >
            <Row style={styles.quickActions}>
              <PlayfulButton
                title={selectedFilter === 'all' ? 'Tümünü Aç' : 'Seçilileri Aç'}
                onPress={() => handleBulkAction(true)}
                variant='outline'
                style={styles.quickActionButton}
                icon='check'
                animated
                size='xs'
                fontFamily='PrimaryFont'
                disabled={saving === 'bulk-action'}
              />
              <PlayfulButton
                title={
                  selectedFilter === 'all' ? 'Tümünü Kapat' : 'Seçilileri Kapat'
                }
                onPress={() => handleBulkAction(false)}
                variant='outline'
                style={styles.quickActionButton}
                icon='close'
                animated
                size='xs'
                fontFamily='PrimaryFont'
                disabled={saving === 'bulk-action'}
              />
            </Row>
            <Row style={styles.quickActionsRow}>
              <PlayfulButton
                title='Test Bildirimi'
                onPress={handleTestNotification}
                variant='outline'
                style={styles.quickActionButton}
                icon='send'
                animated
                size='xs'
                fontFamily='PrimaryFont'
              />
              <PlayfulButton
                title='Ayarları Yenile'
                onPress={loadPreferences}
                variant='outline'
                style={styles.quickActionButton}
                icon='refresh'
                animated
                size='xs'
                fontFamily='PrimaryFont'
              />
            </Row>
          </PlayfulCard>
        </SlideInElement>

        {/* Notification Types */}
        {filteredNotificationTypes.map((type, index) =>
          renderNotificationTypeSettings(type, index),
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
});

NotificationSettingsScreen.displayName = 'NotificationSettingsScreen';

export default NotificationSettingsScreen;
