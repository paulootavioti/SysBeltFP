CREATE TYPE "StatusImportacaoAlunos" AS ENUM ('CONFIRMADA', 'DESFEITA');

CREATE TABLE "ImportacaoAlunos" (
  "id" SERIAL NOT NULL,
  "unidadeId" INTEGER NOT NULL,
  "nomeArquivo" TEXT NOT NULL,
  "hashArquivo" TEXT NOT NULL,
  "totalLinhas" INTEGER NOT NULL,
  "totalCriados" INTEGER NOT NULL,
  "totalAtualizados" INTEGER NOT NULL DEFAULT 0,
  "totalIgnorados" INTEGER NOT NULL DEFAULT 0,
  "status" "StatusImportacaoAlunos" NOT NULL DEFAULT 'CONFIRMADA',
  "desfazivelAte" TIMESTAMP(3) NOT NULL,
  "desfeitaEm" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ImportacaoAlunos_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Aluno" ADD COLUMN "importacaoLoteId" INTEGER;
ALTER TABLE "ImportacaoAlunos" ADD CONSTRAINT "ImportacaoAlunos_unidadeId_fkey"
  FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Aluno" ADD CONSTRAINT "Aluno_importacaoLoteId_fkey"
  FOREIGN KEY ("importacaoLoteId") REFERENCES "ImportacaoAlunos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "ImportacaoAlunos_unidadeId_createdAt_idx" ON "ImportacaoAlunos"("unidadeId", "createdAt");
