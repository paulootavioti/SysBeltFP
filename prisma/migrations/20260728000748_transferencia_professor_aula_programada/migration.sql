-- AlterTable
ALTER TABLE "AulaProgramada" ADD COLUMN     "motivoTransferencia" TEXT,
ADD COLUMN     "professorSubstitutoId" INTEGER;

-- AlterTable
ALTER TABLE "Turma" ALTER COLUMN "diasSemana" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "AulaProgramada" ADD CONSTRAINT "AulaProgramada_professorSubstitutoId_fkey" FOREIGN KEY ("professorSubstitutoId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
