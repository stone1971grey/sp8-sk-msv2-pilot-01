/**
 * Global-Search-Trigger — Phase 5c.
 *
 * Leichtgewichtiger Core-Eintrag: hört auf ⌘K / Strg+K, mountet das eigentliche
 * Search-UI erst bei Bedarf via Lazy-Chunk. ErrorBoundary fängt fehlende oder
 * fehlerhafte Extension-Ladevorgänge ab (Fallback: App läuft weiter, ohne UI).
 */

import { Component, Suspense, useEffect, useMemo, useState, type ReactNode } from "react";

import { loadGlobalSearchUI } from "@/extensions/loader";

interface ExtensionBoundaryState {
  failed: boolean;
}

class ExtensionBoundary extends Component<{ children: ReactNode }, ExtensionBoundaryState> {
  state: ExtensionBoundaryState = { failed: false };

  static getDerivedStateFromError(): ExtensionBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("[ext] global-search UI boundary caught:", error);
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

export function GlobalSearchTrigger() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // React.lazy nur einmal pro Mount erzeugen.
  const LazyDialog = useMemo(() => loadGlobalSearchUI(), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setMounted(true);
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!mounted) return null;

  return (
    <ExtensionBoundary>
      <Suspense fallback={null}>
        <LazyDialog open={open} onOpenChange={setOpen} />
      </Suspense>
    </ExtensionBoundary>
  );
}
