-- CreateTable
CREATE TABLE "NotaAula" (
    "id" SERIAL NOT NULL,
    "aulaId" INTEGER NOT NULL,
    "alunoId" INTEGER NOT NULL,
    "tag" TEXT,
    "texto" TEXT,
    "criadoPorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotaAula_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "NotaAula" ADD CONSTRAINT "NotaAula_aulaId_fkey" FOREIGN KEY ("aulaId") REFERENCES "Aula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotaAula" ADD CONSTRAINT "NotaAula_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotaAula" ADD CONSTRAINT "NotaAula_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
