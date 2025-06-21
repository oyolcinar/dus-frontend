// components/ui/Badge.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {
  Colors,
  BorderRadius,
  Spacing,
  FontSizes,
} from '../../constants/theme';

export interface BadgeProps {
  /**
   * Text content of the badge
   */
  text: string;

  /**
   * Color variant of the badge
   */
  variant?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'error'
    | 'warning'
    | 'info'
    | 'neutral';

  /**
   * Size of the badge
   */
  size?: 'sm' | 'md';

  /**
   * Custom style for the badge container
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Custom style for the badge text
   */
  textStyle?: StyleProp<TextStyle>;

  /**
   * Whether the badge should be pill-shaped (fully rounded)
   */
  pill?: boolean;

  /**
   * Font family for the badge text
   */
  fontFamily?: string;

  /**
   * Whether to automatically translate common English terms to Turkish
   */
  translateToTurkish?: boolean;

  /**
   * Optional testID for testing
   */
  testID?: string;
}

/**
 * Badge component for displaying status indicators, counts, or tags
 */
const Badge: React.FC<BadgeProps> = ({
  text,
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
  pill = true,
  fontFamily,
  translateToTurkish = true,
  testID,
}) => {
  // Turkish translation mapping
  const turkishTranslations: { [key: string]: string } = {
    // Difficulty levels
    easy: 'Kolay',
    medium: 'Orta',
    hard: 'Zor',
    'very hard': 'Çok Zor',
    expert: 'Uzman',

    // Status terms
    new: 'Yeni',
    hot: 'Popüler',
    trending: 'Trend',
    featured: 'Öne Çıkan',
    recommended: 'Önerilen',
    completed: 'Tamamlandı',
    'in progress': 'Devam Ediyor',
    pending: 'Bekliyor',
    active: 'Aktif',
    inactive: 'Pasif',
    approved: 'Onaylandı',
    rejected: 'Reddedildi',
    draft: 'Taslak',
    published: 'Yayınlandı',

    // Academic terms
    beginner: 'Başlangıç',
    intermediate: 'Orta Seviye',
    advanced: 'İleri Seviye',
    free: 'Ücretsiz',
    premium: 'Premium',
    pro: 'Pro',
    basic: 'Temel',
    standard: 'Standart',

    // Time-related
    urgent: 'Acil',
    deadline: 'Son Tarih',
    due: 'Vadesi Geldi',
    overdue: 'Gecikmiş',
    upcoming: 'Yaklaşan',

    // General terms
    success: 'Başarılı',
    error: 'Hata',
    warning: 'Uyarı',
    info: 'Bilgi',
    important: 'Önemli',
    optional: 'İsteğe Bağlı',
    required: 'Zorunlu',
    beta: 'Beta',
    alpha: 'Alfa',
    live: 'Canlı',
    offline: 'Çevrimdışı',
    online: 'Çevrimiçi',
  };

  // Function to get translated text
  const getDisplayText = (inputText: string): string => {
    if (!translateToTurkish) {
      return inputText;
    }

    const lowerText = inputText.toLowerCase().trim();
    return turkishTranslations[lowerText] || inputText;
  };

  // Determine background color and text color based on variant
  let bgColor: string;
  let textColor: string = Colors.white;

  switch (variant) {
    case 'primary':
      bgColor = Colors.primary.DEFAULT;
      break;
    case 'secondary':
      bgColor = Colors.secondary.DEFAULT;
      break;
    case 'success':
      bgColor = Colors.success;
      break;
    case 'error':
      bgColor = Colors.error;
      break;
    case 'warning':
      bgColor = Colors.warning;
      textColor = Colors.gray[800]; // Dark text for light background
      break;
    case 'info':
      bgColor = Colors.info;
      break;
    case 'neutral':
      bgColor = Colors.gray[500];
      break;
    default:
      bgColor = Colors.primary.DEFAULT;
  }

  // Determine size-based styling
  const sizeClass = size === 'sm' ? styles.badgeSmall : styles.badgeMedium;
  const textSizeClass = size === 'sm' ? styles.textSmall : styles.textMedium;

  // Determine border radius based on pill option
  const borderRadiusStyle = pill ? styles.pillRadius : styles.standardRadius;

  // Get the display text (translated or original)
  const displayText = getDisplayText(text);

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bgColor },
        sizeClass,
        borderRadiusStyle,
        style,
      ]}
      testID={testID}
      accessibilityRole='text'
    >
      <Text
        style={[
          styles.text,
          { color: textColor },
          textSizeClass,
          fontFamily && { fontFamily },
          textStyle,
        ]}
        numberOfLines={1}
      >
        {displayText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSmall: {
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[0.5],
    minWidth: 16,
    height: 18,
  },
  badgeMedium: {
    paddingHorizontal: Spacing[3],
    minWidth: 20,
    height: 24,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  textSmall: {
    fontSize: FontSizes.xs,
  },
  textMedium: {
    fontSize: FontSizes.sm,
  },
  pillRadius: {
    borderRadius: BorderRadius.full,
  },
  standardRadius: {
    borderRadius: BorderRadius.DEFAULT,
  },
});

export default Badge;
