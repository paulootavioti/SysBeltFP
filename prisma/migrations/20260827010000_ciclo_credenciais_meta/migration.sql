ALTER TABLE "CanalMensageria"
  ADD COLUMN "tokenExpiraEm" TIMESTAMP(3),
  ADD COLUMN "proximaRenovacaoEm" TIMESTAMP(3),
  ADD COLUMN "ultimoDiagnosticoEm" TIMESTAMP(3),
  ADD COLUMN "tokenVersao" INTEGER NOT NULL DEFAULT 1;

CREATE INDEX "CanalMensageria_statusConexao_proximaRenovacaoEm_idx"
  ON "CanalMensageria"("statusConexao", "proximaRenovacaoEm");
