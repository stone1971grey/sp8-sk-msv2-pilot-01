import { Link, useRouterState } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Language } from '@/lib/cmsTypes';

interface NavItem {
  page_slug: string;
  page_title: string;
  nav_position: number | null;
  title_translations: Record<string, string> | null;
}

const INDEX_SLUG = 'index';

async function fetchNavPages(): Promise<NavItem[]> {
  const { data, error } = await supabase
    .from('page_registry')
    .select('page_slug, page_title, nav_position, title_translations')
    .eq('nav_visible', true)
    .eq('status', 'published')
    .order('nav_position', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as NavItem[];
}

function titleFor(item: NavItem, lang: Language): string {
  const t = item.title_translations?.[lang];
  return t && t.trim().length > 0 ? t : item.page_title;
}

interface SiteNavProps {
  language: Language;
}

/**
 * Globale Navigation aus page_registry (nav_visible + published).
 * `index`-Slug ist DB-Synonym → linkt auf /$lang (Contract 1).
 */
export function SiteNav({ language }: SiteNavProps) {
  const { data: pages = [] } = useQuery({
    queryKey: ['cms', 'nav', 'pages'],
    queryFn: fetchNavPages,
    staleTime: 60_000,
  });
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header
      className="sticky top-0 z-40 w-full border-b border-border/60 backdrop-blur"
      style={{
        background: 'color-mix(in oklab, var(--background) 80%, transparent)',
      }}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link
          to="/$lang"
          params={{ lang: language }}
          className="text-sm font-semibold tracking-tight text-foreground"
        >
          sp8
        </Link>

        <nav className="flex items-center gap-1">
          {pages.map((p) => {
            const isIndex = p.page_slug === INDEX_SLUG;
            const to = isIndex ? '/$lang' : '/$lang/$pageSlug';
            const params = isIndex
              ? { lang: language }
              : { lang: language, pageSlug: p.page_slug };
            const targetPath = isIndex
              ? `/${language}`
              : `/${language}/${p.page_slug}`;
            const active = pathname === targetPath;
            return (
              <Link
                key={p.page_slug}
                to={to}
                params={params}
                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                }`}
              >
                {titleFor(p, language)}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1 text-xs">
          {(['de', 'en'] as Language[]).map((l) => {
            const active = l === language;
            const swapTo = pathname.replace(/^\/[a-z]{2}/, `/${l}`) || `/${l}`;
            return (
              <a
                key={l}
                href={swapTo}
                className={`rounded px-2 py-1 uppercase tracking-wide ${
                  active
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {l}
              </a>
            );
          })}
        </div>
      </div>
    </header>
  );
}
