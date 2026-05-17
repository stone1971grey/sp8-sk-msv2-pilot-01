/**
 * Global Search Extension — Lazy-Entry (Phase 5c).
 *
 * Beweist das Extension-Loading-Konzept im MSv2: lokaler Ordner unter
 * `src/extensions/`, Entry per dynamic import. Spätere SKs können den
 * Loader (`loadGlobalSearch`) verwenden; Fehler wird durch `.catch()`
 * abgefangen, damit Mothership/SK weiterläuft, falls die Extension fehlt
 * oder in einer SK-Variante nicht installiert ist.
 *
 * Phase 6/7: Migration nach `@sp8/ext-global-search` als echtes Package.
 */

export interface GlobalSearchHit {
  id: string;
  title: string;
  href: string;
  source: "page" | "segment";
}

export interface GlobalSearchAPI {
  name: "global-search";
  version: string;
  search: (query: string) => Promise<GlobalSearchHit[]>;
}

/**
 * Stub-Implementierung — liefert leere Trefferliste.
 * Echte Suche (über `page_registry` + `page_content`) folgt in Phase 6,
 * sobald der Mission-Control-Header die Extension konsumiert.
 */
const api: GlobalSearchAPI = {
  name: "global-search",
  version: "0.1.0",
  async search(query: string): Promise<GlobalSearchHit[]> {
    if (!query || query.trim().length < 2) return [];
    return [];
  },
};

export default api;
