// components/ui/Game/LeaderboardCard.tsx
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Easing,
  ColorValue,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import { LeaderboardCardProps } from '../types';
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

const LeaderboardCard: React.FC<LeaderboardCardProps> = ({
  rank,
  name,
  score,
  avatar,
  isCurrentUser = false,
  variant = 'default',
  showTrend = false,
  trend,
  animated = true,
  style,
  testID,
}) => {
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const trendAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(slideAnimation, {
        toValue: 1,
        duration: 600,
        delay: rank * 100,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }).start();
    } else {
      slideAnimation.setValue(1);
    }

    if (isCurrentUser) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.02,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [animated, rank, isCurrentUser]);

  useEffect(() => {
    if (showTrend && trend) {
      Animated.spring(trendAnimation, {
        toValue: 1,
        tension: 300,
        friction: 6,
        useNativeDriver: true,
      }).start();
    }
  }, [showTrend, trend]);

  const getRankStyles = () => {
    // Helper function to ensure gradient colors are properly typed
    const createGradient = (colors: string[]): GradientColors => {
      if (colors.length < 2) {
        return [colors[0] || '#000000', colors[0] || '#000000'];
      }
      // Ensure we have at least 2 colors and properly type them
      return [colors[0], colors[1], ...colors.slice(2)] as GradientColors;
    };

    type RankStyleType = {
      gradient: GradientColors | null;
      rankColor: string;
      icon: React.ComponentProps<typeof FontAwesome>['name'] | null;
      iconColor: string;
    };

    if (rank === 1) {
      return {
        gradient: createGradient([
          Colors.vibrant?.yellow || '#FFD93D',
          Colors.vibrant?.orange || '#FF6B6B',
        ]),
        rankColor: Colors.white,
        icon: 'trophy' as const,
        iconColor: Colors.vibrant?.yellow || '#FFD93D',
      } as RankStyleType;
    } else if (rank === 2) {
      return {
        gradient: createGradient([Colors.gray[400], Colors.gray[300]]),
        rankColor: Colors.white,
        icon: 'star' as const,
        iconColor: Colors.gray[600],
      } as RankStyleType;
    } else if (rank === 3) {
      return {
        gradient: createGradient([
          Colors.vibrant?.orange || '#FF6B6B',
          Colors.vibrant?.orangeLight || '#FF8E8E',
        ]),
        rankColor: Colors.white,
        icon: 'star' as const,
        iconColor: Colors.vibrant?.orange || '#FF6B6B',
      } as RankStyleType;
    } else {
      return {
        gradient: null,
        rankColor: Colors.gray[600],
        icon: null,
        iconColor: Colors.gray[600],
      } as RankStyleType;
    }
  };

  const getVariantStyles = () => {
    const rankStyles = getRankStyles();

    switch (variant) {
      case 'podium':
        return {
          ...rankStyles,
          backgroundColor: Colors.white,
          borderRadius: BorderRadius.bubble || BorderRadius.xl,
          shadow:
            createPlayfulShadow?.(
              (rankStyles.gradient?.[0] as string) || Colors.gray[300],
              rank <= 3 ? 'heavy' : 'medium',
            ) || {},
          showGradient: rank <= 3,
        };
      case 'compact':
        return {
          ...rankStyles,
          backgroundColor: Colors.white,
          borderRadius: BorderRadius.lg,
          shadow: createPlayfulShadow?.(Colors.gray[300], 'light') || {},
          showGradient: false,
        };
      default:
        return {
          ...rankStyles,
          backgroundColor: isCurrentUser
            ? Colors.vibrant?.purpleLight || Colors.primary.light
            : Colors.white,
          borderRadius: BorderRadius.card || BorderRadius.xl,
          shadow:
            createPlayfulShadow?.(
              isCurrentUser
                ? Colors.vibrant?.purple || Colors.primary.DEFAULT
                : Colors.gray[300],
              isCurrentUser ? 'medium' : 'light',
            ) || {},
          showGradient: rank <= 3,
        };
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return {
          name: 'arrow-up' as const,
          color: Colors.vibrant?.green || Colors.success,
        };
      case 'down':
        return {
          name: 'arrow-down' as const,
          color: Colors.vibrant?.orange || Colors.error,
        };
      default:
        return { name: 'minus' as const, color: Colors.gray[500] };
    }
  };

  const variantStyles = getVariantStyles();
  const trendIcon = getTrendIcon();

  const translateX = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 0],
  });

  const opacity = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const trendScale = trendAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // Separate complex animated styles into variables
  const animatedStyle = toAnimatedStyle({
    opacity,
    transform: [{ translateX }, { scale: pulseAnimation }],
  });

  const renderRankBadge = () => {
    if (variantStyles.showGradient && variantStyles.gradient) {
      return (
        <LinearGradient
          colors={variantStyles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.rankBadgeGradient}
        >
          {variantStyles.icon ? (
            <FontAwesome
              name={variantStyles.icon}
              size={variant === 'compact' ? 16 : 20}
              color={variantStyles.iconColor}
            />
          ) : (
            <Text style={[styles.rankText, { color: variantStyles.rankColor }]}>
              {rank}
            </Text>
          )}
        </LinearGradient>
      );
    }

    return (
      <View
        style={[
          styles.rankBadge,
          {
            backgroundColor: isCurrentUser
              ? Colors.vibrant?.purple || Colors.primary.DEFAULT
              : Colors.gray[200],
          },
        ]}
      >
        <Text
          style={[
            styles.rankText,
            {
              color: isCurrentUser ? Colors.white : variantStyles.rankColor,
            },
          ]}
        >
          {rank}
        </Text>
      </View>
    );
  };

  const renderAvatar = () => {
    if (avatar) {
      return <Image source={{ uri: avatar }} style={styles.avatar} />;
    }

    return (
      <View style={styles.avatarPlaceholder}>
        <FontAwesome
          name='user'
          size={variant === 'compact' ? 16 : 20}
          color={Colors.gray[500]}
        />
      </View>
    );
  };

  // Wrap complex style arrays with toAnimatedStyle
  const containerStyle = toAnimatedStyle([
    styles.container,
    {
      backgroundColor: variantStyles.backgroundColor,
      borderRadius: variantStyles.borderRadius,
    },
    variantStyles.shadow,
    animatedStyle,
    style,
  ]);

  return (
    <Animated.View style={containerStyle} testID={testID}>
      <View style={styles.content}>
        {/* Rank Badge */}
        <View style={styles.rankContainer}>{renderRankBadge()}</View>

        {/* Avatar */}
        <View style={styles.avatarContainer}>{renderAvatar()}</View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <Text
            style={[
              styles.userName,
              {
                color: isCurrentUser ? Colors.white : Colors.gray[800],
              },
            ]}
            numberOfLines={1}
          >
            {name}
          </Text>

          <View style={styles.scoreContainer}>
            <AnimatedCounter
              value={score}
              style={[
                styles.userScore,
                {
                  color: isCurrentUser
                    ? Colors.white
                    : Colors.vibrant?.purple || Colors.primary.DEFAULT,
                },
              ]}
              size={variant === 'compact' ? 'small' : 'medium'}
              animateOnMount={animated}
              suffix=' pts'
            />
          </View>
        </View>

        {/* Trend Indicator */}
        {showTrend && trend && (
          <Animated.View
            style={toAnimatedStyle([
              styles.trendContainer,
              {
                transform: [{ scale: trendScale }],
              },
            ])}
          >
            <FontAwesome
              name={trendIcon.name}
              size={16}
              color={trendIcon.color}
            />
          </Animated.View>
        )}
      </View>

      {/* Current User Indicator */}
      {isCurrentUser && (
        <View style={styles.currentUserBadge}>
          <Text style={styles.currentUserText}>You</Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing[1],
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[4],
  },
  rankContainer: {
    marginRight: Spacing[3],
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold as any,
  },
  avatarContainer: {
    marginRight: Spacing[3],
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  avatarPlaceholder: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: Colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold as any,
    marginBottom: Spacing[1],
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userScore: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold as any,
  },
  trendContainer: {
    marginLeft: Spacing[2],
    padding: Spacing[1],
  },
  currentUserBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.vibrant?.yellow || '#FFD93D',
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[0.5],
    borderRadius: BorderRadius.full,
  },
  currentUserText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold as any,
    color: Colors.gray[800],
  },
});

export default LeaderboardCard;
