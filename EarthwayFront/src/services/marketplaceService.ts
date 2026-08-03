import api from './api';

export interface AffiliateInfo {
  slug: string;
  network: 'shareasale' | 'awin' | 'affilizz' | 'amazon' | 'direct';
  isActive: boolean;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  imageUrl: string;
  affiliateUrl: string;
  theme: string;
  brandName: string;
  createdAt: string;
  affiliateLink?: AffiliateInfo | null;
}

export const marketplaceService = {
  /**
   * Fetch all products with optional theme filter
   */
  async fetchProducts(theme?: string): Promise<Product[]> {
    const params = theme ? { theme } : {};
    const response = await api.get<Product[]>('/marketplace/products', { params });
    return response.data;
  },

  /**
   * Fetch product by ID
   */
  async fetchProductById(id: number): Promise<Product> {
    const response = await api.get<Product>(`/marketplace/products/${id}`);
    return response.data;
  },

  /**
   * Fetch available themes
   */
  async fetchThemes(): Promise<string[]> {
    const response = await api.get<string[]>('/marketplace/themes');
    return response.data;
  },
};

export default marketplaceService;
