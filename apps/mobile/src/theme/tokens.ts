export const colors = {
  primary: '#14625A',
  primaryDark: '#0E4A44',
  accent: '#E9A23B',
  bg: '#FAF6EF',
  surface: '#FFFFFF',
  surfaceAlt: '#F0E8D8',
  ink: '#1E2A28',
  muted: '#5B6B68',
  tintPrimary: '#E6F0EE',
  warnBg: '#FBE9C7',
  error: '#B3261E',
  success: '#2E7D4F',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 14, xl: 16, pill: 22 } as const;

/** Minimum touch target (docs/05-DESIGN-SYSTEM.md). */
export const TOUCH_TARGET = 44;

/** IBM Plex Sans Arabic family names registered in the root layout. */
export const fonts = {
  regular: 'IBMPlexSansArabic_400Regular',
  medium: 'IBMPlexSansArabic_500Medium',
  semibold: 'IBMPlexSansArabic_600SemiBold',
  bold: 'IBMPlexSansArabic_700Bold',
} as const;

export const typography = {
  display: { fontSize: 28, lineHeight: 36, fontFamily: fonts.bold },
  title: { fontSize: 24, lineHeight: 32, fontFamily: fonts.bold },
  heading: { fontSize: 20, lineHeight: 28, fontFamily: fonts.semibold },
  body: { fontSize: 16, lineHeight: 24, fontFamily: fonts.regular },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontFamily: fonts.medium },
  small: { fontSize: 14, lineHeight: 20, fontFamily: fonts.medium },
  caption: { fontSize: 12, lineHeight: 16, fontFamily: fonts.medium },
} as const;

export type TextVariant = keyof typeof typography;
