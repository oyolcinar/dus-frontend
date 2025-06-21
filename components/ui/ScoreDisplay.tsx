// components/ui/ScoreDisplay.tsx
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  ColorValue,
  TextStyle, // Import TextStyle
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
import { toAnimatedStyle } from '../../utils/styleTypes';

// Helper type to ensure gradient colors are properly typed
type GradientColors = readonly [ColorValue, ColorValue, ...ColorValue[]];

// Enhanced interface with font family props
interface EnhancedScoreDisplayProps extends Omit<ScoreDisplayProps, 'variant'> {
  /**
   * Display variant
   */
  variant?: 'default' | 'celebration' | 'gradient' | 'horizontal';

  /**
   * Font family for the score text
   */
  scoreFontFamily?: string;

  /**
   * Font family for the label text
   */
  labelFontFamily?: string;

  /**
   * Font family for the max score text
   */
  maxScoreFontFamily?: string;

  /**
   * Font family for the percentage text
   */
  percentageFontFamily?: string;

  /**
   * Font family for all text elements (will be overridden by specific font family props)
   */
  fontFamily?: string;
}

const ScoreDisplay: React.FC<EnhancedScoreDisplayProps> = ({
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
  scoreFontFamily,
  labelFontFamily,
  maxScoreFontFamily,
  percentageFontFamily,
  fontFamily,
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
    // Helper function to ensure gradient colors are properly typed
    const createGradient = (colors: string[]): GradientColors => {
      if (colors.length < 2) {
        return [colors[0] || '#000000', colors[0] || '#000000'];
      }
      // Ensure we have at least 2 colors and properly type them
      return [colors[0], colors[1], ...colors.slice(2)] as GradientColors;
    };

    switch (variant) {
      case 'default':
        return {
          backgroundColor: Colors.white,
          textColor: Colors.gray[800],
          labelColor: Colors.gray[600],
          gradient: null,
          transparent: false,
          horizontal: false,
        };
      case 'celebration':
        return {
          backgroundColor: 'transparent',
          textColor: Colors.white,
          labelColor: Colors.white,
          gradient: createGradient(
            Colors.gradients?.candy || [
              Colors.vibrant?.pink || '#FF6B9D',
              Colors.vibrant?.orange || '#FF6B6B',
            ],
          ),
          transparent: false,
          horizontal: false,
        };
      case 'gradient':
        return {
          backgroundColor: 'transparent',
          textColor: Colors.white,
          labelColor: Colors.white,
          gradient: createGradient(
            Colors.gradients?.primary || [
              Colors.primary.DEFAULT,
              Colors.primary.light,
            ],
          ),
          transparent: false,
          horizontal: false,
        };
      case 'horizontal':
        return {
          backgroundColor: 'transparent',
          textColor: Colors.gray[800],
          labelColor: Colors.gray[600],
          gradient: null,
          transparent: true,
          horizontal: true,
        };
      default:
        return {
          backgroundColor: Colors.white,
          textColor: Colors.gray[800],
          labelColor: Colors.gray[600],
          gradient: null,
          transparent: false,
          horizontal: false,
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
  const isHorizontal = variant === 'horizontal';

  // *** START OF FIX ***
  // Helper function to create dynamic font styles
  const getFontStyles = (
    specificFamily: string | undefined,
    defaultWeight: TextStyle['fontWeight'],
  ): TextStyle => {
    const family = specificFamily || fontFamily;
    if (family) {
      // If a font family is provided, let it control the weight. Do not add a fontWeight prop.
      return { fontFamily: family };
    }
    // If no font family, use the default weight from the theme.
    return { fontWeight: defaultWeight };
  };

  // Create style objects for each text element
  const labelTextStyles = getFontStyles(
    labelFontFamily,
    FontWeights.medium as any,
  );
  const scoreTextStyles = getFontStyles(
    scoreFontFamily,
    FontWeights.extrabold as any,
  );
  const maxScoreTextStyles = getFontStyles(
    maxScoreFontFamily,
    FontWeights.normal as any,
  );
  const percentageTextStyles = getFontStyles(
    percentageFontFamily,
    FontWeights.medium as any,
  );
  // *** END OF FIX ***

  const celebrationScale = celebrationAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3],
  });

  const sparkleRotation = sparkleAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth =
    showProgress && maxScore ? (displayScore / maxScore) * 100 : 0;

  const animatedStyle = toAnimatedStyle({
    transform: [{ scale: Animated.multiply(pulseAnimation, celebrationScale) }],
  });

  const sparkleAnimatedStyle = toAnimatedStyle([
    styles.sparkles,
    {
      transform: [{ rotate: sparkleRotation }],
      opacity: sparkleAnimation,
    },
  ]);

  const scoreContent = (
    <View
      style={[
        isHorizontal ? styles.horizontalContent : styles.container,
        { padding: isHorizontal ? Spacing[2] : sizeStyles.padding },
        isHorizontal && { width: '100%' },
      ]}
    >
      {isCelebration && !isHorizontal && (
        <Animated.View style={sparkleAnimatedStyle}>{/* ... */}</Animated.View>
      )}

      <View
        style={{
          flexDirection: isHorizontal ? 'row' : 'column',
          alignItems: isHorizontal ? 'baseline' : 'center',
          gap: isHorizontal ? Spacing[1] : 0,
        }}
      >
        <Text
          style={[
            styles.label,
            {
              color: variantStyles.labelColor,
              fontSize: isHorizontal
                ? sizeStyles.scoreSize
                : sizeStyles.labelSize,
              marginBottom: isHorizontal ? 0 : Spacing[1],
            },
            labelTextStyles, // Apply dynamic font style
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
            scoreTextStyles, // Apply dynamic font style
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
                fontSize: isHorizontal
                  ? sizeStyles.scoreSize
                  : sizeStyles.labelSize * 0.8,
                marginTop: isHorizontal ? 0 : Spacing[1],
              },
              maxScoreTextStyles, // Apply dynamic font style
            ]}
          >
            / {maxScore.toLocaleString()}
          </Text>
        )}
      </View>

      {showProgress && maxScore && (
        <View
          style={
            isHorizontal ? styles.horizontalProgress : styles.progressContainer
          }
        >
          <View
            style={[
              styles.progressTrack,
              isHorizontal && styles.horizontalProgressTrack,
              { borderRadius: sizeStyles.borderRadius / 4 },
            ]}
          >
            <View
              style={[
                styles.progressBar,
                isHorizontal && styles.horizontalProgressBar,
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
          {!isHorizontal && (
            <Text
              style={[
                styles.percentage,
                { color: variantStyles.labelColor },
                percentageTextStyles, // Apply dynamic font style
              ]}
            >
              {Math.round(percentage)}%
            </Text>
          )}
        </View>
      )}
    </View>
  );

  const containerStyle = toAnimatedStyle([
    styles.scoreDisplay,
    {
      backgroundColor: variantStyles.transparent
        ? 'transparent'
        : variantStyles.backgroundColor,
      borderRadius: variantStyles.transparent ? 0 : sizeStyles.borderRadius,
    },
    !variantStyles.transparent &&
      (createPlayfulShadow?.(
        (variantStyles.gradient?.[0] as string) ||
          variantStyles.backgroundColor,
        size === 'small' ? 'light' : size === 'hero' ? 'heavy' : 'medium',
      ) ||
        {}),
    isHorizontal && {
      alignSelf: 'stretch',
      minWidth: 'auto',
    },
    animatedStyle,
    style,
  ]);

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

// *** STYLE DECLARATIONS ARE NOW CLEANER ***
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
  horizontalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  horizontalProgress: {
    flex: 1,
    minWidth: 60,
    marginLeft: Spacing[2],
  },
  horizontalProgressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  horizontalProgressBar: {
    height: '100%',
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
  sparkle1: { position: 'absolute', top: '10%', right: '15%' },
  sparkle2: { position: 'absolute', bottom: '15%', left: '10%' },
  sparkle3: { position: 'absolute', top: '20%', left: '20%' },
  label: {
    // fontWeight removed
    textAlign: 'center',
    marginBottom: Spacing[1],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  score: {
    // fontWeight removed
    textAlign: 'center',
    lineHeight: undefined,
  },
  maxScore: {
    // fontWeight removed
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
    // fontWeight removed
    fontSize: FontSizes.xs,
  },
});

export default ScoreDisplay;
