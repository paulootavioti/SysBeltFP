-- AlterTable
ALTER TABLE "Aluno" ADD COLUMN     "senhaPortal" TEXT;

-- AlterTable
ALTER TABLE "Responsavel" ADD COLUMN     "senhaPortal" TEXT;

-- CreateTable
CREATE TABLE "MensagemFamilia" (
    "id" SERIAL NOT NULL,
    "unidadeId" INTEGER NOT NULL,
    "alunoId" INTEGER NOT NULL,
    "remetenteTipo" TEXT NOT NULL,
    "remetenteNome" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MensagemFamilia_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MensagemFamilia" ADD CONSTRAINT "MensagemFamilia_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensagemFamilia" ADD CONSTRAINT "MensagemFamilia_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
