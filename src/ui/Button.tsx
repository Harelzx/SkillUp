import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
// Removed unused import
import { colors, sizes, borderRadius, typography, spacing } from '@/theme/tokens';
import { createStyle, combineStyles } from '@/theme/utils';
import { useRTL } from '@/context/RTLContext';

// Define interfaces
export interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

// Create component styles
const styles = createStyle({
  // Base button styles
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.lg,
  },

  // Direction styles
  buttonLTR: {
    flexDirection: 'row',
  },

  buttonRTL: {
    flexDirection: 'row-reverse',
  },

  // Variant styles
  primary: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },

  secondary: {
    backgroundColor: colors.secondary[600],
    borderColor: colors.secondary[600],
  },

  outline: {
    backgroundColor: colors.transparent,
    borderColor: colors.gray[300],
  },

  ghost: {
    backgroundColor: colors.transparent,
    borderColor: colors.transparent,
  },

  destructive: {
    backgroundColor: colors.error[600],
    borderColor: colors.error[600],
  },

  // Size styles
  sm: {
    ...sizes.button.sm,
    borderRadius: borderRadius.md,
  },

  md: {
    ...sizes.button.md,
    borderRadius: borderRadius.lg,
  },

  lg: {
    borderRadius: borderRadius.xl,
    height: 52,
    paddingHorizontal: spacing[6], // Optimized padding for text
    paddingVertical: spacing[4],
    minWidth: 320, // Increased minimum width for Hebrew text
  },

  // State styles
  disabled: {
    opacity: 0.5,
  },

  fullWidth: {
    width: '100%',
  },

  // Text styles
  text: {
    fontWeight: typography.fontWeights.semibold,
    textAlign: 'center',
    flexShrink: 0, // Prevent text from shrinking prematurely
  },

  textPrimary: {
    color: colors.white,
  },

  textSecondary: {
    color: colors.white,
  },

  textOutline: {
    color: colors.gray[900],
  },

  textGhost: {
    color: colors.primary[600],
  },

  textDestructive: {
    color: colors.white,
  },

  textSm: {
    fontSize: typography.fontSizes.sm,
    lineHeight: typography.fontSizes.sm * typography.lineHeights.normal,
  },

  textMd: {
    fontSize: typography.fontSizes.base,
    lineHeight: typography.fontSizes.base * typography.lineHeights.normal,
  },

  textLg: {
    fontSize: typography.fontSizes.lg,
    lineHeight: typography.fontSizes.lg * typography.lineHeights.normal,
  },

  // Icon styles (LTR)
  leftIcon: {
    marginRight: 8,
  },

  rightIcon: {
    marginLeft: 8,
  },

  // Icon styles (RTL)
  leftIconRTL: {
    marginLeft: 8,
  },

  rightIconRTL: {
    marginRight: 8,
  },

  // Loading styles
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
  fullWidth = false,
  ...props
}) => {
  const { isRTL } = useRTL();
  const isDisabled = disabled || loading;

  // Combine styles based on props
  const buttonStyles = combineStyles(
    styles.button,
    isRTL ? styles.buttonRTL : styles.buttonLTR,
    styles[variant],
    styles[size],
    isDisabled && styles.disabled,
    fullWidth && styles.fullWidth,
    style
  );

  const textStyles = combineStyles(
    styles.text,
    styles[`text${variant.charAt(0).toUpperCase() + variant.slice(1)}` as keyof typeof styles],
    styles[`text${size.charAt(0).toUpperCase() + size.slice(1)}` as keyof typeof styles],
    textStyle
  );

  // Get appropriate loading spinner color
  const getSpinnerColor = () => {
    switch (variant) {
      case 'outline':
      case 'ghost':
        return colors.primary[600];
      default:
        return colors.white;
    }
  };

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="small"
            color={getSpinnerColor()}
          />
        </View>
      ) : (
        <>
          {leftIcon && (
            <View style={isRTL ? styles.leftIconRTL : styles.leftIcon}>
              {typeof leftIcon === 'string' ? <Text style={textStyles}>{leftIcon}</Text> : leftIcon}
            </View>
          )}

          <Text
            style={[
              textStyles,
              isRTL && { textAlign: 'center' }
            ]}
          >
            {children}
          </Text>

          {rightIcon && (
            <View style={isRTL ? styles.rightIconRTL : styles.rightIcon}>
              {typeof rightIcon === 'string' ? <Text style={textStyles}>{rightIcon}</Text> : rightIcon}
            </View>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

export default Button;