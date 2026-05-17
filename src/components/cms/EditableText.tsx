import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { SAVE_LOCK_MS } from '@/hooks/useSaveGuards';
import type { Language } from '@/lib/cmsTypes';

interface EditableTextProps {
  pageSlug: string;
  sectionKey: string;
  language: Language;
  contentType?: string;
  initialValue: string;
  /** Optional: Tag-Name (h1, h2, p, span ...). Default: span. */
  as?: keyof React.JSX.IntrinsicElements;
  /** Klassen für Lesemodus + Editiermodus. */
  className?: string;
  /** Empty-Save-Schutz: leere Werte ablehnen wenn vorher Inhalt da war. */
  rejectEmptyOverwrite?: boolean;
}

/**
 * Inline-editierbarer Text. Save bei Blur oder Enter, Esc verwirft.
 * Save-Guards: justSavedRef (3000ms), hasChangesRef, saveInProgressRef.
 * Empty-Overwrite-Schutz aktiv (Geist von `validateSegmentIntegrity`).
 */
export function EditableText({
  pageSlug,
  sectionKey,
  language,
  contentType = 'text',
  initialValue,
  as = 'span',
  className,
  rejectEmptyOverwrite = true,
}: EditableTextProps) {
  const { isAdmin } = useIsAdmin();
  const qc = useQueryClient();

  const [value, setValue] = useState(initialValue);
  const [editing, setEditing] = useState(false);

  const justSavedRef = useRef(false);
  const hasChangesRef = useRef(false);
  const saveInProgressRef = useRef(false);
  const elementRef = useRef<HTMLElement | null>(null);

  // Guard-aware Props-Sync (Memory `data-integrity-guards-de`).
  useEffect(() => {
    if (justSavedRef.current) return;
    if (hasChangesRef.current) return;
    if (saveInProgressRef.current) return;
    setValue(initialValue);
  }, [initialValue]);

  const mutation = useMutation({
    mutationFn: async (next: string) => {
      const { error } = await supabase.from('page_content').upsert(
        {
          page_slug: pageSlug,
          section_key: sectionKey,
          language,
          content_type: contentType,
          content_value: next,
          content_status: 'published',
        },
        { onConflict: 'page_slug,section_key,language' },
      );
      if (error) throw error;
    },
    onMutate: () => {
      saveInProgressRef.current = true;
    },
    onSuccess: () => {
      saveInProgressRef.current = false;
      hasChangesRef.current = false;
      justSavedRef.current = true;
      window.setTimeout(() => {
        justSavedRef.current = false;
      }, SAVE_LOCK_MS);
      qc.invalidateQueries({ queryKey: ['cms', 'page', pageSlug, language] });
    },
    onError: (err: Error) => {
      saveInProgressRef.current = false;
      toast.error(`Speichern fehlgeschlagen: ${err.message}`);
    },
  });

  const commit = useCallback(
    (next: string) => {
      const trimmed = next;
      if (trimmed === initialValue) return; // nichts geändert
      if (rejectEmptyOverwrite && trimmed.trim() === '' && initialValue.trim() !== '') {
        toast.error('Leerer Wert wird nicht gespeichert (Empty-Overwrite-Schutz)');
        setValue(initialValue);
        return;
      }
      mutation.mutate(trimmed);
    },
    [initialValue, mutation, rejectEmptyOverwrite],
  );

  const handleBlur = () => {
    setEditing(false);
    const next = elementRef.current?.innerText ?? value;
    commit(next);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      (e.currentTarget as HTMLElement).blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (elementRef.current) elementRef.current.innerText = initialValue;
      hasChangesRef.current = false;
      setEditing(false);
      (e.currentTarget as HTMLElement).blur();
    }
  };

  const handleInput = () => {
    hasChangesRef.current = true;
  };

  const Tag = as as React.ElementType;

  if (!isAdmin) {
    return <Tag className={className}>{value}</Tag>;
  }

  return (
    <Tag
      ref={elementRef as React.Ref<HTMLElement>}
      className={`${className ?? ''} ${editing ? 'outline outline-2 outline-primary outline-offset-2 rounded-sm' : 'hover:outline hover:outline-1 hover:outline-dashed hover:outline-muted-foreground/40 hover:outline-offset-2 rounded-sm cursor-text'}`}
      contentEditable
      suppressContentEditableWarning
      onFocus={() => setEditing(true)}
      onBlur={handleBlur}
      onKeyDown={handleKey}
      onInput={handleInput}
      data-section-key={sectionKey}
    >
      {value}
    </Tag>
  );
}
