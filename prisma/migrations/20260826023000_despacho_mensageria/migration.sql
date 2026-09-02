ALTER TABLE "MensagemMensageria" ADD COLUMN "provedorMensagemId" TEXT;
ALTER TABLE "MensagemMensageria" ADD COLUMN "erroEnvio" TEXT;
CREATE INDEX "MensagemMensageria_provedorMensagemId_idx" ON "MensagemMensageria"("provedorMensagemId");
