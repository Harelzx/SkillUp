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
const mockTeachers: TeacherProfile[] = [
  {
    id: '1',
    displayName: 'ד"ר שרה כהן',
    bio: 'דוקטורט במתמטיקה מאוניברסיטת תל-אביב. מתמחה בחשבון דיפרנציאלי, אלגברה ליניארית וסטטיסטיקה. 12 שנות ניסיון בהוראה אקדמית',
    avatarUrl: undefined,
    videoUrl: undefined,
    hourlyRate: 150,
    subjects: ['מתמטיקה', 'פיזיקה', 'חשבון דיפרנציאלי'],
    languages: ['עברית', 'אנגלית'],
    location: 'תל אביב',
    rating: 4.9,
    totalReviews: 127,
    totalStudents: 245,
    experience: '12 שנים',
    education: [
      'דוקטורט במתמטיקה - אוניברסיטת תל אביב',
      'מוסמך בפיזיקה - הטכניון',
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
        rating: 5,
        text: 'מאוד סבלנית ובעלת ידע. מומלצת בחום לתלמידי מתמטיקה.',
        date: '10/01/2024',
      },
    ],
  },
  {
    id: '2',
    displayName: 'דוד לוי',
    bio: 'מורה אנגלית בכיר עם תואר שני מאוניברסיטת הרווארד. מתמחה בהכנה לבחינות בגרות, פסיכומטרי ואיילטס',
    avatarUrl: undefined,
    videoUrl: undefined,
    hourlyRate: 120,
    subjects: ['אנגלית', 'ספרות'],
    languages: ['עברית', 'אנגלית'],
    location: 'רמת גן',
    rating: 4.8,
    totalReviews: 89,
    totalStudents: 186,
    experience: '8 שנים',
    education: [
      'תואר שני באנגלית - אוניברסיטת הרווארד',
      'תואר ראשון בספרות - האוניברסיטה העברית',
    ],
    availability: {
      'ראשון': ['14:00', '15:00', '16:00'],
      'שני': ['09:00', '10:00', '14:00', '15:00'],
      'שלישי': ['09:00', '10:00', '11:00'],
      'רביעי': ['14:00', '15:00', '16:00', '17:00'],
      'חמישי': ['09:00', '10:00'],
    },
    reviews: [
      {
        id: '1',
        studentName: 'מירי כ.',
        rating: 5,
        text: 'דוד עזר לי מאוד להכין לבחינת האיילטס. קיבלתי ציון 8!',
        date: '20/01/2024',
      },
    ],
  },
  {
    id: '3',
    displayName: 'רחל מור',
    bio: 'פסנתרנית קונצרטים ומורה למוזיקה. בוגרת האקדמיה למוזיקה ירושלים. מתמחה בכל הגילאים ורמות הידע',
    avatarUrl: undefined,
    videoUrl: undefined,
    hourlyRate: 110,
    subjects: ['מוזיקה', 'פסנתר'],
    languages: ['עברית', 'אנגלית', 'רוסית'],
    location: 'ירושלים',
    rating: 4.9,
    totalReviews: 156,
    totalStudents: 320,
    experience: '15 שנים',
    education: [
      'תואר במוזיקה - האקדמיה למוזיקה ירושלים',
      'הסמכה בהוראת פסנתר - המכללה למוזיקה',
    ],
    availability: {
      'ראשון': ['10:00', '11:00', '15:00', '16:00'],
      'שני': ['10:00', '11:00', '15:00', '16:00'],
      'שלישי': ['10:00', '11:00', '15:00', '16:00'],
      'רביעי': ['10:00', '11:00', '15:00', '16:00'],
      'חמישי': ['10:00', '11:00'],
    },
    reviews: [
      {
        id: '1',
        studentName: 'יעל ש.',
        rating: 5,
        text: 'מורה מעולה! בתי התקדמה מאוד במשך שנה.',
        date: '18/01/2024',
      },
    ],
  },
  {
    id: '4',
    displayName: 'פרופ\' אבי דוד',
    bio: 'פרופסור לפיזיקה באוניברסיטת תל-אביב. מתמחה בפיזיקה תיאורטית, מכניקת הקוונטים ואסטרופיזיקה',
    avatarUrl: undefined,
    videoUrl: undefined,
    hourlyRate: 200,
    subjects: ['פיזיקה', 'מתמטיקה'],
    languages: ['עברית', 'אנגלית'],
    location: 'תל אביב',
    rating: 5.0,
    totalReviews: 43,
    totalStudents: 98,
    experience: '20 שנים',
    education: [
      'דוקטורט בפיזיקה תיאורטית - אוניברסיטת תל אביב',
      'תואר שני במכניקת קוונטים - MIT',
    ],
    availability: {
      'ראשון': ['11:00', '12:00', '16:00', '17:00'],
      'שני': ['11:00', '12:00'],
      'שלישי': ['11:00', '12:00', '16:00', '17:00'],
      'רביעי': ['11:00', '12:00'],
      'חמישי': ['16:00', '17:00'],
    },
    reviews: [
      {
        id: '1',
        studentName: 'אריאל ב.',
        rating: 5,
        text: 'פרופסור מצוין! הסברים ברורים ומעמיקים בפיזיקה תיאורטית.',
        date: '12/01/2024',
      },
      {
        id: '2',
        studentName: 'נועה ר.',
        rating: 5,
        text: 'המורה הכי טוב שהיה לי. עזר לי להבין מכניקת קוונטים.',
        date: '08/01/2024',
      },
    ],
  },
  {
    id: '5',
    displayName: 'מיכל גרין',
    bio: 'מפתחת תוכנה ב-Google ומורה לתכנות. 8 שנות ניסיון בפיתוח אפליקציות ובהוראה טכנולוגית. מתמחה ב-Python ו-JavaScript',
    avatarUrl: undefined,
    videoUrl: undefined,
    hourlyRate: 140,
    subjects: ['תכנות', 'מתמטיקה'],
    languages: ['עברית', 'אנגלית'],
    location: 'תל אביב',
    rating: 4.7,
    totalReviews: 94,
    totalStudents: 156,
    experience: '8 שנים',
    education: [
      'תואר ראשון במדעי המחשב - אוניברסיטת תל אביב',
      'קורסים מתקדמים ב-Full Stack Development',
    ],
    availability: {
      'ראשון': ['18:00', '19:00', '20:00'],
      'שני': ['18:00', '19:00', '20:00'],
      'שלישי': ['18:00', '19:00', '20:00'],
      'רביעי': ['18:00', '19:00', '20:00'],
      'חמישי': ['18:00', '19:00'],
    },
    reviews: [
      {
        id: '1',
        studentName: 'עומר ש.',
        rating: 5,
        text: 'מיכל עזרה לי מאוד ללמוד React ו-Node.js. המלצה חמה!',
        date: '16/01/2024',
      },
      {
        id: '2',
        studentName: 'רותם כ.',
        rating: 4,
        text: 'מורה מצוינת עם ידע רחב בתכנות.',
        date: '11/01/2024',
      },
    ],
  },
  {
    id: '6',
    displayName: 'יוסף נחמני',
    bio: 'מורה לכימיה ובעל דוקטורט בכימיה אורגנית מהטכניון. מתמחה בהכנה לבגרות, בחינות קבלה ותואר ראשון',
    avatarUrl: undefined,
    videoUrl: undefined,
    hourlyRate: 130,
    subjects: ['כימיה', 'פיזיקה'],
    languages: ['עברית', 'אנגלית', 'ערבית'],
    location: 'חיפה',
    rating: 4.8,
    totalReviews: 67,
    totalStudents: 142,
    experience: '11 שנים',
    education: [
      'דוקטורט בכימיה אורגנית - הטכניון',
      'תואר שני בכימיה - אוניברסיטת בן גוריון',
    ],
    availability: {
      'ראשון': ['14:00', '15:00', '16:00', '19:00'],
      'שני': ['14:00', '15:00', '16:00'],
      'שלישי': ['14:00', '15:00', '16:00', '19:00'],
      'רביעי': ['14:00', '15:00', '16:00'],
      'חמישי': ['14:00', '15:00', '19:00'],
    },
    reviews: [
      {
        id: '1',
        studentName: 'דניאל מ.',
        rating: 5,
        text: 'יוסף עזר לי לעבור כימיה אורגנית עם ציון 95!',
        date: '19/01/2024',
      },
    ],
  },
  {
    id: '7',
    displayName: 'לינה עבאס',
    bio: 'בעלת תואר שני בהיסטוריה ובלשנות מהאוניברסיטה העברית. מתמחה בהיסטוריה של המזרח התיכון ולימודי ערבית',
    avatarUrl: undefined,
    videoUrl: undefined,
    hourlyRate: 90,
    subjects: ['היסטוריה', 'אנגלית'],
    languages: ['עברית', 'אנגלית', 'ערבית'],
    location: 'ירושלים',
    rating: 4.6,
    totalReviews: 38,
    totalStudents: 89,
    experience: '6 שנים',
    education: [
      'תואר שני בהיסטוריה - האוניברסיטה העברית',
      'תואר ראשון בלשנות - אוניברסיטת בן גוריון',
    ],
    availability: {
      'ראשון': ['10:00', '11:00', '16:00', '17:00'],
      'שני': ['10:00', '11:00', '16:00'],
      'שלישי': ['10:00', '11:00', '16:00', '17:00'],
      'רביעי': ['10:00', '11:00'],
      'חמישי': ['16:00', '17:00'],
    },
    reviews: [
      {
        id: '1',
        studentName: 'איתי ל.',
        rating: 5,
        text: 'לינה היא מורה מעולה להיסטוריה. הסברים ברורים ומעניינים.',
        date: '14/01/2024',
      },
    ],
  },
  {
    id: '8',
    displayName: 'אליעזר כהן',
    bio: 'אמן פלסטי ומורה לציור ועיצוב גרפי. 15 שנות ניסיון בהוראת אמנות, ציור דיגיטלי ויצירה מולטימדיה',
    avatarUrl: undefined,
    videoUrl: undefined,
    hourlyRate: 100,
    subjects: ['אמנות', 'תכנות'],
    languages: ['עברית', 'אנגלית'],
    location: 'תל אביב',
    rating: 4.5,
    totalReviews: 52,
    totalStudents: 127,
    experience: '15 שנים',
    education: [
      'תואר במוזיקה ואמנות - בצלאל',
      'קורס עיצוב גרפי מתקדם - Shenkar',
    ],
    availability: {
      'ראשון': ['10:00', '11:00', '12:00'],
      'שני': ['10:00', '11:00', '12:00', '15:00'],
      'שלישי': ['10:00', '11:00', '12:00'],
      'רביעי': ['10:00', '11:00', '15:00'],
      'חמישי': ['10:00', '11:00', '12:00'],
    },
    reviews: [
      {
        id: '1',
        studentName: 'שירה ד.',
        rating: 5,
        text: 'אליעזר עזר לי מאוד לפתח את הכישורים האמנותיים שלי.',
        date: '21/01/2024',
      },
    ],
  },
  {
    id: '9',
    displayName: 'עידו שמואלי',
    bio: 'מאמן אישי מוסמך עם 10 שנות ניסיון באימוני כוח וריצות מרתון. התמחות באימונים פונקציונליים ו-TRX',
    avatarUrl: undefined,
    videoUrl: undefined,
    hourlyRate: 180,
    subjects: ['אימון אישי', 'ריצה', 'TRX', 'כושר'],
    languages: ['עברית', 'אנגלית'],
    location: 'תל אביב',
    rating: 4.9,
    totalReviews: 156,
    totalStudents: 320,
    experience: '10 שנים',
    education: [
      'הסמכה בהדרכת כושר - Wingate Institute',
      'קורס אימון אישי מתקדם',
    ],
    availability: {
      'ראשון': ['06:00', '07:00', '17:00', '18:00'],
      'שני': ['06:00', '07:00', '17:00', '18:00', '19:00'],
      'שלישי': ['06:00', '07:00', '17:00', '18:00'],
      'רביעי': ['06:00', '07:00', '17:00', '18:00', '19:00'],
      'חמישי': ['06:00', '07:00', '17:00', '18:00'],
    },
    reviews: [
      {
        id: '1',
        studentName: 'אלון מ.',
        rating: 5,
        text: 'עידו הוא מאמן מדהים! עזר לי להגיע לכושר הטוב ביותר שלי.',
        date: '22/01/2024',
      },
    ],
  },
  {
    id: '10',
    displayName: 'דנה פרידמן',
    bio: 'מורה ליוגה ופילאטיס מוסמכת. בוגרת לימודי יוגה בהודו והתמחות בפילאטיס טיפולי. מתמחה בכל רמות הידע',
    avatarUrl: undefined,
    videoUrl: undefined,
    hourlyRate: 160,
    subjects: ['יוגה', 'פילאטיס', 'כושר'],
    languages: ['עברית', 'אנגלית'],
    location: 'רמת גן',
    rating: 4.8,
    totalReviews: 203,
    totalStudents: 410,
    experience: '8 שנים',
    education: [
      'תעודת הוראת יוגה - Rishikesh Yog Peeth',
      'הסמכה בפילאטיס טיפולי',
    ],
    availability: {
      'ראשון': ['08:00', '09:00', '10:00', '17:00', '18:00'],
      'שני': ['08:00', '09:00', '10:00', '17:00', '18:00'],
      'שלישי': ['08:00', '09:00', '10:00'],
      'רביעי': ['08:00', '09:00', '10:00', '17:00', '18:00'],
      'חמישי': ['08:00', '09:00', '10:00', '17:00', '18:00'],
    },
    reviews: [
      {
        id: '1',
        studentName: 'שירה ל.',
        rating: 5,
        text: 'דנה היא מורה נפלאה עם גישה אישית וסבלנית.',
        date: '25/01/2024',
      },
    ],
  },
  {
    id: '11',
    displayName: 'ד"ר אביב כהן',
    bio: 'דוקטורט במתמטיקה שימושית מהטכניון. מתמחה בהוראת חדו״א, אלגברה לינארית וסטטיסטיקה לסטודנטים במדעים',
    avatarUrl: undefined,
    videoUrl: undefined,
    hourlyRate: 220,
    subjects: ['חדו״א', 'אלגברה לינארית', 'סטטיסטיקה', 'מתמטיקה'],
    languages: ['עברית', 'אנגלית'],
    location: 'חיפה',
    rating: 4.9,
    totalReviews: 187,
    totalStudents: 520,
    experience: '15 שנים',
    education: [
      'דוקטורט במתמטיקה שימושית - הטכניון',
      'תואר שני במתמטיקה - האוניברסיטה העברית',
    ],
    availability: {
      'ראשון': ['10:00', '11:00', '15:00', '16:00', '17:00'],
      'שני': ['10:00', '11:00', '15:00', '16:00'],
      'שלישי': ['10:00', '11:00', '15:00', '16:00', '17:00'],
      'רביעי': ['10:00', '11:00', '15:00', '16:00'],
      'חמישי': ['10:00', '11:00', '15:00', '16:00', '17:00'],
    },
    reviews: [
      {
        id: '1',
        studentName: 'יונתן ר.',
        rating: 5,
        text: 'ד"ר כהן עזר לי לעבור חדו"א עם ציון מעולה. הסברים ברורים ומקצועיים.',
        date: '28/01/2024',
      },
    ],
  },
  {
    id: '12',
    displayName: 'מיכל לוי',
    bio: 'בוגרת תואר שני בכלכלה מאוניברסיטת תל-אביב. מתמחה בהוראת מיקרו, מאקרו ומימון לתואר ראשון',
    avatarUrl: undefined,
    videoUrl: undefined,
    hourlyRate: 200,
    subjects: ['כלכלת מיקרו', 'כלכלת מאקרו', 'מימון'],
    languages: ['עברית', 'אנגלית'],
    location: 'תל אביב',
    rating: 4.7,
    totalReviews: 142,
    totalStudents: 285,
    experience: '9 שנים',
    education: [
      'תואר שני בכלכלה - אוניברסיטת תל אביב',
      'תואר ראשון בכלכלה וחשבונאות - המכללה למנהל',
    ],
    availability: {
      'ראשון': ['09:00', '10:00', '14:00', '15:00', '16:00'],
      'שני': ['09:00', '10:00', '14:00', '15:00'],
      'שלישי': ['09:00', '10:00', '14:00', '15:00', '16:00'],
      'רביעי': ['09:00', '10:00', '14:00', '15:00'],
      'חמישי': ['09:00', '10:00', '14:00', '15:00', '16:00'],
    },
    reviews: [
      {
        id: '1',
        studentName: 'תומר ב.',
        rating: 5,
        text: 'מיכל הסבירה לי כלכלה בצורה הכי ברורה שיכולתי לקבל. תודה רבה!',
        date: '30/01/2024',
      },
    ],
  },
];

export default function TeacherProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { isRTL, getFlexDirection } = useRTL();
  const [activeTab, setActiveTab] = useState<'about' | 'availability' | 'reviews'>('about');

  const { data: teacher, isLoading, error } = useQuery({
    queryKey: ['teacher', id],
    queryFn: async () => {
      // Placeholder - will query Supabase
      // For now, find teacher from mock data by ID
      const foundTeacher = mockTeachers.find(t => t.id === id);
      if (!foundTeacher) {
        throw new Error('Teacher not found');
      }
      return foundTeacher;
    },
    enabled: !!id, // Only run query if ID exists
  });

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
          <ButtonText style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>
            {`${t('teacher.bookNow')} - ${priceText}`}
          </ButtonText>
        </Button>
      </View>
    </SafeAreaView>
  );
}