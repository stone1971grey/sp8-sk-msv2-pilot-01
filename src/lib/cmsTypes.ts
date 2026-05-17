// CMS Types — portiert aus MSv1 Schema
// Phase 3: nur Read-Types, Write-Types kommen Phase 4 mit Editing

export type PageStatus = 'draft' | 'pending' | 'published';
export type ContentStatus = 'draft' | 'pending' | 'published';
export type Language = 'en' | 'de' | 'ja' | 'ko' | 'zh' | 'es';

export interface PageRegistryRow {
  id: number;
  page_id: number;
  page_slug: string;
  page_title: string;
  parent_slug: string | null;
  parent_id: number | null;
  position: number | null;
  status: PageStatus;
  nav_visible: boolean | null;
  nav_category: string | null;
  nav_position: number | null;
  frontend_editing_enabled: boolean;
  title_translations: Record<string, string>;
  flyout_description_translations: Record<string, string>;
  flyout_image_url: string | null;
  flyout_description: string | null;
  design_icon: string | null;
  target_page_slug: string | null;
  cta_group: string | null;
  cta_label: string | null;
  cta_icon: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
}

export interface SegmentRegistryRow {
  id: number;
  segment_id: number;
  page_slug: string;
  segment_type: string;
  segment_key: string;
  position: number | null;
  is_static: boolean | null;
  deleted: boolean | null;
  source: string | null;
  row_group: string | null;
  col_span: number | null;
  col_start: number | null;
  row_height: string | null;
  row_gap: string | null;
  responsive_col_span: Record<string, number>;
  spacing: Record<string, unknown>;
  template_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PageContentRow {
  id: string;
  page_slug: string;
  section_key: string;
  content_type: string;
  content_value: string;
  draft_value: string | null;
  language: Language;
  content_status: ContentStatus;
  content_version: number | null;
  import_stage: number | null;
  approved_at: string | null;
  approved_by: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface SegmentDesignTokenRow {
  id: string;
  scope: 'instance' | 'global-default';
  segment_id: number | null;
  segment_key: string | null;
  segment_type: string | null;
  page_slug: string | null;
  language: string | null;
  preset_name: string | null;
  preset_ref: string | null;
  token_category: string | null;
  token_key: string | null;
  token_value: string | null;
  tokens: Record<string, unknown>;
  responsive_overrides: Record<string, unknown>;
  source: string | null;
  created_at: string;
  updated_at: string;
}

export interface DynamicPageData {
  page: PageRegistryRow;
  segments: SegmentRegistryRow[];
  content: PageContentRow[];
}
