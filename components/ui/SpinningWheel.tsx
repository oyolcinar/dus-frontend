// components/ui/SpinningWheel.tsx

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
import Svg, { Path, G, Text as SvgText, Circle } from 'react-native-svg';
import { Colors, FontSizes, FontWeights } from '../../constants/theme';

// Define props interface directly in this file to add font family support
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
    const normalizedRotation = ((finalRotation % 360) + 360) % 360;
    const winningAngle = (360 - normalizedRotation + 90) % 360;
    const winningIndex = Math.floor(winningAngle / sliceAngle);

    if (safeItems[winningIndex] !== undefined) {
      const winner = safeItems[winningIndex];
      setWinningItem(winner);

      // Call onSpinEnd immediately
      onSpinEnd(winner, winningIndex);

      // But delay the text animation to let the wheel stay visible for a moment
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
      }, 1000); // 1 second delay before showing text animation
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

  // Track the last angle and recent movements for momentum calculation
  const lastAngle = useRef(0);
  const recentMovements = useRef<{ time: number; rotation: number }[]>([]);

  // Use PanResponder instead of GestureDetector for better compatibility
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

        // Store initial touch position
        const touchX = event.nativeEvent.locationX;
        const touchY = event.nativeEvent.locationY;

        // Calculate initial angle relative to center
        const initialAngle = Math.atan2(touchY - radius, touchX - radius);
        // Store this as the starting point for calculating rotation
        lastAngle.current = initialAngle;

        // Clear recent movements on new touch
        recentMovements.current = [];

        // Log initial position
        console.log(
          'Initial touch position:',
          touchX,
          touchY,
          'Initial angle:',
          initialAngle,
        );
      },
      onPanResponderMove: (
        event: GestureResponderEvent,
        gestureState: PanResponderGestureState,
      ) => {
        // Only handle if not currently spinning
        if (isSpinning.value) return;

        // Calculate center relative to the touch location
        const touchX = event.nativeEvent.locationX;
        const touchY = event.nativeEvent.locationY;

        // Calculate current angle based on touch location relative to center
        const currentAngle = Math.atan2(touchY - radius, touchX - radius);

        // Calculate the angle difference in radians
        let angleDiff = currentAngle - lastAngle.current;

        // Handle angle wrapping (when crossing from -π to π or vice versa)
        if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

        // Convert to degrees and update rotation
        const angleDiffDegrees = (angleDiff * 180) / Math.PI;

        // Apply a multiplier to increase sensitivity
        // IMPORTANT: Invert the sign to make drag direction match wheel movement
        const sensitivityMultiplier = -3.0; // Negative to invert direction
        rotation.value += angleDiffDegrees * sensitivityMultiplier;

        // Update lastAngle for the next move event
        lastAngle.current = currentAngle;

        // Track recent movements to calculate momentum
        const now = Date.now();
        recentMovements.current.push({
          time: now,
          rotation: angleDiffDegrees * sensitivityMultiplier, // Store with the inverted sign
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

        console.log('Pan responder released - starting spin');
        isSpinning.value = true; // Set to spinning immediately on release

        // Calculate momentum based on recent movements
        let momentum = 0;
        const now = Date.now();

        if (recentMovements.current.length > 0) {
          // Calculate average angular velocity from recent movements
          let totalRotation = 0;
          let totalTime = now - recentMovements.current[0].time;

          recentMovements.current.forEach((movement) => {
            totalRotation += movement.rotation;
          });

          // Determine direction of spin (positive = clockwise, negative = counterclockwise)
          // This ensures we maintain the direction of the user's gesture
          const direction = Math.sign(totalRotation) || 1; // Default to 1 if zero

          // Convert to angular velocity (degrees per millisecond)
          // Apply an additional momentum multiplier to make it spin longer
          const momentumMultiplier = 50.0; // Increase for longer spin

          // Calculate absolute momentum, then apply direction
          const absMomentum =
            totalTime > 0
              ? Math.abs(totalRotation / totalTime) * momentumMultiplier
              : 0;

          momentum = direction * absMomentum;

          // Ensure a minimum momentum for better UX
          const minMomentum = 300; // Minimum velocity
          if (Math.abs(momentum) < minMomentum && Math.abs(momentum) > 5) {
            momentum = direction * minMomentum;
          }

          console.log('Direction:', direction, 'Momentum:', momentum);
        } else {
          // If there's no movement data, do a default spin like the button
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
          return;
        }

        console.log('Calculated momentum:', momentum);

        // Apply decay animation with momentum
        rotation.value = withDecay(
          {
            velocity: momentum,
            deceleration: 0.9985, // Lower value means longer spin (0.9985 - 0.9995)
          },
          (finished) => {
            if (finished) {
              runOnJS(handleEnd)(rotation.value);
            }
          },
        );
      },
      // Reject all gestures while spinning
      onPanResponderTerminationRequest: () => !isSpinning.value,
      onPanResponderReject: () => {
        console.log('Pan gesture rejected - wheel is spinning');
      },
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

              {/* Add text along a circular path */}
              <G>
                {/* Calculate the angle for the middle of this slice in degrees */}
                {(() => {
                  const midAngle = (index + 0.5) * sliceAngle;
                  const angleRad = (midAngle * Math.PI) / 180;

                  // Position for the text - radially from outer edge toward center
                  const textX = radius + radius * 0.6 * Math.cos(angleRad);
                  const textY = radius + radius * 0.6 * Math.sin(angleRad);

                  // Set the rotation to make text go from border to center
                  // Add 180 degrees to point from outer edge toward center
                  const textRotation = midAngle + 180;

                  // Shortened text if needed
                  const displayText =
                    item.length > 12 ? item.substring(0, 10) + '…' : item;

                  return (
                    <SvgText
                      x={textX}
                      y={textY}
                      fill='#fff'
                      fontSize={FontSizes.sm - 1}
                      fontWeight='bold'
                      textAnchor='middle'
                      alignmentBaseline='middle'
                      rotation={textRotation}
                      origin={`${textX}, ${textY}`}
                      fontFamily={sliceFontFamily || fontFamily}
                    >
                      {displayText}
                    </SvgText>
                  );
                })()}
              </G>
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
            style={[
              styles.winnerText,
              {
                fontFamily: winnerFontFamily || fontFamily,
                fontSize: size / 10,
              },
            ]}
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
            <Text style={[styles.spinButtonText, { fontFamily }]}>
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
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 20,
  },
});

export default SpinningWheel;
