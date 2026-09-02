ALTER TYPE "StatusPedido" ADD VALUE 'AGUARDANDO_PAGAMENTO' BEFORE 'AGUARDANDO_RETIRADA';

ALTER TABLE "CobrancaPagamento" ALTER COLUMN "mensalidadeId" DROP NOT NULL;
ALTER TABLE "CobrancaPagamento" ADD COLUMN "pedidoId" INTEGER;

ALTER TABLE "Pedido" ADD COLUMN "formaPagamentoId" INTEGER;
ALTER TABLE "Pedido" ADD COLUMN "pagoEm" TIMESTAMP(3);
ALTER TABLE "Pedido" ADD COLUMN "canceladoEm" TIMESTAMP(3);

ALTER TABLE "CobrancaPagamento"
  ADD CONSTRAINT "CobrancaPagamento_pedidoId_fkey"
  FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Pedido"
  ADD CONSTRAINT "Pedido_formaPagamentoId_fkey"
  FOREIGN KEY ("formaPagamentoId") REFERENCES "FormaPagamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "CobrancaPagamento_pedidoId_createdAt_idx" ON "CobrancaPagamento"("pedidoId", "createdAt");

ALTER TABLE "CobrancaPagamento" ADD CONSTRAINT "CobrancaPagamento_origem_check"
  CHECK (("mensalidadeId" IS NOT NULL)::int + ("pedidoId" IS NOT NULL)::int = 1);
