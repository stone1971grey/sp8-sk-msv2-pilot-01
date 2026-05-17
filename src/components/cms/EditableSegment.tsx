import type { ReactNode } from 'react';
import type { Language, SegmentRegistryRow } from '@/lib/cmsTypes';
import { useSegmentStylingTokens } from '@/hooks/useSegmentStylingTokens';
import { tokensToCSSVars } from '@/lib/tokens/tokensToCSSVars';

interface EditableSegmentProps {
  segment: SegmentRegistryRow;
  pageSlug: string;
  language: Language;
  presetRef?: string | null;
  children: (ctx: {
    tokens: Record<string, string>;
    style: React.CSSProperties;
  }) => ReactNode;
}

/**
 * Wrapper für editierbare Segmente. Liefert resolved Tokens + CSS-Var-Style
 * via Render-Prop, damit das Segment selbst die vier Reiter konsumieren kann.
 *
 * Pflicht-Props: segmentKey/pageSlug/language sind über `segment` + Wrapper-Props
 * abgedeckt.
 */
export function EditableSegment({
  segment,
  pageSlug,
  language,
  presetRef,
  children,
}: EditableSegmentProps) {
  const tokens = useSegmentStylingTokens({
    segment,
    pageSlug,
    language,
    presetRef,
  });
  const style = tokensToCSSVars(tokens);

  return (
    <div
      data-segment-id={segment.segment_id}
      data-segment-type={segment.segment_type}
      data-segment-key={segment.segment_key}
      style={style}
    >
      {children({ tokens, style })}
    </div>
  );
}
