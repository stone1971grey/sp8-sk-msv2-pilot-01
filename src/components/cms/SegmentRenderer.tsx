import type { Language, PageContentRow, SegmentRegistryRow } from '@/lib/cmsTypes';
import { HeroSegment } from '@/components/cms/segments/HeroSegment';
import { FeaturesSegment } from '@/components/cms/segments/FeaturesSegment';
import { CtaSegment } from '@/components/cms/segments/CtaSegment';
import { TextSegment } from '@/components/cms/segments/TextSegment';
import { ImageSegment } from '@/components/cms/segments/ImageSegment';

interface SegmentRendererProps {
  segment: SegmentRegistryRow;
  pageSlug: string;
  language: Language;
  content: PageContentRow[];
}

const HERO_TYPES = new Set(['hero', 'full-hero', 'action-hero']);
const FEATURES_TYPES = new Set(['features', 'feature-grid', 'feature-list']);
const CTA_TYPES = new Set(['cta', 'cta-band', 'call-to-action']);
const TEXT_TYPES = new Set(['text', 'rich-text', 'content', 'prose']);
const IMAGE_TYPES = new Set(['image', 'media', 'figure']);

/**
 * Dispatch nach segment_type.
 * Block A.1: Hero, Features, CTA, Text, Image — alle Token-/Edit-fähig.
 */
export function SegmentRenderer({ segment, pageSlug, language, content }: SegmentRendererProps) {
  const commonProps = { segment, pageSlug, language, content };

  if (HERO_TYPES.has(segment.segment_type)) {
    return <HeroSegment {...commonProps} />;
  }
  if (FEATURES_TYPES.has(segment.segment_type)) {
    return <FeaturesSegment {...commonProps} />;
  }
  if (CTA_TYPES.has(segment.segment_type)) {
    return <CtaSegment {...commonProps} />;
  }
  if (TEXT_TYPES.has(segment.segment_type)) {
    return <TextSegment {...commonProps} />;
  }
  if (IMAGE_TYPES.has(segment.segment_type)) {
    return <ImageSegment {...commonProps} />;
  }

  // Generischer Fallback für noch nicht portierte Segment-Typen.
  const sectionContent = content.filter((c) => c.section_key === segment.segment_key);

  return (
    <section
      className="border border-border rounded-md p-6 bg-card"
      data-segment-id={segment.segment_id}
      data-segment-type={segment.segment_type}
    >
      <header className="mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-card-foreground">
          {segment.segment_key}
        </h2>
        <span className="text-xs text-muted-foreground">
          {segment.segment_type} · #{segment.segment_id}
        </span>
      </header>

      {sectionContent.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          Kein Inhalt für dieses Segment in der gewählten Sprache.
        </p>
      ) : (
        <dl className="space-y-3">
          {sectionContent.map((c) => (
            <div key={c.id}>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {c.content_type}
              </dt>
              <dd className="text-sm text-foreground whitespace-pre-wrap">
                {c.content_value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
