// components/ui/Game/QuestionDisplay.tsx
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { QuestionDisplayProps } from '../types';
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
} from '../../../constants/theme';
import { createPlayfulShadow } from '../../../utils/styleUtils';
import { toAnimatedStyle } from '../../../utils/styleTypes';
import AnswerOption from './AnswerOption';

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  options,
  selectedOption,
  correctOption,
  onSelectOption,
  showResult = false,
  variant = 'default',
  animated = true,
  shuffleAnimation = false,
  resultAnimation = false,
  style,
  testID,
}) => {
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const optionAnimations = useRef(
    options.map(() => new Animated.Value(0)),
  ).current;
  const resultAnimationValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      // Question slide in
      Animated.timing(slideAnimation, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }).start();

      // Staggered option animations
      const optionSequence = optionAnimations.map((anim, index) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 400,
          delay: index * 100,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      );

      Animated.parallel(optionSequence).start();
    } else {
      slideAnimation.setValue(1);
      optionAnimations.forEach((anim) => anim.setValue(1));
    }
  }, [animated, options.length]);

  useEffect(() => {
    if (shuffleAnimation && options.length > 0) {
      // Reset and re-animate options with shuffle effect
      optionAnimations.forEach((anim) => anim.setValue(0));

      const shuffledDelays = optionAnimations
        .map((_, index) => index)
        .sort(() => Math.random() - 0.5);

      const shuffleSequence = optionAnimations.map((anim, index) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 300,
          delay: shuffledDelays[index] * 80,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      );

      Animated.parallel(shuffleSequence).start();
    }
  }, [shuffleAnimation]);

  useEffect(() => {
    if (resultAnimation && showResult) {
      Animated.spring(resultAnimationValue, {
        toValue: 1,
        tension: 300,
        friction: 6,
        useNativeDriver: true,
      }).start();
    }
  }, [resultAnimation, showResult]);

  const getVariantStyles = () => {
    switch (variant) {
      case 'playful':
        return {
          backgroundColor: Colors.white,
          borderRadius: BorderRadius.bubble || BorderRadius.xl,
          shadow:
            createPlayfulShadow?.(
              Colors.vibrant?.purple || Colors.primary.DEFAULT,
              'medium',
            ) || {},
          questionColor: Colors.vibrant?.purple || Colors.primary.DEFAULT,
        };
      case 'card':
        return {
          backgroundColor: Colors.white,
          borderRadius: BorderRadius.card || BorderRadius.xl,
          shadow: createPlayfulShadow?.(Colors.gray[400], 'light') || {},
          questionColor: Colors.gray[800],
        };
      case 'bubble':
        return {
          backgroundColor: Colors.neutral?.offWhite || Colors.gray[50],
          borderRadius: BorderRadius['3xl'] || 24,
          shadow:
            createPlayfulShadow?.(
              Colors.vibrant?.blue || Colors.primary.DEFAULT,
              'heavy',
            ) || {},
          questionColor: Colors.vibrant?.blue || Colors.primary.DEFAULT,
        };
      default:
        return {
          backgroundColor: Colors.white,
          borderRadius: BorderRadius.xl,
          shadow: createPlayfulShadow?.(Colors.gray[300], 'medium') || {},
          questionColor: Colors.gray[800],
        };
    }
  };

  const variantStyles = getVariantStyles();

  const questionTranslateY = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 0],
  });

  const questionOpacity = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const resultScale = resultAnimationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  // Separate complex animated styles into variables
  const containerStyle = toAnimatedStyle([
    styles.container,
    {
      backgroundColor: variantStyles.backgroundColor,
      borderRadius: variantStyles.borderRadius,
    },
    variantStyles.shadow,
    style,
  ]);

  const questionContainerStyle = toAnimatedStyle([
    styles.questionContainer,
    {
      opacity: questionOpacity,
      transform: [{ translateY: questionTranslateY }],
    },
  ]);

  const resultContainerStyle = toAnimatedStyle([
    styles.resultContainer,
    {
      transform: [{ scale: resultScale }],
    },
  ]);

  return (
    <View style={containerStyle} testID={testID}>
      {/* Question */}
      <Animated.View style={questionContainerStyle}>
        <Text
          style={[
            styles.questionText,
            {
              color: variantStyles.questionColor,
            },
          ]}
        >
          {question}
        </Text>
      </Animated.View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {options.map((option, index) => {
          const optionOpacity = optionAnimations[index].interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          });

          const optionTranslateY = optionAnimations[index].interpolate({
            inputRange: [0, 1],
            outputRange: [30, 0],
          });

          const optionScale = optionAnimations[index].interpolate({
            inputRange: [0, 1],
            outputRange: [0.9, 1],
          });

          // Wrap complex style arrays with toAnimatedStyle
          const optionWrapperStyle = toAnimatedStyle([
            styles.optionWrapper,
            {
              opacity: optionOpacity,
              transform: [
                { translateY: optionTranslateY },
                { scale: optionScale },
              ],
            },
          ]);

          return (
            <Animated.View key={index} style={optionWrapperStyle}>
              <AnswerOption
                option={option}
                index={index}
                isSelected={selectedOption === index}
                isCorrect={showResult && correctOption === index}
                isIncorrect={
                  showResult &&
                  selectedOption === index &&
                  correctOption !== index
                }
                showResult={showResult}
                onPress={onSelectOption}
                variant={variant === 'bubble' ? 'bubble' : 'default'}
                animated={resultAnimation}
              />
            </Animated.View>
          );
        })}
      </View>

      {/* Result Feedback */}
      {showResult && resultAnimation && (
        <Animated.View style={resultContainerStyle}>
          <View
            style={[
              styles.resultBadge,
              {
                backgroundColor:
                  selectedOption === correctOption
                    ? Colors.vibrant?.green || Colors.success
                    : Colors.vibrant?.orange || Colors.error,
              },
            ]}
          >
            <Text style={styles.resultText}>
              {selectedOption === correctOption ? 'Correct!' : 'Incorrect!'}
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing[5],
    marginVertical: Spacing[3],
  },
  questionContainer: {
    marginBottom: Spacing[5],
  },
  questionText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold as any,
    textAlign: 'center',
    lineHeight: 28,
  },
  optionsContainer: {
    gap: Spacing[3],
  },
  optionWrapper: {
    // Wrapper for individual option animations
  },
  resultContainer: {
    alignItems: 'center',
    marginTop: Spacing[4],
  },
  resultBadge: {
    paddingVertical: Spacing[2],
    paddingHorizontal: Spacing[4],
    borderRadius: BorderRadius.full,
  },
  resultText: {
    color: Colors.white,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold as any,
    textAlign: 'center',
  },
});

export default QuestionDisplay;
