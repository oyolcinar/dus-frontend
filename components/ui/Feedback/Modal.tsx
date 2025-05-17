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
   * Test ID for testing
   */
  testID?: string;
}

/**
 * Modal component for displaying content in an overlay
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
                  { backgroundColor: Colors.white },
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
                      applyDarkMode(
                        isDark,
                        { color: Colors.gray[900] },
                        { color: Colors.white },
                      ),
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
                      color={isDark ? Colors.gray[400] : Colors.gray[600]}
                    />
                  </TouchableOpacity>
                </View>
              )}

              {/* Modal Content */}
              <View style={styles.content}>{children}</View>

              {/* Modal Footer */}
              {footer && <View style={styles.footer}>{footer}</View>}
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    borderRadius: BorderRadius.xl,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: '600',
    flex: 1,
  },
  closeButton: {
    padding: Spacing[2],
  },
  content: {
    padding: Spacing[4],
    flex: 1,
  },
  footer: {
    padding: Spacing[4],
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: Spacing[2],
  },
});

export default Modal;
