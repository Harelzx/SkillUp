import React, { useState } from 'react';
import {
  View,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Star, Clock, CreditCard, Gift } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { Typography } from '@/ui/Typography';
import { Card, CardContent } from '@/ui/Card';
import { colors, spacing } from '@/theme/tokens';
import { createStyle } from '@/theme/utils';
import { useRTL } from '@/context/RTLContext';
import { InfoBanner } from '@/components/ui/infobanner';
import { getBannerMessages } from '@/data/banner-messages';

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

// Mock data for now - will be replaced with actual API calls
const mockTeachers: Teacher[] = [
  {
    id: '1',
    displayName: 'ד"ר שרה כהן',
    bio: 'דוקטורט במתמטיקה מאוניברסיטת תל-אביב. מתמחה בחשבון דיפרנציאלי, אלגברה ליניארית וסטטיסטיקה. 12 שנות ניסיון בהוראה אקדמית',
    hourlyRate: 150,
    subjects: ['mathematics', 'physics'],
    rating: 4.9,
    totalReviews: 127,
    nextAvailable: 'היום, 16:00',
    location: 'תל אביב',
    experienceYears: 12,
    totalStudents: 245,
  },
  {
    id: '2',
    displayName: 'דוד לוי',
    bio: 'מורה אנגלית בכיר עם תואר שני מאוניברסיטת הרווארד. מתמחה בהכנה לבחינות בגרות, פסיכומטרי ואיילטס',
    hourlyRate: 120,
    subjects: ['english', 'literature'],
    rating: 4.8,
    totalReviews: 89,
    nextAvailable: 'מחר, 14:00',
    location: 'רמת גן',
    experienceYears: 8,
    totalStudents: 186,
  },
  {
    id: '3',
    displayName: 'רחל מור',
    bio: 'פסנתרנית קונצרטים ומורה למוזיקה. בוגרת האקדמיה למוזיקה ירושלים. מתמחה בכל הגילאים ורמות הידע',
    hourlyRate: 110,
    subjects: ['music', 'piano'],
    rating: 4.9,
    totalReviews: 156,
    nextAvailable: 'עוד שעה',
  },
  {
    id: '4',
    displayName: 'פרופ\' אבי דוד',
    bio: 'פרופסור לפיזיקה באוניברסיטת תל-אביב. מתמחה בפיזיקה תיאורטית, מכניקת הקוונטים ואסטרופיזיקה',
    hourlyRate: 200,
    subjects: ['physics', 'mathematics'],
    rating: 5.0,
    totalReviews: 43,
    nextAvailable: 'השבוע',
  },
  {
    id: '5',
    displayName: 'מיכל גרין',
    bio: 'מפתחת תוכנה ב-Google ומורה לתכנות. 8 שנות ניסיון בפיתוח אפליקציות ובהוראה טכנולוגית. מתמחה ב-Python ו-JavaScript',
    hourlyRate: 140,
    subjects: ['programming', 'mathematics'],
    rating: 4.7,
    totalReviews: 94,
    nextAvailable: 'מחרתיים, 18:00',
  },
  {
    id: '6',
    displayName: 'יוסף נחמני',
    bio: 'מורה לכימיה ובעל דוקטורט בכימיה אורגנית מהטכניון. מתמחה בהכנה לבגרות, בחינות קבלה ותואר ראשון',
    hourlyRate: 130,
    subjects: ['chemistry', 'physics'],
    rating: 4.8,
    totalReviews: 67,
    nextAvailable: 'היום, 19:00',
  },
  {
    id: '7',
    displayName: 'לינה עבאס',
    bio: 'בעלת תואר שני בהיסטוריה ובלשנות מהאוניברסיטה העברית. מתמחה בהיסטוריה של המזרח התיכון ולימודי ערבית',
    hourlyRate: 90,
    subjects: ['history', 'english'],
    rating: 4.6,
    totalReviews: 38,
    nextAvailable: 'מחר, 16:30',
  },
  {
    id: '8',
    displayName: 'אליעזר כהן',
    bio: 'אמן פלסטי ומורה לציור ועיצוב גרפי. 15 שנות ניסיון בהוראת אמנות, ציור דיגיטלי ויצירה מולטימדיה',
    hourlyRate: 100,
    subjects: ['art', 'programming'],
    rating: 4.5,
    totalReviews: 52,
    nextAvailable: 'מחרתיים, 10:00',
  },
  // ספורט ואימונים
  {
    id: '9',
    displayName: 'עידו שמואלי',
    bio: 'מאמן אישי מוסמך עם 10 שנות ניסיון באימוני כוח וריצות מרתון. התמחות באימונים פונקציונליים ו-TRX',
    hourlyRate: 180,
    subjects: ['personal_training', 'running', 'trx', 'fitness'],
    rating: 4.9,
    totalReviews: 156,
    nextAvailable: 'היום, 17:00',
    location: 'תל אביב',
    experienceYears: 10,
    totalStudents: 320,
  },
  {
    id: '10',
    displayName: 'דנה פרידמן',
    bio: 'מורה ליוגה ופילאטיס מוסמכת. בוגרת לימודי יוגה בהודו והתמחות בפילאטיס טיפולי. מתמחה בכל רמות הידע',
    hourlyRate: 160,
    subjects: ['yoga', 'pilates', 'fitness'],
    rating: 4.8,
    totalReviews: 203,
    nextAvailable: 'מחר, 8:00',
    location: 'רמת גן',
    experienceYears: 8,
    totalStudents: 410,
  },
  // קורסי אקדמיה
  {
    id: '11',
    displayName: 'ד"ר אביב כהן',
    bio: 'דוקטורט במתמטיקה שימושית מהטכניון. מתמחה בהוראת חדו״א, אלגברה לינארית וסטטיסטיקה לסטודנטים במדעים',
    hourlyRate: 220,
    subjects: ['calculus', 'linear_algebra', 'statistics', 'mathematics'],
    rating: 4.9,
    totalReviews: 187,
    nextAvailable: 'מחרתיים, 15:00',
    location: 'חיפה',
    experienceYears: 15,
    totalStudents: 520,
  },
  {
    id: '12',
    displayName: 'מיכל לוי',
    bio: 'בוגרת תואר שני בכלכלה מאוניברסיטת תל-אביב. מתמחה בהוראת מיקרו, מאקרו ומימון לתואר ראשון',
    hourlyRate: 200,
    subjects: ['microeconomics', 'macroeconomics', 'finance'],
    rating: 4.7,
    totalReviews: 142,
    nextAvailable: 'היום, 18:00',
    location: 'תל אביב',
    experienceYears: 9,
    totalStudents: 285,
  },
];

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
  const { isRTL, direction, getFlexDirection } = useRTL();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const popularSubjects = getPopularSubjects(t);
  const bannerMessages = getBannerMessages();

  // Will be replaced with actual query
  const { data: teachers = mockTeachers } = useQuery({
    queryKey: ['teachers', selectedSubject],
    queryFn: async () => {
      // Placeholder - will query Supabase
      return mockTeachers;
    },
  });

  const filteredTeachers = teachers.filter(teacher => {
    if (selectedSubject) {
      return teacher.subjects.includes(selectedSubject);
    }
    return true;
  });

  const renderTeacherCard = ({ item }: { item: Teacher }) => (
    <Card
      variant="elevated"
      padding="md"
      style={{
        marginBottom: spacing[2],
        marginRight: isRTL ? 0 : spacing[2],
        marginLeft: isRTL ? spacing[2] : 0,
        width: 320, // Increased from 270
        maxWidth: 320,
        minHeight: 180, // Increased from 160
      }}
    >
      <TouchableOpacity
        onPress={() => router.push(`/(tabs)/teacher/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={[styles.teacherCardRow, isRTL ? styles.teacherCardRowRTL : styles.teacherCardRowLTR]}>
          {/* Avatar - smaller size */}
          <View style={[styles.avatar, {
            width: 45,
            height: 45,
            borderRadius: 22.5
          }]}>
            <Typography variant="h5" color="white" align="center">
              {item.displayName.charAt(0)}
            </Typography>
          </View>

          {/* Teacher Info */}
          <View style={[
            styles.teacherInfo,
            isRTL ? styles.teacherInfoRTL : styles.teacherInfoLTR,
            { gap: spacing[1], flex: 1 } // Added flex: 1 to take available space
          ]}>
            {/* Name */}
            <Typography
              variant="body1"
              weight="semibold"
              align={isRTL ? "right" : "left"}
              numberOfLines={1}
            >
              {item.displayName}
            </Typography>

            {/* Bio - more compact */}
            <Typography
              variant="caption"
              color="textSecondary"
              align={isRTL ? "right" : "left"}
              numberOfLines={3}
              ellipsizeMode="tail"
              style={{
                lineHeight: 20,
                marginTop: 2,
                fontSize: 15
              }}
            >
              {item.bio}
            </Typography>

            {/* Subjects - aligned to the right of this line */}
            <View style={[
              styles.subjectsContainer,
              {
                flexDirection: isRTL ? 'row-reverse' : 'row',
                gap: spacing[1],
                marginTop: spacing[1],
                justifyContent: isRTL ? 'flex-end' : 'flex-end',
                alignItems: 'center',
              }
            ]}>
              {item.subjects.slice(0, 2).map((subject, index) => (
                <View key={index} style={[styles.subjectBadge, {
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 8,
                }]}>
                  <Typography
                    variant="caption"
                    color="primary"
                    style={{
                      fontSize: 13,
                      textAlign: isRTL ? 'right' : 'center'
                    }}
                  >
                    {t(`home.subjects.${subject}`)}
                  </Typography>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Meta info - more compact */}
        <View style={[
          styles.metaContainer,
          {
            flexDirection: isRTL ? 'row-reverse' : 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: spacing[1] + 2,
            gap: spacing[3]
          }
        ]}>
          {/* Rating */}
          {item.rating && (
            <View style={[
              styles.ratingContainer,
              { flexDirection: isRTL ? 'row' : 'row-reverse', alignItems: 'center' }
            ]}>
              <Star size={11} color={colors.warning[500]} fill={colors.warning[500]} />
              <Typography
                variant="caption"
                weight="medium"
                style={{
                  marginLeft: isRTL ? 3 : 0,
                  marginRight: isRTL ? 0 : 3,
                  fontSize: 13
                }}
              >
                {item.rating} ({item.totalReviews})
              </Typography>
            </View>
          )}

          {/* Price */}
          <View style={[
            styles.priceContainer,
            { flexDirection: isRTL ? 'row' : 'row-reverse', alignItems: 'center' }
          ]}>
            <CreditCard size={11} color={colors.gray[600]} />
            <Typography
              variant="caption"
              color="textSecondary"
              style={{
                marginLeft: isRTL ? 3 : 0,
                marginRight: isRTL ? 0 : 3,
                fontSize: 13
              }}
            >
              {item.hourlyRate}/לשעה
            </Typography>
          </View>

          {/* Availability */}
          {item.nextAvailable && (
            <View style={[
              styles.availabilityContainer,
              { flexDirection: isRTL ? 'row' : 'row-reverse', alignItems: 'center' }
            ]}>
              <Clock size={10} color={colors.success[600]} />
              <Typography
                variant="caption"
                color="success"
                style={{
                  marginLeft: isRTL ? 3 : 0,
                  marginRight: isRTL ? 0 : 3,
                  fontSize: 13
                }}
              >
                {item.nextAvailable}
              </Typography>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Card>
  );

  const styles = createStyle({
    container: {
      flex: 1,
      backgroundColor: colors.gray[50],
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

    teacherCardRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing[2],
    },

    teacherCardRowLTR: {
      flexDirection: 'row',
    },

    teacherCardRowRTL: {
      flexDirection: 'row-reverse',
    },

    teacherInfo: {
      flex: 1,
      gap: spacing[1],
    },

    teacherInfoLTR: {
      flex: 1,
    },

    teacherInfoRTL: {
      flex: 1,
    },

    subjectsContainer: {
      flexWrap: 'wrap',
      gap: spacing[1],
    },

    subjectBadge: {
      backgroundColor: colors.primary[50],
      borderRadius: 8,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },

    metaContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 6,
    },

    leftMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },

    priceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },

    availabilityContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
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

      {/* Info Banner - replaces greeting and search */}
      <InfoBanner
        messages={bannerMessages}
        autoRotateInterval={10000}
      />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 0 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Subject Filters */}
          <View style={styles.subjectsSection}>
            <Typography variant="h5" weight="semibold" align="right" style={styles.sectionTitle}>
              {t('home.popularSubjects')}
            </Typography>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.subjectsScroll}
              contentContainerStyle={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}
            >
              {popularSubjects.map((subject, index) => (
                <TouchableOpacity
                  key={index}
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
              ))}
            </ScrollView>
          </View>

          {/* Featured Teachers */}
          <View style={styles.teachersSection}>
            <Typography variant="h5" weight="semibold" align="right" style={styles.sectionTitle}>
              {t('home.featuredTeachers')}
            </Typography>

            <FlatList
              data={filteredTeachers}
              renderItem={renderTeacherCard}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: spacing[4],
                flexDirection: isRTL ? 'row-reverse' : 'row'
              }}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Typography variant="body1" color="textSecondary">
                    {t('home.noTeachersFound')}
                  </Typography>
                </View>
              }
            />
          </View>

          {/* Featured Categories */}
          <View style={styles.categoriesSection}>
            <Typography variant="h5" weight="semibold" align="right" style={styles.sectionTitle}>
              {t('home.featuredCategories')}
            </Typography>
            <View style={styles.categoriesGrid}>
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
                <View style={[styles.offerRow, { flexDirection: getFlexDirection() }]}>
                  <Gift size={32} color={colors.primary[600]} />
                  <View style={styles.offerText}>
                    <Typography variant="h5" weight="bold" color="primary" align="right">
                      {t('home.specialOffer')}
                    </Typography>
                    <Typography variant="body1" style={{ marginTop: spacing[1] }} align="right">
                      {t('home.firstLessonFree')}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" style={{ marginTop: spacing[1] }} align="right">
                      {t('home.newStudentOffer')}
                    </Typography>
                  </View>
                </View>
                <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                  <TouchableOpacity style={styles.offerButton}>
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