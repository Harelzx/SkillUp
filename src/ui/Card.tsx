import React from 'react';
import { View, ViewStyle, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { colors, borderRadius, spacing, shadows } from '@/theme/tokens';
import { createStyle, combineStyles } from '@/theme/utils';
import { Typography } from './Typography';
import { useRTL } from '@/context/RTLContext';

interface CardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  margin?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  style?: ViewStyle;
}

interface CardHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface CardTitleProps {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  color?: 'primary' | 'secondary' | 'text' | 'textSecondary';
}

interface CardDescriptionProps {
  children: React.ReactNode;
  color?: 'text' | 'textSecondary';
}

interface CardContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface CardFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface PressableCardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const styles = createStyle({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
  },

  // Variant styles
  elevated: {
    backgroundColor: colors.white,
    ...shadows.md,
  },

  outlined: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },

  filled: {
    backgroundColor: colors.gray[50],
  },

  // Padding variants
  paddingNone: {
    padding: 0,
  },

  paddingSm: {
    padding: spacing[3],
  },

  paddingMd: {
    padding: spacing[4],
  },

  paddingLg: {
    padding: spacing[6],
  },

  paddingXl: {
    padding: spacing[8],
  },

  // Margin variants
  marginNone: {
    margin: 0,
  },

  marginSm: {
    margin: spacing[2],
  },

  marginMd: {
    margin: spacing[4],
  },

  marginLg: {
    margin: spacing[6],
  },

  marginXl: {
    margin: spacing[8],
  },

  // Shadow variants
  shadowNone: {
    shadowOpacity: 0,
    elevation: 0,
  },

  shadowSm: shadows.sm,
  shadowMd: shadows.md,
  shadowLg: shadows.lg,
  shadowXl: shadows.xl,

  // Border radius variants
  radiusNone: {
    borderRadius: borderRadius.none,
  },

  radiusSm: {
    borderRadius: borderRadius.sm,
  },

  radiusMd: {
    borderRadius: borderRadius.md,
  },

  radiusLg: {
    borderRadius: borderRadius.lg,
  },

  radiusXl: {
    borderRadius: borderRadius.xl,
  },

  radius2xl: {
    borderRadius: borderRadius['2xl'],
  },

  // Card component specific styles
  header: {
    paddingBottom: spacing[3],
  },

  content: {
    flex: 1,
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing[3],
  },

  footerRTL: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingTop: spacing[3],
  },
});

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'elevated',
  padding = 'md',
  margin = 'none',
  shadow,
  borderRadius: radiusProp,
  style,
}) => {
  const cardStyles = combineStyles(
    styles.card,
    styles[variant],
    styles[`padding${padding.charAt(0).toUpperCase() + padding.slice(1)}` as keyof typeof styles],
    styles[`margin${margin.charAt(0).toUpperCase() + margin.slice(1)}` as keyof typeof styles],
    shadow && styles[`shadow${shadow.charAt(0).toUpperCase() + shadow.slice(1)}` as keyof typeof styles],
    radiusProp && styles[`radius${radiusProp.charAt(0).toUpperCase() + radiusProp.slice(1)}` as keyof typeof styles],
    style
  );

  return (
    <View style={cardStyles}>
      {children}
    </View>
  );
};

export const CardHeader: React.FC<CardHeaderProps> = ({ children, style }) => (
  <View style={combineStyles(styles.header, style)}>
    {children}
  </View>
);

export const CardTitle: React.FC<CardTitleProps> = ({
  children,
  variant = 'h5',
  color = 'text'
}) => (
  <Typography variant={variant} color={color} weight="semibold">
    {children}
  </Typography>
);

export const CardDescription: React.FC<CardDescriptionProps> = ({
  children,
  color = 'textSecondary'
}) => (
  <Typography variant="body2" color={color} style={{ marginTop: spacing[1] }}>
    {children}
  </Typography>
);

export const CardContent: React.FC<CardContentProps> = ({ children, style }) => (
  <View style={combineStyles(styles.content, style)}>
    {children}
  </View>
);

export const CardFooter: React.FC<CardFooterProps> = ({ children, style }) => {
  const { isRTL } = useRTL();

  return (
    <View style={combineStyles(isRTL ? styles.footerRTL : styles.footer, style)}>
      {children}
    </View>
  );
};

export const PressableCard: React.FC<PressableCardProps> = ({
  children,
  variant = 'elevated',
  padding = 'md',
  shadow,
  borderRadius: radiusProp,
  style,
  ...props
}) => {
  const cardStyles = combineStyles(
    styles.card,
    styles[variant],
    styles[`padding${padding.charAt(0).toUpperCase() + padding.slice(1)}` as keyof typeof styles],
    shadow && styles[`shadow${shadow.charAt(0).toUpperCase() + shadow.slice(1)}` as keyof typeof styles],
    radiusProp && styles[`radius${radiusProp.charAt(0).toUpperCase() + radiusProp.slice(1)}` as keyof typeof styles],
    style
  );

  return (
    <TouchableOpacity
      style={cardStyles}
      activeOpacity={0.7}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
};

export default Card;