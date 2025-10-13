/**
 * Day Availability Modal
 * Allows teachers to manage availability slots for a specific day
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Modal,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, Plus, Trash2, Clock, Calendar } from 'lucide-react-native';
import { Typography } from '@/ui/Typography';
import { Button } from '@/ui/Button';
import { colors, spacing, shadows } from '@/theme/tokens';
import { useRTL } from '@/context/RTLContext';
import {
  getTeacherAvailabilitySlots,
  upsertAvailabilitySlots,
  closeDay,
  openDay,
  type AvailabilitySlot,
  type SlotInput,
} from '@/services/api';

interface DayAvailabilityModalProps {
  visible: boolean;
  date: Date;
  teacherId: string;
  onClose: () => void;
  onSlotsUpdated?: () => void;
}

interface TimeSlot {
  id: string;
  startTime: string;  // HH:MM
  endTime: string;    // HH:MM
  isBooked: boolean;
  bookingId?: string;
}

export const DayAvailabilityModal: React.FC<DayAvailabilityModalProps> = ({
  visible,
  date,
  teacherId,
  onClose,
  onSlotsUpdated,
}) => {
  const { isRTL } = useRTL();
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Format date for display
  const dateStr = date.toLocaleDateString('he-IL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD

  // Load existing slots
  useEffect(() => {
    if (visible && teacherId) {
      loadSlots();
    }
  }, [visible, teacherId, date]);

  const loadSlots = async () => {
    setLoading(true);
    try {
      const existingSlots = await getTeacherAvailabilitySlots(
        teacherId,
        dateKey,
        dateKey
      );

      const timeSlots: TimeSlot[] = existingSlots.map((slot) => {
        const start = new Date(slot.startAt);
        const end = new Date(slot.endAt);
        return {
          id: slot.id,
          startTime: `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`,
          endTime: `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`,
          isBooked: slot.isBooked,
          bookingId: slot.bookingId,
        };
      });

      setSlots(timeSlots);
    } catch (error: any) {
      console.error('Error loading slots:', error);
      Alert.alert('שגיאה', 'לא הצלחנו לטעון את המשבצות');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = () => {
    // Add a new empty slot (default 09:00-10:00)
    const newSlot: TimeSlot = {
      id: `temp-${Date.now()}`,
      startTime: '09:00',
      endTime: '10:00',
      isBooked: false,
    };
    setSlots([...slots, newSlot]);
  };

  const handleRemoveSlot = (slotId: string) => {
    const slot = slots.find((s) => s.id === slotId);
    if (slot?.isBooked) {
      Alert.alert('שגיאה', 'לא ניתן למחוק משבצת עם הזמנה קיימת');
      return;
    }
    setSlots(slots.filter((s) => s.id !== slotId));
  };

  const handleTimeChange = (slotId: string, field: 'startTime' | 'endTime', value: string) => {
    setSlots(slots.map(slot => 
      slot.id === slotId ? { ...slot, [field]: value } : slot
    ));
  };

  const handleSaveSlots = async () => {
    // Validate slots
    for (const slot of slots) {
      if (slot.startTime >= slot.endTime) {
        Alert.alert('שגיאה', 'שעת סיום חייבת להיות אחרי שעת התחלה');
        return;
      }
    }

    setSaving(true);
    try {
      const slotInputs: SlotInput[] = slots
        .filter(s => !s.isBooked) // Don't touch booked slots
        .map(s => ({
          start_time: s.startTime,
          end_time: s.endTime,
        }));

      await upsertAvailabilitySlots(teacherId, dateKey, slotInputs);
      
      Alert.alert('הצלחה', 'המשבצות נשמרו בהצלחה');
      onSlotsUpdated?.();
      onClose();
    } catch (error: any) {
      console.error('Error saving slots:', error);
      Alert.alert('שגיאה', error.message || 'לא הצלחנו לשמור את המשבצות');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseDay = async () => {
    const bookedCount = slots.filter(s => s.isBooked).length;
    if (bookedCount > 0) {
      Alert.alert('שגיאה', 'לא ניתן לסגור יום עם הזמנות קיימות');
      return;
    }

    Alert.alert(
      'סגירת יום',
      'האם אתה בטוח שברצונך לסגור את היום הזה? כל המשבצות יימחקו.',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'סגור יום',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              await closeDay(teacherId, dateKey);
              Alert.alert('הצלחה', 'היום נסגר בהצלחה');
              onSlotsUpdated?.();
              onClose();
            } catch (error: any) {
              Alert.alert('שגיאה', error.message || 'לא הצלחנו לסגור את היום');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleOpenDay = async () => {
    Alert.alert(
      'פתיחת יום',
      'האם אתה רוצה לפתוח את היום עם משבצות ברירת מחדל? (09:00-17:00, משבצות של שעה)',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'פתח יום',
          onPress: async () => {
            setSaving(true);
            try {
              await openDay(teacherId, dateKey, {
                defaultStartTime: '09:00',
                defaultEndTime: '17:00',
                slotDuration: 60,
              });
              Alert.alert('הצלחה', 'היום נפתח בהצלחה');
              await loadSlots(); // Reload to show new slots
              onSlotsUpdated?.();
            } catch (error: any) {
              Alert.alert('שגיאה', error.message || 'לא הצלחנו לפתוח את היום');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const isDayClosed = slots.length === 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing[4],
        }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: colors.white,
            borderRadius: 16,
            padding: spacing[4],
            width: '100%',
            maxWidth: 500,
            maxHeight: '85%',
            ...shadows.xl,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: isRTL ? 'row-reverse' : 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: spacing[3],
              paddingBottom: spacing[3],
              borderBottomWidth: 1,
              borderBottomColor: colors.gray[200],
            }}
          >
            <View style={{ flex: 1 }}>
              <Typography variant="h5" weight="bold">
                ניהול זמינות
              </Typography>
              <Typography variant="caption" color="textSecondary" style={{ marginTop: 4 }}>
                {dateStr}
              </Typography>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.gray[100],
                justifyContent: 'center',
                alignItems: 'center',
              }}
              accessibilityLabel="סגור"
              accessibilityRole="button"
            >
              <X size={18} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {loading ? (
            <View style={{ padding: spacing[8], alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.primary[600]} />
              <Typography variant="body2" color="textSecondary" style={{ marginTop: spacing[2] }}>
                טוען משבצות...
              </Typography>
            </View>
          ) : (
            <>
              {/* Day Status Controls */}
              <View
                style={{
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  gap: spacing[2],
                  marginBottom: spacing[3],
                }}
              >
                {isDayClosed ? (
                  <Button
                    onPress={handleOpenDay}
                    disabled={saving}
                    style={{
                      flex: 1,
                      backgroundColor: colors.success[600],
                      paddingVertical: spacing[2],
                    }}
                  >
                    <Calendar size={16} color={colors.white} style={{ marginLeft: spacing[1] }} />
                    <Typography variant="body2" weight="semibold" color="white">
                      פתח יום
                    </Typography>
                  </Button>
                ) : (
                  <Button
                    onPress={handleCloseDay}
                    disabled={saving}
                    style={{
                      flex: 1,
                      backgroundColor: colors.error[600],
                      paddingVertical: spacing[2],
                    }}
                  >
                    <X size={16} color={colors.white} style={{ marginLeft: spacing[1] }} />
                    <Typography variant="body2" weight="semibold" color="white">
                      סגור יום
                    </Typography>
                  </Button>
                )}
              </View>

              {/* Slots List */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: 400 }}
              >
                {slots.length === 0 ? (
                  <View
                    style={{
                      paddingVertical: spacing[6],
                      alignItems: 'center',
                    }}
                  >
                    <Typography variant="body1" color="textSecondary" align="center">
                      אין משבצות זמינות
                    </Typography>
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      align="center"
                      style={{ marginTop: spacing[2] }}
                    >
                      לחץ על "פתח יום" או "הוסף משבצת"
                    </Typography>
                  </View>
                ) : (
                  <View style={{ gap: spacing[2] }}>
                    {slots.map((slot, index) => (
                      <View
                        key={slot.id}
                        style={{
                          backgroundColor: slot.isBooked ? colors.blue[50] : colors.gray[50],
                          borderRadius: 12,
                          padding: spacing[3],
                          borderWidth: 1,
                          borderColor: slot.isBooked ? colors.blue[200] : colors.gray[200],
                        }}
                      >
                        <View
                          style={{
                            flexDirection: isRTL ? 'row-reverse' : 'row',
                            alignItems: 'center',
                            gap: spacing[2],
                          }}
                        >
                          <Clock size={16} color={colors.gray[500]} />
                          
                          {/* Time inputs */}
                          <View style={{ flex: 1, flexDirection: isRTL ? 'row-reverse' : 'row', gap: spacing[1], alignItems: 'center' }}>
                            <TouchableOpacity
                              onPress={() => {
                                if (!slot.isBooked) {
                                  Alert.prompt(
                                    'שעת התחלה',
                                    'הכנס שעה בפורמט HH:MM (לדוגמה: 09:00)',
                                    (text) => {
                                      if (text && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(text)) {
                                        handleTimeChange(slot.id, 'startTime', text);
                                      } else {
                                        Alert.alert('שגיאה', 'פורמט שעה לא תקין. השתמש ב-HH:MM');
                                      }
                                    },
                                    'plain-text',
                                    slot.startTime
                                  );
                                }
                              }}
                              disabled={slot.isBooked}
                              style={{
                                paddingHorizontal: spacing[2],
                                paddingVertical: spacing[1],
                                borderRadius: 6,
                                borderWidth: 1,
                                borderColor: colors.gray[300],
                                backgroundColor: slot.isBooked ? colors.gray[100] : colors.white,
                                minWidth: 70,
                              }}
                            >
                              <Typography variant="body2" style={{ textAlign: 'center' }}>
                                {slot.startTime}
                              </Typography>
                            </TouchableOpacity>
                            
                            <Typography variant="body2" color="textSecondary">-</Typography>
                            
                            <TouchableOpacity
                              onPress={() => {
                                if (!slot.isBooked) {
                                  Alert.prompt(
                                    'שעת סיום',
                                    'הכנס שעה בפורמט HH:MM (לדוגמה: 10:00)',
                                    (text) => {
                                      if (text && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(text)) {
                                        handleTimeChange(slot.id, 'endTime', text);
                                      } else {
                                        Alert.alert('שגיאה', 'פורמט שעה לא תקין. השתמש ב-HH:MM');
                                      }
                                    },
                                    'plain-text',
                                    slot.endTime
                                  );
                                }
                              }}
                              disabled={slot.isBooked}
                              style={{
                                paddingHorizontal: spacing[2],
                                paddingVertical: spacing[1],
                                borderRadius: 6,
                                borderWidth: 1,
                                borderColor: colors.gray[300],
                                backgroundColor: slot.isBooked ? colors.gray[100] : colors.white,
                                minWidth: 70,
                              }}
                            >
                              <Typography variant="body2" style={{ textAlign: 'center' }}>
                                {slot.endTime}
                              </Typography>
                            </TouchableOpacity>
                          </View>

                          {slot.isBooked ? (
                            <View
                              style={{
                                paddingHorizontal: spacing[2],
                                paddingVertical: spacing[1],
                                backgroundColor: colors.blue[100],
                                borderRadius: 6,
                              }}
                            >
                              <Typography variant="caption" color="primary" weight="semibold">
                                מוזמן
                              </Typography>
                            </View>
                          ) : (
                            <TouchableOpacity
                              onPress={() => handleRemoveSlot(slot.id)}
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 16,
                                backgroundColor: colors.error[50],
                                justifyContent: 'center',
                                alignItems: 'center',
                              }}
                              accessibilityLabel="מחק משבצת"
                              accessibilityRole="button"
                            >
                              <Trash2 size={16} color={colors.error[600]} />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>

              {/* Add Slot Button */}
              {!isDayClosed && (
                <TouchableOpacity
                  onPress={handleAddSlot}
                  style={{
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: spacing[1],
                    padding: spacing[3],
                    marginTop: spacing[3],
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: colors.primary[300],
                    borderStyle: 'dashed',
                    backgroundColor: colors.primary[50],
                  }}
                  accessibilityLabel="הוסף משבצת"
                  accessibilityRole="button"
                >
                  <Plus size={20} color={colors.primary[600]} />
                  <Typography variant="body2" color="primary" weight="semibold">
                    הוסף משבצת
                  </Typography>
                </TouchableOpacity>
              )}

              {/* Action Buttons */}
              <View
                style={{
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  gap: spacing[2],
                  marginTop: spacing[4],
                  paddingTop: spacing[3],
                  borderTopWidth: 1,
                  borderTopColor: colors.gray[200],
                }}
              >
                <Button
                  onPress={onClose}
                  disabled={saving}
                  style={{
                    flex: 1,
                    backgroundColor: colors.gray[100],
                    paddingVertical: spacing[2],
                  }}
                >
                  <Typography variant="body2" weight="semibold" color="text">
                    ביטול
                  </Typography>
                </Button>
                <Button
                  onPress={handleSaveSlots}
                  disabled={saving || isDayClosed}
                  style={{
                    flex: 1,
                    backgroundColor: colors.primary[600],
                    paddingVertical: spacing[2],
                  }}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Typography variant="body2" weight="semibold" color="white">
                      שמור שינויים
                    </Typography>
                  )}
                </Button>
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

