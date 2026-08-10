-- Align webhook_log table with Prisma model:
-- WebhookLog { id, eventId @unique, type, status, payload, createdAt }

DO $$
BEGIN
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
END $$;

ALTER TABLE "webhook_log" DROP COLUMN IF EXISTS "errorMessage";
ALTER TABLE "webhook_log" DROP COLUMN IF EXISTS "processedAt";

CREATE UNIQUE INDEX IF NOT EXISTS "webhook_log_eventId_key" ON "webhook_log"("eventId");
CREATE INDEX IF NOT EXISTS "webhook_log_eventId_idx" ON "webhook_log"("eventId");
CREATE INDEX IF NOT EXISTS "webhook_log_status_idx" ON "webhook_log"("status");
