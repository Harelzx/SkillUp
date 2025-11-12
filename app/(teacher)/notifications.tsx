import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Bell, Calendar, MessageCircle, AlertCircle } from 'lucide-react-native';
import { Typography } from '@/ui/Typography';
import { colors, spacing } from '@/theme/tokens';
import { useRTL } from '@/context/RTLContext';

interface NotificationCardProps {
  type: 'system' | 'booking' | 'reminder' | 'message';
  title: string;
  message: string;
  timestamp: string;
  isRead?: boolean;
}

const NotificationCard: React.FC<NotificationCardProps> = ({ 
  type, 
  title, 
  message, 
  timestamp,
  isRead = false 
}) => {
  const { isRTL, getFlexDirection, getTextAlign } = useRTL();
  
  const getIcon = () => {
    const iconColor = colors.primary[600];
    switch (type) {
      case 'booking':
        return <Calendar size={18} color={iconColor} />;
      case 'message':
        return <MessageCircle size={18} color={iconColor} />;
      case 'reminder':
        return <AlertCircle size={18} color={iconColor} />;
      default:
        return <Bell size={18} color={iconColor} />;
    }
  };
  
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={{
        backgroundColor: isRead ? colors.white : colors.primary[50],
        borderRadius: 14,
        padding: spacing[4],
        marginBottom: spacing[3],
        borderWidth: 1,
        borderColor: isRead ? 'rgba(0, 0, 0, 0.08)' : colors.primary[100],
      }}
    >
      <View
        style={{
          flexDirection: getFlexDirection('row-reverse'),
          alignItems: 'flex-start',
          gap: spacing[3],
        }}
      >
        {/* Icon */}
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: colors.white,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.primary[200],
          }}
        >
          {getIcon()}
        </View>
        
        {/* Content */}
        <View style={{ flex: 1 }}>
          <Typography 
            variant="body1" 
            weight="semibold" 
            align={getTextAlign('right')}
            style={{ textAlign: getTextAlign('right') }}
          >
            {title}
          </Typography>
          <Typography
            variant="body2"
            color="textSecondary"
            style={{ marginTop: spacing[1], textAlign: getTextAlign('right') }}
            align={getTextAlign('right')}
          >
            {message}
          </Typography>
          <Typography
            variant="caption"
            color="textSecondary"
            style={{ marginTop: spacing[2], textAlign: getTextAlign('right') }}
            align={getTextAlign('right')}
          >
            {timestamp}
          </Typography>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function TeacherNotificationsScreen() {
  const { t } = useTranslation();
  const { isRTL, direction, getFlexDirection, getTextAlign } = useRTL();
  const router = useRouter();
  
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      type: 'booking' as const,
      title: 'שיעור חדש הוזמן',
      message: 'דני כהן הזמין שיעור למתמטיקה ביום רביעי בשעה 14:00',
      timestamp: 'לפני 10 דקות',
      isRead: false,
    },
    {
      id: '2',
      type: 'reminder' as const,
      title: 'תזכורת לשיעור',
      message: 'שיעור עם שרה לוי מתחיל בעוד 30 דקות',
      timestamp: 'לפני שעה',
      isRead: false,
    },
    {
      id: '3',
      type: 'message' as const,
      title: 'הודעה חדשה',
      message: 'יוסי אברהם שלח לך הודעה',
      timestamp: 'לפני 2 שעות',
      isRead: true,
    },
    {
      id: '4',
      type: 'system' as const,
      title: 'עדכון מערכת',
      message: 'גרסה חדשה של האפליקציה זמינה להורדה',
      timestamp: 'אתמול',
      isRead: true,
    },
  ]);
  
  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    alert('כל ההתראות סומנו כנקראו');
  };
  
  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.gray[50], direction }}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View
        style={{
          backgroundColor: colors.white,
          borderBottomWidth: 1,
          borderBottomColor: colors.gray[200],
          paddingHorizontal: spacing[4],
          paddingVertical: spacing[3],
        }}
      >
        <View
          style={{
            flexDirection: getFlexDirection('row-reverse'),
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography 
            variant="h3" 
            weight="bold" 
            align={getTextAlign('right')}
            style={{ textAlign: getTextAlign('right') }}
          >
            התראות
          </Typography>
          
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={handleMarkAllRead}
              style={{
                paddingVertical: spacing[2],
                paddingHorizontal: spacing[3],
              }}
            >
              <Typography 
                variant="body2" 
                style={{ color: colors.primary[600], textAlign: getTextAlign('right') }} 
                align={getTextAlign('right')}
              >
                סמן הכל כנקרא
              </Typography>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: spacing[4], paddingHorizontal: spacing[4], paddingBottom: spacing[6] }}
      >
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              type={notification.type}
              title={notification.title}
              message={notification.message}
              timestamp={notification.timestamp}
              isRead={notification.isRead}
            />
          ))
        ) : (
          <View style={{ alignItems: 'center', marginTop: spacing[8] }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: colors.gray[100],
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: spacing[3],
              }}
            >
              <Bell size={32} color={colors.gray[400]} />
            </View>
            <Typography variant="h4" weight="semibold" align="center">
              אין התראות חדשות
            </Typography>
            <Typography
              variant="body2"
              color="textSecondary"
              align="center"
              style={{ marginTop: spacing[2], maxWidth: 280 }}
            >
              כל ההתראות שלך יופיעו כאן
            </Typography>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

