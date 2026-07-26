-- Fase 1 do suporte a multi-unidade: cria Unidade e Sala, e adiciona
-- unidadeId em toda tabela hoje "global". Todo dado existente é migrado
-- para uma única Unidade ("Unidade Principal"), preservando o sistema
-- funcionando exatamente como antes. Renomeie essa unidade (ou promova seu
-- usuário a SUPERADMIN) depois de aplicar esta migration.
--
-- Isolamento de acesso por unidade (filtrar toda consulta) é a Fase 2,
-- ainda não implementada aqui — esta migration só prepara os dados.

CREATE TABLE "Unidade" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Unidade_pkey" PRIMARY KEY ("id")
);

INSERT INTO "Unidade" ("nome") VALUES ('Unidade Principal');

CREATE TABLE "Sala" (
    "id" SERIAL NOT NULL,
    "unidadeId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sala_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Sala" ADD CONSTRAINT "Sala_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Usuario.unidadeId é opcional (nulo = SUPERADMIN), mas todo usuário
-- existente pertence hoje à Unidade Principal.
ALTER TABLE "Usuario" ADD COLUMN "unidadeId" INTEGER;
UPDATE "Usuario" SET "unidadeId" = (SELECT "id" FROM "Unidade" LIMIT 1);
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Aluno" ADD COLUMN "unidadeId" INTEGER;
UPDATE "Aluno" SET "unidadeId" = (SELECT "id" FROM "Unidade" LIMIT 1);
ALTER TABLE "Aluno" ALTER COLUMN "unidadeId" SET NOT NULL;
ALTER TABLE "Aluno" ADD CONSTRAINT "Aluno_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Responsavel" ADD COLUMN "unidadeId" INTEGER;
UPDATE "Responsavel" SET "unidadeId" = (SELECT "id" FROM "Unidade" LIMIT 1);
ALTER TABLE "Responsavel" ALTER COLUMN "unidadeId" SET NOT NULL;
ALTER TABLE "Responsavel" ADD CONSTRAINT "Responsavel_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Turma" ADD COLUMN "unidadeId" INTEGER;
UPDATE "Turma" SET "unidadeId" = (SELECT "id" FROM "Unidade" LIMIT 1);
ALTER TABLE "Turma" ALTER COLUMN "unidadeId" SET NOT NULL;
ALTER TABLE "Turma" ADD CONSTRAINT "Turma_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- salaId fica nulo pra toda turma existente — atribuição de sala é Fase 3.
ALTER TABLE "Turma" ADD COLUMN "salaId" INTEGER;
ALTER TABLE "Turma" ADD CONSTRAINT "Turma_salaId_fkey" FOREIGN KEY ("salaId") REFERENCES "Sala"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Plano" ADD COLUMN "unidadeId" INTEGER;
UPDATE "Plano" SET "unidadeId" = (SELECT "id" FROM "Unidade" LIMIT 1);
ALTER TABLE "Plano" ALTER COLUMN "unidadeId" SET NOT NULL;
ALTER TABLE "Plano" ADD CONSTRAINT "Plano_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Aula" ADD COLUMN "unidadeId" INTEGER;
UPDATE "Aula" SET "unidadeId" = (SELECT "id" FROM "Unidade" LIMIT 1);
ALTER TABLE "Aula" ALTER COLUMN "unidadeId" SET NOT NULL;
ALTER TABLE "Aula" ADD CONSTRAINT "Aula_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Tecnica" ADD COLUMN "unidadeId" INTEGER;
UPDATE "Tecnica" SET "unidadeId" = (SELECT "id" FROM "Unidade" LIMIT 1);
ALTER TABLE "Tecnica" ALTER COLUMN "unidadeId" SET NOT NULL;
ALTER TABLE "Tecnica" ADD CONSTRAINT "Tecnica_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Curriculo" ADD COLUMN "unidadeId" INTEGER;
UPDATE "Curriculo" SET "unidadeId" = (SELECT "id" FROM "Unidade" LIMIT 1);
ALTER TABLE "Curriculo" ALTER COLUMN "unidadeId" SET NOT NULL;
ALTER TABLE "Curriculo" ADD CONSTRAINT "Curriculo_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Competicao" ADD COLUMN "unidadeId" INTEGER;
UPDATE "Competicao" SET "unidadeId" = (SELECT "id" FROM "Unidade" LIMIT 1);
ALTER TABLE "Competicao" ALTER COLUMN "unidadeId" SET NOT NULL;
ALTER TABLE "Competicao" ADD CONSTRAINT "Competicao_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Mensalidade" ADD COLUMN "unidadeId" INTEGER;
UPDATE "Mensalidade" SET "unidadeId" = (SELECT "id" FROM "Unidade" LIMIT 1);
ALTER TABLE "Mensalidade" ALTER COLUMN "unidadeId" SET NOT NULL;
ALTER TABLE "Mensalidade" ADD CONSTRAINT "Mensalidade_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Graduacao" ADD COLUMN "unidadeId" INTEGER;
UPDATE "Graduacao" SET "unidadeId" = (SELECT "id" FROM "Unidade" LIMIT 1);
ALTER TABLE "Graduacao" ALTER COLUMN "unidadeId" SET NOT NULL;
ALTER TABLE "Graduacao" ADD CONSTRAINT "Graduacao_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AulaProgramada" ADD COLUMN "unidadeId" INTEGER;
UPDATE "AulaProgramada" SET "unidadeId" = (SELECT "id" FROM "Unidade" LIMIT 1);
ALTER TABLE "AulaProgramada" ALTER COLUMN "unidadeId" SET NOT NULL;
ALTER TABLE "AulaProgramada" ADD CONSTRAINT "AulaProgramada_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
