import test from "node:test";
import assert from "node:assert/strict";
import { avaliarFronteiraTenant } from "./auditarFronteiraTenant.mjs";

test("aprova varias contas quando as fronteiras estao integras", () => {
  const resultado = avaliarFronteiraTenant({ totalContas: 3, contasSemUnidade: 0, usuariosComVinculosMultiplasContas: 0, concessoesDivergentes: 0, superadminsAtivos: 0 });
  assert.equal(resultado.isolamentoIntegro, true);
  assert.deepEqual(resultado.bloqueios, []);
});

test("lista riscos sem expor identificadores", () => {
  const resultado = avaliarFronteiraTenant({ totalContas: 2, contasSemUnidade: 1, usuariosComVinculosMultiplasContas: 2, concessoesDivergentes: 1, superadminsAtivos: 1 });
  assert.equal(resultado.isolamentoIntegro, false);
  assert.deepEqual(resultado.bloqueios, ["CONTA_SEM_UNIDADE", "USUARIO_ATRAVESSA_CONTAS", "CONCESSAO_DIVERGE_DA_CONTA", "SUPERADMIN_ATIVO"]);
});
