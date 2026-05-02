-- Patch Hybrid V5 trial fingerprint lock.
-- Migration 0012 created the current Prisma table as "PaymentFingerprint".
-- Keep targeting that existing table name to avoid drift.

ALTER TABLE "PaymentFingerprint"
  ADD COLUMN "usedFor" TEXT NOT NULL DEFAULT 'trial';

ALTER TABLE "PaymentFingerprint"
  ADD CONSTRAINT "PaymentFingerprint_usedFor_check"
  CHECK ("usedFor" = 'trial');

-- Enforce write-once behavior at DB level: fingerprint locks should never be
-- updated or deleted, even if the related user is deleted later.
CREATE OR REPLACE FUNCTION "prevent_payment_fingerprint_mutation"()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'PaymentFingerprint rows are write-once and cannot be updated or deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "PaymentFingerprint_prevent_update"
BEFORE UPDATE ON "PaymentFingerprint"
FOR EACH ROW EXECUTE FUNCTION "prevent_payment_fingerprint_mutation"();

CREATE TRIGGER "PaymentFingerprint_prevent_delete"
BEFORE DELETE ON "PaymentFingerprint"
FOR EACH ROW EXECUTE FUNCTION "prevent_payment_fingerprint_mutation"();
