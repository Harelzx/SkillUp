import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Typography } from '@/ui/Typography';
import { Card } from '@/ui/Card';
import { colors, spacing } from '@/theme/tokens';
import { createStyle } from '@/theme/utils';
import { useRTL } from '@/context/RTLContext';
import { useTeacherStudents } from '@/hooks/useTeacherStudents';
import { useAuth } from '@/features/auth/auth-context';
import type { TeacherStudentCard } from '@/services/api/teacherStudentsAPI';

// Order matters: with RTL row-reverse the first chip is rendered at the far right (הכול -> פעיל -> לא פעיל)
const STATUS_FILTERS: Array<{ value: 'all' | 'active' | 'inactive'; labelKey: string }> = [
  { value: 'all', labelKey: 'teacher.studentsPage.statusAll' },
  { value: 'active', labelKey: 'teacher.studentsPage.statusActive' },
  { value: 'inactive', labelKey: 'teacher.studentsPage.statusInactive' },
];

export default function TeacherStudentsScreen() {
  const { t } = useTranslation();
  const { direction, getFlexDirection, getTextAlign, isRTL } = useRTL();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useAuth();
  const teacherId = profile?.role === 'teacher' ? profile.id : undefined;

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
      limit: 12,
    }),
    [debouncedSearch, statusFilter]
  );

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useTeacherStudents(teacherId, filters);

  useEffect(() => {
    if (isError) {
      console.error('[TeacherStudentsScreen] Error loading students:', error);
      setToastMessage(t('teacher.studentsPage.toastError'));
    }
  }, [isError, error, t]);

  const students = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.students);
  }, [data]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleStudentPress = useCallback(
    (studentId: string) => {
      router.push({
        pathname: '/(teacher)/tracking',
        params: { studentId },
      });
    },
    [router]
  );

  useEffect(() => {
    if (toastMessage) {
      const timeout = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [toastMessage]);

  const styles = createStyle({
    container: {
      flex: 1,
      backgroundColor: colors.gray[50],
      direction,
    },
    content: {
      paddingHorizontal: spacing[4],
      paddingBottom: insets.bottom + spacing[6],
    },
    headerRow: {
      marginTop: spacing[3],
      marginBottom: spacing[3],
    },
    searchInput: {
      height: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.gray[300],
      backgroundColor: colors.white,
      paddingHorizontal: spacing[3],
      textAlign: isRTL ? 'right' : 'left',
      fontSize: 16,
      color: colors.gray[900],
    },
    filterRow: {
      flexDirection: getFlexDirection('row-reverse'),
      alignItems: 'center',
      marginTop: spacing[3],
      gap: spacing[2],
      justifyContent: isRTL ? 'flex-start' : 'flex-end', // Keep status chips anchored to the visual right edge in RTL while preserving natural LTR alignment
    },
    filterChip: {
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[1],
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.gray[300],
      backgroundColor: colors.white,
    },
    filterChipActive: {
      borderColor: colors.primary[400],
      backgroundColor: colors.primary[50],
    },
    filterChipText: {
      fontSize: 13,
      color: colors.gray[700],
    },
    filterChipTextActive: {
      color: colors.primary[600],
      fontWeight: '700',
    },
    subjectScroll: {
      marginTop: spacing[2],
      flexGrow: 0,
    },
    listContent: {
      paddingBottom: spacing[8],
    },
    card: {
      position: 'relative',
      padding: spacing[4],
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.gray[200],
      marginBottom: spacing[3],
      backgroundColor: colors.white,
      gap: spacing[3],
      alignItems: 'center', // Center all column content; individual text blocks use textAlign for consistency
    },
    countsRow: {
      flexDirection: getFlexDirection('row'),
      gap: spacing[3],
    },
    countPill: {
      flexDirection: getFlexDirection('row'),
      borderRadius: 12,
      paddingVertical: spacing[1],
      paddingHorizontal: spacing[2],
      backgroundColor: colors.gray[100],
    },
    statusPillContainer: {
      position: 'absolute',
      top: spacing[3],
      left: spacing[3], // Pin to physical left regardless of layout direction
    },
    statusPill: {
      borderRadius: 12,
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[1],
      borderWidth: 1,
    },
    cardContent: {
      width: '100%',
      alignItems: 'center',
    },
    emptyState: {
      alignItems: 'center',
      marginTop: spacing[10],
      gap: spacing[2],
    },
    skeletonCard: {
      padding: spacing[4],
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.gray[200],
      marginBottom: spacing[3],
      backgroundColor: colors.white,
      gap: spacing[2],
    },
    skeletonLine: {
      height: 14,
      borderRadius: 8,
      backgroundColor: colors.gray[200],
    },
    toast: {
      position: 'absolute',
      bottom: insets.bottom + spacing[4],
      alignSelf: 'center',
      backgroundColor: colors.gray[900],
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[2],
      borderRadius: 20,
      opacity: 0.9,
    },
  });

  const renderStudentItem = ({ item }: { item: TeacherStudentCard }) => {
    const subjectLabel = item.topic.name_he || item.topic.name || t('teacher.studentsPage.noSubject');
    const firstLesson = item.first_lesson_at
      ? new Date(item.first_lesson_at).toLocaleDateString('he-IL')
      : '—';

    return (
      <TouchableOpacity activeOpacity={0.7} onPress={() => handleStudentPress(item.student_id)}>
        <Card variant="elevated" style={styles.card}>
          <View style={styles.statusPillContainer}>
            <View
              // Subtle soft green/red palette keeps the badge informative without overpowering the card
              style={[
                styles.statusPill,
                item.status === 'active'
                  ? {
                      backgroundColor: colors.success[50],
                      borderColor: colors.success[100],
                    }
                  : {
                      backgroundColor: colors.error[50],
                      borderColor: colors.error[100],
                    },
              ]}
            >
              <Typography
                variant="caption"
                style={{
                  color: item.status === 'active' ? colors.success[700] : colors.error[700],
                  fontWeight: '700',
                  textAlign: 'center',
                }}
              >
                {item.status === 'active'
                  ? t('teacher.studentsPage.statusActive')
                  : t('teacher.studentsPage.statusInactive')}
              </Typography>
            </View>
          </View>

          <View style={styles.cardContent}>
            <Typography variant="h6" weight="bold" style={{ textAlign: 'center', marginBottom: spacing[1] }}>
              {item.student_name}
            </Typography>
            <Typography variant="body2" color="textSecondary" style={{ textAlign: 'center' }}>
              {subjectLabel}
            </Typography>
            <Typography variant="caption" color="textSecondary" style={{ marginTop: spacing[1], textAlign: 'center' }}>
              {item.age ? t('teacher.studentsPage.ageValue', { count: item.age }) : t('teacher.studentsPage.ageUnavailable')}
            </Typography>
          </View>

          <View style={[styles.countsRow, { justifyContent: 'center' }]}>
            <View
              style={[
                styles.countPill,
                {
                  borderWidth: 1,
                  borderColor: colors.success[100],
                  backgroundColor: colors.success[50],
                },
              ]}
            >
              <Typography variant="caption" weight="semibold" style={{ color: colors.success[700], textAlign: 'center' }}>
                {`${t('teacher.studentsPage.completedCount')}: ${item.completed_count}`}
              </Typography>
            </View>
            <View
              style={[
                styles.countPill,
                {
                  borderWidth: 1,
                  borderColor: colors.error[100],
                  backgroundColor: colors.error[50],
                },
              ]}
            >
              <Typography variant="caption" weight="semibold" style={{ color: colors.error[600], textAlign: 'center' }}>
                {`${t('teacher.studentsPage.cancelledCount')}: ${item.cancelled_count}`}
              </Typography>
            </View>
          </View>

          <Typography variant="caption" color="textSecondary" style={{ textAlign: 'center', marginTop: spacing[1] }}>
            {`${t('teacher.studentsPage.startDateLabel')}: ${firstLesson}`}
          </Typography>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderSkeleton = () => (
    <View style={styles.skeletonCard}>
      <View style={[styles.skeletonLine, { width: '60%', height: 18 }]} />
      <View style={[styles.skeletonLine, { width: '40%' }]} />
      <View style={{ flexDirection: getFlexDirection('row'), gap: spacing[2], marginTop: spacing[2] }}>
        <View style={[styles.skeletonLine, { width: '25%', height: 20 }]} />
        <View style={[styles.skeletonLine, { width: '25%', height: 20 }]} />
      </View>
      <View style={[styles.skeletonLine, { width: '50%', marginTop: spacing[2] }]} />
    </View>
  );

  const listData: Array<TeacherStudentCard | null> = isLoading
    ? Array.from({ length: 4 }, () => null)
    : students;

  const renderItem = ({ item }: { item: TeacherStudentCard | null }) => {
    if (!item) {
      return renderSkeleton();
    }
    return renderStudentItem({ item });
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList<TeacherStudentCard | null>
        data={listData}
        keyExtractor={(item, index) =>
          item ? item.student_id : `skeleton-${index}`
        }
        renderItem={renderItem}
        ListHeaderComponent={
          <View style={styles.headerRow}>
            <Typography variant="h4" weight="bold" style={{ textAlign: getTextAlign('center'), marginBottom: spacing[3] }}>
              {t('teacher.studentsPage.title')}
            </Typography>

            <TextInput
              style={styles.searchInput}
              placeholder={t('teacher.studentsPage.searchPlaceholder')}
              placeholderTextColor={colors.gray[400]}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />

            <View style={styles.filterRow}>
              {STATUS_FILTERS.map(({ value, labelKey }) => {
                const isSelected = statusFilter === value;
                return (
                  <TouchableOpacity
                    key={value}
                    onPress={() => setStatusFilter(value)}
                    style={[
                      styles.filterChip,
                      isSelected && styles.filterChipActive,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Typography
                      variant="caption"
                      style={[
                        styles.filterChipText,
                        isSelected && styles.filterChipTextActive,
                      ]}
                    >
                      {t(labelKey)}
                    </Typography>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        }
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Typography variant="body1" weight="semibold">
                {t('teacher.studentsPage.emptyTitle')}
              </Typography>
              <Typography variant="body2" color="textSecondary" align="center">
                {t('teacher.studentsPage.emptySubtitle')}
              </Typography>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={isFetching && !isFetchingNextPage} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.6}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={{ paddingVertical: spacing[4], alignItems: 'center' }}>
              <ActivityIndicator color={colors.primary[600]} />
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />

      {toastMessage && (
        <View style={styles.toast}>
          <Typography variant="caption" style={{ color: colors.white }}>
            {toastMessage}
          </Typography>
        </View>
      )}
    </SafeAreaView>
  );
}

