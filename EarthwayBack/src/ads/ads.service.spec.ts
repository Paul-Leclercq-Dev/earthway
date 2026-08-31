import { Test, TestingModule } from '@nestjs/testing';
import { AdsService } from './ads.service';
import { PrismaService } from '../prisma/prisma.service';
import { EntitlementsService } from '../entitlements/entitlements.service';
import { AdEventType } from './dto/create-ad-event.dto';

describe('AdsService', () => {
  let service: AdsService;
  let prisma: any;
  let entitlementsService: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdsService,
        {
          provide: PrismaService,
          useValue: {
            ad: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
            },
            adEvent: {
              create: jest.fn(),
            },
          },
        },
        {
          provide: EntitlementsService,
          useValue: {
            resolveForUser: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(AdsService);
    prisma = module.get(PrismaService);
    entitlementsService = module.get(EntitlementsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('rotates ads with weighted selection', async () => {
    prisma.ad.findMany.mockResolvedValue([
      { id: 1, title: 'Low', imageUrl: 'a', targetUrl: 'a', partner: null, weight: 1 },
      { id: 2, title: 'High', imageUrl: 'b', targetUrl: 'b', partner: 'Partner', weight: 9 },
    ]);

    const randomSpy = jest.spyOn(Math, 'random');

    randomSpy.mockReturnValueOnce(0.05);
    await expect(service.getAdForPlacement('home_hero')).resolves.toEqual({
      id: 1,
      title: 'Low',
      imageUrl: 'a',
      targetUrl: 'a',
      partner: null,
    });

    randomSpy.mockReturnValueOnce(0.15);
    await expect(service.getAdForPlacement('home_hero')).resolves.toEqual({
      id: 2,
      title: 'High',
      imageUrl: 'b',
      targetUrl: 'b',
      partner: 'Partner',
    });

    randomSpy.mockRestore();
  });

  it('returns null when user has ads_free entitlement', async () => {
    entitlementsService.resolveForUser.mockResolvedValue(['ads_free']);

    await expect(service.getAdForPlacement('news_feed', 1)).resolves.toBeNull();
    expect(prisma.ad.findMany).not.toHaveBeenCalled();
  });

  it('creates a tracked event only with consented analytics fields', async () => {
    prisma.ad.findUnique.mockResolvedValue({ id: 1 });
    prisma.adEvent.create.mockResolvedValue({ id: 10 });

    await service.createEvent(1, AdEventType.click, {
      userId: 5,
      analyticsConsent: false,
      ip: '127.0.0.1',
      referrer: 'https://example.com',
      userAgent: 'Mozilla/5.0',
    });

    expect(prisma.adEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          adId: 1,
          type: AdEventType.click,
          userId: 5,
          ipHash: null,
          referrer: null,
          userAgent: null,
        }),
      }),
    );
  });
});
