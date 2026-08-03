import { IsEnum, IsNumber, IsOptional, IsInt, Min } from 'class-validator';

export enum DonationCauseDto {
  trees = 'trees',
  corals = 'corals',
  pollinators = 'pollinators',
  general = 'general',
}

export class CreateDonationDto {
  @IsNumber()
  @Min(100) // 1€ minimum (in cents)
  amount: number; // in cents

  @IsEnum(DonationCauseDto, { message: 'cause must be trees, corals, pollinators or general' })
  cause: DonationCauseDto;

  @IsOptional()
  @IsInt()
  ongId?: number;
}
