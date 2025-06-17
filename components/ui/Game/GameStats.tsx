// components/ui/Game/GameStats.tsx
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  ColorValue,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import { GameStatsProps } from '../types';
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
} from '../../../constants/theme';
import { createPlayfulShadow } from '../../../utils/styleUtils';
import { toAnimatedStyle } from '../../../utils/styleTypes';
import AnimatedCounter from '../AnimatedCounter';

// Helper type to ensure gradient colors are properly typed
type GradientColors = readonly [ColorValue, ColorValue, ...ColorValue[]];

const GameStats: React.FC<GameStatsProps> = ({
  stats,
  variant = 'default',
  animated = true,
  countUpAnimation = true,
  style,
  testID,
}) => {
  const slideAnimations = useRef(
    stats.map(() => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    if (animated) {
      const staggeredAnimations = slideAnimations.map((anim, index) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 600,
          delay: index * 150,
          easing: Easing.out(Easing.back(1.1)),
          useNativeDriver: true,
        }),
      );

      Animated.parallel(staggeredAnimations).start();
    } else {
      slideAnimations.forEach((anim) => anim.setValue(1));
    }
  }, [animated, stats.length]);

  const getVariantStyles = () => {
    switch (variant) {
      case 'cards':
        return {
          containerStyle: styles.cardsContainer,
          itemStyle: styles.cardItem,
          useGradient: false,
        };
      case 'compact':
        return {
          containerStyle: styles.compactContainer,
          itemStyle: styles.compactItem,
          useGradient: false,
        };
      case 'gradient':
        return {
          containerStyle: styles.gradientContainer,
          itemStyle: styles.gradientItem,
          useGradient: true,
        };
      default:
        return {
          containerStyle: styles.defaultContainer,
          itemStyle: styles.defaultItem,
          useGradient: false,
        };
    }
  };

  const variantStyles = getVariantStyles();

  const renderStatItem = (stat: any, index: number) => {
    const slideTranslateY = slideAnimations[index].interpolate({
      inputRange: [0, 1],
      outputRange: [50, 0],
    });

    const slideOpacity = slideAnimations[index].interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    // Separate complex animated styles into variables
    const animatedStyle = toAnimatedStyle({
      opacity: slideOpacity,
      transform: [{ translateY: slideTranslateY }],
    });

    const getStatColor = () => {
      if (stat.color) return stat.color;

      const colors = [
        Colors.vibrant?.purple || Colors.primary.DEFAULT,
        Colors.vibrant?.blue || Colors.info,
        Colors.vibrant?.green || Colors.success,
        Colors.vibrant?.orange || Colors.warning,
        Colors.vibrant?.pink || Colors.error,
      ];

      return colors[index % colors.length];
    };

    const statColor = getStatColor();
    const isNumeric = typeof stat.value === 'number';

    // Helper function to ensure gradient colors are properly typed
    const createGradient = (color: string): GradientColors => {
      return [color, `${color}80`];
    };

    if (variantStyles.useGradient) {
      return (
        <Animated.View
          key={index}
          style={toAnimatedStyle([variantStyles.itemStyle, animatedStyle])}
        >
          <LinearGradient
            colors={createGradient(statColor)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBackground}
          >
            <View style={styles.gradientContent}>
              {stat.icon && (
                <FontAwesome
                  name={stat.icon}
                  size={24}
                  color={Colors.white}
                  style={styles.icon}
                />
              )}
              <View style={styles.textContainer}>
                <View style={styles.valueContainer}>
                  {isNumeric && countUpAnimation ? (
                    <AnimatedCounter
                      value={stat.value}
                      style={[styles.value, styles.gradientValue]}
                      animateOnMount={animated}
                      bounceOnUpdate={true}
                    />
                  ) : (
                    <Text style={[styles.value, styles.gradientValue]}>
                      {stat.value}
                    </Text>
                  )}
                </View>
                <Text style={[styles.label, styles.gradientLabel]}>
                  {stat.label}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      );
    }

    // Wrap complex style arrays with toAnimatedStyle
    const itemStyle = toAnimatedStyle([
      variantStyles.itemStyle,
      {
        borderColor: statColor,
        ...(createPlayfulShadow?.(statColor, 'light') || {}),
      },
      animatedStyle,
    ]);

    return (
      <Animated.View key={index} style={itemStyle}>
        {stat.icon && (
          <FontAwesome
            name={stat.icon}
            size={variant === 'compact' ? 20 : 24}
            color={statColor}
            style={styles.icon}
          />
        )}
        <View style={styles.textContainer}>
          <View style={styles.valueContainer}>
            {isNumeric && countUpAnimation ? (
              <AnimatedCounter
                value={stat.value}
                style={[styles.value, { color: statColor }]}
                size={variant === 'compact' ? 'small' : 'medium'}
                animateOnMount={animated}
                bounceOnUpdate={true}
              />
            ) : (
              <Text style={[styles.value, { color: statColor }]}>
                {stat.value}
              </Text>
            )}
          </View>
          <Text style={styles.label}>{stat.label}</Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={[variantStyles.containerStyle, style]} testID={testID}>
      {stats.map((stat, index) => renderStatItem(stat, index))}
    </View>
  );
};

const styles = StyleSheet.create({
  // Default variant
  defaultContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[3],
    justifyContent: 'space-between',
  },
  defaultItem: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    padding: Spacing[4],
    alignItems: 'center',
    minWidth: '45%',
    flex: 1,
  },

  // Cards variant
  cardsContainer: {
    gap: Spacing[3],
  },
  cardItem: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.card || BorderRadius.xl,
    borderWidth: 2,
    padding: Spacing[5],
    flexDirection: 'row',
    alignItems: 'center',
    ...(createPlayfulShadow?.(Colors.gray[300], 'medium') || {}),
  },

  // Compact variant
  compactContainer: {
    flexDirection: 'row',
    gap: Spacing[2],
    flexWrap: 'wrap',
  },
  compactItem: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing[3],
    alignItems: 'center',
    minWidth: 80,
  },

  // Gradient variant
  gradientContainer: {
    gap: Spacing[3],
  },
  gradientItem: {
    borderRadius: BorderRadius.card || BorderRadius.xl,
    overflow: 'hidden',
    ...(createPlayfulShadow?.(Colors.primary.DEFAULT, 'medium') || {}),
  },
  gradientBackground: {
    padding: Spacing[5],
  },
  gradientContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Common styles
  icon: {
    marginRight: Spacing[3],
  },
  textContainer: {
    flex: 1,
    alignItems: 'center',
  },
  valueContainer: {
    marginBottom: Spacing[1],
  },
  value: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.extrabold as any,
    textAlign: 'center',
  },
  gradientValue: {
    color: Colors.white,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium as any,
    color: Colors.gray[600],
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gradientLabel: {
    color: Colors.white,
    opacity: 0.9,
  },
});

export default GameStats;
