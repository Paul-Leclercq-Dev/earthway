-- CreateTable
CREATE TABLE "ad" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "placement" TEXT NOT NULL,
    "partner" TEXT,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ad_event" (
    "id" SERIAL NOT NULL,
    "adId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "userId" INTEGER,
    "ipHash" TEXT,
    "referrer" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ad_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ad_placement_idx" ON "ad"("placement");

-- CreateIndex
CREATE INDEX "ad_isActive_idx" ON "ad"("isActive");

-- CreateIndex
CREATE INDEX "ad_event_adId_idx" ON "ad_event"("adId");

-- CreateIndex
CREATE INDEX "ad_event_createdAt_idx" ON "ad_event"("createdAt");

-- AddForeignKey
ALTER TABLE "ad_event" ADD CONSTRAINT "ad_event_adId_fkey" FOREIGN KEY ("adId") REFERENCES "ad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
