// components/ui/Card.tsx
import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { useColorScheme } from 'react-native';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const Card: React.FC<CardProps> = ({ title, children, style }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View
      style={[styles.card, isDark ? styles.cardDark : styles.cardLight, style]}
    >
      {title && (
        <Text
          style={[styles.title, isDark ? styles.titleDark : styles.titleLight]}
        >
          {title}
        </Text>
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing[4],
    marginBottom: Spacing[4],
  },
  cardLight: {
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardDark: {
    backgroundColor: Colors.gray[800],
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing[2],
  },
  titleLight: {
    color: Colors.gray[800],
  },
  titleDark: {
    color: Colors.white,
  },
});

export default Card;
