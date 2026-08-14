/*
  Warnings:

  - Changed the type of `payload` on the `webhook_log` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('basic', 'premium', 'vip');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'canceled', 'past_due', 'incomplete');

-- CreateEnum
CREATE TYPE "DonationCause" AS ENUM ('trees', 'corals', 'pollinators', 'general');

-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('succeeded', 'pending', 'failed');

-- CreateEnum
CREATE TYPE "SupportType" AS ENUM ('DONATION', 'SUBSCRIPTION');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "NewsTheme" AS ENUM ('reforestation', 'oceans', 'pollinators', 'innovations', 'general');

-- CreateEnum
CREATE TYPE "ProductTheme" AS ENUM ('reforestation', 'oceans', 'zero_waste', 'renewable_energy');

-- CreateEnum
CREATE TYPE "AffiliateNetwork" AS ENUM ('shareasale', 'awin', 'affilizz', 'amazon', 'direct');

-- AlterTable
ALTER TABLE "webhook_log" ALTER COLUMN "status" SET DEFAULT 'received',
DROP COLUMN "payload",
ADD COLUMN     "payload" JSONB NOT NULL;

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "password" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "oauthProvider" TEXT,
    "oauthId" TEXT,
    "photoUrl" TEXT,
    "refreshToken" TEXT,
    "subscriptionId" INTEGER,
    "subscriptionStart" TIMESTAMP(3),
    "subscriptionEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "duration" INTEGER NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "tier" "SubscriptionTier",
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "ongId" INTEGER NOT NULL,
    "type" "SupportType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "subscriptionId" INTEGER,

    CONSTRAINT "support_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donation" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "ongId" INTEGER NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "stripePaymentIntentId" TEXT,
    "cause" "DonationCause" NOT NULL DEFAULT 'general',
    "status" "DonationStatus" NOT NULL DEFAULT 'pending',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ong" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "ong_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "publicationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "link" TEXT,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" SERIAL NOT NULL,
    "type" "MediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "marketplace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "article_market" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "image" TEXT,
    "video" TEXT,
    "price" DECIMAL(65,30) NOT NULL,
    "trackedLink" TEXT NOT NULL,
    "marketplaceId" INTEGER NOT NULL,

    CONSTRAINT "article_market_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_article" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author" TEXT,
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "imageUrl" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "theme" "NewsTheme" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "impact" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "treesFinanced" INTEGER NOT NULL DEFAULT 0,
    "coralsRestored" INTEGER NOT NULL DEFAULT 0,
    "pollinatorsProtected" INTEGER NOT NULL DEFAULT 0,
    "totalContributionEur" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "impact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_preference" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "newsletter" BOOLEAN NOT NULL DEFAULT true,
    "impact" BOOLEAN NOT NULL DEFAULT true,
    "confirmations" BOOLEAN NOT NULL DEFAULT true,
    "marketing" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_preference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "imageUrl" TEXT NOT NULL,
    "affiliateUrl" TEXT NOT NULL,
    "theme" "ProductTheme" NOT NULL,
    "brandName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliate_link" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "productId" INTEGER,
    "network" "AffiliateNetwork" NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "trackingParams" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliate_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affiliate_click_log" (
    "id" SERIAL NOT NULL,
    "affiliateLinkId" INTEGER NOT NULL,
    "userId" INTEGER,
    "ipHash" TEXT,
    "referrer" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "affiliate_click_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_subscriptionId_key" ON "user"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_stripeSubscriptionId_key" ON "subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "subscription_stripeSubscriptionId_idx" ON "subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "donation_stripePaymentIntentId_key" ON "donation"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "donation_stripePaymentIntentId_idx" ON "donation"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "donation_userId_idx" ON "donation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "news_article_sourceUrl_key" ON "news_article"("sourceUrl");

-- CreateIndex
CREATE INDEX "news_article_theme_idx" ON "news_article"("theme");

-- CreateIndex
CREATE INDEX "news_article_publishedAt_idx" ON "news_article"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "impact_userId_key" ON "impact"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "email_preference_userId_key" ON "email_preference"("userId");

-- CreateIndex
CREATE INDEX "product_theme_idx" ON "product"("theme");

-- CreateIndex
CREATE UNIQUE INDEX "affiliate_link_slug_key" ON "affiliate_link"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "affiliate_link_productId_key" ON "affiliate_link"("productId");

-- CreateIndex
CREATE INDEX "affiliate_click_log_affiliateLinkId_idx" ON "affiliate_click_log"("affiliateLinkId");

-- CreateIndex
CREATE INDEX "affiliate_click_log_createdAt_idx" ON "affiliate_click_log"("createdAt");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support" ADD CONSTRAINT "support_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support" ADD CONSTRAINT "support_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support" ADD CONSTRAINT "support_ongId_fkey" FOREIGN KEY ("ongId") REFERENCES "ong"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donation" ADD CONSTRAINT "donation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donation" ADD CONSTRAINT "donation_ongId_fkey" FOREIGN KEY ("ongId") REFERENCES "ong"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ong" ADD CONSTRAINT "ong_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article" ADD CONSTRAINT "article_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_market" ADD CONSTRAINT "article_market_marketplaceId_fkey" FOREIGN KEY ("marketplaceId") REFERENCES "marketplace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impact" ADD CONSTRAINT "impact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_preference" ADD CONSTRAINT "email_preference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_link" ADD CONSTRAINT "affiliate_link_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliate_click_log" ADD CONSTRAINT "affiliate_click_log_affiliateLinkId_fkey" FOREIGN KEY ("affiliateLinkId") REFERENCES "affiliate_link"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
