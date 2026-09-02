CREATE TYPE "EstagioLead" AS ENUM ('NOVO', 'CONTATADO', 'QUALIFICADO', 'EXPERIMENTAL_AGENDADA', 'COMPARECEU', 'NEGOCIACAO', 'MATRICULADO', 'PERDIDO');
CREATE TYPE "TipoContatoLead" AS ENUM ('PRATICANTE', 'RESPONSAVEL');
CREATE TYPE "SituacaoLead" AS ENUM ('NUNCA_TREINOU', 'TREINA_EM_OUTRA', 'EX_ALUNO', 'ALUNO_ATUAL');
CREATE TYPE "FinalidadeConsentimentoLead" AS ENUM ('TRATAMENTO_DADOS', 'COMUNICACOES');

CREATE TABLE "CanalCaptacao" (
  "id" SERIAL NOT NULL,
  "unidadeId" INTEGER NOT NULL,
  "nome" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "ativo" BOOLEAN NOT NULL DEFAULT true,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CanalCaptacao_pkey" PRIMARY KEY ("id")
);

INSERT INTO "CanalCaptacao" ("unidadeId", "nome", "slug")
SELECT DISTINCT "unidadeId", 'Landing page legada', 'legado-' || "unidadeId"::text
FROM "Lead";

ALTER TABLE "Lead"
  ADD COLUMN "telefoneE164" TEXT,
  ADD COLUMN "email" TEXT,
  ADD COLUMN "tipoContato" "TipoContatoLead" NOT NULL DEFAULT 'PRATICANTE',
  ADD COLUMN "praticanteNome" TEXT,
  ADD COLUMN "praticanteNascimento" TIMESTAMP(3),
  ADD COLUMN "situacao" "SituacaoLead" NOT NULL DEFAULT 'NUNCA_TREINOU',
  ADD COLUMN "turnoPreferido" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "modalidadeInteresseId" INTEGER,
  ADD COLUMN "canalId" INTEGER,
  ADD COLUMN "campanhaId" INTEGER,
  ADD COLUMN "utmSource" TEXT,
  ADD COLUMN "utmMedium" TEXT,
  ADD COLUMN "utmCampaign" TEXT,
  ADD COLUMN "referrer" TEXT,
  ADD COLUMN "estagio" "EstagioLead" NOT NULL DEFAULT 'NOVO',
  ADD COLUMN "responsavelUsuarioId" INTEGER,
  ADD COLUMN "proximaAcaoEm" TIMESTAMP(3),
  ADD COLUMN "motivoPerda" TEXT,
  ADD COLUMN "alunoId" INTEGER,
  ADD COLUMN "observacoes" TEXT,
  ADD COLUMN "atualizadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Lead" l SET
  "telefoneE164" = CASE
    WHEN length(regexp_replace(l."contato", '\D', '', 'g')) IN (10, 11)
      THEN '55' || regexp_replace(l."contato", '\D', '', 'g')
    WHEN length(regexp_replace(l."contato", '\D', '', 'g')) IN (12, 13)
      AND regexp_replace(l."contato", '\D', '', 'g') LIKE '55%'
      THEN regexp_replace(l."contato", '\D', '', 'g')
    ELSE 'legacy-' || l."id"::text
  END,
  "canalId" = c."id",
  "estagio" = CASE l."status"::text
    WHEN 'CONTACTADO' THEN 'CONTATADO'::"EstagioLead"
    WHEN 'CONVERTIDO' THEN 'MATRICULADO'::"EstagioLead"
    ELSE 'NOVO'::"EstagioLead"
  END,
  "observacoes" = CASE WHEN l."interesse" <> '' THEN 'Interesse legado: ' || l."interesse" ELSE NULL END,
  "proximaAcaoEm" = CASE WHEN l."status"::text = 'NOVO' THEN l."criadoEm" + INTERVAL '15 minutes' ELSE NULL END
FROM "CanalCaptacao" c
WHERE c."unidadeId" = l."unidadeId" AND c."nome" = 'Landing page legada';

ALTER TABLE "Lead" ALTER COLUMN "telefoneE164" SET NOT NULL;
ALTER TABLE "Lead" ALTER COLUMN "canalId" SET NOT NULL;
ALTER TABLE "Lead" DROP COLUMN "contato", DROP COLUMN "interesse", DROP COLUMN "status";
DROP TYPE "StatusLead";

CREATE TABLE "LeadEvento" (
  "id" SERIAL NOT NULL,
  "leadId" INTEGER NOT NULL,
  "unidadeId" INTEGER NOT NULL,
  "tipo" TEXT NOT NULL,
  "descricao" TEXT NOT NULL,
  "usuarioId" INTEGER,
  "payload" JSONB,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LeadEvento_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LeadConsentimento" (
  "id" SERIAL NOT NULL,
  "leadId" INTEGER NOT NULL,
  "finalidade" "FinalidadeConsentimentoLead" NOT NULL,
  "textoAceito" TEXT NOT NULL,
  "versao" TEXT NOT NULL,
  "ip" TEXT,
  "userAgent" TEXT,
  "aceitoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revogadoEm" TIMESTAMP(3),
  CONSTRAINT "LeadConsentimento_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CanalCaptacao_slug_key" ON "CanalCaptacao"("slug");
CREATE UNIQUE INDEX "CanalCaptacao_unidadeId_nome_key" ON "CanalCaptacao"("unidadeId", "nome");
CREATE INDEX "CanalCaptacao_unidadeId_ativo_idx" ON "CanalCaptacao"("unidadeId", "ativo");
CREATE UNIQUE INDEX "Lead_unidadeId_telefoneE164_key" ON "Lead"("unidadeId", "telefoneE164");
CREATE INDEX "Lead_telefoneE164_idx" ON "Lead"("telefoneE164");
CREATE INDEX "Lead_unidadeId_estagio_proximaAcaoEm_idx" ON "Lead"("unidadeId", "estagio", "proximaAcaoEm");
CREATE INDEX "Lead_canalId_criadoEm_idx" ON "Lead"("canalId", "criadoEm");
CREATE INDEX "Lead_campanhaId_criadoEm_idx" ON "Lead"("campanhaId", "criadoEm");
CREATE INDEX "LeadEvento_leadId_criadoEm_idx" ON "LeadEvento"("leadId", "criadoEm");
CREATE INDEX "LeadEvento_unidadeId_criadoEm_idx" ON "LeadEvento"("unidadeId", "criadoEm");
CREATE INDEX "LeadConsentimento_leadId_finalidade_aceitoEm_idx" ON "LeadConsentimento"("leadId", "finalidade", "aceitoEm");

ALTER TABLE "CanalCaptacao" ADD CONSTRAINT "CanalCaptacao_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_modalidadeInteresseId_fkey" FOREIGN KEY ("modalidadeInteresseId") REFERENCES "Modalidade"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_canalId_fkey" FOREIGN KEY ("canalId") REFERENCES "CanalCaptacao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_campanhaId_fkey" FOREIGN KEY ("campanhaId") REFERENCES "Evento"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_responsavelUsuarioId_fkey" FOREIGN KEY ("responsavelUsuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_alunoId_fkey" FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LeadEvento" ADD CONSTRAINT "LeadEvento_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeadEvento" ADD CONSTRAINT "LeadEvento_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LeadEvento" ADD CONSTRAINT "LeadEvento_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LeadConsentimento" ADD CONSTRAINT "LeadConsentimento_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

