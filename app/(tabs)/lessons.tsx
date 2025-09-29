import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  Plus,
} from 'lucide-react-native';
import { Card, CardContent } from '@/ui/Card';
import { Typography } from '@/ui/Typography';
import { Button, ButtonText } from '@gluestack-ui/themed';
import { colors, spacing } from '@/theme/tokens';
import { createStyle } from '@/theme/utils';
import { useRTL } from '@/context/RTLContext';

interface Lesson {
  id: string;
  teacherName: string;
  subject: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  price: number;
  isOnline: boolean;
}

export default function LessonsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { getFlexDirection } = useRTL();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [pressedButton, setPressedButton] = useState<string | null>(null);

  // Mock lessons data
  const lessons: Lesson[] = [
    {
      id: '1',
      teacherName: 'שרה כהן',
      subject: 'מתמטיקה',
      date: '2024-01-20',
      time: '17:00',
      status: 'upcoming',
      price: 120,
      isOnline: true,
    },
    {
      id: '2',
      teacherName: 'דוד לוי',
      subject: 'אנגלית',
      date: '2024-01-18',
      time: '19:00',
      status: 'completed',
      price: 100,
      isOnline: false,
    },
    {
      id: '3',
      teacherName: 'רחל מור',
      subject: 'פיזיקה',
      date: '2024-01-15',
      time: '16:00',
      status: 'cancelled',
      price: 150,
      isOnline: true,
    },
  ];

  const upcomingLessons = lessons.filter(lesson => lesson.status === 'upcoming');
  const pastLessons = lessons.filter(lesson => lesson.status !== 'upcoming');

  const getStatusColor = (status: Lesson['status']) => {
    switch (status) {
      case 'upcoming':
        return colors.blue[600];
      case 'completed':
        return colors.green[600];
      case 'cancelled':
        return colors.red[600];
      default:
        return colors.gray[600];
    }
  };

  const getStatusIcon = (status: Lesson['status']) => {
    switch (status) {
      case 'upcoming':
        return Clock;
      case 'completed':
        return CheckCircle;
      case 'cancelled':
        return AlertCircle;
      default:
        return Clock;
    }
  };

  const styles = createStyle({
    container: {
      flex: 1,
      backgroundColor: colors.gray[50],
    },
    header: {
      backgroundColor: colors.white,
      padding: spacing[4],
      borderBottomWidth: 1,
      borderBottomColor: colors.gray[200],
    },
    tabsContainer: {
      marginTop: spacing[4],
    },
    tab: {
      flex: 1,
      paddingVertical: spacing[3],
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    activeTab: {
      borderBottomColor: colors.primary[600],
    },
    content: {
      flex: 1,
      padding: spacing[4],
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing[8],
    },
    lessonCard: {
      marginBottom: spacing[3],
    },
    lessonHeader: {
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing[3],
    },
    statusBadge: {
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[1],
      borderRadius: 12,
      alignItems: 'center',
    },
    lessonInfo: {
      gap: spacing[2],
    },
    infoRow: {
      alignItems: 'center',
      gap: spacing[2],
    },
    actions: {
      marginTop: spacing[3],
      paddingTop: spacing[3],
      borderTopWidth: 1,
      borderTopColor: colors.gray[200],
    },
    addButton: {
      position: 'absolute',
      bottom: spacing[4],
      right: spacing[4],
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary[600],
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
  });

  const handleBookNewLesson = () => {
    router.push('/(tabs)/search');
  };

  const renderLesson = (lesson: Lesson) => {
    const StatusIcon = getStatusIcon(lesson.status);
    const statusColor = getStatusColor(lesson.status);

    return (
      <Card key={lesson.id} style={styles.lessonCard}>
        <CardContent>
          <View style={[styles.lessonHeader, { flexDirection: getFlexDirection() }]}>
            <View style={{ flex: 1 }}>
              <Typography variant="h5" weight="semibold">
                {lesson.teacherName}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {lesson.subject}
              </Typography>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
              <View style={[styles.infoRow, { flexDirection: getFlexDirection() }]}>
                <StatusIcon size={14} color={statusColor} />
                <Typography variant="caption" style={{ color: statusColor }}>
                  {t(`lessons.status.${lesson.status}`)}
                </Typography>
              </View>
            </View>
          </View>

          <View style={styles.lessonInfo}>
            <View style={[styles.infoRow, { flexDirection: getFlexDirection() }]}>
              <Calendar size={16} color={colors.gray[600]} />
              <Typography variant="body2" color="textSecondary">
                {lesson.date} בשעה {lesson.time}
              </Typography>
            </View>
            <View style={[styles.infoRow, { flexDirection: getFlexDirection() }]}>
              <User size={16} color={colors.gray[600]} />
              <Typography variant="body2" color="textSecondary">
                {lesson.isOnline ? 'שיעור אונליין' : 'שיעור פרונטלי'}
              </Typography>
            </View>
            <View style={[styles.infoRow, { flexDirection: getFlexDirection() }]}>
              <Typography variant="body1" weight="semibold">
                {lesson.price} לשעה
              </Typography>
            </View>
          </View>

          {lesson.status === 'upcoming' && (
            <View style={[styles.actions, { flexDirection: getFlexDirection(), gap: spacing[3] }]}>
              <Button
                style={{
                  flex: 1,
                  minHeight: 48,
                  paddingHorizontal: spacing[4],
                  paddingVertical: spacing[3],
                  backgroundColor: pressedButton === `reschedule-${lesson.id}` ? '#0056CC' : '#007AFF',
                  borderRadius: 10,
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: '#007AFF',
                  shadowOffset: { width: 0, height: pressedButton === `reschedule-${lesson.id}` ? 1 : 2 },
                  shadowOpacity: pressedButton === `reschedule-${lesson.id}` ? 0.3 : 0.2,
                  shadowRadius: pressedButton === `reschedule-${lesson.id}` ? 2 : 4,
                  elevation: pressedButton === `reschedule-${lesson.id}` ? 1 : 3,
                  transform: [{ scale: pressedButton === `reschedule-${lesson.id}` ? 0.98 : 1 }],
                }}
                onPressIn={() => setPressedButton(`reschedule-${lesson.id}`)}
                onPressOut={() => setPressedButton(null)}
                onPress={() => {
                  // Handle reschedule action
                  console.log('Reschedule lesson:', lesson.id);
                }}
              >
                <View style={[{ flexDirection: getFlexDirection(), alignItems: 'center', gap: spacing[1] }]}>
                  <Calendar size={16} color="white" />
                  <ButtonText style={{ color: 'white', fontSize: 15, fontWeight: '600' }}>
                    שנה תאריך
                  </ButtonText>
                </View>
              </Button>
              <Button
                variant="outline"
                style={{
                  flex: 1,
                  minHeight: 48,
                  paddingHorizontal: spacing[4],
                  paddingVertical: spacing[3],
                  borderRadius: 10,
                  borderWidth: 1.5,
                  borderColor: pressedButton === `cancel-${lesson.id}` ? '#DC2626' : '#F87171',
                  backgroundColor: pressedButton === `cancel-${lesson.id}` ? '#FEE2E2' : '#FEF2F2',
                  justifyContent: 'center',
                  alignItems: 'center',
                  transform: [{ scale: pressedButton === `cancel-${lesson.id}` ? 0.98 : 1 }],
                }}
                onPressIn={() => setPressedButton(`cancel-${lesson.id}`)}
                onPressOut={() => setPressedButton(null)}
                onPress={() => {
                  // Handle cancel action
                  console.log('Cancel lesson:', lesson.id);
                }}
              >
                <ButtonText style={{
                  color: pressedButton === `cancel-${lesson.id}` ? '#B91C1C' : '#DC2626',
                  fontSize: 15,
                  fontWeight: '600'
                }}>
                  ביטול שיעור
                </ButtonText>
              </Button>
            </View>
          )}

          {lesson.status === 'completed' && (
            <View style={styles.actions}>
              <Button
                style={{
                  flex: 1,
                  minHeight: 40,
                  paddingHorizontal: spacing[3],
                  paddingVertical: spacing[2],
                  backgroundColor: pressedButton === `book-again-${lesson.id}` ? '#0056CC' : '#007AFF',
                  borderRadius: 8,
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: '#007AFF',
                  shadowOffset: { width: 0, height: pressedButton === `book-again-${lesson.id}` ? 1 : 2 },
                  shadowOpacity: pressedButton === `book-again-${lesson.id}` ? 0.3 : 0.2,
                  shadowRadius: pressedButton === `book-again-${lesson.id}` ? 2 : 3,
                  elevation: pressedButton === `book-again-${lesson.id}` ? 1 : 2,
                  transform: [{ scale: pressedButton === `book-again-${lesson.id}` ? 0.98 : 1 }],
                }}
                onPressIn={() => setPressedButton(`book-again-${lesson.id}`)}
                onPressOut={() => setPressedButton(null)}
                onPress={() => {
                  // Handle book again action
                  console.log('Book again lesson with:', lesson.teacherName);
                }}
              >
                <View style={[{ flexDirection: getFlexDirection(), alignItems: 'center', gap: spacing[1] }]}>
                  <Calendar size={14} color="white" />
                  <ButtonText style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                    הזמן שוב
                  </ButtonText>
                </View>
              </Button>
            </View>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Calendar size={48} color={colors.gray[400]} />
      <Typography variant="h5" weight="semibold" style={{ marginTop: spacing[4], marginBottom: spacing[2] }}>
        {activeTab === 'upcoming' ? t('lessons.noUpcoming') : t('lessons.noPast')}
      </Typography>
      <Typography variant="body1" color="textSecondary" align="center" style={{ marginBottom: spacing[6] }}>
        {activeTab === 'upcoming'
          ? t('lessons.noUpcomingDescription')
          : t('lessons.noPastDescription')
        }
      </Typography>
      {activeTab === 'upcoming' && (
        <Button onPress={handleBookNewLesson}>
          <ButtonText>{t('lessons.bookFirst')}</ButtonText>
        </Button>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Typography variant="h3" weight="bold">
          {t('lessons.title')}
        </Typography>

        {/* Tabs */}
        <View style={[styles.tabsContainer, { flexDirection: getFlexDirection() }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
            onPress={() => setActiveTab('upcoming')}
          >
            <Typography
              variant="body1"
              weight={activeTab === 'upcoming' ? 'semibold' : 'normal'}
              color={activeTab === 'upcoming' ? 'primary' : 'textSecondary'}
            >
              שיעורים קרובים
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'past' && styles.activeTab]}
            onPress={() => setActiveTab('past')}
          >
            <Typography
              variant="body1"
              weight={activeTab === 'past' ? 'semibold' : 'normal'}
              color={activeTab === 'past' ? 'primary' : 'textSecondary'}
            >
              שיעורים קודמים
            </Typography>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'upcoming' ? (
          upcomingLessons.length > 0 ? (
            upcomingLessons.map(renderLesson)
          ) : (
            renderEmptyState()
          )
        ) : (
          pastLessons.length > 0 ? (
            pastLessons.map(renderLesson)
          ) : (
            renderEmptyState()
          )
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.addButton} onPress={handleBookNewLesson}>
        <Plus size={24} color={colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}