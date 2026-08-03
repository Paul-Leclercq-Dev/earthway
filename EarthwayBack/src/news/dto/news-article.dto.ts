import { IsString, IsEnum, IsUrl, IsOptional, IsDate } from 'class-validator';
import { NewsTheme } from '@prisma/client';

export class NewsArticleDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  content: string;

  @IsUrl()
  url: string;

  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  source: string;

  @IsString()
  @IsOptional()
  author?: string;

  @IsEnum(NewsTheme)
  theme: NewsTheme;

  @IsDate()
  publishedAt: Date;
}

export class NewsQueryDto {
  @IsOptional()
  @IsEnum(NewsTheme)
  theme?: NewsTheme;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
