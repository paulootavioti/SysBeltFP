ALTER TYPE "EstadoConversaMensageria" ADD VALUE 'BOT_EM_ANDAMENTO';
ALTER TYPE "EstadoConversaMensageria" ADD VALUE 'AGUARDANDO_EQUIPE';
ALTER TYPE "TipoConteudoMensageria" ADD VALUE 'BOTAO';

CREATE TABLE "BotFluxo" (
  "id" SERIAL NOT NULL,
  "unidadeId" INTEGER NOT NULL,
  "nome" TEXT NOT NULL,
  "versao" TEXT NOT NULL,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "passos" JSONB NOT NULL,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BotFluxo_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BotSessao" (
  "id" SERIAL NOT NULL,
  "conversaId" INTEGER NOT NULL,
  "botFluxoId" INTEGER NOT NULL,
  "passoAtual" TEXT NOT NULL,
  "respostas" JSONB NOT NULL,
  "expiraEm" TIMESTAMP(3) NOT NULL,
  "lembreteEm" TIMESTAMP(3),
  "finalizadoEm" TIMESTAMP(3),
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BotSessao_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BotFluxo_unidadeId_nome_versao_key" ON "BotFluxo"("unidadeId", "nome", "versao");
CREATE INDEX "BotFluxo_unidadeId_ativo_idx" ON "BotFluxo"("unidadeId", "ativo");
CREATE INDEX "BotSessao_conversaId_finalizadoEm_idx" ON "BotSessao"("conversaId", "finalizadoEm");
CREATE INDEX "BotSessao_expiraEm_finalizadoEm_idx" ON "BotSessao"("expiraEm", "finalizadoEm");
ALTER TABLE "BotFluxo" ADD CONSTRAINT "BotFluxo_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BotSessao" ADD CONSTRAINT "BotSessao_conversaId_fkey" FOREIGN KEY ("conversaId") REFERENCES "ConversaMensageria"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BotSessao" ADD CONSTRAINT "BotSessao_botFluxoId_fkey" FOREIGN KEY ("botFluxoId") REFERENCES "BotFluxo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "LeadConsentimento" ADD COLUMN "canalMensageriaId" INTEGER;
CREATE INDEX "LeadConsentimento_canalMensageriaId_aceitoEm_idx" ON "LeadConsentimento"("canalMensageriaId", "aceitoEm");
ALTER TABLE "LeadConsentimento" ADD CONSTRAINT "LeadConsentimento_canalMensageriaId_fkey" FOREIGN KEY ("canalMensageriaId") REFERENCES "CanalMensageria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "BotFluxo" ("unidadeId", "nome", "versao", "passos")
SELECT "id", 'Captação padrão', '1.0.0',
  '[{"id":"NOME","tipo":"TEXTO_LIVRE","campo":"nome"},{"id":"PARA_QUEM","tipo":"BOTOES","campo":"tipoContato"},{"id":"SITUACAO","tipo":"BOTOES","campo":"situacao"},{"id":"TURNO","tipo":"BOTOES","campo":"turnoPreferido"},{"id":"TELEFONE_INSTAGRAM","tipo":"CONDICIONAL","campo":"telefoneE164"},{"id":"CONSENTIMENTO","tipo":"BOTOES","campo":"consentimento"},{"id":"TRANSFERENCIA","tipo":"AUTOMATICO"}]'::jsonb
FROM "Unidade";
