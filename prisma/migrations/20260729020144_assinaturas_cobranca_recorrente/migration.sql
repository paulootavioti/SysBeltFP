-- CreateEnum
CREATE TYPE "StatusAssinatura" AS ENUM ('ATIVA', 'PAUSADA', 'CANCELADA', 'CONCLUIDA');

-- AlterTable
ALTER TABLE "Mensalidade" ADD COLUMN     "assinaturaId" INTEGER;

-- CreateTable
CREATE TABLE "Assinatura" (
    "id" SERIAL NOT NULL,
    "unidadeId" INTEGER NOT NULL,
    "alunoId" INTEGER NOT NULL,
    "planoId" INTEGER,
    "formaPagamentoId" INTEGER,
    "valor" DOUBLE PRECISION NOT NULL,
    "diaVencimento" INTEGER NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "indeterminado" BOOLEAN NOT NULL DEFAULT true,
    "numeroParcelas" INTEGER,
    "parcelasGeradas" INTEGER NOT NULL DEFAULT 0,
    "desconto" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "acrescimo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "multa" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "juros" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "descontoPontualidade" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "StatusAssinatura" NOT NULL DEFAULT 'ATIVA',
    "ultimaCobrancaGeradaEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Assinatura_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Mensalidade" ADD CONSTRAINT "Mensalidade_assinaturaId_fkey" FOREIGN KEY ("assinaturaId") REFERENCES "Assinatura"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assinatura" ADD CONSTRAINT "Assinatura_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assinatura" ADD CONSTRAINT "Assinatura_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assinatura" ADD CONSTRAINT "Assinatura_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "Plano"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assinatura" ADD CONSTRAINT "Assinatura_formaPagamentoId_fkey" FOREIGN KEY ("formaPagamentoId") REFERENCES "FormaPagamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;
