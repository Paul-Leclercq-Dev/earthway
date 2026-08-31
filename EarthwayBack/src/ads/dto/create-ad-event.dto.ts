import { IsEnum } from 'class-validator';

export enum AdEventType {
  impression = 'impression',
  click = 'click',
}

export class CreateAdEventDto {
  @IsEnum(AdEventType)
  type!: AdEventType;
}
