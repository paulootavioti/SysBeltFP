ALTER TABLE "Consentimento" DROP COLUMN IF EXISTS "textoAceito";
-- PostgreSQL não remove valores de enum de forma segura; TRATAMENTO_DADOS
-- permanece inerte após o rollback da coluna.
