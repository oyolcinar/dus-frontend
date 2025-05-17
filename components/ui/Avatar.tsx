// components/ui/Avatar.tsx

import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  StyleProp,
  ViewStyle,
  ImageSourcePropType,
} from 'react-native';
import { Colors, BorderRadius } from '../../constants/theme';

export interface AvatarProps {
  /**
   * The name to use for generating initials if no image is provided
   */
  name?: string;

  /**
   * Optional image source for the avatar
   */
  imageSource?: ImageSourcePropType;

  /**
   * Size of the avatar component
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';

  /**
   * Background color for the avatar when displaying initials
   */
  bgColor?: string;

  /**
   * Custom style for the container
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Handle press on the avatar (implement separately using TouchableOpacity)
   */
  onPress?: () => void;

  /**
   * Optional testID for testing
   */
  testID?: string;
}

/**
 * Avatar component displays a user's profile picture or their initials
 */
const Avatar: React.FC<AvatarProps> = ({
  name,
  imageSource,
  size = 'md',
  bgColor = Colors.primary.DEFAULT,
  style,
  testID,
}) => {
  // Determine size based on prop
  const avatarSize = getAvatarSize(size);
  const fontSize = getFontSize(size);

  // Get initials from name (first letter of first and last name)
  const initials = getInitials(name);

  return (
    <View
      style={[
        styles.container,
        {
          width: avatarSize,
          height: avatarSize,
          backgroundColor: imageSource ? 'transparent' : bgColor,
        },
        style,
      ]}
      testID={testID}
      accessibilityRole='image'
      accessibilityLabel={name ? `Avatar for ${name}` : 'Avatar'}
    >
      {imageSource ? (
        <Image
          source={imageSource}
          style={[styles.image, { width: avatarSize, height: avatarSize }]}
          resizeMode='cover'
        />
      ) : (
        <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
      )}
    </View>
  );
};

// Helper function to get initials from name
const getInitials = (name?: string): string => {
  if (!name) return '?';

  const nameParts = name.trim().split(' ');

  if (nameParts.length === 1) {
    return nameParts[0].charAt(0).toUpperCase();
  }

  // Get first letter of first and last name
  return `${nameParts[0].charAt(0)}${nameParts[nameParts.length - 1].charAt(
    0,
  )}`.toUpperCase();
};

// Helper function to get avatar size in pixels
const getAvatarSize = (size: string): number => {
  switch (size) {
    case 'xs':
      return 24;
    case 'sm':
      return 32;
    case 'md':
      return 40;
    case 'lg':
      return 56;
    case 'xl':
      return 72;
    default:
      return 40;
  }
};

// Helper function to get font size based on avatar size
const getFontSize = (size: string): number => {
  switch (size) {
    case 'xs':
      return 10;
    case 'sm':
      return 14;
    case 'md':
      return 16;
    case 'lg':
      return 24;
    case 'xl':
      return 32;
    default:
      return 16;
  }
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    borderRadius: BorderRadius.full,
  },
  initials: {
    color: Colors.white,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default Avatar;
