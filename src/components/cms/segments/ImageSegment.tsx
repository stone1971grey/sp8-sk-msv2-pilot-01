import { EditableSegment } from '@/components/cms/EditableSegment';
import { EditableText } from '@/components/cms/EditableText';
import type { Language, PageContentRow, SegmentRegistryRow } from '@/lib/cmsTypes';

interface ImageSegmentProps {
  segment: SegmentRegistryRow;
  pageSlug: string;
  language: Language;
  content: PageContentRow[];
}

/**
 * Image-Segment — Bild (URL aus DB) mit optionaler Caption.
 *
 * Konvention für section_keys:
 *   ${segment_key}__src        (image URL, raw text)
 *   ${segment_key}__alt        (alt text, raw text)
 *   ${segment_key}__caption    (optional, editierbar)
 *
 * Layout-Toggle via --layout-image-variant: 'full' | 'contained' | 'split'.
 * Default contained.
 */
export function ImageSegment({ segment, pageSlug, language, content }: ImageSegmentProps) {
  const cells = content.filter((c) => c.section_key.startsWith(segment.segment_key));
  const srcKey = `${segment.segment_key}__src`;
  const altKey = `${segment.segment_key}__alt`;
  const captionKey = `${segment.segment_key}__caption`;

  const getVal = (key: string, fallback = '') =>
    cells.find((c) => c.section_key === key)?.content_value ?? fallback;

  const src = getVal(srcKey);
  const alt = getVal(altKey, '');
  const caption = getVal(captionKey);

  return (
    <EditableSegment segment={segment} pageSlug={pageSlug} language={language}>
      {() => (
        <section
          className="w-full"
          style={{
            background: 'var(--color-bg, transparent)',
            color: 'var(--color-fg, inherit)',
            paddingTop: 'var(--layout-padding-y, 3rem)',
            paddingBottom: 'var(--layout-padding-y, 3rem)',
          }}
        >
          <figure
            className="mx-auto px-6"
            style={{ maxWidth: 'var(--layout-max-width, 64rem)', margin: '0 auto' }}
          >
            {src ? (
              <img
                src={src}
                alt={alt}
                loading="lazy"
                style={{
                  display: 'block',
                  width: '100%',
                  height: 'auto',
                  borderRadius: 'var(--layout-image-radius, 0.75rem)',
                  objectFit: 'cover',
                  aspectRatio: 'var(--layout-image-aspect, auto)',
                }}
              />
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  aspectRatio: 'var(--layout-image-aspect, 16 / 9)',
                  background: 'var(--color-image-placeholder, rgba(255,255,255,0.05))',
                  borderRadius: 'var(--layout-image-radius, 0.75rem)',
                  border: '1px dashed currentColor',
                  opacity: 0.4,
                  fontSize: '0.875rem',
                }}
              >
                Image placeholder — set {srcKey}
              </div>
            )}

            {(caption || cells.some((c) => c.section_key === captionKey)) && (
              <figcaption
                style={{
                  marginTop: 'var(--layout-stack-gap, 0.75rem)',
                  fontSize: 'var(--typo-caption-size, 0.875rem)',
                  opacity: 'var(--color-caption-opacity, 0.7)',
                  textAlign: 'var(--layout-caption-align, center)' as 'center',
                }}
              >
                <EditableText
                  as="span"
                  pageSlug={pageSlug}
                  sectionKey={captionKey}
                  language={language}
                  initialValue={caption}
                />
              </figcaption>
            )}
          </figure>
        </section>
      )}
    </EditableSegment>
  );
}
