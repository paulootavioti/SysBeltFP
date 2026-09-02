DROP INDEX IF EXISTS "MensagemMensageria_mediaStatus_proximaTentativaMediaEm_criadoEm_idx";
ALTER TABLE "MensagemMensageria"
  DROP COLUMN IF EXISTS "erroMedia",
  DROP COLUMN IF EXISTS "proximaTentativaMediaEm",
  DROP COLUMN IF EXISTS "tentativasMedia",
  DROP COLUMN IF EXISTS "arquivoTamanho",
  DROP COLUMN IF EXISTS "arquivoNome",
  DROP COLUMN IF EXISTS "arquivoMime",
  DROP COLUMN IF EXISTS "arquivoUrl",
  DROP COLUMN IF EXISTS "mediaStatus",
  DROP COLUMN IF EXISTS "mediaUrlOrigem",
  DROP COLUMN IF EXISTS "mediaExternaId";
