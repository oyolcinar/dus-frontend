import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNotifications } from '../../../context/NotificationContext';
import {
  NotificationType,
  NotificationPreferences,
} from '../../../src/types/models';
import { sendTestNotification } from '../../../src/api/notificationService';

const NotificationSettingsScreen: React.FC = () => {
  const {
    preferences,
    isLoading,
    loadPreferences,
    updatePreferences,
    error,
    clearError,
  } = useNotifications();

  const [saving, setSaving] = useState<string | null>(null);

  // Notification type display names
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
  };

  // Notification type descriptions
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
  };

  const getPreferenceForType = useCallback(
    (type: NotificationType): NotificationPreferences | null => {
      return preferences.find((p) => p.notification_type === type) || null;
    },
    [preferences],
  );

  const handleToggle = useCallback(
    async (
      type: NotificationType,
      setting: 'in_app_enabled' | 'push_enabled' | 'email_enabled',
      value: boolean,
    ) => {
      try {
        setSaving(`${type}-${setting}`);
        await updatePreferences(type, { [setting]: value });
      } catch (err) {
        Alert.alert('Hata', 'Ayar güncellenirken bir hata oluştu.');
      } finally {
        setSaving(null);
      }
    },
    [updatePreferences],
  );

  // Separate handler for frequency updates
  const handleFrequencyUpdate = useCallback(
    async (type: NotificationType, frequency: number) => {
      try {
        setSaving(`${type}-frequency`);
        await updatePreferences(type, { frequency_hours: frequency });
      } catch (err) {
        Alert.alert('Hata', 'Sıklık ayarı güncellenirken bir hata oluştu.');
      } finally {
        setSaving(null);
      }
    },
    [updatePreferences],
  );

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

  const handleTestNotification = useCallback(async () => {
    try {
      await sendTestNotification({
        template_name: 'test_notification',
        notification_type: 'system_announcement',
        variables: {
          message: 'Bu bir test bildirimidir!',
        },
      });
      Alert.alert('Başarılı', 'Test bildirimi gönderildi!');
    } catch (error) {
      Alert.alert('Hata', 'Test bildirimi gönderilemedi.');
    }
  }, []);

  const renderNotificationTypeSettings = (type: NotificationType) => {
    const pref = getPreferenceForType(type);
    const isLoading = saving?.startsWith(type);

    return (
      <View key={type} style={styles.settingGroup}>
        <View style={styles.settingHeader}>
          <View style={styles.settingTitleContainer}>
            <Text style={styles.settingTitle}>
              {notificationTypeNames[type]}
            </Text>
            <Text style={styles.settingDescription}>
              {notificationTypeDescriptions[type]}
            </Text>
          </View>
          {isLoading && <ActivityIndicator size='small' color='#3B82F6' />}
        </View>

        <View style={styles.settingOptions}>
          {/* In-App Notifications */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Feather name='smartphone' size={16} color='#6B7280' />
              <Text style={styles.settingLabel}>Uygulama İçi</Text>
            </View>
            <Switch
              value={pref?.in_app_enabled ?? true}
              onValueChange={(value) =>
                handleToggle(type, 'in_app_enabled', value)
              }
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={pref?.in_app_enabled ? '#3B82F6' : '#F3F4F6'}
              disabled={isLoading}
            />
          </View>

          {/* Push Notifications */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Feather name='bell' size={16} color='#6B7280' />
              <Text style={styles.settingLabel}>Push Bildirimi</Text>
            </View>
            <Switch
              value={pref?.push_enabled ?? true}
              onValueChange={(value) =>
                handleToggle(type, 'push_enabled', value)
              }
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={pref?.push_enabled ? '#3B82F6' : '#F3F4F6'}
              disabled={isLoading}
            />
          </View>

          {/* Email Notifications */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Feather name='mail' size={16} color='#6B7280' />
              <Text style={styles.settingLabel}>E-posta</Text>
            </View>
            <Switch
              value={pref?.email_enabled ?? false}
              onValueChange={(value) =>
                handleToggle(type, 'email_enabled', value)
              }
              trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
              thumbColor={pref?.email_enabled ? '#3B82F6' : '#F3F4F6'}
              disabled={isLoading}
            />
          </View>

          {/* Frequency Setting */}
          {(pref?.in_app_enabled ||
            pref?.push_enabled ||
            pref?.email_enabled) && (
            <TouchableOpacity
              style={styles.frequencyButton}
              onPress={() => handleFrequencyChange(type)}
              disabled={isLoading}
            >
              <View style={styles.settingInfo}>
                <Feather name='clock' size={16} color='#6B7280' />
                <Text style={styles.settingLabel}>Sıklık</Text>
              </View>
              <View style={styles.frequencyInfo}>
                <Text style={styles.frequencyText}>
                  {pref?.frequency_hours === 1
                    ? 'Saatte bir'
                    : pref?.frequency_hours === 24
                    ? 'Günde bir'
                    : pref?.frequency_hours === 168
                    ? 'Haftada bir'
                    : `${pref?.frequency_hours || 24} saatte bir`}
                </Text>
                <Feather name='chevron-right' size={16} color='#9CA3AF' />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Bildirim Ayarları</Text>
        <Text style={styles.screenSubtitle}>
          Hangi bildirimleri almak istediğinizi seçin
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => {
              // Enable all notifications
              Object.keys(notificationTypeNames).forEach((type) => {
                handleToggle(type as NotificationType, 'in_app_enabled', true);
                handleToggle(type as NotificationType, 'push_enabled', true);
              });
            }}
          >
            <Feather name='check-circle' size={20} color='#10B981' />
            <Text style={[styles.quickActionText, { color: '#10B981' }]}>
              Tümünü Aç
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => {
              // Disable all notifications
              Object.keys(notificationTypeNames).forEach((type) => {
                handleToggle(type as NotificationType, 'in_app_enabled', false);
                handleToggle(type as NotificationType, 'push_enabled', false);
                handleToggle(type as NotificationType, 'email_enabled', false);
              });
            }}
          >
            <Feather name='x-circle' size={20} color='#EF4444' />
            <Text style={[styles.quickActionText, { color: '#EF4444' }]}>
              Tümünü Kapat
            </Text>
          </TouchableOpacity>
        </View>

        {/* Notification Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bildirim Türleri</Text>
          {Object.keys(notificationTypeNames).map((type) =>
            renderNotificationTypeSettings(type as NotificationType),
          )}
        </View>

        {/* General Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Genel Ayarlar</Text>

          <View style={styles.settingGroup}>
            <TouchableOpacity
              style={styles.generalSettingRow}
              onPress={() => {
                Alert.alert('Sessiz Saatler', 'Bu özellik yakında eklenecek!', [
                  { text: 'Tamam' },
                ]);
              }}
            >
              <View style={styles.settingInfo}>
                <Feather name='moon' size={20} color='#6B7280' />
                <View>
                  <Text style={styles.settingLabel}>Sessiz Saatler</Text>
                  <Text style={styles.settingDescription}>
                    Belirli saatlerde bildirim alma
                  </Text>
                </View>
              </View>
              <Feather name='chevron-right' size={20} color='#9CA3AF' />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.generalSettingRow}
              onPress={handleTestNotification}
            >
              <View style={styles.settingInfo}>
                <Feather name='send' size={20} color='#6B7280' />
                <View>
                  <Text style={styles.settingLabel}>Test Bildirimi</Text>
                  <Text style={styles.settingDescription}>
                    Bildirimlerinizin çalıştığını test edin
                  </Text>
                </View>
              </View>
              <Feather name='chevron-right' size={20} color='#9CA3AF' />
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Bildirim ayarlarınız tüm cihazlarınızda senkronize edilir.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  content: {
    flex: 1,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  settingGroup: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  settingTitleContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  settingOptions: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  frequencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginTop: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  frequencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  frequencyText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  generalSettingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default NotificationSettingsScreen;
