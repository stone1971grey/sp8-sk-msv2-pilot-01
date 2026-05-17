import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import {
  listAdminPages,
  createAdminPage,
  togglePageVisibility,
  deleteAdminPage,
} from '@/lib/admin-pages.functions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

/**
 * Phase 6.0b Block B — Funktionale Seitenverwaltung.
 * Listet alle Seiten, erlaubt Neuanlage, Sichtbarkeits-Toggle und Löschen.
 */
export function PagesPanel() {
  const qc = useQueryClient();
  const list = useServerFn(listAdminPages);
  const create = useServerFn(createAdminPage);
  const toggle = useServerFn(togglePageVisibility);
  const remove = useServerFn(deleteAdminPage);

  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'pages'],
    queryFn: () => list(),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'pages'] });

  const createMut = useMutation({
    mutationFn: (input: { page_slug: string; page_title: string }) =>
      create({ data: { ...input, nav_visible: true, status: 'published' } }),
    onSuccess: () => {
      toast.success(`Seite "${slug}" angelegt`);
      setSlug('');
      setTitle('');
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMut = useMutation({
    mutationFn: (input: { page_slug: string; nav_visible: boolean }) =>
      toggle({ data: input }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (page_slug: string) => remove({ data: { page_slug } }),
    onSuccess: () => {
      toast.success('Seite gelöscht');
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Neue Seite anlegen</CardTitle>
          <CardDescription>
            Slug = URL-Segment (a-z, 0-9, Bindestrich). Wird sofort in der Navigation
            sichtbar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              if (!slug || !title) return;
              createMut.mutate({ page_slug: slug, page_title: title });
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="page-slug">Slug</Label>
              <Input
                id="page-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                placeholder="z.B. ueber-uns"
                pattern="[a-z0-9][a-z0-9-]*"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="page-title">Titel</Label>
              <Input
                id="page-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="z.B. Über uns"
                required
              />
            </div>
            <Button type="submit" disabled={createMut.isPending}>
              {createMut.isPending ? 'Lege an…' : 'Anlegen'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alle Seiten</CardTitle>
          <CardDescription>
            {data?.pages?.length ?? 0} Seite(n) im Registry.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-muted-foreground">Lade…</p>}
          {error && (
            <p className="text-sm text-destructive">
              Fehler: {(error as Error).message}
            </p>
          )}
          {data?.pages && (
            <div className="divide-y divide-border">
              {data.pages.map((p: any) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {p.page_title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      /{p.page_slug} · {p.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Switch
                        checked={!!p.nav_visible}
                        onCheckedChange={(v) =>
                          toggleMut.mutate({ page_slug: p.page_slug, nav_visible: v })
                        }
                      />
                      Nav
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={p.page_slug === 'index' || deleteMut.isPending}
                      onClick={() => {
                        if (confirm(`Seite "${p.page_slug}" löschen?`)) {
                          deleteMut.mutate(p.page_slug);
                        }
                      }}
                    >
                      Löschen
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
