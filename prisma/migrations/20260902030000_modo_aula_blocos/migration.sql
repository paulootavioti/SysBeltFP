CREATE TYPE "TipoBlocoAulaCurriculo" AS ENUM (
  'AQUECIMENTO', 'JOGO', 'TECNICA', 'SPARRING', 'PAUSA', 'ALONGAMENTO'
);

CREATE TYPE "StatusExecucaoBlocoAula" AS ENUM ('CUMPRIDO', 'PULADO');

ALTER TABLE "TecnicaCurriculo"
ADD COLUMN "duracaoPrevistaSegundos" INTEGER NOT NULL DEFAULT 600;

CREATE TABLE "BlocoAulaCurriculo" (
  "id" SERIAL NOT NULL,
  "aulaCurriculoId" INTEGER NOT NULL,
  "tipo" "TipoBlocoAulaCurriculo" NOT NULL,
  "nome" TEXT NOT NULL,
  "ordem" INTEGER NOT NULL DEFAULT 0,
  "duracaoPrevistaSegundos" INTEGER NOT NULL,
  "rounds" INTEGER,
  "duracaoRoundSegundos" INTEGER,
  "descansoSegundos" INTEGER,
  "anuncio" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BlocoAulaCurriculo_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExecucaoBlocoAula" (
  "id" SERIAL NOT NULL,
  "aulaId" INTEGER NOT NULL,
  "chaveBloco" TEXT NOT NULL,
  "tipo" "TipoBlocoAulaCurriculo" NOT NULL,
  "nome" TEXT NOT NULL,
  "ordem" INTEGER NOT NULL,
  "duracaoPrevistaSegundos" INTEGER NOT NULL,
  "duracaoRealSegundos" INTEGER NOT NULL,
  "status" "StatusExecucaoBlocoAula" NOT NULL,
  "iniciadoEm" TIMESTAMP(3) NOT NULL,
  "finalizadoEm" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExecucaoBlocoAula_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BlocoAulaCurriculo_aulaCurriculoId_ordem_idx"
ON "BlocoAulaCurriculo"("aulaCurriculoId", "ordem");

CREATE UNIQUE INDEX "ExecucaoBlocoAula_aulaId_chaveBloco_key"
ON "ExecucaoBlocoAula"("aulaId", "chaveBloco");

CREATE INDEX "ExecucaoBlocoAula_aulaId_ordem_idx"
ON "ExecucaoBlocoAula"("aulaId", "ordem");

ALTER TABLE "BlocoAulaCurriculo"
ADD CONSTRAINT "BlocoAulaCurriculo_aulaCurriculoId_fkey"
FOREIGN KEY ("aulaCurriculoId") REFERENCES "AulaCurriculo"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExecucaoBlocoAula"
ADD CONSTRAINT "ExecucaoBlocoAula_aulaId_fkey"
FOREIGN KEY ("aulaId") REFERENCES "Aula"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
