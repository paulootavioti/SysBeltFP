DROP TABLE IF EXISTS "BotSessao", "BotFluxo";
ALTER TABLE "LeadConsentimento" DROP COLUMN IF EXISTS "canalMensageriaId";
-- PostgreSQL não remove valores de enum de forma segura. O rollback preserva
-- os três valores adicionados, que são inertes sem as tabelas do motor.
