// components/ui/Feedback/CelebrationModal.tsx
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  ColorValue,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import { ModalProps } from '../types';
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
} from '../../../constants/theme';
import {
  FlexibleViewStyle,
  FlexibleTextStyle,
  mergeStyles,
  toAnimatedStyle,
} from '../../../utils/styleTypes';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Helper type to ensure gradient colors are properly typed
type GradientColors = readonly [ColorValue, ColorValue, ...ColorValue[]];

interface CelebrationModalProps extends ModalProps {
  score?: number;
  achievement?: string;
  celebrationType?: 'victory' | 'achievement' | 'level-up' | 'high-score';
  showConfetti?: boolean;
  autoClose?: number; // Auto close after X milliseconds
}

const CelebrationModal: React.FC<CelebrationModalProps> = ({
  visible,
  onClose,
  title,
  children,
  score,
  achievement,
  celebrationType = 'victory',
  showConfetti = true,
  autoClose,
  style,
  testID,
  animated = true,
  ...props
}) => {
  const scaleAnimation = useRef(new Animated.Value(0)).current;
  const confettiAnimations = useRef(
    Array.from({ length: 20 }, () => ({
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
    })),
  ).current;
  const sparkleAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible && animated) {
      // Modal entrance animation
      Animated.spring(scaleAnimation, {
        toValue: 1,
        tension: 300,
        friction: 6,
        useNativeDriver: true,
      }).start();

      // Sparkle animation
      const sparkle = Animated.loop(
        Animated.timing(sparkleAnimation, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      sparkle.start();

      // Pulse animation
      const pulse = Animated.loop(
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
      pulse.start();

      // Confetti animation
      if (showConfetti) {
        const confettiAnimationSequence = confettiAnimations.map(
          (confetti, index) => {
            const delay = index * 100;
            const duration = 3000 + Math.random() * 2000;
            const endX = (Math.random() - 0.5) * screenWidth;
            const rotations = 3 + Math.random() * 5;

            return Animated.sequence([
              Animated.delay(delay),
              Animated.parallel([
                Animated.timing(confetti.translateY, {
                  toValue: screenHeight,
                  duration: duration,
                  easing: Easing.out(Easing.cubic),
                  useNativeDriver: true,
                }),
                Animated.timing(confetti.translateX, {
                  toValue: endX,
                  duration: duration,
                  easing: Easing.out(Easing.ease),
                  useNativeDriver: true,
                }),
                Animated.timing(confetti.rotate, {
                  toValue: rotations,
                  duration: duration,
                  easing: Easing.linear,
                  useNativeDriver: true,
                }),
                Animated.timing(confetti.opacity, {
                  toValue: 0,
                  duration: duration,
                  easing: Easing.out(Easing.ease),
                  useNativeDriver: true,
                }),
              ]),
            ]);
          },
        );

        Animated.parallel(confettiAnimationSequence).start();
      }

      // Auto close
      if (autoClose) {
        const timer = setTimeout(() => {
          handleClose();
        }, autoClose);
        return () => clearTimeout(timer);
      }

      return () => {
        sparkle.stop();
        pulse.stop();
      };
    } else if (!visible) {
      scaleAnimation.setValue(0);
      // Reset confetti
      confettiAnimations.forEach((confetti) => {
        confetti.translateY.setValue(0);
        confetti.translateX.setValue(0);
        confetti.rotate.setValue(0);
        confetti.opacity.setValue(1);
      });
    }
  }, [visible, animated, showConfetti, autoClose]);

  const getCelebrationStyles = () => {
    // Helper function to ensure gradient colors are properly typed
    const createGradient = (colors: string[]): GradientColors => {
      if (colors.length < 2) {
        return [colors[0] || '#000000', colors[0] || '#000000'];
      }
      // Ensure we have at least 2 colors and properly type them
      return [colors[0], colors[1], ...colors.slice(2)] as GradientColors;
    };

    switch (celebrationType) {
      case 'victory':
        return {
          gradient: createGradient(
            Colors.gradients?.success || [
              Colors.vibrant?.green || Colors.success,
              Colors.vibrant?.greenLight || Colors.success,
            ],
          ),
          icon: 'trophy' as const,
          iconColor: Colors.vibrant?.yellow || '#FFD93D',
          titleText: title || 'Victory!',
          confettiColors: ['#FFD93D', '#00D68F', '#FF6B6B', '#6C5CE7'],
        };
      case 'achievement':
        return {
          gradient: createGradient(
            Colors.gradients?.primary || [
              Colors.vibrant?.purple || Colors.primary.DEFAULT,
              Colors.vibrant?.purpleLight || Colors.primary.light,
            ],
          ),
          icon: 'star' as const,
          iconColor: Colors.vibrant?.yellow || '#FFD93D',
          titleText: title || 'Achievement Unlocked!',
          confettiColors: ['#A29BFE', '#FFD93D', '#FF6B9D', '#00CEC9'],
        };
      case 'level-up':
        return {
          gradient: createGradient(
            Colors.gradients?.sunset || [
              Colors.vibrant?.orange || Colors.secondary.DEFAULT,
              Colors.vibrant?.yellow || Colors.secondary.light,
            ],
          ),
          icon: 'arrow-up' as const,
          iconColor: Colors.white,
          titleText: title || 'Level Up!',
          confettiColors: ['#FF6B6B', '#FFD93D', '#FF8E8E', '#FFE66D'],
        };
      case 'high-score':
        return {
          gradient: createGradient(
            Colors.gradients?.fire || [
              Colors.vibrant?.pink || '#FF6B9D',
              Colors.vibrant?.orange || '#FF6B6B',
            ],
          ),
          icon: 'fire' as const,
          iconColor: Colors.vibrant?.yellow || '#FFD93D',
          titleText: title || 'New High Score!',
          confettiColors: ['#FF6B9D', '#FF6B6B', '#FFD93D', '#A29BFE'],
        };
      default:
        return {
          gradient: createGradient(
            Colors.gradients?.primary || [
              Colors.primary.DEFAULT,
              Colors.primary.light,
            ],
          ),
          icon: 'check-circle' as const,
          iconColor: Colors.white,
          titleText: title || 'Success!',
          confettiColors: ['#6C5CE7', '#A29BFE', '#FFD93D', '#00D68F'],
        };
    }
  };

  const handleClose = () => {
    if (animated) {
      Animated.timing(scaleAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        onClose();
      });
    } else {
      onClose();
    }
  };

  const celebrationStyles = getCelebrationStyles();

  const sparkleRotation = sparkleAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Create safe animated styles
  const modalAnimatedStyle = toAnimatedStyle([
    styles.modal,
    {
      transform: [{ scale: scaleAnimation }, { scale: pulseAnimation }],
    },
    style,
  ]);

  const sparkleContainerStyle = toAnimatedStyle([
    styles.sparkleContainer,
    {
      transform: [{ rotate: sparkleRotation }],
    },
  ]);

  const confettiElements = showConfetti
    ? confettiAnimations.map((confetti, index) => {
        const confettiRotation = confetti.rotate.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        });

        const confettiColor =
          celebrationStyles.confettiColors[
            index % celebrationStyles.confettiColors.length
          ];

        const confettiStyle = toAnimatedStyle([
          styles.confetti,
          {
            backgroundColor: confettiColor,
            transform: [
              { translateY: confetti.translateY },
              { translateX: confetti.translateX },
              { rotate: confettiRotation },
            ],
            opacity: confetti.opacity,
          },
        ]);

        return <Animated.View key={index} style={confettiStyle} />;
      })
    : null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType='none'
      statusBarTranslucent
      testID={testID}
      {...props}
    >
      <View style={styles.overlay}>
        {confettiElements}

        <Animated.View style={modalAnimatedStyle}>
          <LinearGradient
            colors={celebrationStyles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientContainer}
          >
            {/* Sparkles */}
            <Animated.View style={sparkleContainerStyle}>
              <FontAwesome
                name='star'
                size={20}
                color={Colors.vibrant?.yellow || '#FFD93D'}
                style={styles.sparkle1}
              />
              <FontAwesome
                name='star'
                size={16}
                color={Colors.white}
                style={styles.sparkle2}
              />
              <FontAwesome
                name='star'
                size={12}
                color={Colors.vibrant?.yellow || '#FFD93D'}
                style={styles.sparkle3}
              />
            </Animated.View>

            {/* Main Icon */}
            <View style={styles.iconContainer}>
              <FontAwesome
                name={celebrationStyles.icon}
                size={60}
                color={celebrationStyles.iconColor}
              />
            </View>

            {/* Title */}
            <Text style={styles.title}>{celebrationStyles.titleText}</Text>

            {/* Score */}
            {score !== undefined && (
              <Text style={styles.score}>{score.toLocaleString()} Points!</Text>
            )}

            {/* Achievement */}
            {achievement && (
              <Text style={styles.achievement}>{achievement}</Text>
            )}

            {/* Custom Content */}
            {children && <View style={styles.content}>{children}</View>}

            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeButtonText}>Continue</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: screenWidth * 0.85,
    borderRadius: BorderRadius['3xl'] || 24,
    overflow: 'hidden',
  },
  gradientContainer: {
    padding: Spacing[8],
    alignItems: 'center',
    position: 'relative',
  },
  sparkleContainer: {
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
    top: '15%',
    right: '20%',
  },
  sparkle2: {
    position: 'absolute',
    bottom: '20%',
    left: '15%',
  },
  sparkle3: {
    position: 'absolute',
    top: '25%',
    left: '25%',
  },
  iconContainer: {
    marginBottom: Spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FontSizes['3xl'] || 30,
    fontWeight: FontWeights.extrabold as any,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing[2],
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  score: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold as any,
    color: Colors.vibrant?.yellow || '#FFD93D',
    textAlign: 'center',
    marginBottom: Spacing[2],
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  achievement: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.medium as any,
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing[4],
    opacity: 0.9,
  },
  content: {
    marginVertical: Spacing[4],
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[6],
    borderRadius: BorderRadius.button || BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginTop: Spacing[4],
  },
  closeButtonText: {
    color: Colors.white,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold as any,
    textAlign: 'center',
  },
  confetti: {
    position: 'absolute',
    width: 8,
    height: 8,
    top: -10,
    left: screenWidth / 2,
  },
});

export default CelebrationModal;
