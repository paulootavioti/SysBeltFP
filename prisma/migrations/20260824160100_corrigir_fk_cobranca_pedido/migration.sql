ALTER TABLE "CobrancaPagamento" DROP CONSTRAINT "CobrancaPagamento_pedidoId_fkey";
ALTER TABLE "CobrancaPagamento"
  ADD CONSTRAINT "CobrancaPagamento_pedidoId_fkey"
  FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
