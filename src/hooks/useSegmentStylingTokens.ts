import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SegmentDesignTokenRow, SegmentRegistryRow } from '@/lib/cmsTypes';

interface UseSegmentStylingTokensArgs {
  segment: SegmentRegistryRow;
  pageSlug: string;
  language: string;
  presetRef?: string | null;
}

const TOKEN_RELOAD_CHANNEL = 'sp8:studio-saved';

async function fetchTokensForPage(pageSlug: string, language: string) {
  // Hol ALLE Tokens für die Seite + alle global-defaults für die vorkommenden Typen.
  // Eine Query, beide Scopes — Resolution passiert clientseitig.
  const { data, error } = await supabase
    .from('segment_design_tokens')
    .select('*')
    .or(
      `and(scope.eq.instance,page_slug.eq.${pageSlug},language.in.(${language},)),scope.eq.global-default`,
    );

  if (error) throw error;
  return (data ?? []) as unknown as SegmentDesignTokenRow[];
}

const tokensQueryKey = (pageSlug: string, language: string) =>
  ['cms', 'tokens', pageSlug, language] as const;

/**
 * 3-Stufen-Vererbung (Memory `global-type-presets-contract`):
 *   instance ⊕ global-default[preset_ref] ⊕ global-default['default'] ⊕ {}
 * Instance gewinnt KEY-FÜR-KEY (Spread-Reihenfolge), nicht objektweise.
 */
function resolveTokens(args: {
  segment: SegmentRegistryRow;
  presetRef?: string | null;
  allTokens: SegmentDesignTokenRow[];
}): Record<string, string> {
  const { segment, presetRef, allTokens } = args;

  const globalsForType = allTokens.filter(
    (t) => t.scope === 'global-default' && t.segment_type === segment.segment_type,
  );

  const presetDefault =
    globalsForType.find((t) => t.preset_name === 'default')?.tokens ?? {};
  const presetByRef = presetRef
    ? (globalsForType.find((t) => t.preset_name === presetRef)?.tokens ?? {})
    : {};

  const instance =
    allTokens.find(
      (t) =>
        t.scope === 'instance' &&
        t.segment_id === segment.segment_id &&
        t.page_slug === segment.page_slug,
    )?.tokens ?? {};

  // Spread-Reihenfolge: spätere überschreiben frühere, key-für-key.
  return {
    ...(presetDefault as Record<string, string>),
    ...(presetByRef as Record<string, string>),
    ...(instance as Record<string, string>),
  };
}

/**
 * Pro Segment aufgerufen, aber NUR React-Query — KEINE eigene Realtime-Subscription.
 *
 * Realtime + Reload-Schichten leben page-level in `useSegmentRealtime`
 * (Walter-Fix 16.05.: pro-Segment-Channel mit identischem Namen knallt
 * auf Multi-Segment-Seiten).
 */
export function useSegmentStylingTokens({
  segment,
  pageSlug,
  language,
  presetRef,
}: UseSegmentStylingTokensArgs) {
  const queryKey = tokensQueryKey(pageSlug, language);

  const { data: allTokens = [] } = useQuery({
    queryKey,
    queryFn: () => fetchTokensForPage(pageSlug, language),
    staleTime: 30_000,
  });

  return useMemo(
    () => resolveTokens({ segment, presetRef, allTokens }),
    [segment, presetRef, allTokens],
  );
}

/** Helper für Studio-Save: alle offenen Tabs + den aktuellen Tab benachrichtigen. */
export function broadcastTokenReload() {
  // Gleicher Tab (Window-Event)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(TOKEN_RELOAD_CHANNEL, { detail: { t: Date.now() } }));
  }
  // Andere Tabs (BroadcastChannel)
  if (typeof BroadcastChannel === 'undefined') return;
  const bc = new BroadcastChannel(TOKEN_RELOAD_CHANNEL);
  bc.postMessage({ type: 'studio-saved', t: Date.now() });
  bc.close();
}
