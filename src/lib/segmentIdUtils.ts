// Segment Identity Normalization (siehe mem://segment-identity-normalization-de-v1)
//
// WICHTIG: Das innere `-?` im Regex ist KEINE Kosmetik, sondern überlebenswichtig
// für System-Seed-Keys wie `system-seed--1` (negative IDs, Memory `system-seed-namespace`).
// Wer das auf `/-(\d+)$/` "cleaned up", bricht den System-Seed-Render. Wortlaut ist Pflicht.

export const SEGMENT_ID_REGEX = /-(-?\d+)$/;

/**
 * Extrahiert die numerische Segment-ID aus einem Segment-Key.
 * `feature-overview-46` → "46"
 * `system-seed--1`      → "-1"
 * `intro`               → null
 */
export function extractSegmentId(segmentKey: string): string | null {
  const match = segmentKey.match(SEGMENT_ID_REGEX);
  return match ? match[1] : null;
}

/**
 * Normalisiert eine ID immer zu String — DB liefert int, Vergleiche aber als String.
 */
export function normalizeId(id: string | number | null | undefined): string {
  return id == null ? '' : String(id);
}

/**
 * SeenIds-Guard: dedupliziert Segmente beim Render-Loop.
 * Mehrfaches Rendern desselben Segments bei ID-Mismatch (numerisch vs. kanonisch) verhindern.
 */
export function createSeenIdsGuard(): (id: string | number) => boolean {
  const seen = new Set<string>();
  return (id: string | number) => {
    const key = normalizeId(id);
    if (!key) return false;
    if (seen.has(key)) return true;
    seen.add(key);
    return false;
  };
}
