-- CreateEnum
CREATE TYPE "SituacaoContrato" AS ENUM ('RASCUNHO', 'PENDENTE_ASSINATURA', 'ASSINADO', 'ATIVO', 'SUSPENSO', 'CANCELADO', 'ENCERRADO', 'RENOVADO');

-- CreateEnum
CREATE TYPE "TipoAssinaturaContrato" AS ENUM ('DIGITAL', 'ELETRONICA', 'PRESENCIAL');

-- CreateTable
CREATE TABLE "ModeloContrato" (
    "id" SERIAL NOT NULL,
    "unidadeId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "modeloOrigemId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModeloContrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contrato" (
    "id" SERIAL NOT NULL,
    "unidadeId" INTEGER NOT NULL,
    "numero" INTEGER NOT NULL,
    "alunoId" INTEGER NOT NULL,
    "contratanteResponsavelId" INTEGER,
    "modeloContratoId" INTEGER NOT NULL,
    "planoId" INTEGER,
    "formaPagamentoId" INTEGER,
    "valor" DOUBLE PRECISION NOT NULL,
    "dataInicioVigencia" TIMESTAMP(3) NOT NULL,
    "dataFimVigencia" TIMESTAMP(3),
    "regrasCancelamento" TEXT,
    "clausulas" TEXT,
    "conteudoGerado" TEXT NOT NULL,
    "situacao" "SituacaoContrato" NOT NULL DEFAULT 'RASCUNHO',
    "tipoAssinatura" "TipoAssinaturaContrato",
    "assinadoEm" TIMESTAMP(3),
    "contratoAssinadoUrl" TEXT,
    "renovacaoAutomatica" BOOLEAN NOT NULL DEFAULT false,
    "contratoAnteriorId" INTEGER,
    "canceladoEm" TIMESTAMP(3),
    "motivoCancelamento" TEXT,
    "encerradoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contrato_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Contrato_unidadeId_numero_key" ON "Contrato"("unidadeId", "numero");

-- AddForeignKey
ALTER TABLE "ModeloContrato" ADD CONSTRAINT "ModeloContrato_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModeloContrato" ADD CONSTRAINT "ModeloContrato_modeloOrigemId_fkey" FOREIGN KEY ("modeloOrigemId") REFERENCES "ModeloContrato"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_contratanteResponsavelId_fkey" FOREIGN KEY ("contratanteResponsavelId") REFERENCES "Responsavel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_modeloContratoId_fkey" FOREIGN KEY ("modeloContratoId") REFERENCES "ModeloContrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "Plano"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_formaPagamentoId_fkey" FOREIGN KEY ("formaPagamentoId") REFERENCES "FormaPagamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_contratoAnteriorId_fkey" FOREIGN KEY ("contratoAnteriorId") REFERENCES "Contrato"("id") ON DELETE SET NULL ON UPDATE CASCADE;
