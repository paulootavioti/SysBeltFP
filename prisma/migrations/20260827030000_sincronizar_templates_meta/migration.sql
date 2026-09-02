ALTER TABLE "CanalMensageria" ADD COLUMN "businessAccountId" TEXT;

ALTER TABLE "TemplateMensageria"
  ADD COLUMN "identificadorMeta" TEXT,
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'LOCAL',
  ADD COLUMN "categoria" TEXT,
  ADD COLUMN "componentes" JSONB,
  ADD COLUMN "quantidadeParametros" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "suportado" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "sincronizadoEm" TIMESTAMP(3);

CREATE UNIQUE INDEX "TemplateMensageria_canalMensageriaId_identificadorMeta_key"
  ON "TemplateMensageria"("canalMensageriaId", "identificadorMeta");
