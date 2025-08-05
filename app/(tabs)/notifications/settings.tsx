import React, { useState, useCallback, useEffect } from 'react';
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

const NotificationSettingsScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // State
  const [preferences, setPreferences] = useState<NotificationPreferences[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');

  const notificationTypeNames: Record<NotificationType, string> = {
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
    // ✅ NEW: Course-related notification types
    course_reminder: 'Ders Hatırlatmaları',
    course_completed: 'Ders Tamamlama Bildirimleri',
    course_progress: 'Ders İlerleme Bildirimleri',
    course_milestone: 'Ders Kilometre Taşı Bildirimleri',
    course_study_session: 'Ders Çalışma Seansı Bildirimleri',
  };

  // Update the notificationTypeDescriptions object (around line 77)
  const notificationTypeDescriptions: Record<NotificationType, string> = {
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
    // ✅ NEW: Course-related notification descriptions
    course_reminder: 'Ders çalışma zamanları için hatırlatıcılar',
    course_completed: 'Derslerinizi tamamladığınızda bildirimler',
    course_progress: 'Ders ilerleme durumunuz hakkında güncellemeler',
    course_milestone: 'Önemli ders aşamalarını geçtiğinizde bildirimler',
    course_study_session: 'Çalışma seanslarınız hakkında bildirimler',
  };

  // Categorize notification types
  const notificationCategories: Record<FilterType, NotificationType[]> = {
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
  };

  // Load user preferences and setup push notifications
  const loadPreferences = useCallback(async () => {
    try {
      console.log('🔄 Starting loadPreferences...');
      setError(null);

      // Load preferences from API
      console.log('📡 Calling getPreferences...');
      const userPreferences = await getPreferences();
      console.log('✅ getPreferences completed:', userPreferences);
      setPreferences(userPreferences);

      // Setup push notifications using the service function
      console.log('📱 Calling setupPushNotifications from service...');
      const pushResult = await setupPushNotifications();
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
      console.error('❌ loadPreferences error:', err);
      setError(`Ayarlar yüklenirken bir hata oluştu: ${err.message}`);
    }
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPreferences();
    setRefreshing(false);
  }, [loadPreferences]);

  // Handle retry
  const handleRetry = useCallback(async () => {
    setIsLoading(true);
    await loadPreferences();
    setIsLoading(false);
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
      try {
        setSaving(`${type}-${setting}`);

        // Update preference via API
        const updatedPreference = await updatePreferences(type, {
          [setting]: value,
        });

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
        console.error('Error updating preference:', err);
        Alert.alert(
          'Hata',
          'Ayar güncellenirken bir hata oluştu. Lütfen tekrar deneyin.',
        );
      } finally {
        setSaving(null);
      }
    },
    [preferences],
  );

  // Handle frequency updates
  const handleFrequencyUpdate = useCallback(
    async (type: NotificationType, frequency: number) => {
      try {
        setSaving(`${type}-frequency`);

        const updatedPreference = await updatePreferences(type, {
          frequency_hours: frequency,
        });

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
        console.error('Error updating frequency:', err);
        Alert.alert('Hata', 'Sıklık ayarı güncellenirken bir hata oluştu.');
      } finally {
        setSaving(null);
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
        console.error('Error updating bulk preferences:', error);
        Alert.alert('Hata', 'Toplu işlem sırasında bir hata oluştu.');
      } finally {
        setSaving(null);
      }
    },
    [selectedFilter, notificationCategories, loadPreferences],
  );

  // Get filtered notification types
  const getFilteredNotificationTypes = () => {
    return notificationCategories[selectedFilter];
  };

  // Filter Button Component
  const FilterButton = ({
    filter,
    title,
  }: {
    filter: FilterType;
    title: string;
  }) => (
    <TouchableOpacity
      style={{
        flex: 1,
        marginHorizontal: Spacing[1],
        paddingVertical: Spacing[2],
        paddingHorizontal: Spacing[2],
        borderRadius: BorderRadius.button,
        backgroundColor:
          selectedFilter === filter
            ? Colors.vibrant.purple
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
      onPress={() => setSelectedFilter(filter)}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: selectedFilter === filter ? '600' : '500',
          color:
            selectedFilter === filter
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
    </TouchableOpacity>
  );

  // Render notification type settings
  const renderNotificationTypeSettings = (
    type: NotificationType,
    index: number,
  ) => {
    const pref = getPreferenceForType(type);
    const isLoadingThis = saving?.startsWith(type);
    const icon = getNotificationIcon(type);
    const color = getNotificationColor(type);

    return (
      <SlideInElement key={type} delay={400 + index * 100}>
        <PlayfulCard
          style={styles.settingCard}
          variant='elevated'
          animated
          floatingAnimation={index % 2 === 0}
        >
          <View style={styles.settingHeader}>
            <Row style={{ flex: 1, alignItems: 'flex-start' }}>
              <View
                style={[styles.typeIconWrapper, { backgroundColor: color }]}
              >
                <Feather name={icon as any} size={20} color={Colors.white} />
              </View>
              <Column style={{ flex: 1 }}>
                <Text style={styles.settingTitle}>
                  {notificationTypeNames[type]}
                </Text>
                <Text style={styles.settingDescription}>
                  {notificationTypeDescriptions[type]}
                </Text>
              </Column>
            </Row>
            {isLoadingThis && (
              <ActivityIndicator size='small' color={Colors.primary.DEFAULT} />
            )}
          </View>

          <View style={styles.settingOptions}>
            {/* In-App Notifications */}
            <Row style={styles.settingRow}>
              <Row style={styles.settingInfo}>
                <View
                  style={[
                    styles.iconWrapper,
                    {
                      backgroundColor:
                        Colors.vibrant?.blue || Colors.primary.DEFAULT,
                    },
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
                trackColor={{
                  false: Colors.gray[300],
                  true: Colors.primary.light,
                }}
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
                    {
                      backgroundColor:
                        Colors.vibrant?.orange || Colors.secondary.DEFAULT,
                    },
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
                trackColor={{
                  false: Colors.gray[300],
                  true: Colors.primary.light,
                }}
                thumbColor={
                  pref?.push_enabled ? Colors.primary.DEFAULT : Colors.gray[100]
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
                    {
                      backgroundColor: Colors.vibrant?.green || Colors.success,
                    },
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
                trackColor={{
                  false: Colors.gray[300],
                  true: Colors.primary.light,
                }}
                thumbColor={
                  pref?.email_enabled
                    ? Colors.primary.DEFAULT
                    : Colors.gray[100]
                }
                disabled={isLoadingThis}
              />
            </Row>

            {/* Frequency Setting */}
            {(pref?.in_app_enabled ||
              pref?.push_enabled ||
              pref?.email_enabled) && (
              <TouchableOpacity
                style={styles.frequencyButton}
                onPress={() => handleFrequencyChange(type)}
                disabled={isLoadingThis}
              >
                <Row style={styles.settingInfo}>
                  <View
                    style={[
                      styles.iconWrapper,
                      {
                        backgroundColor:
                          Colors.vibrant?.purple || Colors.primary.dark,
                      },
                    ]}
                  >
                    <Feather name='clock' size={16} color={Colors.white} />
                  </View>
                  <Text style={styles.frequencyText}>Sıklık</Text>
                </Row>
                <Row style={styles.frequencyInfo}>
                  <Text style={styles.frequencyText}>
                    {pref?.frequency_hours === 1
                      ? 'Saatte bir'
                      : pref?.frequency_hours === 24
                        ? 'Günde bir'
                        : pref?.frequency_hours === 168
                          ? 'Haftada bir'
                          : `${pref?.frequency_hours || 24} saatte bir`}
                  </Text>
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
  };

  // Load preferences on component mount
  useEffect(() => {
    async function initialLoad() {
      setIsLoading(true);
      await loadPreferences();
      setIsLoading(false);
    }

    initialLoad();
  }, [loadPreferences]);

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator
          size='large'
          color={Colors.vibrant?.coral || Colors.primary.DEFAULT}
        />
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
          style={{
            marginTop: Spacing[4],
            shadowColor: Colors.gray[900],
            shadowOffset: { width: 10, height: 20 },
            shadowOpacity: 0.8,
            shadowRadius: 10,
            elevation: 10,
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
                  Bildirim Ayarları
                </PlayfulTitle>
                <Paragraph
                  color={isDark ? Colors.gray[700] : Colors.gray[700]}
                  style={{
                    fontFamily: 'SecondaryFont-Regular',
                  }}
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
          <View style={{ marginBottom: Spacing[6] }}>
            <Row
              style={{
                marginBottom: Spacing[3],
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
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
                style={{ flex: 1 }}
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
                style={{ flex: 1 }}
                icon='close'
                animated
                size='xs'
                fontFamily='PrimaryFont'
                disabled={saving === 'bulk-action'}
              />
            </Row>
            <Row
              style={{ justifyContent: 'space-between', marginTop: Spacing[3] }}
            >
              <PlayfulButton
                title='Test Bildirimi'
                onPress={handleTestNotification}
                variant='outline'
                style={{ flex: 1 }}
                icon='send'
                animated
                size='xs'
                fontFamily='PrimaryFont'
              />
              <PlayfulButton
                title='Ayarları Yenile'
                onPress={loadPreferences}
                variant='outline'
                style={{ flex: 1 }}
                icon='refresh'
                animated
                size='xs'
                fontFamily='PrimaryFont'
              />
            </Row>
          </PlayfulCard>
        </SlideInElement>

        {/* Notification Types */}
        {getFilteredNotificationTypes().map((type, index) =>
          renderNotificationTypeSettings(type, index),
        )}

        {/* Bottom spacing */}
        <View style={{ height: Spacing[8] }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: Colors.vibrant?.purpleDark || Colors.primary.dark,
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
  deviceTokenText: {
    marginTop: Spacing[2],
    color: Colors.gray[700],
    fontSize: 12,
    fontFamily: 'SecondaryFont-Regular',
    opacity: 0.8,
  },
  quickActionsCard: {
    marginBottom: Spacing[4],
    shadowColor: Colors.gray[900],
    shadowOffset: { width: 10, height: 20 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  quickActions: {
    justifyContent: 'space-between',
  },
  settingCard: {
    marginBottom: Spacing[4],
    shadowColor: Colors.gray[900],
    shadowOffset: { width: 10, height: 20 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing[4],
  },
  typeIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing[3],
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
    shadowColor: Colors.gray[900],
    shadowOffset: { width: 10, height: 20 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  frequencyInfo: {
    alignItems: 'center',
    gap: Spacing[2],
  },
  frequencyText: {
    fontSize: 14,
    color: Colors.gray[700],
    fontWeight: '500',
    fontFamily: 'SecondaryFont-Regular',
  },
});

export default NotificationSettingsScreen;
