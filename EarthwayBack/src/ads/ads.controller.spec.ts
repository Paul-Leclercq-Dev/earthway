import { Test, TestingModule } from '@nestjs/testing';
import { AdsController } from './ads.controller';
import { AdsService } from './ads.service';
import { HttpStatus } from '@nestjs/common';

describe('AdsController', () => {
  let controller: AdsController;
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdsController],
      providers: [
        {
          provide: AdsService,
          useValue: {
            getAdForPlacement: jest.fn(),
            createEvent: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(AdsController);
    service = module.get(AdsService);
  });

  it('returns 204 when no ad is available or ads are hidden', async () => {
    service.getAdForPlacement.mockResolvedValue(null);
    const res: any = {
      status: jest.fn().mockReturnThis(),
    };

    const result = await controller.getAd({ placement: 'home_hero' } as any, {} as any, res);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.NO_CONTENT);
    expect(result).toBeUndefined();
  });
});
