import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Star,
  Clock,
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

const { width } = Dimensions.get('window');

interface TeacherProfile {
  id: string;
  displayName: string;
  bio: string;
  avatarUrl?: string;
  videoUrl?: string;
  hourlyRate: number;
  subjects: string[];
  languages: string[];
  location: string;
  rating: number;
  totalReviews: number;
  totalStudents: number;
  experience: string;
  education: string[];
  availability: {
    [key: string]: string[];
  };
  reviews: {
    id: string;
    studentName: string;
    rating: number;
    text: string;
    date: string;
  }[];
}

// Mock data - will be replaced with actual API call
const mockTeacher: TeacherProfile = {
  id: '1',
  displayName: 'שרה כהן',
  bio: 'מורה מתמטיקה ופיזיקה מלאת תשוקה עם מעל 10 שנות ניסיון. אני מתמחה בעזרה לתלמידים להבין מושגים מורכבים באמצעות דוגמאות מעשיות ושיטות למידה אינטראקטיביות.',
  avatarUrl: undefined,
  videoUrl: undefined,
  hourlyRate: 120,
  subjects: ['מתמטיקה', 'פיזיקה', 'חשבון דיפרנציאלי'],
  languages: ['עברית', 'אנגלית'],
  location: 'תל אביב',
  rating: 4.8,
  totalReviews: 45,
  totalStudents: 120,
  experience: '10+ שנים',
  education: [
    'דוקטורט במתמטיקה - אוניברסיטת תל אביב',
    'מוסמך בפיזיקה - האוניברסיטה העברית',
  ],
  availability: {
    'ראשון': ['09:00', '10:00', '11:00', '14:00', '15:00'],
    'שני': ['09:00', '10:00', '11:00'],
    'שלישי': ['14:00', '15:00', '16:00'],
    'רביעי': ['09:00', '10:00', '11:00', '14:00'],
    'חמישי': ['14:00', '15:00', '16:00', '17:00'],
  },
  reviews: [
    {
      id: '1',
      studentName: 'דוד ל.',
      rating: 5,
      text: 'שרה היא מורה מדהימה! היא עזרה לי להבין חשבון דיפרנציאלי בצורה שסוף סוף הייתה הגיונית.',
      date: '15/01/2024',
    },
    {
      id: '2',
      studentName: 'רחל מ.',
      rating: 4,
      text: 'מאוד סבלנית ובעלת ידע. מומלצת בחום לתלמידי פיזיקה.',
      date: '10/01/2024',
    },
  ],
};

export default function TeacherProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { isRTL, getFlexDirection } = useRTL();
  const [activeTab, setActiveTab] = useState<'about' | 'availability' | 'reviews'>('about');

  const { data: teacher = mockTeacher, isLoading } = useQuery({
    queryKey: ['teacher', id],
    queryFn: async () => {
      // Placeholder - will query Supabase
      return mockTeacher;
    },
  });

  const handleBooking = () => {
    router.push({
      pathname: '/(booking)/calendar',
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
      backgroundColor: colors.white,
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[1],
      borderTopWidth: 1,
      borderTopColor: colors.gray[200],
    },
    subjectsContainer: {
      flexWrap: 'wrap',
      gap: spacing[2],
      marginTop: spacing[2],
    },
    subjectBadge: {
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[1],
      backgroundColor: colors.secondary[100],
      borderRadius: 16,
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

      <ScrollView style={{ flex: 1 }}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={[styles.profileRow, { flexDirection: getFlexDirection() }]}>
            <View style={styles.avatar}>
              <Typography variant="h4" color="white" align="center">
                {teacher.displayName.charAt(0)}
              </Typography>
            </View>
            <View style={[styles.profileInfo, isRTL ? styles.profileInfoRTL : styles.profileInfoLTR]}>
              <Typography variant="h2" weight="bold">
                {teacher.displayName}
              </Typography>
              <View style={[styles.locationRow, { flexDirection: getFlexDirection() }]}>
                <MapPin size={14} color={colors.gray[600]} />
                <Typography variant="body2" color="textSecondary" style={{ marginHorizontal: spacing[1] }}>
                  {teacher.location}
                </Typography>
              </View>
              <View style={[styles.languageRow, { flexDirection: getFlexDirection() }]}>
                <Globe size={14} color={colors.gray[600]} />
                <Typography variant="body2" color="textSecondary" style={{ marginHorizontal: spacing[1] }}>
                  {teacher.languages.join(', ')}
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
                {teacher.rating} ({teacher.totalReviews} {t('teacher.totalReviews')})
              </Typography>
            </View>
            <View style={styles.statsItem}>
              <Typography variant="h5" weight="bold">
                {teacher.totalStudents}
              </Typography>
              <Typography variant="caption" color="textSecondary">{t('teacher.students')}</Typography>
            </View>
            <View style={styles.statsItem}>
              <Typography variant="h5" weight="bold">
                {teacher.hourlyRate}
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
                      {teacher.bio}
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
                          {subject}
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
                  {teacher.education.map((edu, index) => (
                    <View key={index} style={[styles.educationItem, { flexDirection: getFlexDirection() }]}>
                      <CheckCircle size={16} color={colors.success[600]} />
                      <Typography variant="body1" color="text" style={{ marginHorizontal: spacing[2], flex: 1 }}>
                        {edu}
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
                  <Typography variant="body1" color="text">
                    {teacher.experience}
                  </Typography>
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
                      {day}
                    </Typography>
                    <View style={[styles.subjectsContainer, { flexDirection: getFlexDirection() }]}>
                      {times.map((time, index) => (
                        <View key={index} style={[styles.subjectBadge, { backgroundColor: colors.gray[100], borderWidth: 1, borderColor: colors.gray[300] }]}>
                          <Typography variant="body2" color="text">
                            {time}
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
                        {review.studentName}
                      </Typography>
                      <View style={{ flexDirection: getFlexDirection() }}>
                        {renderStars(review.rating)}
                      </View>
                    </View>
                    <Typography variant="body1" color="text" style={{ marginBottom: spacing[1] }}>
                      {review.text}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {review.date}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
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
          <ButtonText style={{ fontVariant: 'tabular-nums', color: 'white', fontSize: 18, fontWeight: '600' }}>
            {`${t('teacher.bookNow')} - ${priceText}`}
          </ButtonText>
        </Button>
      </View>
    </SafeAreaView>
  );
}