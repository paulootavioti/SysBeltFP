DROP INDEX IF EXISTS "CanalMensageria_statusConexao_proximaRenovacaoEm_idx";
ALTER TABLE "CanalMensageria"
  DROP COLUMN IF EXISTS "tokenVersao",
  DROP COLUMN IF EXISTS "ultimoDiagnosticoEm",
  DROP COLUMN IF EXISTS "proximaRenovacaoEm",
  DROP COLUMN IF EXISTS "tokenExpiraEm";
