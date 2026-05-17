import { useQuery, queryOptions, type QueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type {
  DynamicPageData,
  Language,
  PageContentRow,
  PageRegistryRow,
  SegmentRegistryRow,
} from '@/lib/cmsTypes';

async function fetchDynamicPageData(
  slug: string,
  language: Language,
): Promise<DynamicPageData | null> {
  // 1) Page (RLS: published OR auth)
  const { data: page, error: pageErr } = await supabase
    .from('page_registry')
    .select('*')
    .eq('page_slug', slug)
    .maybeSingle();

  if (pageErr) throw pageErr;
  if (!page) return null;

  // 2) Segments (Soft-Delete-Filter Pflicht — siehe MSv1)
  const { data: segments, error: segErr } = await supabase
    .from('segment_registry')
    .select('*')
    .eq('page_slug', slug)
    .or('deleted.is.null,deleted.eq.false')
    .order('position', { ascending: true });

  if (segErr) throw segErr;

  // 3) Content (RLS published; auth sieht alles)
  const { data: content, error: contentErr } = await supabase
    .from('page_content')
    .select('*')
    .eq('page_slug', slug)
    .eq('language', language);

  if (contentErr) throw contentErr;

  return {
    page: page as unknown as PageRegistryRow,
    segments: (segments ?? []) as unknown as SegmentRegistryRow[],
    content: (content ?? []) as unknown as PageContentRow[],
  };
}

export const dynamicPageQueryOptions = (slug: string, language: Language = 'en') =>
  queryOptions({
    queryKey: ['cms', 'page', slug, language],
    queryFn: () => fetchDynamicPageData(slug, language),
    staleTime: 30_000,
  });

export function useDynamicPageData(
  slug: string,
  language: Language = 'en',
  initialData?: DynamicPageData | null,
) {
  return useQuery({
    ...dynamicPageQueryOptions(slug, language),
    // SSR-Loader füllt den QueryClient nicht in den Client-Bundle hinüber —
    // ohne initialData wäre der erste Client-Render isLoading=true und
    // damit ein anderer DOM-Tree als der vom Server. Mit initialData
    // ist der erste Paint identisch → keine Hydration-Mismatches.
    initialData: initialData ?? undefined,
  });
}

export function ensureDynamicPageData(
  qc: QueryClient,
  slug: string,
  language: Language = 'en',
) {
  return qc.ensureQueryData(dynamicPageQueryOptions(slug, language));
}
