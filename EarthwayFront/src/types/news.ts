export enum NewsTheme {
  REFORESTATION = 'reforestation',
  OCEANS = 'oceans',
  POLLINATORS = 'pollinators',
  INNOVATIONS = 'innovations',
  GENERAL = 'general',
}

export interface NewsArticle {
  id: number;
  title: string;
  description: string;
  summary?: string; // legacy alias
  content: string;
  author?: string;
  source: string;
  url: string;
  sourceUrl?: string; // legacy alias
  imageUrl?: string;
  publishedAt: string;
  theme: NewsTheme;
  createdAt: string;
  updatedAt: string;
}
