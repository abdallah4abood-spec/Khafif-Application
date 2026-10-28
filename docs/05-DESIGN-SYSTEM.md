# 05 — Design System and Brand Identity

Visual reference (screens + brand board): the Khafif design canvas created in Claude (link shared by the owner). Logo source: `assets/logo-mark.svg`. If the canvas and this file disagree, **this file wins**.

## Brand
- **Name:** Khafif / خفيف ("light"). **Idea:** a basket carrying a leaf — light, fresh, local goods; and light on data.
- **Voice:** warm, short, plain Arabic first; never technical jargon. Example: "أنت غير متصل. سلتك محفوظة." / "You're offline. Your cart is saved."
- **Logo:** rounded-square teal mark with a white basket and a saffron leaf. Wordmark: "خفيف" with "Khafif". Minimum size 24 px; clear space = 1/4 of mark width; do not recolor, stretch, or place on busy images.
- **App icon:** export `logo-mark.svg` to a 1024×1024 PNG (no transparency, full-bleed teal). Android adaptive icon: keep the basket inside the central safe zone. Splash: Sand background with the mark centered.

## Color tokens
| Token | Hex | Use | Contrast note |
|---|---|---|---|
| `primary` | `#14625A` | buttons, links, active tab, price | white text on it ≈ 7:1 |
| `primaryDark` | `#0E4A44` | pressed state, headers on tint | |
| `accent` | `#E9A23B` | highlights, leaf, badges | use **Ink** text on it, never white |
| `bg` | `#FAF6EF` | screen background | |
| `surface` | `#FFFFFF` | cards, bars | |
| `surfaceAlt` | `#F0E8D8` | borders, chips, skeleton | |
| `ink` | `#1E2A28` | body text | |
| `muted` | `#5B6B68` | secondary text | ≥ 4.5:1 on `bg` |
| `tintPrimary` | `#E6F0EE` | info banner, selected variant | |
| `warnBg` | `#FBE9C7` | offline banner | Ink text |
| `error` | `#B3261E` | errors | |
| `success` | `#2E7D4F` | success | |
Dark mode: out of scope for MVP (set `userInterfaceStyle: "light"`). Do not rely on color alone to convey state.

## Typography (IBM Plex Sans Arabic for Arabic and Latin)
| Role | Size / line | Weight |
|---|---|---|
| display | 28 / 36 | 700 |
| title | 24 / 32 | 700 |
| heading | 20 / 28 | 600 |
| body | 16 / 24 | 400–500 |
| small | 14 / 20 | 500 |
| caption | 12 / 16 | 500 |
Respect system font scaling (do not disable `allowFontScaling`); layouts must not clip at 130%.

## Spacing, radius, elevation
Spacing scale (px): 4, 8, 12, 16, 20, 24, 32. Radius: 8 (inputs small), 12 (inputs/chips), 14 (buttons), 16 (cards), 22 (pills). Elevation: borders (`surfaceAlt`) first, shadow only for the bottom bar. Touch targets ≥ 44×44.

## `src/theme/tokens.ts` (starting point)
```ts
export const colors = {
  primary: "#14625A", primaryDark: "#0E4A44", accent: "#E9A23B",
  bg: "#FAF6EF", surface: "#FFFFFF", surfaceAlt: "#F0E8D8",
  ink: "#1E2A28", muted: "#5B6B68", tintPrimary: "#E6F0EE",
  warnBg: "#FBE9C7", error: "#B3261E", success: "#2E7D4F",
} as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;
export const radius = { sm: 8, md: 12, lg: 14, xl: 16, pill: 22 } as const;
```

## Components (`src/ui`) and required states
Button (primary/secondary/ghost; loading, disabled), IconButton, TextField (label, error, helper), Chip (selected), ProductCard (image, title, price; skeleton), QuantityStepper (min 1, max by stock), Banner (info/warn/error; role="status"), PriceText (locale-aware money), EmptyState, Skeleton, ScreenHeader.

## Accessibility
`accessibilityRole`, `accessibilityLabel` for icon-only buttons, `accessibilityState` for selected/disabled, focus order follows reading order in both directions, errors announced with `accessibilityLiveRegion="polite"` (Android) / role alert, no information by color alone, test with TalkBack at least once and record the result.

## RTL rules (recap)
Logical style props only; mirrored icons for back/chevrons; numerals: use Western digits consistently unless the owner decides otherwise; use `Intl.NumberFormat` for currency (`ar`/`en`). Runtime locale switch: **no reload** — root `direction` style + `LocaleProvider` + `useLocale().isRTL` (see docs/13 ADR-7; `I18nManager.forceRTL` does not work in Expo Go). Flip directional icons using `isRTL`, not `I18nManager.isRTL`.

## Motion
Minimal: 150–200 ms fades/press feedback. Respect reduce-motion. No autoplay media.
