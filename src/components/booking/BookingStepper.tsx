import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Typography } from '@/ui/Typography';
import { colors, spacing } from '@/theme/tokens';
import { Check } from 'lucide-react-native';
import { BookingStep } from '@/types/booking';

interface BookingStepperProps {
  steps: BookingStep[];
  currentStep: number;
  onStepPress?: (stepNumber: number) => void;
}

export function BookingStepper({ steps, currentStep, onStepPress }: BookingStepperProps) {
  return (
    <View style={{ 
      flexDirection: 'row-reverse', 
      alignItems: 'center', 
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[4],
      backgroundColor: colors.white,
    }}>
      {steps.map((step, index) => {
        const isActive = step.number === currentStep;
        const isComplete = step.isComplete;
        const isClickable = isComplete && onStepPress;

        return (
          <React.Fragment key={step.number}>
            {/* Step Circle */}
            <TouchableOpacity
              disabled={!isClickable}
              onPress={() => isClickable && onStepPress?.(step.number)}
              style={{
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: isComplete 
                    ? colors.success[600] 
                    : isActive 
                    ? colors.primary[600] 
                    : colors.gray[200],
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: isActive ? 2 : 0,
                  borderColor: colors.primary[700],
                }}
              >
                {isComplete ? (
                  <Check size={16} color={colors.white} strokeWidth={3} />
                ) : (
                  <Typography 
                    variant="caption" 
                    weight="bold"
                    style={{ color: isActive ? colors.white : colors.gray[600] }}
                  >
                    {String(step.number)}
                  </Typography>
                )}
              </View>
              <Typography
                variant="caption"
                style={{
                  fontSize: 10,
                  color: isActive ? colors.primary[700] : colors.gray[600],
                  fontWeight: isActive ? '600' : '400',
                  maxWidth: 60,
                  textAlign: 'center',
                  marginTop: spacing[1],
                }}
                numberOfLines={2}
              >
                {step.title}
              </Typography>
            </TouchableOpacity>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <View
                style={{
                  flex: 1,
                  height: 2,
                  backgroundColor: steps[index + 1].isComplete 
                    ? colors.success[600] 
                    : colors.gray[200],
                  marginHorizontal: spacing[1],
                  marginBottom: 20, // Offset for the label below
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

