CREATE TYPE "AcaoComandoVoz" AS ENUM ('INICIAR', 'PAUSAR', 'AVANCAR', 'CONSULTAR', 'BLOCO_PAUSA');

CREATE TABLE "ComandoVoz" (
  "id" SERIAL NOT NULL,
  "contaId" INTEGER NOT NULL,
  "gatilho" TEXT NOT NULL,
  "resposta" TEXT NOT NULL,
  "acao" "AcaoComandoVoz" NOT NULL,
  "duracaoBlocoSegundos" INTEGER,
  "avisoAntesFimSegundos" INTEGER,
  "doSistema" BOOLEAN NOT NULL DEFAULT false,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ComandoVoz_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PareamentoVozArena" (
  "id" SERIAL NOT NULL,
  "arenaId" INTEGER NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "versaoConsentimento" TEXT NOT NULL,
  "textoConsentimento" TEXT NOT NULL,
  "consentidoPorId" INTEGER NOT NULL,
  "ip" TEXT,
  "dispositivo" TEXT,
  "consentidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revogadoEm" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PareamentoVozArena_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ComandoVoz_contaId_gatilho_key" ON "ComandoVoz"("contaId", "gatilho");
CREATE INDEX "ComandoVoz_contaId_ativo_idx" ON "ComandoVoz"("contaId", "ativo");
CREATE UNIQUE INDEX "PareamentoVozArena_arenaId_key" ON "PareamentoVozArena"("arenaId");
CREATE UNIQUE INDEX "PareamentoVozArena_tokenHash_key" ON "PareamentoVozArena"("tokenHash");
ALTER TABLE "ComandoVoz" ADD CONSTRAINT "ComandoVoz_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "Conta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PareamentoVozArena" ADD CONSTRAINT "PareamentoVozArena_arenaId_fkey" FOREIGN KEY ("arenaId") REFERENCES "Arena"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PareamentoVozArena" ADD CONSTRAINT "PareamentoVozArena_consentidoPorId_fkey" FOREIGN KEY ("consentidoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
