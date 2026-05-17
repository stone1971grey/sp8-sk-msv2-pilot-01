/**
 * Global Search — Lazy-UI-Entry (Phase 5c).
 *
 * Default-Export ist die React-Komponente. Bewusst KEINE Re-Exports anderer
 * Module aus dieser Datei — sonst landet das Bundle dieser Datei wieder im
 * Core-Chunk via Tree-Shaking-Fallback.
 *
 * Konsument ist ausschließlich `src/extensions/loader.ts` über `React.lazy()`.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { searchPages, type SearchPageHit } from "./searchPages.functions";

interface GlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function GlobalSearchDialog({
  open,
  onOpenChange,
}: GlobalSearchDialogProps) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchPageHit[]>([]);
  const [loading, setLoading] = useState(false);
  const reqId = useRef(0);

  const runSearch = useCallback(async (q: string) => {
    const id = ++reqId.current;
    if (q.trim().length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await searchPages({ data: { query: q, limit: 10 } });
      if (id === reqId.current) setHits(res.hits);
    } catch (err) {
      console.error("[global-search] search failed:", err);
      if (id === reqId.current) setHits([]);
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      void runSearch(query);
    }, 180);
    return () => clearTimeout(handle);
  }, [query, runSearch]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Seiten suchen…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {loading ? "Suche läuft…" : query.trim().length < 2 ? "Mindestens 2 Zeichen eingeben." : "Keine Treffer."}
        </CommandEmpty>
        {hits.length > 0 && (
          <CommandGroup heading="Seiten">
            {hits.map((hit) => (
              <CommandItem
                key={hit.id}
                value={`${hit.page_title} ${hit.page_slug}`}
                onSelect={() => onOpenChange(false)}
                asChild
              >
                <Link
                  to="/$lang/$pageSlug"
                  params={{ lang: "de", pageSlug: hit.page_slug }}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{hit.page_title}</span>
                    <span className="text-xs text-muted-foreground">/{hit.page_slug}</span>
                  </div>
                </Link>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
