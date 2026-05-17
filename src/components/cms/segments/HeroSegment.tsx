import { EditableSegment } from '@/components/cms/EditableSegment';
import { EditableText } from '@/components/cms/EditableText';
import type { Language, PageContentRow, SegmentRegistryRow } from '@/lib/cmsTypes';

interface HeroSegmentProps {
  segment: SegmentRegistryRow;
  pageSlug: string;
  language: Language;
  content: PageContentRow[];
}

function getCellValue(
  cells: PageContentRow[],
  sectionKey: string,
  fallback = '',
): string {
  return cells.find((c) => c.section_key === sectionKey)?.content_value ?? fallback;
}

/**
 * Hero-Segment — erstes konkretes Token-konsumierendes Segment.
 *
 * Vier-Reiter-Konsum via CSS-Variablen (NICHT via Tailwind-Klassen für Visuals):
 *   color  →  var(--color-bg, fallback) / var(--color-fg)
 *   typo   →  var(--typo-heading-size, ...) / var(--typo-body-family)
 *   layout →  var(--layout-padding-y) / var(--layout-max-width)
 *   motion →  var(--motion-fade-duration)
 *
 * Tailwind ist nur erlaubt für strukturelle Klassen (flex, grid, w-full, mx-auto)
 * — Visuals MÜSSEN aus Tokens kommen. Memory `vier-reiter-prinzip-de`.
 *
 * Alle text-Cells werden inline-editierbar gerendert.
 */
export function HeroSegment({ segment, pageSlug, language, content }: HeroSegmentProps) {
  const cells = content.filter((c) => c.section_key.startsWith(segment.segment_key));
  const headlineKey = `${segment.segment_key}__headline`;
  const sublineKey = `${segment.segment_key}__subline`;
  const ctaKey = `${segment.segment_key}__cta`;

  // Andere text-Cells, die nicht headline/subline/cta sind → generisch rendern.
  const extraTextCells = cells.filter(
    (c) =>
      c.content_type === 'text' &&
      ![headlineKey, sublineKey, ctaKey].includes(c.section_key),
  );

  return (
    <EditableSegment segment={segment} pageSlug={pageSlug} language={language}>
      {() => (
        <section
          className="w-full"
          style={{
            // Token-Konsum mit nüchternen Fallbacks. Keine bg-/text-/font-/p-Klassen.
            background: 'var(--color-bg, transparent)',
            color: 'var(--color-fg, inherit)',
            paddingTop: 'var(--layout-padding-y, 4rem)',
            paddingBottom: 'var(--layout-padding-y, 4rem)',
            transitionProperty: 'background-color, color',
            transitionDuration: 'var(--motion-fade-duration, 200ms)',
          }}
        >
          <div
            className="mx-auto"
            style={{ maxWidth: 'var(--layout-max-width, 64rem)' }}
          >
            <EditableText
              as="h1"
              pageSlug={pageSlug}
              sectionKey={headlineKey}
              language={language}
              initialValue={getCellValue(cells, headlineKey, 'Headline')}
              className="block"
              // Visuals via inline-style/CSS-Vars statt Tailwind.
            />
            <div
              style={{
                fontSize: 'var(--typo-heading-size, 2.5rem)',
                fontWeight: 'var(--typo-heading-weight, 700)',
                lineHeight: 'var(--typo-heading-line-height, 1.1)',
                fontFamily: 'var(--typo-heading-family, inherit)',
                marginBottom: 'var(--layout-stack-gap, 1rem)',
              }}
              aria-hidden
            />

            <EditableText
              as="p"
              pageSlug={pageSlug}
              sectionKey={sublineKey}
              language={language}
              initialValue={getCellValue(cells, sublineKey, 'Subline')}
              className="block"
            />
            <div
              style={{
                fontSize: 'var(--typo-body-size, 1.125rem)',
                lineHeight: 'var(--typo-body-line-height, 1.5)',
                fontFamily: 'var(--typo-body-family, inherit)',
                opacity: 'var(--color-subline-opacity, 0.85)',
                marginTop: 'var(--layout-stack-gap, 1rem)',
              }}
              aria-hidden
            />

            {extraTextCells.length > 0 && (
              <div
                className="space-y-2"
                style={{ marginTop: 'var(--layout-stack-gap, 1.5rem)' }}
              >
                {extraTextCells.map((c) => (
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
            )}
          </div>
        </section>
      )}
    </EditableSegment>
  );
}
