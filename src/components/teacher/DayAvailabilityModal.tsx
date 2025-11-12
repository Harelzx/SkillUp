/**
 * Day Availability Modal
 * Allows teachers to manage availability slots for a specific day
 */

import React, { useState, useEffect, useMemo } from 'react';
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
  deleteAvailabilitySlot,
  type SlotInput,
} from '@/services/api/teacherAPI';

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

// Helper functions for efficient time calculations
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

const findLatestSlot = (slots: TimeSlot[]): TimeSlot | null => {
  if (slots.length === 0) return null;
  
  let latest = slots[0];
  let latestEndMinutes = timeToMinutes(latest.endTime);
  
  for (let i = 1; i < slots.length; i++) {
    const endMinutes = timeToMinutes(slots[i].endTime);
    if (endMinutes > latestEndMinutes) {
      latest = slots[i];
      latestEndMinutes = endMinutes;
    }
  }
  
  return latest;
};

export const DayAvailabilityModal: React.FC<DayAvailabilityModalProps> = ({
  visible,
  date,
  teacherId,
  onClose,
  onSlotsUpdated,
}) => {
  const { isRTL, getFlexDirection, getTextAlign, getMarginStart } = useRTL();
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

  // Cache the latest slot calculation with useMemo for performance
  // Only consider saved slots (not temporary ones) for next time calculation
  const latestSlot = useMemo(() => {
    const savedSlots = slots.filter(s => !s.id.startsWith('temp-'));
    return findLatestSlot(savedSlots);
  }, [slots]);

  // Load existing slots
  useEffect(() => {
    if (visible && teacherId) {
      loadSlots();
    }
  }, [visible, teacherId, date]);

  const loadSlots = async () => {
    setLoading(true);
    try {
      console.log('🔄 [DayAvailabilityModal] Loading slots from database...');
      console.log('   Teacher ID:', teacherId);
      console.log('   Date:', dateKey);
      
      const existingSlots = await getTeacherAvailabilitySlots(
        teacherId,
        dateKey,
        dateKey
      );

      console.log('✅ [DayAvailabilityModal] Loaded', existingSlots.length, 'slots from database');
      
      const timeSlots: TimeSlot[] = existingSlots.map((slot) => {
        const start = new Date(slot.startAt);
        const end = new Date(slot.endAt);
        const startTime = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`;
        const endTime = `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;
        
        console.log(`   Slot: ${slot.id} - ${startTime} to ${endTime} (booked: ${slot.isBooked})`);
        
        return {
          id: slot.id,
          startTime,
          endTime,
          isBooked: slot.isBooked,
          bookingId: slot.bookingId,
        };
      });

      setSlots(timeSlots);
      
      // Log latest slot after loading
      const savedSlots = timeSlots.filter(s => !s.id.startsWith('temp-'));
      if (savedSlots.length > 0) {
        const latest = findLatestSlot(savedSlots);
        console.log('🔵 [DayAvailabilityModal] Latest slot after load:', latest ? `${latest.startTime}-${latest.endTime}` : 'none');
      } else {
        console.log('🔵 [DayAvailabilityModal] No saved slots found in database');
      }
    } catch (error: any) {
      console.error('❌ [DayAvailabilityModal] Error loading slots:', error);
      Alert.alert('שגיאה', 'לא הצלחנו לטעון את המשבצות');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = () => {
    console.log('🔵 [DayAvailabilityModal] handleAddSlot called');
    console.log('   Current slots count:', slots.length);
    
    const WORK_END_MINUTES = 23 * 60; // 23:00
    const SLOT_DURATION = 60; // 1 hour

    let nextStartTime = '09:00';
    let nextEndTime = '10:00';

    // Calculate latest slot from ALL current slots (including temporary ones)
    // This ensures that when adding consecutive slots, each one is placed after the previous one
    const currentLatestSlot = findLatestSlot(slots);
    
    console.log('   Latest slot from all slots (including temp):', currentLatestSlot ? `${currentLatestSlot.startTime}-${currentLatestSlot.endTime}` : 'null');
    console.log('   Latest slot from cache (saved only):', latestSlot ? `${latestSlot.startTime}-${latestSlot.endTime}` : 'null');
    
    if (currentLatestSlot) {
      const latestEndMinutes = timeToMinutes(currentLatestSlot.endTime);
      console.log('   Latest slot end time (minutes):', latestEndMinutes);
      console.log('   Latest slot end time (HH:MM):', currentLatestSlot.endTime);
      
      // If latest slot ends before 23:00, add after it
      if (latestEndMinutes < WORK_END_MINUTES) {
        const nextStartMinutes = latestEndMinutes;
        const nextEndMinutes = Math.min(nextStartMinutes + SLOT_DURATION, WORK_END_MINUTES);
        
        console.log('   Next start minutes:', nextStartMinutes);
        console.log('   Next end minutes:', nextEndMinutes);
        
        // Only add if we have space for at least 30 minutes
        if (nextEndMinutes - nextStartMinutes >= 30) {
          nextStartTime = minutesToTime(nextStartMinutes);
          nextEndTime = minutesToTime(nextEndMinutes);
          console.log('   ✅ Calculated next slot:', `${nextStartTime}-${nextEndTime}`);
        } else {
          console.log('   ⚠️ Not enough space, using default 09:00-10:00');
        }
      } else {
        console.log('   ⚠️ Latest slot ends at or after 23:00, using default 09:00-10:00');
      }
    } else {
      console.log('   ℹ️ No latest slot found, using default 09:00-10:00');
    }

    console.log('   Final slot to add:', `${nextStartTime}-${nextEndTime}`);

    // Optimistic update - add to UI immediately
    const newSlot: TimeSlot = {
      id: `temp-${Date.now()}`,
      startTime: nextStartTime,
      endTime: nextEndTime,
      isBooked: false,
    };
    
    // Use functional update for better performance
    setSlots(prevSlots => {
      console.log('   Adding slot to UI, new total:', prevSlots.length + 1);
      return [...prevSlots, newSlot];
    });
  };

  const handleRemoveSlot = async (slotId: string) => {
    console.log('🔵 [DayAvailabilityModal] handleRemoveSlot called for slot:', slotId);
    
    const slot = slots.find((s) => s.id === slotId);
    
    if (!slot) {
      console.log('   ⚠️ Slot not found');
      return;
    }

    console.log('   Slot to remove:', `${slot.startTime}-${slot.endTime} (booked: ${slot.isBooked})`);

    // Check if slot is booked
    if (slot.isBooked) {
      Alert.alert('שגיאה', 'לא ניתן למחוק משבצת עם הזמנה קיימת');
      return;
    }

    // If it's a temporary slot (starts with 'temp-'), just remove from UI
    if (slot.id.startsWith('temp-')) {
      console.log('   Removing temporary slot from UI only');
      setSlots(slots.filter((s) => s.id !== slotId));
      return;
    }

    // For existing slots, delete from database immediately
    console.log('   Deleting slot from database...');
    setSaving(true);
    try {
      await deleteAvailabilitySlot(slot.id);
      console.log('   ✅ Slot deleted from database successfully');
      
      // Reload slots from database to ensure consistency
      await loadSlots();
      
      // Notify parent to refresh
      onSlotsUpdated?.();
    } catch (error: any) {
      console.error('❌ [DayAvailabilityModal] Error deleting slot:', error);
      Alert.alert('שגיאה', error.message || 'לא הצלחנו למחוק את המשבצת');
    } finally {
      setSaving(false);
    }
  };

  const handleTimeChange = (slotId: string, field: 'startTime' | 'endTime', value: string) => {
    setSlots(slots.map(slot => 
      slot.id === slotId ? { ...slot, [field]: value } : slot
    ));
  };

  const handleSaveSlots = async () => {
    console.log('🔵 [DayAvailabilityModal] handleSaveSlots called');
    console.log('   Total slots to save:', slots.length);
    
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

      console.log('   Saving to database:', JSON.stringify(slotInputs, null, 2));
      console.log('   Teacher ID:', teacherId);
      console.log('   Date:', dateKey);

      await upsertAvailabilitySlots(teacherId, dateKey, slotInputs);
      
      console.log('   ✅ Slots saved to database successfully');
      
      // Reload slots from database to ensure we have the latest data with correct IDs
      console.log('   Reloading slots from database...');
      await loadSlots();
      
      Alert.alert('הצלחה', 'המשבצות נשמרו בהצלחה');
      onSlotsUpdated?.();
      onClose();
    } catch (error: any) {
      console.error('❌ [DayAvailabilityModal] Error saving slots:', error);
      Alert.alert('שגיאה', error.message || 'לא הצלחנו לשמור את המשבצות');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseDay = async () => {
    console.log('🔵 [DayAvailabilityModal] handleCloseDay called');
    
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
            console.log('   Closing day in database...');
            setSaving(true);
            try {
              await closeDay(teacherId, dateKey);
              console.log('   ✅ Day closed in database successfully');
              
              // Reload slots from database (should be empty now)
              await loadSlots();
              
              Alert.alert('הצלחה', 'היום נסגר בהצלחה');
              onSlotsUpdated?.();
              onClose();
            } catch (error: any) {
              console.error('❌ [DayAvailabilityModal] Error closing day:', error);
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
    console.log('🔵 [DayAvailabilityModal] handleOpenDay called');
    
    Alert.alert(
      'פתיחת יום',
      'האם אתה רוצה לפתוח את היום עם משבצות ברירת מחדל? (09:00-17:00, משבצות של שעה)',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'פתח יום',
          onPress: async () => {
            console.log('   Opening day in database...');
            console.log('   Teacher ID:', teacherId);
            console.log('   Date:', dateKey);
            
            setSaving(true);
            try {
              const result = await openDay(teacherId, dateKey, {
                defaultStartTime: '09:00',
                defaultEndTime: '17:00',
                slotDuration: 60,
              });
              
              console.log('   ✅ Day opened in database successfully');
              console.log('   Slots created:', result.slotsCreated);
              
              // Reload slots from database to show new slots
              await loadSlots();
              
              Alert.alert('הצלחה', 'היום נפתח בהצלחה');
              onSlotsUpdated?.();
            } catch (error: any) {
              console.error('❌ [DayAvailabilityModal] Error opening day:', error);
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
              flexDirection: getFlexDirection('row-reverse'),
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: spacing[3],
              paddingBottom: spacing[3],
              borderBottomWidth: 1,
              borderBottomColor: colors.gray[200],
            }}
          >
            <View style={{ flex: 1 }}>
              <Typography variant="h5" weight="bold" align={getTextAlign('right')}>
                ניהול זמינות
              </Typography>
              <Typography variant="caption" color="textSecondary" style={{ marginTop: 4 }} align={getTextAlign('right')}>
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
                  flexDirection: getFlexDirection('row-reverse'),
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
                    <Calendar size={16} color={colors.white} style={getMarginStart(spacing[1])} />
                    <Typography variant="body2" weight="semibold" color="white" align={getTextAlign('right')}>
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
                    <X size={16} color={colors.white} style={getMarginStart(spacing[1])} />
                    <Typography variant="body2" weight="semibold" color="white" align={getTextAlign('right')}>
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
                    {slots.map((slot) => (
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
                            flexDirection: getFlexDirection('row-reverse'),
                            alignItems: 'center',
                            gap: spacing[2],
                          }}
                        >
                          <Clock size={16} color={colors.gray[500]} />
                          
                          {/* Time inputs */}
                          <View style={{ flex: 1, flexDirection: getFlexDirection('row-reverse'), gap: spacing[1], alignItems: 'center' }}>
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
                    flexDirection: getFlexDirection('row-reverse'),
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
                  <Typography variant="body2" color="primary" weight="semibold" align={getTextAlign('right')}>
                    הוסף משבצת
                  </Typography>
                </TouchableOpacity>
              )}

              {/* Action Buttons */}
              <View
                style={{
                  flexDirection: getFlexDirection('row-reverse'),
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
                  <Typography variant="body2" weight="semibold" color="text" align={getTextAlign('right')}>
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
                    <Typography variant="body2" weight="semibold" color="white" align={getTextAlign('right')}>
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

