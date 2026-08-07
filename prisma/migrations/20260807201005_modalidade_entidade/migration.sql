-- Modalidade deixa de ser texto solto no Currículo e vira entidade.
--
-- A ordem aqui importa: a coluna `Curriculo.modalidade` só pode cair
-- DEPOIS que o conteúdo dela virar linha em `Modalidade`. O SQL que o
-- Prisma gera sozinho dropa a coluna primeiro e perderia o dado.

-- 1) tabela nova
CREATE TABLE "Modalidade" (
    "id" SERIAL NOT NULL,
    "unidadeId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "publicoAlvo" TEXT,
    "coordenadorId" INTEGER,
    "visivelNaLanding" BOOLEAN NOT NULL DEFAULT false,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Modalidade_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Modalidade_unidadeId_nome_key" ON "Modalidade"("unidadeId", "nome");

ALTER TABLE "Modalidade" ADD CONSTRAINT "Modalidade_unidadeId_fkey"
  FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Modalidade" ADD CONSTRAINT "Modalidade_coordenadorId_fkey"
  FOREIGN KEY ("coordenadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 2) colunas de vínculo (ainda vazias)
ALTER TABLE "Curriculo" ADD COLUMN "modalidadeId" INTEGER;
ALTER TABLE "Turma"     ADD COLUMN "modalidadeId" INTEGER;

-- 3) BACKFILL: cada par (unidade, modalidade) que existia como texto nos
--    currículos vira uma linha. TRIM/NULLIF evita criar uma modalidade
--    vazia se algum currículo tiver string em branco.
INSERT INTO "Modalidade" ("unidadeId", "nome")
SELECT DISTINCT "unidadeId", TRIM("modalidade")
FROM "Curriculo"
WHERE NULLIF(TRIM("modalidade"), '') IS NOT NULL
ON CONFLICT ("unidadeId", "nome") DO NOTHING;

-- 4) currículos apontam pra sua modalidade
UPDATE "Curriculo" c
SET "modalidadeId" = m."id"
FROM "Modalidade" m
WHERE m."unidadeId" = c."unidadeId"
  AND m."nome" = TRIM(c."modalidade");

-- 5) turmas herdam a modalidade do currículo que já seguem. Turma sem
--    currículo fica sem modalidade — é informação que ninguém tem hoje e
--    inventar um padrão seria pior que deixar em branco pra academia
--    preencher.
UPDATE "Turma" t
SET "modalidadeId" = c."modalidadeId"
FROM "Curriculo" c
WHERE c."id" = t."curriculoId"
  AND c."modalidadeId" IS NOT NULL;

-- 6) agora sim a coluna antiga pode cair
ALTER TABLE "Curriculo" DROP COLUMN "modalidade";

-- 7) chaves estrangeiras
ALTER TABLE "Curriculo" ADD CONSTRAINT "Curriculo_modalidadeId_fkey"
  FOREIGN KEY ("modalidadeId") REFERENCES "Modalidade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Turma" ADD CONSTRAINT "Turma_modalidadeId_fkey"
  FOREIGN KEY ("modalidadeId") REFERENCES "Modalidade"("id") ON DELETE SET NULL ON UPDATE CASCADE;
