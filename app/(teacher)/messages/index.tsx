import React from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Typography } from '@/ui/Typography';
import { colors, spacing } from '@/theme/tokens';
import { ConversationCard } from '@/components/messages/ConversationCard';
import { EmptyConversations } from '@/components/messages/EmptyConversations';
import { useConversations } from '@/hooks/useConversations';
import { useRTL } from '@/context/RTLContext';

export default function TeacherMessagesInboxScreen() {
  const router = useRouter();
  const { data: conversations, isLoading, isError, error, refetch } = useConversations();
  const { getTextAlign } = useRTL();

  const handleConversationPress = (conversationId: string) => {
    router.push(`/(teacher)/messages/${conversationId}`);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
        <Stack.Screen
          options={{
            title: 'הודעות',
            headerShown: true,
          }}
        />
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <ActivityIndicator size="large" color={colors.primary[600]} />
          <Typography
            size="sm"
            style={{ color: colors.gray[500], marginTop: spacing[3] }}
            align={getTextAlign('center')}
          >
            טוען הודעות...
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
        <Stack.Screen
          options={{
            title: 'הודעות',
            headerShown: true,
          }}
        />
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: spacing[6],
          }}
        >
          <Typography
            size="lg"
            weight="bold"
            style={{ color: colors.error[600], marginBottom: spacing[2] }}
            align={getTextAlign('center')}
          >
            שגיאה בטעינת הודעות
          </Typography>
          <Typography
            size="base"
            style={{ color: colors.gray[600] }}
            align={getTextAlign('center')}
          >
            {error instanceof Error ? error.message : 'אירעה שגיאה לא צפויה'}
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.gray[50] }}>
      <Stack.Screen
        options={{
          title: 'הודעות',
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.white,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: colors.gray[200],
          },
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
        }}
      />

      {conversations && conversations.length > 0 ? (
        <>
          {/* Section Header */}
          <View
            style={{
              backgroundColor: colors.white,
              paddingHorizontal: spacing[4],
              paddingTop: spacing[4],
              paddingBottom: spacing[3],
              borderBottomWidth: 1,
              borderBottomColor: colors.gray[200],
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 2,
            }}
          >
            <Typography
              variant="h3"
              weight="bold"
              style={{
                color: colors.gray[900],
                fontSize: 20,
                letterSpacing: -0.3,
                textAlign: getTextAlign('right'),
              }}
              align={getTextAlign('right')}
            >
              שיחות עם תלמידים
            </Typography>
            <Typography
              variant="body2"
              style={{
                color: colors.gray[600],
                marginTop: spacing[1],
                fontSize: 14,
                lineHeight: 20,
                textAlign: getTextAlign('right'),
              }}
              align={getTextAlign('right')}
            >
              בחר תלמיד כדי להתחיל שיחה או להמשיך שיחה קיימת
            </Typography>
          </View>

          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ConversationCard
                conversation={item}
                userRole="teacher"
                onPress={() => handleConversationPress(item.id)}
              />
            )}
            contentContainerStyle={{
              paddingTop: spacing[3],
              paddingBottom: spacing[6],
            }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={refetch}
                colors={[colors.primary[600]]}
                tintColor={colors.primary[600]}
              />
            }
          />
        </>
      ) : (
        <EmptyConversations userRole="teacher" />
      )}
    </View>
  );
}
