-- CreateEnum
CREATE TYPE "TipoConsentimento" AS ENUM ('USO_IMAGEM', 'BIOMETRIA', 'DADOS_SAUDE', 'COMUNICACOES');

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "dispositivo" TEXT,
ADD COLUMN     "ip" TEXT;

-- CreateTable
CREATE TABLE "Consentimento" (
    "id" SERIAL NOT NULL,
    "unidadeId" INTEGER NOT NULL,
    "alunoId" INTEGER NOT NULL,
    "tipo" "TipoConsentimento" NOT NULL,
    "responsavelId" INTEGER,
    "concedido" BOOLEAN NOT NULL,
    "versaoPolitica" TEXT NOT NULL,
    "registradoPorId" INTEGER,
    "ip" TEXT,
    "dispositivo" TEXT,
    "observacao" TEXT,
    "revogadoEm" TIMESTAMP(3),
    "revogadoPorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Consentimento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Consentimento_alunoId_tipo_idx" ON "Consentimento"("alunoId", "tipo");

-- AddForeignKey
ALTER TABLE "Consentimento" ADD CONSTRAINT "Consentimento_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consentimento" ADD CONSTRAINT "Consentimento_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consentimento" ADD CONSTRAINT "Consentimento_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Responsavel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consentimento" ADD CONSTRAINT "Consentimento_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consentimento" ADD CONSTRAINT "Consentimento_revogadoPorId_fkey" FOREIGN KEY ("revogadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- BACKFILL do consentimento de uso de imagem.
--
-- `Aluno.autorizaUsoImagem` já existia como booleano solto: guardava a
-- resposta, mas não quem respondeu, quando, de onde, nem a que texto.
-- Cada aluno ganha uma linha no livro de registro refletindo o estado
-- atual, marcada como migrada — é importante que fique explícito que
-- este registro NÃO é prova de coleta feita nos termos da LGPD, e sim o
-- ponto de partida. A academia deve recoletar o consentimento formal.
INSERT INTO "Consentimento"
  ("unidadeId", "alunoId", "tipo", "concedido", "versaoPolitica", "observacao", "createdAt")
SELECT
  a."unidadeId",
  a."id",
  'USO_IMAGEM',
  a."autorizaUsoImagem",
  'migracao-inicial',
  'Migrado do campo autorizaUsoImagem. Não há registro de quem consentiu, quando, nem de qual texto foi aceito — recoletar para valer como evidência.',
  a."createdAt"
FROM "Aluno" a;
