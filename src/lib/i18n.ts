import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

const resources = {
  en: {
    translation: {
      common: {
        search: 'Search',
        cancel: 'Cancel',
        save: 'Save',
        delete: 'Delete',
        edit: 'Edit',
        back: 'Back',
        next: 'Next',
        finish: 'Finish',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        confirm: 'Confirm',
      },
      auth: {
        signIn: 'Sign In',
        signUp: 'Sign Up',
        signOut: 'Sign Out',
        email: 'Email',
        password: 'Password',
        forgotPassword: 'Forgot Password?',
        createAccount: 'Create Account',
        alreadyHaveAccount: 'Already have an account?',
        dontHaveAccount: "Don't have an account?",
        role: 'I am a',
        teacher: 'Teacher',
        student: 'Student',
      },
      home: {
        welcome: 'Welcome to SkillUp',
        findTeacher: 'Find Your Perfect Teacher',
        popularSubjects: 'Popular Subjects',
        featuredTeachers: 'Featured Teachers',
        searchPlaceholder: 'Search for subjects or teachers...',
      },
      teacher: {
        about: 'About',
        subjects: 'Subjects',
        availability: 'Availability',
        reviews: 'Reviews',
        hourlyRate: 'Hourly Rate',
        bookNow: 'Book Now',
        experience: 'Experience',
        education: 'Education',
        languages: 'Languages',
      },
      booking: {
        selectDate: 'Select Date',
        selectTime: 'Select Time',
        duration: 'Duration',
        total: 'Total',
        confirmBooking: 'Confirm Booking',
        bookingConfirmed: 'Booking Confirmed',
        upcomingLessons: 'Upcoming Lessons',
        pastLessons: 'Past Lessons',
      },
      payment: {
        paymentMethod: 'Payment Method',
        addCard: 'Add Card',
        pay: 'Pay',
        processing: 'Processing Payment...',
        paymentSuccessful: 'Payment Successful',
        paymentFailed: 'Payment Failed',
      },
    },
  },
  he: {
    translation: {
      common: {
        search: 'חיפוש',
        cancel: 'ביטול',
        save: 'שמור',
        delete: 'מחק',
        edit: 'ערוך',
        back: 'חזור',
        next: 'הבא',
        finish: 'סיום',
        loading: 'טוען...',
        error: 'שגיאה',
        success: 'הצלחה',
        confirm: 'אשר',
      },
      auth: {
        signIn: 'התחברות',
        signUp: 'הרשמה',
        signOut: 'התנתקות',
        email: 'דוא"ל',
        password: 'סיסמה',
        forgotPassword: 'שכחת סיסמה?',
        createAccount: 'צור חשבון',
        alreadyHaveAccount: 'יש לך כבר חשבון?',
        dontHaveAccount: 'אין לך חשבון?',
        role: 'אני',
        teacher: 'מורה',
        student: 'תלמיד',
      },
      home: {
        welcome: 'ברוכים הבאים ל-SkillUp',
        findTeacher: 'מצא את המורה המושלם עבורך',
        popularSubjects: 'נושאים פופולריים',
        featuredTeachers: 'מורים מומלצים',
        searchPlaceholder: 'חפש נושאים או מורים...',
        noTeachersFound: 'לא נמצאו מורים',
        featuredCategories: 'קטגוריות מובילות',
        quickStats: 'מה מייחד אותנו',
        totalTeachers: 'מורים פעילים',
        totalStudents: 'תלמידים מרוצים',
        totalLessons: 'שיעורים בוצעו',
        avgRating: 'דירוג ממוצע',
        specialOffer: 'הצעה מיוחדת',
        firstLessonFree: 'השיעור הראשון חינם!',
        newStudentOffer: 'להרשמה חדשה - חסוך עד 50%',
        testimonials: 'מה הלקוחות שלנו אומרים',
        joinNow: 'הצטרף עכשיו',
        learnMore: 'למד עוד',
        subjects: {
          mathematics: 'מתמטיקה',
          english: 'אנגלית',
          physics: 'פיזיקה',
          chemistry: 'כימיה',
          history: 'היסטוריה',
          music: 'מוזיקה',
          art: 'אמנות',
          programming: 'תכנות',
          literature: 'ספרות',
          piano: 'פסנתר',
        },
      },
      teacher: {
        about: 'אודות',
        subjects: 'נושאים',
        availability: 'זמינות',
        reviews: 'ביקורות',
        hourlyRate: 'תעריף שעתי',
        bookNow: 'הזמן עכשיו',
        experience: 'ניסיון',
        education: 'השכלה',
        languages: 'שפות',
        aboutMe: 'אודותיי',
        weeklySchedule: 'לוח שבועי',
        students: 'תלמידים',
        perHour: 'לשעה',
        watchIntroduction: 'צפה בהקדמה',
        location: 'מיקום',
        totalReviews: 'ביקורות',
        calculus: 'חשבון דיפרנציאלי',
        sunday: 'ראשון',
        monday: 'שני',
        tuesday: 'שלישי',
        wednesday: 'רביעי',
        thursday: 'חמישי',
        friday: 'שישי',
        saturday: 'שבת',
      },
      tabs: {
        home: 'בית',
        search: 'חיפוש',
        lessons: 'השיעורים שלי',
        profile: 'פרופיל',
      },
      search: {
        title: 'חיפוש מורים',
        placeholder: 'חפש מורה או נושא...',
        categories: 'קטגוריות',
        popular: 'חיפושים פופולריים',
        popularSearches: 'מתמטיקה, אנגלית, פיזיקה, מוזיקה',
        filters: 'סינון',
        price: 'מחיר',
        availability: 'זמינות',
        location: 'מיקום',
        rating: 'דירוג',
      },
      lessons: {
        title: 'השיעורים שלי',
        upcoming: 'קרובים',
        past: 'עבר',
        noUpcoming: 'אין שיעורים קרובים',
        noPast: 'אין שיעורים קודמים',
        noUpcomingDescription: 'כאשר תזמין שיעורים, הם יופיעו כאן',
        noPastDescription: 'היסטוריית השיעורים שלך תופיע כאן',
        bookFirst: 'הזמן שיעור ראשון',
        reschedule: 'דחה',
        cancel: 'בטל',
        bookAgain: 'הזמן שוב',
        status: {
          upcoming: 'קרוב',
          completed: 'הושלם',
          cancelled: 'בוטל',
        },
      },
      profile: {
        title: 'פרופיל',
        account: 'חשבון',
        rewards: 'תגמולים',
        support: 'תמיכה',
        editProfile: 'ערוך פרופיל',
        paymentMethods: 'אמצעי תשלום',
        notifications: 'התראות',
        referrals: 'הפניות',
        myReviews: 'הביקורות שלי',
        help: 'עזרה',
        privacy: 'פרטיות',
        settings: 'הגדרות',
        logout: 'התנתק',
        logoutConfirm: 'האם אתה בטוח שברצונך להתנתק?',
        totalLessons: 'שיעורים',
        memberSince: 'חבר מאז',
        version: 'גרסה',
      },
      common: {
        cancel: 'בטל',
        confirm: 'אשר',
        save: 'שמור',
        edit: 'ערוך',
        delete: 'מחק',
        back: 'חזור',
        next: 'הבא',
        done: 'סיום',
        loading: 'טוען...',
      },
      booking: {
        selectDate: 'בחר תאריך',
        selectTime: 'בחר שעה',
        duration: 'משך',
        total: 'סה"כ',
        confirmBooking: 'אשר הזמנה',
        bookingConfirmed: 'ההזמנה אושרה',
        upcomingLessons: 'שיעורים קרובים',
        pastLessons: 'שיעורים קודמים',
      },
      payment: {
        paymentMethod: 'אמצעי תשלום',
        addCard: 'הוסף כרטיס',
        pay: 'שלם',
        processing: 'מעבד תשלום...',
        paymentSuccessful: 'התשלום בוצע בהצלחה',
        paymentFailed: 'התשלום נכשל',
      },
    },
  },
};

const LANGUAGE_KEY = '@app_language';

export const initI18n = async () => {
  // Get saved language or default to Hebrew
  let savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
  if (!savedLanguage) {
    // Default to Hebrew for Israeli market
    savedLanguage = 'he';
    await AsyncStorage.setItem(LANGUAGE_KEY, savedLanguage);
  }

  console.log('I18n Setup:', {
    language: savedLanguage,
  });

  i18n.use(initReactI18next).init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'he', // Fallback to Hebrew instead of English
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

  return i18n;
};

export const changeLanguage = async (language: string) => {
  await AsyncStorage.setItem(LANGUAGE_KEY, language);
  i18n.changeLanguage(language);
};

export default i18n;