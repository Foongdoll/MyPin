export type Folder = {
  id: string;
  name: string;
  children?: Folder[];
};

export type Note = {
  id: string;
  title: string;
  categoryPath: string[]; // ["개발", "React"] 같은 경로
  date: string; // YYYY-MM-DD
  excerpt: string;
  tags?: string[];
};

export type NoteDetail = {
  id: string;
  title: string;
  content: string; // markdown
  categoryId: string;
  categoryPath: string[];
  tags: string[];
  likes: number;
  liked: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Comment = {
  id: string;
  author: string;
  content: string;
  createdAt: string;
};