-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_usuarioId_fkey";

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "origemSistema" TEXT,
ALTER COLUMN "usuarioId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
