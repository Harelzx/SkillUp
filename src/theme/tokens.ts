// Design Tokens - Professional UI System
// Following gluestack UI v3 methodology with strict consistency

export const colors = {
  // Primary brand colors
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Main brand color
    600: '#0284c7', // Primary action color
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49'
  },

  // Secondary accent colors
  secondary: {
    50: '#fdf4ff',
    100: '#fae8ff',
    200: '#f5d0fe',
    300: '#f0abfc',
    400: '#e879f9',
    500: '#d946ef',
    600: '#c026d3',
    700: '#a21caf',
    800: '#86198f',
    900: '#701a75',
    950: '#4a044e'
  },

  // Neutral grays
  gray: {
    50: '#f9fafb',   // Background
    100: '#f3f4f6',  // Light background
    200: '#e5e7eb',  // Border light
    300: '#d1d5db',  // Border
    400: '#9ca3af',  // Placeholder text
    500: '#6b7280',  // Secondary text
    600: '#4b5563',  // Primary text light
    700: '#374151',  // Primary text
    800: '#1f2937',  // Heading text
    900: '#111827',  // Dark text
    950: '#030712'   // Darkest
  },

  // Semantic colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d'
  },

  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309'
  },

  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c'
  },

  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8'
  },

  // Extended colors for UI components
  blue: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a'
  },

  green: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d'
  },

  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87'
  },

  orange: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12'
  },

  indigo: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81'
  },

  red: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d'
  },

  // Base colors
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
} as const;

export const spacing = {
  0: 0,
  1: 4,    // 4px
  2: 8,    // 8px
  3: 12,   // 12px
  4: 16,   // 16px
  5: 20,   // 20px
  6: 24,   // 24px
  7: 28,   // 28px
  8: 32,   // 32px
  10: 40,  // 40px
  12: 48,  // 48px
  16: 64,  // 64px
  20: 80,  // 80px
  24: 96,  // 96px
  32: 128, // 128px
} as const;

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
} as const;

export const typography = {
  fontSizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },

  fontWeights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  lineHeights: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
    loose: 1.8,
  },

  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
  },
} as const;

export const shadows = {
  sm: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  md: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  lg: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },

  xl: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
} as const;

// Component-specific sizes
export const sizes = {
  button: {
    sm: {
      height: 36,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
    },
    md: {
      height: 44,
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
    },
    lg: {
      height: 52,
      paddingHorizontal: spacing[6],
      paddingVertical: spacing[4],
    },
  },

  input: {
    sm: {
      height: 36,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
    },
    md: {
      height: 44,
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
    },
    lg: {
      height: 52,
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[4],
    },
  },

  icon: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
  },

  avatar: {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
    '2xl': 80,
  },
} as const;

// Professional touch targets (minimum 44px for accessibility)
export const touchTargets = {
  minimum: 44,
  comfortable: 48,
  large: 52,
} as const;