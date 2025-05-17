// components/ui/List/List.tsx

import React from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  StyleProp,
  ViewStyle,
  useColorScheme,
  ListRenderItemInfo,
  ListRenderItem,
} from 'react-native';
import { applyDarkMode } from '../../../utils/styleUtils';
import { Spacing } from '../../../constants/theme';

export interface ListProps {
  data: any[];
  renderItem: (item: any, index: number) => React.ReactElement;
  keyExtractor?: (item: any, index: number) => string;
  ItemSeparatorComponent?: React.ComponentType<any> | null;
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

const List: React.FC<ListProps> = ({
  data,
  renderItem,
  keyExtractor,
  ItemSeparatorComponent,
  ListEmptyComponent,
  ListHeaderComponent,
  ListFooterComponent,
  style,
  contentContainerStyle,
  testID,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Create a default key extractor if none provided
  const defaultKeyExtractor = (item: any, index: number) => {
    return item.id?.toString() || item.key?.toString() || index.toString();
  };

  // Adapt our renderItem function to match FlatList's required format
  const renderItemAdapter: ListRenderItem<any> = ({ item, index }) => {
    return renderItem(item, index);
  };

  return (
    <FlatList
      data={data}
      renderItem={renderItemAdapter}
      keyExtractor={keyExtractor || defaultKeyExtractor}
      ItemSeparatorComponent={ItemSeparatorComponent}
      ListEmptyComponent={ListEmptyComponent}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      style={[
        styles.list,
        applyDarkMode(isDark, {}, { backgroundColor: 'transparent' }),
        style,
      ]}
      contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      testID={testID}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    width: '100%',
  },
  contentContainer: {
    paddingBottom: Spacing[4],
  },
});

export default List;
