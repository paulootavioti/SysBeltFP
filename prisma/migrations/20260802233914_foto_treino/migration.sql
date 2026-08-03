-- AlterTable
ALTER TABLE "Aluno" ADD COLUMN     "autorizaUsoImagem" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "FotoTreino" (
    "id" SERIAL NOT NULL,
    "aulaId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "legenda" TEXT NOT NULL,
    "publicadaPorId" INTEGER NOT NULL,
    "publicadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visivelNaLanding" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FotoTreino_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FotoTreino" ADD CONSTRAINT "FotoTreino_aulaId_fkey" FOREIGN KEY ("aulaId") REFERENCES "Aula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FotoTreino" ADD CONSTRAINT "FotoTreino_publicadaPorId_fkey" FOREIGN KEY ("publicadaPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
