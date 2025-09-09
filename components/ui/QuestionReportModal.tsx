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
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

// Import your UI components
import {
  Modal,
  Button,
  PlayfulCard,
  PlayfulTitle,
  Paragraph,
  Row,
  Column,
  Badge,
} from './';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';

// Import the report service
import {
  getReportReasons,
  reportQuestionFromDuel,
  CreateReportRequest,
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

  // Load report reasons when modal opens
  useEffect(() => {
    if (isVisible) {
      loadReportReasons();
      // Reset form
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

  const getSelectedReason = () => {
    return reportReasons.find((r) => r.reason_id === selectedReasonId);
  };

  const renderQuestionPreview = () => (
    <PlayfulCard variant='glass' style={styles.questionPreview}>
      <Column>
        <Text style={styles.questionPreviewTitle}>Rapor Edilen Soru</Text>
        <Text style={styles.questionText}>{questionText}</Text>

        {questionOptions && Object.keys(questionOptions).length > 0 && (
          <View style={styles.optionsContainer}>
            {Object.entries(questionOptions).map(([key, value]) => (
              <View
                key={key}
                style={[
                  styles.optionRow,
                  key === correctAnswer && styles.correctOption,
                  key === userAnswer && !isCorrect && styles.userWrongOption,
                ]}
              >
                <Text style={styles.optionText}>
                  {key}) {value}
                </Text>
                {key === correctAnswer && (
                  <Badge
                    text='Doğru'
                    variant='success'
                    size='sm'
                    style={styles.answerBadge}
                  />
                )}
                {key === userAnswer && !isCorrect && (
                  <Badge
                    text='Seçtiğiniz'
                    variant='error'
                    size='sm'
                    style={styles.answerBadge}
                  />
                )}
              </View>
            ))}
          </View>
        )}
      </Column>
    </PlayfulCard>
  );

  const renderReasonSelection = () => (
    <PlayfulCard variant='glass' style={styles.reasonSelection}>
      <Column>
        <Text style={styles.sectionTitle}>Rapor Sebebi Seçiniz</Text>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size='large' color={Colors.vibrant.purple} />
            <Text style={styles.loadingText}>Sebepler yükleniyor...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Button
              title='Tekrar Dene'
              variant='secondary'
              size='small'
              onPress={loadReportReasons}
            />
          </View>
        ) : (
          <ScrollView
            style={styles.reasonsList}
            showsVerticalScrollIndicator={false}
          >
            {reportReasons.map((reason) => (
              <TouchableOpacity
                key={reason.reason_id}
                style={[
                  styles.reasonOption,
                  selectedReasonId === reason.reason_id &&
                    styles.selectedReason,
                ]}
                onPress={() => setSelectedReasonId(reason.reason_id)}
                activeOpacity={0.7}
              >
                <Row style={styles.reasonHeader}>
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
                  <Text style={styles.reasonText}>{reason.reason_text}</Text>
                </Row>
                {reason.description && (
                  <Text style={styles.reasonDescription}>
                    {reason.description}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </Column>
    </PlayfulCard>
  );

  const renderCommentsSection = () => (
    <PlayfulCard variant='glass' style={styles.commentsSection}>
      <Column>
        <Text style={styles.sectionTitle}>Ek Açıklama (İsteğe Bağlı)</Text>
        <TextInput
          style={styles.commentsInput}
          multiline
          numberOfLines={4}
          placeholder='Sorunla ilgili ek açıklamalarınızı yazabilirsiniz...'
          placeholderTextColor={Colors.gray[400]}
          value={additionalComments}
          onChangeText={setAdditionalComments}
          maxLength={500}
          textAlignVertical='top'
        />
        <Text style={styles.characterCount}>
          {additionalComments.length}/500 karakter
        </Text>
      </Column>
    </PlayfulCard>
  );

  return (
    <Modal visible={isVisible} onClose={onClose} style={styles.modal}>
      <PlayfulCard
        variant='gradient'
        style={styles.modalContent}
        gradient='purple'
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <Row style={styles.header}>
            <Column style={{ flex: 1 }}>
              <PlayfulTitle level={3} style={styles.title}>
                🚨 Soru Bildir
              </PlayfulTitle>
              <Paragraph style={styles.subtitle}>
                Bu soruda bir sorun mu var? Bizimle paylaşın!
              </Paragraph>
            </Column>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <FontAwesome name='times' size={20} color={Colors.white} />
            </TouchableOpacity>
          </Row>

          {/* Question Preview */}
          {renderQuestionPreview()}

          {/* Reason Selection */}
          {renderReasonSelection()}

          {/* Comments Section */}
          {renderCommentsSection()}

          {/* Action Buttons */}
          <Row style={styles.actionButtons}>
            <Button
              title='İptal'
              variant='ghost'
              onPress={onClose}
              style={styles.cancelButton}
              disabled={isSubmitting}
            />
            <Button
              title={isSubmitting ? 'Gönderiliyor...' : 'Rapor Gönder'}
              variant='primary'
              onPress={handleSubmitReport}
              style={styles.submitButton}
              disabled={!selectedReasonId || isSubmitting}
            />
          </Row>
        </ScrollView>
      </PlayfulCard>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    minHeight: height * 0.8,
  },
  modalContent: {
    width: Math.min(width * 0.95, 500),
    maxHeight: height * 0.9,
    borderRadius: BorderRadius['3xl'],
    padding: 0,
    flexShrink: 0,
    minHeight: height * 0.8,
  },
  scrollContent: {
    padding: Spacing[6],
    paddingBottom: Spacing[8],
  },
  header: {
    marginBottom: Spacing[4],
    alignItems: 'flex-start',
  },
  title: {
    color: Colors.white,
    marginBottom: Spacing[1],
  },
  subtitle: {
    color: Colors.gray[200],
    fontSize: 14,
  },
  closeButton: {
    padding: Spacing[2],
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  // Question Preview
  questionPreview: {
    marginBottom: Spacing[4],
    padding: Spacing[4],
  },
  questionPreviewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: Spacing[3],
  },
  questionText: {
    fontSize: 14,
    color: Colors.white,
    marginBottom: Spacing[3],
    lineHeight: 20,
  },
  optionsContainer: {
    gap: Spacing[2],
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing[2],
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  correctOption: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: Colors.vibrant.mint,
  },
  userWrongOption: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: Colors.vibrant.coral,
  },
  optionText: {
    fontSize: 13,
    color: Colors.white,
    flex: 1,
  },
  answerBadge: {
    marginLeft: Spacing[2],
  },

  // Reason Selection
  reasonSelection: {
    marginBottom: Spacing[4],
    padding: Spacing[4],
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: Spacing[3],
  },
  loadingContainer: {
    alignItems: 'center',
    padding: Spacing[4],
  },
  loadingText: {
    color: Colors.white,
    marginTop: Spacing[2],
  },
  errorContainer: {
    alignItems: 'center',
    padding: Spacing[4],
  },
  errorText: {
    color: Colors.vibrant.coral,
    textAlign: 'center',
    marginBottom: Spacing[3],
  },
  reasonsList: {
    maxHeight: 200,
  },
  reasonOption: {
    padding: Spacing[3],
    marginBottom: Spacing[2],
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  selectedReason: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderColor: Colors.vibrant.purple,
  },
  reasonHeader: {
    alignItems: 'center',
    marginBottom: Spacing[1],
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.gray[400],
    marginRight: Spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    backgroundColor: Colors.vibrant.purple,
    borderColor: Colors.vibrant.purple,
  },
  reasonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
    flex: 1,
  },
  reasonDescription: {
    fontSize: 12,
    color: Colors.gray[300],
    marginLeft: 32, // Radio button width + margin
    lineHeight: 16,
  },

  // Comments Section
  commentsSection: {
    marginBottom: Spacing[6],
    padding: Spacing[4],
  },
  commentsInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.lg,
    padding: Spacing[3],
    color: Colors.white,
    fontSize: 14,
    minHeight: 80,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: Spacing[2],
  },
  characterCount: {
    fontSize: 12,
    color: Colors.gray[400],
    textAlign: 'right',
  },

  // Action Buttons
  actionButtons: {
    gap: Spacing[3],
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
});

export default QuestionReportModal;
