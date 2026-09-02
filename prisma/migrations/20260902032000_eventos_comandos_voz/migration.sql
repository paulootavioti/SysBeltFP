CREATE TABLE "EventoComandoVoz" (
  "id" SERIAL NOT NULL,
  "pareamentoId" INTEGER NOT NULL,
  "comandoId" INTEGER NOT NULL,
  "acao" "AcaoComandoVoz" NOT NULL,
  "duracaoBlocoSegundos" INTEGER,
  "avisoAntesFimSegundos" INTEGER,
  "consumidoEm" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventoComandoVoz_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "EventoComandoVoz_pareamentoId_consumidoEm_createdAt_idx" ON "EventoComandoVoz"("pareamentoId", "consumidoEm", "createdAt");
ALTER TABLE "EventoComandoVoz" ADD CONSTRAINT "EventoComandoVoz_pareamentoId_fkey" FOREIGN KEY ("pareamentoId") REFERENCES "PareamentoVozArena"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventoComandoVoz" ADD CONSTRAINT "EventoComandoVoz_comandoId_fkey" FOREIGN KEY ("comandoId") REFERENCES "ComandoVoz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
