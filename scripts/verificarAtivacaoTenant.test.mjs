import test from "node:test";
import assert from "node:assert/strict";

import { validarReadinessTenant } from "./verificarAtivacaoTenant.mjs";

const base = {
  service: "tenant-resolution",
  configuracaoValida: true,
  awsConfigurada: true,
  prontaParaAtivar: true,
};

test("aceita cada fase somente no estado correspondente", () => {
  assert.doesNotThrow(() => validarReadinessTenant({ ...base, status: "legacy", habilitada: false, obrigatoria: false }, "configuracao"));
  assert.doesNotThrow(() => validarReadinessTenant({ ...base, status: "ready", habilitada: true, obrigatoria: false }, "habilitada"));
  assert.doesNotThrow(() => validarReadinessTenant({ ...base, status: "ready", habilitada: true, obrigatoria: true }, "obrigatoria"));
});

test("falha fechado em configuração incompleta ou sequência incorreta", () => {
  assert.throws(() => validarReadinessTenant({ ...base, prontaParaAtivar: false }, "configuracao"), /incompleta/);
  assert.throws(() => validarReadinessTenant({ ...base, status: "ready", habilitada: true, obrigatoria: true }, "habilitada"), /REQUIRED/);
  assert.throws(() => validarReadinessTenant({ ...base, status: "legacy", habilitada: false, obrigatoria: false }, "obrigatoria"), /ENABLED/);
});
