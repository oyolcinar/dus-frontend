// components/ui/OpponentListItem.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  StyleProp,
  ViewStyle,
} from 'react-native';

// --- Imports for components we KNOW exist and work ---
import Avatar from './Avatar';
import Button from './Button';
import { OpponentListItemProps } from './types';
import { Colors, Spacing } from '../../constants/theme';

// Using a standard function declaration for maximum stability.
export default function OpponentListItem({
  user,
  onChallenge,
  style,
  testID,
}: OpponentListItemProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // This component now ONLY uses built-in <View> and <Text> for layout,
  // plus the Avatar and Button components that we know are working.
  // This removes any possibility of errors from other custom components.
  return (
    <View
      style={[styles.container, isDark && styles.containerDark, style]}
      testID={testID}
    >
      <Avatar
        name={user.username}
        imageSource={{ uri: user.avatar_url }}
        size='md'
      />

      <View style={styles.userInfo}>
        <Text
          style={[styles.username, isDark ? styles.textDark : styles.textLight]}
        >
          {user.username}
        </Text>

        {typeof user.winRate === 'number' && (
          // Using a basic <Text> component instead of <Paragraph>
          <Text
            style={[
              styles.stats,
              isDark ? styles.statsDark : styles.statsLight,
            ]}
          >
            Kazanma Oranı: {Math.round(user.winRate * 100)}%
          </Text>
        )}
      </View>

      <Button
        title='Meydan Oku'
        variant='outline'
        size='small'
        onPress={() => onChallenge(user)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // The container is a <View> styled to act like a row.
  // This is the most fundamental way to create this layout in React Native.
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  containerDark: {
    borderBottomColor: Colors.gray[700],
  },
  userInfo: {
    flex: 1,
    marginLeft: Spacing[3],
  },
  username: {
    fontWeight: '600',
    fontSize: 16,
  },
  textLight: {
    color: Colors.gray[800],
  },
  textDark: {
    color: Colors.white,
  },
  stats: {
    fontSize: 12,
    marginTop: Spacing[1],
  },
  statsLight: {
    color: Colors.gray[600],
  },
  statsDark: {
    color: Colors.gray[400],
  },
});
