import { PrismaClient, NewsTheme, SubscriptionTier, SubscriptionStatus, DonationCause, DonationStatus, ProductTheme, AffiliateNetwork } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data (optional, for dev)
  await prisma.newsArticle.deleteMany();
  await prisma.donation.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.user.deleteMany();
  await prisma.articleMarket.deleteMany();
  await prisma.marketplace.deleteMany();
  await prisma.oNG.deleteMany();
  await prisma.category.deleteMany();

  // 1. Create Categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Reforestation',
        description: 'Initiatives de reforestation et protection des forêts',
        image: '/images/category-reforestation.jpg',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Océans',
        description: 'Protection des océans et restauration des coraux',
        image: '/images/category-oceans.jpg',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Pollinisateurs',
        description: 'Protection des abeilles et pollinisateurs',
        image: '/images/category-pollinators.jpg',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Innovations',
        description: 'Technologies et innovations environnementales',
        image: '/images/category-innovations.jpg',
      },
    }),
  ]);

  console.log('✅ Categories created');

  // 2. Create ONGs
  const ongs = await Promise.all([
    prisma.oNG.create({
      data: {
        name: 'Reforest\'Action',
        description: 'ONG de reforestation internationale',
        website: 'https://www.reforestaction.com',
        categoryId: categories[0].id,
      },
    }),
    prisma.oNG.create({
      data: {
        name: 'Coral Guardian',
        description: 'Restauration des récifs coralliens',
        website: 'https://www.coralguardian.org',
        categoryId: categories[1].id,
      },
    }),
    prisma.oNG.create({
      data: {
        name: 'Pollinator Partnership',
        description: 'Protection des pollinisateurs mondiaux',
        website: 'https://www.pollinator.org',
        categoryId: categories[2].id,
      },
    }),
  ]);

  console.log('✅ ONGs created');

  // 3. Create Users
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const users = await Promise.all([
    prisma.user.create({
      data: {
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean.dupont@example.com',
        password: hashedPassword,
        emailVerified: true,
        xp: 100,
        level: 2,
      },
    }),
    prisma.user.create({
      data: {
        firstName: 'Marie',
        lastName: 'Martin',
        email: 'marie.martin@example.com',
        password: hashedPassword,
        emailVerified: true,
        oauthProvider: 'google',
        oauthId: 'google-123456',
        photoUrl: 'https://lh3.googleusercontent.com/a/default-user',
        xp: 250,
        level: 3,
      },
    }),
  ]);

  console.log('✅ Users created');

  // 4. Create Subscriptions
  const subscriptions = await Promise.all([
    prisma.subscription.create({
      data: {
        name: 'Abonnement Basic',
        price: 9.99,
        duration: 30,
        tier: SubscriptionTier.basic,
        status: SubscriptionStatus.active,
      },
    }),
    prisma.subscription.create({
      data: {
        name: 'Abonnement Premium',
        price: 19.99,
        duration: 30,
        tier: SubscriptionTier.premium,
        status: SubscriptionStatus.active,
      },
    }),
    prisma.subscription.create({
      data: {
        name: 'Abonnement VIP',
        price: 49.99,
        duration: 30,
        tier: SubscriptionTier.vip,
        status: SubscriptionStatus.active,
      },
    }),
  ]);

  console.log('✅ Subscriptions created');

  // 5. Create Donations
  await Promise.all([
    prisma.donation.create({
      data: {
        userId: users[0].id,
        ongId: ongs[0].id,
        amount: 50,
        cause: DonationCause.trees,
        status: DonationStatus.succeeded,
      },
    }),
    prisma.donation.create({
      data: {
        userId: users[1].id,
        ongId: ongs[1].id,
        amount: 30,
        cause: DonationCause.corals,
        status: DonationStatus.succeeded,
      },
    }),
  ]);

  console.log('✅ Donations created');

  // 6. Create News Articles
  const newsArticles = [
    {
      title: 'La déforestation en Amazonie atteint un niveau record',
      summary: 'Les données satellitaires montrent une augmentation alarmante de la déforestation.',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      author: 'BBC Environment',
      source: 'BBC',
      sourceUrl: 'https://www.bbc.com/news/science-environment',
      imageUrl: 'https://picsum.photos/800/450?random=1',
      publishedAt: new Date('2025-12-01'),
      theme: NewsTheme.reforestation,
    },
    {
      title: 'Les coraux de la Grande Barrière montrent des signes de récupération',
      summary: 'Après des années de blanchiment, certaines zones commencent à se régénérer.',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam.',
      author: 'The Guardian',
      source: 'The Guardian',
      sourceUrl: 'https://www.theguardian.com/environment/oceans',
      imageUrl: 'https://picsum.photos/800/450?random=2',
      publishedAt: new Date('2025-12-02'),
      theme: NewsTheme.oceans,
    },
    {
      title: 'Les populations d\'abeilles en déclin dans toute l\'Europe',
      summary: 'Une étude révèle une diminution de 30% des colonies d\'abeilles domestiques.',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis aute irure dolor.',
      author: 'National Geographic',
      source: 'National Geographic',
      sourceUrl: 'https://www.nationalgeographic.com/animals/invertebrates/facts/honey-bee',
      imageUrl: 'https://picsum.photos/800/450?random=3',
      publishedAt: new Date('2025-12-03'),
      theme: NewsTheme.pollinators,
    },
    {
      title: 'Nouvelle technologie de capture de CO2 prometteuse',
      summary: 'Des chercheurs développent un système efficace et économique.',
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Excepteur sint occaecat.',
      author: 'MIT Technology Review',
      source: 'MIT',
      sourceUrl: 'https://www.technologyreview.com/topic/climate-change/',
      imageUrl: 'https://picsum.photos/800/450?random=4',
      publishedAt: new Date('2025-12-04'),
      theme: NewsTheme.innovations,
    },
  ];

  await Promise.all(
    newsArticles.map((article) => prisma.newsArticle.create({ data: article }))
  );

  console.log('✅ News articles created');

  // 7. Create Marketplace & Products
  const marketplace = await prisma.marketplace.create({
    data: {
      name: 'EcoShop',
      url: 'https://ecoshop.example.com',
    },
  });

  const products = [
    {
      title: 'Gourde réutilisable en inox',
      content: 'Gourde isotherme 500ml, sans BPA',
      image: 'https://picsum.photos/400/400?random=10',
      price: 24.99,
      trackedLink: 'https://ecoshop.example.com/gourde?ref=earthway',
      marketplaceId: marketplace.id,
    },
    {
      title: 'Kit de démarrage zéro déchet',
      content: 'Sacs réutilisables, brosse à dents bambou, savon solide',
      image: 'https://picsum.photos/400/400?random=11',
      price: 39.99,
      trackedLink: 'https://ecoshop.example.com/kit-zero-dechet?ref=earthway',
      marketplaceId: marketplace.id,
    },
  ];

  await Promise.all(
    products.map((product) => prisma.articleMarket.create({ data: product }))
  );

  console.log('✅ Marketplace products created');

  // 8. Create Products (new marketplace)
  const newProducts = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Gourde réutilisable en inox',
        description: 'Gourde isotherme 500ml, sans BPA, garde vos boissons chaudes 12h et froides 24h',
        price: 24.99,
        currency: 'EUR',
        imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400',
        affiliateUrl: 'https://www.amazon.fr/s?k=gourde+inox+isotherme+500ml',
        theme: ProductTheme.zero_waste,
        brandName: 'EcoBottle',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Kit de plantation d\'arbres',
        description: '10 graines d\'arbres natifs avec guide de plantation et pots biodégradables',
        price: 15.00,
        currency: 'EUR',
        imageUrl: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=400',
        affiliateUrl: 'https://www.amazon.fr/s?k=kit+graines+arbres+plantation',
        theme: ProductTheme.reforestation,
        brandName: 'TreeStarter',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Panneau solaire portable 100W',
        description: 'Chargeur solaire pliable pour camping et randonnée, compatible USB-C',
        price: 89.99,
        currency: 'EUR',
        imageUrl: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400',
        affiliateUrl: 'https://www.amazon.fr/s?k=panneau+solaire+portable+camping+usb',
        theme: ProductTheme.renewable_energy,
        brandName: 'SolarTech',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Kit protection des océans',
        description: 'Sac de plage en filet recyclé + bracelet corail + guide écologique',
        price: 34.99,
        currency: 'EUR',
        imageUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400',
        affiliateUrl: 'https://www.amazon.fr/s?k=sac+filet+recycle+plage+ocean',
        theme: ProductTheme.oceans,
        brandName: 'OceanGuard',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Composteur d\'appartement',
        description: 'Composteur compact sans odeur, idéal pour recycler vos déchets organiques',
        price: 49.99,
        currency: 'EUR',
        imageUrl: 'https://images.unsplash.com/photo-1591276006580-22e79e4035d4?w=400',
        affiliateUrl: 'https://www.amazon.fr/s?k=composteur+appartement+sans+odeur',
        theme: ProductTheme.zero_waste,
        brandName: 'CompostPro',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Hôtel à insectes premium',
        description: 'Abri en bois naturel pour abeilles et pollinisateurs, montage facile',
        price: 27.50,
        currency: 'EUR',
        imageUrl: 'https://images.unsplash.com/photo-1563564527-6c7d2b8d87aa?w=400',
        affiliateUrl: 'https://www.amazon.fr/s?k=hotel+insectes+bois+abeilles+pollinisateurs',
        theme: ProductTheme.zero_waste,
        brandName: 'BeeHome',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Lampe solaire de jardin',
        description: 'Éclairage LED solaire étanche, autonomie 8h, détecteur crépusculaire',
        price: 19.99,
        currency: 'EUR',
        imageUrl: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400',
        affiliateUrl: 'https://www.amazon.fr/s?k=lampe+solaire+jardin+LED+etanche',
        theme: ProductTheme.renewable_energy,
        brandName: 'SolarLight',
      },
    }),
    prisma.product.create({
      data: {
        name: 'Sac à dos en plastique recyclé',
        description: 'Sac à dos 20L fabriqué à partir de bouteilles plastiques recyclées d\'océan',
        price: 59.99,
        currency: 'EUR',
        imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
        affiliateUrl: 'https://www.amazon.fr/s?k=sac+dos+plastique+recycle+ocean',
        theme: ProductTheme.oceans,
        brandName: 'OceanPack',
      },
    }),
  ]);

  console.log('✅ Products created');

  // 10. Create AffiliateLinks for products (Phase 16: Deep Linking)
  await prisma.affiliateClickLog.deleteMany();
  await prisma.affiliateLink.deleteMany();

  await Promise.all([
    prisma.affiliateLink.create({
      data: {
        slug: 'gourde-bambou',
        productId: newProducts[0].id,
        network: AffiliateNetwork.shareasale,
        baseUrl: 'https://www.amazon.fr/s?k=gourde+inox+isotherme+500ml',
        trackingParams: JSON.stringify({ afftrack: 'earthway', siteID: 'VOTRE_SITE_ID' }),
        isActive: true,
      },
    }),
    prisma.affiliateLink.create({
      data: {
        slug: 'kit-graines-arbre',
        productId: newProducts[1].id,
        network: AffiliateNetwork.awin,
        baseUrl: 'https://www.amazon.fr/s?k=kit+graines+arbres+plantation',
        trackingParams: JSON.stringify({ awinmid: 'VOTRE_AWINMID', awinaffid: 'VOTRE_AWINAFFID', clickref: 'earthway' }),
        isActive: true,
      },
    }),
    prisma.affiliateLink.create({
      data: {
        slug: 'chargeur-solaire',
        productId: newProducts[2].id,
        network: AffiliateNetwork.amazon,
        baseUrl: 'https://www.amazon.fr/s?k=panneau+solaire+portable+camping+usb',
        trackingParams: JSON.stringify({ tag: 'VOTRE_TAG_AMAZON-21' }),
        isActive: true,
      },
    }),
    prisma.affiliateLink.create({
      data: {
        slug: 'sac-ocean-recycled',
        productId: newProducts[newProducts.length - 1].id,
        network: AffiliateNetwork.affilizz,
        baseUrl: 'https://www.amazon.fr/s?k=sac+dos+plastique+recycle+ocean',
        trackingParams: JSON.stringify({ utm_source: 'earthway', utm_medium: 'affiliate', utm_campaign: 'marketplace' }),
        isActive: true,
      },
    }),
    prisma.affiliateLink.create({
      data: {
        slug: 'hotel-insectes',
        network: AffiliateNetwork.direct,
        baseUrl: 'https://www.amazon.fr/s?k=hotel+insectes+bois+abeilles',
        trackingParams: JSON.stringify({ ref: 'earthway' }),
        isActive: true,
      },
    }),
  ]);

  console.log('✅ Affiliate links created');

  // 9. Create Impact records for users
  await Promise.all([
    prisma.impact.create({
      data: {
        userId: users[0].id,
        treesFinanced: 10,
        coralsRestored: 0,
        pollinatorsProtected: 0,
        totalContributionEur: 50,
      },
    }),
    prisma.impact.create({
      data: {
        userId: users[1].id,
        treesFinanced: 0,
        coralsRestored: 2,
        pollinatorsProtected: 0,
        totalContributionEur: 30,
      },
    }),
  ]);

  console.log('✅ Impact records created');

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
