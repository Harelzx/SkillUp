import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useInfiniteQuery, useQueryClient, useMutation, type InfiniteData } from '@tanstack/react-query';
import {
  FileText,
  Clock,
  Calendar,
  X,
  Eye,
  Edit,
} from 'lucide-react-native';
import { Typography } from '@/ui/Typography';
import { Card } from '@/ui/Card';
import { colors, spacing } from '@/theme/tokens';
import { createStyle } from '@/theme/utils';
import { useRTL } from '@/context/RTLContext';
import { useAuth } from '@/features/auth/auth-context';
import { useLocalSearchParams } from 'expo-router';
import {
  getTeacherCompletedLessons,
  upsertLessonNote,
  type CompletedLesson,
  type LessonTrackingFilters,
  type LessonTrackingResponse,
} from '@/services/api';
import { Alert } from 'react-native';

// ============================================
// Types
// ============================================

interface LessonTrackingCardProps {
  lesson: CompletedLesson;
  onNotePress: (lesson: CompletedLesson) => void;
  onDetailsPress: (lesson: CompletedLesson) => void;
}

interface NoteModalProps {
  visible: boolean;
  lesson: CompletedLesson | null;
  onClose: () => void;
  onSave: (note: string) => void;
  isLoading: boolean;
}

interface LessonDetailsModalProps {
  visible: boolean;
  lesson: CompletedLesson | null;
  onClose: () => void;
  onEditNote: () => void;
}

// ============================================
// Lesson Tracking Card Component
// ============================================

const LessonTrackingCard: React.FC<LessonTrackingCardProps> = ({
  lesson,
  onNotePress,
  onDetailsPress,
}) => {
  const { t } = useTranslation();
  const { isRTL, getTextAlign, getFlexDirection } = useRTL();
  const [showFullNote, setShowFullNote] = useState(false);

  const studentName = lesson.student
    ? `${lesson.student.first_name || ''} ${lesson.student.last_name || ''}`.trim() || 'תלמיד/ה'
    : 'תלמיד/ה';

  const subjectName = lesson.subject?.name_he || lesson.subject?.name || 'שיעור';

  const startDate = new Date(lesson.start_at);
  const endDate = new Date(lesson.end_at);
  const dateStr = startDate.toLocaleDateString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const startTime = startDate.toLocaleTimeString('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const endTime = endDate.toLocaleTimeString('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));

  const noteSummary = lesson.tracking?.note_summary || null;
  const hasNote = !!lesson.tracking?.note;
  const shouldTruncate = noteSummary && noteSummary.length > 120;

  const styles = createStyle({
    card: {
      position: 'relative', // Required for the status badge to anchor against card edges
      backgroundColor: colors.white,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.gray[200],
      padding: spacing[4],
      marginBottom: spacing[3],
      marginHorizontal: spacing[4],
    },
    headerRow: {
      flexDirection: getFlexDirection('row'), // Mirror automatically so student info stays nearest reading edge
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing[3],
    },
    studentInfo: {
      flex: 1,
    },
    studentName: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.gray[900],
      marginBottom: spacing[1],
      textAlign: getTextAlign('right'),
    },
    subjectRow: {
      flexDirection: getFlexDirection('row-reverse'),
      alignItems: 'center',
      gap: spacing[2],
    },
    subjectText: {
      textAlign: getTextAlign('right'),
    },
    statusBadge: {
      position: 'absolute',
      top: spacing[3],
      left: spacing[3], // Pin badge to physical left so it's consistent in both layouts
      backgroundColor: colors.success[100],
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[1],
      borderRadius: 8,
    },
    infoRow: {
      flexDirection: getFlexDirection('row-reverse'),
      alignItems: 'center',
      marginBottom: spacing[2],
      gap: spacing[2],
    },
    infoText: {
      fontSize: 14,
      color: colors.gray[600],
      textAlign: getTextAlign('right'),
    },
    noteSection: {
      marginTop: spacing[3],
      paddingTop: spacing[3],
      borderTopWidth: 1,
      borderTopColor: colors.gray[200],
      alignItems: isRTL ? 'flex-start' : 'flex-end', // Ensure note labels hug the text edge in RTL
    },
    noteText: {
      fontSize: 14,
      color: colors.gray[700],
      lineHeight: 20,
      marginBottom: spacing[2],
      textAlign: getTextAlign('right'),
    },
    noteHeading: {
      marginBottom: spacing[1],
      textAlign: getTextAlign('right'),
    },
    showMoreButton: {
      alignSelf: isRTL ? 'flex-start' : 'flex-end',
      marginTop: spacing[1],
    },
    actionsRow: {
      flexDirection: getFlexDirection('row-reverse'),
      gap: spacing[2],
      marginTop: spacing[3],
    },
    actionButton: {
      flex: 1,
      flexDirection: getFlexDirection('row-reverse'),
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing[2],
      paddingHorizontal: spacing[3],
      borderRadius: 8,
      gap: spacing[2],
    },
    noteButton: {
      backgroundColor: colors.primary[50],
      borderWidth: 1,
      borderColor: colors.primary[200],
    },
    detailsButton: {
      backgroundColor: colors.gray[50],
      borderWidth: 1,
      borderColor: colors.gray[200],
    },
  });

  return (
    <Card variant="elevated" style={styles.card}>
      <View style={styles.statusBadge}>
        <Typography variant="caption" style={{ color: colors.success[700], fontWeight: '600' }}>
          {t('teacher.tracking.completed')}
        </Typography>
      </View>
      <View style={styles.headerRow}>
        <View style={styles.studentInfo}>
          <Typography variant="h6" weight="bold" style={styles.studentName}>
            {studentName}
          </Typography>
          <View style={styles.subjectRow}>
            <Typography variant="body2" color="textSecondary" style={styles.subjectText}>
              {subjectName}
            </Typography>
          </View>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Calendar size={16} color={colors.gray[500]} />
        <Typography variant="body2" style={styles.infoText}>
          {dateStr}
        </Typography>
      </View>

      <View style={styles.infoRow}>
        <Clock size={16} color={colors.gray[500]} />
        <Typography variant="body2" style={styles.infoText}>
          {startTime} - {endTime}
        </Typography>
        <Typography variant="body2" style={styles.infoText}>
          ({durationMinutes} {t('teacher.tracking.minutes')})
        </Typography>
      </View>

      {hasNote && noteSummary && (
        <View style={styles.noteSection}>
          <Typography variant="body2" weight="semibold" style={styles.noteHeading}>
            {t('teacher.tracking.note')}:
          </Typography>
          <Typography variant="body2" style={styles.noteText}>
            {showFullNote && lesson.tracking?.note
              ? lesson.tracking.note
              : noteSummary}
          </Typography>
          {shouldTruncate && (
            <TouchableOpacity
              onPress={() => setShowFullNote(!showFullNote)}
              style={styles.showMoreButton}
            >
              <Typography variant="caption" color="primary" style={{ textAlign: getTextAlign('right') }}>
                {showFullNote ? t('teacher.tracking.showLess') : t('teacher.tracking.showAll')}
              </Typography>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.actionsRow}>
        <TouchableOpacity
          onPress={() => onNotePress(lesson)}
          style={[styles.actionButton, styles.noteButton]}
          accessibilityLabel={t('teacher.tracking.note')}
        >
          <Edit size={16} color={colors.primary[600]} />
          <Typography variant="body2" weight="semibold" style={{ color: colors.primary[600] }}>
            {t('teacher.tracking.note')}
          </Typography>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onDetailsPress(lesson)}
          style={[styles.actionButton, styles.detailsButton]}
          accessibilityLabel={t('teacher.tracking.viewDetails')}
        >
          <Eye size={16} color={colors.gray[700]} />
          <Typography variant="body2" weight="semibold" style={{ color: colors.gray[700] }}>
            {t('teacher.tracking.viewDetails')}
          </Typography>
        </TouchableOpacity>
      </View>
    </Card>
  );
};

// ============================================
// Note Modal Component
// ============================================

const NoteModal: React.FC<NoteModalProps> = ({
  visible,
  lesson,
  onClose,
  onSave,
  isLoading,
}) => {
  const { t } = useTranslation();
  const { isRTL, getTextAlign, getFlexDirection } = useRTL();
  const [note, setNote] = useState('');
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();

  const modalWidth = useMemo(() => {
    const horizontalMargin = spacing[6]; // leave breathing room on both sides
    const candidate = Math.max(windowWidth - horizontalMargin, 280);
    const capped = Math.min(candidate, 540);
    const comfortable = Math.max(capped, Math.min(windowWidth - spacing[8], 320));
    return Math.min(comfortable, windowWidth - horizontalMargin / 2);
  }, [windowWidth]);

  React.useEffect(() => {
    if (visible && lesson) {
      setNote(lesson.tracking?.note || '');
    } else {
      setNote('');
    }
  }, [visible, lesson]);

  const handleTextChange = (text: string) => {
    // Count words (split by whitespace and filter empty strings)
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    
    // Limit to 50 words
    if (words.length > 50) {
      // Take only first 50 words
      const limitedText = words.slice(0, 50).join(' ');
      setNote(limitedText);
    } else {
      setNote(text);
    }
  };

  const handleSave = () => {
    onSave(note);
  };

  const studentName = lesson?.student
    ? `${lesson.student.first_name || ''} ${lesson.student.last_name || ''}`.trim() || 'תלמיד/ה'
    : 'תלמיד/ה';

  const dateStr = lesson
    ? new Date(lesson.start_at).toLocaleDateString('he-IL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '';

  const styles = createStyle({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center', // keep modal vertically centered for consistent UX across screens
      alignItems: 'center',
      paddingHorizontal: spacing[4], // add breathing room so the modal never touches screen edges
    },
    modalContent: {
      backgroundColor: colors.white,
      borderRadius: 24,
      paddingTop: spacing[4],
      paddingBottom: spacing[4] + insets.bottom, // honor safe area while keeping roomy padding
      paddingHorizontal: spacing[4],
      maxHeight: '85%',
      flexDirection: 'column',
    },
    modalHeader: {
      flexDirection: getFlexDirection('row-reverse'),
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing[4],
      marginBottom: spacing[4],
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.gray[900],
      textAlign: getTextAlign('right'),
    },
    closeButton: {
      padding: spacing[2],
    },
    modalBody: {
      paddingHorizontal: spacing[4],
      overflow: 'hidden',
    },
    textInput: {
      height: 96, // 4 lines: fontSize 16 * lineHeight 1.5 * 4 = 96px
      borderWidth: 1,
      borderColor: colors.gray[300],
      borderRadius: 12,
      padding: spacing[3],
      fontSize: 16,
      lineHeight: 24, // fontSize 16 * 1.5
      color: colors.gray[900],
      textAlignVertical: 'top',
      textAlign: isRTL ? 'right' : 'left',
      backgroundColor: colors.white,
    },
    modalActions: {
      flexDirection: getFlexDirection('row-reverse'),
      gap: spacing[3],
      marginTop: spacing[4],
      paddingHorizontal: spacing[4],
      flexShrink: 0,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: spacing[2],
      borderRadius: 12,
      backgroundColor: colors.gray[100],
      alignItems: 'center',
    },
    saveButton: {
      flex: 1,
      paddingVertical: spacing[2],
      borderRadius: 12,
      backgroundColor: colors.primary[600],
      alignItems: 'center',
    },
    saveButtonDisabled: {
      opacity: 0.5,
    },
  });

  if (!lesson) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          style={styles.modalOverlay}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalContent, { width: modalWidth }]}>
              <View style={styles.modalHeader}>
                <Typography variant="h6" weight="bold" style={styles.modalTitle}>
                  הערה לשיעור עם {studentName}
                </Typography>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <X size={24} color={colors.gray[600]} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <TextInput
                  value={note}
                  onChangeText={handleTextChange}
                  placeholder={t('teacher.tracking.notePlaceholder')}
                  placeholderTextColor={colors.gray[400]}
                  style={styles.textInput}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                  autoFocus
                  textAlign={isRTL ? 'right' : 'left'}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.cancelButton}
                  disabled={isLoading}
                >
                  <Typography variant="body2" weight="semibold" style={{ color: colors.gray[700] }}>
                    {t('teacher.tracking.cancel')}
                  </Typography>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSave}
                  style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Typography variant="body2" weight="semibold" style={{ color: colors.white }}>
                      {t('teacher.tracking.saveNote')}
                    </Typography>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ============================================
// Lesson Details Modal Component
// ============================================

const LessonDetailsModal: React.FC<LessonDetailsModalProps> = ({
  visible,
  lesson,
  onClose,
  onEditNote,
}) => {
  const { t } = useTranslation();
  const { isRTL, getTextAlign, getFlexDirection } = useRTL();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();

  const detailModalWidth = useMemo(() => {
    const horizontalMargin = spacing[6];
    const candidate = Math.max(windowWidth - horizontalMargin, 300);
    const capped = Math.min(candidate, 600);
    const comfortable = Math.max(capped, Math.min(windowWidth - spacing[8], 360));
    return Math.min(comfortable, windowWidth - horizontalMargin / 2);
  }, [windowWidth]);

  if (!lesson) return null;

  const studentName = lesson.student
    ? `${lesson.student.first_name || ''} ${lesson.student.last_name || ''}`.trim() || 'תלמיד/ה'
    : 'תלמיד/ה';

  const subjectName = lesson.subject?.name_he || lesson.subject?.name || 'שיעור';

  const startDate = new Date(lesson.start_at);
  const endDate = new Date(lesson.end_at);
  const dateStr = startDate.toLocaleDateString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const startTime = startDate.toLocaleTimeString('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const endTime = endDate.toLocaleTimeString('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));

  const styles = createStyle({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing[4],
    },
    modalContent: {
      backgroundColor: colors.white,
      borderRadius: 24,
      paddingTop: spacing[4],
      paddingBottom: spacing[4] + insets.bottom,
      paddingHorizontal: spacing[4],
      maxHeight: '90%',
      flexDirection: 'column',
    },
    modalHeader: {
      flexDirection: getFlexDirection('row-reverse'),
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing[4],
      marginBottom: spacing[4],
      borderBottomWidth: 1,
      borderBottomColor: colors.gray[200],
      paddingBottom: spacing[3],
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.gray[900],
      textAlign: getTextAlign('right'),
    },
    closeButton: {
      padding: spacing[2],
    },
    modalBody: {
      paddingHorizontal: spacing[4],
      flexGrow: 1,
    },
    detailRow: {
      flexDirection: getFlexDirection('row-reverse'),
      justifyContent: 'space-between',
      paddingVertical: spacing[3],
      borderBottomWidth: 1,
      borderBottomColor: colors.gray[100],
    },
    detailLabel: {
      fontSize: 14,
      color: colors.gray[600],
      fontWeight: '500',
      textAlign: getTextAlign('right'),
    },
    detailValue: {
      fontSize: 14,
      color: colors.gray[900],
      fontWeight: '600',
      flex: 1,
      textAlign: getTextAlign('right'),
    },
    noteSection: {
      marginTop: spacing[2],
      paddingTop: spacing[3],
      borderTopWidth: 2,
      borderTopColor: colors.gray[200],
      alignItems: isRTL ? 'flex-start' : 'flex-end', // hug the right edge in RTL and left in LTR
      alignSelf: 'stretch',
    },
    noteText: {
      fontSize: 14,
      color: colors.gray[700],
      lineHeight: 22,
      marginTop: spacing[2],
      textAlign: getTextAlign('right'),
    },
    editNoteButton: {
      marginTop: spacing[4],
      marginHorizontal: spacing[4],
      marginBottom: spacing[4],
      paddingTop: spacing[2],
      paddingBottom: spacing[2],
      borderRadius: 12,
      backgroundColor: colors.primary[600],
      alignItems: 'center',
      flexShrink: 0,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={styles.modalOverlay}
      >
        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.modalContent, { width: detailModalWidth }] }>
            <View style={styles.modalHeader}>
              <Typography variant="h5" weight="bold" style={styles.modalTitle}>
                {t('teacher.tracking.viewDetails')}
              </Typography>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.detailRow}>
                <Typography variant="body2" style={styles.detailLabel}>
                  {t('teacher.tracking.student')}:
                </Typography>
                <Typography variant="body2" style={styles.detailValue}>
                  {studentName}
                </Typography>
              </View>

              <View style={styles.detailRow}>
                <Typography variant="body2" style={styles.detailLabel}>
                  {t('teacher.tracking.subject')}:
                </Typography>
                <Typography variant="body2" style={styles.detailValue}>
                  {subjectName}
                </Typography>
              </View>

              <View style={styles.detailRow}>
                <Typography variant="body2" style={styles.detailLabel}>
                  {t('teacher.tracking.date')}:
                </Typography>
                <Typography variant="body2" style={styles.detailValue}>
                  {dateStr}
                </Typography>
              </View>

              <View style={styles.detailRow}>
                <Typography variant="body2" style={styles.detailLabel}>
                  {t('teacher.tracking.time')}:
                </Typography>
                <Typography variant="body2" style={styles.detailValue}>
                  {startTime} - {endTime}
                </Typography>
              </View>

              <View style={styles.detailRow}>
                <Typography variant="body2" style={styles.detailLabel}>
                  {t('teacher.tracking.duration')}:
                </Typography>
                <Typography variant="body2" style={styles.detailValue}>
                  {durationMinutes} {t('teacher.tracking.minutes')}
                </Typography>
              </View>

              {lesson.location && (
                <View style={styles.detailRow}>
                  <Typography variant="body2" style={styles.detailLabel}>
                    {t('teacher.tracking.location')}:
                  </Typography>
                  <Typography variant="body2" style={styles.detailValue}>
                    {lesson.location}
                  </Typography>
                </View>
              )}

              <View style={styles.detailRow}>
                <Typography variant="body2" style={styles.detailLabel}>
                  {t('teacher.tracking.status')}:
                </Typography>
                <Typography variant="body2" style={styles.detailValue}>
                  {t('teacher.tracking.completed')}
                </Typography>
              </View>

              <View style={styles.noteSection}>
                <Typography
                  variant="body1"
                  weight="semibold"
                  style={{ color: colors.gray[900], textAlign: getTextAlign('right') }}
                >
                  {t('teacher.tracking.note')}:
                </Typography>
                {lesson.tracking?.note ? (
                  <Typography variant="body2" style={styles.noteText}>
                    {lesson.tracking.note}
                  </Typography>
                ) : (
                  <Typography variant="body2" style={[styles.noteText, { color: colors.gray[400] }]}>
                    {t('teacher.tracking.noNote')}
                  </Typography>
                )}
              </View>
            </View>

            <TouchableOpacity onPress={onEditNote} style={styles.editNoteButton}>
              <Typography variant="body2" weight="semibold" style={{ color: colors.white }}>
                {lesson.tracking?.note ? t('teacher.tracking.editNote') : t('teacher.tracking.note')}
              </Typography>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

// ============================================
// Main Tracking Page
// ============================================

export default function TrackingScreen() {
  const { t } = useTranslation();
  const { direction } = useRTL();
  const { profile } = useAuth();
  const params = useLocalSearchParams<{ studentId?: string | string[] }>();
  const studentIdFromParams = useMemo(() => {
    const value = params.studentId;
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  }, [params.studentId]);
  const queryClient = useQueryClient();

  const teacherId = profile?.role === 'teacher' ? profile.id : null;

  // Filter states
  const [filters, setFilters] = useState<LessonTrackingFilters>({ limit: 20 });
  const [selectedLesson, setSelectedLesson] = useState<CompletedLesson | null>(null);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  useEffect(() => {
    const limit = filters.limit ?? 20;
    const normalized = studentIdFromParams?.toString().trim();

    if (normalized) {
      setFilters((prev) => {
        if (prev.studentId === normalized && (prev.limit ?? limit) === limit) {
          return prev;
        }
        return { ...prev, studentId: normalized, limit };
      });
    } else {
      setFilters((prev) => {
        if (!prev.studentId && (prev.limit ?? limit) === limit) {
          return prev;
        }
        const next: LessonTrackingFilters = { ...prev };
        delete next.studentId;
        next.limit = limit;
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentIdFromParams]);

  // Fetch completed lessons with infinite scroll
  const {
    data: lessonsData,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<LessonTrackingResponse, Error, InfiniteData<LessonTrackingResponse>, (string | LessonTrackingFilters | null | undefined)[], string | null>({
    queryKey: ['teacherCompletedLessons', teacherId, filters],
    queryFn: async ({ pageParam }) => {
      if (!teacherId) throw new Error('Teacher ID required');
      return await getTeacherCompletedLessons(teacherId, {
        ...filters,
        cursor: (pageParam as string | null) || undefined,
      });
    },
    enabled: !!teacherId && !!profile,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor || null,
  });

  // Flatten pages into single array
  const lessons = useMemo(() => {
    if (!lessonsData?.pages) return [];
    return lessonsData.pages.flatMap((page: LessonTrackingResponse) => page.lessons);
  }, [lessonsData]);

  // Mutation for saving notes
  const saveNoteMutation = useMutation({
    mutationFn: async ({ bookingId, note }: { bookingId: string; note: string }) => {
      return await upsertLessonNote(bookingId, note);
    },
    onSuccess: () => {
      // Optimistic update: invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['teacherCompletedLessons', teacherId] });
      Alert.alert('הצלחה', t('teacher.tracking.noteSaved'));
      setNoteModalVisible(false);
    },
    onError: (error: any) => {
      Alert.alert('שגיאה', t('teacher.tracking.errorSavingNote') + '\n' + (error.message || ''));
    },
  });

  const handleNotePress = useCallback((lesson: CompletedLesson) => {
    setSelectedLesson(lesson);
    setNoteModalVisible(true);
  }, []);

  const handleDetailsPress = useCallback((lesson: CompletedLesson) => {
    setSelectedLesson(lesson);
    setDetailsModalVisible(true);
  }, []);

  const handleSaveNote = useCallback(
    async (note: string) => {
      if (!selectedLesson) return;
      saveNoteMutation.mutate({ bookingId: selectedLesson.id, note });
    },
    [selectedLesson, saveNoteMutation]
  );

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleEditNoteFromDetails = useCallback(() => {
    setDetailsModalVisible(false);
    setNoteModalVisible(true);
  }, []);

  // Note: Filters are handled by the query key, so refetch happens automatically

  const styles = createStyle({
    container: {
      flex: 1,
      backgroundColor: colors.gray[50],
    },
    header: {
      backgroundColor: colors.white,
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
      borderBottomWidth: 1,
      borderBottomColor: colors.gray[200],
      alignItems: 'center', // Center the header content regardless of layout direction
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.gray[900],
      textAlign: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing[6],
    },
    emptyIcon: {
      marginBottom: spacing[4],
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing[6],
    },
    skeletonCard: {
      backgroundColor: colors.white,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.gray[200],
      padding: spacing[4],
      marginBottom: spacing[3],
      marginHorizontal: spacing[4],
      height: 200,
    },
  });

  return (
    <SafeAreaView style={[styles.container, { direction }]}>
      <View style={styles.header}>
        <Typography variant="h4" weight="bold" style={styles.headerTitle}>
          {t('teacher.tracking.title')}
        </Typography>
      </View>

      {isLoading && !lessonsData ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
        </View>
      ) : isError ? (
        <View style={styles.errorContainer}>
          <Typography variant="body1" color="error" style={{ textAlign: 'center', marginBottom: spacing[4] }}>
            {t('teacher.tracking.errorLoading')}
          </Typography>
          <TouchableOpacity
            onPress={() => refetch()}
            style={{
              paddingHorizontal: spacing[4],
              paddingVertical: spacing[2],
              backgroundColor: colors.primary[600],
              borderRadius: 8,
            }}
          >
            <Typography variant="body2" weight="semibold" style={{ color: colors.white }}>
              נסה שוב
            </Typography>
          </TouchableOpacity>
        </View>
      ) : lessons.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FileText size={64} color={colors.gray[300]} style={styles.emptyIcon} />
          <Typography variant="h6" weight="semibold" style={{ textAlign: 'center', marginBottom: spacing[2] }}>
            {t('teacher.tracking.emptyState')}
          </Typography>
        </View>
      ) : (
        <FlatList
          data={lessons}
          renderItem={({ item }) => (
            <LessonTrackingCard
              lesson={item}
              onNotePress={handleNotePress}
              onDetailsPress={handleDetailsPress}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: spacing[2] }}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={{ paddingVertical: spacing[4], alignItems: 'center' }}>
                <ActivityIndicator size="small" color={colors.primary[600]} />
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={colors.primary[600]}
            />
          }
        />
      )}

      <NoteModal
        visible={noteModalVisible}
        lesson={selectedLesson}
        onClose={() => setNoteModalVisible(false)}
        onSave={handleSaveNote}
        isLoading={saveNoteMutation.isPending}
      />

      <LessonDetailsModal
        visible={detailsModalVisible}
        lesson={selectedLesson}
        onClose={() => setDetailsModalVisible(false)}
        onEditNote={handleEditNoteFromDetails}
      />
    </SafeAreaView>
  );
}

