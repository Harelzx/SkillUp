import React, { useState, forwardRef } from 'react';
import {
  TextInput,
  View,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, borderRadius, spacing, typography, sizes } from '@/theme/tokens';
import { createStyle, combineStyles } from '@/theme/utils';
import { Typography } from './Typography';
import { useRTL } from '@/context/RTLContext';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'outlined' | 'filled';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  disabled?: boolean;
  required?: boolean;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
}

const styles = createStyle({
  container: {
    marginBottom: spacing[4],
  },

  labelContainer: {
    flexDirection: 'row',
    marginBottom: spacing[2],
  },

  label: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.gray[700],
  },

  required: {
    color: colors.error[600],
    marginLeft: spacing[1],
  },

  inputContainer: {
    position: 'relative',
  },

  input: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.normal,
    color: colors.gray[900],
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },

  // Size variants
  inputSm: {
    ...sizes.input.sm,
    fontSize: typography.fontSizes.sm,
  },

  inputMd: {
    ...sizes.input.md,
    fontSize: typography.fontSizes.base,
  },

  inputLg: {
    ...sizes.input.lg,
    fontSize: typography.fontSizes.lg,
  },

  // Variant styles
  outlined: {
    backgroundColor: colors.white,
    borderColor: colors.gray[300],
  },

  outlinedFocused: {
    borderColor: colors.primary[600],
    borderWidth: 2,
  },

  outlinedError: {
    borderColor: colors.error[500],
    borderWidth: 2,
  },

  filled: {
    backgroundColor: colors.gray[50],
    borderColor: colors.transparent,
  },

  filledFocused: {
    backgroundColor: colors.white,
    borderColor: colors.primary[600],
    borderWidth: 2,
  },

  filledError: {
    backgroundColor: colors.white,
    borderColor: colors.error[500],
    borderWidth: 2,
  },

  // State styles
  disabled: {
    backgroundColor: colors.gray[100],
    borderColor: colors.gray[200],
    color: colors.gray[400],
  },

  // Icon styles (LTR)
  leftIconContainer: {
    position: 'absolute',
    left: spacing[3],
    top: '50%',
    transform: [{ translateY: -10 }],
    zIndex: 1,
  },

  rightIconContainer: {
    position: 'absolute',
    right: spacing[3],
    top: '50%',
    transform: [{ translateY: -10 }],
    zIndex: 1,
  },

  // Icon styles (RTL)
  leftIconContainerRTL: {
    position: 'absolute',
    right: spacing[3],
    top: '50%',
    transform: [{ translateY: -10 }],
    zIndex: 1,
  },

  rightIconContainerRTL: {
    position: 'absolute',
    left: spacing[3],
    top: '50%',
    transform: [{ translateY: -10 }],
    zIndex: 1,
  },

  inputWithLeftIcon: {
    paddingLeft: spacing[10],
  },

  inputWithRightIcon: {
    paddingRight: spacing[10],
  },

  inputWithLeftIconRTL: {
    paddingRight: spacing[10],
  },

  inputWithRightIconRTL: {
    paddingLeft: spacing[10],
  },

  // Helper text styles
  helperTextContainer: {
    marginTop: spacing[1],
  },

  helperText: {
    fontSize: typography.fontSizes.xs,
    color: colors.gray[600],
  },

  errorText: {
    fontSize: typography.fontSizes.xs,
    color: colors.error[600],
  },
});

export const Input = forwardRef<TextInput, InputProps>(({
  label,
  error,
  helperText,
  size = 'md',
  variant = 'outlined',
  leftIcon,
  rightIcon,
  disabled = false,
  required = false,
  containerStyle,
  inputStyle,
  labelStyle,
  onFocus,
  onBlur,
  ...props
}, ref) => {
  const { isRTL } = useRTL();
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const getInputStyles = () => {
    const baseStyles = [
      styles.input,
      styles[`input${size.charAt(0).toUpperCase() + size.slice(1)}` as keyof typeof styles],
      styles[variant],
    ];

    if (disabled) {
      baseStyles.push(styles.disabled);
    } else if (error) {
      baseStyles.push(styles[`${variant}Error` as keyof typeof styles]);
    } else if (isFocused) {
      baseStyles.push(styles[`${variant}Focused` as keyof typeof styles]);
    }

    if (leftIcon) {
      baseStyles.push(isRTL ? styles.inputWithLeftIconRTL : styles.inputWithLeftIcon);
    }

    if (rightIcon) {
      baseStyles.push(isRTL ? styles.inputWithRightIconRTL : styles.inputWithRightIcon);
    }

    // Add RTL text alignment
    if (isRTL) {
      baseStyles.push({ textAlign: 'right' });
    }

    return combineStyles(...baseStyles, inputStyle);
  };

  return (
    <View style={combineStyles(styles.container, containerStyle)}>
      {label && (
        <View style={styles.labelContainer}>
          <Typography
            variant="body2"
            color="text"
            weight="medium"
            style={combineStyles(styles.label, labelStyle)}
          >
            {label}
          </Typography>
          {required && (
            <Typography variant="body2" style={styles.required}>
              *
            </Typography>
          )}
        </View>
      )}

      <View style={styles.inputContainer}>
        {leftIcon && (
          <View style={isRTL ? styles.leftIconContainerRTL : styles.leftIconContainer}>
            {leftIcon}
          </View>
        )}

        <TextInput
          ref={ref}
          style={getInputStyles()}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled}
          placeholderTextColor={colors.gray[400]}
          {...props}
        />

        {rightIcon && (
          <View style={isRTL ? styles.rightIconContainerRTL : styles.rightIconContainer}>
            {rightIcon}
          </View>
        )}
      </View>

      {(error || helperText) && (
        <View style={styles.helperTextContainer}>
          {error ? (
            <Typography variant="caption" style={styles.errorText}>
              {error}
            </Typography>
          ) : (
            <Typography variant="caption" style={styles.helperText}>
              {helperText}
            </Typography>
          )}
        </View>
      )}
    </View>
  );
});

Input.displayName = 'Input';

export default Input;