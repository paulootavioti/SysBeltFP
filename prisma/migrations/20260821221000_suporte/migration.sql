CREATE TABLE "SolicitacaoSuporte" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "usuarioNome" TEXT NOT NULL,
    "usuarioEmail" TEXT NOT NULL,
    "unidadeId" INTEGER,
    "mensagem" TEXT NOT NULL,
    "contexto" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvidaEm" TIMESTAMP(3),

    CONSTRAINT "SolicitacaoSuporte_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SolicitacaoSuporte_status_createdAt_idx" ON "SolicitacaoSuporte"("status", "createdAt");
CREATE INDEX "SolicitacaoSuporte_usuarioId_createdAt_idx" ON "SolicitacaoSuporte"("usuarioId", "createdAt");
