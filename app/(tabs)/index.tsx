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
      padding="none"
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
      }}
    >
      <TouchableOpacity
        onPress={() => router.push(`/(tabs)/teacher/${item.id}`)}
        activeOpacity={0.98}
        style={{ padding: spacing[3] }}
      >
        {/* Header: Avatar + Name + Rating */}
        <View style={{
          flexDirection: 'row-reverse',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing[2],
        }}>
          {/* Right side: Avatar + Name */}
          <View style={{
            flexDirection: 'row-reverse',
            alignItems: 'center',
            gap: spacing[2],
            flex: 1,
          }}>
            {/* Avatar */}
            <View style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: colors.primary[600],
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: colors.primary[100],
            }}>
              <Typography variant="body2" color="white" weight="bold">
                {item.displayName.charAt(0)}
              </Typography>
            </View>

            {/* Name - right aligned */}
            <Typography
              variant="body1"
              weight="semibold"
              numberOfLines={1}
              style={{ flex: 1, fontSize: 16, textAlign: 'right' }}
            >
              {item.displayName}
            </Typography>
          </View>

          {/* Left side: Rating */}
          {item.rating && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}>
              <Typography
                variant="caption"
                color="textSecondary"
                style={{ fontSize: 11 }}
              >
                ({item.totalReviews})
              </Typography>
              <Typography
                variant="caption"
                weight="medium"
                style={{ fontSize: 13 }}
              >
                {item.rating}
              </Typography>
              <Star size={13} color={colors.warning[500]} fill={colors.warning[500]} />
            </View>
          )}
        </View>

        {/* Meta Strip: Price + Time - right aligned */}
        <View style={{
          flexDirection: 'row-reverse',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: spacing[2],
          marginBottom: spacing[2],
        }}>
          {/* Price Pill - neutral brand style */}
          <View style={{
            backgroundColor: colors.gray[100],
            paddingHorizontal: spacing[3],
            paddingVertical: spacing[2] - 2,
            borderRadius: 9999,
            borderWidth: 1,
            borderColor: colors.gray[200],
            flexDirection: 'row-reverse',
            alignItems: 'center',
            gap: 4,
          }}>
            <Typography
              variant="body2"
              weight="semibold"
              style={{ fontSize: 14, color: colors.gray[900] }}
            >
              ₪{item.hourlyRate}
            </Typography>
            <Typography
              variant="caption"
              style={{ fontSize: 11, color: colors.gray[600] }}
            >
              /שעה
            </Typography>
          </View>

          {/* Separator */}
          <View style={{
            width: 3,
            height: 3,
            borderRadius: 1.5,
            backgroundColor: colors.gray[400],
          }} />

          {/* Availability */}
          {item.nextAvailable ? (
            <View style={{
              flexDirection: 'row-reverse',
              alignItems: 'center',
              gap: 4,
            }}>
              <Clock size={13} color={colors.success[600]} />
              <Typography
                variant="caption"
                color="success"
                weight="medium"
                style={{ fontSize: 13 }}
              >
                {item.nextAvailable}
              </Typography>
            </View>
          ) : (
            <Typography
              variant="caption"
              color="textSecondary"
              style={{ fontSize: 12, textAlign: 'right' }}
            >
              זמינות גמישה
            </Typography>
          )}
        </View>

        {/* Subjects Chips - right aligned */}
        <View style={{
          flexDirection: 'row-reverse',
          flexWrap: 'wrap',
          gap: spacing[2],
          marginBottom: spacing[1] + 2,
          justifyContent: 'flex-start',
        }}>
          {item.subjects.slice(0, 3).map((subject, index) => (
            <View
              key={index}
              style={{
                backgroundColor: colors.gray[100],
                paddingHorizontal: spacing[2] + 2,
                paddingVertical: spacing[1] + 2,
                borderRadius: 9999,
                borderWidth: 1,
                borderColor: colors.gray[200],
              }}
            >
              <Typography
                variant="caption"
                style={{
                  fontSize: 12,
                  color: colors.gray[700],
                  textAlign: 'right',
                }}
              >
                {t(`home.subjects.${subject}`)}
              </Typography>
            </View>
          ))}
          {item.subjects.length > 3 && (
            <View style={{
              paddingHorizontal: spacing[2],
              paddingVertical: spacing[1] + 2,
            }}>
              <Typography
                variant="caption"
                color="textSecondary"
                style={{ fontSize: 11, textAlign: 'right' }}
              >
                +{item.subjects.length - 3} עוד
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
        contentContainerStyle={{ paddingBottom: 0 }}
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
                יוסי כהן
              </Typography>
            </View>
            <View style={styles.userAvatar}>
              <Typography variant="h5" color="white" weight="bold">
                י
              </Typography>
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

            <FlatList
              data={filteredTeachers}
              renderItem={renderTeacherCard}
              keyExtractor={(item) => item.id}
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