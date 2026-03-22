/**
 * EXO Dashboard Theme
 *
 * Converts the CSS custom properties from the original app.css into a
 * typed theme object consumed by styled-components ThemeProvider.
 * All colour values use oklch() matching the original design exactly.
 */

export const theme = {
  colors: {
    // Brand palette
    black: 'oklch(0.12 0 0)',
    darkGray: 'oklch(0.16 0 0)',
    mediumGray: 'oklch(0.22 0 0)',
    lightGray: 'oklch(0.6 0 0)',
    yellow: 'oklch(0.85 0.18 85)',
    yellowDarker: 'oklch(0.7 0.16 85)',
    yellowGlow: 'oklch(0.9 0.2 85)',

    // Structural aliases (match original CSS variable names)
    background: 'oklch(0.12 0 0)',
    foreground: 'oklch(0.9 0 0)',
    card: 'oklch(0.16 0 0)',
    cardForeground: 'oklch(0.9 0 0)',
    popover: 'oklch(0.16 0 0)',
    popoverForeground: 'oklch(0.9 0 0)',
    primary: 'oklch(0.85 0.18 85)',
    primaryForeground: 'oklch(0.12 0 0)',
    secondary: 'oklch(0.22 0 0)',
    secondaryForeground: 'oklch(0.9 0 0)',
    muted: 'oklch(0.22 0 0)',
    mutedForeground: 'oklch(0.6 0 0)',
    accent: 'oklch(0.22 0 0)',
    accentForeground: 'oklch(0.9 0 0)',
    destructive: 'oklch(0.6 0.25 25)',
    border: 'oklch(0.22 0 0)',
    input: 'oklch(0.22 0 0)',
    ring: 'oklch(0.85 0.18 85)',

    // Decorative
    grid: 'oklch(0.25 0 0)',
    scanline: 'oklch(0.15 0 0)',
  },

  shadows: {
    glowYellow: '0 0 20px oklch(0.85 0.18 85 / 0.3)',
    glowYellowStrong: '0 0 40px oklch(0.85 0.18 85 / 0.5)',
    commandPanel:
      'inset 0 1px 0 oklch(1 0 0 / 0.03), 0 4px 20px oklch(0 0 0 / 0.5)',
    card: '0 4px 20px oklch(0 0 0 / 0.5)',
  },

  radius: {
    sm: '2px',
    md: '4px',
    lg: '6px',
    xl: '8px',
    full: '9999px',
  },

  fonts: {
    mono: "'SF Mono', 'Fira Code', 'Monaco', 'Consolas', 'Liberation Mono', monospace",
  },

  letterSpacing: {
    normal: '0.02em',
    wide: '0.05em',
  },

  transitions: {
    fast: '120ms ease',
    normal: '200ms ease',
    slow: '300ms ease',
  },
} as const;

export type Theme = typeof theme;

// Derive useful token helpers as plain strings for use in template literals
export const tokens = {
  yellow: theme.colors.yellow,
  bg: theme.colors.background,
  fg: theme.colors.foreground,
  border: theme.colors.border,
  card: theme.colors.card,
  muted: theme.colors.mutedForeground,
} as const;
