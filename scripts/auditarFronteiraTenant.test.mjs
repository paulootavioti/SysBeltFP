import test from "node:test";
import assert from "node:assert/strict";

import { avaliarFronteiraTenant } from "./auditarFronteiraTenant.mjs";

test("aprova somente um banco com uma conta, unidades locais e nenhum superadmin ativo", () => {
  assert.deepEqual(
    avaliarFronteiraTenant({
      totalContas: 1,
      unidadesPorConta: [{ totalUnidades: 3 }],
      superadminsAtivos: 0,
    }),
    {
      prontaParaRemoverConta: true,
      totalContas: 1,
      totalUnidades: 3,
      contasComUnidades: 1,
      superadminsAtivos: 0,
      bloqueios: [],
    },
  );
});

test("lista todos os bloqueios sem expor nomes ou identificadores", () => {
  const resultado = avaliarFronteiraTenant({
    totalContas: 2,
    unidadesPorConta: [{ totalUnidades: 1 }, { totalUnidades: 2 }],
    superadminsAtivos: 1,
  });
  assert.equal(resultado.prontaParaRemoverConta, false);
  assert.deepEqual(resultado.bloqueios, [
    "TOTAL_CONTAS_DIFERENTE_DE_UM",
    "UNIDADES_FORA_DE_UMA_UNICA_CONTA",
    "SUPERADMIN_ATIVO_NO_TENANT",
  ]);
  assert.deepEqual(Object.keys(resultado).sort(), [
    "bloqueios",
    "contasComUnidades",
    "prontaParaRemoverConta",
    "superadminsAtivos",
    "totalContas",
    "totalUnidades",
  ]);
});
