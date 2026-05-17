import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * `justSavedRef`-Pattern aus MSv1 (`ImageTextSegment.tsx`, `Tiles.tsx`):
 * Drei kooperierende Refs schützen lokale Edits vor Realtime-Race-Conditions.
 *
 * - `justSavedRef`: 3000 ms (NICHT 2000) Lock nach Save, Realtime-Updates für
 *   diese Komponente werden ignoriert. Wortlaut MSv1.
 * - `hasChangesRef`: lokale Pending-Edits, blockiert Props-Übernahme.
 * - `saveInProgressRef`: gerade dabei zu speichern, blockiert ebenfalls.
 *
 * Gating: per Component-Instance (über `useRef`), nicht per `segment_id` —
 * Realtime-Events betreffen eh nur die geladene Instanz.
 */
export const SAVE_LOCK_MS = 3000;

export function useSaveGuards<T>(initialValue: T) {
  const justSavedRef = useRef(false);
  const hasChangesRef = useRef(false);
  const saveInProgressRef = useRef(false);

  const [localValue, setLocalValue] = useState<T>(initialValue);

  /** Vor Props-Übernahme aufrufen — gibt true zurück wenn übernommen werden darf. */
  const canAcceptProps = useCallback((): boolean => {
    if (justSavedRef.current) return false;
    if (hasChangesRef.current) return false;
    if (saveInProgressRef.current) return false;
    return true;
  }, []);

  const markChanged = useCallback(() => {
    hasChangesRef.current = true;
  }, []);

  const beginSave = useCallback(() => {
    saveInProgressRef.current = true;
  }, []);

  const endSave = useCallback((success: boolean) => {
    saveInProgressRef.current = false;
    if (!success) return;
    justSavedRef.current = true;
    hasChangesRef.current = false;
    window.setTimeout(() => {
      justSavedRef.current = false;
    }, SAVE_LOCK_MS);
  }, []);

  return {
    localValue,
    setLocalValue,
    canAcceptProps,
    markChanged,
    beginSave,
    endSave,
    justSavedRef,
    hasChangesRef,
    saveInProgressRef,
  };
}

/**
 * Guard-aware Props-Sync. Nur übernehmen wenn keine pending changes / lock.
 */
export function useGuardedPropsSync<T>(
  propValue: T,
  setLocal: (v: T) => void,
  canAccept: () => boolean,
) {
  useEffect(() => {
    if (!canAccept()) return;
    setLocal(propValue);
    // Linter ist ok damit — propValue ist die einzige echte Dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propValue]);
}
