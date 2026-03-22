/**
 * GlobalStyles
 *
 * Replaces app.css. All keyframes, base resets, scrollbar styling,
 * and shared CSS classes are defined here via createGlobalStyle.
 * Components should NOT import this directly — it is mounted once
 * at the App root.
 */
import { createGlobalStyle, css, keyframes } from 'styled-components';

// ─── Keyframes ────────────────────────────────────────────────────────────────

export const flowAnimation = keyframes`
  from { stroke-dashoffset: 0; }
  to   { stroke-dashoffset: -16; }
`;

export const statusPulse = keyframes`
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
`;

export const radarSweep = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

export const glowPulse = keyframes`
  0%, 100% {
    box-shadow:
      0 0 5px  oklch(0.85 0.18 85 / 0.3),
      0 0 10px oklch(0.85 0.18 85 / 0.1);
  }
  50% {
    box-shadow:
      0 0 15px oklch(0.85 0.18 85 / 0.5),
      0 0 30px oklch(0.85 0.18 85 / 0.2);
  }
`;

export const dataPulse = keyframes`
  0%, 100% { opacity: 0.6; }
  50%       { opacity: 1; }
`;

export const cursorBlink = keyframes`
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
`;

export const shootingStar = keyframes`
  0%    { opacity: 0; transform: translate(0, 0); }
  0.5%  { opacity: 1; }
  2.5%  { opacity: 0.8; transform: translate(300px, 300px); }
  3.5%  { opacity: 0; transform: translate(400px, 400px); }
  100%  { opacity: 0; transform: translate(400px, 400px); }
`;

export const onbFadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: none; }
`;

export const onbFadeOpacity = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

// ─── Reduced-motion helper ────────────────────────────────────────────────────

export const reducedMotion = css`
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      transition-duration: 0.01ms !important;
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
    }
  }
`;

// ─── Global Styles ─────────────────────────────────────────────────────────────

export const GlobalStyles = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
    border-color: ${({ theme }) => theme.colors.border};
    outline-color: oklch(0.85 0.18 85 / 0.5);
  }

  html, body {
    margin: 0;
    padding: 0;
    height: 100%;
    background: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.foreground};
    font-family: ${({ theme }) => theme.fonts.mono};
    letter-spacing: ${({ theme }) => theme.letterSpacing.normal};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  #root {
    height: 100%;
  }

  /* Remove focus ring on inputs */
  input:focus,
  textarea:focus {
    outline: none;
    box-shadow: none;
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    background: oklch(0.1 0 0);
  }
  ::-webkit-scrollbar-thumb {
    background: oklch(0.3 0 0);
    border-radius: 3px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: oklch(0.85 0.18 85 / 0.5);
  }

  /* ── SVG graph links ───────────────────────────────────────────────────────── */

  .graph-link {
    stroke: oklch(0.85 0.18 85 / 0.4);
    stroke-width: 1.5px;
    stroke-dasharray: 8, 8;
    animation: ${flowAnimation} 1s linear infinite;
    filter: drop-shadow(0 0 3px oklch(0.85 0.18 85 / 0.5));
  }

  .graph-link-active {
    stroke: oklch(0.85 0.18 85 / 0.8);
    stroke-width: 2px;
    filter: drop-shadow(0 0 6px oklch(0.85 0.18 85 / 0.8));
  }

  /* ── Onboarding connection lines ───────────────────────────────────────────── */

  .onboarding-connection-line {
    stroke: oklch(0.85 0.18 85 / 0.5);
    stroke-width: 1.5px;
    stroke-dasharray: 6, 6;
    animation: ${flowAnimation} 1s linear infinite;
    filter: drop-shadow(0 0 4px oklch(0.85 0.18 85 / 0.4));
  }

  .onboarding-connection-line-red {
    stroke: rgba(220, 38, 38, 0.7);
    stroke-width: 1.5px;
    stroke-dasharray: 6, 6;
    filter: drop-shadow(0 0 2px rgba(220, 38, 38, 0.3));
  }

  /* ── Shared utility classes ────────────────────────────────────────────────── */

  .scrollbar-hide {
    &::-webkit-scrollbar { display: none; }
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .scanlines {
    position: relative;
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        oklch(0 0 0 / 0.03) 2px,
        oklch(0 0 0 / 0.03) 4px
      );
      pointer-events: none;
      z-index: 100;
    }
  }

  .glow-text {
    text-shadow:
      0 0 10px oklch(0.85 0.18 85 / 0.5),
      0 0 20px oklch(0.85 0.18 85 / 0.3),
      0 0 40px oklch(0.85 0.18 85 / 0.1);
  }

  .status-pulse {
    animation: ${statusPulse} 2s ease-in-out infinite;
  }

  .cursor-blink {
    animation: ${cursorBlink} 1s step-end infinite;
  }

  .grid-bg {
    background-image:
      linear-gradient(oklch(0.2 0 0 / 0.3) 1px, transparent 1px),
      linear-gradient(90deg, oklch(0.2 0 0 / 0.3) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  .command-panel {
    background: linear-gradient(
      180deg,
      oklch(0.16 0 0 / 0.95) 0%,
      oklch(0.12 0 0 / 0.98) 100%
    );
    border: 1px solid oklch(0.25 0 0);
    box-shadow:
      inset 0 1px 0 oklch(1 0 0 / 0.03),
      0 4px 20px oklch(0 0 0 / 0.5);
  }

  .data-readout {
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 11px;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  /* ── Onboarding animations ─────────────────────────────────────────────────── */

  @keyframes onb-fade-in {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: none; }
  }

  @keyframes onb-fade-opacity {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  /* ── Reduced motion ─────────────────────────────────────────────────────────── */

  @media (prefers-reduced-motion: reduce) {
    .shooting-star,
    .shooting-star::before {
      animation: none !important;
      opacity: 0 !important;
    }
    .graph-link { animation: none; }
    .status-pulse { animation: none; }
    .cursor-blink { animation: none; }
    .onboarding-connection-line { animation: none; }
    .onboarding-connection-line-red { animation: none; }
    [style*="onb-fade-in"],
    [style*="onb-fade-opacity"] {
      animation: none !important;
      opacity: 1 !important;
    }
    *,
    *::before,
    *::after {
      transition-duration: 0.01ms !important;
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
    }
  }
`;
