// components/ui/QuestionReportModal.tsx - FINAL WORKING VERSION

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
  SafeAreaView,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import {
  getReportReasons,
  reportQuestionFromDuel,
} from '../../src/api/reportService';

const { width, height } = Dimensions.get('window');

interface ReportReason {
  reason_id: number;
  reason_text: string;
  description: string;
}

interface QuestionReportModalProps {
  isVisible: boolean;
  onClose: () => void;
  questionId: number;
  questionText: string;
  questionOptions: Record<string, string>;
  correctAnswer: string;
  userAnswer: string | null;
  isCorrect: boolean;
}

export const QuestionReportModal: React.FC<QuestionReportModalProps> = ({
  isVisible,
  onClose,
  questionId,
  questionText,
  questionOptions,
  correctAnswer,
  userAnswer,
  isCorrect,
}) => {
  const [reportReasons, setReportReasons] = useState<ReportReason[]>([]);
  const [selectedReasonId, setSelectedReasonId] = useState<number | null>(null);
  const [additionalComments, setAdditionalComments] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible) {
      loadReportReasons();
      setSelectedReasonId(null);
      setAdditionalComments('');
      setError(null);
    }
  }, [isVisible]);

  const loadReportReasons = async () => {
    try {
      setIsLoading(true);
      const reasons = await getReportReasons();
      setReportReasons(reasons);
    } catch (err) {
      console.error('Error loading report reasons:', err);
      setError('Rapor sebepleri yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!selectedReasonId) {
      Alert.alert('Hata', 'Lütfen bir rapor sebebi seçiniz');
      return;
    }
    try {
      setIsSubmitting(true);
      await reportQuestionFromDuel(
        questionId,
        selectedReasonId,
        additionalComments.trim() || undefined,
      );
      Alert.alert(
        'Başarılı',
        'Sorunuz başarıyla rapor edildi. Geri bildiriminiz için teşekkür ederiz!',
        [{ text: 'Tamam', onPress: onClose }],
      );
    } catch (err: any) {
      console.error('Error submitting report:', err);
      Alert.alert('Hata', err.message || 'Rapor gönderilirken hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropPress = () => onClose();
  const handleContentPress = () => {};

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType='fade'
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={handleContentPress}>
            <SafeAreaView style={styles.modalContainer}>
              {/* HEADER */}
              <View style={styles.header}>
                <View style={styles.headerContent}>
                  <Text style={styles.title}>🚨 Soru Bildir</Text>
                  <Text style={styles.subtitle}>
                    Bu soruda bir sorun mu var? Bizimle paylaşın!
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <FontAwesome name='times' size={20} color={Colors.white} />
                </TouchableOpacity>
              </View>

              {/* MAIN SCROLLABLE CONTENT */}
              <ScrollView style={styles.scrollContainer}>
                <View style={styles.scrollContent}>
                  {/* Section 1: Question Preview */}
                  <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Rapor Edilen Soru</Text>
                    <Text style={styles.questionText}>{questionText}</Text>
                    {questionOptions && (
                      <View style={styles.optionsContainer}>
                        {Object.entries(questionOptions).map(([key, value]) => (
                          <View
                            key={key}
                            style={[
                              styles.optionRow,
                              key === correctAnswer && styles.correctOption,
                              key === userAnswer &&
                                !isCorrect &&
                                styles.userWrongOption,
                            ]}
                          >
                            <Text style={styles.optionText}>
                              {key}) {value}
                            </Text>
                            {key === correctAnswer && (
                              <View style={styles.correctBadge}>
                                <Text style={styles.badgeText}>Doğru</Text>
                              </View>
                            )}
                            {key === userAnswer && !isCorrect && (
                              <View style={styles.wrongBadge}>
                                <Text style={styles.badgeText}>Seçtiğiniz</Text>
                              </View>
                            )}
                          </View>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Section 2: Reason Selection */}
                  <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>
                      Rapor Sebebi Seçiniz
                    </Text>
                    {isLoading ? (
                      <ActivityIndicator
                        size='large'
                        color={Colors.vibrant?.purple}
                      />
                    ) : error ? (
                      <Text style={styles.errorText}>{error}</Text>
                    ) : (
                      <View>
                        {reportReasons.map((reason) => (
                          <TouchableOpacity
                            key={reason.reason_id}
                            style={[
                              styles.reasonOption,
                              selectedReasonId === reason.reason_id &&
                                styles.selectedReason,
                            ]}
                            onPress={() =>
                              setSelectedReasonId(reason.reason_id)
                            }
                            activeOpacity={0.7}
                          >
                            <View style={styles.reasonHeader}>
                              <View
                                style={[
                                  styles.radioButton,
                                  selectedReasonId === reason.reason_id &&
                                    styles.radioButtonSelected,
                                ]}
                              >
                                {selectedReasonId === reason.reason_id && (
                                  <FontAwesome
                                    name='check'
                                    size={12}
                                    color={Colors.white}
                                  />
                                )}
                              </View>
                              <Text style={styles.reasonText}>
                                {reason.reason_text}
                              </Text>
                            </View>
                            {reason.description && (
                              <Text style={styles.reasonDescription}>
                                {reason.description}
                              </Text>
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Section 3: Comments */}
                  <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>
                      Ek Açıklama (İsteğe Bağlı)
                    </Text>
                    <TextInput
                      style={styles.commentsInput}
                      multiline
                      numberOfLines={4}
                      placeholder='Sorunla ilgili ek açıklamalarınızı yazabilirsiniz...'
                      placeholderTextColor={Colors.gray?.[400] || '#9ca3af'}
                      value={additionalComments}
                      onChangeText={setAdditionalComments}
                      maxLength={500}
                      textAlignVertical='top'
                    />
                    <Text style={styles.characterCount}>
                      {additionalComments.length}/500 karakter
                    </Text>
                  </View>
                </View>
              </ScrollView>

              {/* FOOTER */}
              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={onClose}
                  disabled={isSubmitting}
                >
                  <Text style={styles.cancelButtonText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (!selectedReasonId || isSubmitting) &&
                      styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmitReport}
                  disabled={!selectedReasonId || isSubmitting}
                >
                  <Text style={styles.submitButtonText}>
                    {isSubmitting ? 'Gönderiliyor...' : 'Rapor Gönder'}
                  </Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    // ✨ FIX: We DO NOT center here. We use padding to create the space.
    paddingHorizontal: Spacing[4] || 16,
    paddingVertical: Spacing[10] || 40, // Generous vertical padding
  },
  modalContainer: {
    // ✨ FIX: flex: 1 tells the modal to GROW and fill the padded area.
    flex: 1,
    width: '100%',
    maxWidth: 500,
    maxHeight: height * 0.9,
    backgroundColor: Colors.primary?.dark || '#1a1a1a',
    borderRadius: BorderRadius['3xl'] || 24,
    overflow: 'hidden',
    // ✨ FIX: This makes the header/scroll/footer layout work correctly.
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: Spacing[6] || 24,
    paddingBottom: Spacing[4] || 16,
    backgroundColor: Colors.vibrant?.purple || '#8b5cf6',
  },
  scrollContainer: {
    // ✨ FIX: flex: 1 tells the ScrollView to take ALL available space.
    flex: 1,
  },
  scrollContent: {
    padding: Spacing[4] || 16,
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing[4] || 16,
    gap: Spacing[3] || 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  // ... The rest of the styles are correct and don't need changing ...
  headerContent: { flex: 1, marginRight: Spacing[4] || 16 },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
    fontFamily: 'SecondaryFont-Bold',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.gray?.[200] || '#e5e7eb',
    fontFamily: 'SecondaryFont-Regular',
  },
  closeButton: {
    padding: Spacing[2] || 8,
    borderRadius: BorderRadius.full || 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  sectionCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.lg || 12,
    padding: Spacing[4] || 16,
    marginBottom: Spacing[4] || 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: Spacing[3] || 12,
    fontFamily: 'SecondaryFont-Bold',
  },
  questionText: {
    fontSize: 14,
    color: Colors.white,
    lineHeight: 20,
    fontFamily: 'SecondaryFont-Regular',
    marginBottom: Spacing[3] || 12,
  },
  optionsContainer: { gap: Spacing[2] || 8 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing[2] || 8,
    borderRadius: BorderRadius.md || 8,
  },
  correctOption: { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
  userWrongOption: { backgroundColor: 'rgba(239, 68, 68, 0.2)' },
  optionText: {
    fontSize: 13,
    color: Colors.white,
    flex: 1,
    fontFamily: 'SecondaryFont-Regular',
  },
  correctBadge: {
    backgroundColor: Colors.vibrant?.mint || '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  wrongBadge: {
    backgroundColor: Colors.vibrant?.coral || '#f87171',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    color: Colors.white,
    fontWeight: 'bold',
    fontFamily: 'SecondaryFont-Bold',
  },
  errorText: {
    color: Colors.vibrant?.coral || '#f87171',
    textAlign: 'center',
  },
  reasonOption: {
    padding: Spacing[3] || 12,
    marginBottom: Spacing[2] || 8,
    borderRadius: BorderRadius.lg || 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  selectedReason: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderColor: Colors.vibrant?.purple || '#8b5cf6',
  },
  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing[1] || 4,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.gray?.[400] || '#9ca3af',
    marginRight: Spacing[3] || 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    backgroundColor: Colors.vibrant?.purple || '#8b5cf6',
    borderColor: Colors.vibrant?.purple || '#8b5cf6',
  },
  reasonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
    flex: 1,
    fontFamily: 'SecondaryFont-Bold',
  },
  reasonDescription: {
    fontSize: 12,
    color: Colors.gray?.[300] || '#d1d5db',
    marginLeft: 32,
    lineHeight: 16,
    fontFamily: 'SecondaryFont-Regular',
  },
  commentsInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.lg || 12,
    padding: Spacing[3] || 12,
    color: Colors.white,
    fontSize: 14,
    minHeight: 80,
    fontFamily: 'SecondaryFont-Regular',
  },
  characterCount: {
    fontSize: 12,
    color: Colors.gray?.[400] || '#9ca3af',
    textAlign: 'right',
    fontFamily: 'SecondaryFont-Regular',
    marginTop: Spacing[1],
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing[3] || 12,
    alignItems: 'center',
    borderRadius: BorderRadius.lg || 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  cancelButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontFamily: 'SecondaryFont-Bold',
  },
  submitButton: {
    flex: 2,
    paddingVertical: Spacing[3] || 12,
    alignItems: 'center',
    borderRadius: BorderRadius.lg || 12,
    backgroundColor: Colors.vibrant?.purple || '#8b5cf6',
  },
  submitButtonDisabled: {
    backgroundColor: Colors.gray?.[500] || '#6b7280',
    opacity: 0.6,
  },
  submitButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontFamily: 'SecondaryFont-Bold',
  },
});

export default QuestionReportModal;
