-- CreateEnum
CREATE TYPE "StatusMensalidade" AS ENUM ('ABERTA', 'PAGA', 'VENCIDA', 'CANCELADA', 'ESTORNADA');

-- CreateEnum
CREATE TYPE "TipoFormaPagamento" AS ENUM ('PIX', 'PIX_RECORRENTE', 'CARTAO_CREDITO_VISTA', 'CARTAO_CREDITO_PARCELADO', 'CARTAO_CREDITO_RECORRENTE', 'CARTAO_DEBITO', 'TRANSFERENCIA', 'DINHEIRO', 'BOLETO', 'LINK_PAGAMENTO', 'OUTRO');

-- AlterTable
ALTER TABLE "Mensalidade" ADD COLUMN     "acrescimo" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "canceladoEm" TIMESTAMP(3),
ADD COLUMN     "comprovanteUrl" TEXT,
ADD COLUMN     "dataGeracao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "desconto" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "estornadoEm" TIMESTAMP(3),
ADD COLUMN     "formaPagamentoId" INTEGER,
ADD COLUMN     "juros" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "motivoCancelamento" TEXT,
ADD COLUMN     "motivoEstorno" TEXT,
ADD COLUMN     "multa" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "status" "StatusMensalidade" NOT NULL DEFAULT 'ABERTA',
ADD COLUMN     "valorFinal" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "valorOriginal" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "FormaPagamento" (
    "id" SERIAL NOT NULL,
    "unidadeId" INTEGER NOT NULL,
    "tipo" "TipoFormaPagamento" NOT NULL,
    "nomePersonalizado" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "configuracao" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormaPagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "unidadeId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" INTEGER NOT NULL,
    "operacao" TEXT NOT NULL,
    "valoresAntes" JSONB,
    "valoresDepois" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_entidade_entidadeId_idx" ON "AuditLog"("entidade", "entidadeId");

-- AddForeignKey
ALTER TABLE "FormaPagamento" ADD CONSTRAINT "FormaPagamento_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mensalidade" ADD CONSTRAINT "Mensalidade_formaPagamentoId_fkey" FOREIGN KEY ("formaPagamentoId") REFERENCES "FormaPagamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;
