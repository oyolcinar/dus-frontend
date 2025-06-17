// components/ui/Game/AnswerOption.tsx
import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Easing,
  View,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { AnswerOptionProps } from '../types';
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
} from '../../../constants/theme';
import { createPlayfulShadow } from '../../../utils/styleUtils';
import { toAnimatedStyle } from '../../../utils/styleTypes';

const AnswerOption: React.FC<AnswerOptionProps> = ({
  option,
  index,
  isSelected = false,
  isCorrect = false,
  isIncorrect = false,
  showResult = false,
  onPress,
  variant = 'default',
  animated = true,
  style,
  textStyle,
  testID,
}) => {
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const resultAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showResult && (isCorrect || isIncorrect)) {
      Animated.sequence([
        Animated.timing(resultAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(pulseAnimation, {
          toValue: isCorrect ? 1.05 : 0.98,
          tension: 300,
          friction: 3,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showResult, isCorrect, isIncorrect]);

  const handlePressIn = () => {
    if (!showResult && animated) {
      Animated.spring(scaleAnimation, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (!showResult && animated) {
      Animated.spring(scaleAnimation, {
        toValue: 1,
        tension: 400,
        friction: 3,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePress = () => {
    if (!showResult && onPress) {
      onPress(index);
    }
  };

  const getOptionLabel = () => {
    const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
    return labels[index] || (index + 1).toString();
  };

  const getVariantStyles = () => {
    let baseStyles = {
      backgroundColor: Colors.neutral?.offWhite || Colors.gray[100],
      borderColor: Colors.gray[300],
      textColor: Colors.gray[800],
      labelColor: Colors.gray[600],
      borderRadius: BorderRadius.button || BorderRadius.lg,
    };

    if (showResult) {
      if (isCorrect) {
        baseStyles = {
          backgroundColor: Colors.vibrant?.greenLight || Colors.success,
          borderColor: Colors.vibrant?.green || Colors.success,
          textColor: Colors.white,
          labelColor: Colors.white,
          borderRadius: baseStyles.borderRadius,
        };
      } else if (isIncorrect) {
        baseStyles = {
          backgroundColor: Colors.vibrant?.orangeLight || Colors.error,
          borderColor: Colors.vibrant?.orange || Colors.error,
          textColor: Colors.white,
          labelColor: Colors.white,
          borderRadius: baseStyles.borderRadius,
        };
      }
    } else if (isSelected) {
      baseStyles = {
        backgroundColor: Colors.vibrant?.purpleLight || Colors.primary.light,
        borderColor: Colors.vibrant?.purple || Colors.primary.DEFAULT,
        textColor: Colors.white,
        labelColor: Colors.white,
        borderRadius: baseStyles.borderRadius,
      };
    }

    switch (variant) {
      case 'playful':
        return {
          ...baseStyles,
          borderRadius: BorderRadius.bubble || BorderRadius.xl,
          shadow: createPlayfulShadow?.(baseStyles.borderColor, 'light') || {},
        };
      case 'bubble':
        return {
          ...baseStyles,
          borderRadius: BorderRadius['3xl'] || 24,
          shadow: createPlayfulShadow?.(baseStyles.borderColor, 'medium') || {},
        };
      default:
        return {
          ...baseStyles,
          shadow: createPlayfulShadow?.(baseStyles.borderColor, 'light') || {},
        };
    }
  };

  const variantStyles = getVariantStyles();

  // Separate complex animated styles into variables
  const animatedStyle = toAnimatedStyle({
    transform: [{ scale: Animated.multiply(scaleAnimation, pulseAnimation) }],
  });

  const getResultIcon = () => {
    if (!showResult) return null;

    if (isCorrect) {
      return (
        <FontAwesome
          name='check'
          size={20}
          color={variantStyles.labelColor}
          style={styles.resultIcon}
        />
      );
    } else if (isIncorrect) {
      return (
        <FontAwesome
          name='times'
          size={20}
          color={variantStyles.labelColor}
          style={styles.resultIcon}
        />
      );
    }

    return null;
  };

  // Wrap complex style arrays with toAnimatedStyle
  const containerStyle = toAnimatedStyle([
    styles.option,
    {
      backgroundColor: variantStyles.backgroundColor,
      borderColor: variantStyles.borderColor,
      borderRadius: variantStyles.borderRadius,
    },
    variantStyles.shadow,
    animatedStyle,
    style,
  ]);

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={showResult ? 1 : 0.8}
      disabled={showResult}
      testID={testID}
    >
      <Animated.View style={styles.content}>
        {/* Option Label */}
        <View
          style={[
            styles.labelContainer,
            {
              backgroundColor: variantStyles.borderColor,
            },
          ]}
        >
          <Text
            style={[
              styles.label,
              {
                color: variantStyles.labelColor,
              },
            ]}
          >
            {getOptionLabel()}
          </Text>
        </View>

        {/* Option Text */}
        <Text
          style={[
            styles.optionText,
            {
              color: variantStyles.textColor,
            },
            textStyle,
          ]}
        >
          {option}
        </Text>

        {/* Result Icon */}
        {getResultIcon()}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  option: {
    borderWidth: 2,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[4],
  },
  labelContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing[3],
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold as any,
    textAlign: 'center',
  },
  optionText: {
    flex: 1,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium as any,
    lineHeight: 22,
  },
  resultIcon: {
    marginLeft: Spacing[3],
  },
});

export default AnswerOption;
