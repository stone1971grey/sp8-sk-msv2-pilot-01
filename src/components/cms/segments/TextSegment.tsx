import { EditableSegment } from '@/components/cms/EditableSegment';
import { EditableText } from '@/components/cms/EditableText';
import type { Language, PageContentRow, SegmentRegistryRow } from '@/lib/cmsTypes';

interface TextSegmentProps {
  segment: SegmentRegistryRow;
  pageSlug: string;
  language: Language;
  content: PageContentRow[];
}

/**
 * Text-Segment — Long-form Inhalt mit optionaler Headline + N Paragraphen.
 *
 * Konvention für section_keys:
 *   ${segment_key}__headline       (optional, h2)
 *   ${segment_key}__body           (Haupttext, kann mehrere Absätze enthalten via \n\n)
 *   ${segment_key}__para{N}        (optional, zusätzliche Absätze)
 *
 * Wenn keine __para{N}-Cells existieren, wird __body als einziger Absatz gerendert.
 */
export function TextSegment({ segment, pageSlug, language, content }: TextSegmentProps) {
  const cells = content.filter((c) => c.section_key.startsWith(segment.segment_key));
  const headlineKey = `${segment.segment_key}__headline`;
  const bodyKey = `${segment.segment_key}__body`;

  const paraCells = cells
    .filter((c) => /__para\d+$/.test(c.section_key))
    .sort((a, b) => {
      const an = Number(a.section_key.match(/__para(\d+)$/)?.[1] ?? 0);
      const bn = Number(b.section_key.match(/__para(\d+)$/)?.[1] ?? 0);
      return an - bn;
    });

  const getVal = (key: string, fallback = '') =>
    cells.find((c) => c.section_key === key)?.content_value ?? fallback;

  const hasHeadline = !!getVal(headlineKey);

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
            style={{ maxWidth: 'var(--layout-max-width, 44rem)' }}
          >
            {hasHeadline && (
              <EditableText
                as="h2"
                pageSlug={pageSlug}
                sectionKey={headlineKey}
                language={language}
                initialValue={getVal(headlineKey)}
                className="block"
              />
            )}

            {paraCells.length > 0 ? (
              <div
                className="space-y-4"
                style={{ marginTop: 'var(--layout-stack-gap, 1.5rem)' }}
              >
                {paraCells.map((c) => (
                  <EditableText
                    key={c.id}
                    as="p"
                    pageSlug={pageSlug}
                    sectionKey={c.section_key}
                    language={language}
                    initialValue={c.content_value}
                    className="block"
                  />
                ))}
              </div>
            ) : (
              <div style={{ marginTop: 'var(--layout-stack-gap, 1.5rem)' }}>
                <EditableText
                  as="p"
                  pageSlug={pageSlug}
                  sectionKey={bodyKey}
                  language={language}
                  initialValue={getVal(bodyKey, 'Text folgt.')}
                  className="block"
                />
              </div>
            )}
          </div>
        </section>
      )}
    </EditableSegment>
  );
}
