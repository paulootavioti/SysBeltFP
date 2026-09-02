ALTER TABLE "MensagemMensageria"
  ADD COLUMN "tentativasEnvio" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "proximaTentativaEm" TIMESTAMP(3);

CREATE INDEX "MensagemMensageria_statusEntrega_proximaTentativaEm_criadoEm_idx"
  ON "MensagemMensageria"("statusEntrega", "proximaTentativaEm", "criadoEm");

CREATE TABLE "TemplateMensageria" (
  "id" SERIAL NOT NULL,
  "unidadeId" INTEGER NOT NULL,
  "canalMensageriaId" INTEGER NOT NULL,
  "nome" TEXT NOT NULL,
  "idioma" TEXT NOT NULL DEFAULT 'pt_BR',
  "textoExibicao" TEXT NOT NULL,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TemplateMensageria_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TemplateMensageria_canalMensageriaId_nome_idioma_key"
  ON "TemplateMensageria"("canalMensageriaId", "nome", "idioma");
CREATE INDEX "TemplateMensageria_unidadeId_ativo_idx"
  ON "TemplateMensageria"("unidadeId", "ativo");

ALTER TABLE "TemplateMensageria"
  ADD CONSTRAINT "TemplateMensageria_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "TemplateMensageria_canalMensageriaId_fkey" FOREIGN KEY ("canalMensageriaId") REFERENCES "CanalMensageria"("id") ON DELETE CASCADE ON UPDATE CASCADE;
