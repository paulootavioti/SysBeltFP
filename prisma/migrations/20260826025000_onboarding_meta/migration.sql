CREATE TYPE "StatusConexaoMensageria" AS ENUM ('PENDENTE', 'VALIDANDO', 'CONECTADO', 'ERRO', 'INATIVO');

ALTER TABLE "CanalMensageria"
  ADD COLUMN "statusConexao" "StatusConexaoMensageria" NOT NULL DEFAULT 'PENDENTE',
  ADD COLUMN "codigoErroConexao" TEXT,
  ADD COLUMN "validadoEm" TIMESTAMP(3),
  ADD COLUMN "sincronizadoEm" TIMESTAMP(3);

UPDATE "CanalMensageria"
SET "statusConexao" = CASE WHEN "ativo" THEN 'CONECTADO'::"StatusConexaoMensageria" ELSE 'INATIVO'::"StatusConexaoMensageria" END,
    "validadoEm" = CASE WHEN "ativo" THEN "atualizadoEm" ELSE NULL END,
    "sincronizadoEm" = CASE WHEN "ativo" THEN "atualizadoEm" ELSE NULL END;

CREATE INDEX "CanalMensageria_unidadeId_statusConexao_idx" ON "CanalMensageria"("unidadeId", "statusConexao");
