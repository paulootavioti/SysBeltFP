-- CreateTable
CREATE TABLE "EventoWebhookPagamento" (
    "id" SERIAL NOT NULL,
    "gateway" TEXT NOT NULL,
    "eventoExternoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "recursoId" TEXT,
    "payload" JSONB NOT NULL,
    "processadoEm" TIMESTAMP(3),
    "resultado" TEXT,
    "erro" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventoWebhookPagamento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventoWebhookPagamento_recursoId_idx" ON "EventoWebhookPagamento"("recursoId");

-- CreateIndex
CREATE UNIQUE INDEX "EventoWebhookPagamento_gateway_eventoExternoId_key" ON "EventoWebhookPagamento"("gateway", "eventoExternoId");
