CREATE TYPE "StatusAcessoPlataforma" AS ENUM ('ATIVO', 'SUSPENSO', 'CANCELADO');

CREATE TABLE "ConcessaoPlataforma" (
  "id" INTEGER NOT NULL DEFAULT 1,
  "tenantKey" UUID NOT NULL,
  "statusAcesso" "StatusAcessoPlataforma" NOT NULL,
  "recursos" TEXT[],
  "versaoContrato" INTEGER NOT NULL,
  "revisao" INTEGER NOT NULL,
  "emitidaEm" TIMESTAMP(3) NOT NULL,
  "expiraEm" TIMESTAMP(3) NOT NULL,
  "sincronizadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "payloadHash" TEXT NOT NULL,
  "assinaturaBase64" TEXT NOT NULL,
  CONSTRAINT "ConcessaoPlataforma_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ConcessaoPlataforma_singleton_check" CHECK ("id" = 1),
  CONSTRAINT "ConcessaoPlataforma_versoes_check" CHECK ("versaoContrato" = 1 AND "revisao" > 0),
  CONSTRAINT "ConcessaoPlataforma_validade_check" CHECK ("expiraEm" > "emitidaEm")
);

CREATE UNIQUE INDEX "ConcessaoPlataforma_tenantKey_key" ON "ConcessaoPlataforma"("tenantKey");
