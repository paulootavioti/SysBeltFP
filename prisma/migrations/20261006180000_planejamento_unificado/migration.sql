-- A modalidade local pode apontar para a modalidade equivalente na biblioteca
-- global. A associação é opt-in e mantém modalidades internas sem catálogo.
ALTER TABLE "Modalidade" ADD COLUMN "bibliotecaModalidadeId" INTEGER;

ALTER TABLE "AulaCurriculo"
  ADD COLUMN "templatePlanejamentoId" INTEGER,
  ADD COLUMN "templateAplicadoEm" TIMESTAMP(3);

ALTER TABLE "TemplatePlanejamento" ADD COLUMN "versao" INTEGER NOT NULL DEFAULT 1;

CREATE INDEX "Modalidade_bibliotecaModalidadeId_idx" ON "Modalidade"("bibliotecaModalidadeId");

ALTER TABLE "Modalidade"
  ADD CONSTRAINT "Modalidade_bibliotecaModalidadeId_fkey"
  FOREIGN KEY ("bibliotecaModalidadeId") REFERENCES "BibliotecaModalidade"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AulaCurriculo"
  ADD CONSTRAINT "AulaCurriculo_templatePlanejamentoId_fkey"
  FOREIGN KEY ("templatePlanejamentoId") REFERENCES "TemplatePlanejamento"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Associação inicial apenas quando o nome coincidir exatamente. Casos como
-- "Jiu-Jitsu" e "Jiu-Jitsu Brasileiro" permanecem para mapeamento explícito.
UPDATE "Modalidade" AS local
SET "bibliotecaModalidadeId" = global.id
FROM "BibliotecaModalidade" AS global
WHERE LOWER(TRIM(local.nome)) = LOWER(TRIM(global.nome));
