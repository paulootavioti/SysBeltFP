-- CreateTable
CREATE TABLE "UsuarioUnidade" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "unidadeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsuarioUnidade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioUnidade_usuarioId_unidadeId_key" ON "UsuarioUnidade"("usuarioId", "unidadeId");

-- AddForeignKey
ALTER TABLE "UsuarioUnidade" ADD CONSTRAINT "UsuarioUnidade_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioUnidade" ADD CONSTRAINT "UsuarioUnidade_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill: todo usuário que já tem uma unidadeId (ou seja, todos exceto
-- SUPERADMIN) ganha um vínculo correspondente na tabela nova, pra ela ser
-- a fonte única de verdade das unidades que cada usuário pode acessar.
INSERT INTO "UsuarioUnidade" ("usuarioId", "unidadeId")
SELECT "id", "unidadeId" FROM "Usuario" WHERE "unidadeId" IS NOT NULL;
