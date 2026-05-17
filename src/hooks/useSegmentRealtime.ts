import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Language } from '@/lib/cmsTypes';

const TOKEN_RELOAD_CHANNEL = 'sp8:studio-saved';

/**
 * Page-level Realtime + Cache-Invalidation für eine CMS-Seite.
 *
 * Hard-Rules (Memory `data-integrity-guards-de` + Walter-Fix 16.05.):
 *   1. Builder-Chain in einem Rutsch: .channel().on().on().subscribe() —
 *      niemals .on() nach .subscribe(), Supabase Realtime v2 wirft dann hart.
 *   2. EIN Channel pro (slug, language), NICHT pro Segment. Sonst entstehen auf
 *      Multi-Segment-Seiten (Demo: 5) parallele Channels mit identischem Namen
 *      → "tried to subscribe multiple times"-Fehler.
 *
 * Subscribed:
 *   - page_content       (gefiltert auf slug)        → invalidiert page-Query
 *   - page_registry      (gefiltert auf slug)        → invalidiert page-Query
 *   - segment_design_tokens (kein Filter — kleine Tabelle, globals & instances)
 *                                                    → invalidiert tokens-Query
 *
 * segment_registry ist BEWUSST nicht in Realtime — Strukturänderungen brauchen
 * Cold-Reload.
 *
 * Zusätzlich vier Reload-Schichten für Tokens (Memory):
 *   visibilitychange, focus, BroadcastChannel, gleichseitiges Window-Event.
 */
export function useSegmentRealtime(slug: string, language: Language = 'en') {
  const qc = useQueryClient();

  useEffect(() => {
    if (!slug) return;

    const invalidatePage = () =>
      qc.invalidateQueries({ queryKey: ['cms', 'page', slug, language] });
    const invalidateTokens = () =>
      qc.invalidateQueries({ queryKey: ['cms', 'tokens', slug, language] });

    // Single channel — alle .on()-Listener VOR .subscribe().
    const channel = supabase
      .channel(`cms:${slug}:${language}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'page_content',
          filter: `page_slug=eq.${slug}`,
        },
        invalidatePage,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'page_registry',
          filter: `page_slug=eq.${slug}`,
        },
        invalidatePage,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'segment_design_tokens',
          // Kein Filter — globals haben page_slug=null und würden sonst rausfallen.
        },
        invalidateTokens,
      )
      .subscribe();

    // visibility / focus
    const onVisibility = () => {
      if (document.visibilityState === 'visible') invalidateTokens();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', invalidateTokens);

    // BroadcastChannel — Studio-Save in anderem Tab
    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel(TOKEN_RELOAD_CHANNEL);
      bc.onmessage = invalidateTokens;
    }

    // Window-Event — Studio-Save im GLEICHEN Tab (MSv1-SSOT)
    window.addEventListener(TOKEN_RELOAD_CHANNEL, invalidateTokens);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', invalidateTokens);
      window.removeEventListener(TOKEN_RELOAD_CHANNEL, invalidateTokens);
      bc?.close();
    };
  }, [slug, language, qc]);
}
