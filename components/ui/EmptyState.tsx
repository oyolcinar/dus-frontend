// components/ui/EmptyState.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  useColorScheme,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
} from '../../constants/theme';
import Button from './Button';

export interface EmptyStateProps {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  title: string;
  message: string;
  actionButton?: {
    title: string;
    onPress: () => void;
    variant?:
      | 'primary'
      | 'secondary'
      | 'outline'
      | 'success'
      | 'error'
      | 'ghost';
    fontFamily?: string;
  };
  secondaryButton?: {
    title: string;
    onPress: () => void;
    variant?: 'outline' | 'ghost' | 'success' | 'error';
    fontFamily?: string;
  };
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  messageStyle?: StyleProp<TextStyle>;
  iconColor?: string;
  iconSize?: number;
  titleFontFamily?: string;
  messageFontFamily?: string;
  fontFamily?: string;
  buttonFontFamily?: string;
  testID?: string;
  animated?: boolean;
  colorful?: boolean;
  gradient?: any;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  actionButton,
  secondaryButton,
  style,
  titleStyle,
  messageStyle,
  iconColor,
  iconSize = 40,
  titleFontFamily,
  messageFontFamily,
  fontFamily,
  buttonFontFamily,
  testID,
  animated,
  colorful,
  gradient,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const iconColorValue =
    iconColor || (isDark ? Colors.gray[400] : Colors.gray[400]);

  const primaryButtonStyle = [
    styles.primaryButton,
    secondaryButton ? { marginBottom: Spacing[3] } : undefined,
  ];

  const titleFont = titleFontFamily || fontFamily;
  const messageFont = messageFontFamily || fontFamily;

  return (
    <View
      style={[
        styles.container,
        isDark ? styles.containerLight : styles.containerLight,
        style,
      ]}
      testID={testID}
    >
      <FontAwesome
        name={icon}
        size={iconSize}
        color={iconColorValue}
        style={{ marginBottom: Spacing[4] }}
      />

      <Text
        style={[
          styles.title,
          isDark ? styles.titleLight : styles.titleLight,
          titleFont && { fontFamily: titleFont },
          titleStyle,
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          styles.message,
          isDark ? styles.messageLight : styles.messageLight,
          messageFont && { fontFamily: messageFont },
          messageStyle,
        ]}
      >
        {message}
      </Text>

      {actionButton && (
        <Button
          title={actionButton.title}
          onPress={actionButton.onPress}
          variant={actionButton.variant || 'primary'}
          style={primaryButtonStyle}
          textStyle={
            actionButton.fontFamily || buttonFontFamily
              ? { fontFamily: actionButton.fontFamily || buttonFontFamily }
              : undefined
          }
        />
      )}

      {secondaryButton && (
        <Button
          title={secondaryButton.title}
          onPress={secondaryButton.onPress}
          variant={secondaryButton.variant || 'outline'}
          style={styles.secondaryButton}
          textStyle={
            secondaryButton.fontFamily || buttonFontFamily
              ? { fontFamily: secondaryButton.fontFamily || buttonFontFamily }
              : undefined
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing[6],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.xl,
  },
  containerLight: {
    backgroundColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  containerDark: {
    backgroundColor: Colors.gray[800],
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing[2],
  },
  titleLight: {
    color: Colors.gray[800],
  },
  titleDark: {
    color: Colors.white,
  },
  message: {
    fontSize: FontSizes.base,
    textAlign: 'center',
    marginBottom: Spacing[4],
  },
  messageLight: {
    color: Colors.gray[600],
  },
  messageDark: {
    color: Colors.gray[200],
  },
  primaryButton: {
    minWidth: 200,
  },
  secondaryButton: {
    minWidth: 200,
  },
});

export default EmptyState;
