-- Guarda a memória de cálculo por filial. Nullable preserva as faturas
-- emitidas antes da cobrança por unidade.
ALTER TABLE "FaturaPlataforma" ADD COLUMN "detalhamentoUnidades" JSONB;
