import { useState } from 'react';
import { View, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Typography } from '@/ui/Typography';
import { colors, spacing } from '@/theme/tokens';
import { BookingData, SavedAddress } from '@/types/booking';
import { MapPin, Plus, Check, Mail } from 'lucide-react-native';

interface BookingStep3Props {
  data: BookingData;
  teacherLocation?: string | null;
  teacherAreas?: string[];
  onChange: (data: Partial<BookingData>) => void;
  errors: Record<string, string>;
}

// Mock saved addresses
const MOCK_SAVED_ADDRESSES: SavedAddress[] = [
  { id: '1', label: 'בית', address: 'רחוב הרצל 45, תל אביב', city: 'תל אביב', default: true },
  { id: '2', label: 'עבודה', address: 'דרך מנחם בגין 125, תל אביב', city: 'תל אביב', default: false },
];

export function BookingStep3({ data, teacherLocation, teacherAreas, onChange, errors }: BookingStep3Props) {
  const [showNewAddress, setShowNewAddress] = useState(!data.savedAddressId && !data.address);
  const [newAddress, setNewAddress] = useState(data.address || '');

  const isOnline = data.lessonType === 'online';
  const isAtTeacher = data.lessonType === 'teacher_location';

  // Online lesson - no location needed
  if (isOnline) {
    return (
      <View style={{ flex: 1, padding: spacing[4], justifyContent: 'center', alignItems: 'center' }}>
        <View style={{
          padding: spacing[6],
          backgroundColor: colors.blue[50],
          borderRadius: 16,
          alignItems: 'center',
          maxWidth: 400,
        }}>
          <Mail size={48} color={colors.blue[600]} />
          <Typography variant="h5" weight="bold" style={{ marginTop: spacing[3], textAlign: 'center' }}>
            שיעור אונליין
          </Typography>
          <Typography variant="body2" color="textSecondary" style={{ marginTop: spacing[2], textAlign: 'center', lineHeight: 22 }}>
            קישור לשיעור יישלח אליך במייל לאחר אישור ההזמנה
          </Typography>
          <View style={{
            marginTop: spacing[4],
            padding: spacing[3],
            backgroundColor: colors.white,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.blue[200],
            width: '100%',
          }}>
            <Typography variant="caption" color="textSecondary" style={{ textAlign: 'center' }}>
              💡 הקפד להיות זמין 5 דקות לפני תחילת השיעור
            </Typography>
          </View>
        </View>
      </View>
    );
  }

  // At teacher location - show teacher's address/region
  if (isAtTeacher) {
    return (
      <View style={{ flex: 1, padding: spacing[4], justifyContent: 'center', alignItems: 'center' }}>
        <View style={{
          padding: spacing[6],
          backgroundColor: colors.green[50],
          borderRadius: 16,
          alignItems: 'center',
          maxWidth: 400,
          width: '100%',
        }}>
          <MapPin size={48} color={colors.green[600]} />
          <Typography variant="h5" weight="bold" style={{ marginTop: spacing[3], textAlign: 'center' }}>
            שיעור אצל המורה
          </Typography>
          <Typography variant="body2" color="textSecondary" style={{ marginTop: spacing[2], textAlign: 'center', lineHeight: 22 }}>
            השיעור יתקיים בכתובת המורה
          </Typography>
          
          {teacherLocation && (
            <View style={{
              marginTop: spacing[4],
              padding: spacing[4],
              backgroundColor: colors.white,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.green[200],
              width: '100%',
            }}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'flex-start' }}>
                <MapPin size={20} color={colors.green[600]} style={{ marginLeft: spacing[2] }} />
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Typography variant="body2" weight="semibold" style={{ textAlign: 'right' }}>
                    {teacherLocation}
                  </Typography>
                  {teacherAreas && teacherAreas.length > 1 && (
                    <Typography variant="caption" color="textSecondary" style={{ marginTop: spacing[1], textAlign: 'right' }}>
                      {teacherAreas.slice(1).join(', ')}
                    </Typography>
                  )}
                </View>
              </View>
            </View>
          )}
          
          <View style={{
            marginTop: spacing[4],
            padding: spacing[3],
            backgroundColor: colors.white,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.green[200],
            width: '100%',
          }}>
            <Typography variant="caption" color="textSecondary" style={{ textAlign: 'center' }}>
              💡 הכתובת המדויקת תישלח אליך לאחר אישור ההזמנה
            </Typography>
          </View>
        </View>
      </View>
    );
  }

  const locationLabel = data.lessonType === 'student_location' ? 'הכתובת שלך' : 'כתובת המורה';
  const locationDescription = data.lessonType === 'student_location' 
    ? 'המורה יגיע לכתובת זו'
    : 'תגיע לכתובת זו';

  return (
    <ScrollView 
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: spacing[4] }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ marginBottom: spacing[4] }}>
        <Typography variant="h4" weight="bold" style={{ textAlign: 'right', marginBottom: spacing[2] }}>
          {locationLabel}
        </Typography>
        <Typography variant="body2" color="textSecondary" style={{ textAlign: 'right' }}>
          {locationDescription}
        </Typography>
      </View>

      {data.lessonType === 'student_location' ? (
        <>
          {/* Saved Addresses */}
          {MOCK_SAVED_ADDRESSES.length > 0 && !showNewAddress && (
            <View style={{ marginBottom: spacing[4] }}>
              <Typography variant="body1" weight="semibold" style={{ textAlign: 'right', marginBottom: spacing[2] }}>
                בחר כתובת שמורה
              </Typography>
              <View>
                {MOCK_SAVED_ADDRESSES.map((addr) => {
                  const isSelected = data.savedAddressId === addr.id;
                  return (
                    <TouchableOpacity
                      key={addr.id}
                      onPress={() => onChange({ savedAddressId: addr.id, address: undefined })}
                      style={{
                        flexDirection: 'row-reverse',
                        alignItems: 'center',
                        padding: spacing[3],
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: isSelected ? colors.primary[600] : colors.gray[300],
                        backgroundColor: isSelected ? colors.primary[50] : colors.white,
                        marginBottom: spacing[2],
                      }}
                    >
                      {isSelected && (
                        <View style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: colors.primary[600],
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}>
                          <Check size={16} color={colors.white} strokeWidth={3} />
                        </View>
                      )}
                      <View style={{ flex: 1, alignItems: 'flex-end', marginHorizontal: spacing[3] }}>
                        <View style={{ flexDirection: 'row-reverse', alignItems: 'center' }}>
                          <Typography variant="body1" weight="semibold">
                            {addr.label}
                          </Typography>
                          {addr.default && (
                            <View style={{
                              paddingHorizontal: spacing[2],
                              paddingVertical: 2,
                              backgroundColor: colors.blue[100],
                              borderRadius: 4,
                              marginLeft: spacing[2],
                            }}>
                              <Typography variant="caption" style={{ fontSize: 10 }} color="primary">
                                ברירת מחדל
                              </Typography>
                            </View>
                          )}
                        </View>
                        <Typography variant="caption" color="textSecondary">
                          {addr.address}
                        </Typography>
                      </View>
                      <MapPin size={20} color={isSelected ? colors.primary[600] : colors.gray[600]} style={{ marginLeft: spacing[3] }} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Add New Address Button */}
          {!showNewAddress && (
            <TouchableOpacity
              onPress={() => setShowNewAddress(true)}
              style={{
                flexDirection: 'row-reverse',
                alignItems: 'center',
                justifyContent: 'center',
                padding: spacing[3],
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.gray[300],
                borderStyle: 'dashed',
                marginBottom: spacing[4],
              }}
            >
              <Plus size={20} color={colors.primary[600]} style={{ marginRight: spacing[2] }} />
              <Typography variant="body2" color="primary" weight="semibold">
                הוסף כתובת חדשה
              </Typography>
            </TouchableOpacity>
          )}

          {/* New Address Form */}
          {showNewAddress && (
            <View>
              <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[2] }}>
                <Typography variant="body1" weight="semibold">
                  כתובת חדשה <Typography color="error">*</Typography>
                </Typography>
                {MOCK_SAVED_ADDRESSES.length > 0 && (
                  <TouchableOpacity onPress={() => setShowNewAddress(false)}>
                    <Typography variant="caption" color="primary">
                      ביטול
                    </Typography>
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                value={newAddress}
                onChangeText={(text) => {
                  setNewAddress(text);
                  onChange({ address: text, savedAddressId: undefined });
                }}
                placeholder="רחוב, מספר בית, עיר"
                placeholderTextColor={colors.gray[400]}
                style={{
                  borderWidth: 1,
                  borderColor: errors.address ? colors.error[500] : colors.gray[300],
                  borderRadius: 12,
                  padding: spacing[3],
                  textAlign: 'right',
                  fontFamily: 'System',
                  fontSize: 16,
                  color: colors.gray[900],
                }}
              />
              {errors.address && (
                <Typography variant="caption" color="error" style={{ marginTop: spacing[1], textAlign: 'right' }}>
                  {errors.address}
                </Typography>
              )}
            </View>
          )}
        </>
      ) : (
        // Teacher's location - read-only
        <View style={{
          padding: spacing[4],
          backgroundColor: colors.gray[50],
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.gray[200],
        }}>
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', marginBottom: spacing[2] }}>
            <MapPin size={20} color={colors.gray[600]} style={{ marginRight: spacing[2] }} />
            <Typography variant="body1" weight="semibold">
              כתובת המורה
            </Typography>
          </View>
          <Typography variant="body2" color="textSecondary" style={{ textAlign: 'right' }}>
            הכתובת המדויקת תשלח אליך לאחר אישור ההזמנה
          </Typography>
        </View>
      )}
    </ScrollView>
  );
}

