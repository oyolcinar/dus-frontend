// components/ui/SpinningWheel.tsx - Updated with dynamic items and modal-like winner overlay

import React, { useImperativeHandle, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  useColorScheme,
  Image,
  Text,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  ViewStyle,
  Platform,
  Modal,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDecay,
  Easing,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';
import Svg, { Path, G, Circle } from 'react-native-svg';
import { Colors, FontSizes, FontWeights, Spacing } from '../../constants/theme';
import PlayfulCard from './PlayfulCard';
import { ResizeMode, Video } from 'expo-av';

const { width, height } = Dimensions.get('window');

// Define props interface
export interface SpinningWheelProps {
  items?: string[];
  onSpinEnd: (item: string, index: number) => void;
  size?: number;
  spinTrigger?: React.RefObject<() => void>;
  spinDuration?: number;
  sliceColors?: string[];
  style?: ViewStyle;
  spinButtonStyle?: ViewStyle;
  pointerColor?: string;
  testID?: string;
  spinButtonText?: string;
  fontFamily?: string;
  sliceFontFamily?: string;
  winnerFontFamily?: string;
  showWinnerModal?: boolean;
  winnerModalDuration?: number;
  onWinnerModalClose?: () => void;
}

const logoWhite = require('../../assets/images/logoWhite.jpg');
const logoVideo = require('../../assets/videos/heyecanli.mp4');

const defaultItems = [
  'Seçenek 1',
  'Seçenek 2',
  'Seçenek 3',
  'Seçenek 4',
  'Seçenek 5',
  'Seçenek 6',
];

const defaultColors = [
  '#9c27b0', // purple
  '#ff9800', // orange
  '#ffeb3b', // yellow
  '#4caf50', // green
  '#2196f3', // blue
  '#e91e63', // pink
  '#ff5722', // coral
  '#00bcd4', // mint
];

const SpinningWheel: React.FC<SpinningWheelProps> = ({
  items = defaultItems,
  onSpinEnd,
  size = 300,
  spinTrigger,
  spinDuration = 4000,
  sliceColors = defaultColors,
  style,
  spinButtonStyle,
  pointerColor,
  testID,
  spinButtonText,
  fontFamily = 'System',
  sliceFontFamily = 'System',
  winnerFontFamily = 'System',
  showWinnerModal = true,
  winnerModalDuration = 3000,
  onWinnerModalClose,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Animation state for winner text
  const [winningItem, setWinningItem] = useState<string | null>(null);
  const [animatedText, setAnimatedText] = useState('');
  const [showWinnerOverlay, setShowWinnerOverlay] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const animationInterval = useRef<number | null>(null);
  const spinEndTimeout = useRef<number | null>(null);
  const modalTimeout = useRef<number | null>(null);

  const rotation = useSharedValue(0);
  const isSpinning = useSharedValue(false);

  // Ensure we have at least one item
  const safeItems = items && items.length > 0 ? items : defaultItems;
  const numberOfSlices = safeItems.length;
  const sliceAngle = 360 / numberOfSlices;
  const radius = size / 2;
  const center = { x: radius, y: radius };

  // Cleanup function
  useEffect(() => {
    console.log('SpinningWheel mounted with', numberOfSlices, 'slices');
    console.log('Items:', safeItems);

    return () => {
      console.log('SpinningWheel unmounting, cleaning up timers');
      if (animationInterval.current !== null) {
        clearInterval(animationInterval.current);
        animationInterval.current = null;
      }
      if (spinEndTimeout.current !== null) {
        clearTimeout(spinEndTimeout.current);
        spinEndTimeout.current = null;
      }
      if (modalTimeout.current !== null) {
        clearTimeout(modalTimeout.current);
        modalTimeout.current = null;
      }
    };
  }, []);

  // Function to handle the end of spinning
  const handleEnd = (finalRotation: number) => {
    // Calculate which slice is at the top (pointer)
    const normalizedRotation = ((finalRotation % 360) + 360) % 360;
    const winningAngle = (270 - normalizedRotation + 360) % 360;
    const winningIndex = Math.floor(winningAngle / sliceAngle);

    console.log('Spin ended with rotation:', normalizedRotation);
    console.log('Winning angle:', winningAngle);
    console.log('Winning index:', winningIndex);

    if (safeItems[winningIndex] !== undefined) {
      const winner = safeItems[winningIndex];
      console.log('Winner:', winner);

      setWinningItem(winner);

      // Call onSpinEnd callback first
      onSpinEnd(winner, winningIndex);

      // Show modal if enabled
      if (showWinnerModal) {
        // Clear any existing timers
        if (spinEndTimeout.current !== null) {
          clearTimeout(spinEndTimeout.current);
        }
        if (animationInterval.current !== null) {
          clearInterval(animationInterval.current);
        }
        if (modalTimeout.current !== null) {
          clearTimeout(modalTimeout.current);
        }

        // Start the modal and text animation after a delay
        spinEndTimeout.current = setTimeout(() => {
          console.log('Starting winner modal animation');
          setShowModal(true);
          setAnimatedText('');

          // Start text animation
          let i = 0;
          animationInterval.current = setInterval(() => {
            if (i <= winner.length) {
              setAnimatedText(winner.substring(0, i));
              i++;
            } else {
              // Add celebration and stop animation
              setAnimatedText(winner + ' 🎉');
              if (animationInterval.current !== null) {
                clearInterval(animationInterval.current);
                animationInterval.current = null;
              }
            }
          }, 100);

          // Auto-close modal after duration
          modalTimeout.current = setTimeout(() => {
            handleCloseModal();
          }, winnerModalDuration);
        }, 500);
      }
    }

    // Reset spinning state
    isSpinning.value = false;
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setAnimatedText('');
    setWinningItem(null);

    // Clear timers
    if (animationInterval.current !== null) {
      clearInterval(animationInterval.current);
      animationInterval.current = null;
    }
    if (modalTimeout.current !== null) {
      clearTimeout(modalTimeout.current);
      modalTimeout.current = null;
    }

    // Call optional close callback
    onWinnerModalClose?.();
  };

  // Function to trigger spinning from button press
  const buttonSpin = () => {
    console.log('Button spin pressed');
    if (isSpinning.value) return;

    // Clear any existing animations and modals
    handleCloseModal();

    isSpinning.value = true;
    const randomSpins = 5 + Math.floor(Math.random() * 5);
    const targetRotation =
      rotation.value + 360 * randomSpins + Math.random() * 360;

    rotation.value = withTiming(
      targetRotation,
      { duration: spinDuration, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(handleEnd)(rotation.value);
      },
    );
  };

  // Expose the spin function to parent via spinTrigger
  useImperativeHandle(spinTrigger, () => buttonSpin);

  // Track the last touch point and recent movements for momentum calculation
  const lastTouchPoint = useRef({ x: 0, y: 0 });
  const recentMovements = useRef<
    { time: number; angle: number; speed: number }[]
  >([]);

  // Use PanResponder for gesture handling
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => !isSpinning.value,
      onPanResponderGrant: (event) => {
        if (isSpinning.value) return;

        console.log('Pan responder granted');
        cancelAnimation(rotation);
        handleCloseModal();

        const touchX = event.nativeEvent.locationX - radius;
        const touchY = event.nativeEvent.locationY - radius;

        lastTouchPoint.current = { x: touchX, y: touchY };
        recentMovements.current = [];
      },
      onPanResponderMove: (
        event: GestureResponderEvent,
        gestureState: PanResponderGestureState,
      ) => {
        if (isSpinning.value) return;

        const touchX = event.nativeEvent.locationX - radius;
        const touchY = event.nativeEvent.locationY - radius;

        const prevAngle = Math.atan2(
          lastTouchPoint.current.y,
          lastTouchPoint.current.x,
        );
        const newAngle = Math.atan2(touchY, touchX);

        let angleDiff = newAngle - prevAngle;

        if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        const angleDiffDegrees = (angleDiff * 180) / Math.PI;
        rotation.value += angleDiffDegrees;

        lastTouchPoint.current = { x: touchX, y: touchY };

        const now = Date.now();
        recentMovements.current.push({
          time: now,
          angle: angleDiffDegrees,
          speed: Math.abs(angleDiffDegrees),
        });

        while (
          recentMovements.current.length > 0 &&
          now - recentMovements.current[0].time > 100
        ) {
          recentMovements.current.shift();
        }
      },
      onPanResponderRelease: () => {
        if (isSpinning.value) return;

        console.log('Pan responder released - calculating momentum');
        isSpinning.value = true;

        let momentum = 0;
        const now = Date.now();

        if (recentMovements.current.length > 0) {
          const recentMoves = recentMovements.current.slice(-5);
          let totalAngle = 0;
          recentMoves.forEach((move) => {
            totalAngle += move.angle;
          });

          const direction = Math.sign(totalAngle) || 1;
          const avgSpeed =
            recentMoves.reduce((sum, move) => sum + move.speed, 0) /
            recentMoves.length;

          const multiplier = 30;
          momentum = direction * avgSpeed * multiplier;

          const minMomentum = 300;
          if (Math.abs(momentum) < minMomentum && Math.abs(momentum) > 5) {
            momentum = direction * minMomentum;
          }
        }

        if (Math.abs(momentum) < 50) {
          buttonSpin();
          return;
        }

        rotation.value = withDecay(
          {
            velocity: momentum,
            deceleration: 0.998,
          },
          (finished) => {
            if (finished) {
              runOnJS(handleEnd)(rotation.value);
            }
          },
        );
      },
      onPanResponderTerminationRequest: () => !isSpinning.value,
    }),
  ).current;

  // Animated style for wheel rotation
  const animatedWheelStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  // Create wheel slices directly using SVG path commands
  const createSlicePath = (index: number) => {
    const startAngle = (index * sliceAngle * Math.PI) / 180;
    const endAngle = ((index + 1) * sliceAngle * Math.PI) / 180;

    const x1 = radius + radius * Math.cos(startAngle);
    const y1 = radius + radius * Math.sin(startAngle);
    const x2 = radius + radius * Math.cos(endAngle);
    const y2 = radius + radius * Math.sin(endAngle);

    const largeArcFlag = sliceAngle > 180 ? 1 : 0;

    return `M ${radius} ${radius} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  return (
    <>
      <View
        style={[styles.container, { width: size, height: size }, style]}
        testID={testID}
      >
        {/* Pointer at the top */}
        <View style={[styles.pointerContainer, { top: -10 }]}>
          <Svg height='40' width='40' viewBox='0 0 100 100'>
            <Path
              d='M 20 0 L 80 0 L 50 50 Z'
              fill={pointerColor || (isDark ? '#9c27b0' : '#9c27b0')}
              stroke={isDark ? '#fff' : '#fff'}
              strokeWidth='5'
            />
          </Svg>
        </View>

        {/* Wheel with slices */}
        <Animated.View
          style={[
            styles.wheelContainer,
            { width: size, height: size, borderRadius: size },
            animatedWheelStyle,
          ]}
          {...panResponder.panHandlers}
        >
          <Svg width={size} height={size}>
            {/* Draw each slice */}
            {safeItems.map((item, index) => (
              <React.Fragment key={`slice-${index}`}>
                <Path
                  d={createSlicePath(index)}
                  fill={sliceColors[index % sliceColors.length]}
                  stroke='#fff'
                  strokeWidth={2}
                />
              </React.Fragment>
            ))}

            {/* Add outer border circle */}
            <Circle
              cx={radius}
              cy={radius}
              r={radius - 1}
              fill='none'
              stroke='#ccc'
              strokeWidth={2}
            />
          </Svg>

          {/* Text labels for slices */}
          {safeItems.map((item, index) => {
            const midAngle = (index + 0.5) * sliceAngle;
            const angleRad = (midAngle * Math.PI) / 180;

            const textDistance = radius * 0.6;
            const textX = radius + textDistance * Math.cos(angleRad);
            const textY = radius + textDistance * Math.sin(angleRad);

            const displayText =
              item.length > 12 ? item.substring(0, 10) + '…' : item;

            return (
              <View
                key={`text-${index}`}
                style={[
                  styles.sliceTextContainer,
                  {
                    left: textX,
                    top: textY,
                    transform: [
                      { translateX: -40 },
                      { translateY: -12 },
                      { rotate: `${midAngle + 180}deg` },
                    ],
                  },
                ]}
              >
                <Text
                  style={[
                    styles.sliceText,
                    {
                      fontFamily: sliceFontFamily,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {displayText}
                </Text>
              </View>
            );
          })}
        </Animated.View>

        {/* Center button with logo */}
        <Pressable
          onPress={buttonSpin}
          style={[
            styles.spinButton,
            { width: size / 4, height: size / 4, borderRadius: size / 8 },
            spinButtonStyle,
          ]}
        >
          {logoWhite ? (
            // <Image
            //   source={logoWhite}
            //   style={[styles.spinButtonImage, { borderRadius: size / 8 }]}
            // />
            <PlayfulCard
              variant='gradient'
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                alignItems: 'center',
                justifyContent: 'center',
                // marginBottom: Spacing[4],
                // marginTop: Spacing[2],
                alignContent: 'center',
              }}
              contentContainerStyle={{
                alignItems: 'center',
                justifyContent: 'center',
                alignContent: 'center',
              }}
              gradient='purple'
            >
              <Video
                source={logoVideo}
                style={styles.logoVideo}
                shouldPlay={true}
                isLooping={true}
                isMuted={true}
                resizeMode={ResizeMode.COVER}
                useNativeControls={false}
                usePoster={false}
              />
            </PlayfulCard>
          ) : (
            <View style={styles.spinButtonFallback}>
              <Text
                style={[
                  styles.spinButtonText,
                  {
                    fontFamily: fontFamily,
                  },
                ]}
              >
                {spinButtonText || 'DÖNDÜR'}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Winner Modal */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType='fade'
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.winnerContainer}>
              {/* Celebration Icon */}
              <Text style={styles.celebrationIcon}>🎉</Text>

              {/* Winner Title */}
              <Text
                style={[styles.winnerTitle, { fontFamily: winnerFontFamily }]}
              >
                KAZANAN!
              </Text>

              {/* Animated Winner Text */}
              <View style={styles.winnerTextContainer}>
                <Text
                  style={[styles.winnerText, { fontFamily: winnerFontFamily }]}
                >
                  {animatedText}
                </Text>
              </View>

              {/* Close Button */}
              <Pressable style={styles.closeButton} onPress={handleCloseModal}>
                <Text
                  style={[styles.closeButtonText, { fontFamily: fontFamily }]}
                >
                  Devam Et
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  wheelContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    backgroundColor: '#eee',
    overflow: 'hidden',
    zIndex: 3,
  },
  pointerContainer: {
    position: 'absolute',
    zIndex: 20,
    alignItems: 'center',
  },
  spinButton: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    zIndex: 10,
    borderWidth: 4,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 15,
    overflow: 'hidden',
  },
  spinButtonImage: {
    width: '100%',
    height: '100%',
  },
  spinButtonFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sliceTextContainer: {
    position: 'absolute',
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  sliceText: {
    color: '#fff',
    fontSize: FontSizes.sm - 1,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
    maxWidth: width * 0.9,
    minWidth: width * 0.7,
  },
  winnerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  winnerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#9c27b0',
    marginBottom: 20,
    textAlign: 'center',
  },
  winnerTextContainer: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 15,
    marginBottom: 30,
    minHeight: 80,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  winnerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    lineHeight: 30,
  },
  closeButton: {
    backgroundColor: '#9c27b0',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  logoVideo: {
    width: 136,
    height: 136,
    borderRadius: 20,
  },
});

export default SpinningWheel;
