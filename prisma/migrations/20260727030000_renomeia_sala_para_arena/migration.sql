-- Renomeia Sala -> Arena (só nomenclatura, sem mudança de dado): "arena" é
-- o termo que a academia usa pra qualquer sala/tatame/área onde as aulas
-- acontecem. RENAME preserva linhas, ids e a FK existente.

ALTER TABLE "Sala" RENAME TO "Arena";
ALTER TABLE "Arena" RENAME CONSTRAINT "Sala_pkey" TO "Arena_pkey";
ALTER TABLE "Arena" RENAME CONSTRAINT "Sala_unidadeId_fkey" TO "Arena_unidadeId_fkey";

ALTER TABLE "Turma" RENAME COLUMN "salaId" TO "arenaId";
ALTER TABLE "Turma" RENAME CONSTRAINT "Turma_salaId_fkey" TO "Turma_arenaId_fkey";
