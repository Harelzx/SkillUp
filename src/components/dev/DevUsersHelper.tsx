/**
 * DEV Users Helper Component
 * Shows available dev users on login screen (DEV mode only)
 */

import React, { useState } from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { ChevronDown, ChevronUp, User, Key } from 'lucide-react-native';
import { Typography } from '@/ui/Typography';
import { Card } from '@/ui/Card';
import { colors, spacing } from '@/theme/tokens';
import { IS_DEV_MODE, DEV_USERS } from '@/data/dev-users';

interface DevUsersHelperProps {
  onSelectUser?: (email: string, password: string) => void;
}

export const DevUsersHelper: React.FC<DevUsersHelperProps> = ({ onSelectUser }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't render in production
  if (!IS_DEV_MODE) return null;

  return (
    <View style={{ marginTop: spacing[4] }}>
      <Card
        variant="elevated"
        style={{
          backgroundColor: colors.orange[50],
          borderWidth: 1,
          borderColor: colors.orange[200],
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <TouchableOpacity
          onPress={() => setIsExpanded(!isExpanded)}
          style={{
            flexDirection: 'row-reverse',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: spacing[3],
          }}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing[2] }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.orange[100],
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Typography style={{ fontSize: 16 }}>🔧</Typography>
            </View>
            <View>
              <Typography variant="body2" weight="semibold" color="warning" style={{ textAlign: 'right' }}>
                DEV Mode
              </Typography>
              <Typography variant="caption" color="textSecondary" style={{ textAlign: 'right' }}>
                משתמשי דמה לבדיקות
              </Typography>
            </View>
          </View>

          {isExpanded ? (
            <ChevronUp size={20} color={colors.orange[600]} />
          ) : (
            <ChevronDown size={20} color={colors.orange[600]} />
          )}
        </TouchableOpacity>

        {/* Expandable Content */}
        {isExpanded && (
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: colors.orange[200],
              padding: spacing[3],
              gap: spacing[2],
            }}
          >
            <Typography variant="caption" color="textSecondary" align="right">
              לחץ על משתמש למילוי אוטומטי:
            </Typography>

            <ScrollView
              style={{ maxHeight: 200 }}
              showsVerticalScrollIndicator={false}
            >
              {DEV_USERS.map((user, index) => (
                <TouchableOpacity
                  key={user.id}
                  onPress={() => onSelectUser?.(user.email, user.password)}
                  style={{
                    backgroundColor: colors.white,
                    borderRadius: 8,
                    padding: spacing[3],
                    marginBottom: spacing[2],
                    borderWidth: 1,
                    borderColor: colors.gray[200],
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    style={{
                      flexDirection: 'row-reverse',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: spacing[1],
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row-reverse',
                        alignItems: 'center',
                        gap: spacing[2],
                      }}
                    >
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor:
                            user.profile.role === 'teacher'
                              ? colors.blue[100]
                              : colors.green[100],
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <User
                          size={12}
                          color={
                            user.profile.role === 'teacher'
                              ? colors.blue[600]
                              : colors.green[600]
                          }
                        />
                      </View>
                      <Typography variant="body2" weight="semibold" style={{ textAlign: 'right' }}>
                        {user.profile.displayName}
                      </Typography>
                    </View>

                    <View
                      style={{
                        paddingHorizontal: spacing[2],
                        paddingVertical: 4,
                        borderRadius: 6,
                        backgroundColor:
                          user.profile.role === 'teacher'
                            ? colors.blue[50]
                            : colors.green[50],
                      }}
                    >
                      <Typography
                        variant="caption"
                        style={{
                          color:
                            user.profile.role === 'teacher'
                              ? colors.blue[700]
                              : colors.green[700],
                          fontWeight: '600',
                          textAlign: 'right',
                        }}
                      >
                        {user.profile.role === 'teacher' ? 'מורה' : 'תלמיד'}
                      </Typography>
                    </View>
                  </View>

                  <View style={{ gap: 4 }}>
                    <View
                      style={{
                        flexDirection: 'row-reverse',
                        alignItems: 'center',
                        gap: spacing[1],
                      }}
                    >
                      <Typography variant="caption" color="textSecondary">
                        📧
                      </Typography>
                      <Typography
                        variant="caption"
                        color="textSecondary"
                        numberOfLines={1}
                        style={{ flex: 1, textAlign: 'right' }}
                      >
                        {user.email}
                      </Typography>
                    </View>

                    <View
                      style={{
                        flexDirection: 'row-reverse',
                        alignItems: 'center',
                        gap: spacing[1],
                      }}
                    >
                      <Typography variant="caption" color="textSecondary">
                        🔑
                      </Typography>
                      <Typography variant="caption" color="textSecondary" style={{ textAlign: 'right' }}>
                        {user.password}
                      </Typography>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View
              style={{
                marginTop: spacing[2],
                paddingTop: spacing[2],
                borderTopWidth: 1,
                borderTopColor: colors.orange[200],
              }}
            >
              <Typography
                variant="caption"
                color="textSecondary"
                align="center"
                style={{ fontSize: 11 }}
              >
                ⚠️ משתמשי דמה - למצב DEV בלבד
              </Typography>
            </View>
          </View>
        )}
      </Card>
    </View>
  );
};

