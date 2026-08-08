-- CreateEnum
CREATE TYPE "StatusMensagemWhatsapp" AS ENUM ('PENDENTE', 'ENVIADA', 'ENTREGUE', 'LIDA', 'FALHOU', 'BLOQUEADA_SEM_CONSENTIMENTO');

-- CreateTable
CREATE TABLE "MensagemWhatsapp" (
    "id" SERIAL NOT NULL,
    "unidadeId" INTEGER NOT NULL,
    "alunoId" INTEGER,
    "responsavelId" INTEGER,
    "telefone" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "parametros" JSONB,
    "chaveIdempotencia" TEXT NOT NULL,
    "status" "StatusMensagemWhatsapp" NOT NULL DEFAULT 'PENDENTE',
    "provedorMensagemId" TEXT,
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "erro" TEXT,
    "enviadaEm" TIMESTAMP(3),
    "entregueEm" TIMESTAMP(3),
    "lidaEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MensagemWhatsapp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MensagemWhatsapp_chaveIdempotencia_key" ON "MensagemWhatsapp"("chaveIdempotencia");

-- CreateIndex
CREATE INDEX "MensagemWhatsapp_provedorMensagemId_idx" ON "MensagemWhatsapp"("provedorMensagemId");

-- CreateIndex
CREATE INDEX "MensagemWhatsapp_status_idx" ON "MensagemWhatsapp"("status");

-- AddForeignKey
ALTER TABLE "MensagemWhatsapp" ADD CONSTRAINT "MensagemWhatsapp_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensagemWhatsapp" ADD CONSTRAINT "MensagemWhatsapp_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MensagemWhatsapp" ADD CONSTRAINT "MensagemWhatsapp_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Responsavel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
