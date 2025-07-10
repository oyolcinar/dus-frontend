// components/ui/Feedback/Modal.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal as RNModal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  useColorScheme,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSizes,
  CommonStyles,
} from '../../../constants/theme';
import { globalStyles, applyDarkMode } from '../../../utils/styleUtils';

export interface ModalProps {
  /**
   * Controls whether the modal is visible
   */
  visible: boolean;

  /**
   * Callback when the modal is requested to be closed
   */
  onClose: () => void;

  /**
   * Optional title for the modal
   */
  title?: string;

  /**
   * Modal content
   */
  children: React.ReactNode;

  /**
   * Optional footer content
   */
  footer?: React.ReactNode;

  /**
   * Width of the modal
   */
  width?: string | number;

  /**
   * Height of the modal
   */
  height?: string | number;

  /**
   * Whether the modal should close when the backdrop is pressed
   */
  closeOnBackdropPress?: boolean;

  /**
   * Custom style for the modal container
   */
  style?: any;

  /**
   * Font family for the modal title
   */
  titleFontFamily?: string;

  /**
   * Font family for the modal content
   */
  contentFontFamily?: string;

  /**
   * Font family for the modal footer
   */
  footerFontFamily?: string;

  /**
   * Custom style for the title text
   */
  titleStyle?: any;

  /**
   * Custom style for the content container
   */
  contentStyle?: any;

  /**
   * Custom style for the footer container
   */
  footerStyle?: any;

  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * Modal component for displaying content in an overlay with customizable font families
 */
const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  footer,
  width,
  height,
  closeOnBackdropPress = true,
  style,
  titleFontFamily = 'SecondaryFont-Bold',
  contentFontFamily = 'SecondaryFont-Regular',
  footerFontFamily = 'SecondaryFont-Regular',
  titleStyle,
  contentStyle,
  footerStyle,
  testID,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const defaultWidth = Math.min(screenWidth - Spacing[8] * 2, 500);
  const defaultHeight = height || 'auto';

  const modalWidth = width || defaultWidth;

  const handleBackdropPress = () => {
    if (closeOnBackdropPress) {
      onClose();
    }
  };

  const handleContentPress = (e: any) => {
    // Prevent propagation to the backdrop
    e.stopPropagation();
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType='fade'
      onRequestClose={onClose}
      testID={testID}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={handleContentPress}>
            <View
              style={[
                styles.modalContainer,
                applyDarkMode(
                  isDark,
                  { backgroundColor: Colors.gray[800] },
                  { backgroundColor: Colors.gray[800] },
                ),
                { width: modalWidth, height: defaultHeight },
                style,
              ]}
            >
              {/* Modal Header */}
              {title && (
                <View style={styles.header}>
                  <Text
                    style={[
                      styles.title,
                      {
                        fontFamily: titleFontFamily,
                      },
                      applyDarkMode(
                        isDark,
                        { color: Colors.gray[200] },
                        { color: Colors.white },
                      ),
                      titleStyle,
                    ]}
                  >
                    {title}
                  </Text>
                  <TouchableOpacity
                    onPress={onClose}
                    style={styles.closeButton}
                  >
                    <FontAwesome
                      name='times'
                      size={20}
                      color={isDark ? Colors.gray[200] : Colors.gray[200]}
                    />
                  </TouchableOpacity>
                </View>
              )}

              {/* Modal Content */}
              <View
                style={[
                  styles.content,
                  {
                    fontFamily: contentFontFamily,
                  },
                  contentStyle,
                ]}
              >
                {children}
              </View>

              {/* Modal Footer */}
              {footer && (
                <View
                  style={[
                    styles.footer,
                    {
                      fontFamily: footerFontFamily,
                    },
                    footerStyle,
                  ]}
                >
                  {footer}
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-start', // Changed from center
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingTop: 60, // Push modal down from top
    paddingHorizontal: 20,
  },
  modalContainer: {
    borderRadius: BorderRadius.xl,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    maxHeight: '85%',
    width: '100%',
    maxWidth: 500,
    backgroundColor: Colors.vibrant.purple,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
    backgroundColor: Colors.vibrant.purple,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    flex: 1,
    color: Colors.gray[200],
  },
  closeButton: {
    padding: Spacing[2],
  },
  content: {
    backgroundColor: Colors.white,
    // Don't add padding here, let children handle it
  },
  footer: {
    padding: Spacing[4],
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.white,
  },
});

export default Modal;
