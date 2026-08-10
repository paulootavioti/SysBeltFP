-- Preserva o que o cliente atual já usava, agora que o WhatsApp virou
-- recurso de plano.
--
-- A migração anterior criou o plano "Essencial" com recursos vazios e
-- apontou a conta existente pra ele. Ligar a checagem de recurso assim
-- derrubaria o WhatsApp de quem já tinha — regressão em produção causada
-- por mudança de modelo comercial, não por decisão de ninguém.
--
-- Em vez de dar WhatsApp a todo mundo (o que estragaria a venda do plano
-- premium), cria-se um plano LEGADO com o recurso e move-se pra ele só
-- quem já existia. "Essencial" segue como está pra assinante novo.

INSERT INTO "PlanoPlataforma" ("nome", "descricao", "alunosPorBloco", "precoPorBlocoCentavos", "blocosMinimos", "recursos", "ativo")
SELECT
    'Essencial (legado)',
    'Mesma faixa do Essencial, com o WhatsApp que a academia já usava antes de ele virar recurso de plano. Não oferecido a assinantes novos.',
    p."alunosPorBloco",
    p."precoPorBlocoCentavos",
    p."blocosMinimos",
    ARRAY['WHATSAPP']::TEXT[],
    -- inativo: não aparece pra contratação, existe só pra honrar o que já
    -- estava valendo.
    false
FROM "PlanoPlataforma" p
WHERE p."nome" = 'Essencial'
  AND EXISTS (SELECT 1 FROM "AssinaturaPlataforma" a WHERE a."planoId" = p."id");

UPDATE "AssinaturaPlataforma" a
SET "planoId" = (SELECT "id" FROM "PlanoPlataforma" WHERE "nome" = 'Essencial (legado)')
WHERE EXISTS (SELECT 1 FROM "PlanoPlataforma" WHERE "nome" = 'Essencial (legado)')
  AND a."planoId" = (SELECT "id" FROM "PlanoPlataforma" WHERE "nome" = 'Essencial');
