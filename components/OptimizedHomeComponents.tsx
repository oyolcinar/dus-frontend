// components/OptimizedHomeComponents.tsx
import React, { memo, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import {
  PlayfulCard,
  EmptyState,
  ProgressBar,
  Button,
  Input,
  Checkbox,
} from './ui';
import {
  CourseWithProgress,
  StudySession,
  EditingCourseDetails,
  PerformanceData,
} from '../src/types/models';
import { Colors } from '../constants/theme';

// Props interfaces
interface CourseAnalyticsProps {
  course: CourseWithProgress;
  isDark: boolean;
  formatTime: (seconds: number) => string;
  ensureSafeNumber: (value: number | undefined, fallback?: number) => number;
  getDifficultyColor: (rating: number) => string;
  getDifficultyText: (rating: number) => string;
}

interface StudySessionCardProps {
  session: StudySession;
  isCurrentSession?: boolean;
  isDark: boolean;
  category?: any;
  formatTime: (seconds: number) => string;
  getSecondaryTextColor: (isDark: boolean) => string;
  getTertiaryTextColor: (isDark: boolean) => string;
}

interface CourseDetailsFormProps {
  course: CourseWithProgress;
  editingCourseId: number | null;
  editingDetails: EditingCourseDetails;
  setEditingDetails: (details: EditingCourseDetails) => void;
  handleEditCourseDetails: (course: CourseWithProgress) => void;
  handleSaveCourseDetails: () => Promise<void>;
  handleCancelEdit: () => void;
  updatingCourse: number | null;
  isDark: boolean;
  getDifficultyColor: (rating: number) => string;
  getDifficultyText: (rating: number) => string;
  getWhiteTextColor: (isDark: boolean) => string;
  getTertiaryTextColor: (isDark: boolean) => string;
}

interface PerformanceSummaryProps {
  performanceData: PerformanceData;
  isDark: boolean;
  preferredCourseCategory?: any;
  formatTime: (minutes: number) => string;
  ensureSafeNumber: (value: number | undefined, fallback?: number) => number;
  getTextColor: (isDark: boolean) => string;
  getSecondaryTextColor: (isDark: boolean) => string;
  getWhiteTextColor: (isDark: boolean) => string;
  getTertiaryTextColor: (isDark: boolean) => string;
}

// Optimized StyleSheet
const styles = StyleSheet.create({
  // Course Analytics Styles
  analyticsContainer: {
    marginBottom: 12,
  },
  analyticsTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  analyticsTag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  analyticsTagText: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: 'SecondaryFont-Bold',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressText: {
    fontSize: 12,
    fontFamily: 'SecondaryFont-Regular',
    color: Colors.gray[700],
    marginBottom: 8,
  },
  lastStudiedText: {
    fontSize: 12,
    fontFamily: 'SecondaryFont-Regular',
    color: Colors.gray[700],
  },

  // Study Session Card Styles
  sessionTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  sessionTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sessionTagText: {
    color: Colors.white,
    fontSize: 11,
    fontFamily: 'SecondaryFont-Bold',
  },
  sessionDateText: {
    fontSize: 12,
    fontFamily: 'SecondaryFont-Regular',
    marginBottom: 8,
  },
  sessionNotesText: {
    fontSize: 12,
    fontFamily: 'SecondaryFont-Regular',
    fontStyle: 'italic',
  },

  // Course Details Form Styles
  detailsContainer: {
    alignItems: 'center',
    padding: 16,
  },
  noDetailsText: {
    fontFamily: 'SecondaryFont-Regular',
    textAlign: 'center',
  },
  detailsMainContainer: {
    marginBottom: 16,
  },
  detailsTitle: {
    marginBottom: 16,
    fontFamily: 'SecondaryFont-Bold',
  },
  detailsDivider: {
    borderBottomWidth: 1,
    marginBottom: 8,
    width: '100%',
    borderBottomColor: Colors.white,
  },
  detailsItemsContainer: {
    flexDirection: 'column',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailsItemText: {
    fontFamily: 'SecondaryFont-Regular',
  },
  detailsItemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.white,
  },
  completedTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.vibrant.green,
  },
  completedTagText: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: 'SecondaryFont-Bold',
  },
  editButtonContainer: {
    alignSelf: 'flex-start',
  },
  editFormTitle: {
    marginBottom: 16,
    fontFamily: 'SecondaryFont-Bold',
  },
  inputContainer: {
    marginBottom: 12,
  },
  inputLabel: {
    fontFamily: 'SecondaryFont-Bold',
    color: Colors.white,
  },
  inputStyle: {
    fontFamily: 'SecondaryFont-Regular',
    color: Colors.white,
  },
  difficultyContainer: {
    marginBottom: 12,
  },
  difficultyLabel: {
    marginBottom: 8,
    fontFamily: 'SecondaryFont-Bold',
  },
  difficultyButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  difficultyButtonText: {
    color: Colors.white,
    fontFamily: 'SecondaryFont-Bold',
    fontSize: 12,
  },
  checkboxContainer: {
    marginBottom: 16,
  },
  checkboxLabel: {
    fontFamily: 'SecondaryFont-Bold',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  buttonFlex: {
    flex: 1,
  },

  // Performance Summary Styles
  performanceContainer: {
    marginTop: 16,
    shadowColor: Colors.gray[900],
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    paddingHorizontal: 16,
  },
  performanceCard: {
    marginBottom: 24,
    shadowColor: Colors.gray[900],
    shadowOffset: { width: 4, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  sectionContainer: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 12,
    fontFamily: 'SecondaryFont-Bold',
  },
  streakCard: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: Colors.gray[900],
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  streakTimeText: {
    fontSize: 28,
    fontFamily: 'PrimaryFont',
    marginBottom: 4,
    color: Colors.gray[900],
  },
  streakSubText: {
    fontSize: 12,
    fontFamily: 'SecondaryFont-Regular',
    opacity: 0.8,
    color: Colors.gray[700],
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  chartItem: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 2,
  },
  chartBar: {
    borderRadius: 4,
    minHeight: 4,
    width: '100%',
    marginBottom: 8,
  },
  chartDateText: {
    fontSize: 10,
    fontFamily: 'SecondaryFont-Regular',
    textAlign: 'center',
  },
  chartValueText: {
    fontSize: 9,
    fontFamily: 'SecondaryFont-Regular',
    textAlign: 'center',
  },
  emptyStateContainer: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 8,
  },
  topCourseCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.gray[700],
    shadowColor: Colors.gray[900],
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  topCourseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  topCourseTitle: {
    fontSize: 18,
    color: Colors.white,
    fontFamily: 'SecondaryFont-Bold',
    flex: 1,
  },
  topCourseTime: {
    fontSize: 16,
    color: Colors.white,
    fontFamily: 'PrimaryFont',
  },
  progressBarContainer: {
    marginTop: 8,
  },
  progressBarText: {
    fontSize: 12,
    color: Colors.white,
    fontFamily: 'SecondaryFont-Regular',
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.8,
  },
});

// Optimized Course Analytics Component
export const OptimizedCourseAnalytics = memo<CourseAnalyticsProps>(
  ({
    course,
    isDark,
    formatTime,
    ensureSafeNumber,
    getDifficultyColor,
    getDifficultyText,
  }) => {
    const analyticsData = useMemo(() => {
      if (!course.progress) return null;

      return {
        studyTime: formatTime(course.progress.total_study_time_seconds || 0),
        tekrarCount: course.progress.tekrar_sayisi || 0,
        difficultyRating: course.progress.difficulty_rating || 1,
        isCompleted: course.progress.is_completed,
        completionPercentage: ensureSafeNumber(
          course.progress.completion_percentage,
        ),
        lastStudiedDate: course.progress.last_studied_at
          ? new Date(course.progress.last_studied_at).toLocaleDateString(
              'tr-TR',
            )
          : null,
      };
    }, [course.progress, formatTime, ensureSafeNumber]);

    const difficultyTagStyle = useMemo(
      () => [
        styles.analyticsTag,
        {
          backgroundColor: getDifficultyColor(
            analyticsData?.difficultyRating || 1,
          ),
        },
      ],
      [analyticsData?.difficultyRating, getDifficultyColor],
    );

    if (!analyticsData) return null;

    return (
      <View style={styles.analyticsContainer}>
        <View style={styles.analyticsTagsContainer}>
          <View
            style={[
              styles.analyticsTag,
              { backgroundColor: Colors.vibrant.blue },
            ]}
          >
            <Text style={styles.analyticsTagText}>
              📚 {analyticsData.studyTime}
            </Text>
          </View>

          <View
            style={[
              styles.analyticsTag,
              { backgroundColor: Colors.vibrant.green },
            ]}
          >
            <Text style={styles.analyticsTagText}>
              🔁 {analyticsData.tekrarCount} tekrar
            </Text>
          </View>

          <View style={difficultyTagStyle}>
            <Text style={styles.analyticsTagText}>
              {getDifficultyText(analyticsData.difficultyRating)}
            </Text>
          </View>

          {analyticsData.isCompleted && (
            <View style={styles.completedTag}>
              <Text style={styles.completedTagText}>✅ Tamamlandı</Text>
            </View>
          )}
        </View>

        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            İlerleme: %{analyticsData.completionPercentage}
          </Text>
          <ProgressBar
            progress={analyticsData.completionPercentage}
            height={8}
            width='100%'
            trackColor={Colors.gray[300]}
            progressColor={Colors.vibrant.green}
            animated={false}
          />
        </View>

        {analyticsData.lastStudiedDate && (
          <Text style={styles.lastStudiedText}>
            Son çalışma: {analyticsData.lastStudiedDate}
          </Text>
        )}
      </View>
    );
  },
);

// Optimized Study Session Card Component
export const OptimizedStudySessionCard = memo<StudySessionCardProps>(
  ({
    session,
    isCurrentSession = false,
    isDark,
    category,
    formatTime,
    getSecondaryTextColor,
    getTertiaryTextColor,
  }) => {
    const sessionData = useMemo(
      () => ({
        title: isCurrentSession
          ? 'Mevcut Çalışma Seansı'
          : `Çalışma Seansı #${session.session_id}`,
        studyTime: formatTime(session.study_duration_seconds || 0),
        breakTime:
          session.break_duration_seconds && session.break_duration_seconds > 0
            ? formatTime(session.break_duration_seconds)
            : null,
        status: {
          text:
            session.session_status === 'active'
              ? '🟢 Aktif'
              : session.session_status === 'completed'
                ? '✅ Tamamlandı'
                : '⏸️ Duraklatıldı',
          color:
            session.session_status === 'active'
              ? Colors.vibrant.green
              : session.session_status === 'completed'
                ? Colors.vibrant.blue
                : Colors.gray[500],
        },
        date: new Date(session.session_date).toLocaleDateString('tr-TR'),
        time: session.start_time
          ? new Date(session.start_time).toLocaleTimeString('tr-TR', {
              hour: '2-digit',
              minute: '2-digit',
            })
          : null,
        notes: session.notes,
      }),
      [session, isCurrentSession, formatTime],
    );

    const cardStyle = useMemo(
      () => ({
        marginBottom: 12,
        shadowColor: Colors.gray[900],
        shadowOffset: { width: 2, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
      }),
      [],
    );

    const dateTextStyle = useMemo(
      () => [styles.sessionDateText, { color: getSecondaryTextColor(isDark) }],
      [isDark, getSecondaryTextColor],
    );

    const notesTextStyle = useMemo(
      () => [styles.sessionNotesText, { color: getTertiaryTextColor(isDark) }],
      [isDark, getTertiaryTextColor],
    );

    return (
      <PlayfulCard
        title={sessionData.title}
        variant='outlined'
        category={category}
        style={cardStyle}
        titleFontFamily='SecondaryFont-Bold'
      >
        <View>
          <View style={styles.sessionTagsContainer}>
            <View
              style={[
                styles.sessionTag,
                { backgroundColor: Colors.vibrant.blue },
              ]}
            >
              <Text style={styles.sessionTagText}>
                📚 {sessionData.studyTime}
              </Text>
            </View>

            {sessionData.breakTime && (
              <View
                style={[
                  styles.sessionTag,
                  { backgroundColor: Colors.vibrant.yellow },
                ]}
              >
                <Text style={styles.sessionTagText}>
                  ☕ {sessionData.breakTime}
                </Text>
              </View>
            )}

            <View
              style={[
                styles.sessionTag,
                { backgroundColor: sessionData.status.color },
              ]}
            >
              <Text style={styles.sessionTagText}>
                {sessionData.status.text}
              </Text>
            </View>
          </View>

          <Text style={dateTextStyle}>
            📅 {sessionData.date}
            {sessionData.time && ` • ${sessionData.time}`}
          </Text>

          {sessionData.notes && (
            <Text style={notesTextStyle}>💭 {sessionData.notes}</Text>
          )}
        </View>
      </PlayfulCard>
    );
  },
);

// Optimized Course Details Form Component
export const OptimizedCourseDetailsForm = memo<CourseDetailsFormProps>(
  ({
    course,
    editingCourseId,
    editingDetails,
    setEditingDetails,
    handleEditCourseDetails,
    handleSaveCourseDetails,
    handleCancelEdit,
    updatingCourse,
    isDark,
    getDifficultyColor,
    getDifficultyText,
    getWhiteTextColor,
    getTertiaryTextColor,
  }) => {
    const isEditing = editingCourseId === course.course_id;
    const isUpdating = updatingCourse === course.course_id;

    const handleDifficultyPress = useCallback(
      (rating: number) => {
        setEditingDetails({
          ...editingDetails,
          difficulty_rating: rating,
        });
      },
      [editingDetails, setEditingDetails],
    );

    const handleTextChange = useCallback(
      (field: string, value: string) => {
        setEditingDetails({
          ...editingDetails,
          [field]: value,
        });
      },
      [editingDetails, setEditingDetails],
    );

    const handleCheckboxChange = useCallback(() => {
      setEditingDetails({
        ...editingDetails,
        is_completed: !editingDetails.is_completed,
      });
    }, [editingDetails, setEditingDetails]);

    const noDetailsTextStyle = useMemo(
      () => [styles.noDetailsText, { color: getTertiaryTextColor(isDark) }],
      [isDark, getTertiaryTextColor],
    );

    const titleStyle = useMemo(
      () => [styles.detailsTitle, { color: getWhiteTextColor(isDark) }],
      [isDark, getWhiteTextColor],
    );

    const itemTextStyle = useMemo(
      () => [styles.detailsItemText, { color: getWhiteTextColor(isDark) }],
      [isDark, getWhiteTextColor],
    );

    const editFormTitleStyle = useMemo(
      () => [styles.editFormTitle, { color: getWhiteTextColor(isDark) }],
      [isDark, getWhiteTextColor],
    );

    const difficultyLabelStyle = useMemo(
      () => [styles.difficultyLabel, { color: getWhiteTextColor(isDark) }],
      [isDark, getWhiteTextColor],
    );

    if (!isEditing && !course.progress) {
      return (
        <View style={styles.detailsContainer}>
          <Text style={noDetailsTextStyle}>
            Bu ders için henüz detay bilgisi yok.
          </Text>
        </View>
      );
    }

    if (!isEditing) {
      return (
        <View>
          <View style={styles.detailsMainContainer}>
            <Text style={titleStyle}>Ders Detayları:</Text>
            <View style={styles.detailsDivider} />

            <View style={styles.detailsItemsContainer}>
              <Text style={itemTextStyle}>
                Tekrar Sayısı: {course.progress?.tekrar_sayisi || 0}
              </Text>
              <View style={styles.detailsItemDivider} />

              <Text style={[styles.detailsItemText, { color: Colors.white }]}>
                Zorluk:{' '}
                {getDifficultyText(course.progress?.difficulty_rating || 1)}
              </Text>

              <View style={styles.detailsItemDivider} />

              {course.progress?.is_completed && (
                <View style={styles.completedTag}>
                  <Text style={styles.completedTagText}>Tamamlandı</Text>
                </View>
              )}
            </View>
          </View>

          <Button
            title='Düzenle'
            onPress={() => handleEditCourseDetails(course)}
            variant='secondary'
            size='small'
            style={styles.editButtonContainer}
          />
        </View>
      );
    }

    return (
      <View>
        <Text style={editFormTitleStyle}>Ders Detaylarını Düzenle</Text>

        <Input
          label='Tekrar Sayısı:'
          value={editingDetails.tekrarSayisi?.toString() || '0'}
          onChangeText={(text) => handleTextChange('tekrarSayisi', text)}
          labelStyle={styles.inputLabel}
          inputStyle={styles.inputStyle}
          inputMode='numeric'
          containerStyle={styles.inputContainer}
        />

        <View style={styles.difficultyContainer}>
          <Text style={difficultyLabelStyle}>Zorluk Derecesi:</Text>
          <View style={styles.difficultyButtonsContainer}>
            {[1, 2, 3, 4, 5].map((rating) => (
              <TouchableOpacity
                key={rating}
                onPress={() => handleDifficultyPress(rating)}
                style={[
                  styles.difficultyButton,
                  {
                    backgroundColor:
                      editingDetails.difficulty_rating === rating
                        ? getDifficultyColor(rating)
                        : Colors.gray[600],
                  },
                ]}
              >
                <Text style={styles.difficultyButtonText}>{rating}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Input
          label='Notlar:'
          value={editingDetails.notes || ''}
          onChangeText={(text) => handleTextChange('notes', text)}
          labelStyle={styles.inputLabel}
          inputStyle={styles.inputStyle}
          multiline
          numberOfLines={3}
          containerStyle={styles.inputContainer}
        />

        <Checkbox
          checked={editingDetails.is_completed || false}
          onPress={handleCheckboxChange}
          labelStyle={styles.checkboxLabel}
          label='Ders tamamlandı'
          style={styles.checkboxContainer}
        />

        <View style={styles.buttonRow}>
          <Button
            title='Güncelle'
            onPress={handleSaveCourseDetails}
            loading={isUpdating}
            disabled={isUpdating}
            variant='secondary'
            style={styles.buttonFlex}
          />
          <Button
            title='İptal'
            onPress={handleCancelEdit}
            variant='secondary'
            disabled={isUpdating}
            style={styles.buttonFlex}
          />
        </View>
      </View>
    );
  },
);

// Optimized Performance Summary Component
export const OptimizedPerformanceSummary = memo<PerformanceSummaryProps>(
  ({
    performanceData,
    isDark,
    preferredCourseCategory,
    formatTime,
    ensureSafeNumber,
    getTextColor,
    getSecondaryTextColor,
    getWhiteTextColor,
    getTertiaryTextColor,
  }) => {
    const chartData = useMemo(() => {
      if (!performanceData.dailyProgress.length) return [];

      const maxValue = Math.max(
        ...performanceData.dailyProgress.map((d) => d.daily_study_minutes),
        1,
      );
      return performanceData.dailyProgress.map((day) => ({
        ...day,
        percentage: ensureSafeNumber(
          (day.daily_study_minutes / maxValue) * 100,
        ),
        date: new Date(day.study_date).toLocaleDateString('tr-TR', {
          weekday: 'short',
          day: 'numeric',
        }),
      }));
    }, [performanceData.dailyProgress, ensureSafeNumber]);

    const longestStreak =
      performanceData.streaksSummary?.longest_single_session_minutes || 0;
    const topCourse = performanceData.topCourses[0];

    const sectionTitleStyle = useMemo(
      () => [styles.sectionTitle, { color: getWhiteTextColor(isDark) }],
      [isDark, getWhiteTextColor],
    );

    const chartDateTextStyle = useMemo(
      () => [styles.chartDateText, { color: getTextColor(isDark) }],
      [isDark, getTextColor],
    );

    const chartValueTextStyle = useMemo(
      () => [styles.chartValueText, { color: getSecondaryTextColor(isDark) }],
      [isDark, getSecondaryTextColor],
    );

    return (
      <View style={styles.performanceContainer}>
        <PlayfulCard
          title='Genel Performans Özeti'
          style={styles.performanceCard}
          titleFontFamily='PrimaryFont'
          variant='elevated'
          category={preferredCourseCategory}
          animated={false}
          floatingAnimation={false}
        >
          <View>
            {/* Longest Streak Section */}
            <View style={styles.sectionContainer}>
              <Text style={sectionTitleStyle}>🏆 En Uzun Çalışma Seansı</Text>

              <View style={styles.streakCard}>
                <Text style={styles.streakTimeText}>
                  {formatTime(longestStreak)}
                </Text>
                <Text style={styles.streakSubText}>
                  Tek seansta en uzun çalışma süren
                </Text>
              </View>
            </View>

            {/* Chart Section */}
            {chartData.length > 0 ? (
              <View style={styles.sectionContainer}>
                <Text style={sectionTitleStyle}>📊 Son 7 Gün İlerleme</Text>

                <View style={styles.chartContainer}>
                  {chartData.map((day, index) => (
                    <View key={day.study_date} style={styles.chartItem}>
                      <View
                        style={[
                          styles.chartBar,
                          {
                            backgroundColor:
                              day.daily_study_minutes > 0
                                ? Colors.vibrant.green
                                : Colors.white,
                            height: Math.max(
                              ensureSafeNumber(day.percentage * 0.8),
                              4,
                            ),
                          },
                        ]}
                      />
                      <Text style={chartDateTextStyle}>{day.date}</Text>
                      <Text style={chartValueTextStyle}>
                        {day.daily_study_minutes > 0
                          ? `${ensureSafeNumber(day.daily_study_minutes)}dk`
                          : '0'}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <EmptyState
                icon='bar-chart'
                title='Veri bulunamadı'
                message='Son 7 günde çalışma verisi bulunmuyor.'
                style={styles.emptyStateContainer}
              />
            )}

            {/* Top Course Section */}
            <View>
              <Text style={sectionTitleStyle}>
                🎯 En Çok Zaman Harcanan Ders
              </Text>

              {topCourse ? (
                <View style={styles.topCourseCard}>
                  <View style={styles.topCourseHeader}>
                    <Text style={styles.topCourseTitle}>
                      {topCourse.course_title}
                    </Text>
                    <Text style={styles.topCourseTime}>
                      {formatTime((topCourse.total_time_hours || 0) * 60)}
                    </Text>
                  </View>

                  <ProgressBar
                    progress={85}
                    height={8}
                    width='100%'
                    trackColor={Colors.white}
                    progressColor={Colors.vibrant.green}
                    style={styles.progressBarContainer}
                    animated={false}
                  />
                  <Text style={styles.progressBarText}>
                    Toplam çalışma süresi
                  </Text>
                </View>
              ) : (
                <EmptyState
                  icon='trophy'
                  title='Veri bulunamadı'
                  message='Henüz ders bazında çalışma verisi bulunmuyor.'
                  style={styles.emptyStateContainer}
                />
              )}
            </View>
          </View>
        </PlayfulCard>
      </View>
    );
  },
);
