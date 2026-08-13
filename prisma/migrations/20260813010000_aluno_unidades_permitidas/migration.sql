CREATE TABLE "AlunoUnidade" (
  "alunoId" INTEGER NOT NULL,
  "unidadeId" INTEGER NOT NULL,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AlunoUnidade_pkey" PRIMARY KEY ("alunoId", "unidadeId")
);

CREATE INDEX "AlunoUnidade_unidadeId_alunoId_idx"
  ON "AlunoUnidade"("unidadeId", "alunoId");

ALTER TABLE "AlunoUnidade" ADD CONSTRAINT "AlunoUnidade_alunoId_fkey"
  FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AlunoUnidade" ADD CONSTRAINT "AlunoUnidade_unidadeId_fkey"
  FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Compatibilidade: cada aluno existente começa autorizado somente na unidade
-- principal que já consta em seu cadastro.
INSERT INTO "AlunoUnidade" ("alunoId", "unidadeId")
SELECT "id", "unidadeId" FROM "Aluno";
