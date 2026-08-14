import { IsEnum, IsString } from 'class-validator';

export enum SubscriptionTierDto {
  basic = 'basic',
  premium = 'premium',
  vip = 'vip',
}

export class CreateSubscriptionDto {
  @IsEnum(SubscriptionTierDto, { message: 'tier must be basic, premium or vip' })
  tier: SubscriptionTierDto;

  @IsString()
  stripePriceId: string;
}

export class UpdateSubscriptionTierDto {
  @IsEnum(SubscriptionTierDto, { message: 'tier must be basic, premium or vip' })
  tier: SubscriptionTierDto;
}
