ALTER TABLE "Conta"
  ADD COLUMN "tenantKey" UUID;

UPDATE "Conta"
SET "tenantKey" = gen_random_uuid()
WHERE "tenantKey" IS NULL;

ALTER TABLE "Conta"
  ALTER COLUMN "tenantKey" SET NOT NULL,
  ALTER COLUMN "tenantKey" SET DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX "Conta_tenantKey_key" ON "Conta"("tenantKey");

ALTER TABLE "ConcessaoPlataforma"
  ADD COLUMN "contaId" INTEGER;

UPDATE "Conta" c
SET "tenantKey" = cp."tenantKey"
FROM "ConcessaoPlataforma" cp
WHERE cp.id = 1
  AND (SELECT COUNT(*) FROM "Conta") = 1;

UPDATE "ConcessaoPlataforma" cp
SET "contaId" = c.id
FROM "Conta" c
WHERE c."tenantKey" = cp."tenantKey";

DELETE FROM "ConcessaoPlataforma"
WHERE "contaId" IS NULL;

ALTER TABLE "ConcessaoPlataforma"
  ALTER COLUMN "contaId" SET NOT NULL;

ALTER TABLE "ConcessaoPlataforma"
  DROP CONSTRAINT IF EXISTS "ConcessaoPlataforma_singleton_check";

CREATE UNIQUE INDEX "ConcessaoPlataforma_contaId_key"
  ON "ConcessaoPlataforma"("contaId");

ALTER TABLE "ConcessaoPlataforma"
  ADD CONSTRAINT "ConcessaoPlataforma_contaId_fkey"
  FOREIGN KEY ("contaId") REFERENCES "Conta"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
