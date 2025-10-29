import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Star, Gift, MapPin } from 'lucide-react-native';
import { Typography } from '@/ui/Typography';
import { Card, CardContent } from '@/ui/Card';
import { colors, spacing } from '@/theme/tokens';
import { createStyle } from '@/theme/utils';
import { useRTL } from '@/context/RTLContext';
import { InfoBanner } from '@/components/ui/infobanner';
import { getBannerMessages } from '@/data/banner-messages';
import { useRecommendedTeachers } from '@/hooks/useTeachers';
import { useAuth } from '@/features/auth/auth-context';

interface Teacher {
  id: string;
  displayName: string;
  bio: string;
  avatarUrl?: string;
  hourlyRate: number;
  subjects: string[];
  rating?: number;
  totalReviews?: number;
  nextAvailable?: string;
  location?: string;
  experienceYears?: number;
  totalStudents?: number;
}

const getPopularSubjects = (t: any) => [
  { key: 'mathematics', label: t('home.subjects.mathematics') },
  { key: 'english', label: t('home.subjects.english') },
  { key: 'physics', label: t('home.subjects.physics') },
  { key: 'chemistry', label: t('home.subjects.chemistry') },
  { key: 'history', label: t('home.subjects.history') },
  { key: 'music', label: t('home.subjects.music') },
  { key: 'art', label: t('home.subjects.art') },
  { key: 'programming', label: t('home.subjects.programming') },
];

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isRTL, direction } = useRTL();
  const { profile } = useAuth();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const popularSubjects = getPopularSubjects(t);
  const bannerMessages = getBannerMessages();

  // Unified teachers source from `teachers`
  const { data: teachers = [], isLoading, error } = useRecommendedTeachers({ limit: 20, orderBy: 'rating' });

  // Map subject keys to Hebrew names from database
  const subjectKeyToHebrew: Record<string, string> = {
    'mathematics': 'מתמטיקה',
    'english': 'אנגלית',
    'physics': 'פיזיקה',
    'chemistry': 'כימיה',
    'history': 'היסטוריה',
    'music': 'מוזיקה',
    'art': 'אמנות',
    'programming': 'מדעי המחשב',
  };

  // Memoize filtered teachers to avoid recalculation on every render
  const filteredTeachers = useMemo(() => {
    return teachers.filter(teacher => {
      if (selectedSubject) {
        const hebrewSubject = subjectKeyToHebrew[selectedSubject];
        if (!hebrewSubject || !teacher.subjects || !Array.isArray(teacher.subjects)) {
          return false;
        }
        return teacher.subjects.some(s => String(s) === String(hebrewSubject));
      }
      return true;
    });
  }, [teachers, selectedSubject]);

  // Memoized TeacherCard component for better performance
  const TeacherCard = React.memo(({ item }: { item: Teacher }) => {
    // Safety check - ensure all required fields exist
    if (!item || !item.id) {
      return null;
    }

    // Ensure all fields are strings/numbers
    const safeName = String(item.displayName || 'לא ידוע');
    const safeRate = Number(item.hourlyRate) || 0;
    const safeRating = Number(item.rating) || 0;
    const safeReviews = Number(item.totalReviews) || 0;
    const safeBio = String(item.bio || '').trim();
    const safeLocation = String(item.location || '').trim();

    // Ensure subjects is always an array - convert all to strings and filter empty
    // API returns either 'subjects' or 'subject_names'
    const subjectData = (item as any).subject_names || item.subjects || [];
    const safeSubjects = Array.isArray(subjectData)
      ? subjectData.map((s: any) => String(s || '')).filter((s: string) => s.trim() !== '')
      : [];

    const handlePress = useCallback(() => {
      router.push(`/(tabs)/teacher/${String(item.id)}`);
    }, [item.id]);

    return (
    <Card
      variant="elevated"
      style={{
        marginBottom: spacing[2],
        marginRight: isRTL ? 0 : spacing[2],
        marginLeft: isRTL ? spacing[2] : 0,
        width: 260,
        maxWidth: 280,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.08)',
        overflow: 'hidden',
        padding: spacing[3],
      }}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.98}
      >
        {/* Top Row: Avatar + Name (left) | Rating (right) */}
        <View style={{
          flexDirection: 'row-reverse',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing[2],
        }}>
          {/* Left side: Avatar + Name */}
          <View style={{
            flexDirection: 'row-reverse',
            alignItems: 'center',
            flex: 1,
          }}>
            {/* Avatar */}
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.primary[600],
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: colors.primary[100],
              overflow: 'hidden',
            }}>
              {item.avatarUrl ? (
                <Image
                  source={{ uri: item.avatarUrl }}
                  style={{ width: 40, height: 40 }}
                  resizeMode="cover"
                />
              ) : (
                <Typography variant="body2" color="white" weight="bold">
                  {safeName.charAt(0) || '?'}
                </Typography>
              )}
            </View>

            {/* Name - left aligned */}
            <Typography
              variant="body1"
              weight="semibold"
              numberOfLines={1}
              style={{ flex: 1, fontSize: 16, textAlign: 'right', marginRight: spacing[2] }}
            >
              {safeName}
            </Typography>
          </View>

          {/* Right side: Rating */}
          <View style={{
            flexDirection: 'row-reverse',
            alignItems: 'center',
          }}>
            <Star size={13} color={colors.warning[500]} fill={colors.warning[500]} />
            {safeRating > 0 ? (
              <>
                <Typography
                  variant="caption"
                  weight="bold"
                  style={{ fontSize: 13, marginHorizontal: 4 }}
                >
                  {safeRating.toFixed(1)}
                </Typography>
                <Typography
                  variant="caption"
                  color="textSecondary"
                  style={{ fontSize: 12, opacity: 0.7 }}
                >
                  {`(${safeReviews})`}
                </Typography>
              </>
            ) : (
              <Typography
                variant="caption"
                color="textSecondary"
                style={{ fontSize: 12, marginLeft: 4 }}
              >
                חדש
              </Typography>
            )}
          </View>
        </View>

        {/* Bio Section - right aligned */}
        {safeBio && (
          <View style={{ marginBottom: spacing[2] }}>
            <Typography
              variant="body2"
              color="textSecondary"
              numberOfLines={2}
              style={{ fontSize: 13, textAlign: 'right' }}
            >
              {safeBio}
            </Typography>
          </View>
        )}

        {/* Subjects Chips - row-reverse aligned */}
        {safeSubjects.length > 0 && (
          <View style={{
            flexDirection: 'row-reverse',
            flexWrap: 'wrap',
            justifyContent: 'flex-start',
            marginBottom: spacing[2],
          }}>
            {safeSubjects.slice(0, 3).map((subject, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: colors.gray[100],
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: colors.gray[200],
                  marginHorizontal: 3,
                  marginVertical: 2,
                }}
              >
                <Typography
                  variant="caption"
                  weight="bold"
                  style={{
                    fontSize: 12,
                    color: colors.gray[700],
                    textAlign: 'center',
                  }}
                >
                  {String(subject || '')}
                </Typography>
              </View>
            ))}
            {safeSubjects.length > 3 && (
              <View style={{
                paddingHorizontal: spacing[2],
                paddingVertical: 6,
              }}>
                <Typography
                  variant="caption"
                  color="textSecondary"
                  style={{ fontSize: 11, textAlign: 'center' }}
                >
                  {`+${safeSubjects.length - 3} עוד`}
                </Typography>
              </View>
            )}
          </View>
        )}

        {/* Bottom Row: Price (left) | Location (right) */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Left side: Price */}
          <Typography
            variant="body2"
            weight="bold"
            style={{ fontSize: 14, color: colors.blue[500] }}
          >
            {`₪${safeRate}/שעה`}
          </Typography>

          {/* Right side: Location */}
          {safeLocation ? (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <Typography
                variant="caption"
                style={{ fontSize: 14, fontWeight: 'light', textAlign: 'right', marginRight: 4 }}
              >
                {safeLocation}
              </Typography>
              <MapPin size={12} color={colors.green[600]} />
            </View>
          ) : (
            <View />
          )}
        </View>
      </TouchableOpacity>
    </Card>
    );
  });

  const renderTeacherCard = ({ item }: { item: Teacher }) => <TeacherCard item={item} />;

  const styles = createStyle({
    container: {
      flex: 1,
      backgroundColor: colors.gray[50],
    },

    headerSection: {
      backgroundColor: colors.white,
      paddingHorizontal: spacing[4],
      paddingTop: spacing[3],
      paddingBottom: spacing[4],
    },

    headerContent: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    greetingContainer: {
      flex: 1,
      alignItems: 'flex-end',
    },

    userAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary[600],
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.primary[600],
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
      overflow: 'hidden',
    },

    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary[600],
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.primary[100],
    },

    subjectsSection: {
      paddingVertical: spacing[3],
    },

    sectionTitle: {
      paddingHorizontal: spacing[4],
      marginBottom: spacing[3],
      textAlign: 'right',
      width: '100%',
    },

    subjectsScroll: {
      paddingHorizontal: spacing[4],
    },

    subjectChip: {
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[2],
      borderRadius: 20,
      borderWidth: 1,
    },

    subjectChipLTR: {
      marginRight: spacing[2],
    },

    subjectChipRTL: {
      marginLeft: spacing[2],
    },

    subjectChipSelected: {
      backgroundColor: colors.primary[600],
      borderColor: colors.primary[600],
    },

    subjectChipDefault: {
      backgroundColor: colors.white,
      borderColor: colors.gray[300],
    },

    teachersSection: {
      paddingTop: spacing[3],
      paddingBottom: spacing[2],
    },


    emptyState: {
      paddingVertical: spacing[8],
      alignItems: 'center',
    },

    // New styles for enhanced sections
    statsSection: {
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[4],
    },
    statsGrid: {
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    statCard: {
      width: '48%',
      backgroundColor: colors.white,
      borderRadius: 12,
      padding: spacing[4],
      alignItems: 'center',
      marginBottom: spacing[3],
      borderWidth: 1,
      borderColor: colors.gray[100],
    },

    offerSection: {
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[2],
    },
    offerCard: {
      backgroundColor: colors.primary[50],
      borderWidth: 1,
      borderColor: colors.primary[100],
    },
    offerContent: {
      padding: spacing[4],
    },
    offerRow: {
      alignItems: 'flex-start',
      marginBottom: spacing[3],
    },
    offerText: {
      flex: 1,
      marginHorizontal: spacing[3],
    },
    offerButton: {
      backgroundColor: colors.white,
      borderRadius: 8,
      paddingVertical: spacing[2],
      paddingHorizontal: spacing[4],
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderColor: colors.primary[200],
    },

    categoriesSection: {
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[4],
    },
    categoriesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    categoryCard: {
      width: '48%',
      borderRadius: 12,
      padding: spacing[4],
      paddingVertical: spacing[5], // Increased vertical padding
      alignItems: 'center',
      marginBottom: spacing[3],
      borderWidth: 1,
      borderColor: colors.gray[100],
      minHeight: 100, // Ensure minimum height
    },
    categoryIcon: {
      fontSize: 32,
      marginBottom: spacing[2],
      lineHeight: 40, // Add line height to prevent cutoff
    },

  });

  return (
    <SafeAreaView style={[styles.container, { direction }]}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with greeting */}
        <View style={styles.headerSection}>
          <View style={styles.headerContent}>
            <View style={styles.greetingContainer}>
              <Typography variant="body2" color="textSecondary" style={{ textAlign: 'right', fontSize: 14 }}>
                {new Date().getHours() < 12 ? 'בוקר טוב' : new Date().getHours() < 18 ? 'צהריים טובים' : 'ערב טוב'}
              </Typography>
              <Typography variant="h3" weight="bold" style={{ textAlign: 'right', color: colors.gray[900], marginTop: spacing[1] }}>
                {profile?.displayName || 'אורח'}
              </Typography>
            </View>
            <View style={styles.userAvatar}>
              {profile?.avatarUrl ? (
                <Image
                  source={{ uri: profile.avatarUrl }}
                  style={{ width: 48, height: 48 }}
                  resizeMode="cover"
                />
              ) : (
                <Typography variant="h5" color="white" weight="bold">
                  {profile?.displayName?.charAt(0) || 'א'}
                </Typography>
              )}
            </View>
          </View>
        </View>

        {/* Info Banner */}
        <InfoBanner
          messages={bannerMessages}
          autoRotateInterval={10000}
        />
          {/* Subject Filters */}
          <View style={styles.subjectsSection}>
            <Typography variant="h5" weight="semibold" style={[styles.sectionTitle, { textAlign: 'right' }]}>
              {t('home.popularSubjects')}
            </Typography>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.subjectsScroll}
              data={popularSubjects}
              keyExtractor={(item) => item.key}
              inverted={isRTL}
              contentContainerStyle={{ paddingHorizontal: spacing[4] }}
              renderItem={({ item: subject }) => (
                <TouchableOpacity
                  onPress={() => setSelectedSubject(
                    selectedSubject === subject.key ? null : subject.key
                  )}
                  style={[
                    styles.subjectChip,
                    isRTL ? styles.subjectChipRTL : styles.subjectChipLTR,
                    selectedSubject === subject.key ? styles.subjectChipSelected : styles.subjectChipDefault
                  ]}
                >
                  <Typography
                    variant="body2"
                    color={selectedSubject === subject.key ? 'white' : 'text'}
                    weight="medium"
                  >
                    {subject.label}
                  </Typography>
                </TouchableOpacity>
              )}
            />
          </View>

          {/* Featured Teachers */}
          <View style={styles.teachersSection}>
            <Typography variant="h5" weight="semibold" style={[styles.sectionTitle, { textAlign: 'right' }]}>
              {t('home.featuredTeachers')}
            </Typography>

            {isLoading ? (
              <View style={{ paddingHorizontal: spacing[4], paddingVertical: spacing[6] }}>
                <Typography variant="body1" color="textSecondary" style={{ textAlign: 'center' }}>
                  טוען מורים...
                </Typography>
              </View>
            ) : error ? (
              <View style={{ paddingHorizontal: spacing[4], paddingVertical: spacing[6] }}>
                <Typography variant="body1" color="error" style={{ textAlign: 'center' }}>
                  שגיאה בטעינת נתונים
                </Typography>
              </View>
            ) : (
              <FlatList
                data={filteredTeachers}
                renderItem={renderTeacherCard}
                keyExtractor={(item) => String(item.id)}
                horizontal
                showsHorizontalScrollIndicator={false}
                inverted={isRTL}
                contentContainerStyle={{
                  paddingHorizontal: spacing[4]
                }}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Typography variant="body1" color="textSecondary">
                      {t('home.noTeachersFound')}
                    </Typography>
                  </View>
                }
              />
            )}
          </View>

          {/* Featured Categories */}
          <View style={styles.categoriesSection}>
            <Typography variant="h5" weight="semibold" style={[styles.sectionTitle, { textAlign: 'right' }]}>
              {t('home.featuredCategories')}
            </Typography>
            <View style={[styles.categoriesGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity 
                style={[styles.categoryCard, { backgroundColor: colors.blue[50] }]}
                onPress={() => router.push('/(tabs)/search?category=mathematics_sciences')}
                activeOpacity={0.7}
              >
                <Typography style={styles.categoryIcon}>🔢</Typography>
                <Typography variant="body1" weight="medium" align="center">
                  מתמטיקה ומדעים
                </Typography>
                <Typography variant="caption" color="textSecondary" align="center" style={{ marginTop: spacing[1] }}>
                  350+ מורים
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.categoryCard, { backgroundColor: colors.green[50] }]}
                onPress={() => router.push('/(tabs)/search?category=languages')}
                activeOpacity={0.7}
              >
                <Typography style={styles.categoryIcon}>🌍</Typography>
                <Typography variant="body1" weight="medium" align="center">
                  שפות זרות
                </Typography>
                <Typography variant="caption" color="textSecondary" align="center" style={{ marginTop: spacing[1] }}>
                  280+ מורים
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.categoryCard, { backgroundColor: colors.purple[50] }]}
                onPress={() => router.push('/(tabs)/search?category=music_arts')}
                activeOpacity={0.7}
              >
                <Typography style={styles.categoryIcon}>🎵</Typography>
                <Typography variant="body1" weight="medium" align="center">
                  מוזיקה ואמנות
                </Typography>
                <Typography variant="caption" color="textSecondary" align="center" style={{ marginTop: spacing[1] }}>
                  150+ מורים
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.categoryCard, { backgroundColor: colors.orange[50] }]}
                onPress={() => router.push('/(tabs)/search?category=technology')}
                activeOpacity={0.7}
              >
                <Typography style={styles.categoryIcon}>💻</Typography>
                <Typography variant="body1" weight="medium" align="center">
                  טכנולוגיה ותכנות
                </Typography>
                <Typography variant="caption" color="textSecondary" align="center" style={{ marginTop: spacing[1] }}>
                  120+ מורים
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.categoryCard, { backgroundColor: colors.red[50] }]}
                onPress={() => router.push('/(tabs)/search?category=sports_fitness')}
                activeOpacity={0.7}
              >
                <Typography style={styles.categoryIcon}>⚽</Typography>
                <Typography variant="body1" weight="medium" align="center">
                  ספורט ואימונים
                </Typography>
                <Typography variant="caption" color="textSecondary" align="center" style={{ marginTop: spacing[1] }}>
                  95+ מורים
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.categoryCard, { backgroundColor: colors.indigo[50] }]}
                onPress={() => router.push('/(tabs)/search?category=academic_courses')}
                activeOpacity={0.7}
              >
                <Typography style={styles.categoryIcon}>🎓</Typography>
                <Typography variant="body1" weight="medium" align="center">
                  קורסי אקדמיה
                </Typography>
                <Typography variant="caption" color="textSecondary" align="center" style={{ marginTop: spacing[1] }}>
                  180+ מורים
                </Typography>
              </TouchableOpacity>
            </View>
          </View>

          {/* Special Offer Banner */}
          <View style={styles.offerSection}>
            <Card style={styles.offerCard}>
              <CardContent style={styles.offerContent}>
                <View style={[styles.offerRow, { flexDirection: 'row-reverse' }]}>
                  <View style={styles.offerText}>
                    <Typography variant="h5" weight="bold" color="primary" style={{ textAlign: 'right' }}>
                      {t('home.specialOffer')}
                    </Typography>
                    <Typography variant="body1" style={{ marginTop: spacing[1], textAlign: 'right' }}>
                      {t('home.firstLessonFree')}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" style={{ marginTop: spacing[1], textAlign: 'right' }}>
                      {t('home.newStudentOffer')}
                    </Typography>
                  </View>
                  <Gift size={32} color={colors.primary[600]} />
                </View>
                <View style={{ width: '100%', marginTop: spacing[2] }}>
                  <TouchableOpacity style={[styles.offerButton, { alignSelf: 'flex-end' }]}>
                    <Typography variant="body2" weight="semibold" color="primary">
                      {t('home.joinNow')}
                    </Typography>
                  </TouchableOpacity>
                </View>
              </CardContent>
            </Card>
          </View>

        </ScrollView>
    </SafeAreaView>
  );
}