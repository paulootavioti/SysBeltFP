CREATE TABLE "EventoAssinaturaEletronica" (
    "id" SERIAL NOT NULL,
    "solicitacaoId" INTEGER NOT NULL,
    "eventoExternoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processadoEm" TIMESTAMP(3),
    "resultado" TEXT,
    "erro" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventoAssinaturaEletronica_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "EventoAssinaturaEletronica_eventoExternoId_key" ON "EventoAssinaturaEletronica"("eventoExternoId");
CREATE INDEX "EventoAssinaturaEletronica_solicitacaoId_createdAt_idx" ON "EventoAssinaturaEletronica"("solicitacaoId", "createdAt");
ALTER TABLE "EventoAssinaturaEletronica" ADD CONSTRAINT "EventoAssinaturaEletronica_solicitacaoId_fkey" FOREIGN KEY ("solicitacaoId") REFERENCES "SolicitacaoAssinatura"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
