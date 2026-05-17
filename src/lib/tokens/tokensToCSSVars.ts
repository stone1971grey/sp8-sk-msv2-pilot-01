import type { CSSProperties } from 'react';

/**
 * Vier-Reiter-Token-Bridge.
 *
 * Wandelt ein Token-Objekt in CSS-Variablen um, die als inline-style auf das
 * Segment-Root-Element gesetzt werden. Die Hero-Komponente liest in CSS via
 * `var(--color-bg)`, `var(--typo-heading-size)` etc.
 *
 * Vier Reiter werden über Naming-Präfixe entkoppelt — NICHT über getrennte
 * Funktionen (bewusste Abweichung von MSv1, sauberer):
 *   - layout-*  (Spacing, Grid, Container)
 *   - typo-*    (Font-Family, Size, Weight, Line-Height)
 *   - color-*   (Background, Foreground, Accent)
 *   - motion-*  (Transitions, Animations)
 *
 * Eine Achse darf nicht in eine andere greifen — Memory `vier-reiter-prinzip-de`.
 */
export function tokensToCSSVars(
  tokens: Record<string, string | number | null | undefined> | null | undefined,
): CSSProperties {
  const out: Record<string, string> = {};
  if (!tokens) return out as CSSProperties;

  for (const [k, v] of Object.entries(tokens)) {
    if (v == null || v === '') continue;
    const cssVar = k.startsWith('--') ? k : `--${k}`;
    out[cssVar] = String(v);
  }
  return out as CSSProperties;
}
