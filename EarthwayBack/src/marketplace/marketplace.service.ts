import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductTheme } from '@prisma/client';

@Injectable()
export class MarketplaceService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all products with optional theme filter
   */
  async getProducts(theme?: ProductTheme) {
    return this.prisma.product.findMany({
      where: theme ? { theme } : undefined,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        currency: true,
        imageUrl: true,
        affiliateUrl: true,
        theme: true,
        brandName: true,
        createdAt: true,
        affiliateLink: {
          select: {
            slug: true,
            network: true,
            isActive: true,
          },
        },
      },
    });
  }

  /**
   * Get product by ID
   */
  async getProductById(id: number) {
    return this.prisma.product.findUnique({
      where: { id },
    });
  }

 /**
   * Get available themes
   */
  getAvailableThemes() {
    return Object.values(ProductTheme);
  }
}
