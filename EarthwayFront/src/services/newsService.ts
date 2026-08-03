import { api } from './api';
import { NewsTheme } from '../types/news';

export interface NewsFilters {
  theme?: NewsTheme;
  search?: string;
  page?: number;
  limit?: number;
}

export const fetchNews = (filters: NewsFilters = {}) =>
  api.get('/news', { params: filters });

export const fetchNewsById = (id: number) => api.get(`/news/${id}`);
