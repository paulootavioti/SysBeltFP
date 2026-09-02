-- Rollback compatível com os dados legados. Campos exclusivos do novo funil são perdidos.
ALTER TABLE "Lead" ADD COLUMN "contato" TEXT, ADD COLUMN "interesse" TEXT;
CREATE TYPE "StatusLead" AS ENUM ('NOVO', 'CONTACTADO', 'CONVERTIDO');
ALTER TABLE "Lead" ADD COLUMN "status" "StatusLead" NOT NULL DEFAULT 'NOVO';
UPDATE "Lead" SET "contato" = "telefoneE164", "interesse" = COALESCE("observacoes", ''), "status" = CASE WHEN "estagio" = 'MATRICULADO' THEN 'CONVERTIDO'::"StatusLead" WHEN "estagio" = 'CONTATADO' THEN 'CONTACTADO'::"StatusLead" ELSE 'NOVO'::"StatusLead" END;
ALTER TABLE "Lead" ALTER COLUMN "contato" SET NOT NULL, ALTER COLUMN "interesse" SET NOT NULL;
DROP TABLE "LeadConsentimento";
DROP TABLE "LeadEvento";
ALTER TABLE "Lead"
  DROP COLUMN "telefoneE164", DROP COLUMN "email", DROP COLUMN "tipoContato",
  DROP COLUMN "praticanteNome", DROP COLUMN "praticanteNascimento", DROP COLUMN "situacao",
  DROP COLUMN "turnoPreferido", DROP COLUMN "modalidadeInteresseId", DROP COLUMN "canalId",
  DROP COLUMN "campanhaId", DROP COLUMN "utmSource", DROP COLUMN "utmMedium",
  DROP COLUMN "utmCampaign", DROP COLUMN "referrer", DROP COLUMN "estagio",
  DROP COLUMN "responsavelUsuarioId", DROP COLUMN "proximaAcaoEm", DROP COLUMN "motivoPerda",
  DROP COLUMN "alunoId", DROP COLUMN "observacoes", DROP COLUMN "atualizadoEm";
DROP TABLE "CanalCaptacao";
DROP TYPE "FinalidadeConsentimentoLead";
DROP TYPE "SituacaoLead";
DROP TYPE "TipoContatoLead";
DROP TYPE "EstagioLead";
