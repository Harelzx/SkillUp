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

export default function MessagesInboxScreen() {
  const router = useRouter();
  const { data: conversations, isLoading, isError, error, refetch } = useConversations();

  const handleConversationPress = (conversationId: string) => {
    router.push(`/(tabs)/messages/${conversationId}`);
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
          >
            שגיאה בטעינת הודעות
          </Typography>
          <Typography
            size="base"
            style={{ color: colors.gray[600], textAlign: 'center' }}
          >
            {error instanceof Error ? error.message : 'אירעה שגיאה לא צפויה'}
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.gray[50] }} edges={['top']}>
      <Stack.Screen
        options={{
          title: 'הודעות',
          headerShown: true,
        }}
      />

      {conversations && conversations.length > 0 ? (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ConversationCard
              conversation={item}
              userRole="student"
              onPress={() => handleConversationPress(item.id)}
            />
          )}
          contentContainerStyle={{
            padding: spacing[4],
          }}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              colors={[colors.primary[600]]}
              tintColor={colors.primary[600]}
            />
          }
        />
      ) : (
        <EmptyConversations userRole="student" />
      )}
    </SafeAreaView>
  );
}
