// components/ui/GameCard.tsx
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'expo-linear-gradient';
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

interface GameCardProps extends CardProps {
  score?: number;
  playerName?: string;
  gameType?: string;
  status?: 'active' | 'completed' | 'waiting' | 'challenge';
  onPlay?: () => void;
  onChallenge?: () => void;
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
}

const GameCard: React.FC<GameCardProps> = ({
  title,
  children,
  variant = 'game',
  style,
  titleStyle,
  padding = 'medium',
  testID,
  score,
  playerName,
  gameType,
  status = 'waiting',
  onPlay,
  onChallenge,
  icon,
  animated = true,
  floatingAnimation = false,
  pulseEffect = false,
  ...props
}) => {
  const floatAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const glowAnimation = useRef(new Animated.Value(0)).current;
  const hoverAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (floatingAnimation) {
      const float = Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnimation, {
            toValue: 1,
            duration: 4000,
            easing: Easing.inOut(Easing.sine),
            useNativeDriver: true,
          }),
          Animated.timing(floatAnimation, {
            toValue: 0,
            duration: 4000,
            easing: Easing.inOut(Easing.sine),
            useNativeDriver: true,
          }),
        ]),
      );
      float.start();
      return () => float.stop();
    }
  }, [floatingAnimation]);

  useEffect(() => {
    if (pulseEffect || status === 'active') {
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
  }, [pulseEffect, status]);

  useEffect(() => {
    if (status === 'challenge') {
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnimation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: false,
          }),
        ]),
      );
      glow.start();
      return () => glow.stop();
    }
  }, [status]);

  const getStatusStyles = () => {
    switch (status) {
      case 'active':
        return {
          gradient: Colors.gradients?.success || [
            Colors.success,
            Colors.vibrant?.green || Colors.success,
          ],
          borderColor: Colors.vibrant?.green || Colors.success,
          statusIcon: 'play-circle',
          statusColor: Colors.vibrant?.green || Colors.success,
        };
      case 'completed':
        return {
          gradient: Colors.gradients?.primary || [
            Colors.primary.DEFAULT,
            Colors.primary.light,
          ],
          borderColor: Colors.primary.DEFAULT,
          statusIcon: 'check-circle',
          statusColor: Colors.primary.DEFAULT,
        };
      case 'challenge':
        return {
          gradient: Colors.gradients?.sunset || [
            Colors.vibrant?.orange || Colors.secondary.DEFAULT,
            Colors.vibrant?.pink || Colors.secondary.light,
          ],
          borderColor: Colors.vibrant?.orange || Colors.secondary.DEFAULT,
          statusIcon: 'sword',
          statusColor: Colors.vibrant?.orange || Colors.secondary.DEFAULT,
        };
      default:
        return {
          gradient: Colors.gradients?.ocean || [
            Colors.vibrant?.blue || Colors.primary.DEFAULT,
            Colors.vibrant?.blueLight || Colors.primary.light,
          ],
          borderColor: Colors.gray[300],
          statusIcon: 'gamepad',
          statusColor: Colors.gray[600],
        };
    }
  };

  const getPaddingStyles = () => {
    switch (padding) {
      case 'none':
        return { padding: 0 };
      case 'small':
        return { padding: Spacing[3] };
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

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(hoverAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(hoverAnimation, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (status === 'challenge' && onChallenge) {
      onChallenge();
    } else if (onPlay) {
      onPlay();
    }
  };

  const statusStyles = getStatusStyles();
  const paddingStyles = getPaddingStyles();

  const translateY = floatAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  });

  const hoverScale = hoverAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.98],
  });

  const glowOpacity = glowAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.8],
  });

  const animatedStyle = {
    transform: [
      { translateY },
      { scale: Animated.multiply(pulseAnimation, hoverScale) },
    ],
  };

  const isInteractive = onPlay || onChallenge;

  const cardContent = (
    <View style={paddingStyles}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {icon && (
            <FontAwesome
              name={icon}
              size={24}
              color={Colors.white}
              style={styles.headerIcon}
            />
          )}
          <View>
            {title && <Text style={[styles.title, titleStyle]}>{title}</Text>}
            {gameType && <Text style={styles.gameType}>{gameType}</Text>}
          </View>
        </View>

        <View style={styles.headerRight}>
          <FontAwesome
            name={statusStyles.statusIcon}
            size={20}
            color={Colors.white}
          />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {children}

        {/* Player Info */}
        {(playerName || score !== undefined) && (
          <View style={styles.playerInfo}>
            {playerName && <Text style={styles.playerName}>{playerName}</Text>}
            {score !== undefined && (
              <Text style={styles.score}>{score.toLocaleString()} pts</Text>
            )}
          </View>
        )}
      </View>

      {/* Footer Actions */}
      {isInteractive && (
        <View style={styles.footer}>
          {status === 'challenge' && onChallenge && (
            <TouchableOpacity
              style={[styles.actionButton, styles.challengeButton]}
              onPress={onChallenge}
            >
              <FontAwesome name='sword' size={16} color={Colors.white} />
              <Text style={styles.actionButtonText}>Accept Challenge</Text>
            </TouchableOpacity>
          )}

          {status !== 'challenge' && onPlay && (
            <TouchableOpacity
              style={[styles.actionButton, styles.playButton]}
              onPress={onPlay}
            >
              <FontAwesome name='play' size={16} color={Colors.white} />
              <Text style={styles.actionButtonText}>
                {status === 'completed' ? 'View Results' : 'Play'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  const baseCardStyle = [
    styles.card,
    createPlayfulShadow(statusStyles.gradient[0], 'heavy'),
    animatedStyle,
    style,
  ];

  const CardComponent = isInteractive ? TouchableOpacity : Animated.View;

  return (
    <CardComponent
      style={baseCardStyle}
      onPress={isInteractive ? handlePress : undefined}
      activeOpacity={isInteractive ? 0.9 : 1}
      testID={testID}
      {...props}
    >
      <LinearGradient
        colors={statusStyles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {status === 'challenge' && (
          <Animated.View
            style={[
              styles.challengeGlow,
              {
                opacity: glowOpacity,
                backgroundColor: statusStyles.borderColor,
              },
            ]}
          />
        )}
        {cardContent}
      </LinearGradient>
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.bubble || BorderRadius.xl,
    overflow: 'hidden',
    marginVertical: Spacing[2],
  },
  gradient: {
    borderRadius: BorderRadius.bubble || BorderRadius.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    marginRight: Spacing[3],
  },
  headerRight: {
    opacity: 0.8,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.white,
  },
  gameType: {
    fontSize: FontSizes.sm,
    color: Colors.white,
    opacity: 0.8,
    marginTop: Spacing[0.5],
  },
  content: {
    flex: 1,
  },
  playerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing[3],
    paddingTop: Spacing[3],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  playerName: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
    color: Colors.white,
  },
  score: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.white,
  },
  footer: {
    marginTop: Spacing[4],
    gap: Spacing[2],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    borderRadius: BorderRadius.button || BorderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  challengeButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.3)',
  },
  playButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    marginLeft: Spacing[2],
  },
  challengeGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: BorderRadius.bubble || BorderRadius.xl,
  },
});

export default GameCard;
