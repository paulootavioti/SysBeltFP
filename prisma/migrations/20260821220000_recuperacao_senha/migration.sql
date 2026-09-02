CREATE TABLE "TokenRedefinicaoSenha" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "alvos" JSONB NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "usadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenRedefinicaoSenha_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TokenRedefinicaoSenha_tokenHash_key" ON "TokenRedefinicaoSenha"("tokenHash");
CREATE INDEX "TokenRedefinicaoSenha_email_tipo_createdAt_idx" ON "TokenRedefinicaoSenha"("email", "tipo", "createdAt");
CREATE INDEX "TokenRedefinicaoSenha_expiraEm_idx" ON "TokenRedefinicaoSenha"("expiraEm");
