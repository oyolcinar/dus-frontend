// components/ui/SpinningWheel.tsx - With hardcoded fonts

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
import { Colors, FontSizes, FontWeights } from '../../constants/theme';

// Define props interface directly in this file for simplicity
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
}

const logoWhite = require('../../assets/images/logoWhite.jpg');

const defaultItems = [
  'Ortodonti',
  'Ağız Diş ve Çene Cerrahisi',
  'Ağız Diş ve Çene Radyolojisi',
  'Endodonti',
  'Restoratif Diş Tedavisi',
  'Pedodonti',
  'Periodontoloji',
  'Protetik Diş Tedavisi',
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
  fontFamily,
  sliceFontFamily,
  winnerFontFamily,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Animation state for winner text
  const [winningItem, setWinningItem] = useState<string | null>(null);
  const [animatedText, setAnimatedText] = useState('');
  const [showWinnerOverlay, setShowWinnerOverlay] = useState(false);
  const animationInterval = useRef<number | null>(null);
  const spinEndTimeout = useRef<number | null>(null);

  const rotation = useSharedValue(0);
  const isSpinning = useSharedValue(false);
  // Ensure we have at least one item
  const safeItems = items && items.length > 0 ? items : defaultItems;
  const numberOfSlices = safeItems.length;
  const sliceAngle = 360 / numberOfSlices;
  const radius = size / 2;
  const center = { x: radius, y: radius };

  // Log component mounting for debugging
  useEffect(() => {
    console.log('SpinningWheel mounted with', numberOfSlices, 'slices');
    console.log('Items:', safeItems);
    console.log('Font values passed:', {
      fontFamily,
      sliceFontFamily,
      winnerFontFamily,
    });

    // Return cleanup function
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
    };
  }, []);

  // Function to handle the end of spinning
  const handleEnd = (finalRotation: number) => {
    // Calculate which slice is at the top (pointer)
    const normalizedRotation = ((finalRotation % 360) + 360) % 360;

    // The pointer is at the top (90° in SVG coordinate system)
    // We need to adjust for the wheel's rotation to find which slice is under the pointer
    const winningAngle = (360 - normalizedRotation + 90) % 360;
    const winningIndex = Math.floor(winningAngle / sliceAngle);

    console.log('Spin ended with rotation:', normalizedRotation);
    console.log('Winning angle:', winningAngle);
    console.log('Winning index:', winningIndex);

    if (safeItems[winningIndex] !== undefined) {
      const winner = safeItems[winningIndex];
      console.log('Winner:', winner);

      setWinningItem(winner);

      // Call onSpinEnd callback with the winner
      onSpinEnd(winner, winningIndex);

      // Reset overlay state to ensure clean animation
      setShowWinnerOverlay(false);
      setAnimatedText('');

      // Clear any existing timers
      if (spinEndTimeout.current !== null) {
        clearTimeout(spinEndTimeout.current);
      }
      if (animationInterval.current !== null) {
        clearInterval(animationInterval.current);
      }

      // Start the text animation after a delay
      spinEndTimeout.current = setTimeout(() => {
        console.log('Starting winner text animation');
        setShowWinnerOverlay(true);

        // Start text animation
        let i = 0;
        animationInterval.current = setInterval(() => {
          if (i <= winner.length) {
            setAnimatedText(winner.substring(0, i));
            i++;
          } else if (i === winner.length + 1) {
            // Add exclamation mark
            setAnimatedText(winner + '!');
            if (animationInterval.current !== null) {
              clearInterval(animationInterval.current);
              animationInterval.current = null;
            }
          }
        }, 100);
      }, 500); // 0.5 second delay before showing text animation
    }

    // Reset spinning state
    isSpinning.value = false;
  };

  // Function to trigger spinning from button press
  const buttonSpin = () => {
    console.log('Button spin pressed');
    if (isSpinning.value) return;

    // Clear any existing animations
    setShowWinnerOverlay(false);
    setAnimatedText('');

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
      onMoveShouldSetPanResponder: () => !isSpinning.value, // Only accept gestures if not spinning
      onPanResponderGrant: (event) => {
        // Only handle if not currently spinning
        if (isSpinning.value) return;

        console.log('Pan responder granted');
        cancelAnimation(rotation);

        // Clear any existing animations
        setShowWinnerOverlay(false);
        setAnimatedText('');

        // Store initial touch position
        const touchX = event.nativeEvent.locationX - radius; // Relative to center
        const touchY = event.nativeEvent.locationY - radius; // Relative to center

        lastTouchPoint.current = { x: touchX, y: touchY };

        // Clear recent movements on new touch
        recentMovements.current = [];

        // Log initial position
        console.log('Initial touch position:', touchX, touchY);
      },
      onPanResponderMove: (
        event: GestureResponderEvent,
        gestureState: PanResponderGestureState,
      ) => {
        // Only handle if not currently spinning
        if (isSpinning.value) return;

        // Calculate touch point relative to center
        const touchX = event.nativeEvent.locationX - radius;
        const touchY = event.nativeEvent.locationY - radius;

        // Calculate the angles (in radians)
        const prevAngle = Math.atan2(
          lastTouchPoint.current.y,
          lastTouchPoint.current.x,
        );
        const newAngle = Math.atan2(touchY, touchX);

        // Calculate angle difference (ensure we handle the -π to π transition)
        let angleDiff = newAngle - prevAngle;

        // Fix angle wrapping
        if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        // Convert to degrees
        const angleDiffDegrees = (angleDiff * 180) / Math.PI;

        // Update rotation - negative to make the wheel move in the direction of the gesture
        rotation.value += angleDiffDegrees;

        // Store the current point for next calculation
        lastTouchPoint.current = { x: touchX, y: touchY };

        // Track movement for momentum calculation
        const now = Date.now();
        recentMovements.current.push({
          time: now,
          angle: angleDiffDegrees,
          speed: Math.abs(angleDiffDegrees), // Store speed for momentum calculation
        });

        // Only keep movements from the last 100ms for momentum calculation
        while (
          recentMovements.current.length > 0 &&
          now - recentMovements.current[0].time > 100
        ) {
          recentMovements.current.shift();
        }
      },
      onPanResponderRelease: () => {
        // Only handle if not currently spinning
        if (isSpinning.value) return;

        console.log('Pan responder released - calculating momentum');

        // Set to spinning state
        isSpinning.value = true;

        // Calculate momentum based on recent movements
        let momentum = 0;
        const now = Date.now();

        if (recentMovements.current.length > 0) {
          // Get the last few movements to determine direction and speed
          const recentMoves = recentMovements.current.slice(-5);

          // Calculate total angle change and direction
          let totalAngle = 0;
          recentMoves.forEach((move) => {
            totalAngle += move.angle;
          });

          // Determine direction of spin (sign of total angle)
          const direction = Math.sign(totalAngle) || 1; // Default to 1 if zero

          // Calculate average speed from recent movements
          const avgSpeed =
            recentMoves.reduce((sum, move) => sum + move.speed, 0) /
            recentMoves.length;

          // Apply multiplier for better feel
          const multiplier = 30;
          momentum = direction * avgSpeed * multiplier;

          // Ensure minimum momentum for better UX
          const minMomentum = 300;
          if (Math.abs(momentum) < minMomentum && Math.abs(momentum) > 5) {
            momentum = direction * minMomentum;
          }

          console.log(
            'Calculated momentum:',
            momentum,
            'Direction:',
            direction,
            'Avg Speed:',
            avgSpeed,
          );
        }

        // If no meaningful momentum, do a default spin
        if (Math.abs(momentum) < 50) {
          buttonSpin(); // Use the button spin logic
          return;
        }

        // Apply decay animation with momentum
        rotation.value = withDecay(
          {
            velocity: momentum,
            deceleration: 0.998, // Lower value means longer spin
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
    // Calculate start and end angles in radians
    const startAngle = (index * sliceAngle * Math.PI) / 180;
    const endAngle = ((index + 1) * sliceAngle * Math.PI) / 180;

    // Calculate points on the arc
    const x1 = radius + radius * Math.cos(startAngle);
    const y1 = radius + radius * Math.sin(startAngle);
    const x2 = radius + radius * Math.cos(endAngle);
    const y2 = radius + radius * Math.sin(endAngle);

    // Determine if the arc is large (>180 degrees)
    const largeArcFlag = sliceAngle > 180 ? 1 : 0;

    // Create SVG path: move to center, line to first point, arc to second point, close path
    return `M ${radius} ${radius} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  return (
    <View
      style={[styles.container, { width: size, height: size }, style]}
      testID={testID}
    >
      {/* Pointer at the top */}
      <View style={[styles.pointerContainer, { top: -10 }]}>
        <Svg height='40' width='40' viewBox='0 0 100 100'>
          <Path
            d='M 50 0 L 20 50 L 80 50 Z'
            fill={pointerColor || (isDark ? '#ffeb3b' : '#9c27b0')}
            stroke={isDark ? '#333' : '#fff'}
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
              {/* Draw the slice */}
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

        {/* Text labels for slices - using regular Text components instead of SVG Text */}
        {safeItems.map((item, index) => {
          const midAngle = (index + 0.5) * sliceAngle;
          const angleRad = (midAngle * Math.PI) / 180;

          // Position for the text - radially from outer edge toward center
          const textDistance = radius * 0.6; // Distance from center (60% of radius)
          const textX = radius + textDistance * Math.cos(angleRad);
          const textY = radius + textDistance * Math.sin(angleRad);

          // Shortened text if needed
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
                  // Rotate text to align with slice
                  transform: [
                    { translateX: -40 }, // Adjusted for better centering
                    { translateY: -12 }, // Adjusted for better centering
                    { rotate: `${midAngle + 180}deg` }, // Matches previous orientation
                  ],
                },
              ]}
            >
              <Text
                style={{
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: FontSizes.sm - 1,
                  textAlign: 'center',
                  textShadowColor: 'rgba(0, 0, 0, 0.75)',
                  textShadowOffset: { width: 1, height: 1 },
                  textShadowRadius: 2,
                  // HARDCODED FONT
                  fontFamily: 'PrimaryFont',
                }}
                numberOfLines={1}
              >
                {displayText}
              </Text>
            </View>
          );
        })}
      </Animated.View>

      {/* Winner text animation overlay */}
      {showWinnerOverlay && animatedText && (
        <View
          style={[
            styles.winnerTextContainer,
            { width: size * 0.8 }, // Make the overlay proportional to wheel size
          ]}
        >
          <Text
            style={{
              color: '#fff',
              fontWeight: 'bold',
              textAlign: 'center',
              fontSize: size / 10,
              // HARDCODED FONT
              fontFamily: 'PrimaryFont',
            }}
          >
            {animatedText}
          </Text>
        </View>
      )}

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
          <Image
            source={logoWhite}
            style={[styles.spinButtonImage, { borderRadius: size / 8 }]}
          />
        ) : (
          <View style={styles.spinButtonFallback}>
            <Text
              style={{
                color: '#fff',
                fontWeight: 'bold',
                // HARDCODED FONT
                fontFamily: 'SecondaryFont-Bold',
              }}
            >
              {spinButtonText || 'SPIN'}
            </Text>
          </View>
        )}
      </Pressable>
    </View>
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
    backgroundColor: '#eee', // Light background for better visibility
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
  winnerTextContainer: {
    position: 'absolute',
    top: '40%', // Center vertically
    alignSelf: 'center', // Center horizontally
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 12,
    minWidth: 150,
    maxWidth: '90%',
  },
  winnerText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 20,
  },
  sliceTextContainer: {
    position: 'absolute',
    width: 80, // Widened to accommodate more text
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5, // Place above SVG but below other elements
  },
  sliceText: {
    color: '#fff',
    fontSize: FontSizes.sm - 1,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default SpinningWheel;
