import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { colors, typography } from '@/theme/tokens';
import { createStyle, combineStyles } from '@/theme/utils';
import { useRTL } from '@/context/RTLContext';

// Typography variant interfaces
interface TypographyProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body1' | 'body2' | 'caption' | 'overline';
  color?: 'primary' | 'secondary' | 'text' | 'textSecondary' | 'disabled' | 'error' | 'warning' | 'success' | 'white';
  align?: 'left' | 'center' | 'right';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  children: React.ReactNode;
}

// Typography styles
const styles = createStyle({
  // Base text style
  text: {
    color: colors.gray[900],
  },

  // Heading variants
  h1: {
    fontSize: typography.fontSizes['4xl'],
    fontWeight: typography.fontWeights.bold,
    lineHeight: typography.fontSizes['4xl'] * typography.lineHeights.tight,
    letterSpacing: typography.letterSpacing.tight,
  },

  h2: {
    fontSize: typography.fontSizes['3xl'],
    fontWeight: typography.fontWeights.bold,
    lineHeight: typography.fontSizes['3xl'] * typography.lineHeights.tight,
    letterSpacing: typography.letterSpacing.tight,
  },

  h3: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.semibold,
    lineHeight: typography.fontSizes['2xl'] * typography.lineHeights.tight,
  },

  h4: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.semibold,
    lineHeight: typography.fontSizes.xl * typography.lineHeights.normal,
  },

  h5: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    lineHeight: typography.fontSizes.lg * typography.lineHeights.normal,
  },

  h6: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    lineHeight: typography.fontSizes.base * typography.lineHeights.normal,
  },

  // Body variants
  body1: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.normal,
    lineHeight: typography.fontSizes.base * typography.lineHeights.relaxed,
  },

  body2: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.normal,
    lineHeight: typography.fontSizes.sm * typography.lineHeights.relaxed,
  },

  caption: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.normal,
    lineHeight: typography.fontSizes.xs * typography.lineHeights.normal,
  },

  overline: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    lineHeight: typography.fontSizes.xs * typography.lineHeights.normal,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
  },

  // Color variants
  primary: {
    color: colors.primary[600],
  },

  secondary: {
    color: colors.secondary[600],
  },

  text: {
    color: colors.gray[900],
  },

  textSecondary: {
    color: colors.gray[600],
  },

  disabled: {
    color: colors.gray[400],
  },

  error: {
    color: colors.error[600],
  },

  warning: {
    color: colors.warning[600],
  },

  success: {
    color: colors.success[600],
  },

  white: {
    color: colors.white,
  },

  // Text alignment
  alignLeft: {
    textAlign: 'left',
  },

  alignCenter: {
    textAlign: 'center',
  },

  alignRight: {
    textAlign: 'right',
  },

  // Font weights
  weightNormal: {
    fontWeight: typography.fontWeights.normal,
  },

  weightMedium: {
    fontWeight: typography.fontWeights.medium,
  },

  weightSemibold: {
    fontWeight: typography.fontWeights.semibold,
  },

  weightBold: {
    fontWeight: typography.fontWeights.bold,
  },
});

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body1',
  color = 'text',
  align = 'left',
  weight,
  children,
  style,
  ...props
}) => {
  const { getTextAlign } = useRTL();

  // Get RTL-aware text alignment
  const rtlTextAlign = getTextAlign(align);

  const textStyles = combineStyles(
    styles.text,
    styles[variant],
    styles[color],
    styles[`align${rtlTextAlign.charAt(0).toUpperCase() + rtlTextAlign.slice(1)}` as keyof typeof styles],
    weight && styles[`weight${weight.charAt(0).toUpperCase() + weight.slice(1)}` as keyof typeof styles],
    style
  );

  return (
    <Text style={textStyles} {...props}>
      {children}
    </Text>
  );
};

// Convenience components for common use cases
export const Heading1: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h1" {...props} />
);

export const Heading2: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h2" {...props} />
);

export const Heading3: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h3" {...props} />
);

export const Heading4: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h4" {...props} />
);

export const Body: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="body1" {...props} />
);

export const BodySmall: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="body2" {...props} />
);

export const Caption: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="caption" {...props} />
);

export const Overline: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="overline" {...props} />
);

export default Typography;