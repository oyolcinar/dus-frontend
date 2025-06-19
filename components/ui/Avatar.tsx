// components/ui/Avatar.tsx

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  StyleProp,
  ViewStyle,
  ImageSourcePropType,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius } from '../../constants/theme';
import { GradientStyle } from './types';

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
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

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

  // NEW: Playful options
  /**
   * Gradient background for the avatar
   */
  gradient?: GradientStyle | keyof typeof Colors.gradients;

  /**
   * Add a glowing border effect
   */
  borderGlow?: boolean;

  /**
   * Enable animations
   */
  animated?: boolean;

  /**
   * Add floating animation effect
   */
  floatingEffect?: boolean;
}

/**
 * Enhanced Avatar component with playful animations and effects
 */
const Avatar: React.FC<AvatarProps> = ({
  name,
  imageSource,
  size = 'md',
  bgColor = Colors.primary.DEFAULT,
  style,
  testID,
  gradient,
  borderGlow = false,
  animated = false,
  floatingEffect = false,
}) => {
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Determine size based on prop
  const avatarSize = getAvatarSize(size);
  const fontSize = getFontSize(size);

  // Get initials from name (first letter of first and last name)
  const initials = getInitials(name);

  // Get gradient colors
  const gradientColors = getGradientColors(gradient);

  useEffect(() => {
    if (animated) {
      // Entrance animation
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }).start();
    }

    if (floatingEffect) {
      // Floating animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: -5,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }

    if (borderGlow) {
      // Glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
        ]),
      ).start();
    }
  }, [animated, floatingEffect, borderGlow]);

  const animatedStyle = {
    transform: [{ scale: scaleAnim }, { translateY: floatAnim }],
  };

  const glowStyle = borderGlow
    ? {
        shadowColor: gradientColors?.[0] || bgColor,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 15,
        elevation: 10,
      }
    : {};

  const AvatarContent = () => (
    <View
      style={[
        styles.container,
        {
          width: avatarSize,
          height: avatarSize,
          backgroundColor: !imageSource && !gradient ? bgColor : 'transparent',
        },
        glowStyle,
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
        <Text
          style={[
            styles.initials,
            { fontSize, color: gradient ? Colors.white : Colors.white },
          ]}
        >
          {initials}
        </Text>
      )}
    </View>
  );

  if (gradient && gradientColors && gradientColors.length >= 2) {
    const AnimatedLinearGradient =
      Animated.createAnimatedComponent(LinearGradient);

    return (
      <Animated.View style={[animatedStyle, style]}>
        <AnimatedLinearGradient
          colors={gradientColors as [string, string, ...string[]]}
          style={[
            styles.container,
            {
              width: avatarSize,
              height: avatarSize,
              shadowColor: borderGlow
                ? gradientColors?.[0] || bgColor
                : 'transparent',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: borderGlow ? glowAnim : 0,
              shadowRadius: 15,
              elevation: borderGlow ? 10 : 0,
            },
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {imageSource ? (
            <Image
              source={imageSource}
              style={[
                styles.image,
                { width: avatarSize - 4, height: avatarSize - 4 },
              ]}
              resizeMode='cover'
            />
          ) : (
            <Text style={[styles.initials, { fontSize, color: Colors.white }]}>
              {initials}
            </Text>
          )}
        </AnimatedLinearGradient>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Animated.View
        style={[
          {
            shadowColor: borderGlow
              ? gradientColors?.[0] || bgColor
              : 'transparent',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: borderGlow ? glowAnim : 0,
            shadowRadius: 15,
            elevation: borderGlow ? 10 : 0,
          },
        ]}
      >
        <AvatarContent />
      </Animated.View>
    </Animated.View>
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
    case '2xl':
      return 96;
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
    case '2xl':
      return 40;
    default:
      return 16;
  }
};

// Helper function to get gradient colors using your existing theme
const getGradientColors = (
  gradient?: GradientStyle | keyof typeof Colors.gradients,
): string[] | null => {
  if (!gradient) return null;

  if (typeof gradient === 'string') {
    // Use your existing gradient definitions from Colors.gradients
    const existingGradient =
      Colors.gradients[gradient as keyof typeof Colors.gradients];
    if (existingGradient) {
      return existingGradient;
    }

    // Fallback to predefined gradients using your existing colors
    const fallbackGradients: Record<string, string[]> = {
      primary: [Colors.primary.DEFAULT, Colors.primary.dark],
      secondary: [Colors.secondary.DEFAULT, Colors.secondary.dark],
      success: [Colors.success, Colors.vibrant.green],
      error: [Colors.error, Colors.vibrant.pink],
      warning: [Colors.warning, Colors.vibrant.yellow],
      info: [Colors.info, Colors.vibrant.blue],
      sunset: [Colors.vibrant.orange, Colors.vibrant.yellow],
      ocean: [Colors.vibrant.blue, Colors.vibrant.green],
      forest: [Colors.vibrant.green, Colors.vibrant.mint],
      fire: [Colors.vibrant.pink, Colors.vibrant.orange],
      sky: [Colors.vibrant.blue, Colors.vibrant.purpleLight],
      purple: [Colors.vibrant.purple, Colors.vibrant.purpleLight],
      pink: [Colors.vibrant.pink, Colors.vibrant.pinkLight],
      mint: [Colors.vibrant.mint, Colors.vibrant.green],
    };

    return fallbackGradients[gradient] || fallbackGradients.primary;
  }

  if (gradient && typeof gradient === 'object' && gradient.colors) {
    return gradient.colors;
  }

  return null;
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
