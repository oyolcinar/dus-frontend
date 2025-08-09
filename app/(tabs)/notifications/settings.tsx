import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  NotificationType,
  NotificationPreferences,
} from '../../../src/types/models';
import {
  useNotificationSettingsData,
  notificationHelpers,
} from '../../../src/hooks/useNotificationsData';
import {
  useNotifications,
  useNotificationPreferences,
} from '../../../stores/appStore';
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
  statsRow: {
    marginTop: Spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary.DEFAULT,
    fontFamily: 'PrimaryFont',
  },
  statLabel: {
    fontSize: 11,
    color: Colors.gray[600],
    fontFamily: 'SecondaryFont-Regular',
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

  // 🚀 NEW: Use the enhanced hooks instead of manual state
  const settingsData = useNotificationSettingsData();
  const {
    unreadCount,
    unreadStudyCount,
    unreadSocialCount,
    unreadSystemCount,
    courseRelatedCount,
    canReceive,
  } = useNotifications();

  const { preferences, isTypeEnabled, getPreference } =
    useNotificationPreferences();

  // Local UI state
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

  // 🚀 NEW: Use helper functions for categorization
  const notificationCategories: Record<FilterType, NotificationType[]> =
    useMemo(
      () => ({
        all: Object.keys(notificationTypeNames) as NotificationType[],
        study: notificationHelpers.getNotificationTypesByCategory('study'),
        social: notificationHelpers.getNotificationTypesByCategory('social'),
        system: notificationHelpers.getNotificationTypesByCategory('system'),
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

  // 🚀 NEW: Handle toggle switches using the new hooks
  const handleToggle = useCallback(
    async (
      type: NotificationType,
      setting: 'in_app_enabled' | 'push_enabled' | 'email_enabled',
      value: boolean,
    ) => {
      try {
        await settingsData.updatePreferencesAsync({
          notificationType: type,
          preferences: { [setting]: value },
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
      }
    },
    [settingsData.updatePreferencesAsync],
  );

  // 🚀 NEW: Handle frequency updates using the new hooks
  const handleFrequencyUpdate = useCallback(
    async (type: NotificationType, frequency: number) => {
      try {
        await settingsData.updatePreferencesAsync({
          notificationType: type,
          preferences: { frequency_hours: frequency },
        });
      } catch (err: any) {
        console.error('Error updating frequency:', err);
        Alert.alert('Hata', 'Sıklık ayarı güncellenirken bir hata oluştu.');
      }
    },
    [settingsData.updatePreferencesAsync],
  );

  // Handle frequency change dialog
  const handleFrequencyChange = useCallback(
    async (type: NotificationType) => {
      const currentPref = getPreference(type);
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
    [getPreference, handleFrequencyUpdate],
  );

  // 🚀 NEW: Handle test notification using the new hooks
  const handleTestNotification = useCallback(async () => {
    try {
      await settingsData.sendTest(notificationHelpers.createTestRequest());

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
  }, [settingsData.sendTest]);

  // 🚀 NEW: Handle bulk actions using the new approach
  const handleBulkAction = useCallback(
    async (enabled: boolean) => {
      try {
        const types =
          selectedFilter === 'all'
            ? (Object.keys(notificationTypeNames) as NotificationType[])
            : notificationCategories[selectedFilter];

        // Update each preference type in parallel
        const promises = types.map(async (type) => {
          await Promise.all([
            settingsData.updatePreferencesAsync({
              notificationType: type,
              preferences: { in_app_enabled: enabled },
            }),
            settingsData.updatePreferencesAsync({
              notificationType: type,
              preferences: { push_enabled: enabled },
            }),
            settingsData.updatePreferencesAsync({
              notificationType: type,
              preferences: { email_enabled: enabled && false },
            }),
          ]);
        });

        await Promise.all(promises);

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
      }
    },
    [
      selectedFilter,
      notificationCategories,
      notificationTypeNames,
      settingsData.updatePreferencesAsync,
    ],
  );

  // Get filtered notification types
  const getFilteredNotificationTypes = useCallback(() => {
    return notificationCategories[selectedFilter];
  }, [notificationCategories, selectedFilter]);

  // 🚀 NEW: Enhanced Filter Button Component with counts
  const FilterButton = React.memo(
    ({ filter, title }: { filter: FilterType; title: string }) => {
      const isActive = selectedFilter === filter;

      // Get unread count for this category
      const getUnreadCount = () => {
        switch (filter) {
          case 'study':
            return unreadStudyCount;
          case 'social':
            return unreadSocialCount;
          case 'system':
            return unreadSystemCount;
          case 'all':
            return unreadCount;
          default:
            return 0;
        }
      };

      const count = getUnreadCount();

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
            {count > 0 && ` (${count})`}
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

  // 🚀 NEW: Render notification type settings using the new data
  const renderNotificationTypeSettings = useCallback(
    (type: NotificationType, index: number) => {
      const pref = getPreference(type);
      const isLoadingThis = settingsData.isUpdatingPreferences;
      const icon = notificationHelpers.formatNotificationForDisplay({
        notification_type: type,
      } as any).icon;
      const color = notificationHelpers.getCategoryColor(
        notificationHelpers
          .getNotificationTypesByCategory('study')
          .includes(type)
          ? 'study'
          : notificationHelpers
                .getNotificationTypesByCategory('social')
                .includes(type)
            ? 'social'
            : 'system',
      );

      const frequencyText = useMemo(() => {
        return notificationHelpers.getFrequencyText(
          pref?.frequency_hours || 24,
        );
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
      getPreference,
      settingsData.isUpdatingPreferences,
      notificationTypeNames,
      notificationTypeDescriptions,
      iconBackgroundColors,
      switchTrackColors,
      handleToggle,
      handleFrequencyChange,
    ],
  );

  // Memoized filtered notification types
  const filteredNotificationTypes = useMemo(() => {
    return getFilteredNotificationTypes();
  }, [getFilteredNotificationTypes]);

  // 🚀 NEW: Enhanced loading state using the new hooks
  if (settingsData.isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size='large' color={colors.loading} />
        <Text style={styles.loadingText}>Bildirim ayarları yükleniyor...</Text>
      </View>
    );
  }

  // 🚀 NEW: Enhanced error state using the new hooks
  if (settingsData.hasError) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Feather
          name='alert-triangle'
          size={48}
          color={Colors.vibrant?.orange}
        />
        <Text style={styles.errorText}>
          Ayarlar yüklenirken bir hata oluştu. Lütfen tekrar deneyin.
        </Text>
        <PlayfulButton
          title='Tekrar Dene'
          onPress={settingsData.refetchAll}
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
            refreshing={settingsData.isLoading}
            onRefresh={settingsData.refetchAll}
            tintColor={Colors.primary.DEFAULT}
            colors={[Colors.primary.DEFAULT]}
          />
        }
      >
        {/* 🚀 NEW: Enhanced Header Section with stats */}
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

                {/* 🚀 NEW: Device token and connection status */}
                {settingsData.deviceToken?.token && (
                  <Text style={styles.deviceTokenText}>
                    Push bildirimleri etkin ✓
                  </Text>
                )}
                {!canReceive && (
                  <Text
                    style={[
                      styles.deviceTokenText,
                      { color: Colors.vibrant.orange },
                    ]}
                  >
                    ⚠️ Push bildirimleri devre dışı
                  </Text>
                )}

                {/* 🚀 NEW: Quick stats */}
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{unreadCount}</Text>
                    <Text style={styles.statLabel}>Okunmamış</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{courseRelatedCount}</Text>
                    <Text style={styles.statLabel}>Ders</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{preferences.length}</Text>
                    <Text style={styles.statLabel}>Ayar</Text>
                  </View>
                </View>
              </Column>
            </Row>
          </PlayfulCard>
        </SlideInElement>

        {/* 🚀 NEW: Enhanced Filter Buttons with counts */}
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

        {/* 🚀 NEW: Enhanced Quick Actions */}
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
                disabled={settingsData.isUpdatingPreferences}
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
                disabled={settingsData.isUpdatingPreferences}
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
                disabled={settingsData.isSendingTest}
              />
              <PlayfulButton
                title='Push Yenile'
                onPress={settingsData.refreshToken}
                variant='outline'
                style={styles.quickActionButton}
                icon='refresh'
                animated
                size='xs'
                fontFamily='PrimaryFont'
                disabled={settingsData.isSettingUp}
              />
            </Row>
          </PlayfulCard>
        </SlideInElement>

        {/* 🚀 NEW: Notification Types using new data */}
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
