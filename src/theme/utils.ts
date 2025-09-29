import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, spacing, borderRadius, typography, shadows } from './tokens';

// Utility function to create consistent styles
export const createStyle = (styles: Record<string, ViewStyle | TextStyle>) => {
  return StyleSheet.create(styles);
};

// Color utilities
export const getColor = (color: string) => {
  const colorPath = color.split('.');
  let result: any = colors;

  for (const path of colorPath) {
    result = result[path];
  }

  return result || color;
};

// Spacing utilities
export const getSpacing = (space: keyof typeof spacing) => spacing[space];

// Border radius utilities
export const getBorderRadius = (radius: keyof typeof borderRadius) => borderRadius[radius];

// Typography utilities
export const getFontSize = (size: keyof typeof typography.fontSizes) => typography.fontSizes[size];
export const getFontWeight = (weight: keyof typeof typography.fontWeights) => typography.fontWeights[weight];
export const getLineHeight = (height: keyof typeof typography.lineHeights) => typography.lineHeights[height];

// Common style patterns
export const commonStyles = createStyle({
  // Layout
  row: {
    flexDirection: 'row',
  },

  column: {
    flexDirection: 'column',
  },

  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  centerHorizontal: {
    alignItems: 'center',
  },

  centerVertical: {
    justifyContent: 'center',
  },

  spaceBetween: {
    justifyContent: 'space-between',
  },

  spaceAround: {
    justifyContent: 'space-around',
  },

  flex1: {
    flex: 1,
  },

  // Positioning
  absolute: {
    position: 'absolute',
  },

  relative: {
    position: 'relative',
  },

  // Background colors
  bgWhite: {
    backgroundColor: colors.white,
  },

  bgGray50: {
    backgroundColor: colors.gray[50],
  },

  bgGray100: {
    backgroundColor: colors.gray[100],
  },

  bgPrimary: {
    backgroundColor: colors.primary[600],
  },

  bgSecondary: {
    backgroundColor: colors.secondary[600],
  },

  // Text colors
  textGray900: {
    color: colors.gray[900],
  },

  textGray700: {
    color: colors.gray[700],
  },

  textGray600: {
    color: colors.gray[600],
  },

  textGray500: {
    color: colors.gray[500],
  },

  textWhite: {
    color: colors.white,
  },

  textPrimary: {
    color: colors.primary[600],
  },

  // Typography
  textXs: {
    fontSize: typography.fontSizes.xs,
    lineHeight: typography.fontSizes.xs * typography.lineHeights.normal,
  },

  textSm: {
    fontSize: typography.fontSizes.sm,
    lineHeight: typography.fontSizes.sm * typography.lineHeights.normal,
  },

  textBase: {
    fontSize: typography.fontSizes.base,
    lineHeight: typography.fontSizes.base * typography.lineHeights.normal,
  },

  textLg: {
    fontSize: typography.fontSizes.lg,
    lineHeight: typography.fontSizes.lg * typography.lineHeights.normal,
  },

  textXl: {
    fontSize: typography.fontSizes.xl,
    lineHeight: typography.fontSizes.xl * typography.lineHeights.normal,
  },

  text2xl: {
    fontSize: typography.fontSizes['2xl'],
    lineHeight: typography.fontSizes['2xl'] * typography.lineHeights.tight,
  },

  text3xl: {
    fontSize: typography.fontSizes['3xl'],
    lineHeight: typography.fontSizes['3xl'] * typography.lineHeights.tight,
  },

  // Font weights
  fontNormal: {
    fontWeight: typography.fontWeights.normal,
  },

  fontMedium: {
    fontWeight: typography.fontWeights.medium,
  },

  fontSemibold: {
    fontWeight: typography.fontWeights.semibold,
  },

  fontBold: {
    fontWeight: typography.fontWeights.bold,
  },

  // Border radius
  roundedSm: {
    borderRadius: borderRadius.sm,
  },

  roundedMd: {
    borderRadius: borderRadius.md,
  },

  roundedLg: {
    borderRadius: borderRadius.lg,
  },

  roundedXl: {
    borderRadius: borderRadius.xl,
  },

  rounded2xl: {
    borderRadius: borderRadius['2xl'],
  },

  roundedFull: {
    borderRadius: borderRadius.full,
  },

  // Borders
  border: {
    borderWidth: 1,
    borderColor: colors.gray[200],
  },

  borderGray300: {
    borderColor: colors.gray[300],
  },

  borderPrimary: {
    borderColor: colors.primary[600],
  },

  borderError: {
    borderColor: colors.error[500],
  },

  // Shadows
  shadowSm: shadows.sm,
  shadowMd: shadows.md,
  shadowLg: shadows.lg,
  shadowXl: shadows.xl,
});

// Helper function to combine styles
export const combineStyles = (...styles: Array<ViewStyle | TextStyle | undefined | false>) => {
  return styles.filter(Boolean);
};