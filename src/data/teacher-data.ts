/**
 * Mock/Stub data for teacher dashboard
 * This will be replaced with actual API calls
 */

export interface TeacherStats {
  totalStudents: number;
  activeStudents: number;
  lessonsCompleted: number;
  monthlyRevenue: number;
}

export interface MonthlyData {
  month: string; // Short month name in Hebrew
  revenue: number;
  lessons: number;
}

export interface TeacherLesson {
  id: string;
  studentName: string;
  subject: string;
  date: string; // ISO date
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  location: string; // 'online' | 'in-person' | address
  status: 'scheduled' | 'completed' | 'cancelled';
}

/**
 * Get teacher statistics
 */
export const getTeacherStats = (): TeacherStats => {
  return {
    totalStudents: 45,
    activeStudents: 32,
    lessonsCompleted: 487,
    monthlyRevenue: 18500,
  };
};

/**
 * Get monthly growth data (last 12 months)
 */
export const getMonthlyGrowthData = (): MonthlyData[] => {
  const months = ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני', 'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'];
  const currentMonth = new Date().getMonth();
  
  const data: MonthlyData[] = [];
  
  for (let i = 11; i >= 0; i--) {
    const monthIndex = (currentMonth - i + 12) % 12;
    const baseRevenue = 12000 + Math.random() * 8000;
    const baseLessons = 25 + Math.floor(Math.random() * 20);
    
    data.push({
      month: months[monthIndex],
      revenue: Math.round(baseRevenue),
      lessons: baseLessons,
    });
  }
  
  return data;
};

/**
 * Get upcoming lessons for teacher
 */
export const getUpcomingTeacherLessons = (limit: number = 5): TeacherLesson[] => {
  const today = new Date();
  const lessons: TeacherLesson[] = [];
  
  const students = ['יעל כהן', 'דוד לוי', 'שרה מזרחי', 'אבי גולן', 'מיכל רוזן'];
  const subjects = ['מתמטיקה', 'אנגלית', 'פיזיקה', 'תכנות', 'כימיה'];
  const locations = ['אונליין', 'בית המורה', 'בית התלמיד'];
  
  for (let i = 0; i < limit; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + Math.floor(i / 2));
    
    lessons.push({
      id: `lesson-${i + 1}`,
      studentName: students[i % students.length],
      subject: subjects[i % subjects.length],
      date: date.toISOString().split('T')[0],
      startTime: `${14 + i}:00`,
      endTime: `${15 + i}:00`,
      location: locations[i % locations.length],
      status: 'scheduled',
    });
  }
  
  return lessons;
};

/**
 * Get lessons for a specific date
 */
export const getLessonsForDate = (date: string): TeacherLesson[] => {
  // Mock: return 0-3 lessons for any given date
  const seed = date.split('-').reduce((acc, val) => acc + parseInt(val), 0);
  const count = seed % 4; // 0-3 lessons
  
  if (count === 0) return [];
  
  const students = ['יעל כהן', 'דוד לוי', 'שרה מזרחי', 'אבי גולן'];
  const subjects = ['מתמטיקה', 'אנגלית', 'פיזיקה', 'תכנות'];
  const locations = ['אונליין', 'בית המורה', 'בית התלמיד'];
  
  const lessons: TeacherLesson[] = [];
  for (let i = 0; i < count; i++) {
    lessons.push({
      id: `${date}-lesson-${i}`,
      studentName: students[i % students.length],
      subject: subjects[i % subjects.length],
      date,
      startTime: `${10 + i * 2}:00`,
      endTime: `${11 + i * 2}:00`,
      location: locations[i % locations.length],
      status: 'scheduled',
    });
  }
  
  return lessons;
};

/**
 * Get teacher notification messages
 */
export interface TeacherNotification {
  id: string;
  type: 'SYSTEM' | 'LESSON_REMINDER_TEACHER';
  title: string;
  subtitle?: string;
  emoji?: string;
}

export const getTeacherNotifications = (): TeacherNotification[] => {
  return [
    {
      id: 'tn-1',
      type: 'LESSON_REMINDER_TEACHER',
      emoji: '👨‍🎓',
      title: 'שיעור עם יעל כהן',
      subtitle: 'היום בשעה 16:00 - מתמטיקה',
    },
    {
      id: 'tn-2',
      type: 'SYSTEM',
      emoji: '💰',
      title: 'תשלום התקבל',
      subtitle: 'שיעור עם דוד לוי - ₪150',
    },
    {
      id: 'tn-3',
      type: 'LESSON_REMINDER_TEACHER',
      emoji: '📚',
      title: 'שיעור עם שרה מזרחי',
      subtitle: 'מחר בשעה 14:00 - אנגלית',
    },
    {
      id: 'tn-4',
      type: 'SYSTEM',
      emoji: '⭐',
      title: 'ביקורת חדשה התקבלה',
      subtitle: 'אבי גולן נתן לך 5 כוכבים',
    },
    {
      id: 'tn-5',
      type: 'LESSON_REMINDER_TEACHER',
      emoji: '⏰',
      title: 'תזכורת: שיעור בעוד שעה',
      subtitle: 'מיכל רוזן - פיזיקה',
    },
  ];
};

