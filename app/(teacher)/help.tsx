import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Book, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react-native';
import { Typography } from '@/ui/Typography';
import { colors, spacing } from '@/theme/tokens';
import { useRTL } from '@/context/RTLContext';

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { getFlexDirection, getTextAlign } = useRTL();
  
  return (
    <View
      style={{
        backgroundColor: colors.white,
        borderRadius: 12,
        marginBottom: spacing[3],
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.08)',
        overflow: 'hidden',
      }}
    >
      <TouchableOpacity
        onPress={() => setIsExpanded(!isExpanded)}
        style={{
          flexDirection: getFlexDirection('row-reverse'),
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: spacing[3],
          paddingHorizontal: spacing[4],
        }}
        activeOpacity={0.7}
      >
        <Typography variant="body1" weight="semibold" style={{ flex: 1, textAlign: getTextAlign('right') }} align={getTextAlign('right')}>
          {question}
        </Typography>
        {isExpanded ? (
          <ChevronUp size={20} color={colors.gray[600]} />
        ) : (
          <ChevronDown size={20} color={colors.gray[600]} />
        )}
      </TouchableOpacity>
      
      {isExpanded && (
        <View
          style={{
            paddingHorizontal: spacing[4],
            paddingBottom: spacing[3],
            borderTopWidth: 1,
            borderTopColor: 'rgba(0, 0, 0, 0.06)',
            paddingTop: spacing[3],
          }}
        >
          <Typography variant="body2" color="textSecondary" style={{ textAlign: getTextAlign('right') }} align={getTextAlign('right')}>
            {answer}
          </Typography>
        </View>
      )}
    </View>
  );
};

export default function TeacherHelpScreen() {
  const { getFlexDirection, getTextAlign } = useRTL();
  
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  
  const faqs = [
    {
      question: 'איך אני מגדיר את זמינות השיעורים שלי?',
      answer: 'עבור ללשונית היומן, בחר תאריך ולחץ על "הוסף זמינות". תוכל להגדיר טווחי שעות וחזרות שבועיות.',
    },
    {
      question: 'איך אני מקבל תשלומים על שיעורים?',
      answer: 'התשלומים מועברים אוטומטית לחשבון הבנק שלך בסוף כל חודש, בניכוי עמלת הפלטפורמה.',
    },
    {
      question: 'מה קורה אם תלמיד מבטל שיעור?',
      answer: 'אם התלמיד מבטל 24 שעות לפני השיעור, תקבל תשלום מלא. ביטול באיחור יזכה אותך ב-50% מהסכום.',
    },
    {
      question: 'איך אני יכול לשנות את פרטי הפרופיל שלי?',
      answer: 'לחץ על "עריכת פרופיל" מדף הפרופיל, ושם תוכל לעדכן תמונה, ביוגרפיה, התמחויות ועוד.',
    },
    {
      question: 'האם יש מגבלה על מספר התלמידים?',
      answer: 'אין מגבלה על מספר התלמידים. תוכל ללמד כמה שאתה רוצה, בהתאם לזמינות שלך.',
    },
    {
      question: 'איך אני יכול לקבל ביקורות טובות יותר?',
      answer: 'היה זמין, מקצועי, והגיב מהר לשאלות. תכנן שיעורים מותאמים אישית ותן משוב מפורט לתלמידים.',
    },
  ];
  
  const handleOpenChat = () => {
    alert('צ׳אט תמיכה זמין בהמשך');
  };
  
  const handleContactSubmit = () => {
    if (!contactSubject.trim() || !contactMessage.trim()) {
      alert('נא למלא את כל השדות');
      return;
    }
    alert('הודעתך נשלחה בהצלחה (דמה)');
    setContactSubject('');
    setContactMessage('');
  };
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.gray[50] }}>
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
        <Typography variant="h3" weight="bold" align="center" style={{ textAlign: 'center' }}>
          עזרה ותמיכה
        </Typography>
      </View>
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingHorizontal: spacing[5], 
          paddingTop: spacing[5], 
          paddingBottom: spacing[6] 
        }}
      >
        {/* Quick Actions */}
        <View style={{ paddingTop: spacing[4] }}>
          <View
            style={{
              flexDirection: getFlexDirection('row-reverse'),
              gap: spacing[3],
            }}
          >
            <TouchableOpacity
              onPress={() => alert('מרכז העזרה (דמה)')}
              style={{
                flex: 1,
                backgroundColor: colors.white,
                borderRadius: 14,
                padding: spacing[4],
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(0, 0, 0, 0.08)',
                minHeight: 100,
                justifyContent: 'center',
              }}
              activeOpacity={0.7}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: colors.primary[50],
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: spacing[2],
                }}
              >
                <Book size={22} color={colors.primary[600]} />
              </View>
              <Typography variant="body2" weight="semibold" align="center">
                מרכז העזרה
              </Typography>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleOpenChat}
              style={{
                flex: 1,
                backgroundColor: colors.white,
                borderRadius: 14,
                padding: spacing[4],
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(0, 0, 0, 0.08)',
                minHeight: 100,
                justifyContent: 'center',
              }}
              activeOpacity={0.7}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: colors.primary[50],
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: spacing[2],
                }}
              >
                <MessageCircle size={22} color={colors.primary[600]} />
              </View>
              <Typography variant="body2" weight="semibold" align="center">
                פתח צ׳אט
              </Typography>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Contact Form */}
        <View style={{ paddingTop: spacing[5] }}>
          <Typography variant="h4" weight="bold" style={{ marginBottom: spacing[3], textAlign: getTextAlign('right') }} align={getTextAlign('right')}>
            צור קשר
          </Typography>
          
          <View
            style={{
              backgroundColor: colors.white,
              borderRadius: 14,
              padding: spacing[4],
              borderWidth: 1,
              borderColor: 'rgba(0, 0, 0, 0.08)',
            }}
          >
            <TextInput
              placeholder="נושא הפנייה"
              value={contactSubject}
              onChangeText={setContactSubject}
              style={{
                borderWidth: 1,
                borderColor: colors.gray[300],
                borderRadius: 10,
                paddingHorizontal: spacing[3],
                paddingVertical: spacing[3],
                fontSize: 15,
                textAlign: 'right',
                marginBottom: spacing[3],
                backgroundColor: colors.white,
              }}
            />
            
            <TextInput
              placeholder="תיאור הבעיה או השאלה..."
              value={contactMessage}
              onChangeText={setContactMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{
                borderWidth: 1,
                borderColor: colors.gray[300],
                borderRadius: 10,
                paddingHorizontal: spacing[3],
                paddingVertical: spacing[3],
                fontSize: 15,
                textAlign: 'right',
                height: 100,
                backgroundColor: colors.white,
              }}
            />
            
            <TouchableOpacity
              onPress={handleContactSubmit}
              style={{
                backgroundColor: colors.primary[600],
                paddingVertical: spacing[3],
                borderRadius: 10,
                alignItems: 'center',
                marginTop: spacing[3],
                minHeight: 48,
                justifyContent: 'center',
              }}
              activeOpacity={0.8}
            >
              <Typography variant="body1" weight="bold" style={{ color: colors.white }}>
                שלח
              </Typography>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* FAQs */}
        <View style={{ paddingTop: spacing[5] }}>
          <Typography variant="h4" weight="bold" style={{ marginBottom: spacing[3], textAlign: getTextAlign('right') }} align={getTextAlign('right')}>
            שאלות נפוצות
          </Typography>
          
          {faqs.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

