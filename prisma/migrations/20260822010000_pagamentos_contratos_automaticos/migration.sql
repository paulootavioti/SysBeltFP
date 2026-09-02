CREATE TABLE "CobrancaPagamento" (
    "id" SERIAL NOT NULL,
    "unidadeId" INTEGER NOT NULL,
    "mensalidadeId" INTEGER NOT NULL,
    "formaPagamentoId" INTEGER,
    "gateway" TEXT NOT NULL,
    "gatewayId" TEXT,
    "chaveIdempotencia" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CRIANDO',
    "linkPagamento" TEXT,
    "pixCopiaECola" TEXT,
    "pixQrCodeBase64" TEXT,
    "expiraEm" TIMESTAMP(3),
    "numeroTentativa" INTEGER NOT NULL DEFAULT 1,
    "erro" TEXT,
    "consultadoEm" TIMESTAMP(3),
    "reconciliadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CobrancaPagamento_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Assinatura" ADD COLUMN "gatewayAssinaturaId" TEXT,
ADD COLUMN "gatewayStatus" TEXT,
ADD COLUMN "linkAutorizacao" TEXT,
ADD COLUMN "gatewayAtualizadoEm" TIMESTAMP(3);

CREATE TABLE "SolicitacaoAssinatura" (
    "id" SERIAL NOT NULL,
    "unidadeId" INTEGER NOT NULL,
    "contratoId" INTEGER NOT NULL,
    "provedor" TEXT NOT NULL,
    "provedorDocumentoId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ENVIANDO',
    "linkAssinatura" TEXT,
    "documentoAssinadoUrl" TEXT,
    "erro" TEXT,
    "enviadoEm" TIMESTAMP(3),
    "concluidoEm" TIMESTAMP(3),
    "canceladoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SolicitacaoAssinatura_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CobrancaPagamento_chaveIdempotencia_key" ON "CobrancaPagamento"("chaveIdempotencia");
CREATE UNIQUE INDEX "CobrancaPagamento_gateway_gatewayId_key" ON "CobrancaPagamento"("gateway", "gatewayId");
CREATE INDEX "CobrancaPagamento_unidadeId_status_idx" ON "CobrancaPagamento"("unidadeId", "status");
CREATE INDEX "CobrancaPagamento_mensalidadeId_createdAt_idx" ON "CobrancaPagamento"("mensalidadeId", "createdAt");
CREATE UNIQUE INDEX "SolicitacaoAssinatura_provedor_provedorDocumentoId_key" ON "SolicitacaoAssinatura"("provedor", "provedorDocumentoId");
CREATE INDEX "SolicitacaoAssinatura_unidadeId_status_idx" ON "SolicitacaoAssinatura"("unidadeId", "status");
CREATE INDEX "SolicitacaoAssinatura_contratoId_createdAt_idx" ON "SolicitacaoAssinatura"("contratoId", "createdAt");

ALTER TABLE "CobrancaPagamento" ADD CONSTRAINT "CobrancaPagamento_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CobrancaPagamento" ADD CONSTRAINT "CobrancaPagamento_mensalidadeId_fkey" FOREIGN KEY ("mensalidadeId") REFERENCES "Mensalidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CobrancaPagamento" ADD CONSTRAINT "CobrancaPagamento_formaPagamentoId_fkey" FOREIGN KEY ("formaPagamentoId") REFERENCES "FormaPagamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SolicitacaoAssinatura" ADD CONSTRAINT "SolicitacaoAssinatura_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SolicitacaoAssinatura" ADD CONSTRAINT "SolicitacaoAssinatura_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
