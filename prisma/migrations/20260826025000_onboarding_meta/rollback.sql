DROP INDEX IF EXISTS "CanalMensageria_unidadeId_statusConexao_idx";
ALTER TABLE "CanalMensageria"
  DROP COLUMN IF EXISTS "sincronizadoEm",
  DROP COLUMN IF EXISTS "validadoEm",
  DROP COLUMN IF EXISTS "codigoErroConexao",
  DROP COLUMN IF EXISTS "statusConexao";
DROP TYPE IF EXISTS "StatusConexaoMensageria";
