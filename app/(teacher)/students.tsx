import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Typography } from '@/ui/Typography';
import { Card } from '@/ui/Card';
import { colors, spacing } from '@/theme/tokens';
import { createStyle } from '@/theme/utils';
import { useRTL } from '@/context/RTLContext';
import { useTeacherStudents } from '@/hooks/useTeacherStudents';
import { useAuth } from '@/features/auth/auth-context';
import { getTeacherSubjects } from '@/services/api/teachersAPI';
import type { TeacherStudentCard } from '@/services/api/teacherStudentsAPI';

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
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);
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
      subjectId: subjectFilter || undefined,
      limit: 12,
    }),
    [debouncedSearch, statusFilter, subjectFilter]
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

  const {
    data: subjectOptions = [],
    isLoading: subjectsLoading,
  } = useQuery({
    queryKey: ['teacherSubjects', teacherId],
    enabled: Boolean(teacherId),
    queryFn: async () => {
      if (!teacherId) return [];
      return getTeacherSubjects(teacherId);
    },
    staleTime: 1000 * 60 * 10,
  });

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
      flexDirection: getFlexDirection('row'),
      alignItems: 'center',
      marginTop: spacing[3],
      gap: spacing[2],
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
      padding: spacing[4],
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.gray[200],
      marginBottom: spacing[3],
      backgroundColor: colors.white,
      gap: spacing[2],
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
    statusPill: {
      alignSelf: isRTL ? 'flex-start' : 'flex-end',
      backgroundColor: colors.primary[50],
      borderRadius: 12,
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[1],
      borderWidth: 1,
      borderColor: colors.primary[200],
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
          <View style={{ flexDirection: getFlexDirection('row'), alignItems: 'flex-start', gap: spacing[2] }}>
            <View style={{ flex: 1 }}>
              <Typography variant="h6" weight="bold" style={{ textAlign: getTextAlign('right'), marginBottom: spacing[1] }}>
                {item.student_name}
              </Typography>
              <Typography variant="body2" color="textSecondary" style={{ textAlign: getTextAlign('right') }}>
                {subjectLabel}
              </Typography>
              <Typography variant="caption" color="textSecondary" style={{ marginTop: spacing[1], textAlign: getTextAlign('right') }}>
                {item.age ? t('teacher.studentsPage.ageValue', { count: item.age }) : t('teacher.studentsPage.ageUnavailable')}
              </Typography>
            </View>
            <View style={styles.statusPill}>
              <Typography variant="caption" style={{ color: colors.primary[700], fontWeight: '700' }}>
                {item.status === 'active'
                  ? t('teacher.studentsPage.statusActive')
                  : t('teacher.studentsPage.statusInactive')}
              </Typography>
            </View>
          </View>

          <View style={styles.countsRow}>
            <View style={styles.countPill}>
              <Typography variant="caption" weight="semibold" style={{ color: colors.gray[700] }}>
                {`${t('teacher.studentsPage.completedCount')}: ${item.completed_count}`}
              </Typography>
            </View>
            <View style={[styles.countPill, { backgroundColor: colors.error[50], borderColor: 'transparent' }]}>
              <Typography variant="caption" weight="semibold" style={{ color: colors.error[600] }}>
                {`${t('teacher.studentsPage.cancelledCount')}: ${item.cancelled_count}`}
              </Typography>
            </View>
          </View>

          <Typography variant="caption" color="textSecondary" style={{ textAlign: getTextAlign('right'), marginTop: spacing[1] }}>
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

  const subjectChips = useMemo(() => {
    if (subjectsLoading || subjectOptions.length === 0) return null;
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingVertical: spacing[1],
          gap: spacing[2],
          flexDirection: getFlexDirection('row'),
        }}
      >
        {subjectOptions.map((item) => {
          const isSelected = subjectFilter === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              style={[
                styles.filterChip,
                { paddingHorizontal: spacing[3], paddingVertical: spacing[1] },
                isSelected && styles.filterChipActive,
              ]}
              onPress={() => setSubjectFilter(isSelected ? null : item.id)}
            >
              <Typography
                variant="caption"
                style={[
                  styles.filterChipText,
                  isSelected && styles.filterChipTextActive,
                ]}
              >
                {item.name_he || item.name}
              </Typography>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  }, [
    subjectOptions,
    subjectsLoading,
    subjectFilter,
    styles.filterChip,
    styles.filterChipActive,
    styles.filterChipText,
    styles.filterChipTextActive,
    getFlexDirection,
  ]);

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
            <Typography variant="h4" weight="bold" style={{ textAlign: getTextAlign('right'), marginBottom: spacing[3] }}>
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

            {subjectChips}
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

