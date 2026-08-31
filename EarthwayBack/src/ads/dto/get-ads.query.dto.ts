import { IsNotEmpty, IsString } from 'class-validator';

export class GetAdsQueryDto {
  @IsString()
  @IsNotEmpty()
  placement!: string;
}
