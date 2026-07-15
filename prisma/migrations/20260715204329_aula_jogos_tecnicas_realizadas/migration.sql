-- AlterTable
ALTER TABLE "Aula" ADD COLUMN     "jogosRealizados" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "_AulaTecnicasRealizadas" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AulaTecnicasRealizadas_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_AulaTecnicasRealizadas_B_index" ON "_AulaTecnicasRealizadas"("B");

-- AddForeignKey
ALTER TABLE "_AulaTecnicasRealizadas" ADD CONSTRAINT "_AulaTecnicasRealizadas_A_fkey" FOREIGN KEY ("A") REFERENCES "Aula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AulaTecnicasRealizadas" ADD CONSTRAINT "_AulaTecnicasRealizadas_B_fkey" FOREIGN KEY ("B") REFERENCES "TecnicaCurriculo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
