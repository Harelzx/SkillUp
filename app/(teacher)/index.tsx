import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  TrendingUp,
  ArrowUp,
  ArrowDown,
} from 'lucide-react-native';
import { Typography } from '@/ui/Typography';
import { Card } from '@/ui/Card';
import { colors, spacing } from '@/theme/tokens';
import { createStyle } from '@/theme/utils';
import { useRTL } from '@/context/RTLContext';
import { InfoBanner } from '@/components/ui/infobanner';
import { useTeacherUpcomingLessons } from '@/hooks/useTeacherUpcomingLessons';
import { useAuth } from '@/features/auth/auth-context';
import { 
  getTeacherStats, 
  getMonthlyGrowthData, 
  getTeacherNotifications 
} from '@/data/teacher-data';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: number; // percentage change
}

const StatCard: React.FC<StatCardProps> = ({ label, value, trend }) => {
  return (
    <View
      style={{
        minWidth: 160,
        maxWidth: 180,
        minHeight: 96, // Consistent height for all cards
        marginRight: spacing[3], // Always margin right in RTL context
        backgroundColor: colors.white,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.08)',
        padding: 14,
        // Subtle shadow
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
      }}
    >
      {/* Content aligned to right (RTL) */}
      <View 
        style={{ 
          flex: 1,
          justifyContent: 'space-between',
        }}
      >
        {/* Label at top - right aligned */}
        <Typography 
          variant="caption" 
          color="textSecondary" 
          numberOfLines={1}
          style={{
            fontSize: 13,
            textAlign: 'center',
            marginBottom: 6,
          }}
        >
          {label}
        </Typography>
        
        {/* Value - prominent and right aligned */}
        <Typography 
          variant="h4" 
          weight="bold" 
          style={{ 
            color: colors.gray[900],
            fontSize: 20,
            textAlign: 'center',
            marginBottom: 8,
          }}
        >
          {value}
        </Typography>
        
        {/* Trend indicator - right aligned */}
        {trend !== undefined && trend !== 0 && (
          <View
            style={{
              flexDirection: 'column', // RTL for icon + text
              alignItems: 'center',
              gap: 4,
              alignSelf: 'center', // Align to right
            }}
          >
            {trend > 0 ? (
              <ArrowUp size={11} color={colors.success[600]} />
            ) : (
              <ArrowDown size={11} color={colors.error[600]} />
            )}
            <Typography
              variant="caption"
              style={{
                color: trend > 0 ? colors.success[600] : colors.error[600],
                fontWeight: '600',
                fontSize: 12,
              }}
            >
              {Math.abs(trend)}%
            </Typography>
          </View>
        )}
      </View>
    </View>
  );
};

interface MonthlyChartProps {
  data: Array<{ month: string; revenue: number; lessons: number }>;
}

const MonthlyChart: React.FC<MonthlyChartProps> = ({ data }) => {
  const { isRTL } = useRTL();
  const [viewMode, setViewMode] = useState<'revenue' | 'lessons'>('revenue');
  
  const maxValue = Math.max(...data.map(d => viewMode === 'revenue' ? d.revenue : d.lessons));
  const chartHeight = 180;
  const barWidth = 20;
  const chartPadding = 40;
  
  return (
    <View style={{ paddingHorizontal: spacing[4], paddingVertical: spacing[4] }}>
      <View
        style={{
          flexDirection: isRTL ? 'row-reverse' : 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing[4],
        }}
      >
        <Typography variant="h5" weight="semibold">
          גרף צמיחה חודשי
        </Typography>
        
        <View
          style={{
            flexDirection: isRTL ? 'row-reverse' : 'row',
            backgroundColor: colors.gray[100],
            borderRadius: 8,
            padding: 2,
          }}
        >
          <TouchableOpacity
            onPress={() => setViewMode('revenue')}
            style={{
              paddingHorizontal: spacing[3],
              paddingVertical: spacing[1],
              borderRadius: 6,
              backgroundColor: viewMode === 'revenue' ? colors.white : 'transparent',
            }}
          >
            <Typography
              variant="caption"
              weight={viewMode === 'revenue' ? 'semibold' : 'normal'}
              color={viewMode === 'revenue' ? 'primary' : 'text'}
            >
              הכנסות
            </Typography>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setViewMode('lessons')}
            style={{
              paddingHorizontal: spacing[3],
              paddingVertical: spacing[1],
              borderRadius: 6,
              backgroundColor: viewMode === 'lessons' ? colors.white : 'transparent',
            }}
          >
            <Typography
              variant="caption"
              weight={viewMode === 'lessons' ? 'semibold' : 'normal'}
              color={viewMode === 'lessons' ? 'primary' : 'text'}
            >
              שיעורים
            </Typography>
          </TouchableOpacity>
        </View>
      </View>
      
      <Card
        variant="elevated"
        style={{
          backgroundColor: colors.white,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.gray[100],
          padding: spacing[4],
        }}
      >
        <View style={{ height: chartHeight + chartPadding }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              flexDirection: isRTL ? 'row-reverse' : 'row',
              alignItems: 'flex-start',
              paddingHorizontal: spacing[2],
              gap: spacing[2],
            }}
          >
            {data.map((item, index) => {
              const value = viewMode === 'revenue' ? item.revenue : item.lessons;
              const barHeight = (value / maxValue) * chartHeight;
              
              return (
                <View
                  key={index}
                  style={{
                    alignItems: 'center',
                    gap: spacing[1],
                  }}
                >
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    style={{ fontSize: 11 }}
                  >
                    {viewMode === 'revenue' 
                      ? `₪${(value / 1000).toFixed(1)}K` 
                      : value
                    }
                  </Typography>
                  
                  <View
                    style={{
                      width: barWidth,
                      height: Math.max(barHeight, 4),
                      backgroundColor: colors.primary[500],
                      borderRadius: 4,
                      opacity: 0.8 + (index / data.length) * 0.2,
                    }}
                  />
                  
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    style={{ fontSize: 10 }}
                  >
                    {item.month}
                  </Typography>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </Card>
    </View>
  );
};

export default function TeacherHomeScreen() {
  const { isRTL, direction } = useRTL();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const teacherId = profile?.role === 'teacher' ? profile.id : undefined;
  const { data: upcoming = [], isLoading: loadingUpcoming, error: upcomingError } = useTeacherUpcomingLessons(teacherId, { limit: 5 });
  
  // Debug logs removed
  
  const stats = getTeacherStats();
  const monthlyData = getMonthlyGrowthData();
  const notifications = getTeacherNotifications();
  
  // Convert teacher notifications to InfoBanner format
  const bannerMessages = notifications.map(notif => ({
    id: notif.id,
    type: notif.type === 'LESSON_REMINDER_TEACHER' ? 'LESSON_REMINDER' : notif.type,
    title: notif.title,
    subtitle: notif.subtitle,
    emoji: notif.emoji,
  })) as any;
  
  const styles = createStyle({
    container: {
      flex: 1,
      backgroundColor: colors.gray[50],
    },
    statsScroll: {
      paddingVertical: spacing[4],
    },
  });
  function formatLessonTimeRange(startIso: string, endIso: string) {
    const start = new Date(startIso);
    const end = new Date(endIso);
    const pad = (n: number) => String(n).padStart(2, '0');
    const time = `${pad(start.getHours())}:${pad(start.getMinutes())}–${pad(end.getHours())}:${pad(end.getMinutes())}`;
    const date = `${pad(start.getDate())}.${pad(start.getMonth() + 1)}.${String(start.getFullYear()).slice(-2)}`;
    return `${time}, ${date}`;
  }

  function getStatusColor(status: string) {
    if (status === 'confirmed') return colors.success[600];
    if (status === 'awaiting_payment' || status === 'pending') return colors.warning[700];
    return colors.gray[700];
  }
  
  return (
    <SafeAreaView style={[styles.container, { direction }]}>
      <StatusBar barStyle="dark-content" />
      
      {/* Info Banner - Teacher Notifications (now at top, no header above) */}
      <InfoBanner
        messages={bannerMessages}
        autoRotateInterval={10000}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Upcoming Lessons - now inside ScrollView */}
        <View style={{ marginTop: spacing[2], marginBottom: spacing[2] }}>
          <Typography variant="h5" weight="semibold" style={{ textAlign: 'right', marginBottom: spacing[2], paddingHorizontal: spacing[4] }}>
            שיעורים קרובים
          </Typography>

          {loadingUpcoming ? (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={{ 
                flexDirection: 'row-reverse', 
                gap: spacing[3],
                paddingHorizontal: spacing[4],
              }}
            >
              {[...Array(4)].map((_, i) => (
                <View key={i} style={{ width: 280, height: 130, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', backgroundColor: colors.white }} />
              ))}
            </ScrollView>
          ) : upcomingError ? (
            <View style={{ paddingVertical: spacing[3], paddingHorizontal: spacing[4] }}>
              <Typography variant="body1" color="error" style={{ textAlign: 'right' }}>
                שגיאה בטעינת שיעורים
              </Typography>
            </View>
          ) : upcoming.length === 0 ? (
            <View style={{ paddingVertical: spacing[3], paddingHorizontal: spacing[4] }}>
              <Typography variant="body2" color="textSecondary" style={{ textAlign: 'right' }}>
                אין שיעורים קרובים
              </Typography>
            </View>
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={{ direction: 'rtl' }}
              contentContainerStyle={{ 
                flexDirection: 'row-reverse', 
                gap: spacing[3],
                paddingHorizontal: spacing[4],
              }}
            >
              {upcoming.map(lesson => (
                <Card key={lesson.id} variant="elevated" style={{ width: 280, maxWidth: 300, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', padding: spacing[3], backgroundColor: colors.white }}>
                  <View style={{ gap: 6 }}>
                    {/* Top row: student name | mode chip */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="body1" weight="semibold" numberOfLines={1} style={{ fontSize: 16, textAlign: 'right' }}>
                        {`${lesson.student?.first_name || ''} ${lesson.student?.last_name || ''}`.trim() || 'תלמיד/ה'}
                      </Typography>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, borderWidth: 1, borderColor: colors.gray[200], backgroundColor: colors.gray[50] }}>
                        <Typography variant="caption" style={{ fontSize: 12 }}>
                          {lesson.mode === 'online' ? 'Online' : lesson.mode === 'at_student' || lesson.mode === 'student_location' ? 'אצל התלמיד' : 'אצל המורה'}
                        </Typography>
                      </View>
                    </View>

                    {/* Subject and time */}
                    <View>
                      <Typography variant="body2" weight="semibold" style={{ textAlign: 'left' }}>
                        {lesson.subject?.name_he || lesson.subject?.name || 'שיעור'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" style={{ textAlign: 'left', marginTop: 2 }}>
                        {formatLessonTimeRange(lesson.startAt, lesson.endAt)}
                      </Typography>
                    </View>

                    {/* Bottom row: status | price */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="caption" style={{ color: getStatusColor(lesson.status) }}>
                        {lesson.status === 'confirmed' ? 'מאושר' : lesson.status === 'awaiting_payment' ? 'ממתין לתשלום' : 'ממתין לאישור'}
                      </Typography>
                      {typeof lesson.totalPrice === 'number' ? (
                        <Typography variant="body2" color='primary' weight="bold">
                          {`₪${lesson.totalPrice}/שיעור`}
                        </Typography>
                      ) : (
                        <View />
                      )}
                    </View>
                  </View>
                </Card>
              ))}
            </ScrollView>
          )}
        </View>
        {/* Stats Cards - Horizontal Scroll */}
        <View style={{ marginTop: spacing[2] }}>
          <Typography
            variant="h5"
            weight="semibold"
            align={isRTL ? 'left' : 'right'}
            style={{ paddingHorizontal: spacing[4], marginBottom: spacing[3] }}
          >
            נתוני פעילות
          </Typography>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: spacing[4],
              flexDirection: isRTL ? 'row' : 'row-reverse',
            }}
            style={styles.statsScroll}
          >
            <StatCard
              label="תלמידים (סה״כ)"
              value={stats.totalStudents}
              trend={8}
            />
            
            <StatCard
              label="תלמידים פעילים"
              value={stats.activeStudents}
              trend={5}
            />
            
            <StatCard
              label="שיעורים שבוצעו"
              value={stats.lessonsCompleted}
              trend={12}
            />
            
            <StatCard
              label="הכנסה חודשית"
              value={`₪${stats.monthlyRevenue.toLocaleString('he-IL')}`}
              trend={15}
            />
          </ScrollView>
        </View>
        
        {/* Monthly Growth Chart */}
        <MonthlyChart data={monthlyData} />
        
        {/* Quick Actions / Info */}
        <View style={{ paddingHorizontal: spacing[4], marginTop: spacing[4] }}>
          <Card
            variant="elevated"
            style={{
              backgroundColor: colors.primary[50],
              borderWidth: 1,
              borderColor: colors.primary[100],
              borderRadius: 14,
              padding: spacing[4],
            }}
          >
            <View
              style={{
                flexDirection: isRTL ? 'row-reverse' : 'row',
                alignItems: 'center',
                gap: spacing[3],
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: colors.primary[100],
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <TrendingUp size={24} color={colors.primary[600]} />
              </View>
              
              <View style={{ flex: 1 }}>
                <Typography variant="body1" weight="semibold" color="primary">
                  ביצועים מצוינים החודש!
                </Typography>
                <Typography
                  variant="caption"
                  color="textSecondary"
                  style={{ marginTop: spacing[1] }}
                >
                  המשך כך - הסטודנטים שלך מרוצים מאוד
                </Typography>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

