ALTER TABLE "MensagemMensageria"
  ADD COLUMN "mediaExternaId" TEXT,
  ADD COLUMN "mediaUrlOrigem" TEXT,
  ADD COLUMN "mediaStatus" TEXT,
  ADD COLUMN "arquivoUrl" TEXT,
  ADD COLUMN "arquivoMime" TEXT,
  ADD COLUMN "arquivoNome" TEXT,
  ADD COLUMN "arquivoTamanho" INTEGER,
  ADD COLUMN "erroMedia" TEXT;
ALTER TABLE "MensagemMensageria"
  ADD COLUMN "tentativasMedia" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "proximaTentativaMediaEm" TIMESTAMP(3);

CREATE INDEX "MensagemMensageria_mediaStatus_proximaTentativaMediaEm_criadoEm_idx"
  ON "MensagemMensageria"("mediaStatus", "proximaTentativaMediaEm", "criadoEm");
