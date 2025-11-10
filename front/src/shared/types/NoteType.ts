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