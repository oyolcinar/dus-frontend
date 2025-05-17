// components/ui/Tabs/TabBar.tsx

import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  useColorScheme,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../../../constants/theme';
import { globalStyles, applyDarkMode } from '../../../utils/styleUtils';

export interface TabBarProps {
  /**
   * Array of tab objects with key, label, and optional icon
   */
  tabs: Array<{
    key: string;
    label: string;
    icon?: React.ComponentProps<typeof FontAwesome>['name'];
  }>;

  /**
   * Key of the currently active tab
   */
  activeTab: string;

  /**
   * Callback when a tab is pressed
   */
  onTabPress: (tabKey: string) => void;

  /**
   * Position of the tab bar
   */
  position?: 'top' | 'bottom';

  /**
   * Custom style for the tab bar container
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * TabBar component for horizontal tab navigation
 */
const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTab,
  onTabPress,
  position = 'top',
  style,
  testID,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View
      style={[
        styles.container,
        position === 'bottom' && styles.bottomPosition,
        applyDarkMode(
          isDark,
          { backgroundColor: Colors.white, borderColor: Colors.gray[200] },
          { backgroundColor: Colors.gray[800], borderColor: Colors.gray[700] },
        ),
        style,
      ]}
      testID={testID}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((tab) => {
          // Import TabItem dynamically to avoid circular dependency
          const TabItem = require('./TabItem').default;
          const isActive = activeTab === tab.key;

          return (
            <TabItem
              key={tab.key}
              label={tab.label}
              icon={tab.icon}
              isActive={isActive}
              onPress={() => onTabPress(tab.key)}
              testID={`tab-${tab.key}`}
            />
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    width: '100%',
  },
  bottomPosition: {
    borderTopWidth: 1,
    borderBottomWidth: 0,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default TabBar;
