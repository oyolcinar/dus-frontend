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
      case 'celebration': // NOTE: No longer needs `horizontal: true`
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
          horizontal: false, // This is its own layout now
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

  // Layout-determining booleans
  const isCelebrationLayout = variant === 'celebration';
  const isHorizontalLayout = variantStyles.horizontal;

  const getFontStyles = (
    specificFamily: string | undefined,
    defaultWeight: TextStyle['fontWeight'],
  ): TextStyle => {
    const family = specificFamily || fontFamily;
    if (family) return { fontFamily: family };
    return { fontWeight: defaultWeight };
  };

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
    { transform: [{ rotate: sparkleRotation }], opacity: sparkleAnimation },
  ]);

  // --- Render Functions for DRY code ---
  const renderLabel = (isTitle = false) => (
    <Text
      style={[
        styles.label,
        {
          color: variantStyles.labelColor,
          fontSize: isTitle ? sizeStyles.labelSize : sizeStyles.scoreSize,
          marginBottom: isTitle ? Spacing[2] : 0,
        },
        labelTextStyles,
      ]}
    >
      {label}
    </Text>
  );

  const renderScore = () => (
    <Text
      style={[
        styles.score,
        { color: variantStyles.textColor, fontSize: sizeStyles.scoreSize },
        scoreTextStyles,
      ]}
    >
      {displayScore.toLocaleString()}
    </Text>
  );

  const renderMaxScore = () =>
    maxScore ? (
      <Text
        style={[
          styles.maxScore,
          { color: variantStyles.labelColor, fontSize: sizeStyles.scoreSize },
          maxScoreTextStyles,
        ]}
      >
         / {maxScore.toLocaleString()}
      </Text>
    ) : null;

  const renderProgressBar = () =>
    showProgress && maxScore ? (
      <View
        style={
          isHorizontalLayout || isCelebrationLayout
            ? styles.horizontalProgress
            : styles.progressContainer
        }
      >
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
      </View>
    ) : null;

  // --- Conditional Layout Logic ---
  let scoreContent;
  if (isCelebrationLayout) {
    scoreContent = (
      <View style={[styles.container, { padding: sizeStyles.padding }]}>
        {renderLabel(true)}
        <View style={styles.horizontalContent}>
          {renderScore()}
          {renderMaxScore()}
          {renderProgressBar()}
        </View>
      </View>
    );
  } else if (isHorizontalLayout) {
    scoreContent = (
      <View
        style={[
          styles.horizontalContent,
          { paddingVertical: Spacing[1], paddingHorizontal: Spacing[2] },
        ]}
      >
        {renderLabel()}
        {renderScore()}
        {renderMaxScore()}
        {renderProgressBar()}
      </View>
    );
  } else {
    // Default Vertical Layout
    scoreContent = (
      <View style={[styles.container, { padding: sizeStyles.padding }]}>
        {isCelebration && (
          <Animated.View style={sparkleAnimatedStyle}>
            {/* ... */}
          </Animated.View>
        )}
        {renderLabel(true)}
        {renderScore()}
        {maxScore && (
          <Text
            style={[
              styles.maxScore,
              {
                color: variantStyles.labelColor,
                fontSize: sizeStyles.labelSize * 0.8,
                marginTop: Spacing[1],
              },
              maxScoreTextStyles,
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
                {
                  marginBottom: Spacing[1],
                  borderRadius: sizeStyles.borderRadius / 4,
                },
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
              style={[
                styles.percentage,
                { color: variantStyles.labelColor },
                percentageTextStyles,
              ]}
            >
              {Math.round(percentage)}%
            </Text>
          </View>
        )}
      </View>
    );
  }

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
    // Sizing logic based on layout type
    isCelebrationLayout && { width: '100%' },
    isHorizontalLayout && { alignSelf: 'flex-start' },
    animatedStyle,
    style,
  ]);

  if (variantStyles.gradient && !variantStyles.transparent) {
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
    width: '100%',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
  },
  horizontalContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  horizontalProgress: {
    flex: 1,
    minWidth: 60,
    marginLeft: Spacing[2],
    alignSelf: 'center',
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
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  score: {
    textAlign: 'center',
    lineHeight: undefined,
  },
  maxScore: {
    textAlign: 'center',
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
  },
  progressBar: {
    height: '100%',
  },
  percentage: {
    fontSize: FontSizes.xs,
  },
});

export default ScoreDisplay;
