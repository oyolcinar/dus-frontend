// components/ui/PlayfulCard.tsx
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Animated,
  Easing,
  ColorValue,
  useColorScheme,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import { CardProps } from './types';
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
} from '../../constants/theme';
import { createPlayfulShadow } from '../../utils/styleUtils';
import { toAnimatedStyle } from '../../utils/styleTypes';

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Helper type to ensure gradient colors are properly typed
type GradientColors = readonly [ColorValue, ColorValue, ...ColorValue[]];

// Category color mapping
const CATEGORY_COLORS = {
  radyoloji: {
    background: '#FF7675',
    text: '#FFFFFF',
    border: '#FFFFFF',
    iconColor: '#FFFFFF',
  },
  restoratif: {
    background: '#4285F4',
    text: '#FFFFFF',
    border: '#FFFFFF',
    iconColor: '#FFFFFF',
  },
  endodonti: {
    background: '#FFD93D',
    text: '#2D3436',
    border: '#2D3436',
    iconColor: '#2D3436',
  },
  pedodonti: {
    background: '#FF6B9D',
    text: '#FFFFFF',
    border: '#FFFFFF',
    iconColor: '#FFFFFF',
  },
  protetik: {
    background: '#21b958',
    text: '#FFFFFF',
    border: '#FFFFFF',
    iconColor: '#FFFFFF',
  },
  peridontoloji: {
    background: '#800000',
    text: '#FFFFFF',
    border: '#FFFFFF',
    iconColor: '#FFFFFF',
  },
  cerrahi: {
    background: '#ec1c24',
    text: '#FFFFFF',
    border: '#FFFFFF',
    iconColor: '#FFFFFF',
  },
  ortodonti: {
    background: '#702963',
    text: '#FFFFFF',
    border: '#FFFFFF',
    iconColor: '#FFFFFF',
  },
} as const;

const PlayfulCard: React.FC<CardProps> = ({
  title,
  children,
  variant = 'default',
  style,
  titleStyle,
  padding = 'medium',
  testID,
  gradient,
  animated = false,
  floatingAnimation = false,
  pulseEffect = false,
  borderGlow = false,
  titleFontFamily,
  contentFontFamily,
  contentContainerStyle,
  // NEW: Collapsible props
  collapsible = false,
  defaultCollapsed = false,
  onCollapseToggle,
  // NEW: Category props
  category,
  collapseIcon = 'chevron-down',
  expandIcon = 'chevron-up',
  ...props
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Animation refs
  const floatAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const glowAnimation = useRef(new Animated.Value(0)).current;

  // NEW: Collapsible state
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const collapseAnimation = useRef(
    new Animated.Value(defaultCollapsed ? 0 : 1),
  ).current;

  // Store animation references for proper cleanup
  const animationRefs = useRef<{
    float?: Animated.CompositeAnimation;
    pulse?: Animated.CompositeAnimation;
    glow?: Animated.CompositeAnimation;
  }>({});

  // Floating animation effect
  useEffect(() => {
    if (floatingAnimation) {
      const floatAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnimation, {
            toValue: 1,
            duration: 3000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(floatAnimation, {
            toValue: 0,
            duration: 3000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );

      animationRefs.current.float = floatAnim;
      floatAnim.start();

      return () => {
        if (animationRefs.current.float) {
          animationRefs.current.float.stop();
          animationRefs.current.float = undefined;
        }
        floatAnimation.setValue(0);
      };
    }
  }, [floatingAnimation, floatAnimation]);

  // Pulse animation effect
  useEffect(() => {
    if (pulseEffect) {
      const pulseAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.05,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );

      animationRefs.current.pulse = pulseAnim;
      pulseAnim.start();

      return () => {
        if (animationRefs.current.pulse) {
          animationRefs.current.pulse.stop();
          animationRefs.current.pulse = undefined;
        }
        pulseAnimation.setValue(1);
      };
    }
  }, [pulseEffect, pulseAnimation]);

  // Glow animation effect
  useEffect(() => {
    if (borderGlow) {
      const glowAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnimation, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnimation, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );

      animationRefs.current.glow = glowAnim;
      glowAnim.start();

      return () => {
        if (animationRefs.current.glow) {
          animationRefs.current.glow.stop();
          animationRefs.current.glow = undefined;
        }
        glowAnimation.setValue(0);
      };
    }
  }, [borderGlow, glowAnimation]);

  // Cleanup all animations when component unmounts
  useEffect(() => {
    return () => {
      Object.values(animationRefs.current).forEach((animation) => {
        if (animation) {
          animation.stop();
        }
      });

      floatAnimation.setValue(0);
      pulseAnimation.setValue(1);
      glowAnimation.setValue(0);

      animationRefs.current = {};
    };
  }, []);

  // NEW: Handle collapse toggle
  const handleCollapseToggle = () => {
    const newCollapsedState = !isCollapsed;

    // Use LayoutAnimation for smooth height transition
    LayoutAnimation.configureNext({
      duration: 300,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    });

    setIsCollapsed(newCollapsedState);
    onCollapseToggle?.(newCollapsedState);

    // Animate the collapse animation value
    Animated.timing(collapseAnimation, {
      toValue: newCollapsedState ? 0 : 1,
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const getVariantStyles = () => {
    // Helper function to ensure gradient colors are properly typed
    const createGradient = (colors: string[]): GradientColors => {
      if (colors.length < 2) {
        return [colors[0] || '#000000', colors[0] || '#000000'];
      }
      return [colors[0], colors[1], ...colors.slice(2)] as GradientColors;
    };

    // Helper to resolve gradient from different sources
    const resolveGradient = (fallbackColors: string[]): GradientColors => {
      if (gradient && Array.isArray(gradient)) {
        return createGradient(gradient);
      }

      if (gradient && typeof gradient === 'object' && 'colors' in gradient) {
        return createGradient(gradient.colors);
      }

      if (
        gradient &&
        typeof gradient === 'string' &&
        Colors.gradients?.[gradient]
      ) {
        return createGradient(Colors.gradients[gradient]);
      }

      return createGradient(fallbackColors);
    };

    // NEW: Get category colors if category is provided
    const categoryColors = category ? CATEGORY_COLORS[category] : null;

    // Base colors based on theme and category
    const baseBackgroundColor =
      categoryColors?.background ||
      (isDark ? Colors.vibrant?.purpleDark : Colors.vibrant?.purpleDark);
    const baseBorderColor =
      categoryColors?.border || (isDark ? Colors.gray[200] : Colors.gray[200]);
    const baseTextColor =
      categoryColors?.text || (isDark ? Colors.white : Colors.white);

    const glassBg = isDark
      ? 'rgba(255, 255, 255, 0.15)'
      : 'rgba(255, 255, 255, 0.15)';
    const glassBorder = isDark
      ? 'rgba(255, 255, 255, 0.3)'
      : 'rgba(255, 255, 255, 0.3)';

    switch (variant) {
      case 'default':
        return {
          backgroundColor: baseBackgroundColor,
          borderColor: baseBorderColor,
          textColor: baseTextColor,
          gradient: null,
          // shadow:
          //   createPlayfulShadow?.(
          //     Colors.shadows?.medium || Colors.gray[400],
          //     'heavy',
          //   ) || {},
        };
      case 'outlined':
        return {
          backgroundColor: categoryColors
            ? baseBackgroundColor
            : isDark
            ? 'transparent'
            : 'transparent',
          borderColor: baseBorderColor,
          borderWidth: 2,
          textColor: categoryColors ? baseTextColor : baseBorderColor,
          gradient: null,
          shadow:
            createPlayfulShadow?.(
              Colors.shadows?.medium || Colors.gray[400],
              'heavy',
            ) || {},
        };
      case 'elevated':
        return {
          backgroundColor: baseBackgroundColor,
          textColor: baseTextColor,
          gradient: null,
          shadow:
            createPlayfulShadow?.(
              Colors.shadows?.medium || Colors.gray[400],
              'heavy',
            ) || {},
        };
      case 'playful':
        return {
          backgroundColor: baseBackgroundColor,
          textColor: baseTextColor,
          gradient: null,
          shadow:
            createPlayfulShadow?.(
              Colors.shadows?.medium || Colors.gray[400],
              'heavy',
            ) || {},
        };
      case 'glass':
        return {
          backgroundColor: categoryColors ? baseBackgroundColor : glassBg,
          borderColor: categoryColors ? baseBorderColor : glassBorder,
          borderWidth: 1,
          textColor: categoryColors
            ? baseTextColor
            : isDark
            ? Colors.white
            : Colors.white,
          gradient: null,
          shadow:
            createPlayfulShadow?.(
              Colors.shadows?.medium || Colors.gray[400],
              'heavy',
            ) || {},
        };
      case 'game':
        return {
          backgroundColor: baseBackgroundColor,
          textColor: baseTextColor,
          gradient: null,
          shadow:
            createPlayfulShadow?.(
              Colors.vibrant?.orange || Colors.secondary.DEFAULT,
              'heavy',
            ) || {},
        };
      case 'floating':
        return {
          backgroundColor: baseBackgroundColor,
          textColor: baseTextColor,
          gradient: null,
          shadow:
            createPlayfulShadow?.(
              Colors.shadows?.medium || Colors.gray[400],
              'heavy',
            ) || {},
        };
      case 'gradient':
        return {
          backgroundColor: 'transparent',
          textColor: baseTextColor,
          gradient: resolveGradient(
            Colors.gradients?.primary || [
              Colors.primary.DEFAULT,
              Colors.primary.light,
            ],
          ),
          shadow:
            createPlayfulShadow?.(
              Colors.shadows?.medium || Colors.gray[400],
              'heavy',
            ) || {},
        };
      default:
        return {
          backgroundColor: baseBackgroundColor,
          borderColor: baseBorderColor,
          textColor: baseTextColor,
          gradient: null,
          shadow:
            createPlayfulShadow?.(
              Colors.shadows?.medium || Colors.gray[400],
              'heavy',
            ) || {},
        };
    }
  };

  const getPaddingStyles = () => {
    switch (padding) {
      case 'none':
        return { padding: 0 };
      case 'small':
        return { padding: Spacing[2] };
      case 'medium':
        return { padding: Spacing[4] };
      case 'large':
        return { padding: Spacing[6] };
      case 'xl':
        return { padding: Spacing[8] };
      default:
        return { padding: Spacing[4] };
    }
  };

  const variantStyles = getVariantStyles();
  const paddingStyles = getPaddingStyles();

  const translateY = floatAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const glowOpacity = glowAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.6],
  });

  // Create custom title style with font family support and category colors
  const customTitleStyle = {
    ...(titleFontFamily ? { fontFamily: titleFontFamily } : {}),
    // Remove fontWeight if custom font is provided
    ...(titleFontFamily ? {} : { fontWeight: FontWeights.bold as any }),
    // Use category or theme-aware text color
    color: variantStyles.textColor,
  };

  // NEW: Get category icon color
  const iconColor = category
    ? CATEGORY_COLORS[category].iconColor
    : variantStyles.textColor;

  // Separate complex animated styles into variables
  const animatedStyle = toAnimatedStyle({
    transform: [{ translateY: translateY }, { scale: pulseAnimation }],
  });

  const glowBorderGradientStyle = toAnimatedStyle([
    styles.glowBorder,
    {
      opacity: glowOpacity,
      borderColor:
        variantStyles.gradient?.[1] ||
        variantStyles.gradient?.[0] ||
        Colors.primary.DEFAULT,
    },
  ]);

  const glowBorderStyle = toAnimatedStyle([
    styles.glowBorder,
    {
      opacity: glowOpacity,
      borderColor: variantStyles.borderColor || Colors.vibrant?.purpleLight,
    },
  ]);

  // NEW: Render header with optional collapse functionality
  const renderHeader = () => {
    if (!title) return null;

    const HeaderComponent = collapsible ? TouchableOpacity : View;
    const headerProps = collapsible
      ? {
          onPress: handleCollapseToggle,
          activeOpacity: 0.7,
        }
      : {};

    return (
      <HeaderComponent
        style={[
          styles.header,
          {
            borderBottomColor: variantStyles.textColor,
          },
          collapsible && styles.collapsibleHeader,
        ]}
        {...headerProps}
      >
        <Text style={[styles.title, customTitleStyle, titleStyle]}>
          {title}
        </Text>
        {collapsible && (
          <FontAwesome
            name={isCollapsed ? collapseIcon : expandIcon}
            size={16}
            color={iconColor}
            style={styles.collapseIcon}
          />
        )}
      </HeaderComponent>
    );
  };

  // NEW: Render content with collapse animation
  const renderContent = () => {
    if (collapsible && isCollapsed) {
      return null;
    }

    return (
      <Animated.View
        style={[
          styles.content,
          contentContainerStyle,
          collapsible && {
            opacity: collapseAnimation,
          },
        ]}
      >
        {children}
      </Animated.View>
    );
  };

  const cardContent = (
    <View style={[paddingStyles]}>
      {renderHeader()}
      {renderContent()}
    </View>
  );

  // Wrap complex style arrays with toAnimatedStyle
  const baseCardStyle = toAnimatedStyle([
    styles.card,
    {
      backgroundColor: variantStyles.backgroundColor,
      borderColor: variantStyles.borderColor,
      borderWidth: variantStyles.borderWidth,
    },
    variantStyles.shadow,
    animatedStyle,
    style,
  ]);

  if (variantStyles.gradient) {
    return (
      <Animated.View style={baseCardStyle} testID={testID} {...props}>
        <LinearGradient
          colors={variantStyles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientContainer}
        >
          {borderGlow && <Animated.View style={glowBorderGradientStyle} />}
          {cardContent}
        </LinearGradient>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={baseCardStyle} testID={testID} {...props}>
      {borderGlow && <Animated.View style={glowBorderStyle} />}
      {cardContent}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.card || BorderRadius.xl,
    overflow: 'hidden',
  },
  gradientContainer: {
    borderRadius: BorderRadius.card || BorderRadius.xl,
  },
  header: {
    marginBottom: Spacing[3],
    paddingBottom: Spacing[2],
    borderBottomWidth: 1,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: FontSizes.lg,
    flex: 1,
  },
  collapseIcon: {
    marginLeft: Spacing[2],
  },
  content: {
    flex: 1,
  },
  glowBorder: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderWidth: 3,
    borderRadius: (BorderRadius.card || BorderRadius.xl) + 2,
    zIndex: -1,
  },
});

export default PlayfulCard;
