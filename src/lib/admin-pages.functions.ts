import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

/**
 * Phase 6.0b Block B — Server Functions für Seitenverwaltung.
 *
 * Alle Calls laufen via `requireSupabaseAuth` (User-Bearer). RLS auf
 * `page_registry` und `user_roles` erzwingt zusätzlich, dass nur Admins
 * schreiben dürfen — Defense in Depth (Middleware + RLS).
 */

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();
  if (error) throw new Error(`Rollen-Check fehlgeschlagen: ${error.message}`);
  if (!data) throw new Error('Forbidden: admin role required');
}

export const listAdminPages = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from('page_registry')
      .select(
        'id, page_id, page_slug, page_title, status, nav_visible, nav_position, parent_slug, updated_at',
      )
      .order('nav_position', { ascending: true, nullsFirst: false })
      .order('page_slug', { ascending: true });
    if (error) throw new Error(error.message);
    return { pages: data ?? [] };
  });

const slugRegex = /^[a-z0-9][a-z0-9-]*$/;

const createPageInput = z.object({
  page_slug: z.string().min(1).max(64).regex(slugRegex, 'lowercase a-z, 0-9, dashes'),
  page_title: z.string().min(1).max(200),
  nav_visible: z.boolean().default(true),
  status: z.enum(['draft', 'pending', 'published']).default('published'),
});

export const createAdminPage = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => createPageInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    // Reserved: never overwrite the home page.
    if (data.page_slug === 'index') {
      throw new Error("Slug 'index' ist reserviert.");
    }

    // Eindeutigkeit prüfen.
    const { data: existing } = await supabase
      .from('page_registry')
      .select('id')
      .eq('page_slug', data.page_slug)
      .maybeSingle();
    if (existing) throw new Error(`Seite mit Slug "${data.page_slug}" existiert bereits.`);

    // page_id via SECURITY DEFINER-Funktion.
    const { data: nextId, error: seqErr } = await supabase.rpc('get_next_page_id');
    if (seqErr) throw new Error(`page_id konnte nicht erzeugt werden: ${seqErr.message}`);

    const { data: inserted, error: insErr } = await supabase
      .from('page_registry')
      .insert({
        page_id: nextId,
        page_slug: data.page_slug,
        page_title: data.page_title,
        status: data.status,
        nav_visible: data.nav_visible,
        source: 'admin-ui',
      })
      .select('id, page_slug, page_title, page_id')
      .single();
    if (insErr) throw new Error(insErr.message);

    return { page: inserted };
  });

const togglePageVisibilityInput = z.object({
  page_slug: z.string().min(1).max(64).regex(slugRegex),
  nav_visible: z.boolean(),
});

export const togglePageVisibility = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => togglePageVisibilityInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const { error } = await supabase
      .from('page_registry')
      .update({ nav_visible: data.nav_visible })
      .eq('page_slug', data.page_slug);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const deletePageInput = z.object({
  page_slug: z.string().min(1).max(64).regex(slugRegex),
});

export const deleteAdminPage = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => deletePageInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    if (data.page_slug === 'index') {
      throw new Error("Die Startseite 'index' kann nicht gelöscht werden.");
    }

    const { error } = await supabase
      .from('page_registry')
      .delete()
      .eq('page_slug', data.page_slug);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
