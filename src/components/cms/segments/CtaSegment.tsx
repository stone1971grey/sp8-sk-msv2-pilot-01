import { EditableSegment } from '@/components/cms/EditableSegment';
import { EditableText } from '@/components/cms/EditableText';
import type { Language, PageContentRow, SegmentRegistryRow } from '@/lib/cmsTypes';

interface CtaSegmentProps {
  segment: SegmentRegistryRow;
  pageSlug: string;
  language: Language;
  content: PageContentRow[];
}

/**
 * CTA-Segment — Call-to-Action-Band mit Headline, optionaler Subline und Button.
 *
 * Konvention für section_keys:
 *   ${segment_key}__headline
 *   ${segment_key}__subline
 *   ${segment_key}__cta_label
 *   ${segment_key}__cta_href   (raw text, kein EditableText)
 *
 * Vier Reiter via CSS-Vars. Kein Tailwind-Visual.
 */
export function CtaSegment({ segment, pageSlug, language, content }: CtaSegmentProps) {
  const cells = content.filter((c) => c.section_key.startsWith(segment.segment_key));
  const headlineKey = `${segment.segment_key}__headline`;
  const sublineKey = `${segment.segment_key}__subline`;
  const ctaLabelKey = `${segment.segment_key}__cta_label`;
  const ctaHrefKey = `${segment.segment_key}__cta_href`;

  const getVal = (key: string, fallback = '') =>
    cells.find((c) => c.section_key === key)?.content_value ?? fallback;

  const href = getVal(ctaHrefKey, '#');

  return (
    <EditableSegment segment={segment} pageSlug={pageSlug} language={language}>
      {() => (
        <section
          className="w-full"
          style={{
            background: 'var(--color-bg, transparent)',
            color: 'var(--color-fg, inherit)',
            paddingTop: 'var(--layout-padding-y, 4rem)',
            paddingBottom: 'var(--layout-padding-y, 4rem)',
            transitionProperty: 'background-color, color',
            transitionDuration: 'var(--motion-fade-duration, 200ms)',
          }}
        >
          <div
            className="mx-auto px-6"
            style={{
              maxWidth: 'var(--layout-max-width, 56rem)',
              textAlign: 'var(--layout-cta-align, center)' as 'center',
            }}
          >
            <EditableText
              as="h2"
              pageSlug={pageSlug}
              sectionKey={headlineKey}
              language={language}
              initialValue={getVal(headlineKey, 'Bereit loszulegen?')}
              className="block"
            />
            <EditableText
              as="p"
              pageSlug={pageSlug}
              sectionKey={sublineKey}
              language={language}
              initialValue={getVal(sublineKey, '')}
              className="block"
            />
            <div style={{ marginTop: 'var(--layout-stack-gap, 1.5rem)' }}>
              <a
                href={href}
                style={{
                  display: 'inline-block',
                  background: 'var(--color-cta-bg, hsl(217 91% 60%))',
                  color: 'var(--color-cta-fg, white)',
                  paddingInline: 'var(--layout-button-padding-x, 1.75rem)',
                  paddingBlock: 'var(--layout-button-padding-y, 0.875rem)',
                  borderRadius: 'var(--layout-button-radius, 9999px)',
                  fontWeight: 'var(--typo-button-weight, 600)',
                  fontSize: 'var(--typo-button-size, 1rem)',
                  textDecoration: 'none',
                  transitionProperty: 'transform, background-color',
                  transitionDuration: 'var(--motion-hover-duration, 150ms)',
                }}
              >
                <EditableText
                  as="span"
                  pageSlug={pageSlug}
                  sectionKey={ctaLabelKey}
                  language={language}
                  initialValue={getVal(ctaLabelKey, 'Jetzt starten')}
                />
              </a>
            </div>
          </div>
        </section>
      )}
    </EditableSegment>
  );
}
