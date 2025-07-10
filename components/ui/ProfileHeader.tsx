// components/ui/ProfileHeader.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  useColorScheme,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSizes,
} from '../../constants/theme';
import { globalStyles, applyDarkMode } from '../../utils/styleUtils';

export interface ProfileHeaderProps {
  /**
   * User name to display
   */
  name: string;

  /**
   * Optional avatar image URI
   */
  avatar?: string;

  /**
   * Optional array of stats to display
   */
  stats?: Array<{ label: string; value: string | number }>;

  /**
   * Optional callback when avatar is pressed
   */
  onAvatarPress?: () => void;

  /**
   * Optional callback when edit button is pressed
   */
  onEditPress?: () => void;

  /**
   * Custom style for the header container
   */
  style?: any;

  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * ProfileHeader component for displaying user profile information
 */
const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  name,
  avatar,
  stats,
  onAvatarPress,
  onEditPress,
  style,
  testID,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Default avatar when none is provided
  const defaultAvatar = 'https://via.placeholder.com/100';

  // Determine background color based on color scheme
  const bgColor = isDark ? Colors.primary.light : Colors.primary.light;
  const textColor = isDark ? Colors.gray[900] : Colors.gray[900];
  const secondaryTextColor = isDark ? Colors.gray[600] : Colors.gray[600];

  return (
    <View
      style={[styles.container, { backgroundColor: bgColor }, style]}
      testID={testID}
    >
      <View style={styles.headerContent}>
        {/* Avatar */}
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={onAvatarPress}
          disabled={!onAvatarPress}
        >
          <Image
            source={{ uri: avatar || defaultAvatar }}
            style={styles.avatar}
          />
          {onAvatarPress && (
            <View style={styles.avatarEditIcon}>
              <FontAwesome name='camera' size={12} color={Colors.white} />
            </View>
          )}
        </TouchableOpacity>

        {/* User Info */}
        <View style={styles.userInfo}>
          <Text style={[styles.name, { color: textColor }]}>{name}</Text>

          {/* Edit Button */}
          {onEditPress && (
            <TouchableOpacity style={styles.editButton} onPress={onEditPress}>
              <FontAwesome
                name='pencil'
                size={12}
                color={isDark ? Colors.primary.DEFAULT : Colors.primary.DEFAULT}
              />
              <Text
                style={[
                  styles.editButtonText,
                  {
                    color: isDark
                      ? Colors.primary.DEFAULT
                      : Colors.primary.DEFAULT,
                  },
                ]}
              >
                Düzenle
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Stats */}
      {stats && stats.length > 0 && (
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View
              key={index}
              style={[
                styles.statItem,
                index < stats.length - 1 && styles.statItemWithBorder,
              ]}
            >
              <Text style={[styles.statValue, { color: textColor }]}>
                {stat.value}
              </Text>
              <Text style={[styles.statLabel, { color: secondaryTextColor }]}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    padding: Spacing[4],
    marginBottom: Spacing[4],
    width: '100%',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  avatarContainer: {
    position: 'relative',
    marginRight: Spacing[4],
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  avatarEditIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary.DEFAULT,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    marginBottom: Spacing[1],
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: FontSizes.sm,
    marginLeft: Spacing[1],
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.lg,
    padding: Spacing[3],
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing[2],
  },
  statItemWithBorder: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.2)',
  },
  statValue: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    marginBottom: Spacing[1],
  },
  statLabel: {
    fontSize: FontSizes.xs,
  },
});

export default ProfileHeader;
