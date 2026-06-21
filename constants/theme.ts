// =============================================================================
// FOLIO — Design System v4 (Slate)
// -----------------------------------------------------------------------------
// FOLIO NOCTURNE — dark cinematic legal-tech aesthetic.
//   - Obsidian canvas (#0A0908) base across every screen.
//   - Champagne (#E8B86D) for accents, CTAs, and gold rules.
//   - Glass-tinted surfaces with subtle aurora gradients.
//   - Tokens below are the single source of truth; do not invent
//     ad-hoc hex values in screens.
// =============================================================================

import { Platform } from "react-native";

const isWeb = Platform.OS === "web";

// ── Palette ───────────────────────────────────────────────────────────────
// NOCTURNE app-wide: every shared token below points at the cinematic ink
// canvas + champagne accent. The dedicated NOCTURNE tokens further below
// (ink, bone, champagne, glass, aurora, …) remain available for screens
// that want to be explicit.
export const palette = {
  // Backgrounds — obsidian canvas, glass surfaces
  bg: "#0A0908",                // obsidian — screen canvas
  surface: "rgba(239,233,220,0.06)",       // glass card resting
  surfaceSubtle: "rgba(239,233,220,0.04)", // sunken / pressed glass

  // Borders — ivory hairlines + champagne focus
  border: "rgba(239,233,220,0.10)",   // default divider on ink
  borderStrong: "rgba(239,233,220,0.18)",
  borderFocus: "#E8B86D",             // champagne focus ring

  // Text — bone ivory hierarchy
  text: "#EFE9DC",                       // bone — primary
  textSecondary: "rgba(239,233,220,0.72)", // boneDim
  textMuted: "#8E867A",                  // ash
  textDisabled: "rgba(239,233,220,0.32)",

  // Accent — Champagne (the signature)
  accent: "#E8B86D",
  accentLight: "rgba(232,184,109,0.14)",
  accentSoft: "rgba(232,184,109,0.10)",
  accentBorder: "rgba(232,184,109,0.22)",
  accentOnDark: "#F5CC85",       // bright champagne on dark

  // Semantic — danger (warm-red, tuned for ink)
  danger: "#E5685F",
  dangerSoft: "rgba(229,104,95,0.14)",
  dangerBorder: "rgba(229,104,95,0.32)",

  // Semantic — success (warm-emerald, tuned for ink)
  success: "#7BC890",
  successSoft: "rgba(123,200,144,0.12)",
  successBorder: "rgba(123,200,144,0.30)",

  // Semantic — warning (soft amber, tuned for ink)
  warning: "#D9A86B",
  warningSoft: "rgba(217,168,107,0.12)",
  warningBorder: "rgba(217,168,107,0.30)",

  // Dark canvas tokens — re-pointed to NOCTURNE so the existing loading
  // screen harmonizes with the rest of the app without rewriting it.
  dark: "#0A0908",                       // obsidian (== ink)
  darkSurface: "rgba(239,233,220,0.06)", // glass raised
  darkBorder: "rgba(239,233,220,0.10)",  // glass border
  darkText: "#EFE9DC",                   // bone
  darkTextSub: "rgba(239,233,220,0.72)", // boneDim
  darkTextMuted: "#8E867A",              // ash

  // ─── NOCTURNE — cinematic ink canvas + champagne accent ───────────────
  // Used by Home screen, PaperDock, and the unified gold CTA.
  // (Existing slate tokens above remain unchanged so other screens stay
  // visually intact until they are individually opted in.)
  ink: "#0A0908",               // obsidian canvas
  inkRaised: "#13110F",          // lifted ink surface (cards on ink)
  inkHigh: "#1A1814",            // highest ink surface
  bone: "#EFE9DC",               // primary text on ink (warm ivory)
  boneDim: "rgba(239,233,220,0.72)", // secondary text on ink
  ash: "#8E867A",                // muted text on ink
  ashLow: "rgba(239,233,220,0.42)",  // disabled / placeholder on ink

  // Champagne (single signature accent)
  champagne: "#E8B86D",          // primary champagne — CTAs, focus, seal
  champagneBright: "#F5CC85",    // hover/pressed highlight
  champagneDim: "#B89150",       // darker for borders
  champagneText: "#1A1408",      // text color *on* champagne fill
  champagneSoft: "rgba(232,184,109,0.10)",     // soft fill on ink
  champagneSofter: "rgba(232,184,109,0.06)",   // softer
  champagneBorder: "rgba(232,184,109,0.22)",   // default border
  champagneBorderHi: "rgba(232,184,109,0.45)", // focused/active border
  champagneGlow: "rgba(232,184,109,0.18)",     // for shadow tint + glow

  // Glass surfaces on ink
  glass: "rgba(239,233,220,0.04)",       // resting glass card
  glassRaised: "rgba(239,233,220,0.06)", // lifted glass card
  glassHi: "rgba(239,233,220,0.09)",     // pressed / focused glass
  glassBorder: "rgba(239,233,220,0.08)", // default ivory hairline
  glassBorderHi: "rgba(239,233,220,0.16)", // focused glass border

  // Aurora orb stops (used only inside hero zones)
  auroraViolet: "#3B2A6B",
  auroraAmber: "#6B4A1C",
  auroraInk: "#0A0908",

  // Gold hairline gradient stops (transparent → gold → transparent)
  goldRule0: "rgba(232,184,109,0.00)",
  goldRule1: "rgba(232,184,109,0.55)",

  // Ink-canvas semantic colors (warmer-tuned variants of slate semantics)
  inkDanger: "#E5685F",
  inkDangerSoft: "rgba(229,104,95,0.12)",
  inkSuccess: "#7BC890",
  inkWarning: "#D9A86B",

  white: "#FFFFFF",
  black: "#000000",
} as const;

// ── Per-urgency mini-pack ─────────────────────────────────────────────────
export const urgencyColors = {
  low: { fg: palette.textMuted, bg: "transparent", border: palette.border },
  medium: { fg: palette.warning, bg: palette.warningSoft, border: palette.warningBorder },
  high: { fg: palette.danger, bg: palette.dangerSoft, border: palette.dangerBorder },
} as const;

// ── Spacing ───────────────────────────────────────────────────────────────
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 72,
  xxxxl: 96,
} as const;

// ── Radius ────────────────────────────────────────────────────────────────
export const radius = {
  none: 0,
  xs: 2,
  sm: 6,
  md: 10,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 999,
} as const;

// ── Shadow — long, dark shadows tuned for ink canvas ─────────────────────
export const shadow = {
  none: {},
  sm: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30,
    shadowRadius: 16,
    elevation: 6,
  },
  lg: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.42,
    shadowRadius: 28,
    elevation: 12,
  },
  xl: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.52,
    shadowRadius: 40,
    elevation: 18,
  },

  // ── NOCTURNE shadows: long, dark, with a champagne-warm tint ──────────
  ink: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.55,
    shadowRadius: 28,
    elevation: 14,
  },
  inkLifted: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.62,
    shadowRadius: 40,
    elevation: 18,
  },
  // Champagne glow used under the primary CTA and dock indicator
  glow: {
    shadowColor: "#E8B86D",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 22,
    elevation: 10,
  },
} as const;

// ── Font weights ──────────────────────────────────────────────────────────
export const fontWeight = {
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  extrabold: "800" as const,
  black: "900" as const,
};

// ── Font families ─────────────────────────────────────────────────────────
export const fontFamily = {
  display: isWeb
    ? '"Inter", "Heebo", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    : Platform.select({
        ios: "Inter_800ExtraBold",
        android: "Inter_800ExtraBold",
        default: undefined,
      }),
  body: isWeb
    ? '"Heebo", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    : undefined,
  mono: isWeb
    ? '"JetBrains Mono", "SF Mono", ui-monospace, Menlo, Consolas, monospace'
    : Platform.select({
        ios: "Menlo",
        android: "monospace",
        default: undefined,
      }),
} as const;

// ── Typography scale ──────────────────────────────────────────────────────
export const typography = {
  displayXL: {
    fontFamily: fontFamily.display,
    fontSize: 52,
    lineHeight: 56,
    fontWeight: fontWeight.black,
    letterSpacing: -1.6,
  },
  display: {
    fontFamily: fontFamily.display,
    fontSize: 40,
    lineHeight: 44,
    fontWeight: fontWeight.black,
    letterSpacing: -1.2,
  },
  displaySm: {
    fontFamily: fontFamily.display,
    fontSize: 32,
    lineHeight: 36,
    fontWeight: fontWeight.black,
    letterSpacing: -0.9,
  },
  h1: {
    fontFamily: fontFamily.display,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: fontWeight.extrabold,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: fontFamily.display,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.2,
  },
  h3: {
    fontFamily: fontFamily.body,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: fontWeight.bold,
  },
  body: {
    fontFamily: fontFamily.body,
    fontSize: 15,
    lineHeight: 24,
    fontWeight: fontWeight.regular,
  },
  bodyLg: {
    fontFamily: fontFamily.body,
    fontSize: 17,
    lineHeight: 28,
    fontWeight: fontWeight.regular,
  },
  bodySm: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: fontWeight.regular,
  },
  caption: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: fontWeight.medium,
  },
  label: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.5,
  },
  mono: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: fontWeight.semibold,
    letterSpacing: 1.5,
  },
  monoLg: {
    fontFamily: fontFamily.mono,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: fontWeight.semibold,
    letterSpacing: 1.2,
  },
} as const;

// ── Layout tokens ─────────────────────────────────────────────────────────
export const layout = {
  pagePadding: 24,
  hairline: 1,
  dockHeight: 64,
  contentMaxWidth: 720,
} as const;

// ── Motion tokens ─────────────────────────────────────────────────────────
export const motion = {
  instant: 120,
  fast: 220,
  base: 320,
  slow: 460,
  staggerXs: 40,
  staggerSm: 70,
  staggerMd: 110,
  riseSm: 8,
  riseMd: 14,
  riseLg: 22,
  // Cinematic breath cycle (used for aurora orb and CTA glow loops)
  breath: 2400,
  auroraBreath: 8000,
} as const;

export const theme = {
  palette,
  urgencyColors,
  spacing,
  radius,
  typography,
  shadow,
  layout,
  motion,
  fontWeight,
  fontFamily,
};

export type Theme = typeof theme;
