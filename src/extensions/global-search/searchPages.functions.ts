/**
 * Global Search — Server Function (Phase 5c).
 *
 * Liest `page_registry` und liefert Treffer für eine Volltext-Suche
 * im Titel / Slug. Bewusst minimal: kein Ranking, keine FTS-Indizes —
 * der Beweis hier ist Lazy-Loading, nicht Such-Qualität.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { supabaseAdmin } from "@/integrations/supabase/client.server";

const InputSchema = z.object({
  query: z.string().min(1).max(200),
  limit: z.number().int().min(1).max(50).optional(),
});

export interface SearchPageHit {
  id: number;
  page_slug: string;
  page_title: string;
  status: string;
}

export const searchPages = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<{ hits: SearchPageHit[] }> => {
    const q = data.query.trim();
    if (q.length < 2) return { hits: [] };

    const limit = data.limit ?? 10;
    const pattern = `%${q.replace(/[%_]/g, "\\$&")}%`;

    const { data: rows, error } = await supabaseAdmin
      .from("page_registry")
      .select("id, page_slug, page_title, status")
      .or(`page_title.ilike.${pattern},page_slug.ilike.${pattern}`)
      .eq("status", "published")
      .limit(limit);

    if (error) {
      console.error("[global-search] page_registry query failed:", error);
      return { hits: [] };
    }

    return { hits: (rows ?? []) as SearchPageHit[] };
  });
