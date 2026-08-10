-- Align webhook_log table with Prisma model:
-- WebhookLog { id, eventId @unique, type, status, payload, createdAt }

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'webhook_log'
  ) THEN
    CREATE TABLE "webhook_log" (
      "id" SERIAL PRIMARY KEY,
      "eventId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'pending',
      "payload" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  ELSE
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'webhook_log'
        AND column_name = 'stripeEventId'
    ) THEN
      ALTER TABLE "webhook_log" RENAME COLUMN "stripeEventId" TO "eventId";
    END IF;

    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'webhook_log'
        AND column_name = 'eventType'
    ) THEN
      ALTER TABLE "webhook_log" RENAME COLUMN "eventType" TO "type";
    END IF;

    ALTER TABLE "webhook_log" ADD COLUMN IF NOT EXISTS "eventId" TEXT;
    ALTER TABLE "webhook_log" ADD COLUMN IF NOT EXISTS "type" TEXT;
    ALTER TABLE "webhook_log" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'pending';
    ALTER TABLE "webhook_log" ADD COLUMN IF NOT EXISTS "payload" TEXT;
    ALTER TABLE "webhook_log" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

ALTER TABLE "webhook_log" DROP COLUMN IF EXISTS "errorMessage";
ALTER TABLE "webhook_log" DROP COLUMN IF EXISTS "processedAt";

CREATE UNIQUE INDEX IF NOT EXISTS "webhook_log_eventId_key" ON "webhook_log"("eventId");
CREATE INDEX IF NOT EXISTS "webhook_log_eventId_idx" ON "webhook_log"("eventId");
CREATE INDEX IF NOT EXISTS "webhook_log_status_idx" ON "webhook_log"("status");
