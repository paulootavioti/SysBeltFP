DROP INDEX IF EXISTS "TemplateMensageria_canalMensageriaId_identificadorMeta_key";
ALTER TABLE "TemplateMensageria"
  DROP COLUMN IF EXISTS "sincronizadoEm",
  DROP COLUMN IF EXISTS "quantidadeParametros",
  DROP COLUMN IF EXISTS "suportado",
  DROP COLUMN IF EXISTS "componentes",
  DROP COLUMN IF EXISTS "categoria",
  DROP COLUMN IF EXISTS "status",
  DROP COLUMN IF EXISTS "identificadorMeta";
ALTER TABLE "CanalMensageria" DROP COLUMN IF EXISTS "businessAccountId";
