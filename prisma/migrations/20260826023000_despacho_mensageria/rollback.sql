DROP INDEX IF EXISTS "MensagemMensageria_provedorMensagemId_idx";
ALTER TABLE "MensagemMensageria" DROP COLUMN IF EXISTS "erroEnvio", DROP COLUMN IF EXISTS "provedorMensagemId";
