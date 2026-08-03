export interface Product {
  id: number;
  title: string;
  content: string;
  image?: string;
  video?: string;
  price: number;
  trackedLink: string;
  marketplaceId: number;
}
