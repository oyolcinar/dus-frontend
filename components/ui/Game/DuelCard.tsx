// components/ui/Game/DuelCard.tsx
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Easing,
  ColorValue,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import { DuelCardProps } from '../types';
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
} from '../../../constants/theme';
import { createPlayfulShadow } from '../../../utils/styleUtils';
import { toAnimatedStyle } from '../../../utils/styleTypes';

// Helper type to ensure gradient colors are properly typed
type GradientColors = readonly [ColorValue, ColorValue, ...ColorValue[]];

const DuelCard: React.FC<DuelCardProps> = ({
  opponent,
  status = 'pending',
  gameType,
  category,
  stakes,
  timeRemaining,
  onAccept,
  onDecline,
  onView,
  variant = 'default',
  animated = true,
  style,
  testID,
}) => {
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const urgentAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.spring(slideAnimation, {
        toValue: 1,
        tension: 300,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnimation.setValue(1);
    }

    if (status === 'active') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.02,
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
      pulse.start();
      return () => pulse.stop();
    }

    if (timeRemaining && status === 'pending') {
      const urgent = Animated.loop(
        Animated.timing(urgentAnimation, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      );
      urgent.start();
      return () => urgent.stop();
    }
  }, [animated, status, timeRemaining]);

  const getStatusStyles = () => {
    // Helper function to ensure gradient colors are properly typed
    const createGradient = (colors: string[]): GradientColors => {
      if (colors.length < 2) {
        return [colors[0] || '#000000', colors[0] || '#000000'];
      }
      // Ensure we have at least 2 colors and properly type them
      return [colors[0], colors[1], ...colors.slice(2)] as GradientColors;
    };

    switch (status) {
      case 'pending':
        return {
          gradient: createGradient([
            Colors.vibrant?.orange || Colors.warning,
            Colors.vibrant?.orangeLight || Colors.warning,
          ]),
          statusIcon: 'clock-o' as const,
          statusColor: Colors.vibrant?.orange || Colors.warning,
          statusText: 'Pending',
        };
      case 'active':
        return {
          gradient: createGradient([
            Colors.vibrant?.green || Colors.success,
            Colors.vibrant?.greenLight || Colors.success,
          ]),
          statusIcon: 'play-circle' as const,
          statusColor: Colors.vibrant?.green || Colors.success,
          statusText: 'Active',
        };
      case 'completed':
        return {
          gradient: createGradient([
            Colors.vibrant?.blue || Colors.primary.DEFAULT,
            Colors.vibrant?.blueLight || Colors.primary.light,
          ]),
          statusIcon: 'check-circle' as const,
          statusColor: Colors.vibrant?.blue || Colors.primary.DEFAULT,
          statusText: 'Completed',
        };
      case 'declined':
        return {
          gradient: createGradient([Colors.gray[500], Colors.gray[400]]),
          statusIcon: 'times-circle' as const,
          statusColor: Colors.gray[500],
          statusText: 'Declined',
        };
      default:
        return {
          gradient: createGradient([Colors.gray[400], Colors.gray[300]]),
          statusIcon: 'question-circle' as const,
          statusColor: Colors.gray[500],
          statusText: 'Unknown',
        };
    }
  };

  const getVariantStyles = () => {
    const statusStyles = getStatusStyles();

    switch (variant) {
      case 'compact':
        return {
          ...statusStyles,
          borderRadius: BorderRadius.lg,
          padding: Spacing[3],
          shadow:
            createPlayfulShadow?.(statusStyles.statusColor, 'light') || {},
        };
      case 'detailed':
        return {
          ...statusStyles,
          borderRadius: BorderRadius.bubble || BorderRadius.xl,
          padding: Spacing[6],
          shadow:
            createPlayfulShadow?.(statusStyles.statusColor, 'heavy') || {},
        };
      default:
        return {
          ...statusStyles,
          borderRadius: BorderRadius.card || BorderRadius.xl,
          padding: Spacing[4],
          shadow:
            createPlayfulShadow?.(statusStyles.statusColor, 'medium') || {},
        };
    }
  };

  const variantStyles = getVariantStyles();

  const translateX = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 0],
  });

  const opacity = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const urgentGlow = urgentAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.3],
  });

  // Separate complex animated styles into variables
  const animatedStyle = toAnimatedStyle({
    opacity,
    transform: [{ translateX }, { scale: pulseAnimation }],
  });

  const renderOpponentAvatar = () => {
    if (opponent.avatar) {
      return <Image source={{ uri: opponent.avatar }} style={styles.avatar} />;
    }

    return (
      <View style={styles.avatarPlaceholder}>
        <FontAwesome name='user' size={24} color={Colors.gray[500]} />
      </View>
    );
  };

  const renderOpponentStats = () => {
    if (!opponent.stats) return null;

    const winRate = opponent.stats.winRate || 0;
    const getWinRateColor = () => {
      if (winRate >= 70) return Colors.vibrant?.green || Colors.success;
      if (winRate >= 50) return Colors.vibrant?.yellow || Colors.warning;
      return Colors.vibrant?.orange || Colors.error;
    };

    return (
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {opponent.stats.wins || 0}W - {opponent.stats.losses || 0}L
        </Text>
        <Text style={[styles.winRate, { color: getWinRateColor() }]}>
          {Math.round(winRate)}% Win Rate
        </Text>
      </View>
    );
  };

  const renderActionButtons = () => {
    if (status === 'pending') {
      return (
        <View style={styles.actionButtons}>
          {onAccept && (
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={onAccept}
            >
              <FontAwesome name='check' size={16} color={Colors.white} />
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
          )}
          {onDecline && (
            <TouchableOpacity
              style={[styles.actionButton, styles.declineButton]}
              onPress={onDecline}
            >
              <FontAwesome name='times' size={16} color={Colors.white} />
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    if ((status === 'completed' || status === 'active') && onView) {
      return (
        <TouchableOpacity
          style={[styles.actionButton, styles.viewButton]}
          onPress={onView}
        >
          <FontAwesome name='eye' size={16} color={Colors.white} />
          <Text style={styles.viewButtonText}>
            {status === 'active' ? 'Join' : 'View Results'}
          </Text>
        </TouchableOpacity>
      );
    }

    return null;
  };

  // Wrap complex style arrays with toAnimatedStyle
  const containerStyle = toAnimatedStyle([
    styles.container,
    {
      borderRadius: variantStyles.borderRadius,
    },
    variantStyles.shadow,
    animatedStyle,
    style,
  ]);

  return (
    <Animated.View style={containerStyle} testID={testID}>
      <LinearGradient
        colors={variantStyles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradientContainer,
          { borderRadius: variantStyles.borderRadius },
        ]}
      >
        {timeRemaining && status === 'pending' && (
          <Animated.View
            style={[
              styles.urgentOverlay,
              {
                opacity: urgentGlow,
                borderRadius: variantStyles.borderRadius,
              },
            ]}
          />
        )}

        <View style={[styles.content, { padding: variantStyles.padding }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.statusContainer}>
              <FontAwesome
                name={variantStyles.statusIcon}
                size={16}
                color={Colors.white}
              />
              <Text style={styles.statusText}>{variantStyles.statusText}</Text>
            </View>

            {timeRemaining && (
              <View style={styles.timeContainer}>
                <FontAwesome name='clock-o' size={14} color={Colors.white} />
                <Text style={styles.timeText}>{timeRemaining}</Text>
              </View>
            )}
          </View>

          {/* Opponent Info */}
          <View style={styles.opponentSection}>
            <View style={styles.opponentInfo}>
              {renderOpponentAvatar()}
              <View style={styles.opponentDetails}>
                <Text style={styles.opponentName}>{opponent.name}</Text>
                {renderOpponentStats()}
              </View>
            </View>
          </View>

          {/* Game Details */}
          <View style={styles.gameDetails}>
            {gameType && <Text style={styles.gameType}>{gameType}</Text>}
            {category && (
              <Text style={styles.category}>Category: {category}</Text>
            )}
            {stakes && <Text style={styles.stakes}>Stakes: {stakes}</Text>}
          </View>

          {/* Actions */}
          {renderActionButtons()}
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing[2],
    overflow: 'hidden',
  },
  gradientContainer: {
    position: 'relative',
  },
  urgentOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.vibrant?.pink || '#FF6B9D',
    zIndex: 1,
  },
  content: {
    position: 'relative',
    zIndex: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.full,
  },
  statusText: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold as any,
    marginLeft: Spacing[1],
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium as any,
    marginLeft: Spacing[1],
    opacity: 0.9,
  },
  opponentSection: {
    marginBottom: Spacing[3],
  },
  opponentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: Colors.white,
    marginRight: Spacing[3],
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
    marginRight: Spacing[3],
  },
  opponentDetails: {
    flex: 1,
  },
  opponentName: {
    color: Colors.white,
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold as any,
    marginBottom: Spacing[0.5],
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  statsText: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    opacity: 0.9,
  },
  winRate: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold as any,
  },
  gameDetails: {
    marginBottom: Spacing[4],
  },
  gameType: {
    color: Colors.white,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold as any,
    marginBottom: Spacing[1],
  },
  category: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    opacity: 0.9,
    marginBottom: Spacing[0.5],
  },
  stakes: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    opacity: 0.9,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[4],
    borderRadius: BorderRadius.button || BorderRadius.lg,
    flex: 1,
  },
  acceptButton: {
    backgroundColor: Colors.vibrant?.green || Colors.success,
  },
  declineButton: {
    backgroundColor: Colors.vibrant?.orange || Colors.error,
  },
  viewButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  acceptButtonText: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold as any,
    marginLeft: Spacing[1],
  },
  declineButtonText: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold as any,
    marginLeft: Spacing[1],
  },
  viewButtonText: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold as any,
    marginLeft: Spacing[1],
  },
});

export default DuelCard;
