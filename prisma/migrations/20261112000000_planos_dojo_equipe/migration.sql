-- Expansão compatível: planos e faturas existentes permanecem intactos.
CREATE TYPE "TipoCobrancaPlataforma" AS ENUM ('FAIXA_ALUNOS', 'FIXO_MENSAL');

ALTER TABLE "PlanoPlataforma"
  ADD COLUMN "tipoCobranca" "TipoCobrancaPlataforma" NOT NULL DEFAULT 'FAIXA_ALUNOS',
  ADD COLUMN "precoFixoCentavos" INTEGER;

-- Catálogo idempotente. Os planos antigos seguem referenciáveis por
-- assinaturas/faturas, mas deixam de ser oferecidos a novas contratações.
UPDATE "PlanoPlataforma"
SET "ativo" = false
WHERE "nome" NOT IN ('Dojô', 'Equipe');

INSERT INTO "PlanoPlataforma"
  ("nome", "descricao", "alunosPorBloco", "precoPorBlocoCentavos", "blocosMinimos", "tipoCobranca", "precoFixoCentavos", "recursos", "ativo", "createdAt", "updatedAt")
VALUES
  ('Dojô', 'Funções básicas para a gestão da academia.', 1, 0, 0, 'FIXO_MENSAL', 9700, ARRAY[]::TEXT[], true, NOW(), NOW()),
  ('Equipe', 'Tudo do Dojô, mais SDR para WhatsApp, Tráfego e Social Media.', 1, 0, 0, 'FIXO_MENSAL', 157000, ARRAY['SDR_WHATSAPP', 'TRAFEGO', 'SOCIAL_MEDIA']::TEXT[], true, NOW(), NOW())
ON CONFLICT ("nome") DO UPDATE SET
  "descricao" = EXCLUDED."descricao",
  "tipoCobranca" = EXCLUDED."tipoCobranca",
  "precoFixoCentavos" = EXCLUDED."precoFixoCentavos",
  "recursos" = EXCLUDED."recursos",
  "ativo" = true,
  "updatedAt" = NOW();
