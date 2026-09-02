DROP TABLE IF EXISTS "TemplateMensageria";
DROP INDEX IF EXISTS "MensagemMensageria_statusEntrega_proximaTentativaEm_criadoEm_idx";
ALTER TABLE "MensagemMensageria"
  DROP COLUMN IF EXISTS "proximaTentativaEm",
  DROP COLUMN IF EXISTS "tentativasEnvio";
