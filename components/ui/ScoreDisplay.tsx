// components/ui/ScoreDisplay.tsx
import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import LinearGradient from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import { ScoreDisplayProps } from './types';
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
} from '../../constants/theme';
import { createPlayfulShadow } from '../../utils/styleUtils';

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  score,
  maxScore,
  label = 'Score',
  animated = true,
  variant = 'default',
  size = 'medium',
  showProgress = false,
  celebrationThreshold = 80,
  style,
  testID,
}) => {
  const [displayScore, setDisplayScore] = useState(0);
  const countAnimation = useRef(new Animated.Value(0)).current;
  const celebrationAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const sparkleAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      countAnimation.addListener(({ value }) => {
        setDisplayScore(Math.floor(value));
      });

      Animated.timing(countAnimation, {
        toValue: score,
        duration: 1500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();

      return () => {
        countAnimation.removeAllListeners();
      };
    } else {
      setDisplayScore(score);
    }
  }, [score, animated]);

  useEffect(() => {
    const percentage = maxScore ? (score / maxScore) * 100 : 0;
    if (percentage >= celebrationThreshold) {
      // Trigger celebration
      Animated.sequence([
        Animated.timing(celebrationAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(celebrationAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();

      // Pulse effect
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        { iterations: 3 },
      ).start();

      // Sparkle effect
      Animated.loop(
        Animated.timing(sparkleAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        { iterations: 2 },
      ).start(() => sparkleAnimation.setValue(0));
    }
  }, [score, maxScore, celebrationThreshold]);

  const getVariantStyles = () => {
    switch (variant) {
      case 'default':
        return {
          backgroundColor: Colors.white,
          textColor: Colors.gray[800],
          labelColor: Colors.gray[600],
          gradient: null,
        };
      case 'celebration':
        return {
          backgroundColor: 'transparent',
          textColor: Colors.white,
          labelColor: Colors.white,
          gradient: Colors.gradients?.candy || [
            Colors.vibrant?.pink || '#FF6B9D',
            Colors.vibrant?.orange || '#FF6B6B',
          ],
        };
      case 'gradient':
        return {
          backgroundColor: 'transparent',
          textColor: Colors.white,
          labelColor: Colors.white,
          gradient: Colors.gradients?.primary || [
            Colors.primary.DEFAULT,
            Colors.primary.light,
          ],
        };
      default:
        return {
          backgroundColor: Colors.white,
          textColor: Colors.gray[800],
          labelColor: Colors.gray[600],
          gradient: null,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          padding: Spacing[3],
          scoreSize: FontSizes.xl,
          labelSize: FontSizes.sm,
          borderRadius: BorderRadius.lg,
        };
      case 'medium':
        return {
          padding: Spacing[4],
          scoreSize: FontSizes['3xl'],
          labelSize: FontSizes.base,
          borderRadius: BorderRadius.xl,
        };
      case 'large':
        return {
          padding: Spacing[6],
          scoreSize: FontSizes['4xl'],
          labelSize: FontSizes.lg,
          borderRadius: BorderRadius['2xl'],
        };
      case 'hero':
        return {
          padding: Spacing[8],
          scoreSize: FontSizes['6xl'] || 48,
          labelSize: FontSizes.xl,
          borderRadius: BorderRadius['3xl'],
        };
      default:
        return {
          padding: Spacing[4],
          scoreSize: FontSizes['3xl'],
          labelSize: FontSizes.base,
          borderRadius: BorderRadius.xl,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();
  const percentage = maxScore ? (score / maxScore) * 100 : 0;
  const isCelebration = percentage >= celebrationThreshold;

  const celebrationScale = celebrationAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3],
  });

  const sparkleRotation = sparkleAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const animatedStyle = {
    transform: [{ scale: Animated.multiply(pulseAnimation, celebrationScale) }],
  };

  const progressWidth =
    showProgress && maxScore ? (displayScore / maxScore) * 100 : 0;

  const scoreContent = (
    <View style={[styles.container, { padding: sizeStyles.padding }]}>
      {isCelebration && (
        <Animated.View
          style={[
            styles.sparkles,
            {
              transform: [{ rotate: sparkleRotation }],
              opacity: sparkleAnimation,
            },
          ]}
        >
          <FontAwesome
            name='star'
            size={sizeStyles.scoreSize * 0.3}
            color={Colors.vibrant?.yellow || '#FFD93D'}
            style={styles.sparkle1}
          />
          <FontAwesome
            name='star'
            size={sizeStyles.scoreSize * 0.2}
            color={Colors.vibrant?.yellow || '#FFD93D'}
            style={styles.sparkle2}
          />
          <FontAwesome
            name='star'
            size={sizeStyles.scoreSize * 0.25}
            color={Colors.vibrant?.yellow || '#FFD93D'}
            style={styles.sparkle3}
          />
        </Animated.View>
      )}

      <Text
        style={[
          styles.label,
          {
            color: variantStyles.labelColor,
            fontSize: sizeStyles.labelSize,
          },
        ]}
      >
        {label}
      </Text>

      <Text
        style={[
          styles.score,
          {
            color: variantStyles.textColor,
            fontSize: sizeStyles.scoreSize,
          },
        ]}
      >
        {displayScore.toLocaleString()}
      </Text>

      {maxScore && (
        <Text
          style={[
            styles.maxScore,
            {
              color: variantStyles.labelColor,
              fontSize: sizeStyles.labelSize * 0.8,
            },
          ]}
        >
          / {maxScore.toLocaleString()}
        </Text>
      )}

      {showProgress && maxScore && (
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressTrack,
              { borderRadius: sizeStyles.borderRadius / 4 },
            ]}
          >
            <View
              style={[
                styles.progressBar,
                {
                  width: `${progressWidth}%`,
                  backgroundColor: isCelebration
                    ? Colors.vibrant?.yellow || '#FFD93D'
                    : Colors.vibrant?.green || Colors.success,
                  borderRadius: sizeStyles.borderRadius / 4,
                },
              ]}
            />
          </View>
          <Text
            style={[styles.percentage, { color: variantStyles.labelColor }]}
          >
            {Math.round(percentage)}%
          </Text>
        </View>
      )}
    </View>
  );

  const containerStyle = [
    styles.scoreDisplay,
    {
      backgroundColor: variantStyles.backgroundColor,
      borderRadius: sizeStyles.borderRadius,
    },
    createPlayfulShadow(
      variantStyles.gradient?.[0] || variantStyles.backgroundColor,
      size === 'small' ? 'light' : size === 'hero' ? 'heavy' : 'medium',
    ),
    animatedStyle,
    style,
  ];

  if (variantStyles.gradient) {
    return (
      <Animated.View style={containerStyle} testID={testID}>
        <LinearGradient
          colors={variantStyles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, { borderRadius: sizeStyles.borderRadius }]}
        >
          {scoreContent}
        </LinearGradient>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={containerStyle} testID={testID}>
      {scoreContent}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  scoreDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sparkles: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkle1: {
    position: 'absolute',
    top: '10%',
    right: '15%',
  },
  sparkle2: {
    position: 'absolute',
    bottom: '15%',
    left: '10%',
  },
  sparkle3: {
    position: 'absolute',
    top: '20%',
    left: '20%',
  },
  label: {
    fontWeight: FontWeights.medium,
    textAlign: 'center',
    marginBottom: Spacing[1],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  score: {
    fontWeight: FontWeights.extrabold,
    textAlign: 'center',
    lineHeight: undefined,
  },
  maxScore: {
    fontWeight: FontWeights.normal,
    textAlign: 'center',
    marginTop: Spacing[1],
  },
  progressContainer: {
    width: '100%',
    marginTop: Spacing[3],
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: Spacing[1],
  },
  progressBar: {
    height: '100%',
  },
  percentage: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
  },
});

export default ScoreDisplay;
