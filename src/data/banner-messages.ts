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
      title: 'קרדיטים עודכנו בהצלחה! 🎉',
      subtitle: 'היתרה החדשה שלך זמינה לשימוש',
    },
    {
      id: '2',
      type: 'PROMO',
      title: 'מבצע קיץ מיוחד',
      subtitle: '10% הנחה על השיעור הראשון השבוע',
    },
    {
      id: '3',
      type: 'LESSON_REMINDER',
      title: 'שיעור פסנתר עם דנה',
      subtitle: 'היום בשעה 18:30',
    },
    {
      id: '4',
      type: 'SYSTEM',
      title: 'ברוכים הבאים ל-SkillUp! 👋',
      subtitle: 'מצא את המורה המושלם עבורך',
    },
    {
      id: '5',
      type: 'PROMO',
      title: 'חודש ראשון חינם',
      subtitle: 'עבור תלמידים חדשים בלבד',
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
