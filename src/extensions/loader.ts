/**
 * Extension-Loader — Phase 5c.
 *
 * Lazy-Import mit `.catch()`-Fallback: fehlt eine Extension (z. B. in einer
 * SK-Variante, die sie nicht ausliefert), läuft Mothership/SK ohne sie weiter.
 *
 * Headless-API (für Programm-Zugriff):
 *   const search = await loadGlobalSearch();
 *   if (search) await search.search("hero");
 *
 * UI-API (für React-Lazy):
 *   const Lazy = loadGlobalSearchUI();
 *   <Suspense fallback={null}><Lazy open onOpenChange={...} /></Suspense>
 */

import { lazy, type ComponentType } from "react";

import type { GlobalSearchAPI } from "./global-search";

export async function loadGlobalSearch(): Promise<GlobalSearchAPI | null> {
  try {
    const mod = await import("./global-search");
    return mod.default;
  } catch (err) {
    if (typeof console !== "undefined") {
      console.warn("[ext] global-search nicht verfügbar:", err);
    }
    return null;
  }
}

export interface GlobalSearchUIProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * React-Lazy-Loader für das Search-UI. Fallback-Komponente greift, falls
 * der Chunk zur Laufzeit nicht ladbar ist (Extension entfernt, Network-Fail).
 */
export function loadGlobalSearchUI(): ComponentType<GlobalSearchUIProps> {
  return lazy<ComponentType<GlobalSearchUIProps>>(async () => {
    try {
      const mod = await import("./global-search/ui");
      return { default: mod.default as ComponentType<GlobalSearchUIProps> };
    } catch (err) {
      if (typeof console !== "undefined") {
        console.warn("[ext] global-search UI nicht verfügbar:", err);
      }
      // Fallback-Komponente: rendert nichts, App läuft weiter.
      const Noop: ComponentType<GlobalSearchUIProps> = () => null;
      return { default: Noop };
    }
  });
}
