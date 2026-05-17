// segmentSaveGuard — Listen-Saves gegen Datenverlust schützen.
// Portiert aus MSv1 (`src/utils/segmentSaveGuard.ts`).
//
// Aufrufmuster: vor JEDEM Mass-Save zwingend `validateSegmentIntegrity` —
// bei !valid Save abbrechen. Danach `protectSegmentsFromEmptyData` als Self-Heal.

interface SegmentLike {
  id: string | number;
  type?: string;
  data?: unknown;
  [key: string]: unknown;
}

const PROTECTED_TYPES = ['full-hero', 'action-hero', 'hero'];
const FOOTER_TYPES = ['footer', 'mini-footer'];

function isEmptyData(data: unknown): boolean {
  if (data == null) return true;
  if (typeof data === 'string') return data.trim() === '';
  if (Array.isArray(data)) return data.length === 0;
  if (typeof data === 'object') return Object.keys(data as object).length === 0;
  return false;
}

function contentCount(segments: SegmentLike[]): number {
  return segments.filter(
    (s) => !FOOTER_TYPES.includes(s.type ?? '') && !isEmptyData(s.data),
  ).length;
}

/**
 * Restore-Schutz: wenn die neue Variante eines protected-type-Segments leere
 * data hat, aber die DB-Version Daten hat → restore aus DB.
 */
export function protectSegmentsFromEmptyData(
  newSegments: SegmentLike[],
  existingSegments: SegmentLike[],
): SegmentLike[] {
  return newSegments.map((seg) => {
    if (!PROTECTED_TYPES.includes(seg.type ?? '')) return seg;
    if (!isEmptyData(seg.data)) return seg;

    const existing = existingSegments.find(
      (e) => String(e.id) === String(seg.id) && e.type === seg.type,
    );
    if (existing && !isEmptyData(existing.data)) {
      return { ...seg, data: existing.data };
    }
    return seg;
  });
}

export interface IntegrityResult {
  valid: boolean;
  reason?: string;
}

/**
 * Massendelete-Schutz vor Mass-Save.
 *  - leere neue Liste + nicht-leere alte → invalid
 *  - alte Content-Count > 2 + neue Content-Count <= 1 → invalid (Footer ausgenommen)
 */
export function validateSegmentIntegrity(
  newSegments: SegmentLike[],
  existingSegments: SegmentLike[],
): IntegrityResult {
  if (newSegments.length === 0 && existingSegments.length > 0) {
    return { valid: false, reason: 'empty-new-while-existing-not-empty' };
  }

  const existingContent = contentCount(existingSegments);
  const newContent = contentCount(newSegments);

  if (existingContent > 2 && newContent <= 1) {
    return { valid: false, reason: 'mass-delete-detected' };
  }

  return { valid: true };
}
