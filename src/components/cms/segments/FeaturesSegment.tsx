import { EditableSegment } from '@/components/cms/EditableSegment';
import { EditableText } from '@/components/cms/EditableText';
import type { Language, PageContentRow, SegmentRegistryRow } from '@/lib/cmsTypes';

interface FeaturesSegmentProps {
  segment: SegmentRegistryRow;
  pageSlug: string;
  language: Language;
  content: PageContentRow[];
}

/**
 * Features-Segment — Grid aus Feature-Items (Title + Body).
 *
 * Konvention für section_keys (1:1 nach MSv1):
 *   ${segment_key}__intro_headline      (optional, h2)
 *   ${segment_key}__intro_subline       (optional, p)
 *   ${segment_key}__item{N}_title       (h3)
 *   ${segment_key}__item{N}_body        (p)
 *
 * Spaltenzahl via --layout-grid-cols (default 3). Vier Reiter via CSS-Vars.
 */
export function FeaturesSegment({ segment, pageSlug, language, content }: FeaturesSegmentProps) {
  const cells = content.filter((c) => c.section_key.startsWith(segment.segment_key));

  const introHeadlineKey = `${segment.segment_key}__intro_headline`;
  const introSublineKey = `${segment.segment_key}__intro_subline`;

  // Items aus section_keys mit Pattern __item{N}_title extrahieren
  const itemNumbers = Array.from(
    new Set(
      cells
        .map((c) => {
          const m = c.section_key.match(/__item(\d+)_(title|body)$/);
          return m ? Number(m[1]) : null;
        })
        .filter((n): n is number => n !== null),
    ),
  ).sort((a, b) => a - b);

  // Fallback: wenn DB leer, mindestens 3 Platzhalter
  const items = itemNumbers.length > 0 ? itemNumbers : [1, 2, 3];

  const getVal = (key: string, fallback = '') =>
    cells.find((c) => c.section_key === key)?.content_value ?? fallback;

  return (
    <EditableSegment segment={segment} pageSlug={pageSlug} language={language}>
      {() => (
        <section
          className="w-full"
          style={{
            background: 'var(--color-bg, transparent)',
            color: 'var(--color-fg, inherit)',
            paddingTop: 'var(--layout-padding-y, 5rem)',
            paddingBottom: 'var(--layout-padding-y, 5rem)',
            transitionProperty: 'background-color, color',
            transitionDuration: 'var(--motion-fade-duration, 200ms)',
          }}
        >
          <div
            className="mx-auto px-6"
            style={{ maxWidth: 'var(--layout-max-width, 72rem)' }}
          >
            {(getVal(introHeadlineKey) || getVal(introSublineKey)) && (
              <header
                style={{
                  marginBottom: 'var(--layout-stack-gap, 3rem)',
                  textAlign: 'var(--layout-intro-align, center)' as 'center',
                }}
              >
                <EditableText
                  as="h2"
                  pageSlug={pageSlug}
                  sectionKey={introHeadlineKey}
                  language={language}
                  initialValue={getVal(introHeadlineKey, 'Features')}
                  className="block"
                />
                <EditableText
                  as="p"
                  pageSlug={pageSlug}
                  sectionKey={introSublineKey}
                  language={language}
                  initialValue={getVal(introSublineKey, '')}
                  className="block"
                />
              </header>
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(var(--layout-grid-cols, 3), minmax(0, 1fr))`,
                gap: 'var(--layout-grid-gap, 2rem)',
              }}
            >
              {items.map((n) => {
                const titleKey = `${segment.segment_key}__item${n}_title`;
                const bodyKey = `${segment.segment_key}__item${n}_body`;
                return (
                  <article
                    key={n}
                    style={{
                      background: 'var(--color-card-bg, transparent)',
                      borderRadius: 'var(--layout-card-radius, 0.75rem)',
                      padding: 'var(--layout-card-padding, 1.5rem)',
                      border: 'var(--layout-card-border, 1px solid transparent)',
                    }}
                  >
                    <EditableText
                      as="h3"
                      pageSlug={pageSlug}
                      sectionKey={titleKey}
                      language={language}
                      initialValue={getVal(titleKey, `Feature ${n}`)}
                      className="block"
                    />
                    <EditableText
                      as="p"
                      pageSlug={pageSlug}
                      sectionKey={bodyKey}
                      language={language}
                      initialValue={getVal(bodyKey, 'Beschreibung folgt.')}
                      className="block"
                    />
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </EditableSegment>
  );
}
