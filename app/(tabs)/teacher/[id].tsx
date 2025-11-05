import { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Star,
  MapPin,
  Globe,
  CheckCircle,
  Play,
  ArrowRight,
} from 'lucide-react-native';
import { Card, CardContent } from '@/ui/Card';
import { Typography } from '@/ui/Typography';
import { Button, ButtonText } from '@gluestack-ui/themed';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing } from '@/theme/tokens';
import { createStyle } from '@/theme/utils';
import { useRTL } from '@/context/RTLContext';
import { getTeacherById, getTeacherReviews, getTeacherSubjectExperience, getSubjects } from '@/services/api';

export default function TeacherProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { isRTL, getFlexDirection } = useRTL();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'about' | 'availability' | 'reviews'>('about');

  const { data: teacherData, isLoading: loadingTeacher, error: teacherError } = useQuery({
    queryKey: ['teacher', id],
    queryFn: async () => {
      if (!id) throw new Error('Teacher ID is required');
      const data = await getTeacherById(id as string);
      console.log('📚 Teacher data from API:', JSON.stringify(data, null, 2));
      return data;
    },
    enabled: !!id,
  });

  const { data: reviewsData = [], isLoading: loadingReviews } = useQuery({
    queryKey: ['teacherReviews', id],
    queryFn: async () => {
      if (!id) return [];
      const reviews = await getTeacherReviews(id as string);
      console.log('⭐ Reviews from API:', JSON.stringify(reviews, null, 2));
      return reviews;
    },
    enabled: !!id,
  });

  const { data: subjectExperienceData = {}, isLoading: loadingSubjectExperience } = useQuery({
    queryKey: ['teacherSubjectExperience', id],
    queryFn: async () => {
      if (!id) return {};
      const experience = await getTeacherSubjectExperience(id as string);
      console.log('📊 Subject experience from API:', JSON.stringify(experience, null, 2));
      return experience;
    },
    enabled: !!id,
  });

  const { data: allSubjects = [], isLoading: loadingSubjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const subjects = await getSubjects();
      console.log('📚 All subjects from API:', JSON.stringify(subjects, null, 2));
      return subjects;
    },
  });

  const isLoading = loadingTeacher || loadingReviews || loadingSubjectExperience || loadingSubjects;
  const error = teacherError;

  // Transform API data to match component interface
  const teacher = teacherData ? {
    id: teacherData.id,
    displayName: teacherData.display_name || 'לא ידוע',
    bio: teacherData.bio || '',
    avatarUrl: teacherData.avatar_url,
    videoUrl: (teacherData as any).video_url,
    hourlyRate: teacherData.hourly_rate || 0,
    subjects: Array.isArray(teacherData.subject_names)
      ? teacherData.subject_names.filter((s: any) => typeof s === 'string' && s.trim())
      : [],
    languages: Array.isArray((teacherData as any).languages)
      ? (teacherData as any).languages.filter((l: any) => typeof l === 'string' && l.trim())
      : ['עברית'],
    location: teacherData.location || '',
    rating: teacherData.avg_rating || 0,
    totalReviews: teacherData.review_count || 0,
    totalStudents: teacherData.total_students || 0,
    experience: teacherData.experience_years ? `${teacherData.experience_years} שנים` : '',
    education: Array.isArray((teacherData as any).education)
      ? (teacherData as any).education.filter((e: any) => typeof e === 'string' && e.trim())
      : [],
    availability: (teacherData as any).availability || {},
    reviews: reviewsData.map((r: any) => ({
      id: r.id,
      studentName: r.student?.display_name || 'תלמיד',
      rating: r.rating || 0,
      text: r.comment || '',
      date: new Date(r.created_at).toLocaleDateString('he-IL'),
    })),
  } : null;

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.gray[50] }}>
        <Typography variant="body1" color="textSecondary">
          {t('common.loading')}
        </Typography>
      </SafeAreaView>
    );
  }

  // Error or Not Found state
  if (error || !teacher) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.gray[50], padding: spacing[4] }}>
        <Typography variant="h4" weight="bold" style={{ marginBottom: spacing[3], textAlign: 'center' }}>
          המורה לא נמצא
        </Typography>
        <Typography variant="body1" color="textSecondary" style={{ marginBottom: spacing[6], textAlign: 'center' }}>
          המורה שחיפשת אינו זמין כרגע
        </Typography>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/')}
          style={{
            backgroundColor: colors.primary[600],
            paddingHorizontal: spacing[6],
            paddingVertical: spacing[3],
            borderRadius: 12,
          }}
        >
          <Typography variant="body1" color="white" weight="semibold">
            חזור לדף הבית
          </Typography>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleBooking = () => {
    router.push({
      pathname: '/(booking)/book-lesson' as any,
      params: { teacherId: teacher.id },
    });
  };

  const priceText = `₪${teacher.hourlyRate} לשעה`;

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={16}
        color="#FFC107"
        fill={i < Math.floor(rating) ? '#FFC107' : 'transparent'}
      />
    ));
  };

  const styles = createStyle({
    container: {
      flex: 1,
      backgroundColor: colors.gray[50],
    },
    headerSection: {
      backgroundColor: colors.white,
      padding: spacing[4],
    },
    profileRow: {
      alignItems: 'flex-start',
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary[600],
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    profileInfo: {
      flex: 1,
    },
    profileInfoLTR: {
      marginLeft: spacing[4],
    },
    profileInfoRTL: {
      marginRight: spacing[4],
    },
    locationRow: {
      alignItems: 'center',
      marginTop: spacing[2],
    },
    languageRow: {
      alignItems: 'center',
      marginTop: spacing[1],
    },
    statsContainer: {
      justifyContent: 'space-around',
      marginTop: spacing[6],
      paddingTop: spacing[4],
      borderTopWidth: 1,
      borderTopColor: colors.gray[200],
    },
    statsItem: {
      alignItems: 'center',
    },
    videoPlaceholder: {
      marginTop: spacing[4],
      backgroundColor: colors.gray[100],
      borderRadius: 12,
      height: 192,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabsContainer: {
      backgroundColor: colors.white,
      borderBottomWidth: 1,
      borderBottomColor: colors.gray[200],
      paddingHorizontal: spacing[4],
    },
    tab: {
      flex: 1,
      paddingVertical: spacing[3],
      paddingHorizontal: spacing[2],
      minHeight: 44, // Ensure minimum touch target
    },
    activeTab: {
      borderBottomWidth: 2,
      borderBottomColor: colors.primary[600],
    },
    tabContent: {
      padding: spacing[4],
    },
    backHeader: {
      backgroundColor: colors.white,
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
      borderBottomWidth: 1,
      borderBottomColor: colors.gray[200],
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    bottomAction: {
      position: 'absolute',
      left: 0,
      right: 0,
      backgroundColor: colors.white,
      paddingHorizontal: spacing[4],
      paddingTop: spacing[3],
      paddingBottom: spacing[3],
      borderTopWidth: 1,
      borderTopColor: colors.gray[200],
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 5,
    },
    subjectsContainer: {
      flexWrap: 'wrap',
      marginTop: spacing[2],
      flexDirection: 'row-reverse',
    },
    subjectBadge: {
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[1],
      backgroundColor: colors.secondary[100],
      borderRadius: 16,
      marginLeft: spacing[2],
      marginBottom: spacing[2],
    },
    educationItem: {
      alignItems: 'flex-start',
      marginBottom: spacing[2],
    },
    reviewCard: {
      marginBottom: spacing[3],
    },
    reviewHeader: {
      justifyContent: 'space-between',
      marginBottom: spacing[2],
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}> 
      {/* Back Header */}
      <View style={styles.backHeader}>
        <TouchableOpacity
          onPress={() => {
            router.push('/(tabs)/');
          }}
          style={[styles.backButton, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}
        >
          <ArrowRight
            size={20}
            color={colors.gray[700]}
            style={{
              transform: [{ rotate: isRTL ? '0deg' : '180deg' }]
            }}
          />
          <Typography
            variant="body1"
            weight="medium"
            color="text"
            style={{
              marginLeft: isRTL ? spacing[2] : 0,
              marginRight: isRTL ? 0 : spacing[2]
            }}
          >
            {t('common.back')}
          </Typography>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 200 }}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={[styles.profileRow, { flexDirection: getFlexDirection() }]}>
            <View style={styles.avatar}>
              {teacher.avatarUrl ? (
                <Image
                  source={{ uri: teacher.avatarUrl }}
                  style={{ width: 80, height: 80 }}
                  resizeMode="cover"
                />
              ) : (
                <Typography variant="h4" color="white" align="center">
                  {String(teacher.displayName.charAt(0))}
                </Typography>
              )}
            </View>
            <View style={[styles.profileInfo, isRTL ? styles.profileInfoRTL : styles.profileInfoLTR]}>
              <Typography variant="h2" weight="bold">
                {String(teacher.displayName)}
              </Typography>
              <View style={[styles.locationRow, { flexDirection: getFlexDirection() }]}>
                <MapPin size={14} color={colors.gray[600]} />
                <Typography variant="body2" color="textSecondary" style={{ marginHorizontal: spacing[1] }}>
                  {String(teacher.location || '')}
                </Typography>
              </View>
              <View style={[styles.languageRow, { flexDirection: getFlexDirection() }]}>
                <Globe size={14} color={colors.gray[600]} />
                <Typography variant="body2" color="textSecondary" style={{ marginHorizontal: spacing[1] }}>
                  {String(teacher.languages.join(', '))}
                </Typography>
              </View>
            </View>
          </View>

          {/* Stats */}
          <View style={[styles.statsContainer, { flexDirection: getFlexDirection() }]}>
            <View style={styles.statsItem}>
              <View style={{ flexDirection: getFlexDirection(), alignItems: 'center' }}>
                {renderStars(teacher.rating)}
              </View>
              <Typography variant="caption" color="textSecondary" style={{ marginTop: spacing[1] }}>
                {String(teacher.rating)} ({String(teacher.totalReviews)} {t('teacher.totalReviews')})
              </Typography>
            </View>
            <View style={styles.statsItem}>
              <Typography variant="h5" weight="bold">
                {String(teacher.totalStudents || 0)}
              </Typography>
              <Typography variant="caption" color="textSecondary">{t('teacher.students')}</Typography>
            </View>
            <View style={styles.statsItem}>
              <Typography variant="h5" weight="bold">
                ₪{String(teacher.hourlyRate)}
              </Typography>
              <Typography variant="caption" color="textSecondary">{t('teacher.perHour')}</Typography>
            </View>
          </View>

          {/* Video Introduction */}
          {teacher.videoUrl && (
            <TouchableOpacity style={styles.videoPlaceholder}>
              <Play size={48} color={colors.gray[600]} />
              <Typography variant="body2" color="textSecondary" style={{ marginTop: spacing[2] }}>
                {t('teacher.watchIntroduction')}
              </Typography>
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View style={[styles.tabsContainer, { flexDirection: getFlexDirection() }]}>
          {(['about', 'availability', 'reviews'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              activeOpacity={0.7}
            >
              <Typography
                variant="body2"
                weight={activeTab === tab ? 'semibold' : 'normal'}
                color={activeTab === tab ? 'primary' : 'textSecondary'}
                align="center"
              >
                {t(`teacher.${tab}`)}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'about' && (
            <View>
              <Card style={{ marginBottom: spacing[4] }}>
                <CardContent>
                  <Typography variant="h5" weight="semibold" style={{ marginBottom: spacing[2] }}>
                    {t('teacher.aboutMe')}
                  </Typography>
                  <View style={{ flex: 1 }}>
                    <Typography
                      variant="body1"
                      color="text"
                      style={{ flex: 1 }}
                    >
                      {String(teacher.bio || '')}
                    </Typography>
                  </View>
                </CardContent>
              </Card>

              <Card style={{ marginBottom: spacing[4] }}>
                <CardContent>
                  <Typography variant="h5" weight="semibold" style={{ marginBottom: spacing[2] }}>
                    {t('teacher.subjects')}
                  </Typography>
                  <View style={[styles.subjectsContainer, { flexDirection: getFlexDirection() }]}>
                    {teacher.subjects.map((subject, index) => (
                      <View key={index} style={styles.subjectBadge}>
                        <Typography variant="body2" color="secondary">
                          {String(subject)}
                        </Typography>
                      </View>
                    ))}
                  </View>
                </CardContent>
              </Card>

              <Card style={{ marginBottom: spacing[4] }}>
                <CardContent>
                  <Typography variant="h5" weight="semibold" style={{ marginBottom: spacing[2] }}>
                    {t('teacher.education')}
                  </Typography>
                  {teacher.education.map((edu: string, index: number) => (
                    <View key={index} style={[styles.educationItem, { flexDirection: getFlexDirection() }]}>
                      <CheckCircle size={16} color={colors.success[600]} />
                      <Typography variant="body1" color="text" style={{ marginHorizontal: spacing[2], flex: 1 }}>
                        {String(edu)}
                      </Typography>
                    </View>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h5" weight="semibold" style={{ marginBottom: spacing[2] }}>
                    {t('teacher.experience')}
                  </Typography>
                  {Object.keys(subjectExperienceData).length > 0 ? (
                    <View>
                      {Object.entries(subjectExperienceData).map(([subjectId, years]) => {
                        const subject = allSubjects.find((s: any) => s.id === subjectId);
                        if (!subject) return null;
                        return (
                          <View key={subjectId} style={[styles.educationItem, { flexDirection: getFlexDirection() }]}>
                            <CheckCircle size={16} color={colors.primary[600]} />
                            <Typography variant="body1" color="text" style={{ marginHorizontal: spacing[2], flex: 1 }}>
                              {subject.name_he}: {years} שנים
                            </Typography>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <Typography variant="body1" color="text">
                      {String(teacher.experience || '')}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </View>
          )}

          {activeTab === 'availability' && (
            <Card>
              <CardContent>
                <Typography variant="h5" weight="semibold" style={{ marginBottom: spacing[4] }}>
                  {t('teacher.weeklySchedule')}
                </Typography>
                {Object.entries(teacher.availability).map(([day, times]) => (
                  <View key={day} style={{ marginBottom: spacing[3] }}>
                    <Typography variant="body1" weight="medium" style={{ marginBottom: spacing[2] }}>
                      {String(day)}
                    </Typography>
                    <View style={[styles.subjectsContainer, { flexDirection: getFlexDirection() }]}>
                      {Array.isArray(times) && (times as string[]).map((time: string, index: number) => (
                        <View key={index} style={[styles.subjectBadge, { backgroundColor: colors.gray[100], borderWidth: 1, borderColor: colors.gray[300] }]}>
                          <Typography variant="body2" color="text">
                            {String(time)}
                          </Typography>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </CardContent>
            </Card>
          )}

          {activeTab === 'reviews' && (
            <View>
              {teacher.reviews.map((review) => (
                <Card key={review.id} style={styles.reviewCard}>
                  <CardContent>
                    <View style={[styles.reviewHeader, { flexDirection: getFlexDirection() }]}>
                      <Typography variant="body1" weight="semibold">
                        {String(review.studentName)}
                      </Typography>
                      <View style={{ flexDirection: getFlexDirection() }}>
                        {renderStars(review.rating)}
                      </View>
                    </View>
                    <Typography variant="body1" color="text" style={{ marginBottom: spacing[1] }}>
                      {String(review.text)}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {String(review.date)}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={[styles.bottomAction, { bottom: insets.bottom + 68 }]}>
        <Button
          onPress={handleBooking}
          style={{
            width: '100%',
            height: 54,
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[2],
            backgroundColor: '#007AFF',
            borderRadius: 8,
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <ButtonText style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>
            {`${t('teacher.bookNow')} - ${priceText}`}
          </ButtonText>
        </Button>
      </View>
    </SafeAreaView>
  );
}