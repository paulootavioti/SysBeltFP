-- AlterTable
ALTER TABLE "Graduacao" ADD COLUMN     "comentario" TEXT,
ADD COLUMN     "motivoRejeicao" TEXT,
ADD COLUMN     "revisadoEm" TIMESTAMP(3),
ADD COLUMN     "revisadoPorId" INTEGER,
ADD COLUMN     "solicitadoPorId" INTEGER,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'aprovada';

-- AddForeignKey
ALTER TABLE "Graduacao" ADD CONSTRAINT "Graduacao_solicitadoPorId_fkey" FOREIGN KEY ("solicitadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Graduacao" ADD CONSTRAINT "Graduacao_revisadoPorId_fkey" FOREIGN KEY ("revisadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
