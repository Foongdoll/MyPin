export interface NoteSectionBlock {
  title?: string;
  imageUrl?: string;
  description?: string;
  sortOrder?: number;
}

export interface NoteSummary {
  id: number;
  title: string;
  snippet?: string | null;
  coverImageUrl?: string | null;
  categoryTop?: string | null;
  categorySub?: string | null;
  date?: string | null;
  views: number;
  author?: string | null;
}

export interface NoteDetail extends NoteSummary {
  content?: string | null;
  categoryId?: number | null;
  categoryCode?: string | null;
  categoryPath?: string | null;
  tags: string[];
  sections: NoteSectionBlock[];
}

export interface NoteListResponse {
  items: NoteSummary[];
  page: number;
  pageSize: number;
  total: number;
  hasPrev: boolean;
  hasNext: boolean;
}

export interface NoteListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  categoryCode?: string;
  categoryPath?: string;
}

export interface NotePayload {
  title: string;
  snippet?: string;
  content?: string;
  coverImageUrl?: string;
  author: string;
  date?: string;
  views?: number;
  categoryId?: number | null;
  categoryCode?: string;
  tags?: string[];
  sections?: NoteSectionBlock[];
}

export interface CategoryNode {
  id: number;
  code: string;
  label: string;
  path: string;
  depth: number;
  sortOrder: number;
  parentId?: number | null;
  children: CategoryNode[];
}

export interface CategoryCreatePayload {
  label: string;
  code: string;
  parentId?: number | null;
  sortOrder?: number;
}

export interface AssetUploadResponse {
  url: string;
  filename: string;
  size: number;
  contentType: string;
}
