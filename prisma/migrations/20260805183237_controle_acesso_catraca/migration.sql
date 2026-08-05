-- CreateEnum
CREATE TYPE "TipoCredencialAcesso" AS ENUM ('FACIAL', 'BIOMETRIA', 'CARTAO', 'QRCODE', 'PIN');

-- CreateEnum
CREATE TYPE "SentidoAcesso" AS ENUM ('ENTRADA', 'SAIDA');

-- CreateTable
CREATE TABLE "DispositivoAcesso" (
    "id" SERIAL NOT NULL,
    "unidadeId" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "localizacao" TEXT,
    "provedor" TEXT,
    "configuracao" JSONB,
    "segredoWebhook" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoContatoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DispositivoAcesso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CredencialAcesso" (
    "id" SERIAL NOT NULL,
    "alunoId" INTEGER,
    "usuarioId" INTEGER,
    "dispositivoId" INTEGER,
    "tipo" "TipoCredencialAcesso" NOT NULL,
    "valor" TEXT,
    "provedorPessoaId" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "validoAte" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CredencialAcesso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoAcesso" (
    "id" SERIAL NOT NULL,
    "unidadeId" INTEGER NOT NULL,
    "dispositivoId" INTEGER,
    "credencialId" INTEGER,
    "alunoId" INTEGER,
    "usuarioId" INTEGER,
    "sentido" "SentidoAcesso" NOT NULL DEFAULT 'ENTRADA',
    "autorizado" BOOLEAN NOT NULL,
    "motivo" TEXT,
    "ocorridoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "provedorEventoId" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventoAcesso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DispositivoAcesso_unidadeId_idx" ON "DispositivoAcesso"("unidadeId");

-- CreateIndex
CREATE INDEX "CredencialAcesso_alunoId_idx" ON "CredencialAcesso"("alunoId");

-- CreateIndex
CREATE INDEX "CredencialAcesso_usuarioId_idx" ON "CredencialAcesso"("usuarioId");

-- CreateIndex
CREATE INDEX "CredencialAcesso_dispositivoId_idx" ON "CredencialAcesso"("dispositivoId");

-- CreateIndex
CREATE INDEX "EventoAcesso_unidadeId_ocorridoEm_idx" ON "EventoAcesso"("unidadeId", "ocorridoEm");

-- CreateIndex
CREATE INDEX "EventoAcesso_alunoId_idx" ON "EventoAcesso"("alunoId");

-- CreateIndex
CREATE UNIQUE INDEX "EventoAcesso_dispositivoId_provedorEventoId_key" ON "EventoAcesso"("dispositivoId", "provedorEventoId");

-- AddForeignKey
ALTER TABLE "DispositivoAcesso" ADD CONSTRAINT "DispositivoAcesso_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CredencialAcesso" ADD CONSTRAINT "CredencialAcesso_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CredencialAcesso" ADD CONSTRAINT "CredencialAcesso_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CredencialAcesso" ADD CONSTRAINT "CredencialAcesso_dispositivoId_fkey" FOREIGN KEY ("dispositivoId") REFERENCES "DispositivoAcesso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoAcesso" ADD CONSTRAINT "EventoAcesso_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoAcesso" ADD CONSTRAINT "EventoAcesso_dispositivoId_fkey" FOREIGN KEY ("dispositivoId") REFERENCES "DispositivoAcesso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoAcesso" ADD CONSTRAINT "EventoAcesso_credencialId_fkey" FOREIGN KEY ("credencialId") REFERENCES "CredencialAcesso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoAcesso" ADD CONSTRAINT "EventoAcesso_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoAcesso" ADD CONSTRAINT "EventoAcesso_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
