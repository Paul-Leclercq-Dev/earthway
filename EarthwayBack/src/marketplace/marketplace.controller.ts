import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { ProductTheme } from '@prisma/client';

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  /**
   * GET /marketplace/products - Get all products (public endpoint)
   * @query theme - Optional filter by theme (reforestation, oceans, zero_waste, renewable_energy)
   */
  @Get('products')
  getProducts(@Query('theme') theme?: ProductTheme) {
    return this.marketplaceService.getProducts(theme);
  }

  /**
   * GET /marketplace/products/:id - Get product by ID
   */
  @Get('products/:id')
  getProductById(@Param('id', ParseIntPipe) id: number) {
    return this.marketplaceService.getProductById(id);
  }

  /**
   * GET /marketplace/themes - Get available themes
   */
  @Get('themes')
  getAvailableThemes() {
    return this.marketplaceService.getAvailableThemes();
  }
}
