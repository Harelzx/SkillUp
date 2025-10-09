import { BannerMessage } from '@/components/ui/infobanner';

/**
 * Mock data source for info banner messages
 * This can be replaced with API calls in the future
 */
export const getBannerMessages = (): BannerMessage[] => {
  return [
    {
      id: '1',
      type: 'SYSTEM',
      emoji: '✅',
      title: 'קרדיטים עודכנו בהצלחה',
      subtitle: 'היתרה החדשה שלך זמינה לשימוש',
    },
    {
      id: '2',
      type: 'PROMO',
      emoji: '⭐',
      title: 'מבצע קיץ מיוחד',
      subtitle: '10% הנחה על השיעור הראשון השבוע',
      // imageUrl: 'https://images.unsplash.com/photo-...' // Optional background image
    },
    {
      id: '3',
      type: 'LESSON_REMINDER',
      emoji: '🧑‍🏫',
      title: 'שיעור פסנתר עם דנה',
      subtitle: 'היום בשעה 18:30',
    },
    {
      id: '4',
      type: 'SYSTEM',
      emoji: '👋',
      title: 'ברוכים הבאים ל-SkillUp',
      subtitle: 'מצא את המורה המושלם עבורך',
    },
    {
      id: '5',
      type: 'PROMO',
      emoji: '🎉',
      title: 'חודש ראשון במחיר מיוחד',
      subtitle: 'עבור תלמידים חדשים בלבד',
    },
    {
      id: '6',
      type: 'LESSON_REMINDER',
      emoji: '⏰',
      title: 'תזכורת: שיעור מתמטיקה',
      subtitle: 'מחר בשעה 15:00 עם פרופ׳ כהן',
    },
  ];
};

/**
 * Get messages for a specific type
 */
export const getBannerMessagesByType = (
  type: BannerMessage['type']
): BannerMessage[] => {
  return getBannerMessages().filter((msg) => msg.type === type);
};

/**
 * Get a single message by ID
 */
export const getBannerMessageById = (id: string): BannerMessage | undefined => {
  return getBannerMessages().find((msg) => msg.id === id);
};
