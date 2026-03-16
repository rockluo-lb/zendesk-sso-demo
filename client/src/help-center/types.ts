type HcHealth = {
  hasApiToken: boolean;
  apiEmail: string;
  subdomain: string;
};

type Category = {
  id: number;
  name: string;
  description: string;
  locale: string;
  html_url: string;
};

type Section = {
  id: number;
  name: string;
  description: string;
  html_url: string;
  category_id: number;
  locale: string;
};

type Article = {
  id: number;
  title: string;
  body: string;
  html_url: string;
  section_id: number;
  created_at: string;
  updated_at: string;
  author_id: number;
  label_names: string[];
  locale: string;
  draft: boolean;
  permission_group_id: number;
  user_segment_id: number | null;
};

type Attachment = {
  id: number;
  file_name: string;
  content_url: string;
  content_type: string;
  size: number;
  inline: boolean;
  article_id: number;
};

type View =
  | { type: 'home' }
  | { type: 'sections'; category: Category }
  | { type: 'articles'; section: Section; category: Category }
  | { type: 'article'; article: Article; section: Section; category: Category }
  | { type: 'search'; query: string };

export type { HcHealth, Category, Section, Article, Attachment, View };
